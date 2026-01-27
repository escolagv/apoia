// ===============================================================
// apoia.js - ACOMPANHAMENTO APOIA
// ===============================================================

async function renderApoiaPanel(page = 1) {
    const tableBody = document.getElementById('apoia-table-body');
    apoiaCurrentPage = page;
    tableBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center">Carregando...</td></tr>';

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
            <td class="p-3">${item.alunos?.nome_completo || 'Removido'}</td>
            <td class="p-3">${new Date(item.data_encaminhamento + 'T00:00:00').toLocaleDateString()}</td>
            <td class="p-3">${item.motivo}</td>
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
