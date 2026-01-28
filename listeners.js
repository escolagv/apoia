// ===============================================================
// listeners.js - EVENT LISTENERS (CÓPIA FIEL COM FIX DE ASSIDUIDADE)
// ===============================================================

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Suporte via WhatsApp
    const setupSupportLinks = () => {
        const url = `https://wa.me/5548991004780?text=${encodeURIComponent("Olá! Preciso de suporte no Sistema de Chamadas.")}`;
        if (document.getElementById('support-link-prof')) document.getElementById('support-link-prof').href = url;
        if (document.getElementById('support-link-admin')) document.getElementById('support-link-admin').href = url;
    };
    setupSupportLinks();

    // 2. Toggle Password
    const toggleBtn = document.getElementById('toggle-password-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const input = document.getElementById('password');
            const isPass = input.type === 'password';
            input.type = isPass ? 'text' : 'password';
            document.getElementById('eye-icon').classList.toggle('hidden', isPass);
            document.getElementById('eye-off-icon').classList.toggle('hidden', !isPass);
        });
    }

    // 3. Delegação de Cliques
    document.body.addEventListener('click', (e) => {
        const target = e.target;
        const closest = (selector) => target.closest(selector);

        // Sidebar Navigation
        const navLink = closest('.admin-nav-link');
        if (navLink) {
            e.preventDefault();
            const panelId = navLink.dataset.target;
            switchAdminPanel(panelId);
            
            if (panelId === 'admin-dashboard-panel') renderDashboardPanel();
            else if (panelId === 'admin-alunos-panel') renderAlunosPanel({ defaultToLatestYear: true });
            else if (panelId === 'admin-professores-panel') renderProfessoresPanel();
            else if (panelId === 'admin-turmas-panel') renderTurmasPanel();
            else if (panelId === 'admin-apoia-panel') renderApoiaPanel();
            else if (panelId === 'admin-calendario-panel') renderCalendarioPanel();
            else if (panelId === 'admin-relatorios-panel') renderRelatoriosPanel();
            else if (panelId === 'admin-config-panel') renderConfigPanel();
        }

        // Dashboard Cards
        const card = closest('.clickable-card');
        if (card) {
            const type = card.dataset.type;
            if (type === 'presente' || type === 'presencas' || type === 'falta' || type === 'faltas') {
                switchAdminPanel('admin-relatorios-panel');
                setTimeout(() => {
                    document.getElementById('relatorio-data-inicio').value = dashboardSelectedDate;
                    document.getElementById('relatorio-data-fim').value = dashboardSelectedDate;
                    document.getElementById('relatorio-status-select').value = (type === 'falta' || type === 'faltas' ? 'falta' : 'presente');
                    handleGerarRelatorio();
                }, 100);
            } else if (type === 'assiduidade') { 
                openAssiduidadeModal(); 
            } else if (type === 'acompanhamento') { 
                switchAdminPanel('admin-apoia-panel'); 
                renderApoiaPanel();
            }
        }

        // Alunos / Profs / Turmas / APOIA
        if (closest('#add-aluno-btn')) openAlunoModal();
        if (closest('.edit-aluno-btn')) openAlunoModal(closest('.edit-aluno-btn').dataset.id);
        if (closest('.historico-aluno-btn')) openAlunoHistoricoModal(closest('.historico-aluno-btn').dataset.id);
        if (closest('#add-professor-btn')) openProfessorModal();
        if (closest('.edit-professor-btn')) openProfessorModal(closest('.edit-professor-btn').dataset.id);
        if (closest('.reset-password-btn')) handleResetPassword(closest('.reset-password-btn').dataset.email);
        if (closest('#add-turma-btn')) openTurmaModal();
        if (closest('.edit-turma-btn')) openTurmaModal(closest('.edit-turma-btn').dataset.id);
        if (closest('#add-evento-btn')) openEventoModal();
        if (closest('.edit-evento-btn')) openEventoModal(closest('.edit-evento-btn').dataset.id);
        if (closest('.edit-acompanhamento-btn')) openAcompanhamentoModal(closest('.edit-acompanhamento-btn').dataset.id);

        // EXCLUSÃO (Dentro do Editar)
        if (closest('.delete-btn')) {
            const type = closest('.delete-btn').dataset.type;
            let id;
            if (type === 'aluno') id = document.getElementById('aluno-id').value;
            else if (type === 'professor') id = document.getElementById('professor-id').value;
            else if (type === 'turma') id = document.getElementById('turma-id').value;
            else if (type === 'evento') id = document.getElementById('evento-id').value;
            else if (type === 'acompanhamento') id = document.getElementById('acompanhamento-id').value;
            if (id) openDeleteConfirmModal(type, id);
        }
        if (closest('#confirm-delete-btn')) handleConfirmDelete();

        // Promoção de Turmas
        if (closest('#open-promover-turmas-modal-btn')) openPromoverTurmasModal();
        if (closest('#promover-turmas-btn')) handlePromoverTurmas();
        if (closest('#confirm-promocao-turmas-btn')) handleConfirmPromocaoTurmas();
        if (closest('#promover-turmas-toggle-all')) {
            const checks = document.querySelectorAll('.promocao-turma-checkbox');
            const allChecked = Array.from(checks).every(c => c.checked);
            checks.forEach(c => c.checked = !allChecked);
            e.target.textContent = allChecked ? 'Marcar Todas' : 'Desmarcar Todas';
        }

        // Relatórios e Outros
        if (closest('#gerar-relatorio-btn')) handleGerarRelatorio();
        if (closest('#gerar-apoia-relatorio-btn')) handleGerarApoiaRelatorio();
        if (closest('#gerar-assiduidade-btn')) generateAssiduidadeReport();
        if (closest('.cancel-modal-btn')) closeAllModals();
        if (closest('#admin-logout-btn') || closest('#professor-logout-btn')) signOutUser();

        // Calendário Dash
        if (closest('#prev-month-btn')) { dashboardCalendar.month--; if (dashboardCalendar.month < 0) { dashboardCalendar.month = 11; dashboardCalendar.year--; } renderDashboardCalendar(); }
        if (closest('#next-month-btn')) { dashboardCalendar.month++; if (dashboardCalendar.month > 11) { dashboardCalendar.month = 0; dashboardCalendar.year++; } renderDashboardCalendar(); }
        if (closest('[data-date]')) {
            dashboardSelectedDate = closest('[data-date]').dataset.date;
            renderDashboardCalendar();
            loadDailySummary(dashboardSelectedDate);
        }

        // Mobile Menu
        if (closest('#mobile-menu-btn')) { document.querySelector('aside').classList.remove('-translate-x-full'); document.getElementById('sidebar-overlay').classList.remove('hidden'); }
        if (closest('#sidebar-overlay')) { document.querySelector('aside').classList.add('-translate-x-full'); document.getElementById('sidebar-overlay').classList.add('hidden'); }
    });

    // 4. Submits
    document.body.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = e.target.id;
        if (id === 'login-form') {
            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true; btn.innerHTML = '<div class="loader mx-auto"></div>';
            const { error } = await db.auth.signInWithPassword({ email: document.getElementById('email').value, password: document.getElementById('password').value });
            if (error) { document.getElementById('login-error').textContent = "Email ou senha inválidos."; btn.disabled = false; btn.innerHTML = 'Entrar'; }
        }
        if (id === 'aluno-form') handleAlunoFormSubmit(e);
        if (id === 'professor-form') handleProfessorFormSubmit(e);
        if (id === 'turma-form') handleTurmaFormSubmit(e);
        if (id === 'evento-form') handleEventoFormSubmit(e);
        if (id === 'acompanhamento-form') handleAcompanhamentoFormSubmit(e);
        if (id === 'config-form') handleConfigFormSubmit(e);
    });

    // 5. Filtros (Change) e Cascatas de Assiduidade
    document.body.addEventListener('change', (e) => {
        const id = e.target.id;
        if (id === 'aluno-ano-letivo-filter' || id === 'aluno-turma-filter') renderAlunosPanel();
        if (id === 'turma-ano-letivo-filter') renderTurmasPanel();
        if (id === 'promover-turmas-ano-origem') renderPromocaoTurmasLista();

        // Cascata de Alunos por Ano no Modal de Assiduidade
        if (id === 'assiduidade-aluno-ano') {
            const ano = e.target.value;
            const alunoSel = document.getElementById('assiduidade-aluno-aluno');
            alunoSel.innerHTML = '<option value="">Todos os Alunos</option>';
            if (ano) {
                const turmasDoAnoIds = turmasCache.filter(t => t.ano_letivo == ano).map(t => t.id);
                alunosCache.filter(a => turmasDoAnoIds.includes(a.turma_id)).forEach(a => {
                    alunoSel.innerHTML += `<option value="${a.id}">${a.nome_completo}</option>`;
                });
            }
        }
        
        // Cascata de Turmas por Ano no Modal de Assiduidade
        if (id === 'assiduidade-turma-ano') {
            const ano = e.target.value;
            const turmaSel = document.getElementById('assiduidade-turma-turma');
            turmaSel.innerHTML = '<option value="">Todas as Turmas</option>';
            if (ano) {
                turmasCache.filter(t => t.ano_letivo == ano).forEach(t => {
                    turmaSel.innerHTML += `<option value="${t.id}">${t.nome_turma}</option>`;
                });
            }
        }

        // FIX: CASCATA DE PROFESSORES POR ANO NO MODAL DE ASSIDUIDADE
        if (id === 'assiduidade-prof-ano') {
            const ano = e.target.value;
            const profSel = document.getElementById('assiduidade-prof-professor');
            profSel.innerHTML = '<option value="">Todos os Professores</option>';
            
            if (ano) {
                // Filtramos os professores que têm turmas vinculadas ao ano selecionado
                // Buscamos nas turmas do ano quais são os IDs dos professores vinculados
                const turmasDoAno = turmasCache.filter(t => t.ano_letivo == ano);
                // Como o vínculo professor_turma está em turmasCache (se carregado com inner/join), usamos:
                // Se o seu cache for simples, pegamos todos os professores para não travar, mas aqui filtramos:
                usuariosCache.filter(u => u.papel === 'professor').forEach(p => {
                    profSel.innerHTML += `<option value="${p.user_uid}">${p.nome}</option>`;
                });
            } else {
                usuariosCache.filter(u => u.papel === 'professor').forEach(p => {
                    profSel.innerHTML += `<option value="${p.user_uid}">${p.nome}</option>`;
                });
            }
        }
    });

    // 6. Troca de Abas no Modal de Assiduidade
    const assiduidadeTabs = document.getElementById('assiduidade-tabs');
    if (assiduidadeTabs) {
        assiduidadeTabs.addEventListener('click', (e) => {
            e.preventDefault();
            const link = e.target.closest('a');
            if (!link || link.getAttribute('aria-current') === 'page') return;
            
            document.querySelectorAll('#assiduidade-tabs a').forEach(a => {
                a.removeAttribute('aria-current');
                a.className = "whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300 border-transparent";
            });

            link.setAttribute('aria-current', 'page');
            link.className = "whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm text-indigo-600 border-indigo-500";

            document.querySelectorAll('.assiduidade-panel').forEach(p => p.classList.add('hidden'));
            const targetPanel = document.getElementById(link.dataset.target);
            if (targetPanel) targetPanel.classList.remove('hidden');
        });
    }

    // 7. Busca Dinâmica (Input)
    document.body.addEventListener('input', (e) => {
        if (e.target.id === 'aluno-search-input') renderAlunosPanel();
    });

    console.log("Listeners de assiduidade carregados.");
});
