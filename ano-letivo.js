// ===============================================================
// ano-letivo.js - PROMOÇÃO AUTOMATIZADA
// ===============================================================

async function openPromoverTurmasModal() {
    const modal = document.getElementById('promover-turmas-modal');
    const orig = document.getElementById('promover-turmas-ano-origem');
    const dest = document.getElementById('promover-turmas-ano-destino');

    // Lógica Dinâmica: Pega o ano atual do computador
    const anoAtualReal = new Date().getFullYear(); 
    
    orig.innerHTML = `<option value="${anoAtualReal}">${anoAtualReal}</option>`;
    orig.disabled = true; // Travado para não errar o ano de origem
    dest.value = anoAtualReal + 1; // Sempre sugere o próximo ano
    
    modal.classList.remove('hidden');
    renderPromocaoTurmasLista(); 
}

async function renderPromocaoTurmasLista() {
    const ano = document.getElementById('promover-turmas-ano-origem').value;
    const container = document.getElementById('promover-turmas-lista');
    
    container.innerHTML = '<div class="loader mx-auto"></div>';

    const { data } = await safeQuery(db.from('turmas').select('id, nome_turma').eq('ano_letivo', ano));
    
    if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-sm text-center text-gray-500">Nenhuma turma encontrada para o ano atual.</p>';
        return;
    }

    container.innerHTML = data.map(t => `
        <label class="flex items-center p-2 bg-white border rounded-md hover:bg-gray-50 cursor-pointer">
            <input type="checkbox" class="form-checkbox h-5 w-5 text-teal-600 promocao-turma-checkbox" value="${t.id}" checked>
            <span class="ml-2 text-sm font-medium text-gray-700">${t.nome_turma}</span>
        </label>`).join('');
    
    document.getElementById('promover-turmas-btn').disabled = false;
}

async function handlePromoverTurmas() {
    const selecionados = Array.from(document.querySelectorAll('.promocao-turma-checkbox:checked')).map(cb => cb.value);
    if (selecionados.length === 0) return showToast('Selecione ao menos uma turma para promover.', true);
    
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
        showToast('Promoção realizada com sucesso!');
        closeAllModals();
        await loadAdminData();
    } else {
        showToast('Erro: ' + error.message, true);
    }
    btn.disabled = false;
    btn.innerHTML = 'Executar Promoção';
}
