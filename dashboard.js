// ===============================================================
// dashboard.js - RESUMO DO DIA E CALENDÁRIO
// ===============================================================

async function renderDashboardPanel() {
    await loadDailySummary(dashboardSelectedDate);
    await renderDashboardCalendar();
    const { count } = await safeQuery(db.from('apoia_encaminhamentos').select('*', { count: 'exact', head: true }).eq('status', 'Em andamento'));
    document.getElementById('dashboard-acompanhamento').textContent = count === null ? 'N/A' : count;
}

async function loadDailySummary(selectedDate) {
    const presencasEl = document.getElementById('dashboard-presencas');
    const faltasEl = document.getElementById('dashboard-faltas');
    const ausentesListEl = document.getElementById('dashboard-ausentes-list');
    
    presencasEl.textContent = '...';
    faltasEl.textContent = '...';
    ausentesListEl.innerHTML = '<li>Carregando...</li>';

    const { data, error } = await safeQuery(
        db.from('presencas')
          .select('justificativa, alunos ( id, nome_completo ), turmas ( nome_turma )')
          .eq('data', selectedDate)
          .eq('status', 'falta')
    );

    if (error || !data) {
        ausentesListEl.innerHTML = `<li>Erro ao carregar dados.</li>`;
        return;
    }

    const { count: totalPresencas } = await safeQuery(
        db.from('presencas').select('*', { count: 'exact', head: true }).eq('data', selectedDate).eq('status', 'presente')
    );

    presencasEl.textContent = totalPresencas || 0;
    faltasEl.textContent = data.length;

    if (data.length === 0) {
        ausentesListEl.innerHTML = '<li>Nenhum aluno ausente.</li>';
    } else {
        ausentesListEl.innerHTML = data.map(a => {
            const justificativaTexto = a.justificativa ? `- ${a.justificativa}` : '';
            return `<li><a href="#" class="text-blue-600 hover:underline dashboard-aluno-link" data-aluno-id="${a.alunos.id}">${a.alunos.nome_completo}</a> <span class="text-gray-500">(${a.turmas.nome_turma}) ${justificativaTexto}</span></li>`
        }).join('');
    }
}

async function renderDashboardCalendar() {
    const calendarMonthYear = document.getElementById('calendar-month-year');
    const calendarGrid = document.getElementById('calendar-grid');
    const { month, year } = dashboardCalendar;

    calendarMonthYear.textContent = new Date(year, month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    calendarGrid.innerHTML = '';

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    const { data: eventos } = await safeQuery(
        db.from('eventos').select('*').or(`data.gte.${monthStart},data_fim.gte.${monthStart}`).or(`data.lte.${monthEnd},data_fim.lte.${monthEnd}`)
    );

    let html = '';
    for (let i = 0; i < firstDayOfMonth; i++) { html += '<div></div>'; }
    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month, day);
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        let dayEvent = eventos?.find(e => {
            const start = new Date(e.data + 'T00:00:00');
            const end = e.data_fim ? new Date(e.data_fim + 'T00:00:00') : start;
            return currentDate >= start && currentDate <= end;
        });

        let containerClass = 'calendar-day-container';
        let spanClass = 'calendar-day-content';
        let tooltip = '';

        if (dayEvent) {
            spanClass += ' calendar-day-event';
            containerClass += ' has-tooltip relative';
            tooltip = `<div class="tooltip">${dayEvent.descricao}</div>`;
        }
        if (dateString === dashboardSelectedDate) containerClass += ' calendar-day-selected';

        html += `<div class="${containerClass}" data-date="${dateString}">${tooltip}<span class="${spanClass}">${day}</span></div>`;
    }
    calendarGrid.innerHTML = html;
}
