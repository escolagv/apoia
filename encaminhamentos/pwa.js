import { db, SUPABASE_URL, SUPABASE_ANON_KEY } from './js/core.js';

const params = new URLSearchParams(window.location.search);
const tokenFromQuery = params.get('token');
const tokenFromHref = (() => {
    const match = window.location.href.match(/token=([^&]+)/i);
    return match ? decodeURIComponent(match[1]) : '';
})();
const token = tokenFromQuery || tokenFromHref || '';

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
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ token, device_id: deviceId })
        });
        let payload = {};
        try {
            payload = await response.json();
        } catch (err) {
            payload = {};
        }
        if (!response.ok) {
            const msg = payload?.error || `Falha na validação (${response.status})`;
            throw new Error(msg);
        }
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
    uploadStatus.textContent = 'Lendo documento...';
    try {
        const ocrJson = await runOcr(blob);
        uploadStatus.textContent = 'Enviando...';
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
                device_id: deviceId,
                ocr_json: ocrJson || null
            });

        if (jobError) throw jobError;

        uploadStatus.textContent = 'Enviado para a fila com sucesso.';
        resetCapture();
        if (fileInput) fileInput.value = '';
    } catch (err) {
        uploadStatus.textContent = err?.message || 'Falha ao enviar.';
    }
}

async function runOcr(blob) {
    if (!window.Tesseract) return null;
    try {
        const image = await createImageBitmap(blob);
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        preprocessCanvas(ctx, canvas.width, canvas.height);

        const result = await window.Tesseract.recognize(canvas, 'por', {
            logger: () => {}
        });
        const data = result?.data;
        if (!data) return null;

        const fields = extractHeaderFields(data);
        const motivos = extractCheckedLabels(data, ctx, motivoDefs);
        const acoes = extractCheckedLabels(data, ctx, acaoDefs);
        const providencias = extractCheckedLabels(data, ctx, providenciaDefs);

        return {
            fields,
            motivos,
            acoes,
            providencias,
            raw_text: data.text || ''
        };
    } catch (err) {
        console.warn('OCR falhou:', err?.message || err);
        return null;
    }
}

function normalizeText(text) {
    return (text || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function extractHeaderFields(data) {
    const fields = { professor: '', estudante: '', turma: '', data: '', matricula: '' };
    const lines = data.lines || [];
    lines.forEach(line => {
        const raw = line.text || '';
        const norm = normalizeText(raw);
        if (norm.includes('professor')) {
            fields.professor = raw.replace(/.*professor[^\w]*/i, '').trim();
        } else if (norm.includes('estudante')) {
            fields.estudante = raw.replace(/.*estudante[^\w]*/i, '').trim();
        } else if (norm.startsWith('turma')) {
            fields.turma = raw.replace(/.*turma[^\w]*/i, '').trim();
        } else if (norm.includes('matricula')) {
            fields.matricula = raw.replace(/.*matricula[^\d]*/i, '').replace(/\D+/g, '').trim();
        } else if (norm.startsWith('data')) {
            fields.data = raw.replace(/.*data[^\w]*/i, '').trim();
        }
    });
    if (!fields.matricula) {
        const match = (data.text || '').match(/matri[^\d]*([0-9]{4,})/i);
        if (match) fields.matricula = match[1];
    }
    return fields;
}

const motivoDefs = [
    { label: 'Indisciplina / Xingamentos', tokens: ['indisciplina', 'xing'] },
    { label: 'Gazeando aula', tokens: ['gazeando'] },
    { label: 'Agressão / Bullying / Discriminação', tokens: ['agressao', 'bullying'] },
    { label: 'Uso de celular / fone de ouvido', tokens: ['uso', 'celular'] },
    { label: 'Dificuldade de aprendizado', tokens: ['dificuldade', 'aprendizado'] },
    { label: 'Desrespeito com professor / profissionais da unidade escolar', tokens: ['desrespeito', 'professor'] },
    { label: 'Não produz e não participa em sala', tokens: ['nao', 'produz'] }
];

const acaoDefs = [
    { label: 'Diálogo com o estudante', tokens: ['dialogo', 'estudante'] },
    { label: 'Comunicado aos responsáveis', tokens: ['comunicado', 'responsaveis'] },
    { label: 'Mensagem via WhatsApp', tokens: ['mensagem', 'whatsapp'] }
];

const providenciaDefs = [
    { label: 'Solicitar comparecimento do responsável na escola', tokens: ['comparecimento'] },
    { label: 'Advertência', tokens: ['advertencia'] }
];

function extractCheckedLabels(data, ctx, defs) {
    const lines = data.lines || [];
    const checked = [];
    defs.forEach(def => {
        const line = lines.find(l => {
            const norm = normalizeText(l.text);
            return def.tokens.every(token => norm.includes(token));
        });
        if (!line || !line.bbox) return;
        const isChecked = detectMarkInline(ctx, line.bbox) || detectMarkLeft(ctx, line.bbox);
        if (isChecked) checked.push(def.label);
    });
    return checked;
}

function detectMarkInline(ctx, bbox) {
    const { x0, y0, x1, y1 } = bbox;
    const height = y1 - y0;
    const width = Math.max(20, height * 1.1);
    const x = Math.max(0, x0);
    const y = Math.max(0, y0 - 2);
    const w = Math.max(10, width);
    const h = Math.max(10, height + 4);
    return isRegionDark(ctx, x, y, w, h, 0.14);
}

function detectMarkLeft(ctx, bbox) {
    const { x0, y0, x1, y1 } = bbox;
    const height = y1 - y0;
    const width = Math.max(18, height * 0.8);
    const x = Math.max(0, x0 - width - 6);
    const y = Math.max(0, y0 - 2);
    const w = Math.max(8, width);
    const h = Math.max(8, height + 4);
    return isRegionDark(ctx, x, y, w, h, 0.18);
}

function isRegionDark(ctx, x, y, w, h, threshold) {
    try {
        const imageData = ctx.getImageData(x, y, w, h);
        const data = imageData.data;
        let dark = 0;
        const total = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const lum = (r + g + b) / 3;
            if (lum < 130) dark += 1;
        }
        const ratio = dark / total;
        return ratio > threshold;
    } catch (err) {
        return false;
    }
}

function preprocessCanvas(ctx, width, height) {
    try {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const contrast = 1.2;
        const brightness = 5;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const gray = (r * 0.299 + g * 0.587 + b * 0.114);
            const adj = Math.min(255, Math.max(0, (gray - 128) * contrast + 128 + brightness));
            data[i] = adj;
            data[i + 1] = adj;
            data[i + 2] = adj;
        }
        ctx.putImageData(imageData, 0, 0);
    } catch (err) {
        // ignore
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
