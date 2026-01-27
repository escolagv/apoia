// ===============================================================
// ui.js - GESTÃO DE INTERFACE (VERSÃO REVISADA)
// ===============================================================

function showView(viewId) {
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

async function handleAuthChange(event, session) {
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
            showToast('Perfil inativo ou não encontrado.', true);
            await db.auth.signOut();
            return;
        }

        if (data.papel === 'admin') {
            document.getElementById('admin-info').textContent = data.nome || currentUser.email;
            
            // Tenta carregar os dados, mas não trava se o arquivo ainda estiver carregando
            if (typeof loadAdminData === 'function') await loadAdminData();
            if (typeof renderDashboardPanel === 'function') await renderDashboardPanel();
            if (typeof loadNotifications === 'function') await loadNotifications();
            
            showView('admin-view');
        } else {
            document.getElementById('professor-info').textContent = data.nome || currentUser.email;
            if (typeof loadProfessorData === 'function') await loadProfessorData(currentUser.id);
            showView('professor-view');
        }
        resetInactivityTimer();
    } catch (err) {
        console.error("Erro no AuthChange:", err);
        showView('login-view');
    }
}

function closeAllModals() {
    document.querySelectorAll('[id$="-modal"]').forEach(m => m.classList.add('hidden'));
}
