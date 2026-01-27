// ===============================================================
// professores.js - GESTÃO COMPLETA DE PROFESSORES
// ===============================================================

async function renderProfessoresPanel() {
    const tableBody = document.getElementById('professores-table-body');
    tableBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center">Carregando professores...</td></tr>';

    const { data, error } = await safeQuery(
        db.from('usuarios')
          .select('id, user_uid, nome, email, status, email_confirmado')
          .eq('papel', 'professor')
          .order('nome', { ascending: true })
    );

    if (error || !data) {
        tableBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-red-500">Erro ao carregar dados.</td></tr>';
        return;
    }

    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-500">Nenhum professor cadastrado.</td></tr>';
        return;
    }

    tableBody.innerHTML = data.map(p => {
        const emailStatus = p.email_confirmado 
            ? `<div class="has-tooltip relative"><div class="w-3 h-3 bg-green-500 rounded-full"></div><div class="tooltip">E-mail Confirmado</div></div>` 
            : `<div class="has-tooltip relative"><div class="w-3 h-3 bg-red-500 rounded-full"></div><div class="tooltip">Confirmação Pendente</div></div>`;
        
        return `
        <tr class="border-b hover:bg-gray-50">
            <td class="p-3">${p.nome}</td>
            <td class="p-3">${p.email || 'Não informado'}</td>
            <td class="p-3">
                <span class="px-2 py-1 text-xs font-semibold rounded-full ${p.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${p.status}
                </span>
            </td>
            <td class="p-3 flex justify-center items-center">${emailStatus}</td>
            <td class="p-3 whitespace-nowrap">
                <button class="text-blue-600 hover:underline mr-4 edit-professor-btn" data-id="${p.id}">Editar</button>
                <button class="text-orange-600 hover:underline mr-4 reset-password-btn" data-email="${p.email}">Resetar Senha</button>
                <button class="text-red-600 hover:underline delete-btn" data-type="professor" data-id="${p.id}">Excluir</button>
            </td>
        </tr>`;
    }).join('');
}

async function openProfessorModal(editId = null) {
    const form = document.getElementById('professor-form');
    const passCont = document.getElementById('password-field-container');
    const statCont = document.getElementById('status-field-container');
    form.reset();
    document.getElementById('professor-delete-container').classList.add('hidden');

    if (editId) {
        const { data } = await safeQuery(db.from('usuarios').select('*').eq('id', editId).single());
        if (!data) return;
        document.getElementById('professor-modal-title').textContent = 'Editar Professor';
        document.getElementById('professor-id').value = data.id;
        document.getElementById('professor-nome').value = data.nome;
        document.getElementById('professor-email').value = data.email;
        document.getElementById('professor-status').value = data.status;
        passCont.classList.add('hidden');
        statCont.classList.remove('hidden');
    } else {
        document.getElementById('professor-modal-title').textContent = 'Adicionar Professor';
        document.getElementById('professor-id').value = '';
        passCont.classList.remove('hidden');
        statCont.classList.add('hidden');
    }
    document.getElementById('professor-modal').classList.remove('hidden');
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
        if (password.length < 6) return showToast('A senha deve ter no mínimo 6 caracteres.', true);
        
        const { data: authData, error: authError } = await db.auth.signUp({ email, password });
        if (authError) return showToast('Erro no cadastro: ' + authError.message, true);

        await safeQuery(db.from('usuarios').insert({ 
            user_uid: authData.user.id, nome, email, papel: 'professor', status: 'ativo' 
        }));
        showToast('Professor criado! E-mail de confirmação enviado.');
    }
    closeModal(document.getElementById('professor-modal'));
    await loadAdminData();
    renderProfessoresPanel();
}

async function handleResetPassword(email) {
    if (!email) return showToast('E-mail do professor não encontrado.', true);
    if (confirm(`Deseja enviar um link de redefinição de senha para ${email}?`)) {
        const { error } = await db.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.href.split('#')[0]
        });
        if (error) showToast('Erro ao enviar e-mail: ' + error.message, true);
        else showToast('E-mail de redefinição enviado com sucesso!');
    }
}

async function deleteProfessor(id) {
    const { data: prof } = await safeQuery(db.from('usuarios').select('user_uid').eq('id', id).single());
    if (prof) {
        await db.from('professores_turmas').delete().eq('professor_id', prof.user_uid);
    }
    const { error } = await db.from('usuarios').delete().eq('id', id);
    return { error };
}
