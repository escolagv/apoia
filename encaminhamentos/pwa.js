import { db, SUPABASE_URL, SUPABASE_ANON_KEY } from './js/core.js';

const params = new URLSearchParams(window.location.search);
const token = params.get('token') || '';

const tokenEl = document.getElementById('pwa-token');
const statusEl = document.getElementById('pwa-status');
const captureArea = document.getElementById('capture-area');
const openCameraBtn = document.getElementById('open-camera-btn');
const captureBtn = document.getElementById('capture-btn');
const retakeBtn = document.getElementById('retake-btn');
const uploadBtn = document.getElementById('upload-btn');
const uploadStatus = document.getElementById('upload-status');
const fileInput = document.getElementById('file-input');
const video = document.getElementById('camera-preview');
const canvas = document.getElementById('capture-canvas');

const deviceIdKey = 'enc_device_id';
let deviceId = localStorage.getItem(deviceIdKey);
if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(deviceIdKey, deviceId);
}

let cameraStream = null;
let capturedBlob = null;

if (tokenEl) {
    tokenEl.textContent = token ? `Token do dia: ${token}` : 'Token não informado.';
}

async function validateToken() {
    if (!token) {
        setStatus('Token não encontrado. Abra pelo QR.', true);
        return false;
    }
    setStatus('Validando QR...', false);
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/enc_qr_validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                apikey: SUPABASE_ANON_KEY
            },
            body: JSON.stringify({ token, device_id: deviceId })
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || 'Falha na validação.');
        const expiresAt = payload?.expires_at;
        if (expiresAt) {
            const time = new Date(expiresAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            setStatus(`Acesso liberado até ${time}.`, false);
        } else {
            setStatus('Acesso liberado.', false);
        }
        return true;
    } catch (err) {
        setStatus(err?.message || 'Falha na validação.', true);
        return false;
    }
}

function setStatus(message, isError) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.toggle('text-red-600', !!isError);
    statusEl.classList.toggle('text-gray-500', !isError);
}

function showCaptureArea(show) {
    if (!captureArea) return;
    captureArea.classList.toggle('hidden', !show);
}

async function openCamera() {
    if (!video) return;
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        video.srcObject = cameraStream;
        video.classList.remove('hidden');
        captureBtn?.classList.remove('hidden');
        retakeBtn?.classList.add('hidden');
        canvas?.classList.add('hidden');
    } catch (err) {
        setStatus('Não foi possível abrir a câmera. Use o upload manual.', true);
    }
}

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
}

function capturePhoto() {
    if (!video || !canvas) return;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);
    canvas.toBlob((blob) => {
        capturedBlob = blob;
        canvas.classList.remove('hidden');
        video.classList.add('hidden');
        captureBtn?.classList.add('hidden');
        retakeBtn?.classList.remove('hidden');
        uploadBtn?.classList.remove('hidden');
    }, 'image/jpeg', 0.92);
    stopCamera();
}

function resetCapture() {
    capturedBlob = null;
    uploadBtn?.classList.add('hidden');
    canvas?.classList.add('hidden');
    video?.classList.add('hidden');
    captureBtn?.classList.add('hidden');
    retakeBtn?.classList.add('hidden');
}

async function uploadBlob(blob, fileName) {
    if (!blob) return;
    uploadStatus.textContent = 'Enviando...';
    try {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const path = `enc_temp/${year}/${month}/${day}/${deviceId}/${Date.now()}_${fileName}`;

        const { error: uploadError } = await db.storage
            .from('enc_temp')
            .upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: false });

        if (uploadError) throw uploadError;

        const { error: jobError } = await db
            .from('enc_scan_jobs')
            .insert({
                status: 'novo',
                storage_path: path,
                mime_type: blob.type || 'image/jpeg',
                device_id: deviceId
            });

        if (jobError) throw jobError;

        uploadStatus.textContent = 'Enviado para a fila com sucesso.';
        resetCapture();
        if (fileInput) fileInput.value = '';
    } catch (err) {
        uploadStatus.textContent = err?.message || 'Falha ao enviar.';
    }
}

openCameraBtn?.addEventListener('click', openCamera);
captureBtn?.addEventListener('click', capturePhoto);
retakeBtn?.addEventListener('click', () => {
    resetCapture();
    openCamera();
});

fileInput?.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    capturedBlob = file;
    uploadBtn?.classList.remove('hidden');
    uploadStatus.textContent = '';
});

uploadBtn?.addEventListener('click', () => {
    if (!capturedBlob) return;
    uploadBlob(capturedBlob, capturedBlob.name || 'captura.jpg');
});

// Inicialização
(async () => {
    const ok = await validateToken();
    showCaptureArea(ok);
})();
