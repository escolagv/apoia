// ===============================================================
// turmas.js - GESTÃO DE TURMAS (IMUTABILIDADE)
// ===============================================================

async function renderTurmasPanel() {
    const tableBody = document.getElementById('turmas-table-body');
    const filter = document.getElementById('turma-ano-letivo-filter');
    
    tableBody.innerHTML = '<tr><td colspan="3" class="p-4 text-center">Carregando...</td></tr>';
    
    let query = db.from('turmas').select(`id, nome_turma, ano_letivo, professores_turmas(usuarios(nome))`);
    if (filter.value) query = query.eq('ano_letivo', filter.value);

    const { data, error } = await safeQuery(query);
    if (error || !data) return;

    data.sort((a, b) => a.nome_turma.localeCompare(b.nome_turma, undefined, { numeric: true }));

    tableBody.innerHTML = data.map(t => {
        const profs = t.professores_turmas.map(pt => pt.usuarios?.nome || 'Prof. Removido').join(', ');
        return `
        <tr class="border-b">
            <td class="p-3">${t.nome_turma} (${t.ano_letivo})</td>
            <td class="p-3">${profs || 'Sem professor'}</td>
            <td class="p-3">
                <button class="text-blue-600 hover:underline mr-4 edit-turma-btn" data-id="${t.id}">Editar</button>
                <button class="text-red-600 hover:underline delete-turma-btn" data-id="${t.id}">Excluir</button>
            </td>
        </tr>`;
    }).join('');
}

async function openTurmaModal(editId = null) {
    const form = document.getElementById('turma-form');
    const list = document.getElementById('turma-professores-list');
    const inputNome = document.getElementById('turma-nome');
    const inputAno = document.getElementById('turma-ano-letivo');
    
    form.reset();
    list.innerHTML = '';
    
    // Reset de estado dos campos (Desbloqueados para nova turma)
    inputNome.disabled = false;
    inputAno.disabled = false;
    inputNome.classList.remove('bg-gray-100');
    inputAno.classList.remove('bg-gray-100');

    usuariosCache.filter(u => u.papel === 'professor').forEach(p => {
        list.innerHTML += `<label class="flex items-center"><input type="checkbox" class="form-checkbox" value="${p.user_uid}"><span class="ml-2">${p.nome}</span></label>`;
    });

    document.getElementById('turma-delete-container').classList.add('hidden');

    if (editId) {
        const { data } = await safeQuery(db.from('turmas').select('*').eq('id', editId).single());
        if (!data) return;

        // REGRA DE OURO: Bloqueia campos críticos na edição
        inputNome.disabled = true;
        inputAno.disabled = true;
        inputNome.classList.add('bg-gray-100');
        inputAno.classList.add('bg-gray-100');

        document.getElementById('turma-modal-title').textContent = 'Editar Professores da Turma';
        document.getElementById('turma-id').value = data.id;
        document.getElementById('turma-nome').value = data.nome_turma;
        document.getElementById('turma-ano-letivo').value = data.ano_letivo;
        document.getElementById('turma-delete-container').classList.remove('hidden');

        const { data: rels } = await safeQuery(db.from('professores_turmas').select('professor_id').eq('turma_id', editId));
        if (rels) {
            const ids = rels.map(r => r.professor_id);
            list.querySelectorAll('input').forEach(i => { if (ids.includes(i.value)) i.checked = true; });
        }
    } else {
        document.getElementById('turma-modal-title').textContent = 'Adicionar Turma';
        document.getElementById('turma-id').value = '';
        inputAno.value = new Date().getFullYear();
    }
    document.getElementById('turma-modal').classList.remove('hidden');
}

async function deleteTurma(id) {
    // 1. Limpa vínculos de professores
    await db.from('professores_turmas').delete().eq('turma_id', id);
    // 2. Solta os alunos (seta turma_id como NULL) para não dar erro 23503
    await db.from('alunos').update({ turma_id: null }).eq('turma_id', id);
    // 3. Deleta a turma
    const { error } = await db.from('turmas').delete().eq('id', id);
    return { error };
}
