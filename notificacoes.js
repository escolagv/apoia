// ===============================================================
// notificacoes.js - GESTÃO DE ALERTAS
// ===============================================================

async function loadNotifications() {
    const notificationBell = document.getElementById('notification-bell');
    const notificationList = document.getElementById('notification-list');
    const { data, count, error } = await safeQuery(db.from('alertas').select('*', { count: 'exact' }).eq('lido', false).order('created_at', { ascending: false }));
    if (error) return;
    if (count > 0) {
        notificationBell.classList.add('notification-badge');
        notificationBell.setAttribute('data-count', count);
        notificationList.innerHTML = data.map(a => `<div class="p-2 border-b hover:bg-gray-100 cursor-pointer text-sm notification-item" data-id="${a.id}">${a.mensagem}</div>`).join('');
    } else {
        notificationBell.classList.remove('notification-badge');
        notificationList.innerHTML = '<p class="text-sm text-gray-500 p-4 text-center">Nenhuma nova notificação.</p>';
    }
}

async function markNotificationAsRead(alertId) {
    await safeQuery(db.from('alertas').update({ lido: true }).eq('id', alertId));
    await loadNotifications();
}

async function markAllNotificationsAsRead() {
    await safeQuery(db.from('alertas').update({ lido: true }).eq('lido', false));
    await loadNotifications();
}
