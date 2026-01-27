// ===============================================================
// professores.js - GESTÃO DE PROFESSORES
// ===============================================================

async function renderProfessoresPanel() {
    const tableBody = document.getElementById('professores-table-body');
    tableBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center">Carregando...</td></tr>';

    const { data, error } = await safeQuery(
        db.from('usuarios').select('id, user_uid, nome, email, status, email_confirmado')
          .eq('papel', 'professor').order('nome', { ascending: true })
    );

    if (error || !data) {
        tableBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-red-500">Erro ao carregar.</td></tr>';
        return;
    }

    tableBody.innerHTML = data.map(p => {
        const emailStatus = p.email_confirmado 
            ? `<div class="has-tooltip relative"><div class="w-3 h-3 bg-green-500 rounded-full"></div><div class="tooltip">Confirmado</div></div>` 
            : `<div class="has-tooltip relative"><div class="w-3 h-3 bg-red-500 rounded-full"></div><div class="tooltip">Pendente</div></div>`;
        
        return `
        <tr class="border-b">
            <td class="p-3">${p.nome}</td>
            <td class="p-3">${p.email || 'N/A'}</td>
            <td class="p-3"><span class="px-2 py-1 text-xs font-semibold rounded-full ${p.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${p.status}</span></td>
            <td class="p-3 flex justify-center items-center">${emailStatus}</td>
            <td class="p-3">
                <button class="text-blue-600 hover:underline mr-4 edit-professor-btn" data-id="${p.id}">Editar</button>
                <button class="text-orange-600 hover:underline reset-password-btn" data-email="${p.email}">Resetar Senha</button>
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
        document.getElementById('professor-delete-container').classList.remove('hidden');
    } else {
        document.getElementById('professor-modal-title').textContent = 'Adicionar Professor';
        document.getElementById('professor-id').value = '';
        passCont.classList.remove('hidden');
        statCont.classList.add('hidden');
    }
    document.getElementById('professor-modal').classList.remove('hidden');
}

async function handleProfessorFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('professor-id').value;
    const nome = document.getElementById('professor-nome').value;
    const email = document.getElementById('professor-email').value;

    if (id) {
        const status = document.getElementById('professor-status').value;
        const { error } = await safeQuery(db.from('usuarios').update({ nome, email, status }).eq('id', id));
        if (!error) showToast('Professor atualizado!');
    } else {
        const password = document.getElementById('professor-password').value;
        if (password.length < 6) return showToast('Senha curta!', true);
        
        const { data: authData, error: authError } = await db.auth.signUp({ email, password });
        if (authError) return showToast(authError.message, true);

        await safeQuery(db.from('usuarios').insert({ 
            user_uid: authData.user.id, nome, email, papel: 'professor', status: 'ativo' 
        }));
        showToast('Professor criado! Verifique o e-mail.');
    }
    closeModal(document.getElementById('professor-modal'));
    await loadAdminData();
    await renderProfessoresPanel();
}

// CORREÇÃO DA EXCLUSÃO: Esta função será chamada pelo confirmador global
async function deleteProfessor(id) {
    // 1. Busca o user_uid (chave que amarra as turmas)
    const { data: prof } = await db.from('usuarios').select('user_uid').eq('id', id).single();
    if (prof) {
        // 2. Limpa os vínculos de turmas PRIMEIRO
        await db.from('professores_turmas').delete().eq('professor_id', prof.user_uid);
    }
    // 3. Agora apaga o usuário SEM ERRO de chave estrangeira
    const { error } = await db.from('usuarios').delete().eq('id', id);
    return { error };
}
