// ===============================================================
// relatorios.js - SISTEMA DE RELATÓRIOS
// ===============================================================

async function renderRelatoriosPanel() {
    const tSel = document.getElementById('relatorio-turma-select');
    const aSel = document.getElementById('relatorio-aluno-select');
    const pSel = document.getElementById('relatorio-professor-select');

    tSel.innerHTML = '<option value="">Todas as Turmas</option>';
    turmasCache.forEach(t => tSel.innerHTML += `<option value="${t.id}">${t.nome_turma} (${t.ano_letivo})</option>`);

    pSel.innerHTML = '<option value="">Todos os Professores</option>';
    usuariosCache.filter(u => u.papel === 'professor').forEach(p => pSel.innerHTML += `<option value="${p.user_uid}">${p.nome}</option>`);

    // Filtro em Cascata: Turma -> Aluno
    tSel.onchange = () => {
        const selected = tSel.value;
        aSel.innerHTML = '<option value="">Todos os Alunos</option>';
        const filtrados = selected ? alunosCache.filter(a => a.turma_id == selected) : alunosCache;
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
    const status = document.getElementById('relatorio-status-select').value;

    body.innerHTML = '<tr><td colspan="6" class="p-4 text-center">Gerando relatório...</td></tr>';

    let query = db.from('presencas').select(`data, status, justificativa, alunos(nome_completo), turmas(nome_turma), usuarios(nome)` )
                  .order('data', { ascending: false });

    if (dataIni) query = query.gte('data', dataIni);
    if (dataFim) query = query.lte('data', dataFim);
    if (tId) query = query.eq('turma_id', tId);
    if (aId) query = query.eq('aluno_id', aId);
    if (status) query = query.eq('status', status);

    const { data, error } = await safeQuery(query);
    if (error || !data || data.length === 0) {
        body.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-gray-500">Nenhum registro encontrado.</td></tr>';
        btnImp.classList.add('hidden');
        return;
    }

    body.innerHTML = data.map(r => `
        <tr class="border-b text-sm">
            <td class="p-3">${new Date(r.data + 'T00:00:00').toLocaleDateString()}</td>
            <td class="p-3">${r.alunos?.nome_completo || 'Removido'}</td>
            <td class="p-3">${r.turmas?.nome_turma || 'N/A'}</td>
            <td class="p-3 ${r.status === 'falta' ? 'text-red-600 font-bold' : 'text-green-600'}">${r.status}</td>
            <td class="p-3 text-xs italic">${r.justificativa || ''}</td>
            <td class="p-3 text-gray-500">${r.usuarios?.nome || 'Sistema'}</td>
        </tr>`).join('');
    btnImp.classList.remove('hidden');
}
