// ===============================================================
// listeners.js - ESCUTA DE EVENTOS E FORMULÁRIOS
// ===============================================================

document.addEventListener('DOMContentLoaded', () => {
    
    // --- CLIQUES ---
    document.body.addEventListener('click', (e) => {
        const target = e.target;
        const closest = (selector) => target.closest(selector);

        // Sidebar
        const navLink = closest('.admin-nav-link');
        if (navLink) {
            const targetPanel = navLink.dataset.target;
            if (targetPanel === 'admin-relatorios-panel') renderRelatoriosPanel();
            if (targetPanel === 'admin-turmas-panel') renderTurmasPanel();
            if (targetPanel === 'admin-alunos-panel') renderAlunosPanel({ defaultToLatestYear: true });
            if (targetPanel === 'admin-dashboard-panel') renderDashboardPanel();
        }

        // Dashboard/Alunos
        if (closest('.dashboard-aluno-link')) {
            e.preventDefault();
            openAlunoHistoricoModal(closest('.dashboard-aluno-link').dataset.alunoId);
        }
        if (closest('#add-aluno-btn')) openAlunoModal();
        if (closest('.edit-aluno-btn')) openAlunoModal(closest('.edit-aluno-btn').dataset.id);
        if (closest('.historico-aluno-btn')) openAlunoHistoricoModal(closest('.historico-aluno-btn').dataset.id);

        // Professores/Turmas
        if (closest('#add-professor-btn')) openProfessorModal();
        if (closest('.edit-professor-btn')) openProfessorModal(closest('.edit-professor-btn').dataset.id);
        if (closest('#add-turma-btn')) openTurmaModal();
        if (closest('.edit-turma-btn')) openTurmaModal(closest('.edit-turma-btn').dataset.id);
        if (closest('.delete-turma-btn')) openDeleteConfirmModal('turma', closest('.delete-turma-btn').dataset.id);

        // Exclusão
        if (closest('.delete-btn')) {
            const type = closest('.delete-btn').dataset.type;
            const id = document.getElementById(`${type}-id`).value;
            if (id) openDeleteConfirmModal(type, id);
        }
        if (closest('#confirm-delete-btn')) handleConfirmDelete();

        // Modais e Logout
        if (closest('.cancel-modal-btn')) closeAllModals();
        if (closest('#admin-logout-btn') || closest('#professor-logout-btn')) signOutUser();
    });

    // --- FORMULÁRIOS (SUBMIT) ---
    document.body.addEventListener('submit', async (e) => {
        e.preventDefault(); // FIX: Impede o recarregamento da página
        const id = e.target.id;

        if (id === 'login-form') {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = e.target.querySelector('button[type="submit"]');
            
            btn.disabled = true;
            btn.innerHTML = 'Entrando...';

            const { error } = await db.auth.signInWithPassword({ email, password });
            if (error) {
                document.getElementById('login-error').textContent = "Erro: Email ou senha inválidos.";
                btn.disabled = false;
                btn.innerHTML = 'Entrar';
            }
        }

        if (id === 'aluno-form') await handleAlunoFormSubmit(e);
        if (id === 'professor-form') await handleProfessorFormSubmit(e);
        if (id === 'turma-form') await handleTurmaFormSubmit(e);
        if (id === 'config-form') await handleConfigFormSubmit(e);
    });

    // --- FILTROS (CHANGE) ---
    document.body.addEventListener('change', (e) => {
        if (e.target.id === 'aluno-ano-letivo-filter' || e.target.id === 'aluno-turma-filter') renderAlunosPanel();
        if (e.target.id === 'turma-ano-letivo-filter') renderTurmasPanel();
    });
});
