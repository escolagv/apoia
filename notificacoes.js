// ===============================================================
// notificacoes.js - GESTÃO DE ALERTAS
// ===============================================================

async function loadNotifications() {
    const bell = document.getElementById('notification-bell');
    const list = document.getElementById('notification-list');
    
    const { data, count, error } = await safeQuery(
        db.from('alertas').select('*', { count: 'exact' }).eq('lido', false).order('created_at', { ascending: false })
    );

    if (error) return;

    if (count > 0) {
        bell.classList.add('notification-badge');
        bell.setAttribute('data-count', count);
        list.innerHTML = data.map(a => `
            <div class="p-3 border-b hover:bg-gray-100 cursor-pointer text-sm notification-item" data-id="${a.id}">
                <p class="text-gray-800 font-medium">${a.mensagem}</p>
                <span class="text-xs text-gray-400">${new Date(a.created_at).toLocaleString()}</span>
            </div>`).join('');
    } else {
        bell.classList.remove('notification-badge');
        list.innerHTML = '<p class="p-8 text-center text-gray-400 text-sm">Nenhuma nova notificação.</p>';
    }
}

async function markNotificationAsRead(id) {
    await safeQuery(db.from('alertas').update({ lido: true }).eq('id', id));
    await loadNotifications();
}

async function markAllNotificationsAsRead() {
    await safeQuery(db.from('alertas').update({ lido: true }).eq('lido', false));
    await loadNotifications();
}
