// ===============================================================
// relatorios.js - RELATÓRIOS E ASSIDUIDADE
// ===============================================================

async function renderRelatoriosPanel() {
    const tSel = document.getElementById('relatorio-turma-select');
    const aSel = document.getElementById('relatorio-aluno-select');
    
    tSel.innerHTML = '<option value="">Todas</option>';
    turmasCache.forEach(t => tSel.innerHTML += `<option value="${t.id}">${t.nome_turma} (${t.ano_letivo})</option>`);
    
    // Filtro em cascata: Turma -> Alunos
    tSel.onchange = () => {
        const val = tSel.value;
        aSel.innerHTML = '<option value="">Todos</option>';
        const filtrados = val ? alunosCache.filter(a => a.turma_id == val) : alunosCache;
        filtrados.forEach(a => aSel.innerHTML += `<option value="${a.id}">${a.nome_completo}</option>`);
    };
    tSel.onchange(); // Inicializa
}

async function handleGerarRelatorio() {
    const body = document.getElementById('relatorio-table-body');
    const btnImp = document.getElementById('imprimir-relatorio-btn');
    body.innerHTML = '<tr><td colspan="6" class="p-4 text-center">Gerando...</td></tr>';

    let query = db.from('presencas').select(`data, status, justificativa, alunos(nome_completo), turmas(nome_turma), usuarios(nome)` )
                  .order('data', { ascending: false });

    const tId = document.getElementById('relatorio-turma-select').value;
    const aId = document.getElementById('relatorio-aluno-select').value;
    if (tId) query = query.eq('turma_id', tId);
    if (aId) query = query.eq('aluno_id', aId);

    const { data, error } = await safeQuery(query);
    if (error || !data) return;

    body.innerHTML = data.map(r => `
        <tr class="border-b">
            <td class="p-3">${new Date(r.data + 'T00:00:00').toLocaleDateString()}</td>
            <td class="p-3">${r.alunos?.nome_completo || 'Removido'}</td>
            <td class="p-3">${r.turmas?.nome_turma || 'N/A'}</td>
            <td class="p-3 ${r.status === 'falta' ? 'text-red-600' : 'text-green-600'} font-bold">${r.status}</td>
            <td class="p-3 text-xs">${r.justificativa || ''}</td>
            <td class="p-3">${r.usuarios?.nome || 'Sistema'}</td>
        </tr>`).join('');
    btnImp.classList.remove('hidden');
}
