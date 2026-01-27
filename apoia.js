// ===============================================================
// apoia.js - ACOMPANHAMENTO APOIA
// ===============================================================

async function openAcompanhamentoModal(editId = null) {
    const modal = document.getElementById('acompanhamento-modal');
    const sel = document.getElementById('acompanhamento-aluno-select');
    sel.innerHTML = '<option value="">Selecione um aluno...</option>';
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
    const q = id ? db.from('apoia_encaminhamentos').update(data).eq('id', id) : db.from('apoia_encaminhamentos').insert(data);
    await safeQuery(q);
    showToast('Salvo com sucesso!');
    closeModal(document.getElementById('acompanhamento-modal'));
    renderApoiaPanel();
}

async function handleGerarApoiaRelatorio() {
    const body = document.getElementById('apoia-relatorio-table-body');
    body.innerHTML = '<tr><td colspan="5" class="text-center p-4">Gerando...</td></tr>';
    const { data } = await safeQuery(db.from('apoia_encaminhamentos').select('*, alunos(nome_completo)').order('data_encaminhamento', { ascending: false }));
    if (data) {
        body.innerHTML = data.map(i => `
            <tr class="border-b">
                <td class="p-3">${i.alunos?.nome_completo}</td>
                <td class="p-3">${new Date(i.data_encaminhamento + 'T00:00:00').toLocaleDateString()}</td>
                <td class="p-3">${i.motivo}</td>
                <td class="p-3">${i.status}</td>
                <td class="p-3 text-xs">${i.observacoes || ''}</td>
            </tr>`).join('');
        document.getElementById('imprimir-apoia-relatorio-btn').classList.remove('hidden');
    }
}
