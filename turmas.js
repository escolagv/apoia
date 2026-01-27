// ===============================================================
// turmas.js - GESTÃO DE TURMAS
// ===============================================================

async function renderTurmasPanel() {
    const tableBody = document.getElementById('turmas-table-body');
    const filter = document.getElementById('turma-ano-letivo-filter');
    const saved = filter.value;
    filter.innerHTML = '<option value="">Todos</option>';
    anosLetivosCache.forEach(ano => filter.innerHTML += `<option value="${ano}">${ano}</option>`);
    filter.value = saved;

    tableBody.innerHTML = '<tr><td colspan="3" class="p-4 text-center">Carregando...</td></tr>';
    let query = db.from('turmas').select(`id, nome_turma, ano_letivo, professores_turmas(usuarios(nome))`);
    if (filter.value) query = query.eq('ano_letivo', filter.value);

    const { data } = await safeQuery(query);
    if (!data) return;

    tableBody.innerHTML = data.sort((a, b) => a.nome_turma.localeCompare(b.nome_turma, undefined, { numeric: true })).map(t => `
        <tr class="border-b">
            <td class="p-3">${t.nome_turma} (${t.ano_letivo})</td>
            <td class="p-3">${t.professores_turmas.map(pt => pt.usuarios?.nome).join(', ') || 'Sem prof.'}</td>
            <td class="p-3">
                <button class="text-blue-600 edit-turma-btn" data-id="${t.id}">Editar</button>
                <button class="text-red-600 ml-2 delete-turma-btn" data-id="${t.id}">Excluir</button>
            </td>
        </tr>`).join('');
}

async function handleTurmaFormSubmit(e) {
    const id = document.getElementById('turma-id').value;
    const nome = document.getElementById('turma-nome').value;
    const ano = document.getElementById('turma-ano-letivo').value;
    const profs = Array.from(document.querySelectorAll('#turma-professores-list input:checked')).map(i => i.value);

    if (id) {
        // Atualiza apenas os professores devido à regra de imutabilidade
        await db.from('professores_turmas').delete().eq('turma_id', id);
        if (profs.length > 0) {
            await db.from('professores_turmas').insert(profs.map(pId => ({ turma_id: id, professor_id: pId })));
        }
    } else {
        const { data } = await safeQuery(db.from('turmas').insert({ nome_turma: nome, ano_letivo: ano }).select().single());
        if (data && profs.length > 0) {
            await db.from('professores_turmas').insert(profs.map(pId => ({ turma_id: data.id, professor_id: pId })));
        }
    }
    showToast('Turma salva!');
    closeModal(document.getElementById('turma-modal'));
    await loadAdminData();
    renderTurmasPanel();
}

async function deleteTurma(id) {
    await db.from('professores_turmas').delete().eq('turma_id', id);
    await db.from('alunos').update({ turma_id: null }).eq('turma_id', id);
    return await db.from('turmas').delete().eq('id', id);
}
