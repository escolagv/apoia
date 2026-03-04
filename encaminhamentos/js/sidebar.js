document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('aside');
    const overlay = document.getElementById('sidebar-overlay');
    const toggleBtn = document.getElementById('mobile-menu-btn');
    if (!sidebar || !overlay || !toggleBtn) return;

    const open = () => {
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
    };
    const close = () => {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
    };

    toggleBtn.addEventListener('click', open);
    overlay.addEventListener('click', close);

    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) {
            overlay.classList.add('hidden');
            sidebar.classList.remove('-translate-x-full');
        }
    });
});
