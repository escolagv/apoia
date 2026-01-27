// ===============================================================
// calendario.js - EVENTOS ESCOLARES
// ===============================================================

async function renderCalendarioPanel() {
    const tableBody = document.getElementById('eventos-table-body');
    const start = document.getElementById('evento-data-inicio-filter').value;
    const end = document.getElementById('evento-data-fim-filter').value;
    
    tableBody.innerHTML = '<tr><td colspan="3" class="p-4 text-center">Carregando eventos...</td></tr>';
    let query = db.from('eventos').select('*').order('data', { ascending: false });

    if (start) query = query.gte('data', start);
    if (end) query = query.lte('data', end);

    const { data, error } = await safeQuery(query);
    if (error || !data) return;

    tableBody.innerHTML = data.map(ev => {
        const d1 = new Date(ev.data + 'T00:00:00').toLocaleDateString('pt-BR');
        const d2 = ev.data_fim ? new Date(ev.data_fim + 'T00:00:00').toLocaleDateString('pt-BR') : d1;
        return `
        <tr class="border-b">
            <td class="p-3 font-medium">${d1 === d2 ? d1 : d1 + ' - ' + d2}</td>
            <td class="p-3 text-gray-700">${ev.descricao}</td>
            <td class="p-3"><button class="text-blue-600 hover:underline edit-evento-btn" data-id="${ev.id}">Editar</button></td>
        </tr>`;
    }).join('');
}

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
    if (id) await safeQuery(db.from('eventos').update(data).eq('id', id));
    else await safeQuery(db.from('eventos').insert(data));
    
    showToast('Evento salvo com sucesso!');
    closeModal(document.getElementById('evento-modal'));
    renderCalendarioPanel();
    renderDashboardCalendar();
}
