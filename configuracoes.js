// ===============================================================
// configuracoes.js - GESTÃO DE CONFIGURAÇÕES E ALERTAS
// ===============================================================

async function renderConfigPanel() {
    try {
        const { data, error } = await safeQuery(db.from('configuracoes').select('*').limit(1).single());
        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
            document.getElementById('config-faltas-consecutivas').value = data.faltas_consecutivas_limite || '';
            document.getElementById('config-faltas-intercaladas').value = data.faltas_intercaladas_limite || '';
            document.getElementById('config-faltas-dias').value = data.faltas_intercaladas_dias || '';
            if (data.alerta_horario) {
                document.getElementById('config-alerta-horario').value = data.alerta_horario.substring(0, 5);
            }
            document.getElementById('config-alerta-faltas-ativo').checked = data.alerta_faltas_ativo;
            document.getElementById('config-alerta-chamada-ativo').checked = data.alerta_chamada_nao_feita_ativo;
        }
    } catch (err) {
        console.error("Erro ao carregar configurações:", err);
        showToast("Não foi possível carregar as configurações.", true);
    }
}

async function handleConfigFormSubmit(e) {
    e.preventDefault();
    try {
        const configData = {
            id: 1,
            faltas_consecutivas_limite: document.getElementById('config-faltas-consecutivas').value,
            faltas_intercaladas_limite: document.getElementById('config-faltas-intercaladas').value,
            faltas_intercaladas_dias: document.getElementById('config-faltas-dias').value,
            alerta_horario: document.getElementById('config-alerta-horario').value || null,
            alerta_faltas_ativo: document.getElementById('config-alerta-faltas-ativo').checked,
            alerta_chamada_nao_feita_ativo: document.getElementById('config-alerta-chamada-ativo').checked
        };

        const { error } = await safeQuery(db.from('configuracoes').upsert(configData));
        if (error) throw error;
        showToast('Configurações salvas com sucesso!');
    } catch (err) {
        showToast('Erro ao salvar configurações: ' + err.message, true);
    }
}
