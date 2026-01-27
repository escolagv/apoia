// ===============================================================
// ano-letivo.js - GESTÃO DO ANO LETIVO (PROMOÇÃO)
// ===============================================================

async function openPromoverTurmasModal() {
    const modal = document.getElementById('promover-turmas-modal');
    const orig = document.getElementById('promover-turmas-ano-origem');
    const dest = document.getElementById('promover-turmas-ano-destino');

    const anoAtual = new Date().getFullYear();
    orig.innerHTML = `<option value="${anoAtual}">${anoAtual}</option>`;
    orig.disabled = true;
    dest.value = anoAtual + 1;
    
    modal.classList.remove('hidden');
    renderPromocaoTurmasLista();
}

async function renderPromocaoTurmasLista() {
    const ano = document.getElementById('promover-turmas-ano-origem').value;
    const container = document.getElementById('promover-turmas-lista');
    const btn = document.getElementById('promover-turmas-btn');
    
    container.innerHTML = '<div class="loader mx-auto my-4"></div>';
    btn.disabled = true;

    const { data } = await safeQuery(db.from('turmas').select('id, nome_turma').eq('ano_letivo', ano));
    
    if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-sm text-center p-4 text-gray-500">Nenhuma turma encontrada para promover.</p>';
        return;
    }

    container.innerHTML = data.map(t => `
        <label class="flex items-center p-3 bg-white border rounded-md hover:bg-gray-50 cursor-pointer">
            <input type="checkbox" class="form-checkbox h-5 w-5 text-teal-600 promocao-turma-checkbox" value="${t.id}" checked>
            <span class="ml-3 text-sm font-medium text-gray-700">${t.nome_turma}</span>
        </label>`).join('');
    
    // Habilita o botão se houver turmas
    btn.disabled = false;
}

async function handlePromoverTurmas() {
    const selecionados = Array.from(document.querySelectorAll('.promocao-turma-checkbox:checked')).map(cb => cb.value);
    if (selecionados.length === 0) return showToast('Selecione ao menos uma turma.', true);
    
    const confirmModal = document.getElementById('promover-turmas-confirm-modal');
    document.getElementById('confirm-promocao-turmas-btn').dataset.turmas = JSON.stringify(selecionados);
    confirmModal.classList.remove('hidden');
}

async function handleConfirmPromocaoTurmas() {
    const btn = document.getElementById('confirm-promocao-turmas-btn');
    const ids = JSON.parse(btn.dataset.turmas);
    const anoDestino = document.getElementById('promover-turmas-ano-destino').value;

    btn.disabled = true;
    btn.innerHTML = '<div class="loader mx-auto"></div>';

    const { error } = await db.rpc('promover_turmas_em_massa', {
        origem_turma_ids: ids,
        ano_destino: parseInt(anoDestino)
    });

    if (!error) {
        showToast('Alunos promovidos com sucesso!');
        closeAllModals();
        await loadAdminData();
    } else {
        showToast('Erro técnico na promoção: ' + error.message, true);
    }
    btn.disabled = false;
    btn.innerHTML = 'Executar Promoção';
}
