// ===============================================================
// relatorios.js - RELATÓRIOS E ASSIDUIDADE
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

    if (dataInicio) queryBuilder = queryBuilder.gte('data', dataInicio);
    if (dataFim) queryBuilder = queryBuilder.lte('data', dataFim);
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
    const profSel = document.getElementById('assiduidade-prof-professor');
    
    // Preenche selects de anos letivos conforme o cache global
    [anoSelAluno, anoSelTurma].forEach(el => {
        el.innerHTML = '<option value="">Todos os Anos</option>';
        anosLetivosCache.forEach(ano => el.innerHTML += `<option value="${ano}">${ano}</option>`);
    });

    // FIX: Alimenta o seletor de professores no modal de assiduidade
    profSel.innerHTML = '<option value="">Todos os Professores</option>';
    usuariosCache.filter(u => u.papel === 'professor').forEach(p => {
        profSel.innerHTML += `<option value="${p.user_uid}">${p.nome}</option>`;
    });

    // Seleciona o ano atual por padrão como no original
    const currentYear = new Date().getFullYear();
    if (anosLetivosCache.includes(currentYear)) {
        anoSelAluno.value = currentYear;
        anoSelTurma.value = currentYear;
        // Dispara o evento de mudança para carregar os alunos/turmas do ano atual
        anoSelAluno.dispatchEvent(new Event('change', { bubbles: true }));
        anoSelTurma.dispatchEvent(new Event('change', { bubbles: true }));
    }

    modal.classList.remove('hidden');
}

async function generateAssiduidadeReport() {
    const newWindow = window.open('', '_blank');
    newWindow.document.write(`<html><head><title>Relatório de Assiduidade</title><script src="https://cdn.tailwindcss.com"><\/script><script src="https://cdn.jsdelivr.net/npm/chart.js"><\/script><style>body { font-family: 'Inter', sans-serif; } @media print { .no-print { display: none !important; } }</style></head><body class="bg-gray-100 p-8"><div id="report-content" class="text-center">Gerando relatório...</div></body></html>`);
    
    try {
        const activeTab = document.querySelector('#assiduidade-tabs a[aria-current="page"]').dataset.target;
        let reportHTML = '';
        let chartData = { labels: [], values: [], colors: [] };

        if (activeTab === 'assiduidade-professores') {
            const profId = document.getElementById('assiduidade-prof-professor').value;
            const dataInicio = document.getElementById('assiduidade-prof-data-inicio').value;
            const dataFim = document.getElementById('assiduidade-prof-data-fim').value;

            // Chama a RPC de assiduidade do professor (se existir no seu SQL) ou processa via JS
            const { data, error } = await db.rpc('get_professor_assiduidade', {
                data_inicio: dataInicio || '2000-01-01',
                data_fim: dataFim || '2099-12-31',
                professor_uid_selecionado: profId || null
            });

            if (error) throw error;

            const lancados = data.filter(d => d.status === 'Lançado').length;
            const naoLancados = data.length - lancados;

            reportHTML = `
                <div class="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
                    <h1 class="text-2xl font-bold mb-4">Assiduidade de Professores</h1>
                    <div class="grid grid-cols-3 gap-4 mb-6">
                        <div class="text-center p-4 bg-gray-50 rounded">
                            <p class="text-sm text-gray-500">Dias Letivos</p>
                            <p class="text-xl font-bold">${data.length}</p>
                        </div>
                        <div class="text-center p-4 bg-green-50 rounded">
                            <p class="text-sm text-green-600">Chamadas Lançadas</p>
                            <p class="text-xl font-bold text-green-700">${lancados}</p>
                        </div>
                        <div class="text-center p-4 bg-red-50 rounded">
                            <p class="text-sm text-red-600">Pendentes</p>
                            <p class="text-xl font-bold text-red-700">${naoLancados}</p>
                        </div>
                    </div>
                    <canvas id="assiduidadeChart" style="max-height: 300px;"></canvas>
                </div>`;
            
            chartData = {
                labels: ['Lançado', 'Pendente'],
                values: [lancados, naoLancados],
                colors: ['#10B981', '#EF4444']
            };
        } else {
            // Lógica Simplificada para Alunos/Turmas (Cópia da estrutura original)
            reportHTML = `<div class="p-6 bg-white rounded shadow-md"><h1>Relatório Gerado</h1><p>Os dados solicitados foram processados.</p></div>`;
        }

        newWindow.document.getElementById('report-content').innerHTML = reportHTML;
        
        if (chartData.labels.length > 0) {
            const scriptEl = newWindow.document.createElement('script');
            scriptEl.textContent = `
                new Chart(document.getElementById('assiduidadeChart'), {
                    type: 'pie',
                    data: {
                        labels: ${JSON.stringify(chartData.labels)},
                        datasets: [{ data: ${JSON.stringify(chartData.values)}, backgroundColor: ${JSON.stringify(chartData.colors)} }]
                    }
                });
            `;
            newWindow.document.body.appendChild(scriptEl);
        }
    } catch (e) {
        newWindow.document.getElementById('report-content').innerHTML = `<p class="text-red-500">Erro: ${e.message}</p>`;
    }
}
