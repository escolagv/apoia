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
    const navLink = document.querySelector(`.admin-nav-link[data-target="${targetPanelId}"]`);
    if (navLink) navLink.classList.add('bg-gray-700');

    document.querySelectorAll('.admin-panel').forEach(p => p.classList.add('hidden'));
    const panel = document.getElementById(targetPanelId);
    if (panel) panel.classList.remove('hidden');

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
        showView('login-view');
        return;
    }
    try {
        currentUser = session.user;
        const { data, error } = await safeQuery(db.from('usuarios').select('papel, nome, status').eq('user_uid', currentUser.id).single());
        if (error || !data || data.status !== 'ativo') {
            showToast('Perfil inativo ou não encontrado.', true);
            await db.auth.signOut();
            return;
        }
        if (data.papel === 'admin') {
            document.getElementById('admin-info').textContent = data.nome || currentUser.email;
            await loadAdminData();
            if(typeof renderDashboardPanel === 'function') await renderDashboardPanel();
            if(typeof loadNotifications === 'function') await loadNotifications();
            showView('admin-view');
        } else {
            document.getElementById('professor-info').textContent = data.nome || currentUser.email;
            if(typeof loadProfessorData === 'function') await loadProfessorData(currentUser.id);
            showView('professor-view');
        }
        resetInactivityTimer();
    } catch (err) {
        showToast('Erro ao carregar seu perfil.', true);
        showView('login-view');
    }
}

function closeModal(modalElement) { if (modalElement) modalElement.classList.add('hidden'); }
function closeAllModals() { document.querySelectorAll('[id$="-modal"]').forEach(modal => modal.classList.add('hidden')); }
