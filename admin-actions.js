// ===============================================================
// admin-actions.js - GESTÃO DE EXCLUSÃO
// ===============================================================

function openDeleteConfirmModal(type, id) {
    const deleteConfirmModal = document.getElementById('delete-confirm-modal');
    const messageEl = document.getElementById('delete-confirm-message');
    const confirmBtn = document.getElementById('confirm-delete-btn');
    const checkbox = document.getElementById('delete-confirm-checkbox');

    messageEl.textContent = `Você tem certeza que deseja excluir este ${type}? Esta ação é irreversível.`;
    checkbox.checked = false;
    confirmBtn.disabled = true;
    confirmBtn.dataset.type = type;
    confirmBtn.dataset.id = id;
    deleteConfirmModal.classList.remove('hidden');
}

async function handleConfirmDelete() {
    const confirmBtn = document.getElementById('confirm-delete-btn');
    const type = confirmBtn.dataset.type;
    const id = confirmBtn.dataset.id;
    let result;

    try {
        if (type === 'aluno') {
            const { error } = await db.from('alunos').delete().eq('id', id);
            if (error && error.code === '23503') {
                if (confirm("Aluno possui histórico. Deseja inativar o registro?")) {
                    await db.from('alunos').update({ status: 'inativo' }).eq('id', id);
                }
            }
        } else if (type === 'turma') {
            result = await deleteTurma(id);
        } else if (type === 'professor') {
            result = await deleteProfessor(id);
        } else if (type === 'evento') {
            await safeQuery(db.from('eventos').delete().eq('id', id));
        } else if (type === 'acompanhamento') {
            await safeQuery(db.from('apoia_encaminhamentos').delete().eq('id', id));
        }

        showToast('Excluído com sucesso!');
        closeAllModals();
        await loadAdminData();
        
        // Atualiza a tela visível
        const active = document.querySelector('.admin-panel:not(.hidden)');
        if (active.id === 'admin-alunos-panel') renderAlunosPanel();
        if (active.id === 'admin-turmas-panel') renderTurmasPanel();
        if (active.id === 'admin-professores-panel') renderProfessoresPanel();
        if (active.id === 'admin-apoia-panel') renderApoiaPanel();
        if (active.id === 'admin-calendario-panel') renderCalendarioPanel();

    } catch (err) {
        showToast("Erro: " + err.message, true);
    }
}
