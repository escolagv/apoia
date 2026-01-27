// ===============================================================
// listeners.js - ESCUTA DE EVENTOS (BOTÕES E FORMULÁRIOS)
// ===============================================================

document.addEventListener('DOMContentLoaded', () => {
    
    // Escuta global de cliques (Delegação de Eventos)
    document.body.addEventListener('click', (e) => {
        const target = e.target;
        const closest = (selector) => target.closest(selector);

        // Sidebar e Navegação
        const navLink = closest('.admin-nav-link');
        if (navLink) {
            // A lógica de trocar as telas já foi movida para ui.js, 
            // mas mantemos o disparo das renderizações iniciais aqui.
            const targetPanel = navLink.dataset.target;
            if (targetPanel === 'admin-relatorios-panel') renderRelatoriosPanel();
        }

        // Dashboard Interativo
        if (closest('.dashboard-aluno-link')) {
            e.preventDefault();
            openAlunoHistoricoModal(closest('.dashboard-aluno-link').dataset.alunoId);
        }

        // Gerenciamento de Alunos
        if (closest('#add-aluno-btn')) openAlunoModal();
        if (closest('.edit-aluno-btn')) openAlunoModal(closest('.edit-aluno-btn').dataset.id);
        if (closest('.historico-aluno-btn')) openAlunoHistoricoModal(closest('.historico-aluno-btn').dataset.id);

        // Gerenciamento de Professores
        if (closest('#add-professor-btn')) openProfessorModal();
        if (closest('.edit-professor-btn')) openProfessorModal(closest('.edit-professor-btn').dataset.id);
        if (closest('.reset-password-btn')) handleResetPassword(closest('.reset-password-btn').dataset.email);

        // Gerenciamento de Turmas
        if (closest('#add-turma-btn')) openTurmaModal();
        if (closest('.edit-turma-btn')) openTurmaModal(closest('.edit-turma-btn').dataset.id);
        if (closest('.delete-turma-btn')) openDeleteConfirmModal('turma', closest('.delete-turma-btn').dataset.id);

        // Exclusão Segura
        if (closest('.delete-btn')) {
            const type = closest('.delete-btn').dataset.type;
            const id = document.getElementById(`${type}-id`).value;
            if (id) openDeleteConfirmModal(type, id);
        }
        if (closest('#confirm-delete-btn')) handleConfirmDelete();

        // APOIA e Calendário
        if (closest('#add-acompanhamento-btn')) openAcompanhamentoModal();
        if (closest('.edit-acompanhamento-btn')) openAcompanhamentoModal(closest('.edit-acompanhamento-btn').dataset.id);
        if (closest('#add-evento-btn')) openEventoModal();
        if (closest('.edit-evento-btn')) openEventoModal(closest('.edit-evento-btn').dataset.id);

        // Promoção de Turmas
        if (closest('#open-promover-turmas-modal-btn')) openPromoverTurmasModal();
        if (closest('#promover-turmas-btn')) handlePromoverTurmas();
        if (closest('#confirm-promocao-turmas-btn')) handleConfirmPromocaoTurmas();

        // Relatórios
        if (closest('#gerar-relatorio-btn')) handleGerarRelatorio();
        if (closest('#imprimir-relatorio-btn')) handleImprimirRelatorio('faltas');

        // Modais
        if (closest('.cancel-modal-btn')) closeAllModals();
        if (closest('#admin-logout-btn') || closest('#professor-logout-btn')) signOutUser();
    });

    // Escuta de Formulários
    document.body.addEventListener('submit', (e) => {
        const id = e.target.id;
        if (id === 'login-form') handleLoginFormSubmit(e); // Precisamos definir esta função
        if (id === 'aluno-form') handleAlunoFormSubmit(e);
        if (id === 'professor-form') handleProfessorFormSubmit(e);
        if (id === 'turma-form') handleTurmaFormSubmit(e);
        if (id === 'config-form') handleConfigFormSubmit(e);
    });

    // Escuta de Mudanças em Filtros
    document.body.addEventListener('change', (e) => {
        if (e.target.id === 'aluno-ano-letivo-filter') renderAlunosPanel();
        if (e.target.id === 'aluno-turma-filter') renderAlunosPanel();
        if (e.target.id === 'turma-ano-letivo-filter') renderTurmasPanel();
    });
});
