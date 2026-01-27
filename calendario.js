// ===============================================================
// calendario.js - GESTÃO DE EVENTOS
// ===============================================================

async function renderCalendarioPanel() {
    const tableBody = document.getElementById('eventos-table-body');
    const start = document.getElementById('evento-data-inicio-filter').value;
    const end = document.getElementById('evento-data-fim-filter').value;
    
    tableBody.innerHTML = '<tr><td colspan="3" class="p-4 text-center">Carregando...</td></tr>';
    let query = db.from('eventos').select('*').order('data', { ascending: false });

    if (start) query = query.gte('data', start);
    if (end) query = query.lte('data', end);

    const { data, error } = await safeQuery(query);
    if (error || !data) return;

    tableBody.innerHTML = data.map(ev => {
        const d1 = new Date(ev.data + 'T00:00:00').toLocaleDateString();
        const d2 = ev.data_fim ? new Date(ev.data_fim + 'T00:00:00').toLocaleDateString() : d1;
        return `
        <tr class="border-b">
            <td class="p-3">${d1 === d2 ? d1 : d1 + ' - ' + d2}</td>
            <td class="p-3">${ev.descricao}</td>
            <td class="p-3"><button class="text-blue-600 hover:underline edit-evento-btn" data-id="${ev.id}">Editar</button></td>
        </tr>`;
    }).join('');
}
