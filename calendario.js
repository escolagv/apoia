// ===============================================================
// calendario.js - GESTÃO DE EVENTOS
// ===============================================================

async function openEventoModal(editId = null) {
    const modal = document.getElementById('evento-modal');
    document.getElementById('evento-form').reset();
    document.getElementById('evento-delete-container').classList.add('hidden');

    if (editId) {
        const { data } = await safeQuery(db.from('eventos').select('*').eq('id', editId).single());
        if (data) {
            document.getElementById('evento-id').value = data.id;
            document.getElementById('evento-descricao').value = data.descricao;
            document.getElementById('evento-data-inicio').value = data.data;
            document.getElementById('evento-data-fim').value = data.data_fim || '';
            document.getElementById('evento-delete-container').classList.remove('hidden');
        }
    } else {
        document.getElementById('evento-id').value = '';
    }
    modal.classList.remove('hidden');
}

async function handleEventoFormSubmit(e) {
    const id = document.getElementById('evento-id').value;
    const data = {
        descricao: document.getElementById('evento-descricao').value,
        data: document.getElementById('evento-data-inicio').value,
        data_fim: document.getElementById('evento-data-fim').value || null
    };
    const q = id ? db.from('eventos').update(data).eq('id', id) : db.from('eventos').insert(data);
    await safeQuery(q);
    showToast('Evento salvo!');
    closeModal(document.getElementById('evento-modal'));
    renderCalendarioPanel();
    renderDashboardCalendar();
}
