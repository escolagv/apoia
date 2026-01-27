// ===============================================================
// notificacoes.js - GESTÃO DE ALERTAS E NOTIFICAÇÕES
// ===============================================================

async function loadNotifications() {
    const notificationBell = document.getElementById('notification-bell');
    const notificationList = document.getElementById('notification-list');
    
    const { data, count, error } = await safeQuery(
        db.from('alertas').select('*', { count: 'exact' }).eq('lido', false).order('created_at', { ascending: false })
    );

    if (error) return;

    const clearBtn = document.getElementById('clear-notifications-btn');
    if (clearBtn) clearBtn.classList.toggle('hidden', count === 0);

    if (count > 0) {
        notificationBell.classList.add('notification-badge');
        notificationBell.setAttribute('data-count', count);
    } else {
        notificationBell.classList.remove('notification-badge');
        notificationBell.setAttribute('data-count', 0);
    }

    if (!data || data.length === 0) {
        notificationList.innerHTML = '<p class="text-sm text-gray-500 p-4 text-center">Nenhuma nova notificação.</p>';
    } else {
        notificationList.innerHTML = data.map(alert => `
            <div class="p-2 border-b hover:bg-gray-100 cursor-pointer text-sm text-gray-700 notification-item" data-id="${alert.id}">
                ${alert.mensagem}
            </div>`).join('');
    }
}

async function markNotificationAsRead(alertId) {
    const { error } = await safeQuery(db.from('alertas').update({ lido: true }).eq('id', alertId));
    if (!error) await loadNotifications();
}

async function markAllNotificationsAsRead() {
    const { error } = await safeQuery(db.from('alertas').update({ lido: true }).eq('lido', false));
    if (!error) await loadNotifications();
}
