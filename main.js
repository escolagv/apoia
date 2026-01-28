// ===============================================================
// main.js - MOTOR, CONFIGURAÇÃO E ESTADO GLOBAL
// ===============================================================
const { createClient } = supabase;
const SUPABASE_URL = 'https://agivmrhwytnfprsjsvpy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnaXZtcmh3eXRuZnByc2pzdnB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNTQ3ODgsImV4cCI6MjA3MTgzMDc4OH0.1yL3PaS_anO76q3CUdLkdpNc72EDPYVG5F4cYy6ySS0';

const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Estado da aplicação (Cópia fiel do seu original)
let currentUser = null;
let turmasCache = [];
let usuariosCache = [];
let alunosCache = [];
let dashboardCalendar = { month: new Date().getMonth(), year: new Date().getFullYear() };
let apoiaCurrentPage = 1;
const apoiaItemsPerPage = 10;
let anosLetivosCache = [];
let dashboardSelectedDate;
let inactivityTimer;
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

function getLocalDateString() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function safeQuery(queryBuilder) {
    const { data, error, count } = await queryBuilder;
    if (error) {
        console.error("Supabase Error:", error);
        if (error.message.includes('JWT') || error.code === '401' || error.status === 401 || (error.details && error.details.includes('revoked'))) {
            await signOutUser("Sua sessão expirou por segurança. Por favor, faça o login novamente.");
            return { data: null, error, count: null };
        }
        throw error;
    }
    return { data, error, count };
}

function showToast(message, isError = false) {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast p-4 rounded-lg shadow-lg text-white ${isError ? 'bg-red-500' : 'bg-green-500'}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('hide');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 5000);
}

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        if (currentUser) signOutUser("Sessão encerrada por inatividade.");
    }, INACTIVITY_TIMEOUT);
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
        document.getElementById('login-error').textContent = '';
        if (loginButton) {
            loginButton.disabled = false;
            loginButton.innerHTML = 'Entrar';
        }
    }
}

async function loadAdminData() {
    const { data: turmas } = await safeQuery(db.from('turmas').select('id, nome_turma, ano_letivo'));
    turmasCache = (turmas || []).sort((a, b) => a.nome_turma.localeCompare(b.nome_turma, undefined, { numeric: true }));
    const { data: users } = await safeQuery(db.from('usuarios').select('id, user_uid, nome, papel, email_confirmado').in('papel', ['professor', 'admin']).eq('status', 'ativo'));
    usuariosCache = (users || []).sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
    const { data: allAlunos } = await safeQuery(db.from('alunos').select('id, nome_completo, turma_id').eq('status', 'ativo'));
    alunosCache = (allAlunos || []).sort((a, b) => a.nome_completo.localeCompare(b.nome_completo));
    const { data: anos } = await safeQuery(db.rpc('get_distinct_ano_letivo'));
    anosLetivosCache = anos ? anos.sort((a, b) => b - a) : [];
}

document.addEventListener('DOMContentLoaded', () => {
    dashboardSelectedDate = getLocalDateString();
    ['click', 'mousemove', 'keypress', 'scroll'].forEach(event => document.addEventListener(event, resetInactivityTimer));
    db.auth.onAuthStateChange((event, session) => { handleAuthChange(event, session); });
});
