import { db, safeQuery } from './js/core.js';
import { requireAdminSession, signOut } from './js/auth.js';

const state = {
    alunos: [],
    professores: [],
    turmas: [],
    anoLetivoAtual: null
};

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

    bindTabs();
    bindModals();
    await loadData();
});

function bindTabs() {
    const tabAlunos = document.getElementById('tab-alunos');
    const tabProfessores = document.getElementById('tab-professores');
    const alunosPanel = document.getElementById('alunos-panel');
    const profPanel = document.getElementById('professores-panel');
    const addAlunoBtn = document.getElementById('add-aluno-btn');
    const addProfBtn = document.getElementById('add-professor-btn');

    tabAlunos.addEventListener('click', () => {
        tabAlunos.classList.add('bg-slate-800', 'text-white');
        tabAlunos.classList.remove('bg-gray-200', 'text-gray-700');
        tabProfessores.classList.add('bg-gray-200', 'text-gray-700');
        tabProfessores.classList.remove('bg-slate-800', 'text-white');
        alunosPanel.classList.remove('hidden');
        profPanel.classList.add('hidden');
        addAlunoBtn.classList.remove('hidden');
        addProfBtn.classList.add('hidden');
    });

    tabProfessores.addEventListener('click', () => {
        tabProfessores.classList.add('bg-slate-800', 'text-white');
        tabProfessores.classList.remove('bg-gray-200', 'text-gray-700');
        tabAlunos.classList.add('bg-gray-200', 'text-gray-700');
        tabAlunos.classList.remove('bg-slate-800', 'text-white');
        profPanel.classList.remove('hidden');
        alunosPanel.classList.add('hidden');
        addProfBtn.classList.remove('hidden');
        addAlunoBtn.classList.add('hidden');
    });
}

function bindModals() {
    document.getElementById('add-aluno-btn').addEventListener('click', () => openAlunoModal());
    document.getElementById('add-professor-btn').addEventListener('click', () => openProfessorModal());

    document.getElementById('aluno-cancel').addEventListener('click', () => closeModal('aluno-modal'));
    document.getElementById('professor-cancel').addEventListener('click', () => closeModal('professor-modal'));

    document.getElementById('aluno-save').addEventListener('click', saveAluno);
    document.getElementById('professor-save').addEventListener('click', saveProfessor);

    document.getElementById('aluno-search').addEventListener('input', renderAlunos);
    document.getElementById('professor-search').addEventListener('input', renderProfessores);
    ['aluno-filtro-turma', 'aluno-filtro-status', 'aluno-filtro-origem', 'aluno-ordenacao']
        .forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', renderAlunos);
        });
    ['professor-filtro-status', 'professor-filtro-origem', 'professor-filtro-vinculo', 'professor-ordenacao']
        .forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', renderProfessores);
        });
}

async function loadData() {
    try {
        const [alunosRes, professoresRes, turmasRes] = await Promise.all([
            safeQuery(db.from('enc_alunos').select('id, nome_completo, matricula, turma_id, nome_responsavel, telefone, status, origem').order('nome_completo')),
            safeQuery(db.from('enc_professores').select('user_uid, nome, email, telefone, status, vinculo, origem').order('nome')),
            safeQuery(db.from('turmas').select('id, nome_turma, ano_letivo'))
        ]);
        state.alunos = alunosRes.data || [];
        state.professores = professoresRes.data || [];
        state.turmas = turmasRes.data || [];
        state.anoLetivoAtual = getAnoLetivoAtual(state.turmas);
        populateTurmas();
        populateFilters();
        renderAlunos();
        renderProfessores();
    } catch (err) {
        showMessage('Erro ao carregar dados: ' + (err?.message || err), true);
    }
}

function getAnoLetivoAtual(turmas) {
    const anos = (turmas || [])
        .map(t => parseInt(t.ano_letivo, 10))
        .filter(Number.isFinite);
    if (anos.length === 0) return null;
    return Math.max(...anos);
}

function populateTurmas() {
    const select = document.getElementById('aluno-turma');
    if (!select) return;
    select.innerHTML = '<option value="">Selecione...</option>';
    const turmasFiltradas = state.turmas.filter(t => !state.anoLetivoAtual || String(t.ano_letivo) === String(state.anoLetivoAtual));
    turmasFiltradas.forEach(t => {
        const option = document.createElement('option');
        option.value = t.id;
        option.textContent = t.nome_turma;
        select.appendChild(option);
    });
}

function populateFilters() {
    const turmaFilter = document.getElementById('aluno-filtro-turma');
    if (turmaFilter) {
        turmaFilter.innerHTML = '<option value="">Todas as turmas</option>';
        const turmasFiltradas = state.turmas
            .filter(t => !state.anoLetivoAtual || String(t.ano_letivo) === String(state.anoLetivoAtual))
            .sort((a, b) => (a.nome_turma || '').localeCompare(b.nome_turma || '', undefined, { numeric: true }));
        turmasFiltradas.forEach(t => {
            const option = document.createElement('option');
            option.value = String(t.id);
            option.textContent = t.nome_turma;
            turmaFilter.appendChild(option);
        });
    }
}

function renderAlunos() {
    const tbody = document.getElementById('alunos-table-body');
    const filtro = (document.getElementById('aluno-search')?.value || '').toLowerCase();
    const filtroTurma = document.getElementById('aluno-filtro-turma')?.value || '';
    const filtroStatus = document.getElementById('aluno-filtro-status')?.value || '';
    const filtroOrigem = document.getElementById('aluno-filtro-origem')?.value || '';
    const ordenacao = document.getElementById('aluno-ordenacao')?.value || 'turma';
    const turmasById = new Map(state.turmas.map(t => [Number(t.id), t.nome_turma]));
    const filtered = state.alunos.filter(a => {
        if (!filtro) return true;
        return (a.nome_completo || '').toLowerCase().includes(filtro) ||
            (a.matricula || '').toLowerCase().includes(filtro);
    }).filter(a => {
        if (filtroTurma && String(a.turma_id || '') !== String(filtroTurma)) return false;
        if (filtroStatus && String(a.status || '') !== String(filtroStatus)) return false;
        if (filtroOrigem && String(a.origem || '') !== String(filtroOrigem)) return false;
        return true;
    });

    filtered.sort((a, b) => {
        if (ordenacao === 'nome') {
            return (a.nome_completo || '').localeCompare(b.nome_completo || '', undefined, { sensitivity: 'base' });
        }
        const turmaA = turmasById.get(Number(a.turma_id)) || '';
        const turmaB = turmasById.get(Number(b.turma_id)) || '';
        const turmaCompare = turmaA.localeCompare(turmaB, undefined, { numeric: true, sensitivity: 'base' });
        if (turmaCompare !== 0) return turmaCompare;
        return (a.nome_completo || '').localeCompare(b.nome_completo || '', undefined, { sensitivity: 'base' });
    });
    tbody.innerHTML = filtered.map(a => `
        <tr class="border-b">
            <td class="py-2">${a.nome_completo || '-'}</td>
            <td class="py-2">${a.matricula || '-'}</td>
            <td class="py-2">${turmasById.get(Number(a.turma_id)) || '-'}</td>
            <td class="py-2">${a.status || '-'}</td>
            <td class="py-2">${a.origem || '-'}</td>
            <td class="py-2">
                <button class="text-blue-600 hover:underline mr-2" data-id="${a.id}" data-action="edit-aluno">Editar</button>
                <button class="text-amber-600 hover:underline mr-2" data-id="${a.id}" data-action="inativar-aluno">Inativar</button>
                <button class="text-red-600 hover:underline" data-id="${a.id}" data-action="delete-aluno">Excluir</button>
            </td>
        </tr>
    `).join('');

    tbody.querySelectorAll('button[data-action="edit-aluno"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const aluno = state.alunos.find(a => Number(a.id) === id);
            openAlunoModal(aluno);
        });
    });
    tbody.querySelectorAll('button[data-action="inativar-aluno"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = Number(btn.dataset.id);
            await toggleAlunoStatus(id, 'inativo');
        });
    });
    tbody.querySelectorAll('button[data-action="delete-aluno"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = Number(btn.dataset.id);
            await deleteAluno(id);
        });
    });
}

function renderProfessores() {
    const tbody = document.getElementById('professores-table-body');
    const filtro = (document.getElementById('professor-search')?.value || '').toLowerCase();
    const filtroStatus = document.getElementById('professor-filtro-status')?.value || '';
    const filtroOrigem = document.getElementById('professor-filtro-origem')?.value || '';
    const filtroVinculo = document.getElementById('professor-filtro-vinculo')?.value || '';
    const ordenacao = document.getElementById('professor-ordenacao')?.value || 'nome';
    const filtered = state.professores.filter(p => {
        if (!filtro) return true;
        return (p.nome || '').toLowerCase().includes(filtro) ||
            (p.email || '').toLowerCase().includes(filtro);
    }).filter(p => {
        if (filtroStatus && String(p.status || '') !== String(filtroStatus)) return false;
        if (filtroOrigem && String(p.origem || '') !== String(filtroOrigem)) return false;
        if (filtroVinculo && String(p.vinculo || '') !== String(filtroVinculo)) return false;
        return true;
    });

    filtered.sort((a, b) => {
        if (ordenacao === 'vinculo') {
            const vinculoCompare = (a.vinculo || '').localeCompare(b.vinculo || '', undefined, { sensitivity: 'base' });
            if (vinculoCompare !== 0) return vinculoCompare;
        }
        return (a.nome || '').localeCompare(b.nome || '', undefined, { sensitivity: 'base' });
    });
    tbody.innerHTML = filtered.map(p => `
        <tr class="border-b">
            <td class="py-2">${p.nome || '-'}</td>
            <td class="py-2">${p.email || '-'}</td>
            <td class="py-2">${p.vinculo || '-'}</td>
            <td class="py-2">${p.status || '-'}</td>
            <td class="py-2">${p.origem || '-'}</td>
            <td class="py-2">
                <button class="text-blue-600 hover:underline mr-2" data-id="${p.user_uid}" data-action="edit-prof">Editar</button>
                <button class="text-red-600 hover:underline" data-id="${p.user_uid}" data-action="inativar-prof">Inativar</button>
            </td>
        </tr>
    `).join('');

    tbody.querySelectorAll('button[data-action="edit-prof"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const prof = state.professores.find(p => p.user_uid === id);
            openProfessorModal(prof);
        });
    });
    tbody.querySelectorAll('button[data-action="inativar-prof"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            await toggleProfessorStatus(id, 'inativo');
        });
    });
}

function openAlunoModal(aluno = null) {
    document.getElementById('aluno-modal-title').textContent = aluno ? 'Editar Aluno' : 'Novo Aluno';
    document.getElementById('aluno-id').value = aluno?.id || '';
    document.getElementById('aluno-nome').value = aluno?.nome_completo || '';
    document.getElementById('aluno-matricula').value = aluno?.matricula || '';
    document.getElementById('aluno-turma').value = aluno?.turma_id || '';
    document.getElementById('aluno-responsavel').value = aluno?.nome_responsavel || '';
    document.getElementById('aluno-telefone').value = aluno?.telefone || '';
    document.getElementById('aluno-status').value = aluno?.status || 'ativo';
    openModal('aluno-modal');
}

function openProfessorModal(professor = null) {
    document.getElementById('professor-modal-title').textContent = professor ? 'Editar Professor' : 'Novo Professor';
    document.getElementById('professor-id').value = professor?.user_uid || '';
    document.getElementById('professor-nome').value = professor?.nome || '';
    document.getElementById('professor-email').value = professor?.email || '';
    document.getElementById('professor-telefone').value = professor?.telefone || '';
    document.getElementById('professor-vinculo').value = professor?.vinculo || 'efetivo';
    document.getElementById('professor-status').value = professor?.status || 'ativo';
    openModal('professor-modal');
}

async function saveAluno() {
    const id = document.getElementById('aluno-id').value;
    const payload = {
        nome_completo: document.getElementById('aluno-nome').value.trim(),
        matricula: document.getElementById('aluno-matricula').value.trim(),
        turma_id: document.getElementById('aluno-turma').value || null,
        nome_responsavel: document.getElementById('aluno-responsavel').value.trim(),
        telefone: document.getElementById('aluno-telefone').value.trim(),
        status: document.getElementById('aluno-status').value || 'ativo'
    };
    try {
        if (id) {
            await safeQuery(db.from('enc_alunos').update(payload).eq('id', id));
        } else {
            await safeQuery(db.from('enc_alunos').insert({ ...payload, origem: 'manual' }));
        }
        closeModal('aluno-modal');
        await loadData();
        showMessage('Aluno salvo com sucesso.');
    } catch (err) {
        showMessage('Erro ao salvar aluno: ' + (err?.message || err), true);
    }
}

async function saveProfessor() {
    const id = document.getElementById('professor-id').value;
    const payload = {
        nome: document.getElementById('professor-nome').value.trim(),
        email: document.getElementById('professor-email').value.trim(),
        telefone: document.getElementById('professor-telefone').value.trim(),
        vinculo: document.getElementById('professor-vinculo').value || 'efetivo',
        status: document.getElementById('professor-status').value || 'ativo'
    };
    try {
        if (id) {
            await safeQuery(db.from('enc_professores').update(payload).eq('user_uid', id));
        } else {
            await safeQuery(db.from('enc_professores').insert({ ...payload, origem: 'manual' }));
        }
        closeModal('professor-modal');
        await loadData();
        showMessage('Professor salvo com sucesso.');
    } catch (err) {
        showMessage('Erro ao salvar professor: ' + (err?.message || err), true);
    }
}

async function toggleAlunoStatus(id, status) {
    try {
        await safeQuery(db.from('enc_alunos').update({ status }).eq('id', id));
        await loadData();
        showMessage('Aluno inativado.');
    } catch (err) {
        showMessage('Erro ao inativar aluno: ' + (err?.message || err), true);
    }
}

async function deleteAluno(id) {
    const aluno = state.alunos.find(a => Number(a.id) === Number(id));
    if (!aluno) return;
    const warning = aluno.origem === 'apoia'
        ? 'Este aluno veio do APOIA. Se excluir, ele pode voltar na próxima sincronização.'
        : 'Esta ação é permanente e não pode ser desfeita.';
    const confirmDelete = window.confirm(`Deseja excluir o aluno "${aluno.nome_completo || ''}"?\n\n${warning}`);
    if (!confirmDelete) return;
    try {
        await safeQuery(db.from('enc_alunos').delete().eq('id', id));
        await loadData();
        showMessage('Aluno excluído.');
    } catch (err) {
        showMessage('Não foi possível excluir. Existem encaminhamentos vinculados. Use Inativar.', true);
    }
}

async function toggleProfessorStatus(id, status) {
    try {
        await safeQuery(db.from('enc_professores').update({ status }).eq('user_uid', id));
        await loadData();
        showMessage('Professor inativado.');
    } catch (err) {
        showMessage('Erro ao inativar professor: ' + (err?.message || err), true);
    }
}

function showMessage(message, isError = false) {
    const el = document.getElementById('cadastros-message');
    if (!el) return;
    el.textContent = message;
    el.className = `mb-4 text-sm ${isError ? 'text-red-600' : 'text-green-600'}`;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 4000);
}

function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
}
