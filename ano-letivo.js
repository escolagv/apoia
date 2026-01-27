// ===============================================================
// ano-letivo.js - PROMOÇÃO DE ANO
// ===============================================================

async function handleConfirmPromocaoTurmas() {
    const btn = document.getElementById('confirm-promocao-turmas-btn');
    const turmaIds = JSON.parse(btn.dataset.turmas);
    const anoDestino = document.getElementById('promover-turmas-ano-destino').value;

    btn.innerHTML = '<div class="loader mx-auto"></div>';
    btn.disabled = true;

    const { error } = await db.rpc('promover_turmas_em_massa', {
        origem_turma_ids: turmaIds,
        ano_destino: parseInt(anoDestino)
    });

    if (error) {
        showToast("Erro na promoção: " + error.message, true);
    } else {
        showToast("Alunos promovidos com sucesso para " + anoDestino);
        closeAllModals();
        await loadAdminData();
        renderAlunosPanel({ defaultToLatestYear: true });
    }
    btn.innerHTML = 'Executar Promoção';
}
