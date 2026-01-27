// ===============================================================
// ui.js - GESTÃO DE INTERFACE E NAVEGAÇÃO
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

// FUNÇÃO VITAL: Troca os painéis do Admin (Alunos, Turmas, etc.)
function switchAdminPanel(targetPanelId) {
    // 1. Remove o destaque de todos os links do menu
    document.querySelectorAll('.admin-nav-link').forEach(link => {
        link.classList.remove('bg-gray-700');
    });

    // 2. Esconde todos os painéis
    document.querySelectorAll('.admin-panel').forEach(panel => {
        panel.classList.add('hidden');
    });

    // 3. Mostra o painel desejado
    const targetPanel = document.getElementById(targetPanelId);
    if (targetPanel) {
        targetPanel.classList.remove('hidden');
        // Adiciona destaque ao link clicado
        const activeLink = document.querySelector(`.admin-nav-link[data-target="${targetPanelId}"]`);
        if (activeLink) activeLink.classList.add('bg-gray-700');
    }

    // 4. Fecha o menu mobile se estiver aberto
    const aside = document.querySelector('aside');
    const overlay = document.getElementById('sidebar-overlay');
    if (aside) aside.classList.add('-translate-x-full');
    if (overlay) overlay.classList.add('hidden');
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
            if (typeof loadAdminData === 'function') await loadAdminData();
            if (typeof renderDashboardPanel === 'function') await renderDashboardPanel();
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

function closeModal(modalElement) {
    if (modalElement) modalElement.classList.add('hidden');
}

function closeAllModals() {
    document.querySelectorAll('[id$="-modal"]').forEach(m => m.classList.add('hidden'));
}
