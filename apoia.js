// ===============================================================
// apoia.js - ACOMPANHAMENTO APOIA
// ===============================================================

async function renderApoiaPanel(page = 1) {
    const tableBody = document.getElementById('apoia-table-body');
    apoiaCurrentPage = page;
    tableBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center">Carregando acompanhamentos...</td></tr>';

    const { count } = await safeQuery(db.from('apoia_encaminhamentos').select('*', { count: 'exact', head: true }));
    const from = (page - 1) * apoiaItemsPerPage;
    const to = from + apoiaItemsPerPage - 1;

    const { data, error } = await safeQuery(
        db.from('apoia_encaminhamentos').select(`*, alunos(nome_completo)`)
          .order('status', { ascending: true })
          .order('data_encaminhamento', { ascending: false })
          .range(from, to)
    );

    if (error || !data) return;

    tableBody.innerHTML = data.map(item => `
        <tr class="border-b">
            <td class="p-3 font-medium">${item.alunos?.nome_completo || 'Removido'}</td>
            <td class="p-3">${new Date(item.data_encaminhamento + 'T00:00:00').toLocaleDateString()}</td>
            <td class="p-3 text-sm text-gray-600">${item.motivo}</td>
            <td class="p-3"><span class="px-2 py-1 text-xs font-semibold rounded-full ${item.status === 'Finalizado' ? 'bg-gray-200 text-gray-800' : 'bg-yellow-100 text-yellow-800'}">${item.status}</span></td>
            <td class="p-3"><button class="text-blue-600 hover:underline edit-acompanhamento-btn" data-id="${item.id}">Editar</button></td>
        </tr>`).join('');
    
    renderApoiaPagination(Math.ceil(count / apoiaItemsPerPage), page);
}

function renderApoiaPagination(totalPages, currentPage) {
    const container = document.getElementById('apoia-pagination');
    container.innerHTML = '';
    if (totalPages <= 1) return;
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.className = `px-3 py-1 rounded-md text-sm ${i === currentPage ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-200'}`;
        btn.onclick = () => renderApoiaPanel(i);
        container.appendChild(btn);
    }
}

async function openAcompanhamentoModal(editId = null) {
    const modal = document.getElementById('acompanhamento-modal');
    const sel = document.getElementById('acompanhamento-aluno-select');
    sel.innerHTML = '<option value="">Selecione...</option>';
    alunosCache.forEach(a => sel.innerHTML += `<option value="${a.id}">${a.nome_completo}</option>`);
    
    if (editId) {
        const { data } = await safeQuery(db.from('apoia_encaminhamentos').select('*').eq('id', editId).single());
        if (data) {
            document.getElementById('acompanhamento-id').value = data.id;
            document.getElementById('acompanhamento-aluno-select').value = data.aluno_id;
            document.getElementById('acompanhamento-motivo').value = data.motivo;
            document.getElementById('acompanhamento-status').value = data.status;
            document.getElementById('acompanhamento-observacoes').value = data.observacoes || '';
        }
    } else {
        document.getElementById('acompanhamento-id').value = '';
    }
    modal.classList.remove('hidden');
}

async function handleAcompanhamentoFormSubmit(e) {
    const id = document.getElementById('acompanhamento-id').value;
    const data = {
        aluno_id: document.getElementById('acompanhamento-aluno-select').value,
        motivo: document.getElementById('acompanhamento-motivo').value,
        status: document.getElementById('acompanhamento-status').value,
        observacoes: document.getElementById('acompanhamento-observacoes').value,
        data_encaminhamento: getLocalDateString()
    };
    if (id) await safeQuery(db.from('apoia_encaminhamentos').update(data).eq('id', id));
    else await safeQuery(db.from('apoia_encaminhamentos').insert(data));
    
    showToast('Acompanhamento salvo!');
    closeModal(document.getElementById('acompanhamento-modal'));
    renderApoiaPanel();
}

async function handleGerarApoiaRelatorio() {
    const body = document.getElementById('apoia-relatorio-table-body');
    body.innerHTML = '<tr><td colspan="5" class="text-center p-4">Gerando relatório...</td></tr>';
    const { data } = await safeQuery(db.from('apoia_encaminhamentos').select('*, alunos(nome_completo)').order('data_encaminhamento', { ascending: false }));
    if (!data) return;
    body.innerHTML = data.map(i => `
        <tr class="border-b">
            <td class="p-3">${i.alunos?.nome_completo}</td>
            <td class="p-3">${new Date(i.data_encaminhamento + 'T00:00:00').toLocaleDateString()}</td>
            <td class="p-3">${i.motivo}</td>
            <td class="p-3">${i.status}</td>
            <td class="p-3 text-xs italic">${i.observacoes || ''}</td>
        </tr>`).join('');
    document.getElementById('imprimir-apoia-relatorio-btn').classList.remove('hidden');
}
