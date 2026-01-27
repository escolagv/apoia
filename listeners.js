// ===============================================================
// listeners.js - ESCUTA DE EVENTOS (BOTÕES E FORMULÁRIOS)
// ===============================================================

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. ESCUTA DE CLIQUES (DELEGAÇÃO) ---
    document.body.addEventListener('click', (e) => {
        const target = e.target;
        const closest = (selector) => target.closest(selector);

        // Navegação Sidebar
        const navLink = closest('.admin-nav-link');
        if (navLink) {
            const targetPanel = navLink.dataset.target;
            // Dispara renderizações conforme o painel aberto
            if (targetPanel === 'admin-relatorios-panel') renderRelatoriosPanel();
            if (targetPanel === 'admin-turmas-panel') renderTurmasPanel();
            if (targetPanel === 'admin-alunos-panel') renderAlunosPanel({ defaultToLatestYear: true });
            if (targetPanel === 'admin-professores-panel') renderProfessoresPanel();
            if (targetPanel === 'admin-dashboard-panel') renderDashboardPanel();
            if (targetPanel === 'admin-apoia-panel') renderApoiaPanel();
            if (targetPanel === 'admin-calendario-panel') renderCalendarioPanel();
            if (targetPanel === 'admin-config-panel') renderConfigPanel();
        }

        // Dashboard e Links de Aluno
        if (closest('.dashboard-aluno-link')) {
            e.preventDefault();
            openAlunoHistoricoModal(closest('.dashboard-aluno-link').dataset.alunoId);
        }

        // Calendário do Dashboard (Navegação de Meses)
        if (closest('#prev-month-btn')) { 
            dashboardCalendar.month--; 
            if (dashboardCalendar.month < 0) { dashboardCalendar.month = 11; dashboardCalendar.year--; } 
            renderDashboardCalendar(); 
        }
        if (closest('#next-month-btn')) { 
            dashboardCalendar.month++; 
            if (dashboardCalendar.month > 11) { dashboardCalendar.month = 0; dashboardCalendar.year++; } 
            renderDashboardCalendar(); 
        }

        // Gerenciamento: Alunos
        if (closest('#add-aluno-btn')) openAlunoModal();
        if (closest('.edit-aluno-btn')) openAlunoModal(closest('.edit-aluno-btn').dataset.id);
        if (closest('.historico-aluno-btn')) openAlunoHistoricoModal(closest('.historico-aluno-btn').dataset.id);

        // Gerenciamento: Professores
        if (closest('#add-professor-btn')) openProfessorModal();
        if (closest('.edit-professor-btn')) openProfessorModal(closest('.edit-professor-btn').dataset.id);
        if (closest('.reset-password-btn')) handleResetPassword(closest('.reset-password-btn').dataset.email);

        // Gerenciamento: Turmas
        if (closest('#add-turma-btn')) openTurmaModal();
        if (closest('.edit-turma-btn')) openTurmaModal(closest('.edit-turma-btn').dataset.id);
        if (closest('.delete-turma-btn')) openDeleteConfirmModal('turma', closest('.delete-turma-btn').dataset.id);

        // Exclusão Segura (Botões de excluir dentro dos modais)
        if (closest('.delete-btn')) {
            const type = closest('.delete-btn').dataset.type;
            const id = document.getElementById(`${type}-id`).value;
            if (id) openDeleteConfirmModal(type, id);
        }
        if (closest('#confirm-delete-btn')) handleConfirmDelete();

        // APOIA e Eventos
        if (closest('#add-acompanhamento-btn')) openAcompanhamentoModal();
        if (closest('.edit-acompanhamento-btn')) openAcompanhamentoModal(closest('.edit-acompanhamento-btn').dataset.id);
        if (closest('#add-evento-btn')) openEventoModal();
        if (closest('.edit-evento-btn')) openEventoModal(closest('.edit-evento-btn').dataset.id);

        // Promoção de Turmas
        if (closest('#open-promover-turmas-modal-btn')) openPromoverTurmasModal();
        if (closest('#promover-turmas-btn')) handlePromoverTurmas();
        if (closest('#confirm-promocao-turmas-btn')) handleConfirmPromocaoTurmas();

        // Relatórios e Correções
        if (closest('#gerar-relatorio-btn')) handleGerarRelatorio();
        if (closest('#imprimir-relatorio-btn')) handleImprimirRelatorio('faltas');
        if (closest('#correcao-chamada-btn')) {
            document.getElementById('correcao-chamada-modal').classList.remove('hidden');
            const sel = document.getElementById('correcao-turma-select');
            sel.innerHTML = '<option value="">Selecione...</option>';
            turmasCache.forEach(t => sel.innerHTML += `<option value="${t.id}">${t.nome_turma}</option>`);
        }

        // Interface: Fechar Modais e Logout
        if (closest('.cancel-modal-btn')) closeAllModals();
        if (closest('#admin-logout-btn') || closest('#professor-logout-btn')) signOutUser();
    });

    // --- 2. ESCUTA DE FORMULÁRIOS (SUBMIT) ---
    document.body.addEventListener('submit', async (e) => {
        e.preventDefault(); // IMPEDE O REFRESH DA PÁGINA
        const id = e.target.id;

        if (id === 'login-form') {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const loginBtn = e.target.querySelector('button[type="submit"]');
            const errorEl = document.getElementById('login-error');

            loginBtn.disabled = true;
            loginBtn.innerHTML = 'Entrando...';
            errorEl.textContent = '';

            const { error } = await db.auth.signInWithPassword({ email, password });
            if (error) {
                errorEl.textContent = "Erro: Email ou senha inválidos.";
                loginBtn.disabled = false;
                loginBtn.innerHTML = 'Entrar';
            }
            // Se sucesso, o handleAuthChange no main.js redireciona automaticamente
        }

        if (id === 'aluno-form') await handleAlunoFormSubmit(e);
        if (id === 'professor-form') await handleProfessorFormSubmit(e);
        if (id === 'turma-form') await handleTurmaFormSubmit(e);
        if (id === 'config-form') await handleConfigFormSubmit(e);
        if (id === 'evento-form') await handleEventoFormSubmit(e);
        if (id === 'acompanhamento-form') await handleAcompanhamentoFormSubmit(e);
    });

    // --- 3. ESCUTA DE FILTROS (CHANGE) ---
    document.body.addEventListener('change', (e) => {
        const id = e.target.id;
        if (id === 'aluno-ano-letivo-filter' || id === 'aluno-turma-filter') renderAlunosPanel();
        if (id === 'turma-ano-letivo-filter') renderTurmasPanel();
        if (id === 'professor-turma-select' || id === 'professor-data-select') loadChamada();
    });
});
