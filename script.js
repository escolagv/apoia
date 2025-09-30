// INÍCIO - PARTE 4 de 4 (Cole após a Parte 3)

// ===============================================================
// SEÇÃO 4.1: LÓGICA DO PAINEL DE ADMINISTRADOR - RELATÓRIOS E ASSIDUIDADE
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
    usuariosCache.forEach(u => profFilter.innerHTML += `<option value="${u.user_uid}">${u.nome} (${u.papel})</option>`);
}

async function handleGerarRelatorio() {
    relatorioTableBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center">Gerando relatório...</td></tr>';
    imprimirRelatorioBtn.classList.add('hidden');
    let queryBuilder = db.from('presencas').select(`data, status, justificativa, alunos ( nome_completo ), turmas ( nome_turma ), usuarios ( nome )`).order('data', { ascending: false });
    let dataInicio = document.getElementById('relatorio-data-inicio').value;
    let dataFim = document.getElementById('relatorio-data-fim').value;
    const turmaId = document.getElementById('relatorio-turma-select').value;
    const alunoId = document.getElementById('relatorio-aluno-select').value;
    const profId = document.getElementById('relatorio-professor-select').value;
    const statusFiltro = document.getElementById('relatorio-status-select').value;
    if (dataInicio && !dataFim) dataFim = dataInicio;
    if (dataInicio) queryBuilder = queryBuilder.gte('data', dataInicio);
    if (dataFim) queryBuilder = queryBuilder.lte('data', dataFim);
    if (turmaId) queryBuilder = queryBuilder.eq('turma_id', turmaId);
    if (alunoId) queryBuilder = queryBuilder.eq('aluno_id', alunoId);
    if (profId) queryBuilder = queryBuilder.eq('registrado_por_uid', profId);
    if (statusFiltro) queryBuilder = queryBuilder.eq('status', statusFiltro);
    const { data, error } = await safeQuery(queryBuilder);
    if (error) {
        relatorioTableBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-red-500">Erro ao gerar relatório.</td></tr>';
        return;
    }
    if (data.length === 0) {
        relatorioTableBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center">Nenhum registro encontrado.</td></tr>';
        return;
    }
    relatorioTableBody.innerHTML = data.map(r => `
        <tr class="border-b">
            <td class="p-3">${new Date(r.data + 'T00:00:00').toLocaleDateString()}</td>
            <td class="p-3">${r.alunos ? r.alunos.nome_completo : 'Aluno Removido'}</td>
            <td class="p-3">${r.turmas ? r.turmas.nome_turma : 'Turma Removida'}</td>
            <td class="p-3"><span class="font-semibold ${r.status === 'falta' ? 'text-red-600' : 'text-green-600'}">${r.status.charAt(0).toUpperCase() + r.status.slice(1)}</span></td>
            <td class="p-3 text-xs">${r.justificativa || ''}</td>
            <td class="p-3">${r.usuarios ? r.usuarios.nome : 'Usuário Removido'}</td>
        </tr>
    `).join('');
    imprimirRelatorioBtn.classList.remove('hidden');
}

function openAssiduidadeModal() {
    // Popula filtros de Alunos
    const anoSelAluno = document.getElementById('assiduidade-aluno-ano');
    const alunoSel = document.getElementById('assiduidade-aluno-aluno');
    anoSelAluno.innerHTML = '<option value="">Todos os Anos</option>';
    anosLetivosCache.forEach(ano => anoSelAluno.innerHTML += `<option value="${ano}">${ano}</option>`);
    alunoSel.innerHTML = '<option value="">Todos os Alunos</option>';

    // Popula filtros de Turmas
    const anoSelTurma = document.getElementById('assiduidade-turma-ano');
    const turmaSelTurma = document.getElementById('assiduidade-turma-turma');
    anoSelTurma.innerHTML = '<option value="">Todos os Anos</option>';
    anosLetivosCache.forEach(ano => anoSelTurma.innerHTML += `<option value="${ano}">${ano}</option>`);
    turmaSelTurma.innerHTML = '<option value="">Todas as Turmas</option>';

    // Popula filtros de Professores
    const profSel = document.getElementById('assiduidade-prof-professor');
    profSel.innerHTML = '<option value="">Todos os Professores</option>';
    usuariosCache.filter(u => u.papel === 'professor').forEach(p => profSel.innerHTML += `<option value="${p.user_uid}">${p.nome}</option>`);

    const currentYear = new Date().getFullYear();
    if (anosLetivosCache.some(y => y == currentYear)) {
        anoSelAluno.value = currentYear;
        anoSelTurma.value = currentYear;
        anoSelAluno.dispatchEvent(new Event('change'));
        anoSelTurma.dispatchEvent(new Event('change'));
    }

    document.getElementById('assiduidade-aluno-data-inicio').value = '';
    document.getElementById('assiduidade-aluno-data-fim').value = '';
    document.getElementById('assiduidade-turma-data-inicio').value = '';
    document.getElementById('assiduidade-turma-data-fim').value = '';
    document.getElementById('assiduidade-prof-data-inicio').value = '';
    document.getElementById('assiduidade-prof-data-fim').value = '';

    assiduidadeModal.classList.remove('hidden');
}

async function generateAssiduidadeReport() {
    const newWindow = window.open('', '_blank');

    newWindow.document.write(`
        <html>
            <head>
                <title>Relatório de Assiduidade</title>
                <script src="https://cdn.tailwindcss.com"><\/script>
                <style>
                    body { font-family: 'Inter', sans-serif; } 
                    .print-header { display: none; } 
                    @media print { 
                        .no-print { display: none !important; } 
                        .printable-area { position: absolute; left: 0; top: 0; width: 100%; } 
                        body * { visibility: hidden; } 
                        .printable-area, .printable-area * { visibility: visible; } 
                        .print-header { display: flex !important; justify-content: space-between; align-items: center; padding-bottom: 1rem; margin-bottom: 1.5rem; border-bottom: 2px solid #e5e7eb; } 
                        .print-header img { max-height: 60px; width: auto; } 
                        .print-header-info h2 { font-size: 1.25rem; font-weight: bold; margin: 0; } 
                        .print-header-info p { font-size: 0.875rem; margin: 0; } 
                    }
                    .loader { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; }
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                </style>
            </head>
            <body class="bg-gray-100 p-8">
                <div class="printable-area">
                    <div id="report-content">
                        <div class="text-center">
                            <div class="loader" style="width: 48px; height: 48px; margin: auto;"></div>
                            <p class="mt-4 text-gray-600">Gerando relatório, por favor aguarde...</p>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    `);
    newWindow.document.close();

    const chartJsScript = newWindow.document.createElement('script');

    chartJsScript.onload = async () => {
        closeModal(assiduidadeModal);

        const renderReport = (reportHTML, chartScriptContent) => {
            newWindow.document.getElementById('report-content').innerHTML = reportHTML;
            const scriptEl = newWindow.document.createElement('script');
            scriptEl.textContent = chartScriptContent;
            newWindow.document.body.appendChild(scriptEl);
        };

        try {
            const activeTab = document.querySelector('#assiduidade-tabs a[aria-current="page"]').dataset.target;

            if (activeTab === 'assiduidade-alunos') {
                let dataInicio = document.getElementById('assiduidade-aluno-data-inicio').value;
                let dataFim = document.getElementById('assiduidade-aluno-data-fim').value;
                if (dataInicio && !dataFim) dataFim = dataInicio;
                const alunoId = document.getElementById('assiduidade-aluno-aluno').value;

                let query = db.from('presencas').select('status, justificativa, alunos!inner(nome_completo), turmas!inner(nome_turma)');
                if (dataInicio) query = query.gte('data', dataInicio);
                if (dataFim) query = query.lte('data', dataFim);
                if (alunoId) query = query.eq('aluno_id', alunoId);

                const { data, error } = await safeQuery(query);
                if (error) throw error;
                if (data.length === 0) {
                    newWindow.document.getElementById('report-content').innerHTML = '<p class="text-center font-bold">Nenhum dado encontrado para os filtros selecionados.</p>';
                    return;
                }

                const stats = data.reduce((acc, record) => {
                    if (!record.alunos) return acc;
                    const nome = record.alunos.nome_completo;
                    if (!acc[nome]) {
                        acc[nome] = { presencas: 0, faltas_j: 0, faltas_i: 0, turma: record.turmas.nome_turma };
                    }
                    if (record.status === 'presente') acc[nome].presencas++;
                    else {
                        if (record.justificativa === 'Falta justificada') acc[nome].faltas_j++;
                        else acc[nome].faltas_i++;
                    }
                    return acc;
                }, {});

                const tableRows = Object.entries(stats).sort((a, b) => a[0].localeCompare(b[0])).map(([nome, { presencas, faltas_j, faltas_i, turma }]) => {
                    const total = presencas + faltas_j + faltas_i;
                    const percentual = total > 0 ? ((presencas / total) * 100).toFixed(1) + '%' : 'N/A';
                    return `<tr class="border-b"><td class="p-3">${nome}</td><td class="p-3">${turma}</td><td class="p-3 text-center text-green-600 font-semibold">${presencas}</td><td class="p-3 text-center text-yellow-600 font-semibold">${faltas_j}</td><td class="p-3 text-center text-red-600 font-semibold">${faltas_i}</td><td class="p-3 text-center font-bold">${percentual}</td></tr>`;
                }).join('');

                const totalPresencas = Object.values(stats).reduce((sum, s) => sum + s.presencas, 0);
                const totalFaltasJ = Object.values(stats).reduce((sum, s) => sum + s.faltas_j, 0);
                const totalFaltasI = Object.values(stats).reduce((sum, s) => sum + s.faltas_i, 0);
                const periodoTexto = (dataInicio && dataFim) ? `Período: ${new Date(dataInicio + 'T00:00:00').toLocaleDateString('pt-BR')} a ${new Date(dataFim + 'T00:00:00').toLocaleDateString('pt-BR')}` : 'Período: Geral';

                const reportHTML = `<div class="print-header hidden"><img src="./logo.png"><div class="print-header-info"><h2>Relatório de Assiduidade de Alunos</h2><p>${periodoTexto}</p></div></div><div class="flex justify-between items-center mb-6 no-print"><h1 class="text-2xl font-bold">Relatório de Assiduidade de Alunos</h1><button onclick="window.print()" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Imprimir</button></div><div class="grid grid-cols-1 lg:grid-cols-3 gap-6"><div class="lg:col-span-1 bg-white p-4 rounded-lg shadow-md"><div style="height: 320px; position: relative;"><canvas id="assiduidadeChart"></canvas></div></div><div class="lg:col-span-2 bg-white p-6 rounded-lg shadow-md"><h3 class="font-bold mb-4">Detalhes da Frequência</h3><div class="max-h-96 overflow-y-auto"><table class="w-full text-sm"><thead class="bg-gray-50 sticky top-0"><tr><th class="p-3 text-left">Aluno</th><th class="p-3 text-left">Turma</th><th class="p-3 text-center">Presenças</th><th class="p-3 text-center">Faltas Just.</th><th class="p-3 text-center">Faltas Injust.</th><th class="p-3 text-center">Assiduidade</th></tr></thead><tbody>${tableRows}</tbody></table></div></div></div>`;
                const chartScriptContent = `setTimeout(() => { const ctx = document.getElementById('assiduidadeChart'); if (ctx) { new Chart(ctx, { type: 'pie', data: { labels: ['Presenças', 'Faltas Justificadas', 'Faltas Injustificadas'], datasets: [{ data: [${totalPresencas}, ${totalFaltasJ}, ${totalFaltasI}], backgroundColor: ['#10B981', '#F59E0B', '#EF4444'] }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Visão Geral da Frequência' } } } }); } }, 100);`;
                renderReport(reportHTML, chartScriptContent);

            } else if (activeTab === 'assiduidade-turmas') {
                let dataInicio = document.getElementById('assiduidade-turma-data-inicio').value;
                let dataFim = document.getElementById('assiduidade-turma-data-fim').value;
                if (dataInicio && !dataFim) dataFim = dataInicio;
                const anoLetivo = document.getElementById('assiduidade-turma-ano').value;
                const turmaId = document.getElementById('assiduidade-turma-turma').value;

                let query = db.from('presencas').select('status, justificativa, turmas!inner(id, nome_turma, ano_letivo)');
                if (dataInicio) query = query.gte('data', dataInicio);
                if (dataFim) query = query.lte('data', dataFim);
                if (anoLetivo) query = query.eq('turmas.ano_letivo', anoLetivo);
                if (turmaId) query = query.eq('turma_id', turmaId);

                const { data, error } = await safeQuery(query);
                if (error) throw error;
                if (data.length === 0) {
                    newWindow.document.getElementById('report-content').innerHTML = '<p class="text-center font-bold">Nenhum dado encontrado para os filtros selecionados.</p>';
                    return;
                }

                const stats = data.reduce((acc, record) => {
                    const turma = record.turmas;
                    if (!turma) return acc;
                    if (!acc[turma.id]) {
                        acc[turma.id] = { nome: turma.nome_turma, presencas: 0, faltas: 0 };
                    }
                    if (record.status === 'presente') acc[turma.id].presencas++;
                    else acc[turma.id].faltas++;
                    return acc;
                }, {});

                const sortedStats = Object.values(stats).sort((a, b) => a.nome.localeCompare(b.nome));
                const tableRows = sortedStats.map(turma => {
                    const total = turma.presencas + turma.faltas;
                    const percentual = total > 0 ? ((turma.presencas / total) * 100).toFixed(1) + '%' : 'N/A';
                    return `<tr class="border-b"><td class="p-3">${turma.nome}</td><td class="p-3 text-center text-green-600 font-semibold">${turma.presencas}</td><td class="p-3 text-center text-red-600 font-semibold">${turma.faltas}</td><td class="p-3 text-center font-bold">${percentual}</td></tr>`;
                }).join('');

                const totalPresencas = sortedStats.reduce((sum, t) => sum + t.presencas, 0);
                const totalFaltas = sortedStats.reduce((sum, t) => sum + t.faltas, 0);
                const periodoTexto = (dataInicio && dataFim) ? `Período: ${new Date(dataInicio + 'T00:00:00').toLocaleDateString('pt-BR')} a ${new Date(dataFim + 'T00:00:00').toLocaleDateString('pt-BR')}` : 'Período: Geral';

                const reportHTML = `<div class="print-header hidden"><img src="./logo.png"><div class="print-header-info"><h2>Relatório de Assiduidade por Turma</h2><p>${periodoTexto}</p></div></div><div class="flex justify-between items-center mb-6 no-print"><h1 class="text-2xl font-bold">Relatório de Assiduidade por Turma</h1><button onclick="window.print()" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Imprimir</button></div><div class="grid grid-cols-1 lg:grid-cols-3 gap-6"><div class="lg:col-span-1 bg-white p-4 rounded-lg shadow-md"><div style="height: 320px; position: relative;"><canvas id="assiduidadeTurmaChart"></canvas></div></div><div class="lg:col-span-2 bg-white p-6 rounded-lg shadow-md"><h3 class="font-bold mb-4">Dados Consolidados</h3><div class="max-h-96 overflow-y-auto"><table class="w-full text-sm"><thead class="bg-gray-50 sticky top-0"><tr><th class="p-3 text-left">Turma</th><th class="p-3 text-center">Presenças</th><th class="p-3 text-center">Faltas</th><th class="p-3 text-center">Assiduidade</th></tr></thead><tbody>${tableRows}</tbody></table></div></div></div>`;
                const chartScriptContent = `setTimeout(() => { const ctx = document.getElementById('assiduidadeTurmaChart'); if(ctx) { new Chart(ctx, { type: 'pie', data: { labels: ['Total de Presenças', 'Total de Faltas'], datasets: [{ label: 'Frequência Geral', data: [${totalPresencas}, ${totalFaltas}], backgroundColor: ['#10B981', '#EF4444'] }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Frequência Geral das Turmas' } } } }); } }, 100);`;
                renderReport(reportHTML, chartScriptContent);

            } else if (activeTab === 'assiduidade-professores') {
                let dataInicio = document.getElementById('assiduidade-prof-data-inicio').value;
                let dataFim = document.getElementById('assiduidade-prof-data-fim').value;
                const professorId = document.getElementById('assiduidade-prof-professor').value;

                if (!dataInicio || !dataFim) {
                    const { data: range, error } = await db.rpc('get_min_max_presenca_data');
                    if (error || !range || range.length === 0 || !range[0].min_data) {
                        newWindow.document.getElementById('report-content').innerHTML = '<p class="text-center font-bold">Não foi possível determinar o período de datas. Não há registros de chamada no sistema.</p>';
                        return;
                    }
                    dataInicio = range[0].min_data;
                    dataFim = range[0].max_data;
                }

                const { data, error } = await db.rpc('get_professor_assiduidade', {
                    data_inicio: dataInicio,
                    data_fim: dataFim,
                    professor_uid_selecionado: professorId || null
                });

                if (error) throw error;
                if (data.length === 0) {
                    newWindow.document.getElementById('report-content').innerHTML = '<p class="text-center font-bold">Nenhum dia letivo encontrado para o período e filtros selecionados.</p>';
                    return;
                }

                const diasLancados = data.filter(d => d.status === 'Lançado');
                const diasNaoLancados = data.filter(d => d.status !== 'Lançado');
                const lancadosHtml = diasLancados.length > 0 ? diasLancados.map(d => `<span class="bg-green-100 text-green-800 text-xs font-medium mr-2 mb-2 px-2.5 py-0.5 rounded-full inline-block">${new Date(d.dia + 'T00:00:00').toLocaleDateString('pt-BR')}</span>`).join('') : '<p class="text-sm text-gray-500">Nenhum.</p>';
                const naoLancadosHtml = diasNaoLancados.length > 0 ? diasNaoLancados.map(d => `<div class="flex flex-col text-center bg-red-100 text-red-800 text-xs font-medium p-2 rounded-lg"><strong class="text-sm">${new Date(d.dia + 'T00:00:00').toLocaleDateString('pt-BR')}</strong><span class="mt-1">${d.nome_professor || 'Professor não identificado'} (${d.nome_turma || 'Turma?'})</span></div>`).join('') : '<p class="text-sm text-gray-500">Nenhum.</p>';
                const totalDiasLetivos = data.length;
                const totalLancados = diasLancados.length;
                const taxa = totalDiasLetivos > 0 ? ((totalLancados / totalDiasLetivos) * 100).toFixed(1) + '%' : 'N/A';
                const nomeProfessor = professorId ? usuariosCache.find(u => u.user_uid === professorId)?.nome : 'Todos os Professores';
                const periodoTexto = `Período: ${new Date(dataInicio + 'T00:00:00').toLocaleDateString('pt-BR')} a ${new Date(dataFim + 'T00:00:00').toLocaleDateString('pt-BR')}`;

                const reportHTML = `<div class="printable-area"><div class="print-header hidden"><img src="./logo.png"><div class="print-header-info"><h2>Relatório de Lançamento de Professores</h2><p>Professor: ${nomeProfessor}</p><p>${periodoTexto}</p></div></div><div class="flex justify-between items-center mb-6 no-print"><h1 class="text-2xl font-bold">Relatório de Lançamento de Professores</h1><button onclick="window.print()" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Imprimir</button></div><div class="grid grid-cols-1 lg:grid-cols-3 gap-6"><div class="lg:col-span-1 bg-white p-4 rounded-lg shadow-md"><div style="height: 320px; position: relative;"><canvas id="lancamentoChart"></canvas></div></div><div class="lg:col-span-2 bg-white p-6 rounded-lg shadow-md"><h3 class="text-lg font-bold mb-4">Resumo do Período para: <span class="text-indigo-600">${nomeProfessor}</span></h3><div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center"><div><p class="text-sm text-gray-500">Total de Dias Letivos</p><p class="text-2xl font-bold">${totalDiasLetivos}</p></div><div><p class="text-sm text-gray-500">Dias com Chamada Lançada</p><p class="text-2xl font-bold text-green-600">${totalLancados}</p></div><div><p class="text-sm text-gray-500">Taxa de Lançamento</p><p class="text-2xl font-bold text-blue-600">${taxa}</p></div></div></div></div><div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6"><div class="bg-white p-6 rounded-lg shadow-md"><h3 class="font-bold mb-4">Dias com Chamada Lançada (${totalLancados})</h3><div class="flex flex-wrap gap-2">${lancadosHtml}</div></div><div class="bg-white p-6 rounded-lg shadow-md"><h3 class="font-bold mb-4">Dias Letivos Sem Lançamento (${diasNaoLancados.length})</h3><div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">${naoLancadosHtml}</div></div></div></div>`;
                const chartScriptContent = `setTimeout(() => { const ctx = document.getElementById('lancamentoChart'); if (ctx) { new Chart(ctx, { type: 'pie', data: { labels: ['Dias com Chamada Lançada', 'Dias Sem Lançamento'], datasets: [{ data: [${totalLancados}, ${diasNaoLancados.length}], backgroundColor: ['#10B981', '#EF4444'] }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Visão Geral de Lançamentos' } } } }); } }, 100);`;
                renderReport(reportHTML, chartScriptContent);
            }
        } catch (e) {
            console.error("Erro ao gerar relatório:", e);
            newWindow.document.getElementById('report-content').innerHTML = `<div class="text-red-500 font-bold text-center">Ocorreu um erro ao gerar o relatório: ${e.message}</div>`;
        }
    };
    
    // CORREÇÃO FINAL: Define o 'onload' ANTES de definir o 'src' para garantir que o evento seja capturado.
    chartJsScript.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    newWindow.document.head.appendChild(chartJsScript);
}


// ===============================================================
// INICIALIZAÇÃO E EVENT LISTENERS GERAIS
// ===============================================================

document.addEventListener('DOMContentLoaded', () => {
    const setupSupportLinks = () => {
        const numero = "5548991004780";
        const mensagem = "Olá! Mensagem enviada do Sistema de chamadas da EEB Getúlio Vargas. Preciso de suporte.";
        const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
        const linkProf = document.getElementById('support-link-prof');
        const linkAdmin = document.getElementById('support-link-admin');
        if (linkProf) { linkProf.href = url; linkProf.target = "_blank"; }
        if (linkAdmin) { linkAdmin.href = url; linkAdmin.target = "_blank"; }
    };
    setupSupportLinks();

    togglePasswordBtn.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        eyeIcon.classList.toggle('hidden', isPassword);
        eyeOffIcon.classList.toggle('hidden', !isPassword);
    });

    setInterval(async () => { if (currentUser) { const { error } = await db.auth.refreshSession(); if (error) console.error(error); } }, 10 * 60 * 1000);
    document.addEventListener('visibilitychange', async () => { if (!document.hidden && currentUser) await db.auth.refreshSession(); });

    // Formulários
    document.body.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (e.target.id === 'login-form') {
            const loginButton = e.target.querySelector('button[type="submit"]');
            loginButton.disabled = true;
            loginButton.innerHTML = `<div class="loader mx-auto"></div>`;
            loginError.textContent = '';
            try {
                const { error } = await db.auth.signInWithPassword({ email: document.getElementById('email').value, password: document.getElementById('password').value });
                if (error) {
                    loginError.textContent = "Email ou senha inválidos.";
                    resetLoginFormState();
                }
            } catch (err) {
                loginError.textContent = "Ocorreu um erro de conexão.";
                resetLoginFormState();
            }
        }
        if (e.target.id === 'aluno-form') await handleAlunoFormSubmit(e);
        if (e.target.id === 'professor-form') await handleProfessorFormSubmit(e);
        if (e.target.id === 'turma-form') await handleTurmaFormSubmit(e);
        if (e.target.id === 'evento-form') await handleEventoFormSubmit(e);
        if (e.target.id === 'acompanhamento-form') await handleAcompanhamentoFormSubmit(e);
        if (e.target.id === 'config-form') await handleConfigFormSubmit(e);
        if (e.target.id === 'correcao-chamada-form') {
            const form = e.target;
            const turmaId = form.querySelector('#correcao-turma-select').value;
            const data = form.querySelector('#correcao-data-select').value;
            const alunoRows = form.querySelectorAll('[data-aluno-id]');
            const registros = Array.from(alunoRows).map(row => {
                const status = row.querySelector('.status-radio:checked').value;
                let justificativa = null;
                if (status === 'falta') {
                    const justRadio = row.querySelector(`input[name="corr-just-${row.dataset.alunoId}"]:checked`);
                    if (justRadio) {
                        if (justRadio.value === 'outros') {
                            justificativa = row.querySelector('.justificativa-outros-input').value.trim() || 'Outros';
                        } else {
                            justificativa = justRadio.value;
                        }
                    } else {
                        justificativa = 'Falta injustificada';
                    }
                }
                return {
                    aluno_id: parseInt(row.dataset.alunoId),
                    turma_id: parseInt(turmaId),
                    data: data,
                    status: status,
                    justificativa: justificativa,
                    registrado_por_uid: currentUser.id
                };
            });
            const { error } = await safeQuery(db.from('presencas').upsert(registros, { onConflict: 'aluno_id, data' }));
            if (error) showToast('Erro ao salvar correção: ' + error.message, true);
            else {
                showToast('Chamada corrigida com sucesso!');
                closeModal(correcaoChamadaModal);
            }
        }
        if (e.target.id === 'reset-password-form') {
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const errorEl = document.getElementById('reset-password-error');
            errorEl.textContent = '';
            if (newPassword.length < 6) { errorEl.textContent = 'A senha deve ter no mínimo 6 caracteres.'; return; }
            if (newPassword !== confirmPassword) { errorEl.textContent = 'As senhas não coincidem.'; return; }
            const { error } = await db.auth.updateUser({ password: newPassword });
            if (error) {
                errorEl.textContent = 'Erro ao atualizar a senha: ' + error.message;
            } else {
                showToast('Senha atualizada com sucesso! Por favor, faça o login com sua nova senha.');
                closeModal(resetPasswordModal);
                await signOutUser();
            }
        }
    });

    // Listeners de Click Diretos para Botões Principais
    document.getElementById('gerar-assiduidade-btn').addEventListener('click', generateAssiduidadeReport);
    document.getElementById('open-promover-turmas-modal-btn').addEventListener('click', openPromoverTurmasModal);
    document.getElementById('promover-turmas-btn').addEventListener('click', handlePromoverTurmas);
    document.getElementById('confirm-promocao-turmas-btn').addEventListener('click', handleConfirmPromocaoTurmas);

    // Listener de Click Genérico para elementos dinâmicos
    document.body.addEventListener('click', (e) => {
        const target = e.target;
        const closest = (selector) => target.closest(selector);
        
        const sidebarToggleBtn = closest('#sidebar-toggle-btn');
        const adminSidebar = document.getElementById('admin-sidebar');
        if (sidebarToggleBtn && adminSidebar) {
            adminSidebar.classList.toggle('-translate-x-full');
        }

        if (closest('.date-clear-btn')) {
            const targetId = closest('.date-clear-btn').dataset.target;
            document.getElementById(targetId).value = '';
        }

        const navLink = closest('.admin-nav-link');
        if (navLink) {
            e.preventDefault();
            document.querySelectorAll('.admin-nav-link').forEach(l => l.classList.remove('bg-gray-700'));
            navLink.classList.add('bg-gray-700');
            const targetPanelId = navLink.dataset.target;
            document.querySelectorAll('.admin-panel').forEach(p => p.classList.add('hidden'));
            const panel = document.getElementById(targetPanelId);
            if (panel) {
                panel.classList.remove('hidden');
                if (targetPanelId === 'admin-dashboard-panel') renderDashboardPanel();
                if (targetPanelId === 'admin-alunos-panel') renderAlunosPanel({ defaultToLatestYear: true });
                if (targetPanelId === 'admin-professores-panel') renderProfessoresPanel();
                if (targetPanelId === 'admin-turmas-panel') renderTurmasPanel();
                if (targetPanelId === 'admin-apoia-panel') renderApoiaPanel();
                if (targetPanelId === 'admin-calendario-panel') renderCalendarioPanel();
                if (targetPanelId === 'admin-ano-letivo-panel') renderAnoLetivoPanel();
                if (targetPanelId === 'admin-relatorios-panel') renderRelatoriosPanel();
                if (targetPanelId === 'admin-config-panel') renderConfigPanel();
            }
             if (window.innerWidth < 768 && adminSidebar) { // Fecha o sidebar no mobile ao clicar num link
                adminSidebar.classList.add('-translate-x-full');
            }
        }
        if (closest('#add-aluno-btn')) openAlunoModal();
        const editAlunoBtn = closest('.edit-aluno-btn');
        if (editAlunoBtn) openAlunoModal(editAlunoBtn.dataset.id);
        const historicoAlunoBtn = closest('.historico-aluno-btn');
        if (historicoAlunoBtn) openAlunoHistoricoModal(historicoAlunoBtn.dataset.id);
        if (closest('#add-professor-btn')) openProfessorModal();
        const editProfessorBtn = closest('.edit-professor-btn');
        if (editProfessorBtn) openProfessorModal(editProfessorBtn.dataset.id);
        if (closest('#add-turma-btn')) openTurmaModal();
        const editTurmaBtn = closest('.edit-turma-btn');
        if (editTurmaBtn) openTurmaModal(editTurmaBtn.dataset.id);
        const deleteTurmaBtn = closest('.delete-turma-btn');
        if (deleteTurmaBtn) openDeleteConfirmModal('turma', deleteTurmaBtn.dataset.id);
        if (closest('#add-evento-btn')) openEventoModal();
        const editEventoBtn = closest('.edit-evento-btn');
        if (editEventoBtn) openEventoModal(editEventoBtn.dataset.id);
        if (closest('.cancel-modal-btn')) closeAllModals();
        const deleteBtn = closest('.delete-btn');
        if (deleteBtn) {
            let id;
            if (deleteBtn.dataset.type === 'aluno') id = alunoModal.querySelector('#aluno-id').value;
            else if (deleteBtn.dataset.type === 'professor') id = professorModal.querySelector('#professor-id').value;
            else if (deleteBtn.dataset.type === 'turma') id = turmaModal.querySelector('#turma-id').value;
            else if (deleteBtn.dataset.type === 'evento') id = eventoModal.querySelector('#evento-id').value;
            else if (deleteBtn.dataset.type === 'acompanhamento') id = acompanhamentoModal.querySelector('#acompanhamento-id').value;
            if (id) openDeleteConfirmModal(deleteBtn.dataset.type, id);
        }
        const resetPassBtn = closest('.reset-password-btn');
        if (resetPassBtn) handleResetPassword(resetPassBtn.dataset.email);
        if (closest('#confirm-delete-btn')) handleConfirmDelete();
        if (closest('#admin-logout-btn') || closest('#professor-logout-btn')) signOutUser();
        if (closest('#gerar-relatorio-btn')) handleGerarRelatorio();
        if (closest('#imprimir-relatorio-btn')) handleImprimirRelatorio('faltas');
        if (closest('#gerar-apoia-relatorio-btn')) handleApoiaRelatorio();
        if (closest('#imprimir-apoia-relatorio-btn')) handleImprimirRelatorio('apoia');
        if (closest('#imprimir-historico-btn')) handleImprimirRelatorio('historico');
        if (closest('#correcao-chamada-btn')) {
            correcaoChamadaModal.classList.remove('hidden');
            correcaoTurmaSel.innerHTML = '<option value="">Selecione uma turma...</option>';
            turmasCache.forEach(t => correcaoTurmaSel.innerHTML += `<option value="${t.id}">${t.nome_turma}</option>`);
        }
        if (closest('#prev-month-btn')) { dashboardCalendar.month--; if (dashboardCalendar.month < 0) { dashboardCalendar.month = 11; dashboardCalendar.year--; } renderDashboardCalendar(); }
        if (closest('#next-month-btn')) { dashboardCalendar.month++; if (dashboardCalendar.month > 11) { dashboardCalendar.month = 0; dashboardCalendar.year++; } renderDashboardCalendar(); }
        const card = closest('.clickable-card');
        if (card) {
            const type = card.dataset.type;
            if (type === 'presencas' || type === 'faltas') {
                const date = dashboardSelectedDate;
                document.querySelector('.admin-nav-link[data-target="admin-relatorios-panel"]').click();
                setTimeout(() => {
                    document.getElementById('relatorio-data-inicio').value = date;
                    document.getElementById('relatorio-data-fim').value = date;
                    if (type === 'faltas') document.getElementById('relatorio-status-select').value = 'falta';
                    if (type === 'presencas') document.getElementById('relatorio-status-select').value = 'presente';
                    handleGerarRelatorio();
                }, 100);
            } else if (type === 'assiduidade') {
                openAssiduidadeModal();
            } else if (type === 'acompanhamento') {
                document.querySelector('.admin-nav-link[data-target="admin-apoia-panel"]').click();
            }
        }
        const alunoLink = closest('.dashboard-aluno-link');
        if (alunoLink) {
            e.preventDefault();
            openAlunoHistoricoModal(alunoLink.dataset.alunoId);
        }
        const calendarDayCell = closest('[data-date]');
        if (calendarDayCell) {
            const newDate = calendarDayCell.dataset.date;
            if (newDate) {
                dashboardSelectedDate = newDate;
                renderDashboardCalendar();
                loadDailySummary(dashboardSelectedDate);
            }
        }
    });

    notificationBell.addEventListener('click', (e) => {
        e.stopPropagation();
        notificationPanel.classList.toggle('hidden');
    });
    document.addEventListener('click', (e) => {
        const closest = (selector) => e.target.closest(selector);
        if (!notificationPanel.classList.contains('hidden') && !closest('#notification-panel') && !closest('#notification-bell')) {
            notificationPanel.classList.add('hidden');
        }
    });
    if (document.getElementById('clear-notifications-btn')) {
        document.getElementById('clear-notifications-btn').addEventListener('click', markAllNotificationsAsRead);
    }
    if (document.getElementById('notification-list')) {
        document.getElementById('notification-list').addEventListener('click', (e) => {
            const item = e.target.closest('.notification-item');
            if (item) {
                markNotificationAsRead(item.dataset.id);
            }
        });
    }

    ['#chamada-lista-alunos', '#correcao-chamada-lista-alunos'].forEach(selector => {
        const container = document.querySelector(selector);
        if (container) {
            container.addEventListener('change', e => {
                if (e.target.classList.contains('status-radio')) {
                    const row = e.target.closest('[data-aluno-id]');
                    const justDiv = row.querySelector('.justificativa-container');
                    const isFalta = e.target.value === 'falta';
                    if (justDiv) {
                        justDiv.classList.toggle('hidden', !isFalta);
                        if (isFalta) {
                            const injustificadaRadio = row.querySelector('input[value="Falta injustificada"]');
                            if (injustificadaRadio && !row.querySelector('input[name^="just-"]:checked')) {
                                injustificadaRadio.checked = true;
                            }
                        }
                    }
                }
            });
        }
    });

    turmaSelect.addEventListener('change', loadChamada);
    dataSelect.addEventListener('change', loadChamada);
    salvarChamadaBtn.addEventListener('click', saveChamada);
    document.getElementById('delete-confirm-checkbox').addEventListener('change', (e) => { document.getElementById('confirm-delete-btn').disabled = !e.target.checked; });
    document.getElementById('evento-data-inicio-filter').addEventListener('change', renderCalendarioPanel);
    document.getElementById('evento-data-fim-filter').addEventListener('change', renderCalendarioPanel);
    document.getElementById('aluno-search-input').addEventListener('input', () => renderAlunosPanel());
    document.getElementById('turma-ano-letivo-filter').addEventListener('change', renderTurmasPanel);
    document.getElementById('aluno-ano-letivo-filter').addEventListener('change', () => {
        document.getElementById('aluno-turma-filter').value = '';
        renderAlunosPanel();
    });
    document.getElementById('aluno-turma-filter').addEventListener('change', () => {
        renderAlunosPanel();
    });
    correcaoTurmaSel.addEventListener('change', loadCorrecaoChamada);
    correcaoDataSel.addEventListener('change', loadCorrecaoChamada);

    document.getElementById('promover-turmas-ano-origem').addEventListener('change', renderPromocaoTurmasLista);
    document.getElementById('promover-turmas-confirm-checkbox').addEventListener('change', (e) => {
        document.getElementById('confirm-promocao-turmas-btn').disabled = !e.target.checked;
    });

    const toggleAllCheckbox = document.getElementById('promover-turmas-toggle-all');
    if (toggleAllCheckbox) {
        toggleAllCheckbox.addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('.promocao-turma-checkbox');
            const isTudoMarcado = [...checkboxes].every(cb => cb.checked);
            checkboxes.forEach(cb => cb.checked = !isTudoMarcado);
            toggleAllCheckbox.textContent = !isTudoMarcado ? 'Desmarcar Todas' : 'Marcar Todas';
        });
    }

    document.getElementById('assiduidade-tabs').addEventListener('click', (e) => {
        e.preventDefault();
        const link = e.target.closest('a');
        if (!link || link.getAttribute('aria-current') === 'page') return;
        document.querySelectorAll('#assiduidade-tabs a').forEach(a => {
            a.removeAttribute('aria-current');
            a.classList.remove('text-indigo-600', 'border-indigo-500');
            a.classList.add('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300', 'border-transparent');
        });
        link.setAttribute('aria-current', 'page');
        link.classList.add('text-indigo-600', 'border-indigo-500');
        link.classList.remove('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300', 'border-transparent');
        document.querySelectorAll('.assiduidade-panel').forEach(p => p.classList.add('hidden'));
        document.getElementById(link.dataset.target).classList.remove('hidden');
    });

    document.getElementById('assiduidade-aluno-ano').addEventListener('change', e => {
        const anoLetivo = e.target.value;
        const alunoSel = document.getElementById('assiduidade-aluno-aluno');
        alunoSel.innerHTML = '<option value="">Todos os Alunos</option>';
        const turmasDoAnoIds = turmasCache.filter(t => t.ano_letivo == anoLetivo).map(t => t.id);
        if (anoLetivo) {
            alunosCache.filter(a => turmasDoAnoIds.includes(a.turma_id)).forEach(a => alunoSel.innerHTML += `<option value="${a.id}">${a.nome_completo}</option>`);
        }
    });

    document.getElementById('assiduidade-turma-ano').addEventListener('change', e => {
        const ano = e.target.value;
        const turmaSel = document.getElementById('assiduidade-turma-turma');
        turmaSel.innerHTML = '<option value="">Todas as Turmas</option>';
        if (ano) {
            turmasCache.filter(t => t.ano_letivo == ano)
                .forEach(t => turmaSel.innerHTML += `<option value="${t.id}">${t.nome_turma}</option>`);
        }
    });

    // Inicialização
    dataSelect.value = getLocalDateString();
    ['click', 'mousemove', 'keypress', 'scroll'].forEach(event => document.addEventListener(event, resetInactivityTimer));
    console.log("Sistema de Gestão de Faltas (Supabase) inicializado com todas as funcionalidades.");
});
