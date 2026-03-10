document.addEventListener('DOMContentLoaded', () => {
    const buttons = Array.from(document.querySelectorAll('[data-enc-tab]'));
    const panels = new Map(
        Array.from(document.querySelectorAll('[data-enc-panel]')).map(panel => [panel.dataset.encPanel, panel])
    );
    if (buttons.length === 0 || panels.size === 0) return;

    const params = new URLSearchParams(window.location.search);
    const hasEdit = params.has('editId') || params.has('scanId');
    const initialTab = hasEdit ? 'registrar' : (params.get('tab') || 'registrar');

    const setActive = (tab, updateUrl) => {
        buttons.forEach(btn => {
            const isActive = btn.dataset.encTab === tab;
            btn.classList.toggle('border-blue-600', isActive);
            btn.classList.toggle('text-blue-700', isActive);
            btn.classList.toggle('border-transparent', !isActive);
            btn.classList.toggle('text-gray-500', !isActive);
        });
        panels.forEach((panel, key) => {
            panel.classList.toggle('hidden', key !== tab);
        });
        if (updateUrl) {
            params.set('tab', tab);
            if (hasEdit) params.set('tab', 'registrar');
            const next = `${window.location.pathname}?${params.toString()}`;
            window.history.replaceState({}, document.title, next);
        }
    };

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            setActive(btn.dataset.encTab || 'registrar', true);
        });
    });

    setActive(initialTab, false);
});
