// ===============================================================
// main.js - CONFIGURAÇÃO, ESTADO GLOBAL E UTILITÁRIOS
// ===============================================================
const { createClient } = supabase;
const SUPABASE_URL = 'https://agivmrhwytnfprsjsvpy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnaXZtcmh3eXRuZnByc2pzdnB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNTQ3ODgsImV4cCI6MjA3MTgzMDc4OH0.1yL3PaS_anO76q3CUdLkdpNc72EDPYVG5F4cYy6ySS0';

const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Estado Global da Aplicação
let currentUser = null;
let turmasCache = [];
let usuariosCache = [];
let alunosCache = [];
let anosLetivosCache = [];
let dashboardCalendar = { month: new Date().getMonth(), year: new Date().getFullYear() };
let dashboardSelectedDate = null;
let inactivityTimer;
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

// Utilitários de Data
function getLocalDateString() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Sistema de Notificações (Toast)
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

// Executor de Queries Seguro
async function safeQuery(queryBuilder) {
    const { data, error, count } = await queryBuilder;
    if (error) {
        console.error("Supabase Error:", error);
        if (error.message.includes('JWT') || error.code === '401' || error.status === 401) {
            await signOutUser("Sua sessão expirou. Por favor, entre novamente.");
            return { data: null, error, count: null };
        }
        throw error;
    }
    return { data, error, count };
}

// Reset de Inatividade
function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        if (currentUser) signOutUser("Sessão encerrada por inatividade.");
    }, INACTIVITY_TIMEOUT);
}

// Logout
async function signOutUser(message) {
    if (message) showToast(message, true);
    currentUser = null;
    await db.auth.signOut();
    window.location.reload(); // Limpa todo o estado do navegador
}

// Inicialização de Escuta de Eventos Globais
document.addEventListener('DOMContentLoaded', () => {
    dashboardSelectedDate = getLocalDateString();
    ['click', 'mousemove', 'keypress', 'scroll'].forEach(ev => 
        document.addEventListener(ev, resetInactivityTimer)
    );
    db.auth.onAuthStateChange(handleAuthChange);
});
