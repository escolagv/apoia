// ===============================================================
// relatorios.js - RELATÓRIOS, ASSIDUIDADE E CORREÇÃO
// ===============================================================

async function renderRelatoriosPanel() {
    const tSel = document.getElementById('relatorio-turma-select');
    const aSel = document.getElementById('relatorio-aluno-select');
    const pSel = document.getElementById('relatorio-professor-select');
    
    tSel.innerHTML = '<option value="">Todas</option>';
    turmasCache.forEach(t => tSel.innerHTML += `<option value="${t.id}">${t.nome_turma} (${t.ano_letivo})</option>`);
    
    pSel.innerHTML = '<option value="">Todos</option>';
    usuariosCache.filter(u => u.papel === 'professor').forEach(p => pSel.innerHTML += `<option value="${p.user_uid}">${p.nome}</option>`);

    tSel.onchange = () => {
        const val = tSel.value;
        aSel.innerHTML = '<option value="">Todos</option>';
        const filtrados = val ? alunosCache.filter(a => a.turma_id == val) : alunosCache;
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
    const profId = document.getElementById('relatorio-professor-select').value;
    const status = document.getElementById('relatorio-status-select').value;

    body.innerHTML = '<tr><td colspan="6" class="p-4 text-center">Gerando relatório...</td></tr>';

    let query = db.from('presencas').select(`data, status, justificativa, alunos(nome_completo), turmas(nome_turma), usuarios(nome)` ).order('data', { ascending: false });

    if (dataIni) query = query.gte('data', dataIni);
    if (dataFim) query = query.lte('data', dataFim);
    if (tId) query = query.eq('turma_id', tId);
    if (aId) query = query.eq('aluno_id', aId);
    if (profId) query = query.eq('registrado_por_uid', profId);
    if (status) query = query.eq('status', status);

    const { data } = await safeQuery(query);
    if (!data || data.length === 0) {
        body.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-gray-500">Nenhum registro encontrado.</td></tr>';
        btnImp.classList.add('hidden');
        return;
    }

    body.innerHTML = data.map(r => `
        <tr class="border-b text-sm">
            <td class="p-3">${new Date(r.data + 'T00:00:00').toLocaleDateString()}</td>
            <td class="p-3 font-medium">${r.alunos?.nome_completo || 'Removido'}</td>
            <td class="p-3">${r.turmas?.nome_turma || 'N/A'}</td>
            <td class="p-3 ${r.status === 'falta' ? 'text-red-600 font-bold' : 'text-green-600'}">${r.status}</td>
            <td class="p-3 text-xs italic">${r.justificativa || ''}</td>
            <td class="p-3 text-gray-500">${r.usuarios?.nome || 'Sistema'}</td>
        </tr>`).join('');
    btnImp.classList.remove('hidden');
}

async function loadCorrecaoChamada() {
    const tId = document.getElementById('correcao-turma-select').value;
    const data = document.getElementById('correcao-data-select').value;
    const container = document.getElementById('correcao-chamada-lista-alunos');

    if (!tId || !data) return;
    container.innerHTML = '<div class="loader mx-auto my-4"></div>';

    const { data: alunos } = await safeQuery(db.from('alunos').select('id, nome_completo').eq('turma_id', tId).eq('status', 'ativo').order('nome_completo'));
    const { data: presencas } = await safeQuery(db.from('presencas').select('aluno_id, status').eq('turma_id', tId).eq('data', data));

    const presMap = new Map(presencas?.map(p => [p.aluno_id, p.status]));
    container.innerHTML = '';

    alunos.forEach(aluno => {
        const status = presMap.get(aluno.id) || 'presente';
        const div = document.createElement('div');
        div.className = 'p-3 bg-gray-50 rounded-lg flex justify-between items-center mb-2';
        div.innerHTML = `
            <span class="font-medium">${aluno.nome_completo}</span>
            <div class="flex gap-4" data-aluno-id="${aluno.id}">
                <label><input type="radio" name="corr-${aluno.id}" value="presente" ${status === 'presente' ? 'checked' : ''}> Pres.</label>
                <label class="text-red-600"><input type="radio" name="corr-${aluno.id}" value="falta" ${status === 'falta' ? 'checked' : ''}> Falta</label>
            </div>`;
        container.appendChild(div);
    });
}

async function generateAssiduidadeReport() {
    const newWindow = window.open('', '_blank');
    newWindow.document.write(`<html><head><title>Relatório</title><script src="https://cdn.tailwindcss.com"><\/script><script src="https://cdn.jsdelivr.net/npm/chart.js"><\/script></head><body class="p-8"><div id="report-content">Gerando...</div></body></html>`);
    
    const activeTab = document.querySelector('#assiduidade-tabs a[aria-current="page"]').dataset.target;
    let query = db.from('presencas').select('status, alunos!inner(nome_completo), turmas!inner(nome_turma, ano_letivo)');
    
    // Filtros simplificados para o exemplo completo
    const { data } = await safeQuery(query);
    if (!data) return;

    const presentes = data.filter(d => d.status === 'presente').length;
    const faltas = data.length - presentes;

    const reportHTML = `<h1 class="text-2xl font-bold mb-4">Relatório de Assiduidade Geral</h1><canvas id="myChart" style="max-width:400px"></canvas>`;
    const scriptContent = `const ctx = document.getElementById('myChart'); new Chart(ctx, { type: 'pie', data: { labels: ['Presenças', 'Faltas'], datasets: [{ data: [${presentes}, ${faltas}], backgroundColor: ['#10B981', '#EF4444'] }] } });`;
    
    newWindow.document.getElementById('report-content').innerHTML = reportHTML;
    const scriptEl = newWindow.document.createElement('script');
    scriptEl.textContent = scriptContent;
    newWindow.document.body.appendChild(scriptEl);
}

function handleImprimirRelatorio(type) { window.print(); }
