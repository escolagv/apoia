// ===============================================================
// relatorios.js - SISTEMA DE RELATÓRIOS E CORREÇÃO
// ===============================================================

async function renderRelatoriosPanel() {
    const tSel = document.getElementById('relatorio-turma-select');
    const aSel = document.getElementById('relatorio-aluno-select');
    const pSel = document.getElementById('relatorio-professor-select');

    tSel.innerHTML = '<option value="">Todas as Turmas</option>';
    turmasCache.forEach(t => tSel.innerHTML += `<option value="${t.id}">${t.nome_turma} (${t.ano_letivo})</option>`);

    pSel.innerHTML = '<option value="">Todos os Professores</option>';
    usuariosCache.filter(u => u.papel === 'professor').forEach(p => pSel.innerHTML += `<option value="${p.user_uid}">${p.nome}</option>`);

    // Filtro em Cascata: Selecionar Turma filtra a lista de Alunos
    tSel.onchange = () => {
        const selectedTurma = tSel.value;
        aSel.innerHTML = '<option value="">Todos os Alunos</option>';
        const filtrados = selectedTurma ? alunosCache.filter(a => a.turma_id == selectedTurma) : alunosCache;
        filtrados.forEach(a => aSel.innerHTML += `<option value="${a.id}">${a.nome_completo}</option>`);
    };
    tSel.onchange();
}

async function handleGerarRelatorio() {
    const body = document.getElementById('relatorio-table-body');
    const btnImp = document.getElementById('imprimir-relatorio-btn');
    const dataIni = document.getElementById('relatorio-data-inicio').value;
    const dataFim = document.getElementById('relatorio-data-fim').value;
    const tId = document.getElementById('relatorio-turma-select').value;
    const aId = document.getElementById('relatorio-aluno-select').value;
    const profUid = document.getElementById('relatorio-professor-select').value;
    const status = document.getElementById('relatorio-status-select').value;

    body.innerHTML = '<tr><td colspan="6" class="p-4 text-center">Gerando relatório...</td></tr>';

    let query = db.from('presencas').select(`data, status, justificativa, alunos(nome_completo), turmas(nome_turma), usuarios(nome)` )
                  .order('data', { ascending: false });

    if (dataIni) query = query.gte('data', dataIni);
    if (dataFim) query = query.lte('data', dataFim);
    if (tId) query = query.eq('turma_id', tId);
    if (aId) query = query.eq('aluno_id', aId);
    if (profUid) query = query.eq('registrado_por_uid', profUid);
    if (status) query = query.eq('status', status);

    const { data, error } = await safeQuery(query);
    
    if (error || !data || data.length === 0) {
        body.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-gray-500">Nenhum registro encontrado para estes filtros.</td></tr>';
        btnImp.classList.add('hidden');
        return;
    }

    body.innerHTML = data.map(r => `
        <tr class="border-b text-sm">
            <td class="p-3">${new Date(r.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
            <td class="p-3 font-medium">${r.alunos?.nome_completo || 'Removido'}</td>
            <td class="p-3">${r.turmas?.nome_turma || 'N/A'}</td>
            <td class="p-3">
                <span class="font-bold ${r.status === 'falta' ? 'text-red-600' : 'text-green-600'}">${r.status.toUpperCase()}</span>
            </td>
            <td class="p-3 text-xs italic text-gray-600">${r.justificativa || ''}</td>
            <td class="p-3 text-gray-500">${r.usuarios?.nome || 'Sistema'}</td>
        </tr>`).join('');
    
    btnImp.classList.remove('hidden');
}

async function loadCorrecaoChamada() {
    const tId = document.getElementById('correcao-turma-select').value;
    const data = document.getElementById('correcao-data-select').value;
    const container = document.getElementById('correcao-chamada-lista-alunos');

    if (!tId || !data) {
        container.innerHTML = '<p class="text-center p-4 text-gray-500">Selecione turma e data para carregar.</p>';
        return;
    }
    
    container.innerHTML = '<div class="loader mx-auto my-4"></div>';

    const { data: alunos } = await safeQuery(db.from('alunos').select('id, nome_completo').eq('turma_id', tId).eq('status', 'ativo').order('nome_completo'));
    const { data: presencas } = await safeQuery(db.from('presencas').select('aluno_id, status, justificativa').eq('turma_id', tId).eq('data', data));

    const presMap = new Map(presencas?.map(p => [p.aluno_id, p]));
    container.innerHTML = '';

    alunos.forEach(aluno => {
        const p = presMap.get(aluno.id) || { status: 'presente', justificativa: null };
        const div = document.createElement('div');
        div.className = 'p-3 bg-gray-50 rounded-lg border-b mb-2';
        div.innerHTML = `
            <div class="flex justify-between items-center" data-aluno-id="${aluno.id}">
                <span class="font-medium">${aluno.nome_completo}</span>
                <div class="flex gap-4">
                    <label class="cursor-pointer"><input type="radio" name="corr-${aluno.id}" value="presente" ${p.status === 'presente' ? 'checked' : ''}> Pres.</label>
                    <label class="cursor-pointer text-red-600"><input type="radio" name="corr-${aluno.id}" value="falta" ${p.status === 'falta' ? 'checked' : ''}> Falta</label>
                </div>
            </div>`;
        container.appendChild(div);
    });
}

function handleImprimirRelatorio(type) {
    window.print();
}
