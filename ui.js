// ===============================================================
// ui.js - GESTÃO DE INTERFACE E NAVEGAÇÃO
// ===============================================================

/**
 * Alterna entre as telas principais (Login, Professor, Admin)
 */
function showView(viewId) {
    const loading = document.getElementById('loading-view');
    const app = document.getElementById('app-container');
    
    if (loading) loading.classList.add('hidden');
    if (app) app.classList.remove('hidden');

    // Esconde todas as visualizações de nível superior
    ['login-view', 'professor-view', 'admin-view'].forEach(id => {
        const v = document.getElementById(id);
        if (v) v.classList.add('hidden');
    });

    // Mostra a visualização desejada
    const target = document.getElementById(viewId);
    if (target) target.classList.remove('hidden');
}

/**
 * Gerencia a troca de painéis dentro da área administrativa
 */
function switchAdminPanel(targetPanelId) {
    // 1. Remove o destaque (ativo) de todos os links do menu lateral
    document.querySelectorAll('.admin-nav-link').forEach(link => {
        link.classList.remove('bg-gray-700');
    });

    // 2. Esconde todos os painéis administrativos ativos
    document.querySelectorAll('.admin-panel').forEach(panel => {
        panel.classList.add('hidden');
    });

    // 3. Mostra o painel alvo
    const targetPanel = document.getElementById(targetPanelId);
    if (targetPanel) {
        targetPanel.classList.remove('hidden');
        
        // Aplica o destaque ao link clicado (usando o atributo data-target)
        const activeLink = document.querySelector(`.admin-nav-link[data-target="${targetPanelId}"]`);
        if (activeLink) activeLink.classList.add('bg-gray-700');
    }

    // 4. Garante que o menu mobile feche após o clique (UX para celular)
    const aside = document.querySelector('aside');
    const overlay = document.getElementById('sidebar-overlay');
    if (aside) aside.classList.add('-translate-x-full');
    if (overlay) overlay.classList.add('hidden');
}

/**
 * Reage a mudanças no estado de autenticação do Supabase
 */
async function handleAuthChange(event, session) {
    // Caso de recuperação de senha
    if (event === 'PASSWORD_RECOVERY') {
        showView('login-view');
        document.getElementById('reset-password-modal')?.classList.remove('hidden');
        return;
    }

    // Caso de logout ou sessão expirada
    if (!session) {
        showView('login-view');
        return;
    }

    try {
        currentUser = session.user;
        
        // Busca o perfil do usuário no banco para validar papel e status
        const { data, error } = await safeQuery(
            db.from('usuarios').select('papel, nome, status').eq('user_uid', currentUser.id).single()
        );

        if (error || !data || data.status !== 'ativo') {
            showToast('Seu perfil está inativo ou não foi encontrado. Contate o suporte.', true);
            await db.auth.signOut();
            return;
        }

        // --- Lógica de Inicialização por Papel (Role) ---
        if (data.papel === 'admin') {
            document.getElementById('admin-info').textContent = data.nome || currentUser.email;
            
            // Carrega os dados básicos e prepara a dashboard
            if (typeof loadAdminData === 'function') await loadAdminData();
            if (typeof renderDashboardPanel === 'function') await renderDashboardPanel();
            
            // ATENÇÃO: Carrega as notificações logo na entrada
            if (typeof loadNotifications === 'function') await loadNotifications();
            
            showView('admin-view');
        } else {
            // Lógica para Professores
            document.getElementById('professor-info').textContent = data.nome || currentUser.email;
            if (typeof loadProfessorData === 'function') await loadProfessorData(currentUser.id);
            
            showView('professor-view');
        }
        
        resetInactivityTimer();
        
    } catch (err) {
        console.error("Erro crítico no handleAuthChange:", err);
        showToast('Erro ao carregar ambiente de trabalho.', true);
        showView('login-view');
    }
}

/**
 * Funções auxiliares para Modais
 */
function closeModal(modalElement) {
    if (modalElement) modalElement.classList.add('hidden');
}

function closeAllModals() {
    document.querySelectorAll('[id$="-modal"]').forEach(m => m.classList.add('hidden'));
}
