// ===============================================================
// historico.js - HISTÓRICO DE FREQUÊNCIA DO ALUNO
// ===============================================================

async function openAlunoHistoricoModal(alunoId) {
    const modal = document.getElementById('aluno-historico-modal');
    const tableBody = document.getElementById('aluno-historico-table-body');
    tableBody.innerHTML = '<tr><td colspan="3" class="p-4 text-center">Carregando...</td></tr>';
    modal.classList.remove('hidden');

    const { data: aluno } = await safeQuery(db.from('alunos').select('nome_completo').eq('id', alunoId).single());
    const { data: presencas } = await safeQuery(db.from('presencas').select('data, status, justificativa').eq('aluno_id', alunoId).order('data', { ascending: false }));

    if (!aluno || !presencas) return;

    document.getElementById('historico-aluno-nome-impressao').textContent = aluno.nome_completo;
    
    const total = presencas.length;
    const presentes = presencas.filter(p => p.status === 'presente').length;
    const faltas = total - presentes;
    const assiduidade = total > 0 ? ((presentes / total) * 100).toFixed(1) + '%' : '0%';

    document.getElementById('historico-presencas').textContent = presentes;
    document.getElementById('historico-faltas').textContent = faltas;
    document.getElementById('historico-assiduidade').textContent = assiduidade;

    tableBody.innerHTML = presencas.map(p => `
        <tr class="border-b">
            <td class="p-2">${new Date(p.data + 'T00:00:00').toLocaleDateString()}</td>
            <td class="p-2 ${p.status === 'falta' ? 'text-red-600' : 'text-green-600'} font-bold">${p.status}</td>
            <td class="p-2 text-xs">${p.justificativa || ''}</td>
        </tr>`).join('');
}
