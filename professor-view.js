// ===============================================================
// professor-view.js - AMBIENTE DO PROFESSOR
// ===============================================================

async function loadProfessorData(professorUid) {
    const turmaSelect = document.getElementById('professor-turma-select');
    const { data: rels } = await safeQuery(db.from('professores_turmas').select('turma_id').eq('professor_id', professorUid));
    if (!rels || rels.length === 0) {
        turmaSelect.innerHTML = '<option value="">Nenhuma turma vinculada</option>';
        return;
    }
    const turmaIds = rels.map(r => r.turma_id);
    const { data } = await safeQuery(db.from('turmas').select('id, nome_turma').in('id', turmaIds));
    if (!data) return;
    turmaSelect.innerHTML = '<option value="">Selecione uma turma</option>';
    data.sort((a, b) => a.nome_turma.localeCompare(b.nome_turma, undefined, { numeric: true })).forEach(t => {
        turmaSelect.innerHTML += `<option value="${t.id}">${t.nome_turma}</option>`;
    });
}

async function loadChamada() {
    const tId = document.getElementById('professor-turma-select').value;
    const data = document.getElementById('professor-data-select').value;
    const container = document.getElementById('chamada-lista-alunos');
    const header = document.getElementById('chamada-header');
    const btn = document.getElementById('salvar-chamada-btn');

    if (!tId || !data) return;
    container.innerHTML = '<div class="loader mx-auto"></div>';

    const { data: alunos } = await safeQuery(db.from('alunos').select('id, nome_completo').eq('turma_id', tId).eq('status', 'ativo').order('nome_completo'));
    const { data: presencas } = await safeQuery(db.from('presencas').select('aluno_id, status').eq('turma_id', tId).eq('data', data));

    const presMap = new Map(presencas?.map(p => [p.aluno_id, p.status]));
    header.textContent = `Chamada para ${document.getElementById('professor-turma-select').options[document.getElementById('professor-turma-select').selectedIndex].text}`;
    container.innerHTML = '';

    alunos.forEach(aluno => {
        const status = presMap.get(aluno.id) || 'presente';
        const div = document.createElement('div');
        div.className = 'p-3 bg-gray-50 rounded-lg flex justify-between items-center';
        div.innerHTML = `
            <span class="font-medium">${aluno.nome_completo}</span>
            <div class="flex gap-4" data-aluno-id="${aluno.id}">
                <label class="flex items-center"><input type="radio" name="st-${aluno.id}" value="presente" class="status-radio" ${status === 'presente' ? 'checked' : ''}> <span class="ml-1 text-sm">Presente</span></label>
                <label class="flex items-center"><input type="radio" name="st-${aluno.id}" value="falta" class="status-radio" ${status === 'falta' ? 'checked' : ''}> <span class="ml-1 text-sm text-red-600">Falta</span></label>
            </div>`;
        container.appendChild(div);
    });
    btn.classList.remove('hidden');
}

async function saveChamada() {
    const btn = document.getElementById('salvar-chamada-btn');
    const tId = document.getElementById('professor-turma-select').value;
    const data = document.getElementById('professor-data-select').value;
    const alunoRows = document.querySelectorAll('#chamada-lista-alunos [data-aluno-id]');

    btn.disabled = true;
    btn.innerHTML = 'Salvando...';

    const registros = Array.from(alunoRows).map(row => ({
        aluno_id: parseInt(row.dataset.alunoId),
        turma_id: parseInt(tId),
        data: data,
        status: row.querySelector('input:checked').value,
        registrado_por_uid: currentUser.id
    }));

    const { error } = await safeQuery(db.from('presencas').upsert(registros, { onConflict: 'aluno_id, data' }));
    
    if (!error) showToast('Chamada salva com sucesso!');
    btn.disabled = false;
    btn.innerHTML = 'Salvar Chamada';
}
