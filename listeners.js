// ===============================================================
// listeners.js - CONEXÃO DE BOTÕES E CLIQUES
// ===============================================================

document.addEventListener('DOMContentLoaded', () => {
    
    document.body.addEventListener('click', (e) => {
        const target = e.target;
        const closest = (selector) => target.closest(selector);

        // --- NAVEGAÇÃO DO MENU LATERAL ---
        const navLink = closest('.admin-nav-link');
        if (navLink) {
            e.preventDefault();
            const targetPanelId = navLink.dataset.target;
            
            // Troca visualmente a tela
            switchAdminPanel(targetPanelId);

            // Dispara a carga de dados específica de cada tela
            if (targetPanelId === 'admin-dashboard-panel') renderDashboardPanel();
            if (targetPanelId === 'admin-professores-panel') renderProfessoresPanel();
            if (targetPanelId === 'admin-turmas-panel') renderTurmasPanel();
            if (targetPanelId === 'admin-alunos-panel') renderAlunosPanel({ defaultToLatestYear: true });
            if (targetPanelId === 'admin-apoia-panel') renderApoiaPanel();
            if (targetPanelId === 'admin-calendario-panel') renderCalendarioPanel();
            if (targetPanelId === 'admin-relatorios-panel') renderRelatoriosPanel();
            if (targetPanelId === 'admin-config-panel') renderConfigPanel();
        }

        // --- BOTÕES DE AÇÃO (ALUNOS/PROFS/TURMAS) ---
        if (closest('#add-aluno-btn')) openAlunoModal();
        if (closest('.edit-aluno-btn')) openAlunoModal(closest('.edit-aluno-btn').dataset.id);
        if (closest('#add-professor-btn')) openProfessorModal();
        if (closest('.edit-professor-btn')) openProfessorModal(closest('.edit-professor-btn').dataset.id);
        if (closest('#add-turma-btn')) openTurmaModal();
        if (closest('.edit-turma-btn')) openTurmaModal(closest('.edit-turma-btn').dataset.id);
        if (closest('.delete-turma-btn')) openDeleteConfirmModal('turma', closest('.delete-turma-btn').dataset.id);

        // --- EXCLUSÃO E MODAIS ---
        if (closest('.delete-btn')) {
            const type = closest('.delete-btn').dataset.type;
            const id = document.getElementById(`${type}-id`)?.value;
            if (id) openDeleteConfirmModal(type, id);
        }
        if (closest('#confirm-delete-btn')) handleConfirmDelete();
        if (closest('.cancel-modal-btn')) closeAllModals();

        // --- LOGOUT ---
        if (closest('#admin-logout-btn') || closest('#professor-logout-btn')) signOutUser();
    });

    // --- FORMULÁRIOS (SUBMIT) ---
    document.body.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        const id = e.target.id;

        if (id === 'login-form') {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.innerHTML = 'Entrando...';

            const { error } = await db.auth.signInWithPassword({ email, password });
            if (error) {
                document.getElementById('login-error').textContent = "Erro: " + error.message;
                btn.disabled = false;
                btn.innerHTML = 'Entrar';
            }
        }
        if (id === 'aluno-form') handleAlunoFormSubmit(e);
        if (id === 'professor-form') handleProfessorFormSubmit(e);
        if (id === 'turma-form') handleTurmaFormSubmit(e);
    });
});
