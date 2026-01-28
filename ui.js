// ===============================================================
// ui.js - GESTÃO DE INTERFACE E NAVEGAÇÃO
// ===============================================================

function showView(viewId) {
    document.getElementById('loading-view').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    ['login-view', 'professor-view', 'admin-view'].forEach(id => {
        const view = document.getElementById(id);
        if (view) view.classList.add('hidden');
    });
    const viewToShow = document.getElementById(viewId);
    if (viewToShow) viewToShow.classList.remove('hidden');
}

function switchAdminPanel(targetPanelId) {
    document.querySelectorAll('.admin-nav-link').forEach(l => l.classList.remove('bg-gray-700'));
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.add('hidden'));
    const panel = document.getElementById(targetPanelId);
    if (panel) {
        panel.classList.remove('hidden');
        const activeLink = document.querySelector(`.admin-nav-link[data-target="${targetPanelId}"]`);
        if (activeLink) activeLink.classList.add('bg-gray-700');
    }
    document.querySelector('aside').classList.add('-translate-x-full');
    document.getElementById('sidebar-overlay').classList.add('hidden');
}

async function handleAuthChange(event, session) {
    if (event === 'PASSWORD_RECOVERY') {
        showView('login-view');
        document.getElementById('reset-password-modal').classList.remove('hidden');
        return;
    }
    if (!session) {
        resetApplicationState();
        clearTimeout(inactivityTimer);
        showView('login-view');
        return;
    }
    try {
        currentUser = session.user;
        const { data, error } = await safeQuery(db.from('usuarios').select('papel, nome, status').eq('user_uid', currentUser.id).single());
        if (error || !data || data.status !== 'ativo') {
            const errorMessage = !data ? 'Usuário sem perfil. Contate o suporte.' : 'Perfil inativo. Contate o suporte.';
            showToast(errorMessage, true);
            await db.auth.signOut();
            return;
        }
        if (data.papel === 'admin') {
            document.getElementById('admin-info').textContent = data.nome || currentUser.email;
            await loadAdminData();
            if (typeof renderDashboardPanel === 'function') await renderDashboardPanel();
            if (typeof loadNotifications === 'function') await loadNotifications();
            showView('admin-view');
        } else if (data.papel === 'professor') {
            document.getElementById('professor-info').textContent = data.nome || currentUser.email;
            await loadProfessorData(currentUser.id);
            showView('professor-view');
        }
        resetInactivityTimer();
    } catch (err) {
        showToast(err.message || 'Erro ao carregar perfil.', true);
        await signOutUser();
    }
}

function closeModal(modalElement) { if (modalElement) modalElement.classList.add('hidden'); }
function closeAllModals() { document.querySelectorAll('[id$="-modal"]').forEach(modal => modal.classList.add('hidden')); }
