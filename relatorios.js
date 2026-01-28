// ===============================================================
// relatorios.js - RELATÓRIOS E ASSIDUIDADE (VERSÃO COMPLETA)
// ===============================================================

async function renderRelatoriosPanel() {
    const turmaFilter = document.getElementById('relatorio-turma-select');
    const alunoFilter = document.getElementById('relatorio-aluno-select');
    const profFilter = document.getElementById('relatorio-professor-select');
    turmaFilter.innerHTML = '<option value="">Todas</option>';
    turmasCache.forEach(t => turmaFilter.innerHTML += `<option value="${t.id}">${t.nome_turma} (${t.ano_letivo})</option>`);
    alunoFilter.innerHTML = '<option value="">Todos</option>';
    alunosCache.forEach(a => alunoFilter.innerHTML += `<option value="${a.id}">${a.nome_completo}</option>`);
    profFilter.innerHTML = '<option value="">Todos</option>';
    usuariosCache.filter(u => u.papel === 'professor').forEach(u => profFilter.innerHTML += `<option value="${u.user_uid}">${u.nome}</option>`);
}

async function handleGerarRelatorio() {
    const relatorioTableBody = document.getElementById('relatorio-table-body');
    const imprimirRelatorioBtn = document.getElementById('imprimir-relatorio-btn');
    relatorioTableBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center">Gerando relatório...</td></tr>';
    imprimirRelatorioBtn.classList.add('hidden');
    
    let queryBuilder = db.from('presencas').select(`data, status, justificativa, alunos ( nome_completo ), turmas ( nome_turma ), usuarios ( nome )`).order('data', { ascending: false });
    
    const dataInicio = document.getElementById('relatorio-data-inicio').value;
    const dataFim = document.getElementById('relatorio-data-fim').value;
    const tId = document.getElementById('relatorio-turma-select').value;
    const aId = document.getElementById('relatorio-aluno-select').value;
    const pId = document.getElementById('relatorio-professor-select').value;
    const status = document.getElementById('relatorio-status-select').value;

    // APLICAÇÃO DA REGRA DE OURO DAS DATAS
    if (dataInicio && dataFim) {
        queryBuilder = queryBuilder.gte('data', dataInicio).lte('data', dataFim);
    } else if (dataInicio) {
        queryBuilder = queryBuilder.eq('data', dataInicio);
    }

    if (tId) queryBuilder = queryBuilder.eq('turma_id', tId);
    if (aId) queryBuilder = queryBuilder.eq('aluno_id', aId);
    if (pId) queryBuilder = queryBuilder.eq('registrado_por_uid', pId);
    if (status) queryBuilder = queryBuilder.eq('status', status);

    const { data, error } = await safeQuery(queryBuilder);
    if (error || !data || data.length === 0) {
        relatorioTableBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center">Nenhum registro encontrado.</td></tr>';
        return;
    }
    relatorioTableBody.innerHTML = data.map(r => `
        <tr class="border-b">
            <td class="p-3">${new Date(r.data + 'T00:00:00').toLocaleDateString()}</td>
            <td class="p-3">${r.alunos ? r.alunos.nome_completo : 'Removido'}</td>
            <td class="p-3">${r.turmas ? r.turmas.nome_turma : 'N/A'}</td>
            <td class="p-3"><span class="font-semibold ${r.status === 'falta' ? 'text-red-600' : 'text-green-600'}">${r.status}</span></td>
            <td class="p-3 text-xs">${r.justificativa || ''}</td>
            <td class="p-3">${r.usuarios ? r.usuarios.nome : 'Sistema'}</td>
        </tr>`).join('');
    imprimirRelatorioBtn.classList.remove('hidden');
}

function handleImprimirRelatorio(type) { window.print(); }

function openAssiduidadeModal() {
    const modal = document.getElementById('assiduidade-modal');
    const anoSelAluno = document.getElementById('assiduidade-aluno-ano');
    const anoSelTurma = document.getElementById('assiduidade-turma-ano');
    const anoSelProf = document.getElementById('assiduidade-prof-ano'); 
    const profSel = document.getElementById('assiduidade-prof-professor');
    
    // Preenche todos os selects de anos letivos
    [anoSelAluno, anoSelTurma, anoSelProf].forEach(el => {
        if (el) {
            el.innerHTML = '<option value="">Todos os Anos</option>';
            anosLetivosCache.forEach(ano => el.innerHTML += `<option value="${ano}">${ano}</option>`);
        }
    });

    // Alimenta o seletor de professores no modal de assiduidade
    profSel.innerHTML = '<option value="">Todos os Professores</option>';
    usuariosCache.filter(u => u.papel === 'professor').forEach(p => {
        profSel.innerHTML += `<option value="${p.user_uid}">${p.nome}</option>`;
    });

    // Seleciona o ano atual por padrão
    const currentYear = new Date().getFullYear();
    if (anosLetivosCache.includes(currentYear)) {
        if (anoSelAluno) anoSelAluno.value = currentYear;
        if (anoSelTurma) anoSelTurma.value = currentYear;
        if (anoSelProf) anoSelProf.value = currentYear;
        
        // Dispara o evento para atualizar cascatas
        if (anoSelAluno) anoSelAluno.dispatchEvent(new Event('change', { bubbles: true }));
        if (anoSelTurma) anoSelTurma.dispatchEvent(new Event('change', { bubbles: true }));
        if (anoSelProf) anoSelProf.dispatchEvent(new Event('change', { bubbles: true }));
    }

    modal.classList.remove('hidden');
}

async function generateAssiduidadeReport() {
    const newWindow = window.open('', '_blank');
    newWindow.document.write(`<html><head><title>Relatório de Assiduidade</title><script src="https://cdn.tailwindcss.com"><\/script><script src="https://cdn.jsdelivr.net/npm/chart.js"><\/script><style>body { font-family: 'Inter', sans-serif; } .print-header { display: none; } @media print { .no-print { display: none !important; } .printable-area { position: absolute; left: 0; top: 0; width: 100%; } body * { visibility: hidden; } .printable-area, .printable-area * { visibility: visible; } .print-header { display: flex !important; justify-content: space-between; align-items: center; padding-bottom: 1rem; margin-bottom: 1.5rem; border-bottom: 2px solid #e5e7eb; } }</style></head><body class="bg-gray-100 p-8"><div class="printable-area"><div id="report-content" class="text-center"><div class="loader mx-auto" style="width: 48px; height: 48px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div><p class="mt-4 text-gray-600">Gerando relatório com gráficos...</p></div></div><style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style></body></html>`);
    
    try {
        const activeTab = document.querySelector('#assiduidade-tabs a[aria-current="page"]').dataset.target;
        let query = db.from('presencas').select('status, justificativa, data, alunos!inner(nome_completo), turmas!inner(nome_turma, ano_letivo)');
        let reportTitle = '';
        let stats = { presentes: 0, faltasJ: 0, faltasI: 0 };

        if (activeTab === 'assiduidade-alunos') {
            reportTitle = "Assiduidade de Alunos";
            const ano = document.getElementById('assiduidade-aluno-ano').value;
            const alunoId = document.getElementById('assiduidade-aluno-aluno').value;
            const ini = document.getElementById('assiduidade-aluno-data-inicio').value;
            const fim = document.getElementById('assiduidade-aluno-data-fim').value;
            if (ano) query = query.eq('turmas.ano_letivo', ano);
            if (alunoId) query = query.eq('aluno_id', alunoId);
            if (ini && fim) query = query.gte('data', ini).lte('data', fim);
            else if (ini) query = query.eq('data', ini);
        } else if (activeTab === 'assiduidade-turmas') {
            reportTitle = "Assiduidade por Turma";
            const ano = document.getElementById('assiduidade-turma-ano').value;
            const turmaId = document.getElementById('assiduidade-turma-turma').value;
            const ini = document.getElementById('assiduidade-turma-data-inicio').value;
            const fim = document.getElementById('assiduidade-turma-data-fim').value;
            if (ano) query = query.eq('turmas.ano_letivo', ano);
            if (turmaId) query = query.eq('turma_id', turmaId);
            if (ini && fim) query = query.gte('data', ini).lte('data', fim);
            else if (ini) query = query.eq('data', ini);
        }
        else if (activeTab === 'assiduidade-professores') {
            reportTitle = "Assiduidade de Professores (Lançamentos)";
            const profId = document.getElementById('assiduidade-prof-professor').value;
            const dataIni = document.getElementById('assiduidade-prof-data-inicio').value;
            const dataFim = document.getElementById('assiduidade-prof-data-fim').value;
            
            const { data: profData, error: profError } = await db.rpc('get_professor_assiduidade', {
                data_inicio: dataIni || '2000-01-01',
                data_fim: dataFim || '2099-12-31',
                professor_uid_selecionado: profId || null
            });
            if (profError) throw profError;
            
            const lancados = profData.filter(d => d.status === 'Lançado').length;
            const pendentes = profData.length - lancados;
            
            const html = `
                <div class="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md text-left">
                    <div class="print-header"><h2>${reportTitle}</h2></div>
                    <div class="flex justify-between items-center mb-6 no-print"><h1 class="text-2xl font-bold">${reportTitle}</h1><button onclick="window.print()" class="bg-blue-600 text-white px-4 py-2 rounded">Imprimir</button></div>
                    <div class="grid grid-cols-2 gap-8 mb-8"><div class="h-64"><canvas id="assiduidadeChart"></canvas></div><div class="flex flex-col justify-center">
                        <p class="text-lg">Total de Dias: <strong>${profData.length}</strong></p>
                        <p class="text-lg text-green-600">Lançados: <strong>${lancados}</strong></p>
                        <p class="text-lg text-red-600">Pendentes: <strong>${pendentes}</strong></p>
                    </div></div>
                </div>`;
            newWindow.document.getElementById('report-content').innerHTML = html;
            const script = newWindow.document.createElement('script');
            script.textContent = `new Chart(document.getElementById('assiduidadeChart'), { type: 'pie', data: { labels: ['Lançado', 'Pendente'], datasets: [{ data: [${lancados}, ${pendentes}], backgroundColor: ['#10B981', '#EF4444'] }] }, options: { responsive: true, maintainAspectRatio: false } });`;
            newWindow.document.body.appendChild(script);
            return;
        }

        const { data, error } = await safeQuery(query);
        if (error) throw error;

        data.forEach(r => {
            if (r.status === 'presente') stats.presentes++;
            else if (r.justificativa === 'Falta justificada') stats.faltasJ++;
            else stats.faltasI++;
        });

        const reportHTML = `
            <div class="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md text-left">
                <div class="print-header"><h2>${reportTitle}</h2></div>
                <div class="flex justify-between items-center mb-6 no-print"><h1 class="text-2xl font-bold">${reportTitle}</h1><button onclick="window.print()" class="bg-blue-600 text-white px-4 py-2 rounded">Imprimir</button></div>
                <div class="grid grid-cols-2 gap-8"><div class="h-64"><canvas id="assiduidadeChart"></canvas></div><div class="flex flex-col justify-center">
                    <p class="text-lg">Presenças: <strong class="text-green-600">${stats.presentes}</strong></p>
                    <p class="text-lg">Faltas Just.: <strong class="text-yellow-600">${stats.faltasJ}</strong></p>
                    <p class="text-lg">Faltas Injust.: <strong class="text-red-600">${stats.faltasI}</strong></p>
                </div></div>
            </div>`;
        
        newWindow.document.getElementById('report-content').innerHTML = reportHTML;
        const chartScript = newWindow.document.createElement('script');
        chartScript.textContent = `new Chart(document.getElementById('assiduidadeChart'), { type: 'pie', data: { labels: ['Presenças', 'Faltas Just.', 'Faltas Injust.'], datasets: [{ data: [${stats.presentes}, ${stats.faltasJ}, ${stats.faltasI}], backgroundColor: ['#10B981', '#F59E0B', '#EF4444'] }] }, options: { responsive: true, maintainAspectRatio: false } });`;
        newWindow.document.body.appendChild(chartScript);

    } catch (e) {
        newWindow.document.getElementById('report-content').innerHTML = `<p class="text-red-500">Erro: ${e.message}</p>`;
    }
}
