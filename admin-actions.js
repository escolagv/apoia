// ===============================================================
// admin-actions.js - EXCLUSÃO E AÇÕES GLOBAIS
// ===============================================================

async function handleConfirmDelete() {
    const btn = document.getElementById('confirm-delete-btn');
    const type = btn.dataset.type;
    const id = btn.dataset.id;
    let result = { error: null };

    try {
        if (type === 'professor') {
            result = await deleteProfessor(id); // Função em professores.js
        } else if (type === 'turma') {
            // Será definido em turmas.js
            result = await deleteTurma(id); 
        } else if (type === 'aluno') {
            // Será definido em alunos.js
            result = await deleteAluno(id);
        } else if (type === 'evento') {
            result = await safeQuery(db.from('eventos').delete().eq('id', id));
        }

        if (result.error) throw result.error;

        showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} excluído com sucesso!`);
        
        // Atualiza a tela que estiver aberta
        const activePanel = document.querySelector('.admin-panel:not(.hidden)');
        if (activePanel) {
            const targetId = activePanel.id;
            if (targetId === 'admin-dashboard-panel') renderDashboardPanel();
            if (targetId === 'admin-professores-panel') renderProfessoresPanel();
            if (targetId === 'admin-turmas-panel') renderTurmasPanel();
            if (targetId === 'admin-alunos-panel') renderAlunosPanel();
        }

    } catch (err) {
        showToast("Erro: " + err.message, true);
    }
    closeModal(document.getElementById('delete-confirm-modal'));
}
