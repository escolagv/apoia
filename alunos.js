// ===============================================================
// alunos.js - GESTÃO DE ALUNOS E FILTROS INTELIGENTES
// ===============================================================

async function renderAlunosPanel(options = {}) {
    const tableBody = document.getElementById('alunos-table-body');
    const anoFilter = document.getElementById('aluno-ano-letivo-filter');
    const turmaFilter = document.getElementById('aluno-turma-filter');
    const search = document.getElementById('aluno-search-input').value;

    // Preservar seleção atual ou definir padrão
    if (options.defaultToLatestYear && anosLetivosCache.length > 0) {
        anoFilter.value = anosLetivosCache[0];
    }
    
    const selectedAno = anoFilter.value;

    // Atualiza o seletor de turmas baseado no ano
    turmaFilter.innerHTML = '<option value="">Todas as Turmas</option>';
    if (selectedAno) {
        turmasCache.filter(t => t.ano_letivo == selectedAno).forEach(t => {
            turmaFilter.innerHTML += `<option value="${t.id}">${t.nome_turma}</option>`;
        });
    }

    tableBody.innerHTML = '<tr><td colspan="7" class="p-4 text-center">Carregando...</td></tr>';

    let query = db.from('alunos').select(`*, turmas ( nome_turma, ano_letivo )`);

    if (search) {
        query = query.or(`nome_completo.ilike.%${search}%,matricula.ilike.%${search}%`);
    }

    // CORREÇÃO DO ERRO PGRST100: Filtro Inteligente
    if (selectedAno) {
        if (parseInt(selectedAno) >= 2026) {
            // Pega IDs das turmas do ano selecionado para evitar erro de join no .or()
            const idsTurmasAno = turmasCache.filter(t => t.ano_letivo == selectedAno).map(t => t.id);
            if (idsTurmasAno.length > 0) {
                query = query.or(`turma_id.is.null,turma_id.in.(${idsTurmasAno.join(',')})`);
            } else {
                query = query.is('turma_id', null);
            }
        } else {
            // Anos anteriores: busca apenas quem estava em turmas daquele ano
            const idsAntigos = turmasCache.filter(t => t.ano_letivo == selectedAno).map(t => t.id);
            query = query.in('turma_id', idsAntigos);
        }
    }

    if (turmaFilter.value) {
        query = query.eq('turma_id', turmaFilter.value);
    }

    const { data, error } = await safeQuery(query.order('nome_completo'));
    if (error || !data) return;

    tableBody.innerHTML = data.map(aluno => {
        let statusColor = aluno.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
        const isPast = selectedAno && parseInt(selectedAno) < 2026;

        return `
        <tr class="border-b">
            <td class="p-3">${aluno.nome_completo}</td>
            <td class="p-3">${aluno.matricula || ''}</td>
            <td class="p-3">${aluno.turmas ? aluno.turmas.nome_turma : '<span class="text-orange-500 font-bold">Sem turma</span>'}</td>
            <td class="p-3">${aluno.nome_responsavel || ''}</td>
            <td class="p-3">${aluno.telefone || ''}</td>
            <td class="p-3"><span class="px-2 py-1 text-xs font-semibold rounded-full ${statusColor}">${aluno.status}</span></td>
            <td class="p-3">
                ${!isPast ? `<button class="text-blue-600 hover:underline edit-aluno-btn" data-id="${aluno.id}">Editar</button>` : ''}
                <button class="text-indigo-600 hover:underline ml-2 historico-aluno-btn" data-id="${aluno.id}">Histórico</button>
            </td>
        </tr>`;
    }).join('');
}

async function deleteAluno(id) {
    // Tenta deletar (Hard Delete)
    const { error } = await db.from('alunos').delete().eq('id', id);
    
    // Se der erro de FK (presenças existentes), oferece inativar (Soft Delete)
    if (error && error.code === '23503') {
        if (confirm("Este aluno possui histórico e não pode ser apagado. Deseja INATIVAR o registro para manter os relatórios?")) {
            return await db.from('alunos').update({ status: 'inativo' }).eq('id', id);
        }
    }
    return { error };
}
