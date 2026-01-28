// ===============================================================
// professores.js - GESTÃO DE PROFESSORES
// ===============================================================

async function renderProfessoresPanel() {
    const professoresTableBody = document.getElementById('professores-table-body');
    professoresTableBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center">Carregando...</td></tr>';
    const { data, error } = await safeQuery(db.from('usuarios').select('id, user_uid, nome, email, status, email_confirmado').eq('papel', 'professor').order('status', { ascending: true }).order('nome', { ascending: true }));
    if (error || !data) {
        professoresTableBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-red-500">Erro ao carregar.</td></tr>';
        return;
    }
    professoresTableBody.innerHTML = data.map(p => {
        const emailStatusIndicator = p.email_confirmado ? `<div class="has-tooltip relative"><div class="w-3 h-3 bg-green-500 rounded-full"></div><div class="tooltip">Confirmado</div></div>` : `<div class="has-tooltip relative"><div class="w-3 h-3 bg-red-500 rounded-full"></div><div class="tooltip">Pendente</div></div>`;
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
        </tr>`;
    }).join('');
}

async function openProfessorModal(editId = null) {
    const professorForm = document.getElementById('professor-form');
    const professorModal = document.getElementById('professor-modal');
    const passwordContainer = document.getElementById('password-field-container');
    const statusContainer = document.getElementById('status-field-container');
    professorForm.reset();
    document.getElementById('professor-delete-container').classList.add('hidden');
    if (editId) {
        const { data } = await safeQuery(db.from('usuarios').select('*').eq('id', editId).single());
        if(!data) { showToast('Professor não encontrado.', true); return; }
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
    const id = document.getElementById('professor-id').value;
    const nome = document.getElementById('professor-nome').value;
    const email = document.getElementById('professor-email').value;
    if (id) {
        const status = document.getElementById('professor-status').value;
        const { error } = await safeQuery(db.from('usuarios').update({ nome, email, status }).eq('id', id));
        if (!error) showToast('Professor atualizado com sucesso!');
    } else {
        const password = document.getElementById('professor-password').value;
        const { data: authData, error: authError } = await db.auth.signUp({ email, password });
        if (authError) { showToast('Erro ao criar login: ' + authError.message, true); return; }
        await safeQuery(db.from('usuarios').insert({ user_uid: authData.user.id, nome, email, papel: 'professor', status: 'ativo' }));
        showToast('Professor criado! E-mail de confirmação enviado.');
    }
    closeModal(document.getElementById('professor-modal'));
    await loadAdminData();
    renderProfessoresPanel();
}

async function handleResetPassword(email) {
    if (!email) return;
    if (confirm(`Deseja enviar um link de redefinição para ${email}?`)) {
        const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo: window.location.href.split('#')[0] });
        if (error) showToast('Erro: ' + error.message, true);
        else showToast('E-mail enviado!');
    }
}

async function deleteProfessor(id) {
    const { data: prof } = await safeQuery(db.from('usuarios').select('user_uid').eq('id', id).single());
    if (prof) { await db.from('professores_turmas').delete().eq('professor_id', prof.user_uid); }
    return await db.from('usuarios').delete().eq('id', id);
}
