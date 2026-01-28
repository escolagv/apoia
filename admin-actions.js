// ===============================================================
// admin-actions.js - GESTÃO DE EXCLUSÃO
// ===============================================================

function openDeleteConfirmModal(type, id) {
    const modal = document.getElementById('delete-confirm-modal');
    const msg = document.getElementById('delete-confirm-message');
    const btn = document.getElementById('confirm-delete-btn');
    const check = document.getElementById('delete-confirm-checkbox');

    msg.textContent = `Tem certeza que deseja excluir este ${type}? Esta ação é irreversível.`;
    check.checked = false;
    btn.disabled = true;
    btn.dataset.type = type;
    btn.dataset.id = id;
    modal.classList.remove('hidden');
}

async function handleConfirmDelete() {
    const btn = document.getElementById('confirm-delete-btn');
    const type = btn.dataset.type;
    const id = btn.dataset.id;
    let query;

    try {
        if (type === 'aluno') query = db.from('alunos').delete().eq('id', id);
        else if (type === 'turma') {
            await safeQuery(db.from('professores_turmas').delete().eq('turma_id', id));
            query = db.from('turmas').delete().eq('id', id);
        } else if (type === 'professor') query = db.from('usuarios').delete().eq('id', id);
        else if (type === 'evento') query = db.from('eventos').delete().eq('id', id);
        else if (type === 'acompanhamento') query = db.from('apoia_encaminhamentos').delete().eq('id', id);

        const { error } = await safeQuery(query);
        if (error) throw error;

        showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} excluído com sucesso!`);
        closeAllModals();
        await loadAdminData();
        
        // Refresh da tela atual
        const active = document.querySelector('.admin-panel:not(.hidden)');
        if (active.id === 'admin-alunos-panel') renderAlunosPanel();
        if (active.id === 'admin-turmas-panel') renderTurmasPanel();
        if (active.id === 'admin-professores-panel') renderProfessoresPanel();

    } catch (err) {
        showToast(`Erro ao excluir: ${err.message}`, true);
    }
}
