// ===============================================================
// main.js - CONFIGURAÇÃO, ESTADO GLOBAL E MOTOR
// ===============================================================
const { createClient } = supabase;
const SUPABASE_URL = 'https://agivmrhwytnfprsjsvpy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnaXZtcmh3eXRuZnByc2pzdnB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNTQ3ODgsImV4cCI6MjA3MTgzMDc4OH0.1yL3PaS_anO76q3CUdLkdpNc72EDPYVG5F4cYy6ySS0';

const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Estado da aplicação (Caches Globais)
let currentUser = null;
let turmasCache = [];
let usuariosCache = [];
let alunosCache = [];
let anosLetivosCache = [];
let dashboardCalendar = { month: new Date().getMonth(), year: new Date().getFullYear() };
let dashboardSelectedDate = null;
let inactivityTimer;
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

// Variáveis do Módulo APOIA
let apoiaCurrentPage = 1;
const apoiaItemsPerPage = 10;

// Executor de Queries Seguro
async function safeQuery(queryBuilder) {
    const { data, error, count } = await queryBuilder;
    if (error) {
        console.error("Supabase Error:", error);
        if (error.message.includes('JWT') || error.code === '401' || error.status === 401) {
            await signOutUser("Sua sessão expirou por segurança. Por favor, faça o login novamente.");
            return { data: null, error, count: null };
        }
        throw error;
    }
    return { data, error, count };
}

// Carregamento de Dados para Admin
async function loadAdminData() {
    const { data: turmas } = await safeQuery(db.from('turmas').select('id, nome_turma, ano_letivo'));
    turmasCache = (turmas || []).sort((a, b) => a.nome_turma.localeCompare(b.nome_turma, undefined, { numeric: true }));
    
    const { data: users } = await safeQuery(db.from('usuarios').select('id, user_uid, nome, papel, email_confirmado').in('papel', ['professor', 'admin']).eq('status', 'ativo'));
    usuariosCache = (users || []).sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
    
    const { data: allAlunos } = await safeQuery(db.from('alunos').select('id, nome_completo, turma_id').eq('status', 'ativo'));
    alunosCache = (allAlunos || []).sort((a, b) => a.nome_completo.localeCompare(b.nome_completo));
    
    const { data: anos } = await safeQuery(db.rpc('get_distinct_ano_letivo'));
    anosLetivosCache = anos ? anos.sort((a, b) => b - a) : [new Date().getFullYear()];
}

// Utilitários Gerais
function getLocalDateString() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function showToast(message, isError = false) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
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
    inactivityTimer = setTimeout(() => { if (currentUser) signOutUser("Sessão encerrada por inatividade."); }, INACTIVITY_TIMEOUT);
}

async function signOutUser(message) {
    if (message) showToast(message, true);
    currentUser = null;
    await db.auth.signOut();
    window.location.reload();
}

document.addEventListener('DOMContentLoaded', () => {
    dashboardSelectedDate = getLocalDateString();
    ['click', 'mousemove', 'keypress', 'scroll'].forEach(event => document.addEventListener(event, resetInactivityTimer));
    db.auth.onAuthStateChange(handleAuthChange);
});
