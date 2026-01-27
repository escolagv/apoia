// ===============================================================
// main.js - MOTOR, CONFIGURAÇÃO E ESTADO GLOBAL
// ===============================================================
const { createClient } = supabase;
const SUPABASE_URL = 'https://agivmrhwytnfprsjsvpy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnaXZtcmh3eXRuZnByc2pzdnB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNTQ3ODgsImV4cCI6MjA3MTgzMDc4OH0.1yL3PaS_anO76q3CUdLkdpNc72EDPYVG5F4cYy6ySS0';

const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variáveis de Cache e Estado Global
let currentUser = null;
let turmasCache = [];
let usuariosCache = [];
let alunosCache = [];
let anosLetivosCache = [];
let dashboardCalendar = { month: new Date().getMonth(), year: new Date().getFullYear() };
let dashboardSelectedDate = null;
let inactivityTimer;
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

// --- FUNÇÕES DE DADOS ---

// Inicializador de Dados para Admin (Alimenta os Caches)
async function loadAdminData() {
    // 1. Carregar Turmas
    const { data: turmas } = await safeQuery(db.from('turmas').select('id, nome_turma, ano_letivo'));
    turmasCache = (turmas || []).sort((a, b) => a.nome_turma.localeCompare(b.nome_turma, undefined, { numeric: true }));
    
    // 2. Carregar Usuários (Profs/Admins)
    const { data: users } = await safeQuery(db.from('usuarios').select('id, user_uid, nome, papel, email_confirmado').in('papel', ['professor', 'admin']).eq('status', 'ativo'));
    usuariosCache = (users || []).sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
    
    // 3. Carregar Alunos
    const { data: allAlunos } = await safeQuery(db.from('alunos').select('id, nome_completo, turma_id').eq('status', 'ativo'));
    alunosCache = (allAlunos || []).sort((a, b) => a.nome_completo.localeCompare(b.nome_completo));
    
    // 4. Carregar Anos Letivos Distintos (via RPC)
    const { data: anos } = await safeQuery(db.rpc('get_distinct_ano_letivo'));
    anosLetivosCache = anos ? anos.sort((a, b) => b - a) : [new Date().getFullYear()];
}

// Executor Seguro de Queries (Trata erros de sessão/JWT)
async function safeQuery(queryBuilder) {
    const { data, error, count } = await queryBuilder;
    if (error) {
        console.error("Supabase Error:", error);
        if (error.message.includes('JWT') || error.code === '401' || error.status === 401) {
            await signOutUser("Sessão expirada. Por favor, entre novamente.");
            return { data: null, error, count: null };
        }
        throw error;
    }
    return { data, error, count };
}

// --- UTILITÁRIOS DE INTERFACE ---

function getLocalDateString() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

// --- GESTÃO DE SESSÃO ---

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        if (currentUser) signOutUser("Sessão encerrada por inatividade.");
    }, INACTIVITY_TIMEOUT);
}

async function signOutUser(message) {
    if (message) showToast(message, true);
    currentUser = null;
    await db.auth.signOut();
    window.location.reload(); // Recarrega para limpar todos os estados da memória
}

// --- INICIALIZAÇÃO ---

document.addEventListener('DOMContentLoaded', () => {
    dashboardSelectedDate = getLocalDateString();
    
    // Monitora atividade para o timer de inatividade
    ['click', 'mousemove', 'keypress', 'scroll'].forEach(ev => 
        document.addEventListener(ev, resetInactivityTimer)
    );
    
    // Ouve mudanças na autenticação (login/logout)
    // Nota: handleAuthChange deve estar definido no seu arquivo ui.js
    db.auth.onAuthStateChange(handleAuthChange);
});
