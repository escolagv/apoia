// ===============================================================
// admin-actions.js - GESTÃO DE EXCLUSÃO E CONFIRMAÇÕES
// ===============================================================

/**
 * Abre o modal de confirmação de exclusão (Chamado de dentro dos modais de edição)
 */
function openDeleteConfirmModal(type, id) {
    const deleteConfirmModal = document.getElementById('delete-confirm-modal');
    const messageEl = document.getElementById('delete-confirm-message');
    const confirmBtn = document.getElementById('confirm-delete-btn');
    const checkbox = document.getElementById('delete-confirm-checkbox');

    if (!deleteConfirmModal || !messageEl || !confirmBtn) {
        console.error("Elementos do modal de exclusão não encontrados no HTML.");
        return;
    }

    messageEl.textContent = `Você tem certeza que deseja excluir este ${type}? Esta ação é irreversível e pode afetar históricos.`;
    checkbox.checked = false;
    confirmBtn.disabled = true;
    confirmBtn.dataset.type = type;
    confirmBtn.dataset.id = id;

    deleteConfirmModal.classList.remove('hidden');
}

/**
 * Executa a exclusão após a confirmação no modal
 */
async function handleConfirmDelete() {
    const confirmBtn = document.getElementById('confirm-delete-btn');
    const type = confirmBtn.dataset.type;
    const id = confirmBtn.dataset.id;
    let queryBuilder;

    try {
        if (type === 'aluno') {
            const { error } = await db.from('alunos').delete().eq('id', id);
            if (error && error.code === '23503') {
                if (confirm("Este aluno possui histórico e não pode ser apagado. Deseja marcá-lo como INATIVO?")) {
                    await db.from('alunos').update({ status: 'inativo' }).eq('id', id);
                    showToast('Aluno inativado com sucesso.');
                }
            } else if (!error) {
                showToast('Aluno excluído com sucesso.');
            }
        } 
        else if (type === 'turma') {
            await safeQuery(db.from('professores_turmas').delete().eq('turma_id', id));
            await db.from('alunos').update({ turma_id: null }).eq('turma_id', id);
            await safeQuery(db.from('turmas').delete().eq('id', id));
            showToast('Turma excluída com sucesso.');
        } 
        else if (type === 'professor') {
            const { data: prof } = await db.from('usuarios').select('user_uid').eq('id', id).single();
            if (prof) {
                await db.from('professores_turmas').delete().eq('professor_id', prof.user_uid);
            }
            await safeQuery(db.from('usuarios').delete().eq('id', id));
            showToast('Professor excluído. Remova o login no painel da Supabase se necessário.');
        } 
        else if (type === 'evento') {
            await safeQuery(db.from('eventos').delete().eq('id', id));
            showToast('Evento excluído.');
        } 
        else if (type === 'acompanhamento') {
            await safeQuery(db.from('apoia_encaminhamentos').delete().eq('id', id));
            showToast('Registro excluído.');
        }

        // Atualização de interface
        await loadAdminData();
        const activePanel = document.querySelector('.admin-panel:not(.hidden)');
        if (activePanel) {
            if (activePanel.id === 'admin-alunos-panel') renderAlunosPanel();
            if (activePanel.id === 'admin-turmas-panel') renderTurmasPanel();
            if (activePanel.id === 'admin-professores-panel') renderProfessoresPanel();
            if (activePanel.id === 'admin-apoia-panel') renderApoiaPanel();
            if (activePanel.id === 'admin-calendario-panel') renderCalendarioPanel();
        }
        
        closeAllModals();

    } catch (err) {
        showToast(`Erro na exclusão: ${err.message}`, true);
    }
}
