const params = new URLSearchParams(window.location.search);
const token = params.get('token') || '';
const tokenEl = document.getElementById('pwa-token');
if (tokenEl) {
    tokenEl.textContent = token ? `Token do dia: ${token}` : 'Token não informado.';
}
