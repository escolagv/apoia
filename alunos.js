// ===============================================================
// alunos.js - GESTÃO COMPLETA DE ALUNOS
// ===============================================================

async function renderAlunosPanel(options = {}) {
    const tableBody = document.getElementById('alunos-table-body');
    const anoFilter = document.getElementById('aluno-ano-letivo-filter');
    const turmaFilter = document.getElementById('aluno-turma-filter');
    const search = document.getElementById('aluno-search-input').value;

    if (options.defaultToLatestYear && anosLetivosCache.length > 0) {
        anoFilter.value = anosLetivosCache[0];
    }
    const selectedAno = anoFilter.value;

    turmaFilter.innerHTML = '<option value="">Todas as Turmas</option>';
    if (selectedAno) {
        turmasCache.filter(t => t.ano_letivo == selectedAno).forEach(t => {
            turmaFilter.innerHTML += `<option value="${t.id}">${t.nome_turma}</option>`;
        });
    }

    tableBody.innerHTML = '<tr><td colspan="7" class="p-4 text-center">Carregando...</td></tr>';
    let query = db.from('alunos').select(`*, turmas ( nome_turma, ano_letivo )`);
    
    if (search) query = query.or(`nome_completo.ilike.%${search}%,matricula.ilike.%${search}%`);

    if (selectedAno) {
        const ids = turmasCache.filter(t => t.ano_letivo == selectedAno).map(t => t.id);
        if (parseInt(selectedAno) >= 2026) {
            if (ids.length > 0) query = query.or(`turma_id.is.null,turma_id.in.(${ids.join(',')})`);
            else query = query.is('turma_id', null);
        } else {
            query = query.in('turma_id', ids);
        }
    }
    if (turmaFilter.value) query = query.eq('turma_id', turmaFilter.value);

    const { data, error } = await safeQuery(query.order('nome_completo'));
    if (error || !data) return;

    tableBody.innerHTML = data.map(aluno => `
        <tr class="border-b text-sm">
            <td class="p-3">${aluno.nome_completo}</td>
            <td class="p-3">${aluno.matricula || ''}</td>
            <td class="p-3">${aluno.turmas?.nome_turma || 'Sem Turma'}</td>
            <td class="p-3">${aluno.nome_responsavel || ''}</td>
            <td class="p-3">${aluno.telefone || ''}</td>
            <td class="p-3"><span class="px-2 py-1 rounded-full text-xs ${aluno.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${aluno.status}</span></td>
            <td class="p-3">
                <button class="text-blue-600 edit-aluno-btn" data-id="${aluno.id}">Editar</button>
                <button class="text-indigo-600 ml-2 historico-aluno-btn" data-id="${aluno.id}">Histórico</button>
            </td>
        </tr>`).join('');
}

async function openAlunoModal(editId = null) {
    const form = document.getElementById('aluno-form');
    const sel = document.getElementById('aluno-turma');
    form.reset();
    sel.innerHTML = '<option value="">Selecione...</option>';
    turmasCache.filter(t => t.ano_letivo >= 2026).forEach(t => sel.innerHTML += `<option value="${t.id}">${t.nome_turma}</option>`);
    
    document.getElementById('aluno-delete-container').classList.add('hidden');
    if (editId) {
        const { data } = await safeQuery(db.from('alunos').select('*').eq('id', editId).single());
        if (!data) return;
        document.getElementById('aluno-modal-title').textContent = 'Editar Aluno';
        document.getElementById('aluno-id').value = data.id;
        document.getElementById('aluno-nome').value = data.nome_completo;
        document.getElementById('aluno-matricula').value = data.matricula;
        document.getElementById('aluno-turma').value = data.turma_id;
        document.getElementById('aluno-status').value = data.status;
        document.getElementById('aluno-responsavel').value = data.nome_responsavel || '';
        document.getElementById('aluno-delete-container').classList.remove('hidden');
    } else {
        document.getElementById('aluno-modal-title').textContent = 'Novo Aluno';
        document.getElementById('aluno-id').value = '';
    }
    document.getElementById('aluno-modal').classList.remove('hidden');
}

async function handleAlunoFormSubmit(e) {
    const id = document.getElementById('aluno-id').value;
    const alunoData = {
        nome_completo: document.getElementById('aluno-nome').value,
        matricula: document.getElementById('aluno-matricula').value,
        turma_id: document.getElementById('aluno-turma').value || null,
        status: document.getElementById('aluno-status').value,
        nome_responsavel: document.getElementById('aluno-responsavel').value
    };
    const q = id ? db.from('alunos').update(alunoData).eq('id', id) : db.from('alunos').insert(alunoData);
    const { error } = await safeQuery(q);
    if (!error) {
        showToast('Aluno salvo!');
        closeModal(document.getElementById('aluno-modal'));
        await loadAdminData();
        renderAlunosPanel();
    }
}

async function deleteAluno(id) {
    const { error } = await db.from('alunos').delete().eq('id', id);
    if (error && error.code === '23503') {
        if (confirm("Este aluno possui histórico. Deseja inativá-lo?")) {
            return await db.from('alunos').update({ status: 'inativo' }).eq('id', id);
        }
    }
    return { error };
}
