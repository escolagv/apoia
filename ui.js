// ===============================================================
// ui.js - GESTÃO DE INTERFACE, MODAIS E NAVEGAÇÃO
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

function closeModal(modalElement) {
    if (modalElement) modalElement.classList.add('hidden');
}

function closeAllModals() {
    document.querySelectorAll('[id$="-modal"]').forEach(m => m.classList.add('hidden'));
}

// Lógica de Autenticação (Redirecionamento de View)
async function handleAuthChange(event, session) {
    if (event === 'PASSWORD_RECOVERY') {
        showView('login-view');
        document.getElementById('reset-password-modal').classList.remove('hidden');
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
            await loadAdminData();
            await renderDashboardPanel(); // Será definido em dashboard.js
            showView('admin-view');
        } else {
            document.getElementById('professor-info').textContent = data.nome || currentUser.email;
            await loadProfessorData(currentUser.id); // Será definido em professor-view.js
            showView('professor-view');
        }
        resetInactivityTimer();
    } catch (err) {
        showToast('Erro ao carregar perfil.', true);
        await db.auth.signOut();
    }
}

// Listeners de UI (Sidebar e Menus)
document.addEventListener('DOMContentLoaded', () => {
    // Menu Mobile
    const btnMobile = document.getElementById('mobile-menu-btn');
    const overlay = document.getElementById('sidebar-overlay');
    const aside = document.querySelector('aside');

    if (btnMobile) {
        btnMobile.addEventListener('click', () => {
            aside.classList.remove('-translate-x-full');
            overlay.classList.remove('hidden');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            aside.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
        });
    }

    // Toggle Senha Login
    const togglePass = document.getElementById('toggle-password-btn');
    const passInput = document.getElementById('password');
    if (togglePass && passInput) {
        togglePass.addEventListener('click', () => {
            const isPass = passInput.type === 'password';
            passInput.type = isPass ? 'text' : 'password';
            document.getElementById('eye-icon').classList.toggle('hidden', isPass);
            document.getElementById('eye-off-icon').classList.toggle('hidden', !isPass);
        });
    }
});
