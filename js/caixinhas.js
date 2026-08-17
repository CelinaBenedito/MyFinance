/* ═══════════════════════════════════════════════════════════════
   caixinhas.js — Lógica completa da tela de Poupança/Caixinhas
   ═══════════════════════════════════════════════════════════════ */

'use strict';

// ── Estado ────────────────────────────────────────────────────
let _usuario        = null;
let _caixinhas      = [];          // cache de todas as caixinhas carregadas
let _filtroAtivo    = 'ativas';    // 'ativas' | 'encerradas' | 'todas'
let _caixinhaAtual  = null;        // caixinha aberta no modal de detalhes
let _editandoId     = null;        // id sendo editado (null = criar)
let _tipoRendimento = 'CDI';       // tipo selecionado no form
let _instsSelecionadas = new Set(); // ids de instituicaoUsuario selecionados
let _todasInstituicoes = [];       // lista de instituições do usuário
let _categoriasUsuario = [];       // categorias disponíveis para registrar aporte
let _caixinhaAporteAtual = null;   // caixinha selecionada no modal de aporte

// ── Defaults de taxa por tipo ──────────────────────────────────
const TAXA_DEFAULTS = {
    CDI:          10.40,
    SELIC:        10.75,
    POUPANCA:     10.75,
    PREFIXADO:    null,
    PERSONALIZADO: null
};

// ════════════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════════════
async function iniciarPagina() {
    // Recuperar usuário logado
    _usuario = JSON.parse(localStorage.getItem('usuarioLogado') || 'null');
    if (!_usuario || !_usuario.id) {
        window.location.href = 'index.html';
        return;
    }

    // Aplicar máscara de moeda
    MainAPI.aplicarMascaraMoeda(document.getElementById('inputValorMeta'));
    // Aplicar máscara de data
    MainAPI.aplicarMascaraData(document.getElementById('inputDataPrazo'));

    // Carregar dados em paralelo
    await Promise.all([
        carregarKPIs(),
        carregarCaixinhas(_filtroAtivo),
        carregarInstituicoes()
    ]);
}

// ════════════════════════════════════════════════════════════════
// KPIs
// ════════════════════════════════════════════════════════════════
async function carregarKPIs() {
    const uid = _usuario.id;
    try {
        const [resTA, resPG, resRM, resST] = await Promise.allSettled([
            MainAPI.request(`/caixinhas/kpi/total-acumulado/usuarios/${uid}`).then(r => r.ok ? r.json() : null),
            MainAPI.request(`/caixinhas/kpi/progresso-geral/usuarios/${uid}`).then(r => r.ok ? r.json() : null),
            MainAPI.request(`/caixinhas/kpi/rendimento-estimado-mes/usuarios/${uid}`).then(r => r.ok ? r.json() : null),
            MainAPI.request(`/caixinhas/kpi/status/usuarios/${uid}`).then(r => r.ok ? r.json() : null)
        ]);

        // KPI 1 — Total Acumulado
        if (resTA.status === 'fulfilled' && resTA.value) {
            document.getElementById('kpiTotalAcumulado').textContent = formatarMoeda(resTA.value.totalAcumulado ?? 0);
            document.getElementById('kpiQtdAtivas').textContent = `${resTA.value.quantidadeAtivas ?? 0} caixinha(s) ativa(s)`;
        }

        // KPI 2 — Progresso Geral
        if (resPG.status === 'fulfilled' && resPG.value) {
            const pg = resPG.value;
            const pct = pg.percentualGeral ?? 0;
            document.getElementById('kpiProgressoPct').textContent = `${pct.toFixed(1)}%`;
            document.getElementById('kpiProgressoSub').textContent = 'da meta total atingida';

            // Atualizar barra consolidada
            const fillPct = Math.min(100, pct);
            document.getElementById('cxhProgressoFill').style.width = `${fillPct}%`;
            document.getElementById('cxhProgressoPctBar').textContent = `${pct.toFixed(1)}%`;
            document.getElementById('cxhProgressoValAtual').textContent = `${formatarMoeda(pg.totalAcumulado ?? 0)} acumulados`;
            document.getElementById('cxhProgressoValMeta').textContent = `Meta: ${formatarMoeda(pg.totalMetas ?? 0)}`;
        }

        // KPI 3 — Rendimento Estimado
        if (resRM.status === 'fulfilled' && resRM.value) {
            document.getElementById('kpiRendimento').textContent = formatarMoeda(resRM.value.rendimentoEstimadoMes ?? 0);
        }

        // KPI 4 — Status
        if (resST.status === 'fulfilled' && resST.value) {
            const st = resST.value;
            document.getElementById('kpiStatusAtivas').textContent = `${st.quantidadeAtivas ?? 0} ativas`;
            document.getElementById('kpiStatusSub').textContent = `${st.quantidadeEncerradas ?? 0} encerradas`;
        }
    } catch (e) {
        console.error('Erro ao carregar KPIs:', e);
    }
}

// ════════════════════════════════════════════════════════════════
// CAIXINHAS
// ════════════════════════════════════════════════════════════════
async function carregarCaixinhas(filtro) {
    _filtroAtivo = filtro;
    mostrarLoading(true);

    try {
        const uid = _usuario.id;
        let endpoint;
        if (filtro === 'ativas') {
            endpoint = `/caixinhas/ativas/usuarios/${uid}`;
        } else {
            endpoint = `/caixinhas/usuarios/${uid}`;
        }

        const res = await MainAPI.request(endpoint);
        if (res.status === 204) {
            _caixinhas = [];
        } else if (res.ok) {
            _caixinhas = await res.json();
            if (!Array.isArray(_caixinhas)) _caixinhas = [];
        } else {
            _caixinhas = [];
        }

        // Filtrar encerradas no cliente quando necessário
        let lista = _caixinhas;
        if (filtro === 'encerradas') {
            lista = _caixinhas.filter(c => !c.isAtiva);
        }

        renderizarCards(lista);
        mostrarInsight(lista);
    } catch (e) {
        console.error('Erro ao carregar caixinhas:', e);
        _caixinhas = [];
        renderizarCards([]);
    } finally {
        mostrarLoading(false);
    }
}

function mostrarLoading(show) {
    document.getElementById('cxhLoading').style.display = show ? 'flex' : 'none';
    if (show) {
        document.getElementById('cxhGrid').style.display = 'none';
        document.getElementById('cxhVazio').style.display = 'none';
        document.getElementById('cxhInsight').style.display = 'none';
    }
}

function renderizarCards(lista) {
    const grid  = document.getElementById('cxhGrid');
    const vazio = document.getElementById('cxhVazio');

    if (!lista || lista.length === 0) {
        grid.style.display  = 'none';
        vazio.style.display = 'flex';
        return;
    }

    vazio.style.display = 'none';
    grid.style.display  = 'grid';

    grid.innerHTML = lista.map(c => gerarCardHTML(c)).join('');

    // Adicionar listeners de clique
    grid.querySelectorAll('.cxh-card').forEach(card => {
        const id = card.dataset.id;
        card.addEventListener('click', () => {
            const caixinha = _caixinhas.find(c => c.id === id)
                || lista.find(c => c.id === id);
            if (caixinha) abrirModalDetalhes(caixinha);
        });
    });
}

function gerarCardHTML(c) {
    const pct     = Math.min(100, c.percentualAtingido ?? 0);
    const atingida = pct >= 100;
    const tipo    = c.tipoRendimento || 'CDI';
    const encerrada = !c.isAtiva;

    const alcancavel = c.metaAlcancavel;
    const alcancavelHTML = typeof alcancavel === 'boolean'
        ? `<span class="cxh-card-meta-alcancavel ${alcancavel ? '' : 'nao'}">
               <i class='bx ${alcancavel ? 'bx-check-circle' : 'bx-x-circle'}'></i>
               ${alcancavel ? 'Meta alcançável' : 'Aporte insuficiente'}
           </span>`
        : '';

    const mesesTxt = c.mesesRestantes != null ? `${c.mesesRestantes} meses restantes` : '–';
    const prazoTxt = c.dataPrazo ? formatarData(c.dataPrazo) : '–';

    return `
    <div class="cxh-card ${encerrada ? 'encerrada' : ''}" data-id="${c.id}">
        <div class="cxh-card-header">
            <div>
                <div class="cxh-card-nome">${escHtml(c.nome)}</div>
                ${c.descricao ? `<div class="cxh-card-desc">${escHtml(c.descricao)}</div>` : ''}
            </div>
            <span class="cxh-badge cxh-badge-${tipo}">${labelTipo(tipo)}</span>
        </div>

        <div class="cxh-card-valores">
            <span class="cxh-card-valor-atual">${formatarMoeda(c.valorAtual ?? 0)}</span>
            <span class="cxh-card-meta">/ ${formatarMoeda(c.valorMeta ?? 0)}</span>
        </div>

        <div>
            <div class="cxh-card-progress-track">
                <div class="cxh-card-progress-fill ${atingida ? 'atingida' : ''}" style="width:${pct}%"></div>
            </div>
            <div class="cxh-card-progress-info">
                <span class="cxh-card-pct">${pct.toFixed(1)}%</span>
                <span>${mesesTxt}</span>
            </div>
        </div>

        <div class="cxh-card-footer">
            ${alcancavelHTML}
            <span>${prazoTxt}</span>
        </div>
    </div>`;
}

// ════════════════════════════════════════════════════════════════
// FILTROS / ABAS
// ════════════════════════════════════════════════════════════════
function trocarFiltro(filtro, btnEl) {
    document.querySelectorAll('.cxh-filtro-btn').forEach(b => b.classList.remove('ativo'));
    btnEl.classList.add('ativo');
    carregarCaixinhas(filtro);
}

// ════════════════════════════════════════════════════════════════
// MODAL DETALHES
// ════════════════════════════════════════════════════════════════
function abrirModalDetalhes(c) {
    _caixinhaAtual = c;
    const encerrada = !c.isAtiva;

    // Cabeçalho
    document.getElementById('detNome').textContent    = c.nome;
    document.getElementById('detDesc').textContent    = c.descricao || '';
    document.getElementById('detBadge').className     = `cxh-badge cxh-badge-${c.tipoRendimento || 'CDI'}`;
    document.getElementById('detBadge').textContent   = labelTipo(c.tipoRendimento);
    document.getElementById('detStatusBadge').innerHTML = encerrada
        ? `<span style="font-size:0.7rem;font-weight:700;padding:3px 9px;border-radius:12px;background:var(--cor-fundo-inativo);color:var(--cor-texto-secundario);">Encerrada</span>`
        : `<span style="font-size:0.7rem;font-weight:700;padding:3px 9px;border-radius:12px;background:var(--green-100);color:var(--green-700);">Ativa</span>`;

    // Stats
    document.getElementById('detValorAtual').textContent  = formatarMoeda(c.valorAtual ?? 0);
    document.getElementById('detMeta').textContent        = formatarMoeda(c.valorMeta ?? 0);
    document.getElementById('detFalta').textContent       = formatarMoeda(c.faltaParaMeta ?? 0);
    const pct = c.percentualAtingido ?? 0;
    document.getElementById('detPct').textContent         = `${pct.toFixed(1)}%`;
    document.getElementById('detMeses').textContent       = c.mesesRestantes != null ? `${c.mesesRestantes} meses` : '–';
    document.getElementById('detPrazo').textContent       = c.dataPrazo ? formatarData(c.dataPrazo) : '–';
    document.getElementById('detAporte').textContent      = c.aporteMensalSugerido != null ? formatarMoeda(c.aporteMensalSugerido) : '–';
    document.getElementById('detTaxaMensal').textContent  = c.taxaMensalEfetiva != null
        ? `${(c.taxaMensalEfetiva * 100).toFixed(4)}% a.m.`
        : '–';

    // Barra de progresso
    const fillPct = Math.min(100, pct);
    document.getElementById('detProgressoFill').style.width = `${fillPct}%`;
    document.getElementById('detPctBar').textContent = `${pct.toFixed(1)}%`;

    // Meta alcançável
    const alcDiv = document.getElementById('detAlcancavel');
    if (typeof c.metaAlcancavel === 'boolean') {
        alcDiv.innerHTML = `
            <span class="cxh-det-alcancavel ${c.metaAlcancavel ? '' : 'nao'}">
                <i class='bx ${c.metaAlcancavel ? 'bx-check-circle' : 'bx-x-circle'}'></i>
                ${c.metaAlcancavel ? 'Meta alcançável com aportes sugeridos' : 'Meta pode não ser atingida com os aportes atuais'}
            </span>`;
    } else {
        alcDiv.innerHTML = '';
    }

    // Projeção
    document.getElementById('detProjecao').innerHTML = gerarTextoProjecao(c);

    // Instituições
    const instLista = document.getElementById('detInstLista');
    const instSection = document.getElementById('detInstSection');
    if (c.instituicoes && c.instituicoes.length > 0) {
        instSection.style.display = '';
        instLista.innerHTML = c.instituicoes.map(inst =>
            `<div class="cxh-det-inst-item">
                <span class="cxh-det-inst-nome"><i class='bx bx-buildings'></i> ${escHtml(inst.nome || 'Instituição')}</span>
                <span class="cxh-det-inst-val">${formatarMoeda(inst.valorAportado ?? 0)}</span>
            </div>`
        ).join('');
    } else {
        instSection.style.display = 'none';
    }

    // Botões: mostrar Encerrar OU Reabrir conforme status
    const btnEnc = document.getElementById('btnDetEncerrar');
    const btnReab = document.getElementById('btnDetReabrir');
    const btnAporte = document.getElementById('btnDetAportar');
    if (encerrada) {
        btnEnc.style.display  = 'none';
        btnReab.style.display = '';
        if (btnAporte) btnAporte.style.display = 'none';
    } else {
        btnEnc.style.display  = '';
        btnReab.style.display = 'none';
        if (btnAporte) btnAporte.style.display = '';
    }

    document.getElementById('modalDetOverlay').classList.add('aberto');
}

function fecharModalDet() {
    document.getElementById('modalDetOverlay').classList.remove('aberto');
    // Resetar footer de confirmação
    const fnormal = document.getElementById('detFooterNormal');
    const fconf   = document.getElementById('detFooterConfirmacao');
    if (fnormal) fnormal.style.display = 'flex';
    if (fconf)   fconf.style.display   = 'none';
    _caixinhaAtual = null;
}

function fecharModalDetOutside(e) {
    if (e.target === document.getElementById('modalDetOverlay')) fecharModalDet();
}

function gerarTextoProjecao(c) {
    const semAportes = c.montanteProjetadoSemAportes;
    const comAportes = c.montanteProjetadoComAportes;
    const aporte     = c.aporteMensalSugerido;
    const meses      = c.mesesRestantes;
    const taxa       = c.taxaMensalEfetiva;

    // Calcular projeção localmente se os dados do servidor estiverem ausentes
    const r = taxa != null ? taxa : 0;
    const n = meses != null ? meses : 0;
    const VA = c.valorAtual ?? 0;

    // Projeção sem aportes: VA * (1+r)^n
    const projSemAp = semAportes != null ? semAportes : (r > 0 ? VA * Math.pow(1 + r, n) : VA);
    // Projeção com aportes sugeridos
    const ap = aporte != null ? aporte : 0;
    const projComAp = comAportes != null ? comAportes
        : (r > 0 ? projSemAp + ap * ((Math.pow(1 + r, n) - 1) / r)
                 : projSemAp + ap * n);

    return `
        <strong>Sem novos aportes:</strong> você terá <strong>${formatarMoeda(projSemAp)}</strong> no prazo.<br>
        <strong>Com aporte de ${formatarMoeda(ap)}/mês:</strong> você terá <strong>${formatarMoeda(projComAp)}</strong>.<br>
        <strong>Meta:</strong> ${formatarMoeda(c.valorMeta ?? 0)}&nbsp;·&nbsp;
        <strong>Falta:</strong> ${formatarMoeda(c.faltaParaMeta ?? 0)}&nbsp;·&nbsp;
        <strong>Taxa mensal:</strong> ${r > 0 ? (r * 100).toFixed(4) + '% a.m.' : 'sem rendimento definido'}
    `;
}

// ── Ações do modal de detalhes ─────────────────────────────────
function editarCaixinhaAtual() {
    if (!_caixinhaAtual) return;
    const c = _caixinhaAtual; // salva referência ANTES de fechar (fecharModalDet zera _caixinhaAtual)
    fecharModalDet();
    abrirModalEditar(c);
}

// Exibe confirmação inline (sem confirm() nativo)
function pedirConfirmacaoReabrir() {
    if (!_caixinhaAtual) return;
    document.getElementById('detConfirmacaoTexto').textContent =
        `Reabrir "${_caixinhaAtual.nome}"? A caixinha voltará a aparecer como ativa.`;
    document.getElementById('btnConfirmarAcao').className = 'btn-cxh-reabrir-confirmar';
    document.getElementById('btnConfirmarAcao').onclick = confirmarReabrir;
    document.getElementById('detFooterNormal').style.display = 'none';
    document.getElementById('detFooterConfirmacao').style.display = 'flex';
}

async function confirmarReabrir() {
    const c = _caixinhaAtual;
    if (!c) return;
    cancelarConfirmacao();
    fecharModalDet();
    await reabrirCaixinha(c.id);
}

async function reabrirCaixinha(id) {
    try {
        const res = await MainAPI.request(`/caixinhas/${id}/reabrir`, { method: 'PATCH' });
        if (res.ok) {
            mostrarToast('Caixinha reaberta com sucesso!', 'sucesso');
            await Promise.all([carregarKPIs(), carregarCaixinhas(_filtroAtivo)]);
        } else {
            mostrarToast(`Erro ao reabrir: ${res.status}`, 'erro');
        }
    } catch (e) {
        mostrarToast('Erro de conexão ao reabrir.', 'erro');
    }
}

function pedirConfirmacaoEncerrar() {
    if (!_caixinhaAtual) return;
    document.getElementById('detConfirmacaoTexto').textContent =
        `Encerrar "${_caixinhaAtual.nome}"? Os dados serão mantidos.`;
    document.getElementById('btnConfirmarAcao').className = 'btn-cxh-encerrar-confirmar';
    document.getElementById('btnConfirmarAcao').onclick = confirmarEncerrar;
    document.getElementById('detFooterNormal').style.display = 'none';
    document.getElementById('detFooterConfirmacao').style.display = 'flex';
}

function pedirConfirmacaoDeletar() {
    if (!_caixinhaAtual) return;
    document.getElementById('detConfirmacaoTexto').textContent =
        `Deletar permanentemente "${_caixinhaAtual.nome}"? Ação irreversível.`;
    document.getElementById('btnConfirmarAcao').className = 'btn-cxh-deletar-confirmar';
    document.getElementById('btnConfirmarAcao').onclick = confirmarDeletar;
    document.getElementById('detFooterNormal').style.display = 'none';
    document.getElementById('detFooterConfirmacao').style.display = 'flex';
}

function cancelarConfirmacao() {
    document.getElementById('detFooterNormal').style.display = 'flex';
    document.getElementById('detFooterConfirmacao').style.display = 'none';
}

async function confirmarEncerrar() {
    const c = _caixinhaAtual;
    if (!c) return;
    cancelarConfirmacao();
    fecharModalDet();
    await encerrarCaixinha(c.id);
}

async function confirmarDeletar() {
    const c = _caixinhaAtual;
    if (!c) return;
    cancelarConfirmacao();
    fecharModalDet();
    await deletarCaixinha(c.id);
}

// Mantidas por compatibilidade (não usam mais confirm() nativo)
async function encerrarCaixinhaAtual() { pedirConfirmacaoEncerrar(); }
async function deletarCaixinhaAtual()  { pedirConfirmacaoDeletar(); }

// ════════════════════════════════════════════════════════════════
// MODAL APORTE
// ════════════════════════════════════════════════════════════════
function abrirModalAporteDaAtual(ev) {
    if (ev) ev.stopPropagation();
    if (!_caixinhaAtual || !_caixinhaAtual.isAtiva) return;
    const atual = _caixinhaAtual;
    fecharModalDet();
    abrirModalAporte(atual);
}

async function abrirModalAporte(caixinha) {
    if (!caixinha || !caixinha.isAtiva) {
        mostrarToast('Selecione uma caixinha ativa para aportar.', 'erro');
        return;
    }

    _caixinhaAporteAtual = caixinha;
    document.getElementById('modalAporteTitulo').innerHTML = `<i class='bx bx-plus-circle'></i> Adicionar saldo em "${escHtml(caixinha.nome)}"`;
    document.getElementById('aporteResumoCaixinha').textContent = `Caixinha: ${caixinha.nome}`;

    const inputValor = document.getElementById('inputAporteValor');
    MainAPI.resetarMascaraMoeda(inputValor);
    MainAPI.aplicarMascaraMoeda(inputValor);

    document.getElementById('inputAporteData').value = hojeISO();
    document.getElementById('inputAporteTitulo').value = `Aporte - ${caixinha.nome}`;
    document.getElementById('inputAporteDescricao').value = '';
    document.getElementById('selectAporteMovimento').value = 'Debito';

    document.getElementById('modalAporteOverlay').classList.add('aberto');
    preencherInstituicoesAporte(caixinha);
    await preencherCategoriasAporte();
}

function fecharModalAporte() {
    document.getElementById('modalAporteOverlay').classList.remove('aberto');
    _caixinhaAporteAtual = null;
}

function fecharModalAporteOutside(e) {
    if (e.target === document.getElementById('modalAporteOverlay')) fecharModalAporte();
}

function preencherInstituicoesAporte(caixinha) {
    const select = document.getElementById('selectAporteInstituicao');
    const vinculadas = Array.isArray(caixinha.instituicoes) ? caixinha.instituicoes : [];

    if (vinculadas.length === 0) {
        select.innerHTML = '<option value="">Sem instituição vinculada</option>';
        return;
    }

    select.innerHTML = vinculadas.map(inst => {
        const id = Number(inst.id);
        if (!Number.isFinite(id) || id <= 0) return '';
        const nomeFallback = _todasInstituicoes.find(i => Number(i.id) === id);
        const nome = inst.nome
            || nomeFallback?.intituicao?.nome
            || nomeFallback?.instituicao?.nome
            || nomeFallback?.nomeInstituicao
            || nomeFallback?.nome
            || `Instituição ${id}`;
        return `<option value="${id}">${escHtml(nome)}</option>`;
    }).filter(Boolean).join('');
}

async function preencherCategoriasAporte() {
    const select = document.getElementById('selectAporteCategoria');
    select.innerHTML = '<option value="">Carregando categorias...</option>';

    if (_categoriasUsuario.length === 0) {
        try {
            const categorias = await MainAPI.getTipos(_usuario.id);
            _categoriasUsuario = Array.isArray(categorias) ? categorias : [];
        } catch (e) {
            _categoriasUsuario = [];
        }
    }

    if (_categoriasUsuario.length === 0) {
        select.innerHTML = '<option value="">Nenhuma categoria disponível</option>';
        return;
    }

    select.innerHTML = _categoriasUsuario.map(cat => {
        const id = Number(cat.id);
        const titulo = cat.categoria?.titulo || `Categoria ${id}`;
        return `<option value="${id}">${escHtml(titulo)}</option>`;
    }).join('');
}

async function salvarAporteCaixinha() {
    const c = _caixinhaAporteAtual;
    if (!c) return;

    const valor = MainAPI.obterValorMoeda(document.getElementById('inputAporteValor'));
    const instituicaoId = Number(document.getElementById('selectAporteInstituicao').value);
    const movimento = document.getElementById('selectAporteMovimento').value;
    const categoriaId = Number(document.getElementById('selectAporteCategoria').value);
    const dataEvento = document.getElementById('inputAporteData').value;
    const titulo = (document.getElementById('inputAporteTitulo').value || '').trim();
    const descricaoDigitada = (document.getElementById('inputAporteDescricao').value || '').trim();
    const descricao = descricaoDigitada || 'Aporte realizado pela tela de caixinhas';

    if (valor <= 0) { mostrarToast('Informe um valor válido para o aporte.', 'erro'); return; }
    if (!Number.isFinite(instituicaoId) || instituicaoId <= 0) { mostrarToast('Selecione uma instituição válida.', 'erro'); return; }
    if (!movimento) { mostrarToast('Selecione o tipo de movimento.', 'erro'); return; }
    if (!Number.isFinite(categoriaId) || categoriaId <= 0) { mostrarToast('Selecione uma categoria válida.', 'erro'); return; }
    if (!dataEvento) { mostrarToast('Informe a data do aporte.', 'erro'); return; }
    if (!titulo) { mostrarToast('Informe um título para o aporte.', 'erro'); return; }

    const payload = {
        financeiro: {
            usuario_id: _usuario.id,
            tipo: 'Poupanca',
            valor,
            descricao,
            dataEvento,
            caixinha_id: c.id
        },
        instituicao: [{
            instituicaoUsuario_id: instituicaoId,
            tipoMovimento: movimento,
            valor,
            parcelas: 1
        }],
        detalhe: {
            categoriaUsuario_id: [categoriaId],
            tituloGasto: titulo
        }
    };

    const btn = document.getElementById('btnSalvarAporte');
    btn.disabled = true;
    btn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Salvando...";

    try {
        const res = await MainAPI.registrarGasto(payload);
        if (res.ok) {
            fecharModalAporte();
            mostrarToast('Saldo adicionado na caixinha com sucesso!', 'sucesso');
            await Promise.all([carregarKPIs(), carregarCaixinhas(_filtroAtivo)]);
        } else {
            const err = await res.text().catch(() => '');
            mostrarToast(`Erro ao salvar aporte: ${res.status}. ${err}`, 'erro');
        }
    } catch (e) {
        mostrarToast('Erro de conexão ao salvar aporte.', 'erro');
    } finally {
        btn.disabled = false;
        btn.innerHTML = "<i class='bx bx-save'></i> Salvar aporte";
    }
}

// ════════════════════════════════════════════════════════════════
// MODAL CRIAR / EDITAR
// ════════════════════════════════════════════════════════════════
function abrirModalCriar() {
    _editandoId = null;
    document.getElementById('modalCriarTitulo').innerHTML = "<i class='bx bx-plus-circle'></i> Nova Caixinha";
    resetarFormulario();
    document.getElementById('modalCriarOverlay').classList.add('aberto');
    validarBotaoSalvar();
}

function abrirModalEditar(c) {
    _editandoId = c.id;
    document.getElementById('modalCriarTitulo').innerHTML = "<i class='bx bx-edit'></i> Editar Caixinha";
    preencherFormulario(c);
    document.getElementById('modalCriarOverlay').classList.add('aberto');
    validarBotaoSalvar();
}

function fecharModalCriar() {
    document.getElementById('modalCriarOverlay').classList.remove('aberto');
}

function fecharModalCriarOutside(e) {
    if (e.target === document.getElementById('modalCriarOverlay')) fecharModalCriar();
}

function resetarFormulario() {
    document.getElementById('inputNome').value        = '';
    document.getElementById('inputDescricao').value   = '';
    MainAPI.resetarMascaraMoeda(document.getElementById('inputValorMeta'));
    document.getElementById('inputDataPrazo').value   = '';
    document.getElementById('inputPctRendimento').value  = '';
    document.getElementById('inputTaxaRef').value        = '';
    document.getElementById('inputTaxaRefPoupanca').value = '';
    document.getElementById('inputTaxaAnual').value      = '';
    _instsSelecionadas.clear();
    selecionarTipoRendimento('CDI');
    renderizarInstituicoes();
    document.getElementById('taxaResumo').style.display = 'none';
}

function preencherFormulario(c) {
    document.getElementById('inputNome').value      = c.nome || '';
    document.getElementById('inputDescricao').value = c.descricao || '';

    // Valor meta
    const inputMeta = document.getElementById('inputValorMeta');
    const centavos  = Math.round((c.valorMeta ?? 0) * 100);
    inputMeta.dataset.centavos = String(centavos);
    const reais = Math.floor(centavos / 100);
    const cts   = String(centavos % 100).padStart(2, '0');
    const reaisStr = String(reais).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    inputMeta.value = `R$ ${reaisStr},${cts}`;

    // Data prazo — backend pode retornar string "aaaa-mm-dd" ou array [ano, mes, dia]
    if (c.dataPrazo) {
        let iso = c.dataPrazo;
        if (Array.isArray(iso) && iso.length >= 3) {
            iso = `${iso[0]}-${String(iso[1]).padStart(2,'0')}-${String(iso[2]).padStart(2,'0')}`;
        }
        document.getElementById('inputDataPrazo').value = MainAPI.dataDeISO(String(iso));
    }

    // Tipo de rendimento
    const tipo = c.tipoRendimento || 'CDI';
    selecionarTipoRendimento(tipo);

    if (tipo === 'CDI' || tipo === 'SELIC') {
        document.getElementById('inputPctRendimento').value  = c.percentualRendimento ?? 100;
        document.getElementById('inputTaxaRef').value        = c.taxaReferenciaAtual ?? TAXA_DEFAULTS[tipo];
    } else if (tipo === 'POUPANCA') {
        document.getElementById('inputTaxaRefPoupanca').value = c.taxaReferenciaAtual ?? TAXA_DEFAULTS.POUPANCA;
    } else {
        document.getElementById('inputTaxaAnual').value = c.taxaAnualPersonalizada ?? '';
    }

    calcularTaxaEfetiva();

    // Instituições
    _instsSelecionadas.clear();
    if (c.instituicoes && Array.isArray(c.instituicoes)) {
        c.instituicoes.forEach(inst => {
            // inst.id pode ser o id da vinculação (instituicaoUsuarioId)
            _instsSelecionadas.add(inst.id);
        });
    }
    renderizarInstituicoes();
}

// ── Tipo de rendimento ─────────────────────────────────────────
function selecionarTipoRendimento(tipo) {
    _tipoRendimento = tipo;

    // Atualizar botões
    document.querySelectorAll('.cxh-rend-btn').forEach(btn => {
        btn.className = 'cxh-rend-btn';
        if (btn.dataset.tipo === tipo) btn.classList.add(`ativo-${tipo}`);
    });

    // Mostrar campos corretos
    ['camposCdiSelic', 'camposPoupanca', 'camposPrefixado'].forEach(id => {
        document.getElementById(id).classList.remove('visivel');
    });

    if (tipo === 'CDI' || tipo === 'SELIC') {
        document.getElementById('camposCdiSelic').classList.add('visivel');
        const lbl = document.getElementById('labelPctCdi');
        const lbl2 = document.getElementById('labelTaxaRef');
        lbl.textContent  = tipo === 'CDI' ? '% do CDI' : '% da SELIC';
        lbl2.textContent = tipo === 'CDI' ? 'Taxa CDI atual (% a.a.)' : 'Taxa SELIC atual (% a.a.)';
        // Preencher default se vazio
        const inp = document.getElementById('inputTaxaRef');
        if (!inp.value) inp.value = TAXA_DEFAULTS[tipo];
        const inpPct = document.getElementById('inputPctRendimento');
        if (!inpPct.value) inpPct.value = 100;
    } else if (tipo === 'POUPANCA') {
        document.getElementById('camposPoupanca').classList.add('visivel');
        const inp = document.getElementById('inputTaxaRefPoupanca');
        if (!inp.value) inp.value = TAXA_DEFAULTS.POUPANCA;
    } else {
        document.getElementById('camposPrefixado').classList.add('visivel');
    }

    calcularTaxaEfetiva();
}

// ── Calcular taxa efetiva ──────────────────────────────────────
function calcularTaxaEfetiva() {
    const tipo = _tipoRendimento;
    let taxaAnual = 0;

    if (tipo === 'CDI' || tipo === 'SELIC') {
        const pct     = parseFloat(document.getElementById('inputPctRendimento').value) || 100;
        const taxaRef = parseFloat(document.getElementById('inputTaxaRef').value) || 0;
        taxaAnual = taxaRef * (pct / 100);
    } else if (tipo === 'POUPANCA') {
        const taxaRef = parseFloat(document.getElementById('inputTaxaRefPoupanca').value) || 0;
        taxaAnual = taxaRef * 0.70;
    } else {
        taxaAnual = parseFloat(document.getElementById('inputTaxaAnual').value) || 0;
    }

    const taxaMensal = taxaAnual > 0 ? (Math.pow(1 + taxaAnual / 100, 1 / 12) - 1) * 100 : 0;

    const resumo = document.getElementById('taxaResumo');
    const txt    = document.getElementById('taxaResumoTexto');

    if (taxaAnual > 0) {
        resumo.style.display = 'flex';
        txt.innerHTML = `Taxa efetiva: <strong>${taxaAnual.toFixed(2)}% a.a.</strong> · <strong>${taxaMensal.toFixed(4)}% a.m.</strong>`;

        // Verificar alcançabilidade em tempo real
        const meta    = MainAPI.obterValorMoeda(document.getElementById('inputValorMeta'));
        const prazoTxt = document.getElementById('inputDataPrazo').value;
        if (meta > 0 && prazoTxt && prazoTxt.length === 10) {
            const prazoISO = MainAPI.dataParaISO(prazoTxt);
            if (prazoISO) {
                const hoje    = new Date();
                const prazo   = new Date(prazoISO);
                const diffMs  = prazo - hoje;
                const meses   = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.4)));
                if (meses > 0) {
                    const r   = taxaMensal / 100;
                    const VA  = 0; // sem valor atual inicial no form
                    const projSem = r > 0 ? VA * Math.pow(1 + r, meses) : VA;
                    const aporteNecessario = r > 0
                        ? ((meta - projSem) * r) / (Math.pow(1 + r, meses) - 1)
                        : (meta - projSem) / meses;
                    if (aporteNecessario > 0) {
                        txt.innerHTML += ` · Aporte necessário: <strong>${formatarMoeda(aporteNecessario)}/mês</strong> por <strong>${meses} meses</strong>`;
                    }
                }
            }
        }
    } else {
        resumo.style.display = 'none';
    }
}

// ── Instituições ───────────────────────────────────────────────
async function carregarInstituicoes() {
    try {
        _todasInstituicoes = await MainAPI.getInstituicoes(_usuario.id);
        if (!Array.isArray(_todasInstituicoes)) _todasInstituicoes = [];
        renderizarInstituicoes();
    } catch (e) {
        console.error('Erro ao carregar instituições:', e);
        _todasInstituicoes = [];
    }
}

function renderizarInstituicoes() {
    const grid = document.getElementById('instGrid');
    if (_todasInstituicoes.length === 0) {
        grid.innerHTML = '<span style="font-size:0.82rem;color:var(--cor-texto-secundario);">Nenhuma instituição vinculada. <a href="configurações.html" style="color:var(--cor-principal);">Configurar</a></span>';
        return;
    }

    grid.innerHTML = _todasInstituicoes.map(inst => {
        const selecionada = _instsSelecionadas.has(inst.id);
        return `
        <div class="cxh-inst-item ${selecionada ? 'selecionada' : ''}" 
             data-instid="${inst.id}"
             onclick="toggleInstituicao(${inst.id}, this)">
            <span class="cxh-inst-check">${selecionada ? '✓' : ''}</span>
            <span>${escHtml(inst.intituicao?.nome || inst.instituicao?.nome || inst.nomeInstituicao || inst.nome || `Inst. ${inst.id}`)}</span>
        </div>`;
    }).join('');
}

function toggleInstituicao(instId, el) {
    if (_instsSelecionadas.has(instId)) {
        _instsSelecionadas.delete(instId);
        el.classList.remove('selecionada');
        el.querySelector('.cxh-inst-check').textContent = '';
    } else {
        _instsSelecionadas.add(instId);
        el.classList.add('selecionada');
        el.querySelector('.cxh-inst-check').textContent = '✓';
    }
    validarBotaoSalvar();
}

// ── Validar botão salvar ───────────────────────────────────────
function validarBotaoSalvar() {
    const nome    = (document.getElementById('inputNome').value || '').trim();
    const temInst = _instsSelecionadas.size > 0;
    const btn     = document.getElementById('btnSalvarCaixinha');
    const aviso   = document.getElementById('instAviso');

    btn.disabled = !(nome && temInst);
    if (aviso) aviso.style.display = (!temInst && nome) ? '' : 'none';
}

// ════════════════════════════════════════════════════════════════
// SALVAR (POST / PUT)
// ════════════════════════════════════════════════════════════════
async function salvarCaixinha() {
    const nome     = document.getElementById('inputNome').value.trim();
    const descricao = document.getElementById('inputDescricao').value.trim();
    const valorMeta = MainAPI.obterValorMoeda(document.getElementById('inputValorMeta'));
    const prazoTxt  = document.getElementById('inputDataPrazo').value;
    const tipo      = _tipoRendimento;

    if (!nome) { mostrarToast('Informe o nome da caixinha.', 'erro'); return; }
    if (_instsSelecionadas.size === 0) { mostrarToast('Selecione ao menos uma instituição.', 'erro'); return; }

    // Montar payload
    const payload = {
        usuarioId:    _usuario.id,
        nome,
        descricao:    descricao || null,
        valorMeta:    valorMeta > 0 ? valorMeta : null,
        dataPrazo:    prazoTxt ? MainAPI.dataParaISO(prazoTxt) : null,
        tipoRendimento: tipo,
        isCompartilhada: false,
        instituicaoUsuarioIds: Array.from(_instsSelecionadas)
    };

    // Campos condicionais de rendimento
    if (tipo === 'CDI' || tipo === 'SELIC') {
        payload.percentualRendimento  = parseFloat(document.getElementById('inputPctRendimento').value) || 100;
        payload.taxaReferenciaAtual   = parseFloat(document.getElementById('inputTaxaRef').value) || TAXA_DEFAULTS[tipo];
        payload.taxaAnualPersonalizada = null;
    } else if (tipo === 'POUPANCA') {
        payload.percentualRendimento  = 70;
        payload.taxaReferenciaAtual   = parseFloat(document.getElementById('inputTaxaRefPoupanca').value) || TAXA_DEFAULTS.POUPANCA;
        payload.taxaAnualPersonalizada = null;
    } else {
        payload.percentualRendimento  = 100;
        payload.taxaReferenciaAtual   = null;
        payload.taxaAnualPersonalizada = parseFloat(document.getElementById('inputTaxaAnual').value) || null;
    }

    const btn = document.getElementById('btnSalvarCaixinha');
    btn.disabled = true;
    btn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Salvando...";

    try {
        let res;
        if (_editandoId) {
            res = await MainAPI.request(`/caixinhas/${_editandoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            res = await MainAPI.request('/caixinhas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }

        if (res.ok || res.status === 201) {
            fecharModalCriar();
            mostrarToast(_editandoId ? 'Caixinha atualizada com sucesso!' : 'Caixinha criada com sucesso!', 'sucesso');
            await Promise.all([carregarKPIs(), carregarCaixinhas(_filtroAtivo)]);
        } else {
            const err = await res.text().catch(() => '');
            mostrarToast(`Erro ao salvar: ${res.status}. ${err}`, 'erro');
        }
    } catch (e) {
        console.error('Erro ao salvar caixinha:', e);
        mostrarToast('Erro de conexão ao salvar.', 'erro');
    } finally {
        btn.disabled = false;
        btn.innerHTML = "<i class='bx bx-save'></i> Salvar";
        validarBotaoSalvar();
    }
}

// ════════════════════════════════════════════════════════════════
// ENCERRAR / DELETAR
// ════════════════════════════════════════════════════════════════
async function encerrarCaixinha(id) {
    try {
        const res = await MainAPI.request(`/caixinhas/${id}/encerrar`, { method: 'PATCH' });
        if (res.ok) {
            mostrarToast('Caixinha encerrada.', 'sucesso');
            await Promise.all([carregarKPIs(), carregarCaixinhas(_filtroAtivo)]);
        } else {
            mostrarToast(`Erro ao encerrar: ${res.status}`, 'erro');
        }
    } catch (e) {
        mostrarToast('Erro de conexão ao encerrar.', 'erro');
    }
}

async function deletarCaixinha(id) {
    try {
        const res = await MainAPI.request(`/caixinhas/${id}`, { method: 'DELETE' });
        if (res.ok || res.status === 204) {
            mostrarToast('Caixinha deletada.', 'sucesso');
            await Promise.all([carregarKPIs(), carregarCaixinhas(_filtroAtivo)]);
        } else {
            mostrarToast(`Erro ao deletar: ${res.status}`, 'erro');
        }
    } catch (e) {
        mostrarToast('Erro de conexão ao deletar.', 'erro');
    }
}

// ════════════════════════════════════════════════════════════════
// INSIGHT
// ════════════════════════════════════════════════════════════════
function mostrarInsight(lista) {
    const insightEl = document.getElementById('cxhInsight');
    const textoEl   = document.getElementById('cxhInsightTexto');

    if (!lista || lista.length === 0) {
        insightEl.style.display = 'none';
        return;
    }

    const ativas  = lista.filter(c => c.isAtiva);
    const qtd     = ativas.length;
    const alcanc  = ativas.filter(c => c.metaAlcancavel === true).length;
    const proxima = [...ativas].sort((a, b) => (a.faltaParaMeta ?? 0) - (b.faltaParaMeta ?? 0))[0];

    let texto = `Você tem <strong>${qtd}</strong> caixinha(s) ativa(s). `;
    if (alcanc > 0) texto += `<strong>${alcanc}</strong> delas com meta alcançável no prazo. `;
    if (proxima) texto += `A mais próxima da meta é <strong>"${escHtml(proxima.nome)}"</strong> (${(proxima.percentualAtingido ?? 0).toFixed(1)}% atingido, faltam ${formatarMoeda(proxima.faltaParaMeta ?? 0)}).`;

    textoEl.innerHTML = texto;
    insightEl.style.display = 'flex';
}

// ════════════════════════════════════════════════════════════════
// UTILITÁRIOS
// ════════════════════════════════════════════════════════════════
function formatarMoeda(valor) {
    const n = Number(valor) || 0;
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function hojeISO() {
    const agora = new Date();
    const y = agora.getFullYear();
    const m = String(agora.getMonth() + 1).padStart(2, '0');
    const d = String(agora.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function formatarData(iso) {
    if (!iso) return '–';
    // Suporta array [ano,mes,dia] ou string "aaaa-mm-dd"
    if (Array.isArray(iso) && iso.length >= 3) {
        return `${String(iso[2]).padStart(2,'0')}/${String(iso[1]).padStart(2,'0')}/${iso[0]}`;
    }
    const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    return iso;
}

function labelTipo(tipo) {
    const map = {
        CDI: 'CDI', SELIC: 'SELIC', POUPANCA: 'Poupança',
        PREFIXADO: 'Prefixado', PERSONALIZADO: 'Personalizado'
    };
    return map[tipo] || tipo;
}

function escHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Toast
function mostrarToast(msg, tipo) {
    const existing = document.querySelector('.cxh-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `cxh-toast ${tipo || ''}`;
    toast.innerHTML = `<i class='bx ${tipo === 'sucesso' ? 'bx-check-circle' : 'bx-error-circle'}'></i> ${escHtml(msg)}`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.transition = 'opacity 0.3s';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 320);
    }, 3500);
}
