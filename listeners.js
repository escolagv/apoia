// ===============================================================
// listeners.js - CONEXÃO TOTAL DE EVENTOS
// ===============================================================

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. ESCUTA DE CLIQUES ---
    document.body.addEventListener('click', (e) => {
        const target = e.target;
        const closest = (selector) => target.closest(selector);

        // Sidebar - Navegação
        const navLink = closest('.admin-nav-link');
        if (navLink) {
            e.preventDefault();
            const targetPanelId = navLink.dataset.target;
            switchAdminPanel(targetPanelId);
            if (targetPanelId === 'admin-dashboard-panel') renderDashboardPanel();
            if (targetPanelId === 'admin-professores-panel') renderProfessoresPanel();
            if (targetPanelId === 'admin-turmas-panel') renderTurmasPanel();
            if (targetPanelId === 'admin-alunos-panel') renderAlunosPanel({ defaultToLatestYear: true });
            if (targetPanelId === 'admin-apoia-panel') renderApoiaPanel();
            if (targetPanelId === 'admin-calendario-panel') renderCalendarioPanel();
            if (targetPanelId === 'admin-relatorios-panel') renderRelatoriosPanel();
            if (targetPanelId === 'admin-config-panel') renderConfigPanel();
        }

        // Dashboard - Cliques nos Cards (Presenças/Faltas/Acompanhamento)
        const card = closest('.clickable-card');
        if (card) {
            const type = card.dataset.type;
            if (type === 'presencas' || type === 'faltas') {
                switchAdminPanel('admin-relatorios-panel');
                setTimeout(() => {
                    document.getElementById('relatorio-data-inicio').value = dashboardSelectedDate;
                    document.getElementById('relatorio-data-fim').value = dashboardSelectedDate;
                    document.getElementById('relatorio-status-select').value = (type === 'faltas' ? 'falta' : 'presente');
                    handleGerarRelatorio();
                }, 100);
            } else if (type === 'acompanhamento') {
                switchAdminPanel('admin-apoia-panel');
                renderApoiaPanel();
            } else if (type === 'assiduidade') {
                openAssiduidadeModal();
            }
        }

        // Navegação de Mês no Calendário
        if (closest('#prev-month-btn')) { dashboardCalendar.month--; if (dashboardCalendar.month < 0) { dashboardCalendar.month = 11; dashboardCalendar.year--; } renderDashboardCalendar(); }
        if (closest('#next-month-btn')) { dashboardCalendar.month++; if (dashboardCalendar.month > 11) { dashboardCalendar.month = 0; dashboardCalendar.year++; } renderDashboardCalendar(); }

        // Cliques em Dias do Calendário
        if (closest('[data-date]')) {
            dashboardSelectedDate = closest('[data-date]').dataset.date;
            renderDashboardCalendar();
            loadDailySummary(dashboardSelectedDate);
        }

        // Ações de Alunos/Profs/Turmas
        if (closest('#add-aluno-btn')) openAlunoModal();
        if (closest('.edit-aluno-btn')) openAlunoModal(closest('.edit-aluno-btn').dataset.id);
        if (closest('.historico-aluno-btn')) openAlunoHistoricoModal(closest('.historico-aluno-btn').dataset.id);
        if (closest('#add-professor-btn')) openProfessorModal();
        if (closest('.edit-professor-btn')) openProfessorModal(closest('.edit-professor-btn').dataset.id);
        if (closest('#add-turma-btn')) openTurmaModal();
        if (closest('.edit-turma-btn')) openTurmaModal(closest('.edit-turma-btn').dataset.id);
        if (closest('.delete-turma-btn')) openDeleteConfirmModal('turma', closest('.delete-turma-btn').dataset.id);

        // Calendário de Eventos (Editar)
        if (closest('.edit-evento-btn')) openEventoModal(closest('.edit-evento-btn').dataset.id);
        if (closest('#add-evento-btn')) openEventoModal();

        // Relatórios (Gerar/Imprimir)
        if (closest('#gerar-relatorio-btn')) handleGerarRelatorio();
        if (closest('#imprimir-relatorio-btn')) handleImprimirRelatorio('faltas');
        if (closest('#gerar-apoia-relatorio-btn')) handleGerarApoiaRelatorio();
        if (closest('#imprimir-apoia-relatorio-btn')) handleImprimirRelatorio('apoia');
        if (closest('#imprimir-historico-btn')) handleImprimirRelatorio('historico');
        if (closest('#gerar-assiduidade-btn')) generateAssiduidadeReport();

        // Promoção de Turmas
        if (closest('#open-promover-turmas-modal-btn')) openPromoverTurmasModal();
        if (closest('#promover-turmas-btn')) handlePromoverTurmas();
        if (closest('#confirm-promocao-turmas-btn')) handleConfirmPromocaoTurmas();

        // Professor: Salvar Chamada
        if (closest('#salvar-chamada-btn')) saveChamada();

        // Modais e Logout
        if (closest('.cancel-modal-btn')) closeAllModals();
        if (closest('#admin-logout-btn') || closest('#professor-logout-btn')) signOutUser();
        if (closest('#confirm-delete-btn')) handleConfirmDelete();
    });

    // --- 2. ESCUTA DE FORMULÁRIOS (SUBMIT) ---
    document.body.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = e.target.id;
        if (id === 'login-form') { /* Lógica de login já no ui.js ou main.js */ }
        if (id === 'aluno-form') handleAlunoFormSubmit(e);
        if (id === 'professor-form') handleProfessorFormSubmit(e);
        if (id === 'turma-form') handleTurmaFormSubmit(e);
        if (id === 'config-form') handleConfigFormSubmit(e);
        if (id === 'evento-form') handleEventoFormSubmit(e);
        if (id === 'acompanhamento-form') handleAcompanhamentoFormSubmit(e);
    });

    // --- 3. ESCUTA DE FILTROS (CHANGE) ---
    document.body.addEventListener('change', (e) => {
        const id = e.target.id;
        if (id === 'aluno-ano-letivo-filter' || id === 'aluno-turma-filter') renderAlunosPanel();
        if (id === 'turma-ano-letivo-filter') renderTurmasPanel();
        if (id === 'promover-turmas-ano-origem') renderPromocaoTurmasLista();
        if (id === 'evento-data-inicio-filter' || id === 'evento-data-fim-filter') renderCalendarioPanel();
        if (id === 'assiduidade-aluno-ano' || id === 'assiduidade-turma-ano') { /* Lógica de cascata já nos módulos */ }
    });
});
