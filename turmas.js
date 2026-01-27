// ===============================================================
// turmas.js - GESTÃO COMPLETA DE TURMAS
// ===============================================================

async function renderTurmasPanel() {
    const tableBody = document.getElementById('turmas-table-body');
    const anoFilter = document.getElementById('turma-ano-letivo-filter');
    
    // Alimenta o filtro de anos do painel de turmas
    const currentVal = anoFilter.value;
    anoFilter.innerHTML = '<option value="">Todos os Anos</option>';
    anosLetivosCache.forEach(ano => anoFilter.innerHTML += `<option value="${ano}">${ano}</option>`);
    anoFilter.value = currentVal;

    tableBody.innerHTML = '<tr><td colspan="3" class="p-4 text-center">Carregando...</td></tr>';
    
    let query = db.from('turmas').select(`id, nome_turma, ano_letivo, professores_turmas(usuarios(nome))`);
    if (anoFilter.value) query = query.eq('ano_letivo', anoFilter.value);

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
    
    // Libera campos para nova turma
    inputNome.disabled = false;
    inputAno.disabled = false;
    inputNome.classList.remove('bg-gray-100');
    inputAno.classList.remove('bg-gray-100');

    // Lista professores para seleção
    usuariosCache.filter(u => u.papel === 'professor').forEach(p => {
        list.innerHTML += `<label class="flex items-center"><input type="checkbox" class="form-checkbox" value="${p.user_uid}"><span class="ml-2">${p.nome}</span></label>`;
    });

    document.getElementById('turma-delete-container').classList.add('hidden');

    if (editId) {
        const { data } = await safeQuery(db.from('turmas').select('*').eq('id', editId).single());
        if (!data) return;

        // Regra de Imutabilidade (Igual ao original)
        inputNome.disabled = true;
        inputAno.disabled = true;
        inputNome.classList.add('bg-gray-100');
        inputAno.classList.add('bg-gray-100');

        document.getElementById('turma-modal-title').textContent = 'Editar Turma';
        document.getElementById('turma-id').value = data.id;
        document.getElementById('turma-nome').value = data.nome_turma;
        document.getElementById('turma-ano-letivo').value = data.ano_letivo;
        
        // MOSTRA O BOTÃO EXCLUIR DENTRO DO EDITAR
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

async function handleTurmaFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('turma-id').value;
    const nome = document.getElementById('turma-nome').value;
    const ano = document.getElementById('turma-ano-letivo').value;
    const selectedProfIds = Array.from(document.querySelectorAll('#turma-professores-list input:checked')).map(i => i.value);
    
    if (id) {
        // Atualiza vínculos de professores
        await safeQuery(db.from('professores_turmas').delete().eq('turma_id', id));
        if (selectedProfIds.length > 0) {
            const rels = selectedProfIds.map(pId => ({ turma_id: id, professor_id: pId }));
            await safeQuery(db.from('professores_turmas').insert(rels));
        }
    } else {
        const { data, error } = await safeQuery(db.from('turmas').insert({ nome_turma: nome, ano_letivo: ano }).select().single());
        if (data && selectedProfIds.length > 0) {
            const rels = selectedProfIds.map(pId => ({ turma_id: data.id, professor_id: pId }));
            await safeQuery(db.from('professores_turmas').insert(rels));
        }
    }
    
    showToast('Turma salva com sucesso!');
    closeModal(document.getElementById('turma-modal'));
    await loadAdminData();
    renderTurmasPanel();
}
