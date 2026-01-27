// ===============================================================
// listeners.js - CONEXÃO TOTAL DE CLIQUES E FORMULÁRIOS
// ===============================================================

document.addEventListener('DOMContentLoaded', () => {
    
    document.body.addEventListener('click', (e) => {
        const target = e.target;
        const closest = (selector) => target.closest(selector);

        // NAVEGAÇÃO SIDEBAR
        const navLink = closest('.admin-nav-link');
        if (navLink) {
            e.preventDefault();
            const panelId = navLink.dataset.target;
            switchAdminPanel(panelId);
            if (panelId === 'admin-dashboard-panel') renderDashboardPanel();
            if (panelId === 'admin-professores-panel') renderProfessoresPanel();
            if (panelId === 'admin-turmas-panel') renderTurmasPanel();
            if (panelId === 'admin-alunos-panel') renderAlunosPanel({ defaultToLatestYear: true });
            if (panelId === 'admin-apoia-panel') renderApoiaPanel();
            if (panelId === 'admin-calendario-panel') renderCalendarioPanel();
            if (panelId === 'admin-relatorios-panel') renderRelatoriosPanel();
            if (panelId === 'admin-config-panel') renderConfigPanel();
        }

        // CARDS DASHBOARD
        const card = closest('.clickable-card');
        if (card) {
            const type = card.dataset.type;
            if (type === 'presencas' || type === 'faltas') {
                switchAdminPanel('admin-relatorios-panel');
                setTimeout(() => {
                    document.getElementById('relatorio-data-inicio').value = dashboardSelectedDate;
                    document.getElementById('relatorio-status-select').value = (type === 'faltas' ? 'falta' : 'presente');
                    handleGerarRelatorio();
                }, 100);
            } else if (type === 'acompanhamento') {
                switchAdminPanel('admin-apoia-panel');
                renderApoiaPanel();
            } else if (type === 'assiduidade') { openAssiduidadeModal(); }
        }

        // ALUNOS / PROFS / TURMAS
        if (closest('#add-aluno-btn')) openAlunoModal();
        if (closest('.edit-aluno-btn')) openAlunoModal(closest('.edit-aluno-btn').dataset.id);
        if (closest('.historico-aluno-btn')) openAlunoHistoricoModal(closest('.historico-aluno-btn').dataset.id);
        if (closest('#add-professor-btn')) openProfessorModal();
        if (closest('.edit-professor-btn')) openProfessorModal(closest('.edit-professor-btn').dataset.id);
        if (closest('.reset-password-btn')) handleResetPassword(closest('.reset-password-btn').dataset.email);
        if (closest('#add-turma-btn')) openTurmaModal();
        if (closest('.edit-turma-btn')) openTurmaModal(closest('.edit-turma-btn').dataset.id);
        if (closest('.delete-turma-btn')) openDeleteConfirmModal('turma', closest('.delete-turma-btn').dataset.id);

        // APOIA / CALENDÁRIO / PROMOÇÃO
        if (closest('#add-acompanhamento-btn')) openAcompanhamentoModal();
        if (closest('.edit-acompanhamento-btn')) openAcompanhamentoModal(closest('.edit-acompanhamento-btn').dataset.id);
        if (closest('#gerar-apoia-relatorio-btn')) handleGerarApoiaRelatorio();
        if (closest('#add-evento-btn')) openEventoModal();
        if (closest('.edit-evento-btn')) openEventoModal(closest('.edit-evento-btn').dataset.id);
        if (closest('#open-promover-turmas-modal-btn')) openPromoverTurmasModal();
        if (closest('#promover-turmas-btn')) handlePromoverTurmas();
        if (closest('#confirm-promocao-turmas-btn')) handleConfirmPromocaoTurmas();

        // RELATÓRIOS
        if (closest('#gerar-relatorio-btn')) handleGerarRelatorio();
        if (closest('#imprimir-relatorio-btn')) handleImprimirRelatorio('faltas');
        if (closest('#correcao-chamada-btn')) { document.getElementById('correcao-chamada-modal').classList.remove('hidden'); loadCorrecaoChamada(); }
        if (closest('#gerar-assiduidade-btn')) generateAssiduidadeReport();

        // EXCLUSÃO E MODAIS
        if (closest('.delete-btn')) {
            const type = closest('.delete-btn').dataset.type;
            const id = document.getElementById(`${type}-id`)?.value;
            if (id) openDeleteConfirmModal(type, id);
        }
        if (closest('#confirm-delete-btn')) handleConfirmDelete();
        if (closest('.cancel-modal-btn')) closeAllModals();
        if (closest('#admin-logout-btn') || closest('#professor-logout-btn')) signOutUser();

        // CALENDÁRIO DASHBOARD (Navegação)
        if (closest('#prev-month-btn')) { dashboardCalendar.month--; if (dashboardCalendar.month < 0) { dashboardCalendar.month = 11; dashboardCalendar.year--; } renderDashboardCalendar(); }
        if (closest('#next-month-btn')) { dashboardCalendar.month++; if (dashboardCalendar.month > 11) { dashboardCalendar.month = 0; dashboardCalendar.year++; } renderDashboardCalendar(); }
        if (closest('[data-date]')) { dashboardSelectedDate = closest('[data-date]').dataset.date; renderDashboardCalendar(); loadDailySummary(dashboardSelectedDate); }
    });

    // FORMULÁRIOS
    document.body.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = e.target.id;
        if (id === 'login-form') { /* Lógica no ui.js ou main.js */ }
        if (id === 'aluno-form') handleAlunoFormSubmit(e);
        if (id === 'professor-form') handleProfessorFormSubmit(e);
        if (id === 'turma-form') handleTurmaFormSubmit(e);
        if (id === 'config-form') handleConfigFormSubmit(e);
        if (id === 'evento-form') handleEventoFormSubmit(e);
        if (id === 'acompanhamento-form') handleAcompanhamentoFormSubmit(e);
    });
});
