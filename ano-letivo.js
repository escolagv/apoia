// ===============================================================
// ano-letivo.js - PROMOÇÃO DE ANO LETIVO
// ===============================================================

async function openPromoverTurmasModal() {
    const modal = document.getElementById('promover-turmas-modal');
    const sel = document.getElementById('promover-turmas-ano-origem');
    sel.innerHTML = '<option value="">Selecione...</option>';
    anosLetivosCache.forEach(ano => sel.innerHTML += `<option value="${ano}">${ano}</option>`);
    modal.classList.remove('hidden');
}

async function renderPromocaoTurmasLista() {
    const ano = document.getElementById('promover-turmas-ano-origem').value;
    const destino = document.getElementById('promover-turmas-ano-destino');
    const container = document.getElementById('promover-turmas-lista');
    
    if (!ano) { destino.value = ''; return; }
    destino.value = parseInt(ano) + 1;
    container.innerHTML = '<div class="loader mx-auto"></div>';

    const { data } = await safeQuery(db.from('turmas').select('id, nome_turma').eq('ano_letivo', ano));
    
    if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-sm text-center text-gray-500">Nenhuma turma neste ano.</p>';
        return;
    }

    container.innerHTML = data.map(t => `
        <label class="flex items-center p-2 bg-white border rounded-md">
            <input type="checkbox" class="form-checkbox h-5 w-5 promocao-turma-checkbox" value="${t.id}" checked>
            <span class="ml-2 text-sm">${t.nome_turma}</span>
        </label>`).join('');
    document.getElementById('promover-turmas-btn').disabled = false;
}

async function handlePromoverTurmas() {
    const ids = Array.from(document.querySelectorAll('.promocao-turma-checkbox:checked')).map(cb => cb.value);
    if (ids.length === 0) return showToast('Selecione ao menos uma turma.', true);
    
    const confirmModal = document.getElementById('promover-turmas-confirm-modal');
    document.getElementById('confirm-promocao-turmas-btn').dataset.turmas = JSON.stringify(ids);
    confirmModal.classList.remove('hidden');
}

async function handleConfirmPromocaoTurmas() {
    const btn = document.getElementById('confirm-promocao-turmas-btn');
    const ids = JSON.parse(btn.dataset.turmas);
    const anoDestino = document.getElementById('promover-turmas-ano-destino').value;

    btn.disabled = true;
    btn.innerHTML = 'Processando...';

    const { error } = await db.rpc('promover_turmas_em_massa', {
        origem_turma_ids: ids,
        ano_destino: parseInt(anoDestino)
    });

    if (!error) {
        showToast('Turmas promovidas com sucesso!');
        closeAllModals();
        await loadAdminData();
    } else {
        showToast('Erro: ' + error.message, true);
    }
    btn.disabled = false;
    btn.innerHTML = 'Executar Promoção';
}
