const { createClient } = supabase;
const SUPABASE_URL = 'https://agivmrhwytnfprsjsvpy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnaXZtcmh3eXRuZnByc2pzdnB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNTQ3ODgsImV4cCI6MjA3MTgzMDc4OH0.1yL3PaS_anO76q3CUdLkdpNc72EDPYVG5F4cYy6ySS0';

if (SUPABASE_URL === 'SUA_URL_DO_PROJETO') throw new Error("Credenciais da Supabase não configuradas.");
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let turmasCache = [];
let usuariosCache = [];
let alunosCache = [];
let dashboardCalendar = { month: new Date().getMonth(), year: new Date().getFullYear() };
let apoiaCurrentPage = 1;
const apoiaItemsPerPage = 10;
let anosLetivosCache = [];
let dashboardSelectedDate;

// --- Mapeamento dos Elementos da UI ---
const loadingView = document.getElementById('loading-view');
const appContainer = document.getElementById('app-container');
const loginView = document.getElementById('login-view');
const loginError = document.getElementById('login-error');
const professorView = document.getElementById('professor-view');
const adminView = document.getElementById('admin-view');
const passwordInput = document.getElementById('password');
const togglePasswordBtn = document.getElementById('toggle-password-btn');
const eyeIcon = document.getElementById('eye-icon');
const eyeOffIcon = document.getElementById('eye-off-icon');
const toastContainer = document.getElementById('toast-container');
const turmaSelect = document.getElementById('professor-turma-select');
const dataSelect = document.getElementById('professor-data-select');
const listaAlunosContainer = document.getElementById('chamada-lista-alunos');
const chamadaHeader = document.getElementById('chamada-header');
const salvarChamadaBtn = document.getElementById('salvar-chamada-btn');
const alunosTableBody = document.getElementById('alunos-table-body');
const apoiaTableBody = document.getElementById('apoia-table-body');
const professoresTableBody = document.getElementById('professores-table-body');
const turmasTableBody = document.getElementById('turmas-table-body');
const eventosTableBody = document.getElementById('eventos-table-body');
const notificationBell = document.getElementById('notification-bell');
const notificationPanel = document.getElementById('notification-panel');
const notificationList = document.getElementById('notification-list');
const allModals = document.querySelectorAll('.fixed.inset-0.z-50');
const alunoModal = document.getElementById('aluno-modal');
const professorModal = document.getElementById('professor-modal');
const turmaModal = document.getElementById('turma-modal');
const eventoModal = document.getElementById('evento-modal');
const acompanhamentoModal = document.getElementById('acompanhamento-modal');
const correcaoChamadaModal = document.getElementById('correcao-chamada-modal');
const resetPasswordModal = document.getElementById('reset-password-modal');
const deleteConfirmModal = document.getElementById('delete-confirm-modal');
const alunoHistoricoModal = document.getElementById('aluno-historico-modal');
const promoverTurmasModal = document.getElementById('promover-turmas-modal');
const promoverTurmasConfirmModal = document.getElementById('promover-turmas-confirm-modal');
const assiduidadeModal = document.getElementById('assiduidade-modal');
const alunoForm = document.getElementById('aluno-form');
const professorForm = document.getElementById('professor-form');
const turmaForm = document.getElementById('turma-form');
const eventoForm = document.getElementById('evento-form');
const acompanhamentoForm = document.getElementById('acompanhamento-form');
const correcaoChamadaForm = document.getElementById('correcao-chamada-form');
const resetPasswordForm = document.getElementById('reset-password-form');
const correcaoTurmaSel = document.getElementById('correcao-turma-select');
const correcaoDataSel = document.getElementById('correcao-data-select');
const correcaoListaAlunos = document.getElementById('correcao-chamada-lista-alunos');
const alunoTurmaSelect = document.getElementById('aluno-turma');
const turmaProfessoresList = document.getElementById('turma-professores-list');
const acompanhamentoAlunoSelect = document.getElementById('acompanhamento-aluno-select');
const relatorioResultados = document.getElementById('relatorio-resultados');
const relatorioTableBody = document.getElementById('relatorio-table-body');
const imprimirRelatorioBtn = document.getElementById('imprimir-relatorio-btn');
const imprimirApoiaRelatorioBtn = document.getElementById('imprimir-apoia-relatorio-btn');
const configForm = document.getElementById('config-form');
const calendarMonthYear = document.getElementById('calendar-month-year');
const calendarGrid = document.getElementById('calendar-grid');

// --- Funções Auxiliares ---
function getLocalDateString() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

dashboardSelectedDate = getLocalDateString();

function showView(viewId) {
    loadingView.classList.add('hidden');
    appContainer.classList.remove('hidden');
    loginView.classList.add('hidden');
    professorView.classList.add('hidden');
    adminView.classList.add('hidden');
    if (document.getElementById(viewId)) {
        document.getElementById(viewId).classList.remove('hidden');
    }
}

async function signOutUser(message) {
    resetLoginFormState();
    if (message) showToast(message, true);
    await db.auth.signOut();
}

function resetApplicationState() {
    currentUser = null;
    turmasCache = [];
    usuariosCache = [];
    alunosCache = [];
    anosLetivosCache = [];
    dashboardCalendar = { month: new Date().getMonth(), year: new Date().getFullYear() };
    dashboardSelectedDate = getLocalDateString();
}

function resetLoginFormState() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        const loginButton = loginForm.querySelector('button[type="submit"]');
        loginForm.reset();
        loginError.textContent = '';
        if (loginButton) {
            loginButton.disabled = false;
            loginButton.innerHTML = 'Entrar';
        }
    }
}

function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = `toast p-4 rounded-lg shadow-lg text-white ${isError ? 'bg-red-500' : 'bg-green-500'}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('hide');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 5000);
}

function closeModal(modalElement) {
    if (modalElement) {
        modalElement.classList.add('hidden');
    }
}

function closeAllModals() {
    allModals.forEach(modal => modal.classList.add('hidden'));
}

async function safeQuery(queryBuilder) {
    const { data, error, count } = await queryBuilder;
    if (error) {
        if (error.message.includes('JWT') || error.code === '401' || error.status === 401 || (error.details && error.details.includes('revoked'))) {
            await signOutUser("Sua sessão expirou por segurança. Por favor, faça o login novamente.");
            return { data: null, error, count: null };
        }
        throw error;
    }
    return { data, error, count };
}

let inactivityTimer;
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        if (currentUser) {
            signOutUser("Sessão encerrada por inatividade.");
        }
    }, INACTIVITY_TIMEOUT);
}

// ===============================================================
// ================= LÓGICA DE AUTENTICAÇÃO ======================
// ===============================================================

async function handleAuthChange(session) {
    if (!session) {
        resetApplicationState();
        clearTimeout(inactivityTimer);
        showView('login-view');
        return;
    }
    try {
        currentUser = session.user;
        const { data, error } = await safeQuery(db.from('usuarios').select('papel, nome, status').eq('user_uid', currentUser.id).single());
        if (error || !data || data.status !== 'ativo') {
            const errorMessage = !data ? 'Seu usuário foi autenticado, mas não possui um perfil no sistema. Contate o suporte.' : 'Seu perfil de usuário não está ativo. Contate o suporte.';
            showToast(errorMessage, true);
            await db.auth.signOut();
            return;
        }
        const { papel, nome } = data;
        if (papel === 'admin') {
            document.getElementById('admin-info').textContent = nome || currentUser.email;
            await loadAdminData();
            await renderDashboardPanel();
            await loadNotifications();
            showView('admin-view');
        } else if (papel === 'professor') {
            document.getElementById('professor-info').textContent = nome || currentUser.email;
            await loadProfessorData(currentUser.id);
            showView('professor-view');
        } else {
            throw new Error('Papel de usuário desconhecido.');
        }
        resetInactivityTimer();
    } catch (err) {
        showToast(err.message || 'Erro ao carregar seu perfil. Tente novamente.', true);
        await signOutUser();
    }
}

db.auth.onAuthStateChange(async (event, session) => {
    if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        handleAuthChange(session);
    } else if (event === 'SIGNED_OUT') {
        handleAuthChange(null);
    }
    if (event === 'PASSWORD_RECOVERY') {
        showView('login-view');
        resetPasswordModal.classList.remove('hidden');
    }
});

// ===============================================================
// ============= LÓGICA DO PAINEL DO PROFESSOR ===================
// ===============================================================
async function loadProfessorData(professorUid) {
    const { data: rels } = await safeQuery(db.from('professores_turmas').select('turma_id').eq('professor_id', professorUid));
    if (!rels || rels.length === 0) return;
    const turmaIds = rels.map(r => r.turma_id);
    const { data } = await safeQuery(db.from('turmas').select('id, nome_turma').in('id', turmaIds));
    if (!data) return;
    turmaSelect.innerHTML = '<option value="">Selecione uma turma</option>';
    data.sort((a, b) => a.nome_turma.localeCompare(b.nome_turma, undefined, { numeric: true })).forEach(t => turmaSelect.innerHTML += `<option value="${t.id}">${t.nome_turma}</option>`);
}

async function loadChamada() {
    const turmaId = turmaSelect.value;
    const data = dataSelect.value;
    const isEditable = data === getLocalDateString();
    listaAlunosContainer.innerHTML = '';
    chamadaHeader.textContent = 'Selecione uma turma e data';
    salvarChamadaBtn.classList.add('hidden');
    if (!turmaId || !data) return;
    chamadaHeader.innerHTML = '<div class="loader mx-auto"></div>';
    const { data: alunos } = await safeQuery(db.from('alunos').select('id, nome_completo').eq('turma_id', turmaId).eq('status', 'ativo').order('nome_completo'));
    if (!alunos) return;
    if (alunos.length === 0) {
        chamadaHeader.textContent = 'Nenhum aluno ativo encontrado.';
        return;
    }
    const { data: presencas } = await safeQuery(db.from('presencas').select('aluno_id, status, justificativa').eq('turma_id', turmaId).eq('data', data));
    const presencasMap = new Map((presencas || []).map(p => [p.aluno_id, { status: p.status, justificativa: p.justificativa }]));
    alunos.forEach(aluno => {
        const presenca = presencasMap.get(aluno.id) || { status: 'presente', justificativa: null };
        const isJustificada = presenca.justificativa === 'Falta justificada';
        const isInjustificada = presenca.justificativa === 'Falta injustificada' || (!presenca.justificativa && presenca.status === 'falta');
        const alunoDiv = document.createElement('div');
        alunoDiv.className = 'p-3 bg-gray-50 rounded-lg';
        alunoDiv.dataset.alunoId = aluno.id;
        alunoDiv.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="font-medium">${aluno.nome_completo}</span>
                <div class="flex items-center gap-4">
                    <label class="flex items-center cursor-pointer"><input type="radio" name="status-${aluno.id}" value="presente" class="form-radio h-5 w-5 text-green-600 status-radio" ${presenca.status === 'presente' ? 'checked' : ''} ${!isEditable ? 'disabled' : ''}><span class="ml-2 text-sm">Presente</span></label>
                    <label class="flex items-center cursor-pointer"><input type="radio" name="status-${aluno.id}" value="falta" class="form-radio h-5 w-5 text-red-600 status-radio" ${presenca.status === 'falta' ? 'checked' : ''} ${!isEditable ? 'disabled' : ''}><span class="ml-2 text-sm">Falta</span></label>
                </div>
            </div>
            <div class="justificativa-container mt-2 pt-2 border-t border-gray-200 ${presenca.status === 'falta' ? 'flex' : 'hidden'} items-center gap-x-3">
                <div class="text-sm font-medium">Justificativa:</div>
                <div class="flex items-center gap-x-3">
                    <label class="flex items-center cursor-pointer"><input type="radio" name="just-${aluno.id}" value="Falta justificada" class="form-radio h-4 w-4" ${isJustificada ? 'checked' : ''} ${!isEditable ? 'disabled' : ''}><span class="ml-2 text-sm">Justificada</span></label>
                    <label class="flex items-center cursor-pointer"><input type="radio" name="just-${aluno.id}" value="Falta injustificada" class="form-radio h-4 w-4" ${isInjustificada ? 'checked' : ''} ${!isEditable ? 'disabled' : ''}><span class="ml-2 text-sm">Injustificada</span></label>
                </div>
            </div>`;
        listaAlunosContainer.appendChild(alunoDiv);
    });
    chamadaHeader.textContent = `Chamada para ${turmaSelect.options[turmaSelect.selectedIndex].text}`;
    if (isEditable) {
        salvarChamadaBtn.classList.remove('hidden');
    } else {
        showToast('Visualizando chamada. Apenas a chamada do dia atual pode ser editada.', false);
    }
}

async function saveChamada() {
    salvarChamadaBtn.disabled = true;
    salvarChamadaBtn.innerHTML = '<div class="loader mx-auto"></div>';
    const registros = Array.from(listaAlunosContainer.querySelectorAll('[data-aluno-id]')).map(row => {
        const status = row.querySelector('.status-radio:checked').value;
        let justificativa = null;
        if (status === 'falta') {
            const justRadio = row.querySelector(`input[name="just-${row.dataset.alunoId}"]:checked`);
            justificativa = justRadio ? justRadio.value : 'Falta injustificada';
        }
        return {
            aluno_id: parseInt(row.dataset.alunoId),
            turma_id: parseInt(turmaSelect.value),
            data: dataSelect.value,
            status: status,
            justificativa: justificativa,
            registrado_por_uid: currentUser.id
        };
    });
    const { error } = await safeQuery(db.from('presencas').upsert(registros, { onConflict: 'aluno_id, data' }));
    if (error) {
        console.error("Erro detalhado ao salvar chamada:", error);
        let userMessage = 'Erro ao salvar chamada: ' + error.message;
        if (error.message.includes('security policy')) {
            userMessage = "Falha de permissão ao salvar. Verifique no painel de admin se este professor está corretamente associado à turma.";
        }
        showToast(userMessage, true);
    } else {
        showToast('Chamada salva com sucesso!');
    }
    salvarChamadaBtn.disabled = false;
    salvarChamadaBtn.textContent = 'Salvar Chamada';
}

// --- CORREÇÃO DE CHAMADA (Admin) ---
async function loadCorrecaoChamada() {
    const turmaId = correcaoTurmaSel.value;
    const data = correcaoDataSel.value;
    correcaoListaAlunos.innerHTML = '';
    if (!turmaId || !data) {
        correcaoListaAlunos.innerHTML = '<p class="text-center text-gray-500">Selecione uma turma e uma data para carregar os alunos.</p>';
        return;
    }
    correcaoListaAlunos.innerHTML = '<div class="loader mx-auto"></div>';
    const { data: alunos } = await safeQuery(db.from('alunos').select('id, nome_completo').eq('turma_id', turmaId).eq('status', 'ativo').order('nome_completo'));
    if (!alunos) return;
    if (alunos.length === 0) {
        correcaoListaAlunos.innerHTML = '<p class="text-center text-gray-500">Nenhum aluno ativo encontrado para esta turma.</p>';
        return;
    }
    const { data: presencas } = await safeQuery(db.from('presencas').select('aluno_id, status, justificativa').eq('turma_id', turmaId).eq('data', data));
    const presencasMap = new Map((presencas || []).map(p => [p.aluno_id, { status: p.status, justificativa: p.justificativa }]));
    alunos.forEach(aluno => {
        const presenca = presencasMap.get(aluno.id) || { status: 'presente', justificativa: null };
        const isJustificada = presenca.justificativa === 'Falta justificada';
        const isInjustificada = presenca.justificativa === 'Falta injustificada' || (!presenca.justificativa && presenca.status === 'falta');
        const isOutros = !isJustificada && !isInjustificada && presenca.justificativa;
        const alunoDiv = document.createElement('div');
        alunoDiv.className = 'p-3 bg-gray-50 rounded-lg';
        alunoDiv.dataset.alunoId = aluno.id;
        alunoDiv.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="font-medium">${aluno.nome_completo}</span>
                <div class="flex items-center gap-4">
                    <label class="flex items-center cursor-pointer"><input type="radio" name="corr-status-${aluno.id}" value="presente" class="form-radio h-5 w-5 text-green-600 status-radio" ${presenca.status === 'presente' ? 'checked' : ''}><span class="ml-2 text-sm">Presente</span></label>
                    <label class="flex items-center cursor-pointer"><input type="radio" name="corr-status-${aluno.id}" value="falta" class="form-radio h-5 w-5 text-red-600 status-radio" ${presenca.status === 'falta' ? 'checked' : ''}><span class="ml-2 text-sm">Falta</span></label>
                </div>
            </div>
            <div class="justificativa-container mt-3 pt-3 border-t border-gray-200 ${presenca.status === 'falta' ? '' : 'hidden'}">
                <div class="text-sm font-medium mb-2">Justificativa:</div>
                <div class="flex flex-wrap items-center gap-x-4 gap-y-2 pl-2">
                    <label class="flex items-center"><input type="radio" name="corr-just-${aluno.id}" value="Falta justificada" class="form-radio h-4 w-4" ${isJustificada ? 'checked' : ''}><span class="ml-2 text-sm">Justificada</span></label>
                    <label class="flex items-center"><input type="radio" name="corr-just-${aluno.id}" value="Falta injustificada" class="form-radio h-4 w-4" ${isInjustificada ? 'checked' : ''}><span class="ml-2 text-sm">Injustificada</span></label>
                    <label class="flex items-center"><input type="radio" name="corr-just-${aluno.id}" value="outros" class="form-radio h-4 w-4" ${isOutros ? 'checked' : ''}><span class="ml-2 text-sm">Outros</span></label>
                    <input type="text" class="justificativa-outros-input p-1 border rounded-md text-sm flex-grow min-w-0" placeholder="Motivo..." value="${isOutros ? presenca.justificativa : ''}">
                </div>
            </div>`;
        correcaoListaAlunos.appendChild(alunoDiv);
    });
}


// ===============================================================
// ============= LÓGICA DO PAINEL DO ADMINISTRADOR ===============
// ===============================================================

async function loadNotifications() {
    const { data, error, count } = await safeQuery(db.from('alertas').select('*', { count: 'exact' }).eq('lido', false).order('created_at', { ascending: false }));
    if (error) {
        console.error("Erro ao buscar notificações:", error);
        return;
    }
    document.getElementById('clear-notifications-btn').classList.toggle('hidden', count === 0);
    if (count > 0) {
        notificationBell.classList.add('notification-badge');
        notificationBell.setAttribute('data-count', count);
    } else {
        notificationBell.classList.remove('notification-badge');
        notificationBell.setAttribute('data-count', 0);
    }
    if (data.length === 0) {
        notificationList.innerHTML = '<p class="text-sm text-gray-500 p-4 text-center">Nenhuma nova notificação.</p>';
    } else {
        notificationList.innerHTML = data.map(alert => `<div class="p-2 border-b hover:bg-gray-100 cursor-pointer text-sm text-gray-700 notification-item" data-id="${alert.id}">${alert.mensagem}</div>`).join('');
    }
}

async function markNotificationAsRead(alertId) {
    const { error } = await safeQuery(db.from('alertas').update({ lido: true }).eq('id', alertId));
    if (error) showToast("Erro ao marcar notificação como lida.", true);
    else await loadNotifications();
}

async function markAllNotificationsAsRead() {
    const { error } = await safeQuery(db.from('alertas').update({ lido: true }).eq('lido', false));
    if (error) showToast("Erro ao limpar notificações.", true);
    else await loadNotifications();
}

async function loadAdminData() {
    const { data: turmas } = await safeQuery(db.from('turmas').select('id, nome_turma, ano_letivo'));
    turmasCache = (turmas || []).sort((a, b) => a.nome_turma.localeCompare(b.nome_turma, undefined, { numeric: true }));
    const { data: users } = await safeQuery(db.from('usuarios').select('id, user_uid, nome, papel, email_confirmado').in('papel', ['professor', 'admin']).eq('status', 'ativo'));
    usuariosCache = (users || []).sort((a, b) => a.nome.localeCompare(b.nome));
    const { data: allAlunos } = await safeQuery(db.from('alunos').select('id, nome_completo, turma_id').eq('status', 'ativo'));
    alunosCache = (allAlunos || []).sort((a, b) => a.nome_completo.localeCompare(b.nome_completo));
    const { data: anos } = await safeQuery(db.rpc('get_distinct_ano_letivo'));
    anosLetivosCache = anos ? anos.sort((a, b) => b - a) : [];
}

// --- Dashboard ---
async function renderDashboardPanel() {
    await loadDailySummary(dashboardSelectedDate);
    await renderDashboardCalendar();
    const { count } = await safeQuery(db.from('apoia_encaminhamentos').select('*', { count: 'exact', head: true }).eq('status', 'Em andamento'));
    document.getElementById('dashboard-acompanhamento').textContent = count === null ? 'N/A' : count;
}

async function loadDailySummary(selectedDate) {
    const presencasEl = document.getElementById('dashboard-presencas');
    const faltasEl = document.getElementById('dashboard-faltas');
    const ausentesListEl = document.getElementById('dashboard-ausentes-list');
    presencasEl.textContent = '...';
    faltasEl.textContent = '...';
    ausentesListEl.innerHTML = '<li>Carregando...</li>';
    const { data } = await safeQuery(db.from('presencas').select('justificativa, alunos ( id, nome_completo ), turmas ( nome_turma )').eq('data', selectedDate).eq('status', 'falta'));
    if (!data) {
        ausentesListEl.innerHTML = `<li>Erro ao carregar dados.</li>`;
        return;
    }
    const { count: totalPresencas } = await safeQuery(db.from('presencas').select('*', { count: 'exact', head: true }).eq('data', selectedDate).eq('status', 'presente'));
    presencasEl.textContent = totalPresencas || 0;
    faltasEl.textContent = data.length;
    if (data.length === 0) {
        ausentesListEl.innerHTML = '<li>Nenhum aluno ausente.</li>';
    } else {
        ausentesListEl.innerHTML = data.map(a => {
            const justificativaTexto = a.justificativa ? `- ${a.justificativa}` : '';
            return `<li><a href="#" class="text-blue-600 hover:underline dashboard-aluno-link" data-aluno-id="${a.alunos.id}">${a.alunos.nome_completo}</a> <span class="text-gray-500">(${a.turmas.nome_turma}) ${justificativaTexto}</span></li>`
        }).join('');
    }
}

async function renderDashboardCalendar() {
    const { month, year } = dashboardCalendar;
    calendarMonthYear.textContent = new Date(year, month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    calendarGrid.innerHTML = '';
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
    const { data: eventos } = await safeQuery(db.from('eventos').select('*').or(`data.gte.${monthStart},data_fim.gte.${monthStart}`).or(`data.lte.${monthEnd},data_fim.lte.${monthEnd}`));
    let html = '';
    for (let i = 0; i < firstDayOfMonth; i++) {
        html += '<div></div>';
    }
    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month, day);
        const dayOfWeek = currentDate.getDay();
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        let dayEvent = null;
        if (eventos) {
            dayEvent = eventos.find(e => {
                const startDate = new Date(e.data + 'T00:00:00');
                const endDate = e.data_fim ? new Date(e.data_fim + 'T00:00:00') : startDate;
                return currentDate >= startDate && currentDate <= endDate;
            });
        }
        let dayContainerClass = 'calendar-day-container';
        let daySpanClass = 'calendar-day-content';
        let tooltipHtml = '';
        if (dayEvent) {
            daySpanClass += ' calendar-day-event';
            dayContainerClass += ' has-tooltip relative';
            tooltipHtml = `<div class="tooltip">${dayEvent.descricao}</div>`;
        } else if (dayOfWeek === 0 || dayOfWeek === 6) {
            daySpanClass += ' calendar-day-weekend';
        }
        if (dateString === dashboardSelectedDate) {
            dayContainerClass += ' calendar-day-selected';
        }
        html += `<div class="${dayContainerClass}" data-date="${dateString}">${tooltipHtml}<span class="${daySpanClass}">${day}</span></div>`;
    }
    calendarGrid.innerHTML = html;
}

// --- Gerenciamento de Alunos ---
async function renderAlunosPanel(options = {}) {
    const { defaultToLatestYear = false } = options;
    const searchTerm = document.getElementById('aluno-search-input').value;
    const anoLetivoFilter = document.getElementById('aluno-ano-letivo-filter');
    const alunoTurmaFilter = document.getElementById('aluno-turma-filter');
    let currentAnoVal = anoLetivoFilter.value;
    anoLetivoFilter.innerHTML = '<option value="">Todos os Anos</option>';
    anosLetivosCache.filter(ano => ano != null).forEach(ano => {
        anoLetivoFilter.innerHTML += `<option value="${ano}">${ano}</option>`;
    });
    if (defaultToLatestYear && anosLetivosCache.length > 0) {
        anoLetivoFilter.value = anosLetivosCache[0];
    } else {
        anoLetivoFilter.value = currentAnoVal;
    }
    currentAnoVal = anoLetivoFilter.value;
    const currentTurmaVal = defaultToLatestYear ? '' : alunoTurmaFilter.value;
    alunoTurmaFilter.innerHTML = '<option value="">Todas as Turmas</option>';
    if (currentAnoVal) {
        turmasCache.filter(t => t.ano_letivo == currentAnoVal).forEach(t => {
            alunoTurmaFilter.innerHTML += `<option value="${t.id}">${t.nome_turma}</option>`;
        });
    }
    alunoTurmaFilter.value = currentTurmaVal;
    alunosTableBody.innerHTML = '<tr><td colspan="7" class="p-4 text-center">Carregando...</td></tr>';
    let queryBuilder = db.from('alunos').select(`*, turmas ( nome_turma, ano_letivo )`).order('turma_id', { nullsFirst: false }).order('status', { ascending: true }).order('nome_completo', { ascending: true });
    if (searchTerm) {
        queryBuilder = queryBuilder.or(`nome_completo.ilike.%${searchTerm}%,matricula.ilike.%${searchTerm}%,nome_responsavel.ilike.%${searchTerm}%`);
    }
    if (anoLetivoFilter.value) {
        queryBuilder = queryBuilder.eq('turmas.ano_letivo', anoLetivoFilter.value);
    }
    if (alunoTurmaFilter.value) {
        queryBuilder = queryBuilder.eq('turma_id', alunoTurmaFilter.value);
    }
    const { data, error } = await safeQuery(queryBuilder);
    if (error) {
        alunosTableBody.innerHTML = '<tr><td colspan="7" class="p-4 text-center text-red-500">Erro ao carregar.</td></tr>';
        return;
    }
    if (data.length === 0) {
        alunosTableBody.innerHTML = '<tr><td colspan="7" class="p-4 text-center">Nenhum aluno encontrado.</td></tr>';
        return;
    }
    alunosTableBody.innerHTML = data.map(aluno => {
        let statusClass = 'bg-gray-100 text-gray-800';
        if (aluno.status === 'ativo') statusClass = 'bg-green-100 text-green-800';
        else if (aluno.status === 'inativo') statusClass = 'bg-red-100 text-red-800';
        else if (aluno.status === 'transferido') statusClass = 'bg-blue-100 text-blue-800';
        return `
        <tr class="border-b">
            <td class="p-3">${aluno.nome_completo}</td>
            <td class="p-3">${aluno.matricula || ''}</td>
            <td class="p-3">${aluno.turmas ? aluno.turmas.nome_turma : 'Sem turma'}</td>
            <td class="p-3">${aluno.nome_responsavel || ''}</td>
            <td class="p-3">${aluno.telefone || ''}</td>
            <td class="p-3"><span class="px-2 py-1 text-xs font-semibold rounded-full ${statusClass}">${aluno.status}</span></td>
            <td class="p-3">
                <button class="text-blue-600 hover:underline edit-aluno-btn" data-id="${aluno.id}">Editar</button>
                <button class="text-indigo-600 hover:underline ml-2 historico-aluno-btn" data-id="${aluno.id}">Ver Histórico</button>
            </td>
        </tr>
        `}).join('');
}

async function openAlunoModal(editId = null) {
    alunoForm.reset();
    alunoTurmaSelect.innerHTML = '<option value="">Selecione...</option>';
    turmasCache.forEach(t => alunoTurmaSelect.innerHTML += `<option value="${t.id}">${t.nome_turma} (${t.ano_letivo})</option>`);
    document.getElementById('aluno-delete-container').classList.add('hidden');
    if (editId) {
        const { data } = await safeQuery(db.from('alunos').select('*').eq('id', editId).single());
        document.getElementById('aluno-modal-title').textContent = 'Editar Aluno';
        document.getElementById('aluno-id').value = data.id;
        document.getElementById('aluno-nome').value = data.nome_completo;
        document.getElementById('aluno-matricula').value = data.matricula;
        alunoTurmaSelect.value = data.turma_id;
        document.getElementById('aluno-telefone').value = data.telefone;
        document.getElementById('aluno-email').value = data.email;
        document.getElementById('aluno-responsavel').value = data.nome_responsavel;
        document.getElementById('aluno-status').value = data.status;
        document.getElementById('aluno-delete-container').classList.remove('hidden');
    } else {
        document.getElementById('aluno-modal-title').textContent = 'Adicionar Aluno';
        document.getElementById('aluno-id').value = '';
    }
    alunoModal.classList.remove('hidden');
}

async function handleAlunoFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('aluno-id').value;
    const alunoData = {
        nome_completo: document.getElementById('aluno-nome').value,
        matricula: document.getElementById('aluno-matricula').value,
        turma_id: document.getElementById('aluno-turma').value || null,
        telefone: document.getElementById('aluno-telefone').value,
        email: document.getElementById('aluno-email').value,
        nome_responsavel: document.getElementById('aluno-responsavel').value,
        status: document.getElementById('aluno-status').value
    };
    const queryBuilder = id ? db.from('alunos').update(alunoData).eq('id', id) : db.from('alunos').insert(alunoData);
    const { error } = await safeQuery(queryBuilder);
    if (error) {
        showToast('Erro ao salvar o aluno: ' + error.message, true);
    } else {
        showToast('Aluno salvo com sucesso!');
        closeModal(alunoModal);
        await renderAlunosPanel();
    }
}

// --- Acompanhamento APOIA ---
async function renderApoiaPanel(page = 1) {
    apoiaCurrentPage = page;
    apoiaTableBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center">Carregando...</td></tr>';
    const { count } = await safeQuery(db.from('apoia_encaminhamentos').select('*', { count: 'exact', head: true }));
    const totalPages = Math.ceil(count / apoiaItemsPerPage);
    const from = (page - 1) * apoiaItemsPerPage;
    const to = from + apoiaItemsPerPage - 1;
    const { data, error } = await safeQuery(db.from('apoia_encaminhamentos').select(`*, alunos(nome_completo)`).order('status', { ascending: true }).order('data_encaminhamento', { ascending: false }).range(from, to));
    if (error) {
        apoiaTableBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-red-500">Erro ao carregar.</td></tr>';
        return;
    }
    if (data.length === 0) {
        apoiaTableBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center">Nenhum aluno em acompanhamento.</td></tr>';
        document.getElementById('apoia-pagination').innerHTML = '';
        return;
    }
    apoiaTableBody.innerHTML = data.map(item => `
        <tr class="border-b">
            <td class="p-3">${item.alunos.nome_completo}</td>
            <td class="p-3">${new Date(item.data_encaminhamento + 'T00:00:00').toLocaleDateString()}</td>
            <td class="p-3">${item.motivo}</td>
            <td class="p-3"><span class="px-2 py-1 text-xs font-semibold rounded-full ${item.status === 'Finalizado' ? 'bg-gray-200 text-gray-800' : 'bg-yellow-100 text-yellow-800'}">${item.status}</span></td>
            <td class="p-3"><button class="text-blue-600 hover:underline edit-acompanhamento-btn" data-id="${item.id}">Editar</button></td>
        </tr>`).join('');
    renderApoiaPagination(totalPages, page);
}

function renderApoiaPagination(totalPages, currentPage) {
    const paginationContainer = document.getElementById('apoia-pagination');
    paginationContainer.innerHTML = '';
    if (totalPages <= 1) return;
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.dataset.page = i;
        pageButton.className = `px-3 py-1 rounded-md text-sm font-medium ${ i === currentPage ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-200'}`;
        paginationContainer.appendChild(pageButton);
    }
}

async function openAcompanhamentoModal(editId = null) {
    acompanhamentoForm.reset();
    const alunoSelect = document.getElementById('acompanhamento-aluno-select');
    const deleteContainer = document.getElementById('acompanhamento-delete-container');
    deleteContainer.classList.add('hidden');
    if (editId) {
        const { data } = await safeQuery(db.from('apoia_encaminhamentos').select('*, alunos(nome_completo)').eq('id', editId).single());
        document.getElementById('acompanhamento-modal-title').textContent = 'Editar Acompanhamento';
        alunoSelect.innerHTML = `<option value="${data.aluno_id}">${data.alunos.nome_completo}</option>`;
        alunoSelect.disabled = true;
        document.getElementById('acompanhamento-id').value = data.id;
        document.getElementById('acompanhamento-motivo').value = data.motivo;
        document.getElementById('acompanhamento-status').value = data.status;
        document.getElementById('acompanhamento-observacoes').value = data.observacoes;
        deleteContainer.classList.remove('hidden');
    } else {
        document.getElementById('acompanhamento-modal-title').textContent = 'Adicionar Aluno ao Acompanhamento';
        alunoSelect.innerHTML = '<option value="">Selecione um aluno...</option>';
        alunosCache.forEach(a => alunoSelect.innerHTML += `<option value="${a.id}">${a.nome_completo}</option>`);
        alunoSelect.disabled = false;
        document.getElementById('acompanhamento-id').value = '';
    }
    acompanhamentoModal.classList.remove('hidden');
}

async function handleAcompanhamentoFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('acompanhamento-id').value;
    const acompanhamentoData = {
        aluno_id: document.getElementById('acompanhamento-aluno-select').value,
        data_encaminhamento: getLocalDateString(),
        motivo: document.getElementById('acompanhamento-motivo').value,
        status: document.getElementById('acompanhamento-status').value,
        observacoes: document.getElementById('acompanhamento-observacoes').value
    };
    const queryBuilder = id ? db.from('apoia_encaminhamentos').update(acompanhamentoData).eq('id', id) : db.from('apoia_encaminhamentos').insert(acompanhamentoData);
    const { error } = await safeQuery(queryBuilder);
    if (error) {
        showToast('Erro ao salvar acompanhamento: ' + error.message, true);
    } else {
        showToast('Acompanhamento salvo com sucesso!');
        closeModal(acompanhamentoModal);
        await renderApoiaPanel();
    }
}

async function handleGerarApoiaRelatorio() {
    const tableBody = document.getElementById('apoia-relatorio-table-body');
    tableBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center">Gerando relatório...</td></tr>';
    imprimirApoiaRelatorioBtn.classList.add('hidden');
    let queryBuilder = db.from('apoia_encaminhamentos').select(`*, alunos(nome_completo)`).order('data_encaminhamento');
    const dataInicio = document.getElementById('apoia-relatorio-data-inicio').value;
    const dataFim = document.getElementById('apoia-relatorio-data-fim').value;
    const statusFiltro = document.getElementById('apoia-relatorio-status').value;
    if (dataInicio) queryBuilder = queryBuilder.gte('data_encaminhamento', dataInicio);
    if (dataFim) queryBuilder = queryBuilder.lte('data_encaminhamento', dataFim);
    if (statusFiltro) queryBuilder = queryBuilder.eq('status', statusFiltro);
    const { data, error } = await safeQuery(queryBuilder);
    if (error) {
        tableBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-red-500">Erro ao gerar relatório.</td></tr>';
        return;
    }
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center">Nenhum registro encontrado.</td></tr>';
        return;
    }
    tableBody.innerHTML = data.map(item => `
        <tr class="border-b">
            <td class="p-3">${item.alunos.nome_completo}</td>
            <td class="p-3">${new Date(item.data_encaminhamento + 'T00:00:00').toLocaleDateString()}</td>
            <td class="p-3">${item.motivo}</td>
            <td class="p-3">${item.status}</td>
            <td class="p-3">${item.observacoes || ''}</td>
        </tr>`).join('');
    imprimirApoiaRelatorioBtn.classList.remove('hidden');
}

// --- Gerenciamento de Professores ---
async function renderProfessoresPanel() {
    professoresTableBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center">Carregando...</td></tr>';
    const { data, error } = await safeQuery(db.from('usuarios').select('id, user_uid, nome, email, status, email_confirmado').eq('papel', 'professor').order('status', { ascending: true }).order('nome', { ascending: true }));
    if (error) {
        professoresTableBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-red-500">Erro ao carregar.</td></tr>';
        return;
    }
    if (data.length === 0) {
        professoresTableBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center">Nenhum professor cadastrado.</td></tr>';
        return;
    }
    professoresTableBody.innerHTML = data.map(p => {
        const emailStatusIndicator = p.email_confirmado ? `<div class="has-tooltip relative"><div class="w-3 h-3 bg-green-500 rounded-full"></div><div class="tooltip">E-mail Confirmado</div></div>` : `<div class="has-tooltip relative"><div class="w-3 h-3 bg-red-500 rounded-full"></div><div class="tooltip">Confirmação Pendente</div></div>`;
        return `
        <tr class="border-b">
            <td class="p-3">${p.nome}</td>
            <td class="p-3">${p.email || 'Não informado'}</td>
            <td class="p-3"><span class="px-2 py-1 text-xs font-semibold rounded-full ${p.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${p.status}</span></td>
            <td class="p-3 flex justify-center items-center">${emailStatusIndicator}</td>
            <td class="p-3">
                <button class="text-blue-600 hover:underline mr-4 edit-professor-btn" data-id="${p.id}">Editar</button>
                <button class="text-orange-600 hover:underline reset-password-btn" data-email="${p.email}">Resetar Senha</button>
            </td>
        </tr>
        `}).join('');
}

async function openProfessorModal(editId = null) {
    professorForm.reset();
    const passwordContainer = document.getElementById('password-field-container');
    const statusContainer = document.getElementById('status-field-container');
    document.getElementById('professor-delete-container').classList.add('hidden');
    if (editId) {
        const { data } = await safeQuery(db.from('usuarios').select('*').eq('id', editId).single());
        document.getElementById('professor-modal-title').textContent = 'Editar Professor';
        document.getElementById('professor-id').value = data.id;
        document.getElementById('professor-nome').value = data.nome;
        document.getElementById('professor-email').value = data.email;
        document.getElementById('professor-status').value = data.status;
        passwordContainer.classList.add('hidden');
        statusContainer.classList.remove('hidden');
        document.getElementById('professor-delete-container').classList.remove('hidden');
    } else {
        document.getElementById('professor-modal-title').textContent = 'Adicionar Professor';
        document.getElementById('professor-id').value = '';
        passwordContainer.classList.remove('hidden');
        statusContainer.classList.add('hidden');
    }
    professorModal.classList.remove('hidden');
}

async function handleProfessorFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('professor-id').value;
    const nome = document.getElementById('professor-nome').value;
    const email = document.getElementById('professor-email').value;
    if (id) {
        const status = document.getElementById('professor-status').value;
        const { error } = await safeQuery(db.from('usuarios').update({ nome, email, status }).eq('id', id));
        if (error) {
            showToast('Erro ao atualizar professor: ' + error.message, true);
        } else {
            showToast('Professor atualizado com sucesso!');
        }
    } else {
        const password = document.getElementById('professor-password').value;
        if (password.length < 6) {
            showToast('A senha temporária deve ter no mínimo 6 caracteres.', true);
            return;
        }
        const { data: authData, error: authError } = await db.auth.signUp({ email, password });
        if (authError) {
            showToast('Erro ao criar login do professor: ' + authError.message, true);
            return;
        }
        const { error: profileError } = await safeQuery(db.from('usuarios').insert({ user_uid: authData.user.id, nome: nome, email: email, papel: 'professor', status: 'ativo' }));
        if (profileError) {
            showToast('Login criado, mas falha ao criar perfil.', true);
        } else {
            showToast('Professor criado! E-mail de confirmação enviado.');
        }
    }
    closeModal(professorModal);
    await loadAdminData();
    await renderProfessoresPanel();
}

async function handleResetPassword(email) {
    if (!email) {
        showToast('Este professor não tem um e-mail cadastrado.', true);
        return;
    }
    if (confirm(`Deseja enviar um link de redefinição de senha para ${email}?`)) {
        const { error } = await db.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.href.split('#')[0]
        });
        if (error) {
            showToast('Erro ao enviar e-mail: ' + error.message, true);
        } else {
            showToast('E-mail de redefinição enviado com sucesso!');
        }
    }
}

// --- Gerenciamento de Turmas ---
async function renderTurmasPanel() {
    const anoLetivoFilter = document.getElementById('turma-ano-letivo-filter');
    anoLetivoFilter.innerHTML = '<option value="">Todos os Anos</option>';
    anosLetivosCache.forEach(ano => anoLetivoFilter.innerHTML += `<option value="${ano}">${ano}</option>`);
    turmasTableBody.innerHTML = '<tr><td colspan="3" class="p-4 text-center">Carregando...</td></tr>';
    let queryBuilder = db.from('turmas').select(`id, nome_turma, ano_letivo, professores_turmas(usuarios(nome))`);
    if (anoLetivoFilter.value) {
        queryBuilder = queryBuilder.eq('ano_letivo', anoLetivoFilter.value);
    }
    const { data, error } = await safeQuery(queryBuilder);
    if (error) {
        turmasTableBody.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-red-500">Erro ao carregar.</td></tr>';
        return;
    }
    data.sort((a, b) => a.nome_turma.localeCompare(b.nome_turma, undefined, { numeric: true }));
    if (data.length === 0) {
        turmasTableBody.innerHTML = '<tr><td colspan="3" class="p-4 text-center">Nenhuma turma encontrada.</td></tr>';
        return;
    }
    turmasTableBody.innerHTML = data.map(t => {
        const profs = t.professores_turmas.map(pt => pt.usuarios ? pt.usuarios.nome : 'Professor Removido').join(', ');
        return `
        <tr class="border-b">
            <td class="p-3">${t.nome_turma} (${t.ano_letivo})</td>
            <td class="p-3">${profs || 'Sem professor'}</td>
            <td class="p-3">
                <button class="text-blue-600 hover:underline mr-4 edit-turma-btn" data-id="${t.id}">Editar</button>
                <button class="text-red-600 hover:underline delete-turma-btn" data-id="${t.id}">Excluir</button>
            </td>
        </tr>
        `}).join('');
}

async function openTurmaModal(editId = null) {
    turmaForm.reset();
    turmaProfessoresList.innerHTML = '';
    usuariosCache.filter(u => u.papel === 'professor').forEach(p => {
        turmaProfessoresList.innerHTML += `<label class="flex items-center"><input type="checkbox" class="form-checkbox" value="${p.user_uid}"><span class="ml-2">${p.nome}</span></label>`;
    });
    document.getElementById('turma-delete-container').classList.add('hidden');
    if (editId) {
        const { data } = await safeQuery(db.from('turmas').select('*').eq('id', editId).single());
        document.getElementById('turma-modal-title').textContent = 'Editar Turma';
        document.getElementById('turma-id').value = data.id;
        document.getElementById('turma-nome').value = data.nome_turma;
        document.getElementById('turma-ano-letivo').value = data.ano_letivo;
        document.getElementById('turma-delete-container').classList.remove('hidden');
        const { data: profsAtuais } = await safeQuery(db.from('professores_turmas').select('professor_id').eq('turma_id', editId));
        if (profsAtuais) {
            const profIds = profsAtuais.map(p => p.professor_id);
            turmaProfessoresList.querySelectorAll('input').forEach(input => {
                if (profIds.includes(input.value)) input.checked = true;
            });
        }
    } else {
        document.getElementById('turma-modal-title').textContent = 'Adicionar Turma';
        document.getElementById('turma-id').value = '';
        document.getElementById('turma-ano-letivo').value = new Date().getFullYear();
    }
    turmaModal.classList.remove('hidden');
}

async function handleTurmaFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('turma-id').value;
    const nome = document.getElementById('turma-nome').value;
    const ano_letivo = document.getElementById('turma-ano-letivo').value;
    const selectedProfIds = Array.from(turmaProfessoresList.querySelectorAll('input:checked')).map(input => input.value);
    if (id) {
        const { error: updateError } = await safeQuery(db.from('turmas').update({ nome_turma: nome, ano_letivo: ano_letivo }).eq('id', id));
        if (updateError) { showToast('Erro ao atualizar turma.', true); return; }
        await safeQuery(db.from('professores_turmas').delete().eq('turma_id', id));
        const rels = selectedProfIds.map(profId => ({ turma_id: id, professor_id: profId }));
        if (rels.length > 0) await safeQuery(db.from('professores_turmas').insert(rels));
    } else {
        const { data, error: insertError } = await safeQuery(db.from('turmas').insert({ nome_turma: nome, ano_letivo: ano_letivo }).select().single());
        if (insertError) { showToast('Erro ao criar turma.', true); return; }
        const newTurmaId = data.id;
        const rels = selectedProfIds.map(profId => ({ turma_id: newTurmaId, professor_id: profId }));
        if (rels.length > 0) await safeQuery(db.from('professores_turmas').insert(rels));
    }
    showToast('Turma salva com sucesso!');
    closeModal(turmaModal);
    await loadAdminData();
    await renderTurmasPanel();
}

// --- Gerenciamento de Relatórios ---
async function renderRelatoriosPanel() {
    const turmaFilter = document.getElementById('relatorio-turma-select');
    const alunoFilter = document.getElementById('relatorio-aluno-select');
    const profFilter = document.getElementById('relatorio-professor-select');
    turmaFilter.innerHTML = '<option value="">Todas</option>';
    turmasCache.forEach(t => turmaFilter.innerHTML += `<option value="${t.id}">${t.nome_turma} (${t.ano_letivo})</option>`);
    alunoFilter.innerHTML = '<option value="">Todos</option>';
    alunosCache.forEach(a => alunoFilter.innerHTML += `<option value="${a.id}">${a.nome_completo}</option>`);
    profFilter.innerHTML = '<option value="">Todos</option>';
    usuariosCache.forEach(u => profFilter.innerHTML += `<option value="${u.user_uid}">${u.nome} (${u.papel})</option>`);
}

async function handleGerarRelatorio() {
    relatorioTableBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center">Gerando relatório...</td></tr>';
    imprimirRelatorioBtn.classList.add('hidden');
    let queryBuilder = db.from('presencas').select(`data, status, justificativa, alunos ( nome_completo ), turmas ( nome_turma ), usuarios ( nome )`).order('data', { ascending: false });
    let dataInicio = document.getElementById('relatorio-data-inicio').value;
    let dataFim = document.getElementById('relatorio-data-fim').value;
    const turmaId = document.getElementById('relatorio-turma-select').value;
    const alunoId = document.getElementById('relatorio-aluno-select').value;
    const profId = document.getElementById('relatorio-professor-select').value;
    const statusFiltro = document.getElementById('relatorio-status-select').value;
    if (dataInicio && !dataFim) dataFim = dataInicio;
    if (dataInicio) queryBuilder = queryBuilder.gte('data', dataInicio);
    if (dataFim) queryBuilder = queryBuilder.lte('data', dataFim);
    if (turmaId) queryBuilder = queryBuilder.eq('turma_id', turmaId);
    if (alunoId) queryBuilder = queryBuilder.eq('aluno_id', alunoId);
    if (profId) queryBuilder = queryBuilder.eq('registrado_por_uid', profId);
    if (statusFiltro) queryBuilder = queryBuilder.eq('status', statusFiltro);
    const { data, error } = await safeQuery(queryBuilder);
    if (error) {
        relatorioTableBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-red-500">Erro ao gerar relatório.</td></tr>';
        return;
    }
    if (data.length === 0) {
        relatorioTableBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center">Nenhum registro encontrado.</td></tr>';
        return;
    }
    relatorioTableBody.innerHTML = data.map(r => `
        <tr class="border-b">
            <td class="p-3">${new Date(r.data + 'T00:00:00').toLocaleDateString()}</td>
            <td class="p-3">${r.alunos ? r.alunos.nome_completo : 'Aluno Removido'}</td>
            <td class="p-3">${r.turmas ? r.turmas.nome_turma : 'Turma Removida'}</td>
            <td class="p-3"><span class="font-semibold ${r.status === 'falta' ? 'text-red-600' : 'text-green-600'}">${r.status.charAt(0).toUpperCase() + r.status.slice(1)}</span></td>
            <td class="p-3 text-xs">${r.justificativa || ''}</td>
            <td class="p-3">${r.usuarios ? r.usuarios.nome : 'Usuário Removido'}</td>
        </tr>
    `).join('');
    imprimirRelatorioBtn.classList.remove('hidden');
}

// --- Gerenciamento de Configurações ---
async function renderConfigPanel() {
    try {
        const { data, error } = await safeQuery(db.from('configuracoes').select('*').limit(1).single());
        if (error && error.code !== 'PGRST116') throw error;
        if (data) {
            document.getElementById('config-faltas-consecutivas').value = data.faltas_consecutivas_limite || '';
            document.getElementById('config-faltas-intercaladas').value = data.faltas_intercaladas_limite || '';
            document.getElementById('config-faltas-dias').value = data.faltas_intercaladas_dias || '';
            if (data.alerta_horario) {
                document.getElementById('config-alerta-horario').value = data.alerta_horario.substring(0, 5);
            }
            document.getElementById('config-alerta-faltas-ativo').checked = data.alerta_faltas_ativo;
            document.getElementById('config-alerta-chamada-ativo').checked = data.alerta_chamada_nao_feita_ativo;
        }
    } catch (err) {
        console.error("Erro ao carregar configurações:", err);
        showToast("Não foi possível carregar as configurações.", true);
    }
}

async function handleConfigFormSubmit(e) {
    e.preventDefault();
    try {
        const configData = {
            id: 1,
            faltas_consecutivas_limite: document.getElementById('config-faltas-consecutivas').value,
            faltas_intercaladas_limite: document.getElementById('config-faltas-intercaladas').value,
            faltas_intercaladas_dias: document.getElementById('config-faltas-dias').value,
            alerta_horario: document.getElementById('config-alerta-horario').value || null,
            alerta_faltas_ativo: document.getElementById('config-alerta-faltas-ativo').checked,
            alerta_chamada_nao_feita_ativo: document.getElementById('config-alerta-chamada-ativo').checked
        };
        const { error } = await safeQuery(db.from('configuracoes').upsert(configData));
        if (error) throw error;
        showToast('Configurações salvas com sucesso!');
    } catch (err) {
        showToast('Erro ao salvar configurações: ' + err.message, true);
    }
}

// --- Gerenciamento de Calendário ---
async function renderCalendarioPanel() {
    const dataInicioFilter = document.getElementById('evento-data-inicio-filter').value;
    const dataFimFilter = document.getElementById('evento-data-fim-filter').value;
    eventosTableBody.innerHTML = '<tr><td colspan="3" class="p-4 text-center">Carregando...</td></tr>';
    let queryBuilder = db.from('eventos').select('*').order('data', { ascending: false });
    if (dataInicioFilter && !dataFimFilter) {
        queryBuilder = queryBuilder.gte('data', dataInicioFilter).lte('data', dataInicioFilter);
    } else {
        if (dataInicioFilter) queryBuilder = queryBuilder.gte('data', dataInicioFilter);
        if (dataFimFilter) queryBuilder = queryBuilder.lte('data', dataFimFilter);
    }
    const { data, error } = await safeQuery(queryBuilder);
    if (error) {
        eventosTableBody.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-red-500">Erro ao carregar.</td></tr>';
        return;
    }
    if (data.length === 0) {
        eventosTableBody.innerHTML = '<tr><td colspan="3" class="p-4 text-center">Nenhum evento encontrado.</td></tr>';
        return;
    }
    eventosTableBody.innerHTML = data.map(evento => {
        const dataInicio = new Date(evento.data + 'T00:00:00').toLocaleDateString();
        const dataFim = evento.data_fim ? new Date(evento.data_fim + 'T00:00:00').toLocaleDateString() : dataInicio;
        const periodo = dataInicio === dataFim ? dataInicio : `${dataInicio} - ${dataFim}`;
        return `
        <tr class="border-b">
            <td class="p-3">${periodo}</td>
            <td class="p-3">${evento.descricao}</td>
            <td class="p-3"><button class="text-blue-600 hover:underline edit-evento-btn" data-id="${evento.id}">Editar</button></td>
        </tr>
        `}).join('');
}

async function openEventoModal(editId = null) {
    eventoForm.reset();
    document.getElementById('evento-delete-container').classList.add('hidden');
    if (editId) {
        const { data } = await safeQuery(db.from('eventos').select('*').eq('id', editId).single());
        document.getElementById('evento-modal-title').textContent = 'Editar Evento';
        document.getElementById('evento-id').value = data.id;
        document.getElementById('evento-descricao').value = data.descricao;
        document.getElementById('evento-data-inicio').value = data.data;
        document.getElementById('evento-data-fim').value = data.data_fim;
        document.getElementById('evento-delete-container').classList.remove('hidden');
    } else {
        document.getElementById('evento-modal-title').textContent = 'Adicionar Evento';
        document.getElementById('evento-id').value = '';
    }
    eventoModal.classList.remove('hidden');
}

async function handleEventoFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('evento-id').value;
    const eventoData = {
        descricao: document.getElementById('evento-descricao').value,
        data: document.getElementById('evento-data-inicio').value,
        data_fim: document.getElementById('evento-data-fim').value || null
    };
    if (!eventoData.data) {
        showToast('A data de início é obrigatória.', true);
        return;
    }
    const queryBuilder = id ? db.from('eventos').update(eventoData).eq('id', id) : db.from('eventos').insert(eventoData);
    const { error } = await safeQuery(queryBuilder);
    if (error) {
        showToast('Erro ao salvar o evento: ' + error.message, true);
    } else {
        showToast('Evento salvo com sucesso!');
        closeModal(eventoModal);
        await renderCalendarioPanel();
        await renderDashboardCalendar();
    }
}

// --- Gestão de Ano Letivo ---
function renderAnoLetivoPanel() {
    // A lógica está nos botões
}

async function openPromoverTurmasModal() {
    const anoOrigemSel = document.getElementById('promover-turmas-ano-origem');
    const listaContainer = document.getElementById('promover-turmas-lista-container');
    const listaEl = document.getElementById('promover-turmas-lista');
    
    listaContainer.classList.add('hidden');
    listaEl.innerHTML = '';
    document.getElementById('promover-turmas-btn').disabled = true;

    anoOrigemSel.innerHTML = '<option value="">Selecione...</option>';
    anosLetivosCache.forEach(ano => {
        anoOrigemSel.innerHTML += `<option value="${ano}">${ano}</option>`;
    });

    if (anosLetivosCache.length > 0) {
        const ultimoAno = anosLetivosCache[0];
        anoOrigemSel.value = ultimoAno;
        anoOrigemSel.dispatchEvent(new Event('change'));
    }
    
    promoverTurmasModal.classList.remove('hidden');
}

async function renderPromocaoTurmasLista() {
    const anoOrigem = document.getElementById('promover-turmas-ano-origem').value;
    const anoDestinoEl = document.getElementById('promover-turmas-ano-destino');
    const container = document.getElementById('promover-turmas-lista-container');
    const listEl = document.getElementById('promover-turmas-lista');
    const promoverBtn = document.getElementById('promover-turmas-btn');
    
    listEl.innerHTML = '';
    promoverBtn.disabled = true;

    if (!anoOrigem) {
        container.classList.add('hidden');
        anoDestinoEl.value = '';
        return;
    }
    
    anoDestinoEl.value = parseInt(anoOrigem) + 1;
    listEl.innerHTML = '<div class="loader mx-auto my-4"></div>';
    container.classList.remove('hidden');

    const { data: turmas } = await safeQuery(
        db.from('turmas').select('id, nome_turma').eq('ano_letivo', anoOrigem).order('nome_turma', { ascending: true, nullsFirst: false })
    );

    if (!turmas || turmas.length === 0) {
        listEl.innerHTML = `<p class="p-4 text-center text-gray-600">Nenhuma turma encontrada para o ano de origem.</p>`;
        return;
    }
    
    listEl.innerHTML = turmas.sort((a,b) => a.nome_turma.localeCompare(b.nome_turma, undefined, { numeric: true })).map(turma => `
        <label class="flex items-center p-2 bg-white rounded-md border hover:bg-gray-50">
            <input type="checkbox" class="form-checkbox h-5 w-5 promocao-turma-checkbox" value="${turma.id}" checked>
            <span class="ml-3 text-sm">${turma.nome_turma}</span>
        </label>
    `).join('');
    
    promoverBtn.disabled = false;
}

async function handlePromoverTurmas() {
    const turmasSelecionadasIds = Array.from(document.querySelectorAll('#promover-turmas-lista input:checked')).map(cb => cb.value);

    if (turmasSelecionadasIds.length === 0) {
        showToast("Nenhuma turma foi selecionada para a promoção.", true);
        return;
    }

    document.getElementById('promover-turmas-confirm-message').textContent = `Você está prestes a promover todos os alunos de ${turmasSelecionadasIds.length} turma(s).`;
    document.getElementById('confirm-promocao-turmas-btn').dataset.turmas = JSON.stringify(turmasSelecionadasIds);
    document.getElementById('promover-turmas-confirm-checkbox').checked = false;
    document.getElementById('confirm-promocao-turmas-btn').disabled = true;
    promoverTurmasConfirmModal.classList.remove('hidden');
}

async function handleConfirmPromocaoTurmas() {
    const btn = document.getElementById('confirm-promocao-turmas-btn');
    const turmaIds = JSON.parse(btn.dataset.turmas);
    const anoDestino = document.getElementById('promover-turmas-ano-destino').value;

    btn.innerHTML = '<div class="loader mx-auto"></div>';
    btn.disabled = true;

    const { error } = await db.rpc('promover_turmas_em_massa', {
        origem_turma_ids: turmaIds,
        ano_destino: parseInt(anoDestino)
    });

    if (error) {
        showToast("Erro ao executar a promoção em massa: " + error.message, true);
        console.error(error);
    } else {
        showToast("Turmas promovidas com sucesso! Os alunos foram movidos e novas turmas criadas conforme necessário.");
        closeAllModals();
        await loadAdminData();
        await renderAlunosPanel({ defaultToLatestYear: true });
    }
    btn.innerHTML = 'Executar Promoção';
}

// --- Lógica de Exclusão ---
function openDeleteConfirmModal(type, id) {
    const messageEl = document.getElementById('delete-confirm-message');
    const confirmBtn = document.getElementById('confirm-delete-btn');
    const checkbox = document.getElementById('delete-confirm-checkbox');
    messageEl.textContent = `Você tem certeza que deseja excluir este ${type}? Esta ação é irreversível.`;
    checkbox.checked = false;
    confirmBtn.disabled = true;
    confirmBtn.dataset.type = type;
    confirmBtn.dataset.id = id;
    deleteConfirmModal.classList.remove('hidden');
}

async function handleConfirmDelete() {
    const confirmBtn = document.getElementById('confirm-delete-btn');
    const type = confirmBtn.dataset.type;
    const id = confirmBtn.dataset.id;
    let queryBuilder;
    if (type === 'aluno') queryBuilder = db.from('alunos').delete().eq('id', id);
    else if (type === 'turma') {
        await safeQuery(db.from('professores_turmas').delete().eq('turma_id', id));
        queryBuilder = db.from('turmas').delete().eq('id', id);
    } else if (type === 'professor') queryBuilder = db.from('usuarios').delete().eq('id', id);
    else if (type === 'evento') queryBuilder = db.from('eventos').delete().eq('id', id);
    else if (type === 'acompanhamento') queryBuilder = db.from('apoia_encaminhamentos').delete().eq('id', id);
    const { error } = await safeQuery(queryBuilder);
    if (error) {
        showToast(`Não foi possível excluir o ${type}: ` + error.message, true);
    } else {
        showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} excluído com sucesso!`);
        if (type === 'aluno') await renderAlunosPanel();
        if (type === 'turma') { await loadAdminData(); await renderTurmasPanel(); }
        if (type === 'professor') {
            showToast('Perfil do professor excluído. Lembre-se de remover o login correspondente no painel de Autenticação da Supabase, se houver.');
            await loadAdminData(); await renderProfessoresPanel();
        }
        if (type === 'evento') { await renderCalendarioPanel(); await renderDashboardCalendar(); }
        if (type === 'acompanhamento') { await renderApoiaPanel(); }
    }
    closeModal(deleteConfirmModal);
}

// --- Impressão ---
function handleImprimirRelatorio(reportType) {
    let dataInicioId, dataFimId, periodoElId;
    if (reportType === 'faltas') {
        dataInicioId = 'relatorio-data-inicio';
        dataFimId = 'relatorio-data-fim';
        periodoElId = 'relatorio-periodo-impressao';
    } else if (reportType === 'apoia') {
        dataInicioId = 'apoia-relatorio-data-inicio';
        dataFimId = 'apoia-relatorio-data-fim';
        periodoElId = 'apoia-relatorio-periodo-impressao';
    } else if (reportType === 'historico') {
        window.print();
        return;
    } else return;
    const periodoEl = document.getElementById(periodoElId);
    const dataInicio = document.getElementById(dataInicioId).value;
    const dataFim = document.getElementById(dataFimId).value;
    if (periodoEl) {
        if (dataInicio && dataFim && dataInicio === dataFim) {
            periodoEl.textContent = `Data: ${new Date(dataInicio + 'T00:00:00').toLocaleDateString('pt-BR')}`;
        } else if (dataInicio && dataFim) {
            const dataInicioFmt = new Date(dataInicio + 'T00:00:00').toLocaleDateString('pt-BR');
            const dataFimFmt = new Date(dataFim + 'T00:00:00').toLocaleDateString('pt-BR');
            periodoEl.textContent = `Período: ${dataInicioFmt} a ${dataFimFmt}`;
        } else {
            periodoEl.textContent = 'Período: Todas as datas';
        }
    }
    window.print();
}

// --- Histórico Individual do Aluno ---
async function openAlunoHistoricoModal(alunoId) {
    const tableBody = document.getElementById('aluno-historico-table-body');
    tableBody.innerHTML = '<tr><td colspan="3" class="p-4 text-center">Carregando histórico...</td></tr>';
    alunoHistoricoModal.classList.remove('hidden');
    const { data: aluno } = await safeQuery(db.from('alunos').select('nome_completo').eq('id', alunoId).single());
    const { data: presencas } = await safeQuery(db.from('presencas').select('data, status, justificativa').eq('aluno_id', alunoId).order('data', { ascending: false }));
    if (!aluno || !presencas) {
        showToast("Erro ao carregar dados do aluno.", true);
        closeModal(alunoHistoricoModal);
        return;
    }
    document.getElementById('historico-aluno-nome-impressao').textContent = aluno.nome_completo;
    const total = presencas.length;
    const totalPresencas = presencas.filter(p => p.status === 'presente').length;
    const totalFaltas = total - totalPresencas;
    const assiduidade = total > 0 ? ((totalPresencas / total) * 100).toFixed(1) + '%' : 'N/A';
    document.getElementById('historico-presencas').textContent = totalPresencas;
    document.getElementById('historico-faltas').textContent = totalFaltas;
    document.getElementById('historico-assiduidade').textContent = assiduidade;
    if (total === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" class="p-4 text-center">Nenhum registro de frequência encontrado.</td></tr>';
    } else {
        tableBody.innerHTML = presencas.map(p => `
            <tr class="border-b">
                <td class="p-2">${new Date(p.data + 'T00:00:00').toLocaleDateString()}</td>
                <td class="p-2"><span class="font-semibold ${p.status === 'falta' ? 'text-red-600' : 'text-green-600'}">${p.status.charAt(0).toUpperCase() + p.status.slice(1)}</span></td>
                <td class="p-2 text-xs">${p.justificativa || ''}</td>
            </tr>
        `).join('');
    }
}

// --- Análise de Assiduidade ---
function openAssiduidadeModal() {
    // Limpa e popula filtros para Alunos
    const anoSelAluno = document.getElementById('assiduidade-aluno-ano');
    const turmaSelAluno = document.getElementById('assiduidade-aluno-turma');
    const alunoSel = document.getElementById('assiduidade-aluno-aluno');
    anoSelAluno.innerHTML = '<option value="">Todos os Anos</option>';
    anosLetivosCache.forEach(ano => anoSelAluno.innerHTML += `<option value="${ano}">${ano}</option>`);
    turmaSelAluno.innerHTML = '<option value="">Todas as Turmas</option>';
    alunoSel.innerHTML = '<option value="">Todos os Alunos</option>';

    // Limpa e popula filtros para Turmas
    const anoSelTurma = document.getElementById('assiduidade-turma-ano');
    const turmaSelTurma = document.getElementById('assiduidade-turma-turma');
    anoSelTurma.innerHTML = '<option value="">Todos os Anos</option>';
    anosLetivosCache.forEach(ano => anoSelTurma.innerHTML += `<option value="${ano}">${ano}</option>`);
    turmaSelTurma.innerHTML = '<option value="">Todas as Turmas</option>';
    
    // Limpa e popula filtros para Professores
    const profSel = document.getElementById('assiduidade-prof-professor');
    profSel.innerHTML = '<option value="">Todos os Professores</option>';
    usuariosCache.filter(u => u.papel === 'professor').forEach(p => profSel.innerHTML += `<option value="${p.user_uid}">${p.nome}</option>`);

    // Define o ano atual como padrão
    const currentYear = new Date().getFullYear();
    if (anosLetivosCache.some(y => y == currentYear)) {
        anoSelAluno.value = currentYear;
        anoSelTurma.value = currentYear;
        anoSelAluno.dispatchEvent(new Event('change'));
        anoSelTurma.dispatchEvent(new Event('change'));
    }

    assiduidadeModal.classList.remove('hidden');
}


async function generateAssiduidadeReport() {
    const newWindow = window.open('', '_blank');
    newWindow.document.write(`<html><head><title>Relatório de Assiduidade</title><script src="https://cdn.tailwindcss.com"><\/script><script src="https://cdn.jsdelivr.net/npm/chart.js"><\/script><style>body { font-family: 'Inter', sans-serif; } .print-header { display: none; } @media print { .no-print { display: none !important; } .printable-area { position: absolute; left: 0; top: 0; width: 100%; } body * { visibility: hidden; } .printable-area, .printable-area * { visibility: visible; } .print-header { display: flex !important; justify-content: space-between; align-items: center; padding-bottom: 1rem; margin-bottom: 1.5rem; border-bottom: 2px solid #e5e7eb; } .print-header img { max-height: 60px; width: auto; } .print-header-info h2 { font-size: 1.25rem; font-weight: bold; margin: 0; } .print-header-info p { font-size: 0.875rem; margin: 0; } }</style></head><body class="bg-gray-100 p-8"><div class="printable-area"><div id="report-content"><div class="text-center"><div class="loader" style="width: 48px; height: 48px; margin: auto;"></div><p class="mt-4 text-gray-600">Gerando relatório, por favor aguarde...</p></div></div></div></body></html>`);
    closeModal(assiduidadeModal);
    
    try {
        const activeTab = document.querySelector('#assiduidade-tabs a[aria-current="page"]').dataset.target;
        
        // RELATÓRIO DE ALUNOS
        if (activeTab === 'assiduidade-alunos') {
            const dataInicio = document.getElementById('assiduidade-aluno-data-inicio').value;
            const dataFim = document.getElementById('assiduidade-aluno-data-fim').value;
            const turmaId = document.getElementById('assiduidade-aluno-turma').value;
            const alunoId = document.getElementById('assiduidade-aluno-aluno').value;

            let query = db.from('presencas').select('status, justificativa, alunos(nome_completo), turmas(nome_turma)');
            if (dataInicio) query = query.gte('data', dataInicio);
            if (dataFim) query = query.lte('data', dataFim);
            if (turmaId) query = query.eq('turma_id', turmaId);
            if (alunoId) query = query.eq('aluno_id', alunoId);

            const { data, error } = await safeQuery(query);
            if (error) throw error;
            if (data.length === 0) {
                newWindow.document.getElementById('report-content').innerHTML = '<p class="text-center font-bold">Nenhum dado encontrado para os filtros selecionados.</p>';
                return;
            }

            const stats = data.reduce((acc, record) => {
                if (!record.alunos) return acc;
                const nome = record.alunos.nome_completo;
                if (!acc[nome]) {
                    acc[nome] = { presencas: 0, faltas_j: 0, faltas_i: 0, turma: record.turmas.nome_turma };
                }
                if (record.status === 'presente') acc[nome].presencas++;
                else {
                    if (record.justificativa === 'Falta justificada') acc[nome].faltas_j++;
                    else acc[nome].faltas_i++;
                }
                return acc;
            }, {});

            const tableRows = Object.entries(stats).map(([nome, { presencas, faltas_j, faltas_i, turma }]) => {
                const total = presencas + faltas_j + faltas_i;
                const percentual = total > 0 ? ((presencas / total) * 100).toFixed(1) + '%' : 'N/A';
                return `
                    <tr class="border-b">
                        <td class="p-3">${nome}</td>
                        <td class="p-3">${turma}</td>
                        <td class="p-3 text-center text-green-600 font-semibold">${presencas}</td>
                        <td class="p-3 text-center text-yellow-600 font-semibold">${faltas_j}</td>
                        <td class="p-3 text-center text-red-600 font-semibold">${faltas_i}</td>
                        <td class="p-3 text-center font-bold">${percentual}</td>
                    </tr>
                `;
            }).join('');
            
            const totalPresencas = Object.values(stats).reduce((sum, s) => sum + s.presencas, 0);
            const totalFaltasJ = Object.values(stats).reduce((sum, s) => sum + s.faltas_j, 0);
            const totalFaltasI = Object.values(stats).reduce((sum, s) => sum + s.faltas_i, 0);
            
            const periodoTexto = (dataInicio && dataFim) ? `Período: ${new Date(dataInicio + 'T00:00:00').toLocaleDateString('pt-BR')} a ${new Date(dataFim + 'T00:00:00').toLocaleDateString('pt-BR')}` : 'Período: Geral';

            newWindow.document.body.innerHTML = `
            <div class="printable-area">
                <div class="print-header hidden"><img src="./logo.png"><div class="print-header-info"><h2>Relatório de Assiduidade de Alunos</h2><p>${periodoTexto}</p></div></div>
                <div class="flex justify-between items-center mb-6 no-print"><h1 class="text-2xl font-bold">Relatório de Assiduidade de Alunos</h1><button onclick="window.print()" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Imprimir</button></div>
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-1 bg-white p-4 rounded-lg shadow-md"><div style="height: 320px; position: relative;"><canvas id="assiduidadeChart"></canvas></div></div>
                    <div class="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                        <h3 class="font-bold mb-4">Detalhes da Frequência</h3>
                        <div class="max-h-96 overflow-y-auto">
                        <table class="w-full text-sm">
                            <thead class="bg-gray-50 sticky top-0"><tr><th class="p-3 text-left">Aluno</th><th class="p-3 text-left">Turma</th><th class="p-3 text-center">Presenças</th><th class="p-3 text-center">Faltas Just.</th><th class="p-3 text-center">Faltas Injust.</th><th class="p-3 text-center">Assiduidade</th></tr></thead>
                            <tbody>${tableRows}</tbody>
                        </table>
                        </div>
                    </div>
                </div>
            </div>
            <script>
                setTimeout(() => {
                    const ctx = document.getElementById('assiduidadeChart');
                    if (ctx) {
                        new Chart(ctx, {
                            type: 'pie',
                            data: {
                                labels: ['Presenças', 'Faltas Justificadas', 'Faltas Injustificadas'],
                                datasets: [{
                                    data: [${totalPresencas}, ${totalFaltasJ}, ${totalFaltasI}],
                                    backgroundColor: ['#10B981', '#F59E0B', '#EF4444']
                                }]
                            },
                            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Visão Geral da Frequência' } } }
                        });
                    }
                }, 100);
            <\/script>
            `;
        // RELATÓRIO DE TURMAS
        } else if (activeTab === 'assiduidade-turmas') {
            const dataInicio = document.getElementById('assiduidade-turma-data-inicio').value;
            const dataFim = document.getElementById('assiduidade-turma-data-fim').value;
            const anoLetivo = document.getElementById('assiduidade-turma-ano').value;
            const turmaId = document.getElementById('assiduidade-turma-turma').value;

            let query = db.from('presencas').select('status, turmas!inner(id, nome_turma, ano_letivo)');
            if (dataInicio) query = query.gte('data', dataInicio);
            if (dataFim) query = query.lte('data', dataFim);
            if (anoLetivo) query = query.eq('turmas.ano_letivo', anoLetivo);
            if (turmaId) query = query.eq('turma_id', turmaId);

            const { data, error } = await safeQuery(query);
            if (error) throw error;
            if (data.length === 0) {
                newWindow.document.getElementById('report-content').innerHTML = '<p class="text-center font-bold">Nenhum dado encontrado para os filtros selecionados.</p>';
                return;
            }

            const stats = data.reduce((acc, record) => {
                const turma = record.turmas;
                if (!turma) return acc;
                if (!acc[turma.id]) {
                    acc[turma.id] = { nome: turma.nome_turma, presencas: 0, faltas: 0 };
                }
                if (record.status === 'presente') acc[turma.id].presencas++;
                else acc[turma.id].faltas++;
                return acc;
            }, {});

            const sortedStats = Object.values(stats).sort((a,b) => a.nome.localeCompare(b.nome));

            const tableRows = sortedStats.map(turma => {
                const total = turma.presencas + turma.faltas;
                const percentual = total > 0 ? ((turma.presencas / total) * 100).toFixed(1) + '%' : 'N/A';
                return `
                    <tr class="border-b">
                        <td class="p-3">${turma.nome}</td>
                        <td class="p-3 text-center text-green-600 font-semibold">${turma.presencas}</td>
                        <td class="p-3 text-center text-red-600 font-semibold">${turma.faltas}</td>
                        <td class="p-3 text-center font-bold">${percentual}</td>
                    </tr>
                `;
            }).join('');

            const totalPresencas = sortedStats.reduce((sum, t) => sum + t.presencas, 0);
            const totalFaltas = sortedStats.reduce((sum, t) => sum + t.faltas, 0);

            const periodoTexto = (dataInicio && dataFim) ? `Período: ${new Date(dataInicio + 'T00:00:00').toLocaleDateString('pt-BR')} a ${new Date(dataFim + 'T00:00:00').toLocaleDateString('pt-BR')}` : 'Período: Geral';

            newWindow.document.body.innerHTML = `
                <div class="printable-area">
                    <div class="print-header hidden"><img src="./logo.png"><div class="print-header-info"><h2>Relatório de Assiduidade por Turma</h2><p>${periodoTexto}</p></div></div>
                    <div class="flex justify-between items-center mb-6 no-print"><h1 class="text-2xl font-bold">Relatório de Assiduidade por Turma</h1><button onclick="window.print()" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Imprimir</button></div>
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div class="lg:col-span-1 bg-white p-4 rounded-lg shadow-md"><div style="height: 320px; position: relative;"><canvas id="assiduidadeTurmaChart"></canvas></div></div>
                        <div class="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                            <h3 class="font-bold mb-4">Dados Consolidados</h3>
                            <div class="max-h-96 overflow-y-auto">
                            <table class="w-full text-sm">
                                <thead class="bg-gray-50 sticky top-0"><tr><th class="p-3 text-left">Turma</th><th class="p-3 text-center">Presenças</th><th class="p-3 text-center">Faltas</th><th class="p-3 text-center">Assiduidade</th></tr></thead>
                                <tbody>${tableRows}</tbody>
                            </table>
                            </div>
                        </div>
                    </div>
                </div>
                <script>
                    setTimeout(() => {
                        const ctx = document.getElementById('assiduidadeTurmaChart');
                        if(ctx) {
                            new Chart(ctx, {
                                type: 'pie',
                                data: {
                                    labels: ['Total de Presenças', 'Total de Faltas'],
                                    datasets: [{
                                        label: 'Frequência Geral',
                                        data: [${totalPresencas}, ${totalFaltas}],
                                        backgroundColor: ['#10B981', '#EF4444'],
                                    }]
                                },
                                options: {
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { position: 'top' }, title: { display: true, text: 'Frequência Geral das Turmas' } }
                                }
                            });
                        }
                    }, 100);
                <\/script>
                `;
        // RELATÓRIO DE PROFESSORES
        } else if (activeTab === 'assiduidade-professores') {
            const dataInicio = document.getElementById('assiduidade-prof-data-inicio').value;
            const dataFim = document.getElementById('assiduidade-prof-data-fim').value;
            const professorId = document.getElementById('assiduidade-prof-professor').value;

            if (!dataInicio || !dataFim) {
                newWindow.document.getElementById('report-content').innerHTML = '<p class="text-center font-bold text-red-600">Por favor, selecione as datas de início e fim para gerar o relatório de professores.</p>';
                return;
            }

            const { data, error } = await db.rpc('get_professor_assiduidade', {
                p_data_inicio: dataInicio,
                p_data_fim: dataFim,
                p_professor_uid: professorId || null
            });

            if (error) throw error;
            if (data.length === 0) {
                newWindow.document.getElementById('report-content').innerHTML = '<p class="text-center font-bold">Nenhum dia letivo encontrado para o período e filtros selecionados.</p>';
                return;
            }
            
            const diasLancados = data.filter(d => d.chamada_lancada);
            const diasNaoLancados = data.filter(d => !d.chamada_lancada);

            const lancadosHtml = diasLancados.length > 0 ? diasLancados.map(d => `<span class="bg-green-100 text-green-800 text-xs font-medium mr-2 mb-2 px-2.5 py-0.5 rounded-full inline-block">${new Date(d.dia_letivo + 'T00:00:00').toLocaleDateString('pt-BR')}</span>`).join('') : '<p class="text-sm text-gray-500">Nenhum.</p>';
            
            const naoLancadosHtml = diasNaoLancados.length > 0
                ? diasNaoLancados.map(d => `
                    <div class="flex flex-col text-center bg-red-100 text-red-800 text-xs font-medium p-2 rounded-lg">
                        <strong class="text-sm">${new Date(d.dia_letivo + 'T00:00:00').toLocaleDateString('pt-BR')}</strong>
                    </div>
                `).join('')
                : '<p class="text-sm text-gray-500">Nenhum.</p>';
            
            const totalDiasLetivos = data.length;
            const totalLancados = diasLancados.length;
            const taxa = totalDiasLetivos > 0 ? ((totalLancados / totalDiasLetivos) * 100).toFixed(1) + '%' : 'N/A';
            const nomeProfessor = professorId ? usuariosCache.find(u => u.user_uid === professorId)?.nome : 'Todos os Professores';
            
            const dataInicioFmt = new Date(dataInicio + 'T00:00:00').toLocaleDateString('pt-BR');
            const dataFimFmt = new Date(dataFim + 'T00:00:00').toLocaleDateString('pt-BR');
            const periodoTexto = `Período: ${dataInicioFmt} a ${dataFimFmt}`;

            newWindow.document.body.innerHTML = `
                <div class="printable-area">
                    <div class="print-header hidden"><img src="./logo.png"><div class="print-header-info"><h2>Relatório de Lançamento de Professores</h2><p>Professor: ${nomeProfessor}</p><p>${periodoTexto}</p></div></div>
                    <div class="flex justify-between items-center mb-6 no-print"><h1 class="text-2xl font-bold">Relatório de Lançamento de Professores</h1><button onclick="window.print()" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Imprimir</button></div>
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div class="lg:col-span-1 bg-white p-4 rounded-lg shadow-md"><div style="height: 320px; position: relative;"><canvas id="lancamentoChart"></canvas></div></div>
                        <div class="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                            <h3 class="text-lg font-bold mb-4">Resumo do Período para: <span class="text-indigo-600">${nomeProfessor}</span></h3>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                                <div><p class="text-sm text-gray-500">Total de Dias Letivos</p><p class="text-2xl font-bold">${totalDiasLetivos}</p></div>
                                <div><p class="text-sm text-gray-500">Dias com Chamada Lançada</p><p class="text-2xl font-bold text-green-600">${totalLancados}</p></div>
                                <div><p class="text-sm text-gray-500">Taxa de Lançamento</p><p class="text-2xl font-bold text-blue-600">${taxa}</p></div>
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div class="bg-white p-6 rounded-lg shadow-md">
                            <h3 class="font-bold mb-4">Dias com Chamada Lançada (${totalLancados})</h3>
                            <div class="flex flex-wrap gap-2">${lancadosHtml}</div>
                        </div>
                        <div class="bg-white p-6 rounded-lg shadow-md">
                            <h3 class="font-bold mb-4">Dias Letivos Sem Lançamento (${diasNaoLancados.length})</h3>
                            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">${naoLancadosHtml}</div>
                        </div>
                    </div>
                </div>
                <script>
                    setTimeout(() => {
                        const ctx = document.getElementById('lancamentoChart');
                        if (ctx) {
                            new Chart(ctx, {
                                type: 'pie',
                                data: {
                                    labels: ['Dias com Chamada Lançada', 'Dias Sem Lançamento'],
                                    datasets: [{
                                        data: [${totalLancados}, ${diasNaoLancados.length}],
                                        backgroundColor: ['#10B981', '#EF4444']
                                    }]
                                },
                                options: {
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { position: 'top' }, title: { display: true, text: 'Visão Geral de Lançamentos' } }
                                }
                            });
                        }
                    }, 100);
                <\/script>
            `;
        }

    } catch(e) {
        console.error("Erro ao gerar relatório:", e);
        newWindow.document.getElementById('report-content').innerHTML = `<div class="text-red-500 font-bold text-center">Ocorreu um erro ao gerar o relatório: ${e.message}</div>`;
    }
}


// ===============================================================
// =================== EVENT LISTENERS ===========================
// ===============================================================
document.addEventListener('DOMContentLoaded', () => {
    const setupSupportLinks = () => {
        const numero = "5548991004780";
        const mensagem = "Olá! Mensagem enviada do Sistema de chamadas da EEB Getúlio Vargas. Preciso de suporte.";
        const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
        const linkProf = document.getElementById('support-link-prof');
        const linkAdmin = document.getElementById('support-link-admin');
        if (linkProf) { linkProf.href = url; linkProf.target = "_blank"; }
        if (linkAdmin) { linkAdmin.href = url; linkAdmin.target = "_blank"; }
    };
    setupSupportLinks();

    setInterval(async () => { if (currentUser) { const { error } = await db.auth.refreshSession(); if (error) console.error(error); } }, 10 * 60 * 1000);
    document.addEventListener('visibilitychange', async () => { if (!document.hidden && currentUser) await db.auth.refreshSession(); });

    // Formulários
    document.body.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (e.target.id === 'login-form') {
            const loginButton = e.target.querySelector('button[type="submit"]');
            loginButton.disabled = true;
            loginButton.innerHTML = `<div class="loader mx-auto"></div>`;
            loginError.textContent = '';
            try {
                const { error } = await db.auth.signInWithPassword({ email: document.getElementById('email').value, password: document.getElementById('password').value });
                if (error) {
                    loginError.textContent = "Email ou senha inválidos.";
                    resetLoginFormState();
                }
            } catch (err) {
                loginError.textContent = "Ocorreu um erro de conexão.";
                resetLoginFormState();
            }
        }
        if (e.target.id === 'aluno-form') await handleAlunoFormSubmit(e);
        if (e.target.id === 'professor-form') await handleProfessorFormSubmit(e);
        if (e.target.id === 'turma-form') await handleTurmaFormSubmit(e);
        if (e.target.id === 'evento-form') await handleEventoFormSubmit(e);
        if (e.target.id === 'acompanhamento-form') await handleAcompanhamentoFormSubmit(e);
        if (e.target.id === 'config-form') await handleConfigFormSubmit(e);
        if (e.target.id === 'correcao-chamada-form') {
            const form = e.target;
            const turmaId = form.querySelector('#correcao-turma-select').value;
            const data = form.querySelector('#correcao-data-select').value;
            const alunoRows = form.querySelectorAll('[data-aluno-id]');
            const registros = Array.from(alunoRows).map(row => {
                const status = row.querySelector('.status-radio:checked').value;
                let justificativa = null;
                if (status === 'falta') {
                    const justRadio = row.querySelector(`input[name="corr-just-${row.dataset.alunoId}"]:checked`);
                    if (justRadio) {
                        if (justRadio.value === 'outros') {
                            justificativa = row.querySelector('.justificativa-outros-input').value.trim() || 'Outros';
                        } else {
                            justificativa = justRadio.value;
                        }
                    } else {
                        justificativa = 'Falta injustificada';
                    }
                }
                return {
                    aluno_id: parseInt(row.dataset.alunoId),
                    turma_id: parseInt(turmaId),
                    data: data,
                    status: status,
                    justificativa: justificativa,
                    registrado_por_uid: currentUser.id
                };
            });
            const { error } = await safeQuery(db.from('presencas').upsert(registros, { onConflict: 'aluno_id, data' }));
            if (error) showToast('Erro ao salvar correção: ' + error.message, true);
            else {
                showToast('Chamada corrigida com sucesso!');
                closeModal(correcaoChamadaModal);
            }
        }
        if (e.target.id === 'reset-password-form') {
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const errorEl = document.getElementById('reset-password-error');
            errorEl.textContent = '';
            if (newPassword.length < 6) { errorEl.textContent = 'A senha deve ter no mínimo 6 caracteres.'; return; }
            if (newPassword !== confirmPassword) { errorEl.textContent = 'As senhas não coincidem.'; return; }
            const { error } = await db.auth.updateUser({ password: newPassword });
            if (error) {
                errorEl.textContent = 'Erro ao atualizar a senha: ' + error.message;
            } else {
                showToast('Senha atualizada com sucesso! Por favor, faça o login com sua nova senha.');
                closeModal(resetPasswordModal);
                await signOutUser();
            }
        }
    });

    // Listeners de Click Diretos para Botões Principais
    document.getElementById('gerar-assiduidade-btn').addEventListener('click', generateAssiduidadeReport);
    document.getElementById('open-promover-turmas-modal-btn').addEventListener('click', openPromoverTurmasModal);
    document.getElementById('promover-turmas-btn').addEventListener('click', handlePromoverTurmas);
    document.getElementById('confirm-promocao-turmas-btn').addEventListener('click', handleConfirmPromocaoTurmas);

    // Listener de Click Genérico
    document.body.addEventListener('click', (e) => {
        const target = e.target;
        const closest = (selector) => target.closest(selector);

        if (closest('.date-clear-btn')) {
            const targetId = closest('.date-clear-btn').dataset.target;
            document.getElementById(targetId).value = '';
        }

        const navLink = closest('.admin-nav-link');
        if (navLink) {
            e.preventDefault();
            document.querySelectorAll('.admin-nav-link').forEach(l => l.classList.remove('bg-gray-700'));
            navLink.classList.add('bg-gray-700');
            const targetPanelId = navLink.dataset.target;
            document.querySelectorAll('.admin-panel').forEach(p => p.classList.add('hidden'));
            const panel = document.getElementById(targetPanelId);
            if (panel) {
                panel.classList.remove('hidden');
                if (targetPanelId === 'admin-dashboard-panel') renderDashboardPanel();
                if (targetPanelId === 'admin-alunos-panel') renderAlunosPanel({ defaultToLatestYear: true });
                if (targetPanelId === 'admin-professores-panel') renderProfessoresPanel();
                if (targetPanelId === 'admin-turmas-panel') renderTurmasPanel();
                if (targetPanelId === 'admin-apoia-panel') renderApoiaPanel();
                if (targetPanelId === 'admin-calendario-panel') renderCalendarioPanel();
                if (targetPanelId === 'admin-ano-letivo-panel') renderAnoLetivoPanel();
                if (targetPanelId === 'admin-relatorios-panel') renderRelatoriosPanel();
                if (targetPanelId === 'admin-config-panel') renderConfigPanel();
            }
        }
        if (closest('#add-aluno-btn')) openAlunoModal();
        const editAlunoBtn = closest('.edit-aluno-btn');
        if (editAlunoBtn) openAlunoModal(editAlunoBtn.dataset.id);
        const historicoAlunoBtn = closest('.historico-aluno-btn');
        if (historicoAlunoBtn) openAlunoHistoricoModal(historicoAlunoBtn.dataset.id);
        if (closest('#add-professor-btn')) openProfessorModal();
        const editProfessorBtn = closest('.edit-professor-btn');
        if (editProfessorBtn) openProfessorModal(editProfessorBtn.dataset.id);
        if (closest('#add-turma-btn')) openTurmaModal();
        const editTurmaBtn = closest('.edit-turma-btn');
        if (editTurmaBtn) openTurmaModal(editTurmaBtn.dataset.id);
        const deleteTurmaBtn = closest('.delete-turma-btn');
        if (deleteTurmaBtn) openDeleteConfirmModal('turma', deleteTurmaBtn.dataset.id);
        if (closest('#add-evento-btn')) openEventoModal();
        const editEventoBtn = closest('.edit-evento-btn');
        if (editEventoBtn) openEventoModal(editEventoBtn.dataset.id);
        if (closest('.cancel-modal-btn')) closeAllModals();
        const deleteBtn = closest('.delete-btn');
        if (deleteBtn) {
            let id;
            if (deleteBtn.dataset.type === 'aluno') id = alunoModal.querySelector('#aluno-id').value;
            else if (deleteBtn.dataset.type === 'professor') id = professorModal.querySelector('#professor-id').value;
            else if (deleteBtn.dataset.type === 'turma') id = turmaModal.querySelector('#turma-id').value;
            else if (deleteBtn.dataset.type === 'evento') id = eventoModal.querySelector('#evento-id').value;
            else if (deleteBtn.dataset.type === 'acompanhamento') id = acompanhamentoModal.querySelector('#acompanhamento-id').value;
            if (id) openDeleteConfirmModal(deleteBtn.dataset.type, id);
        }
        const resetPassBtn = closest('.reset-password-btn');
        if (resetPassBtn) handleResetPassword(resetPassBtn.dataset.email);
        if (closest('#confirm-delete-btn')) handleConfirmDelete();
        if (closest('#admin-logout-btn') || closest('#professor-logout-btn')) signOutUser();
        if (closest('#gerar-relatorio-btn')) handleGerarRelatorio();
        if (closest('#imprimir-relatorio-btn')) handleImprimirRelatorio('faltas');
        if (closest('#gerar-apoia-relatorio-btn')) handleGerarApoiaRelatorio();
        if (closest('#imprimir-apoia-relatorio-btn')) handleImprimirRelatorio('apoia');
        if (closest('#imprimir-historico-btn')) handleImprimirRelatorio('historico');
        if (closest('#correcao-chamada-btn')) {
            correcaoChamadaModal.classList.remove('hidden');
            correcaoTurmaSel.innerHTML = '<option value="">Selecione uma turma...</option>';
            turmasCache.forEach(t => correcaoTurmaSel.innerHTML += `<option value="${t.id}">${t.nome_turma}</option>`);
        }
        if (closest('#prev-month-btn')) { dashboardCalendar.month--; if (dashboardCalendar.month < 0) { dashboardCalendar.month = 11; dashboardCalendar.year--; } renderDashboardCalendar(); }
        if (closest('#next-month-btn')) { dashboardCalendar.month++; if (dashboardCalendar.month > 11) { dashboardCalendar.month = 0; dashboardCalendar.year++; } renderDashboardCalendar(); }
        const card = closest('.clickable-card');
        if (card) {
            const type = card.dataset.type;
            if (type === 'presencas' || type === 'faltas') {
                const date = dashboardSelectedDate;
                document.querySelector('.admin-nav-link[data-target="admin-relatorios-panel"]').click();
                setTimeout(() => {
                    document.getElementById('relatorio-data-inicio').value = date;
                    document.getElementById('relatorio-data-fim').value = date;
                    if (type === 'faltas') document.getElementById('relatorio-status-select').value = 'falta';
                    if (type === 'presencas') document.getElementById('relatorio-status-select').value = 'presente';
                    handleGerarRelatorio();
                }, 100);
            } else if (type === 'assiduidade') {
                openAssiduidadeModal();
            }
        }
        const alunoLink = closest('.dashboard-aluno-link');
        if (alunoLink) {
            e.preventDefault();
            openAlunoHistoricoModal(alunoLink.dataset.alunoId);
        }
        const calendarDayCell = closest('[data-date]');
        if (calendarDayCell) {
            const newDate = calendarDayCell.dataset.date;
            if (newDate) {
                dashboardSelectedDate = newDate;
                renderDashboardCalendar();
                loadDailySummary(dashboardSelectedDate);
            }
        }
    });

    notificationBell.addEventListener('click', (e) => {
        e.stopPropagation();
        notificationPanel.classList.toggle('hidden');
    });
    document.addEventListener('click', (e) => {
        const closest = (selector) => e.target.closest(selector);
        if (!notificationPanel.classList.contains('hidden') && !closest('#notification-panel') && !closest('#notification-bell')) {
            notificationPanel.classList.add('hidden');
        }
    });
    if (document.getElementById('clear-notifications-btn')) {
        document.getElementById('clear-notifications-btn').addEventListener('click', markAllNotificationsAsRead);
    }
    if (document.getElementById('notification-list')) {
        document.getElementById('notification-list').addEventListener('click', (e) => {
            const item = e.target.closest('.notification-item');
            if (item) {
                markNotificationAsRead(item.dataset.id);
            }
        });
    }

    ['#chamada-lista-alunos', '#correcao-chamada-lista-alunos'].forEach(selector => {
        const container = document.querySelector(selector);
        if (container) {
            container.addEventListener('change', e => {
                if (e.target.classList.contains('status-radio')) {
                    const row = e.target.closest('[data-aluno-id]');
                    const justDiv = row.querySelector('.justificativa-container');
                    const isFalta = e.target.value === 'falta';
                    if (justDiv) {
                        justDiv.classList.toggle('hidden', !isFalta);
                        if (isFalta) {
                            const injustificadaRadio = row.querySelector('input[value="Falta injustificada"]');
                            if (injustificadaRadio && !row.querySelector('input[name^="just-"]:checked')) {
                                injustificadaRadio.checked = true;
                            }
                        }
                    }
                }
            });
        }
    });
    
    turmaSelect.addEventListener('change', loadChamada);
    dataSelect.addEventListener('change', loadChamada);
    salvarChamadaBtn.addEventListener('click', saveChamada);
    document.getElementById('delete-confirm-checkbox').addEventListener('change', (e) => { document.getElementById('confirm-delete-btn').disabled = !e.target.checked; });
    document.getElementById('evento-data-inicio-filter').addEventListener('change', renderCalendarioPanel);
    document.getElementById('evento-data-fim-filter').addEventListener('change', renderCalendarioPanel);
    document.getElementById('aluno-search-input').addEventListener('input', () => renderAlunosPanel());
    document.getElementById('turma-ano-letivo-filter').addEventListener('change', renderTurmasPanel);
    document.getElementById('aluno-ano-letivo-filter').addEventListener('change', () => {
        document.getElementById('aluno-turma-filter').value = '';
        renderAlunosPanel();
    });
    document.getElementById('aluno-turma-filter').addEventListener('change', () => {
        renderAlunosPanel();
    });
    correcaoTurmaSel.addEventListener('change', loadCorrecaoChamada);
    correcaoDataSel.addEventListener('change', loadCorrecaoChamada);
    
    document.getElementById('promover-turmas-ano-origem').addEventListener('change', renderPromocaoTurmasLista);
    document.getElementById('promover-turmas-confirm-checkbox').addEventListener('change', (e) => {
        document.getElementById('confirm-promocao-turmas-btn').disabled = !e.target.checked;
    });

    const toggleAllCheckbox = document.getElementById('promover-turmas-toggle-all');
    if(toggleAllCheckbox) {
        toggleAllCheckbox.addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('.promocao-turma-checkbox');
            const isTudoMarcado = [...checkboxes].every(cb => cb.checked);
            checkboxes.forEach(cb => cb.checked = !isTudoMarcado);
            toggleAllCheckbox.textContent = !isTudoMarcado ? 'Desmarcar Todas' : 'Marcar Todas';
        });
    }
    
    document.getElementById('assiduidade-tabs').addEventListener('click', (e) => {
        e.preventDefault();
        const link = e.target.closest('a');
        if (!link || link.getAttribute('aria-current') === 'page') return;
        document.querySelectorAll('#assiduidade-tabs a').forEach(a => {
            a.removeAttribute('aria-current');
            a.classList.remove('text-indigo-600', 'border-indigo-500');
            a.classList.add('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300', 'border-transparent');
        });
        link.setAttribute('aria-current', 'page');
        link.classList.add('text-indigo-600', 'border-indigo-500');
        link.classList.remove('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300', 'border-transparent');
        document.querySelectorAll('.assiduidade-panel').forEach(p => p.classList.add('hidden'));
        document.getElementById(link.dataset.target).classList.remove('hidden');
    });

    document.getElementById('assiduidade-aluno-ano').addEventListener('change', e => {
        const ano = e.target.value;
        const turmaSel = document.getElementById('assiduidade-aluno-turma');
        turmaSel.innerHTML = '<option value="">Todas as Turmas</option>';
        if (ano) {
            turmasCache.filter(t => t.ano_letivo == ano)
                .forEach(t => turmaSel.innerHTML += `<option value="${t.id}">${t.nome_turma}</option>`);
        }
        turmaSel.dispatchEvent(new Event('change'));
    });

    document.getElementById('assiduidade-turma-ano').addEventListener('change', e => {
        const ano = e.target.value;
        const turmaSel = document.getElementById('assiduidade-turma-turma');
        turmaSel.innerHTML = '<option value="">Todas as Turmas</option>';
        if (ano) {
            turmasCache.filter(t => t.ano_letivo == ano)
                .forEach(t => turmaSel.innerHTML += `<option value="${t.id}">${t.nome_turma}</option>`);
        }
    });

    document.getElementById('assiduidade-aluno-turma').addEventListener('change', e => {
        const turmaId = e.target.value;
        const alunoSel = document.getElementById('assiduidade-aluno-aluno');
        alunoSel.innerHTML = '<option value="">Todos os Alunos</option>';
        if (turmaId) {
            alunosCache.filter(a => a.turma_id == turmaId)
                .forEach(a => alunoSel.innerHTML += `<option value="${a.id}">${a.nome_completo}</option>`);
        }
    });

    // Inicialização
    dataSelect.value = getLocalDateString();
    ['click', 'mousemove', 'keypress', 'scroll'].forEach(event => document.addEventListener(event, resetInactivityTimer));
    console.log("Sistema de Gestão de Faltas (Supabase) inicializado com todas as funcionalidades.");
});
