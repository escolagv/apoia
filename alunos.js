// ===============================================================
// alunos.js - GESTÃO DE ALUNOS
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
            </td>
        </tr>`).join('');
}

async function handleAlunoFormSubmit(e) {
    const id = document.getElementById('aluno-id').value;
    const alunoData = {
        nome_completo: document.getElementById('aluno-nome').value,
        matricula: document.getElementById('aluno-matricula').value,
        turma_id: document.getElementById('aluno-turma').value || null,
        status: document.getElementById('aluno-status').value,
        telefone: document.getElementById('aluno-telefone').value,
        email: document.getElementById('aluno-email').value,
        nome_responsavel: document.getElementById('aluno-responsavel').value
    };
    const q = id ? db.from('alunos').update(alunoData).eq('id', id) : db.from('alunos').insert(alunoData);
    const { error } = await safeQuery(q);
    if (!error) {
        showToast('Aluno salvo com sucesso!');
        closeModal(document.getElementById('aluno-modal'));
        await loadAdminData();
        renderAlunosPanel();
    }
}
