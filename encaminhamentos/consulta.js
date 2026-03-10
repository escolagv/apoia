import { requireAdminSession, signOut } from './js/auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    const { session, profile } = await requireAdminSession();
    if (!session || !profile) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('user-name').textContent = profile.nome || session.user.email || '-';
    document.getElementById('logout-btn').addEventListener('click', async () => {
        await signOut();
        window.location.href = 'login.html';
    });

    const anoSelect = document.getElementById('search-ano');
    const codigoInput = document.getElementById('search-codigo');
    if (anoSelect) {
        const currentYear = new Date().getFullYear();
        anoSelect.innerHTML = '';
        for (let i = 0; i < 5; i += 1) {
            const year = currentYear + i;
            const option = document.createElement('option');
            option.value = String(year);
            option.textContent = String(year);
            if (i === 0) option.selected = true;
            anoSelect.appendChild(option);
        }
        setCodigoPrefix(anoSelect.value);
        anoSelect.addEventListener('change', () => {
            setCodigoPrefix(anoSelect.value);
        });
    } else if (codigoInput) {
        setCodigoPrefix(String(new Date().getFullYear()));
    }

    document.getElementById('search-button').addEventListener('click', redirectToSearchResults);
});

function redirectToSearchResults() {
    const params = new URLSearchParams();
    const estudante = document.getElementById('search-estudante').value;
    const professor = document.getElementById('search-professor').value;
    const data = document.getElementById('search-data').value;
    const registradoPor = document.getElementById('search-registrado').value;
    const ano = document.getElementById('search-ano')?.value;
    const codigo = document.getElementById('search-codigo')?.value;

    if (estudante) params.append('estudante', estudante);
    if (professor) params.append('professor', professor);
    if (data) params.append('data', data);
    if (registradoPor) params.append('registradoPor', registradoPor);
    if (ano) params.append('ano', ano);
    if (codigo) params.append('codigo', codigo);

    const query = params.toString();
    window.location.href = `encaminhamento.html?tab=consultar${query ? `&${query}` : ''}`;
}

function setCodigoPrefix(yearValue) {
    const codigoInput = document.getElementById('search-codigo');
    if (!codigoInput) return;
    const year = String(yearValue || new Date().getFullYear());
    const prefix = `ENC-${year}-`;
    const current = (codigoInput.value || '').trim();
    if (!current) {
        codigoInput.value = prefix;
        return;
    }
    if (/^ENC-\d{4}-/i.test(current)) {
        const suffix = current.replace(/^ENC-\d{4}-/i, '');
        codigoInput.value = prefix + suffix;
    }
}
