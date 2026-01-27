// ===============================================================
// professor-view.js - PAINEL DE CHAMADA
// ===============================================================

async function loadChamada() {
    const tId = document.getElementById('professor-turma-select').value;
    const data = document.getElementById('professor-data-select').value;
    const lista = document.getElementById('chamada-lista-alunos');
    const header = document.getElementById('chamada-header');
    const btnSalvar = document.getElementById('salvar-chamada-btn');

    lista.innerHTML = '';
    if (!tId || !data) return;

    header.innerHTML = '<div class="loader mx-auto"></div>';
    const { data: alunos } = await safeQuery(db.from('alunos').select('id, nome_completo').eq('turma_id', tId).eq('status', 'ativo').order('nome_completo'));
    const { data: pres } = await safeQuery(db.from('presencas').select('aluno_id, status, justificativa').eq('turma_id', tId).eq('data', data));

    const presMap = new Map(pres?.map(p => [p.aluno_id, p]));
    header.textContent = `Chamada - ${data}`;

    alunos.forEach(aluno => {
        const p = presMap.get(aluno.id) || { status: 'presente' };
        const div = document.createElement('div');
        div.className = 'p-3 bg-gray-50 rounded-lg mb-2';
        div.innerHTML = `
            <div class="flex justify-between items-center">
                <span>${aluno.nome_completo}</span>
                <div class="flex gap-4">
                    <label><input type="radio" name="st-${aluno.id}" value="presente" ${p.status === 'presente' ? 'checked' : ''}> Pres.</label>
                    <label><input type="radio" name="st-${aluno.id}" value="falta" ${p.status === 'falta' ? 'checked' : ''}> Falta</label>
                </div>
            </div>`;
        lista.appendChild(div);
    });
    btnSalvar.classList.remove('hidden');
}
