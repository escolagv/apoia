// ===============================================================
// ui.js - GESTÃO DE INTERFACE E NAVEGAÇÃO
// ===============================================================

/**
 * Esconde o Loader e mostra a tela desejada
 */
function showView(viewId) {
    console.log(`Trocando visualização para: ${viewId}`);
    const loading = document.getElementById('loading-view');
    const app = document.getElementById('app-container');
    
    if (loading) loading.classList.add('hidden');
    if (app) app.classList.remove('hidden');

    ['login-view', 'professor-view', 'admin-view'].forEach(id => {
        const v = document.getElementById(id);
        if (v) v.classList.add('hidden');
    });

    const target = document.getElementById(viewId);
    if (target) target.classList.remove('hidden');
}

/**
 * Troca de painéis internos do Admin
 */
function switchAdminPanel(targetPanelId) {
    document.querySelectorAll('.admin-nav-link').forEach(link => link.classList.remove('bg-gray-700'));
    document.querySelectorAll('.admin-panel').forEach(panel => panel.classList.add('hidden'));

    const targetPanel = document.getElementById(targetPanelId);
    if (targetPanel) {
        targetPanel.classList.remove('hidden');
        const activeLink = document.querySelector(`.admin-nav-link[data-target="${targetPanelId}"]`);
        if (activeLink) activeLink.classList.add('bg-gray-700');
    }

    // Fecha sidebar mobile
    const aside = document.querySelector('aside');
    const overlay = document.getElementById('sidebar-overlay');
    if (aside) aside.classList.add('-translate-x-full');
    if (overlay) overlay.classList.add('hidden');
}

/**
 * Gerenciador de Autenticação
 */
async function handleAuthChange(event, session) {
    console.log("Evento de Autenticação:", event);

    if (event === 'PASSWORD_RECOVERY') {
        showView('login-view');
        document.getElementById('reset-password-modal')?.classList.remove('hidden');
        return;
    }

    if (!session) {
        showView('login-view');
        return;
    }

    try {
        currentUser = session.user;
        const { data, error } = await safeQuery(
            db.from('usuarios').select('papel, nome, status').eq('user_uid', currentUser.id).single()
        );

        if (error || !data || data.status !== 'ativo') {
            showToast('Acesso negado ou perfil inativo.', true);
            await db.auth.signOut();
            return;
        }

        if (data.papel === 'admin') {
            document.getElementById('admin-info').textContent = data.nome || currentUser.email;
            
            // Tenta carregar os dados, mas não deixa o loader infinito se falhar
            try {
                if (typeof loadAdminData === 'function') await loadAdminData();
                if (typeof renderDashboardPanel === 'function') await renderDashboardPanel();
                if (typeof loadNotifications === 'function') await loadNotifications();
            } catch (initErr) {
                console.error("Erro parcial na inicialização do Admin:", initErr);
            }
            
            showView('admin-view');
        } else {
            document.getElementById('professor-info').textContent = data.nome || currentUser.email;
            if (typeof loadProfessorData === 'function') await loadProfessorData(currentUser.id);
            showView('professor-view');
        }
        resetInactivityTimer();
    } catch (err) {
        console.error("Erro fatal no handleAuthChange:", err);
        showView('login-view');
    }
}

function closeModal(modalElement) { if (modalElement) modalElement.classList.add('hidden'); }
function closeAllModals() { document.querySelectorAll('[id$="-modal"]').forEach(m => m.classList.add('hidden')); }
