function getUsuarioLogadoId() {
    const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado") || "null");
    return usuarioLogado ? usuarioLogado.id : null;
}

// ── Nomes dos meses (índice 1-12) ──────────────────────────────────────────
const NOMES_MESES = [
    '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// ── Estado global da navegação de registros ────────────────────────────────
const _regEstado = {
    userId: null,
    modo: 'navegacao',      // 'navegacao' | 'filtro'
    anoSelecionado: null,
    mesSelecionado: null,
    paginaAtual: 0,
    tamanhoPagina: 20,
    ultimoFiltro: null,      // objeto de filtro usado por último (modo filtro)
    filtroCache: []          // resultados completos do filtro (paginação em memória)
};

const TAMANHOS_PAGINA = [5, 10, 15, 20, 30, 50];

// ── Ponto de entrada ────────────────────────────────────────────────────────
function carregarRegistros() {
    const userId = getUsuarioLogadoId();
    if (!userId) return;

    _regEstado.userId = userId;
    _regEstado.modo = 'navegacao';
    _regEstado.anoSelecionado = null;
    _regEstado.mesSelecionado = null;
    _regEstado.paginaAtual = 0;

    montarEstruturaBase();
    carregarAnos();
    inicializarBotaoFiltro();
}

// ── Monta o esqueleto HTML (uma vez) dentro de #registros ──────────────────
function montarEstruturaBase() {
    registros.innerHTML = `
        <div class="anos-lista" id="anosLista"></div>
        <div class="meses-bloco hidden" id="mesesBloco">
            <div class="meses-lista" id="mesesLista"></div>
        </div>
        <div class="registros-tabela-wrap hidden" id="tabelaWrap">
            <div class="reg-paginacao topo" id="regPagTopo"></div>
            <div class="registros-cabecalho">
                <span>Data</span>
                <span>Valor</span>
                <span>Detalhes</span>
                <span>Instituições</span>
                <span>Categorias</span>
                <span>Ações</span>
            </div>
            <div class="registros-linhas" id="registrosLinhas"></div>
            <div class="reg-paginacao rodape" id="regPagRodape"></div>
        </div>
    `;

    // Delegação de eventos da paginação (funciona para topo e rodapé)
    const tabelaWrap = document.getElementById("tabelaWrap");
    tabelaWrap.addEventListener("click", e => {
        const voltar = e.target.closest("#btnVoltarFiltro");
        if (voltar) { sairModoFiltro(); return; }

        const btn = e.target.closest(".reg-pg-btn");
        if (!btn || btn.disabled) return;

        if (btn.classList.contains("reg-pg-prev")) {
            irParaPagina(_regEstado.paginaAtual - 1);
        } else if (btn.classList.contains("reg-pg-next")) {
            irParaPagina(_regEstado.paginaAtual + 1);
        } else if (btn.dataset.pagina !== undefined) {
            irParaPagina(Number(btn.dataset.pagina));
        }
    });

    tabelaWrap.addEventListener("change", e => {
        if (e.target.classList.contains("reg-tamanho-select")) {
            _regEstado.tamanhoPagina = Number(e.target.value);
            _regEstado.paginaAtual = 0;
            atualizarConteudoAtual();
        }
    });
}

// ══════════════════════════════════════════════════════════════════════════
// PASSO 1 — Anos
// ══════════════════════════════════════════════════════════════════════════
function carregarAnos() {
    const anosLista = document.getElementById("anosLista");
    anosLista.innerHTML = `<div class="reg-carregando"><i class='bx bx-loader-alt'></i> Carregando anos...</div>`;

    MainAPI.buscarAnosRegistros(_regEstado.userId)
        .then(anos => renderAnos(anos))
        .catch(err => {
            console.error("Erro ao carregar anos:", err);
            anosLista.innerHTML = `<div class="aviso"><i class='bx bx-error-circle'></i><p>Erro ao carregar os anos disponíveis.</p></div>`;
        });
}

function renderAnos(anos) {
    const anosLista = document.getElementById("anosLista");

    if (!Array.isArray(anos) || anos.length === 0) {
        anosLista.innerHTML = `<div class="aviso"><i class='bx bx-search-alt'></i><p>Nenhum registro encontrado.</p></div>`;
        document.getElementById("mesesBloco").classList.add("hidden");
        document.getElementById("tabelaWrap").classList.add("hidden");
        return;
    }

    anosLista.innerHTML = anos.map(ano => `
        <button class="ano-chip" data-ano="${ano}">
            <i class='bx bx-chevron-right'></i> ${ano}
        </button>
    `).join("");

    anosLista.querySelectorAll(".ano-chip").forEach(chip => {
        chip.addEventListener("click", () => selecionarAno(Number(chip.dataset.ano)));
    });
}

function selecionarAno(ano) {
    const jaAtivo = _regEstado.anoSelecionado === ano;

    document.querySelectorAll(".ano-chip").forEach(c => {
        c.classList.toggle("ativo", Number(c.dataset.ano) === ano && !jaAtivo);
    });

    const mesesBloco = document.getElementById("mesesBloco");
    const tabelaWrap = document.getElementById("tabelaWrap");

    if (jaAtivo) {
        // Clicou de novo no mesmo ano → recolhe
        _regEstado.anoSelecionado = null;
        _regEstado.mesSelecionado = null;
        mesesBloco.classList.add("hidden");
        tabelaWrap.classList.add("hidden");
        return;
    }

    _regEstado.anoSelecionado = ano;
    _regEstado.mesSelecionado = null;
    tabelaWrap.classList.add("hidden");
    mesesBloco.classList.remove("hidden");

    carregarMeses(ano);
}

// ══════════════════════════════════════════════════════════════════════════
// PASSO 2 — Meses do ano selecionado
// ══════════════════════════════════════════════════════════════════════════
function carregarMeses(ano) {
    const mesesLista = document.getElementById("mesesLista");
    mesesLista.innerHTML = `<div class="reg-carregando"><i class='bx bx-loader-alt'></i> Carregando meses...</div>`;

    MainAPI.buscarMesesRegistros(_regEstado.userId, ano)
        .then(meses => renderMeses(meses))
        .catch(err => {
            console.error("Erro ao carregar meses:", err);
            mesesLista.innerHTML = `<div class="aviso"><i class='bx bx-error-circle'></i><p>Erro ao carregar os meses deste ano.</p></div>`;
        });
}

function renderMeses(meses) {
    const mesesLista = document.getElementById("mesesLista");

    if (!Array.isArray(meses) || meses.length === 0) {
        mesesLista.innerHTML = `<div class="aviso"><i class='bx bx-search-alt'></i><p>Nenhum registro encontrado para este ano.</p></div>`;
        return;
    }

    mesesLista.innerHTML = meses.map(mes => `
        <button class="mes-chip" data-mes="${mes}">${NOMES_MESES[mes]}</button>
    `).join("");

    mesesLista.querySelectorAll(".mes-chip").forEach(chip => {
        chip.addEventListener("click", () => selecionarMes(Number(chip.dataset.mes)));
    });
}

function selecionarMes(mes) {
    document.querySelectorAll(".mes-chip").forEach(c => {
        c.classList.toggle("ativo", Number(c.dataset.mes) === mes);
    });

    _regEstado.modo = 'navegacao';
    _regEstado.mesSelecionado = mes;
    _regEstado.paginaAtual = 0;

    document.getElementById("tabelaWrap").classList.remove("hidden");
    atualizarConteudoAtual();
}

// ══════════════════════════════════════════════════════════════════════════
// PASSO 3 — Registros do mês, paginados
// ══════════════════════════════════════════════════════════════════════════
function irParaPagina(pagina) {
    if (pagina < 0) return;
    _regEstado.paginaAtual = pagina;
    atualizarConteudoAtual();
}

// Decide se busca da API (modo navegação) ou fatia o cache (modo filtro)
function atualizarConteudoAtual() {
    if (_regEstado.modo === 'filtro') {
        renderizarPaginaFiltro();
    } else {
        carregarPaginaMes();
    }
}

function carregarPaginaMes() {
    const { userId, anoSelecionado, mesSelecionado, paginaAtual, tamanhoPagina } = _regEstado;
    if (!anoSelecionado || !mesSelecionado) return;

    const linhasEl = document.getElementById("registrosLinhas");
    linhasEl.innerHTML = `<div class="reg-carregando"><i class='bx bx-loader-alt'></i> Carregando registros...</div>`;

    MainAPI.buscarRegistrosPorMes(userId, anoSelecionado, mesSelecionado, paginaAtual, tamanhoPagina)
        .then(dados => renderizarPaginaRegistros(dados))
        .catch(err => {
            console.error("Erro ao carregar registros do mês:", err);
            linhasEl.innerHTML = `<div class="aviso"><i class='bx bx-error-circle'></i><p>Erro ao carregar os registros deste mês.</p></div>`;
        });
}

// Renderiza uma "página" (objeto no formato Page<T> do Spring) — usado no modo navegação
function renderizarPaginaRegistros(dados) {
    const linhasEl = document.getElementById("registrosLinhas");
    linhasEl.innerHTML = "";

    const conteudo = dados.content || [];

    if (conteudo.length === 0) {
        linhasEl.innerHTML = `<div class="aviso"><i class='bx bx-search-alt'></i><p>Nenhum registro encontrado.</p></div>`;
    } else {
        conteudo.forEach(registro => {
            const card = criarCardRegistro(registro);
            if (card) linhasEl.appendChild(card);
        });
    }

    renderizarBarrasPaginacao(dados);
}

// Constrói o objeto de paginação e renderiza as barras topo/rodapé
function renderizarBarrasPaginacao(dados, extraHtml) {
    const totalPages = dados.totalPages || 0;
    const paginaAtual = dados.number || 0;
    const isFirst = totalPages === 0 ? true : dados.first !== false;
    const isLast = totalPages === 0 ? true : dados.last !== false;

    const label = totalPages === 0 ? "0/0" : `${paginaAtual + 1}/${totalPages}`;
    const atalhos = calcularAtalhosPagina(paginaAtual, totalPages);

    const botoesAtalho = atalhos.map(p => `
        <button class="reg-pg-btn${p === paginaAtual ? ' ativo' : ''}" data-pagina="${p}">${p + 1}</button>
    `).join("");

    const seletorTamanho = `
        <div class="reg-tamanho-wrap">
            <label style="font-size:0.78rem;">Mostrar</label>
            <select class="reg-tamanho-select">
                ${TAMANHOS_PAGINA.map(t => `<option value="${t}" ${t === _regEstado.tamanhoPagina ? "selected" : ""}>${t}</option>`).join("")}
            </select>
        </div>
    `;

    const conteudoBarra = `
        ${extraHtml || ""}
        <span class="reg-paginacao-info">Página ${label}</span>
        <div class="reg-paginacao-botoes">
            <button class="reg-pg-btn reg-pg-prev" ${isFirst ? "disabled" : ""} title="Página anterior"><i class='bx bx-chevron-left'></i></button>
            ${botoesAtalho}
            <button class="reg-pg-btn reg-pg-next" ${isLast ? "disabled" : ""} title="Próxima página"><i class='bx bx-chevron-right'></i></button>
        </div>
        ${seletorTamanho}
    `;

    document.getElementById("regPagTopo").innerHTML = conteudoBarra;
    document.getElementById("regPagRodape").innerHTML = conteudoBarra;
}

// Calcula atalhos de página (próximas + página do meio + última), no máx. 4, 0-based
function calcularAtalhosPagina(atual, total) {
    if (total <= 1) return [];
    const candidatos = new Set();

    if (atual + 1 < total) candidatos.add(atual + 1);
    if (atual + 2 < total) candidatos.add(atual + 2);

    const meio = Math.floor(total / 2);
    if (meio !== atual) candidatos.add(meio);

    if (total - 1 !== atual) candidatos.add(total - 1);

    return Array.from(candidatos).sort((a, b) => a - b).slice(0, 4);
}

// ── Recarrega apenas a página/visão atualmente aberta (após editar/remover) ─
function refrescarAtual() {
    if (_regEstado.modo === 'filtro') {
        reaplicarFiltro();
    } else if (_regEstado.mesSelecionado) {
        carregarPaginaMes();
    } else {
        carregarRegistros();
    }
}

// ── Formata moeda ─────────────────────────────────────────────────────────────
const _fmtMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// ── Constrói e retorna um elemento "linha" (card) para um registro ────────────
function criarCardRegistro(registro) {
    const ef = registro.eventoFinanceiro || {};
    const gd = registro.gastoDetalhe || {};

    const dataISO = ef.dataEvento;
    if (!dataISO) return null;
    const data = new Date(dataISO + "T00:00:00");
    const dia = String(data.getDate()).padStart(2, "0");

    const titulo    = gd.tituloGasto || "-";
    const descricao = ef.descricao   || "";
    const valor     = ef.valor       || 0;
    const tipo      = ef.tipo        || "";
    const registroId = ef.id || "";

    const todasInsts = (registro.eventoInstituicao || [])
        .map(ei => ei.instituicao ? ei.instituicao.nome : null)
        .filter(Boolean);

    const todasCats = (gd.categoria || [])
        .map(c => c.titulo || null)
        .filter(Boolean);

    // Cores por tipo de movimento — todas vindas do root.css (sem cor hard-coded)
    const tipoEstilos = {
        'Gasto':                { bg: 'var(--cor-gasto-bg)',         color: 'var(--cor-gasto-texto)' },
        'Recebimento':          { bg: 'var(--cor-recebimento-bg)',   color: 'var(--cor-recebimento-texto)' },
        'Transferencia':        { bg: 'var(--cor-transferencia-bg)', color: 'var(--cor-transferencia-texto)' },
        'Gasto Agendado':       { bg: 'var(--cor-agendamento-bg)',   color: 'var(--cor-agendamento-texto)' },
        'Recebimento Agendado': { bg: 'var(--cor-agendamento-bg)',   color: 'var(--cor-agendamento-texto)' },
        'Poupanca':             { bg: 'var(--cor-poupanca-bg)',      color: 'var(--cor-poupanca-texto)' },
        'Emprestimo':           { bg: 'var(--cor-emprestimo-bg)',    color: 'var(--cor-emprestimo-texto)' },
    };
    const tipoLabel = tipo === 'Transferencia' ? 'Transferência'
        : tipo === 'Poupanca'      ? 'Poupança'
            : tipo === 'Emprestimo'    ? 'Empréstimo'
                : tipo;
    const est = tipoEstilos[tipo] || { bg: 'var(--cor-fundo-inativo)', color: 'var(--cor-texto-secundario)' };
    const tipoBadge = `<span class="reg-tipo-badge" style="background:${est.bg};color:${est.color};">${tipoLabel}</span>`;

    const instTags = todasInsts.length > 0
        ? todasInsts.map(n => `<span class="reg-tag">${n}</span>`).join("")
        : '<span class="reg-tag-empty">-</span>';

    const catTags = todasCats.length > 0
        ? todasCats.map(c => `<span class="reg-tag">${c}</span>`).join("")
        : '<span class="reg-tag-empty">-</span>';

    const card = document.createElement("div");
    card.className = "cardRegistro";
    card.dataset.eventoId = registroId;
    card.innerHTML = `
        <div class="reg-col-data">
            <div class="dataRegistro">${dia}</div>
            ${tipoBadge}
        </div>
        <div class="reg-col-valor">
            <div class="registroValor">${_fmtMoeda.format(valor)}</div>
        </div>
        <div class="reg-col-detalhes">
            <div class="registroTitulo">${titulo}</div>
            <div class="registroDescricao">${descricao}</div>
        </div>
        <div class="reg-col-insts">
            <div class="reg-tags-row">${instTags}</div>
        </div>
        <div class="reg-col-cats">
            <div class="reg-tags-row">${catTags}</div>
        </div>
        <div class="registroAcoes">
            <button class="reg-icon-btn edit" title="Editar registro"><i class='bx bx-edit'></i></button>
            <button class="reg-icon-btn delete" title="Remover registro"><i class='bx bx-trash'></i></button>
        </div>
    `;

    card.querySelector(".reg-icon-btn.edit").addEventListener("click", () => abrirEdicaoRegistro(registro));
    card.querySelector(".reg-icon-btn.delete").addEventListener("click", () => confirmarRemocaoRegistro({
        id: registroId, titulo, descricao, valor, tipo, data: dataISO
    }));

    return card;
}

function adicionar() {
    var valor = ipt_valor.value;
    var instituicao = select_instituicao.value;
    MainAPI.adicionarSaldo({
        valorServer: valor,
        instituicaoServer: instituicao
    }).then((resposta) => {
        console.log("Resposta:", resposta);
        if (resposta.ok) {
            console.log("Saldo atualizado")
            return window.location.reload()
        }
        else {
            console.error("Houver um erro ao atualizar o saldo", resposta)
        }
    });
}
function remover() {
    var valor = ipt_remove.value;
    var instituicao = select_instituicao_remove.value;
    MainAPI.atualizarSaldo({
        valorServer: valor,
        instituicaoServer: instituicao
    }).then((resposta) => {
        console.log("Resposta:", resposta);
        if (resposta.ok) {
            console.log("Saldo atualizado")
            return window.location.reload()
        }
        else {
            console.error("Houver um erro ao atualizar o saldo", resposta)
        }
    });
}

function gerarInstituicao() {
    select_instituicao.innerHTML = "<option value='#'> Escolha uma instituição</option>"
    MainAPI.getInstituicoes().then(json => {
        for (let c = 0; json.length > c; c++) {
            select_instituicao_remove.innerHTML +=
                `
                            <option value="${json[c].id}">${json[c].nome}</option>
                    `
            select_instituicao.innerHTML +=
                `
                            <option value="${json[c].id}">${json[c].nome}</option>
                        `
        }
    })
}
MainAPI.mostrarSaldoTotal().then(json => {
    ValorTotal.innerHTML = json[0].valorTotal
})

function Consulta() {
    principal.innerHTML = "    "
    MainAPI.mostrarTodasInstituicoes().then(json => {
        for (let c = 0; json.length > c; c++) {
            principal.innerHTML +=
                `<div>
                            <h1>${json[c].nome}</h1>
                            <div class="textoValor">
                                <p>${json[c].valor}</p>
                            </div>
                            </div>
                        `
        }
    })
}

function inicializarBotaoFiltro() {
    const btn = document.getElementById("btnAbrirFiltro");
    if (!btn || btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", abrirModalFiltroRegistros);
}

// ══════════════════════════════════════════════════════════════════════════
// MODO FILTRO — resultados exibidos na mesma tabela paginada (em memória)
// ══════════════════════════════════════════════════════════════════════════
function ativarModoFiltro(filtrados, filtroObj) {
    _regEstado.modo = 'filtro';
    _regEstado.ultimoFiltro = filtroObj;
    _regEstado.paginaAtual = 0;

    _regEstado.filtroCache = (filtrados || []).slice().sort((a, b) => {
        const da = a.eventoFinanceiro ? a.eventoFinanceiro.dataEvento : "";
        const db = b.eventoFinanceiro ? b.eventoFinanceiro.dataEvento : "";
        return new Date(da) - new Date(db);
    });

    document.getElementById("anosLista").classList.add("hidden");
    document.getElementById("mesesBloco").classList.add("hidden");
    document.getElementById("tabelaWrap").classList.remove("hidden");

    renderizarPaginaFiltro();
}

function sairModoFiltro() {
    _regEstado.modo = 'navegacao';
    _regEstado.ultimoFiltro = null;
    _regEstado.filtroCache = [];
    _regEstado.paginaAtual = 0;

    document.getElementById("anosLista").classList.remove("hidden");

    if (_regEstado.anoSelecionado && _regEstado.mesSelecionado) {
        document.getElementById("mesesBloco").classList.remove("hidden");
        carregarPaginaMes();
    } else {
        document.getElementById("mesesBloco").classList.add("hidden");
        document.getElementById("tabelaWrap").classList.add("hidden");
    }
}

// Refaz a busca do filtro (usado após editar/remover um registro em modo filtro)
async function reaplicarFiltro() {
    if (!_regEstado.ultimoFiltro) { renderizarPaginaFiltro(); return; }
    try {
        const filtrados = await MainAPI.filtrarRegistros(_regEstado.userId, _regEstado.ultimoFiltro);
        ativarModoFiltro(filtrados, _regEstado.ultimoFiltro);
    } catch (e) {
        console.error("Erro ao reaplicar filtro:", e);
        renderizarPaginaFiltro();
    }
}

// Fatia o cache em memória de acordo com a página/tamanho atuais e renderiza
function renderizarPaginaFiltro() {
    const linhasEl = document.getElementById("registrosLinhas");
    const { filtroCache, tamanhoPagina } = _regEstado;

    const totalElements = filtroCache.length;
    const totalPages = totalElements === 0 ? 0 : Math.ceil(totalElements / tamanhoPagina);

    if (_regEstado.paginaAtual >= totalPages && totalPages > 0) {
        _regEstado.paginaAtual = totalPages - 1;
    }

    const inicio = _regEstado.paginaAtual * tamanhoPagina;
    const pagina = filtroCache.slice(inicio, inicio + tamanhoPagina);

    linhasEl.innerHTML = "";
    if (pagina.length === 0) {
        linhasEl.innerHTML = `<div class="aviso"><i class='bx bx-search-alt'></i><p>Nenhum registro encontrado para o filtro aplicado.</p></div>`;
    } else {
        pagina.forEach(registro => {
            const card = criarCardRegistro(registro);
            if (card) linhasEl.appendChild(card);
        });
    }

    const dadosPagina = {
        totalElements, totalPages,
        number: _regEstado.paginaAtual,
        size: tamanhoPagina,
        first: _regEstado.paginaAtual === 0,
        last: totalPages === 0 || _regEstado.paginaAtual === totalPages - 1
    };

    const botaoVoltar = `<button class="reg-pg-btn" id="btnVoltarFiltro" title="Voltar para navegação por ano/mês"><i class='bx bx-arrow-back'></i> Voltar</button>`;
    renderizarBarrasPaginacao(dadosPagina, botaoVoltar);
}

async function abrirModalFiltroRegistros() {
    const userId = getUsuarioLogadoId();
    if (!userId) return;

    const anterior = document.getElementById("modalFiltroRegistros");
    if (anterior) anterior.remove();

    let instituicoes = [];
    let categorias = [];
    try {
        [instituicoes, categorias] = await Promise.all([
            MainAPI.getInstituicoes(userId),
            MainAPI.getTipos(userId)
        ]);
    } catch (e) {
        console.error("Erro ao carregar opções do filtro:", e);
    }

    const modal = document.createElement("div");
    modal.id = "modalFiltroRegistros";
    modal.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px;";

    const opcoesTipo = ["Gasto", "Recebimento", "Transferencia"];
    const opcoesMovimento = ["Debito", "Credito", "Dinheiro", "Pix", "Boleto", "Voucher"];

    modal.innerHTML = `
        <div class="fr-card">
            <div class="fr-top">
                <h2 class="fr-title">Filtro de Registros</h2>
                <button id="frFechar" class="fr-close">&times;</button>
            </div>

            <div class="fr-busca-grid">
                <div class="campo fr-busca-grow">
                    <input id="frTextoBusca" type="text" placeholder=" ">
                    <label for="frTextoBusca">Digite para filtrar</label>
                </div>
                <div class="fr-select-wrap" style="width:320px;max-width:42%;min-width:220px;">
                    <select id="frCampoTexto" class="fr-select">
                        <option value="titulo">Filtrar por Título</option>
                        <option value="descricao">Filtrar por Descrição</option>
                    </select>
                </div>
            </div>

            <div class="fr-grid-2">
                <div>
                    <h4 class="fr-secao-titulo">Tipo de Evento Financeiro</h4>
                    <div id="frTipos" class="fr-box fr-lista"></div>
                </div>
                <div>
                    <h4 class="fr-secao-titulo">Tipo de Movimento</h4>
                    <div id="frMovimentos" class="fr-box fr-lista"></div>
                </div>
            </div>

            <div>
                <h4 class="fr-secao-titulo">Data do Evento</h4>
                <div class="fr-date-row" style="margin-top:8px;">
                    <input id="frDataEvento" type="text" class="fr-select" placeholder="dd/mm/aaaa" maxlength="10" inputmode="numeric" style="min-width:180px;max-width:220px;cursor:text;">
                    <button class="fr-btn secondary" id="frBtnLimparData" type="button" style="padding:0 14px;" title="Limpar data">
                        <i class='bx bx-x'></i>
                    </button>
                    <p class="fr-date-display" id="frDataDisplay">Nenhuma data selecionada</p>
                </div>
            </div>

            <div class="fr-grid-2">
                <div>
                    <h4 class="fr-secao-titulo">Instituição</h4>
                    <div id="frInstituicoes" class="fr-box fr-lista"></div>
                </div>
                <div>
                    <h4 class="fr-secao-titulo">Categorias</h4>
                    <div id="frCategorias" class="fr-box fr-lista"></div>
                </div>
            </div>

            <div class="fr-actions">
                <button id="frLimpar" class="fr-btn secondary" type="button">Limpar</button>
                <button id="frAplicar" class="fr-btn primary" type="button">Aplicar filtro</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const tiposWrap = modal.querySelector("#frTipos");
    const movWrap = modal.querySelector("#frMovimentos");
    const instWrap = modal.querySelector("#frInstituicoes");
    const catWrap = modal.querySelector("#frCategorias");

    tiposWrap.innerHTML = opcoesTipo.map(item => `
        <label class="fr-check">
            <input type="checkbox" class="fr-tipo" value="${item}">
            ${item === "Transferencia" ? "Transferência" : item}
        </label>
    `).join("");

    movWrap.innerHTML = opcoesMovimento.map(item => `
        <label class="fr-check">
            <input type="checkbox" class="fr-movimento" value="${item}">
            ${item === "Debito" ? "Débito" : item === "Credito" ? "Crédito" : item}
        </label>
    `).join("");

    instWrap.innerHTML = instituicoes.length
        ? instituicoes.map(inst => `
            <label class="fr-check">
                <input type="checkbox" class="fr-inst" value="${inst.id}">
                ${inst.intituicao ? inst.intituicao.nome : "Instituição"}
            </label>
        `).join("")
        : "<small>Nenhuma instituição vinculada.</small>";

    catWrap.innerHTML = categorias.length
        ? categorias.map(cat => `
            <label class="fr-check">
                <input type="checkbox" class="fr-cat" value="${cat.id}">
                ${cat.categoria ? cat.categoria.titulo : "Categoria"}
            </label>
        `).join("")
        : "<small>Nenhuma categoria vinculada.</small>";

    modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });
    modal.querySelector("#frFechar").addEventListener("click", () => modal.remove());

    const inputData = modal.querySelector("#frDataEvento");
    const txtData = modal.querySelector("#frDataDisplay");
    const btnLimparData = modal.querySelector("#frBtnLimparData");

    // Aplica máscara de data (dd/mm/aaaa)
    if (window.MainAPI && window.MainAPI.aplicarMascaraData) {
        window.MainAPI.aplicarMascaraData(inputData);
    }

    inputData.addEventListener("input", () => {
        const iso = window.MainAPI ? window.MainAPI.dataParaISO(inputData.value) : null;
        txtData.textContent = iso ? inputData.value : "Nenhuma data selecionada";
    });

    if (btnLimparData) {
        btnLimparData.addEventListener("click", () => {
            inputData.value = "";
            txtData.textContent = "Nenhuma data selecionada";
        });
    }

    modal.querySelector("#frLimpar").addEventListener("click", () => {
        modal.querySelector("#frCampoTexto").value = "titulo";
        modal.querySelector("#frTextoBusca").value = "";
        modal.querySelector("#frDataEvento").value = "";
        modal.querySelector("#frDataDisplay").textContent = "Nenhuma data selecionada";
        modal.querySelectorAll("input[type='checkbox']").forEach(c => { c.checked = false; });
    });

    modal.querySelector("#frAplicar").addEventListener("click", async () => {
        const campoTexto = modal.querySelector("#frCampoTexto").value;
        const textoBusca = modal.querySelector("#frTextoBusca").value.trim();
        const dataEvento = window.MainAPI
            ? (window.MainAPI.dataParaISO(modal.querySelector("#frDataEvento").value) || "")
            : modal.querySelector("#frDataEvento").value;
        const tipo = Array.from(modal.querySelectorAll(".fr-tipo:checked")).map(i => i.value);
        const tipoMovimento = Array.from(modal.querySelectorAll(".fr-movimento:checked")).map(i => i.value);
        const instituicaoUsuario = Array.from(modal.querySelectorAll(".fr-inst:checked")).map(i => i.value);
        const categoriaUsuario = Array.from(modal.querySelectorAll(".fr-cat:checked")).map(i => i.value);

        const filtroTexto = {
            titulo: campoTexto === "titulo" ? textoBusca : "",
            descricao: campoTexto === "descricao" ? textoBusca : ""
        };

        const filtroObj = {
            ...filtroTexto,
            dataEvento,
            tipo,
            tipoMovimento,
            instituicaoUsuario,
            categoriaUsuario
        };

        try {
            const filtrados = await MainAPI.filtrarRegistros(userId, filtroObj);
            ativarModoFiltro(filtrados, filtroObj);
            modal.remove();
        } catch (e) {
            console.error("Erro ao filtrar registros:", e);
        }
    });
}

// ── EDITAR REGISTRO ──────────────────────────────────────────────────────────
async function abrirEdicaoRegistro(registro) {
    const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado") || "null");
    const userId = usuarioLogado ? usuarioLogado.id : null;
    if (!userId) return;

    const ef = registro.eventoFinanceiro || {};
    const ei = (registro.eventoInstituicao && registro.eventoInstituicao[0]) || {};
    const gd = registro.gastoDetalhe || {};

    // Usa MainAPI para buscar todas as páginas corretamente
    let instList = [], catList = [];
    try {
        [instList, catList] = await Promise.all([
            MainAPI.getInstituicoes(userId),
            MainAPI.getTipos(userId)
        ]);
    } catch (e) {
        console.error('Erro ao carregar dados para edição:', e);
    }

    // IDs das instituições Instituicao (entity) atualmente no registro
    const instAtualInstIds = (registro.eventoInstituicao || [])
        .map(ei2 => ei2.instituicao ? ei2.instituicao.id : null)
        .filter(Boolean);

    // IDs das categorias Categoria (entity) atualmente no registro
    const catAtualIds = (gd.categoria || [])
        .map(c => c.id)
        .filter(Boolean);

    // Gera HTML dos checkboxes de instituições
    const instChecksHtml = instList
        .filter(i => i && i.intituicao)
        .map(i => {
            const checked = instAtualInstIds.includes(i.intituicao.id) ? 'checked' : '';
            return `<label style="display:flex;align-items:center;gap:8px;padding:5px 6px;border-radius:6px;cursor:pointer;color:var(--cor-texto-principal);transition:background .15s;" onmouseover="this.style.background='var(--cor-hover)'" onmouseout="this.style.background=''">`
                + `<input type="checkbox" class="er-inst-check" value="${i.id}" ${checked} style="accent-color:var(--cor-principal);width:16px;height:16px;">`
                + `${i.intituicao.nome}</label>`;
        }).join('') || '<small style="color:var(--cor-texto-secundario)">Nenhuma instituição vinculada.</small>';

    // Gera HTML dos checkboxes de categorias
    const catChecksHtml = catList
        .filter(c => c && c.categoria)
        .map(c => {
            const checked = catAtualIds.includes(c.categoria.id) ? 'checked' : '';
            return `<label style="display:flex;align-items:center;gap:8px;padding:5px 6px;border-radius:6px;cursor:pointer;color:var(--cor-texto-principal);transition:background .15s;" onmouseover="this.style.background='var(--cor-hover)'" onmouseout="this.style.background=''">`
                + `<input type="checkbox" class="er-cat-check" value="${c.id}" ${checked} style="accent-color:var(--cor-principal);width:16px;height:16px;">`
                + `${c.categoria.titulo}</label>`;
        }).join('') || '<small style="color:var(--cor-texto-secundario)">Nenhuma categoria vinculada.</small>';

    const mostrarParcelas = ei.tipoMovimento === 'Credito' || ei.tipoMovimento === 'Boleto';

    // Remove modal anterior se existir
    const anterior = document.getElementById('modalEdicaoRegistro');
    if (anterior) anterior.remove();

    const modal = document.createElement('div');
    modal.id = 'modalEdicaoRegistro';
    modal.style.cssText = 'position:fixed;inset:0;background:var(--cor-overlay);display:flex;align-items:center;justify-content:center;z-index:9999;';
    modal.innerHTML = `
        <div style="background:var(--cor-fundo-card);border-radius:20px;padding:32px;width:min(560px,94vw);
                    color:var(--cor-texto-principal);
                    display:flex;flex-direction:column;gap:16px;box-shadow:0 8px 32px var(--sombra-caixa);
                    max-height:90vh;overflow-y:auto;">
            <h2 style="color:var(--cor-titulo);margin:0;font-size:1.4rem;">Editar Registro</h2>

            <div class="er-field-wrap">
                <input id="erTitulo" type="text" placeholder=" " value="${(gd.tituloGasto || '').replace(/"/g, '&quot;')}">
                <label for="erTitulo">Título</label>
            </div>

            <div class="er-field-wrap">
                <input id="erDescricao" type="text" placeholder=" " value="${(ef.descricao || '').replace(/"/g, '&quot;')}">
                <label for="erDescricao">Descrição</label>
            </div>

            <div class="er-field-wrap" style="position:relative;">
                <select id="erTipo">
                    <option value="Gasto"${ef.tipo === 'Gasto' ? ' selected' : ''}>Gasto</option>
                    <option value="Recebimento"${ef.tipo === 'Recebimento' ? ' selected' : ''}>Recebimento</option>
                    <option value="Transferencia"${ef.tipo === 'Transferencia' ? ' selected' : ''}>Transferência</option>
                    <option value="Poupanca"${ef.tipo === 'Poupanca' ? ' selected' : ''}>Poupança</option>
                    <option value="Emprestimo"${ef.tipo === 'Emprestimo' ? ' selected' : ''}>Empréstimo</option>
                </select>
                <label for="erTipo">Tipo do Evento</label>
                <span style="position:absolute;right:14px;top:50%;transform:translateY(-50%);color:var(--cor-principal);pointer-events:none;">▾</span>
            </div>

            <div class="er-field-wrap">
                <input id="erValor" type="number" min="0.01" step="0.01" placeholder=" " value="${ef.valor || ''}">
                <label for="erValor">Valor (ex: 150.50)</label>
            </div>

            <div class="er-field-wrap" style="position:relative;">
                <select id="erMovimento" onchange="var p=document.getElementById('erWrapParcelas');if(this.value==='Credito'||this.value==='Boleto'){p.style.display='';}else{p.style.display='none';document.getElementById('erParcelas').value=1;}">
                    <option value="Debito"${ei.tipoMovimento === 'Debito' ? ' selected' : ''}>Débito</option>
                    <option value="Credito"${ei.tipoMovimento === 'Credito' ? ' selected' : ''}>Crédito</option>
                    <option value="Dinheiro"${ei.tipoMovimento === 'Dinheiro' ? ' selected' : ''}>Dinheiro</option>
                    <option value="Pix"${ei.tipoMovimento === 'Pix' ? ' selected' : ''}>Pix</option>
                    <option value="Boleto"${ei.tipoMovimento === 'Boleto' ? ' selected' : ''}>Boleto</option>
                    <option value="Voucher"${ei.tipoMovimento === 'Voucher' ? ' selected' : ''}>Voucher</option>
                </select>
                <label for="erMovimento">Movimento</label>
                <span style="position:absolute;right:14px;top:50%;transform:translateY(-50%);color:var(--cor-principal);pointer-events:none;">▾</span>
            </div>

            <div id="erWrapParcelas" class="er-field-wrap" style="${mostrarParcelas ? '' : 'display:none;'}">
                <input id="erParcelas" type="number" min="1" placeholder=" " value="${ei.parcelas || 1}">
                <label for="erParcelas">Parcelas</label>
            </div>

            <!-- Multi-select: Instituições -->
            <div style="display:flex;flex-direction:column;gap:6px;">
                <span style="font-size:0.82rem;font-weight:700;color:var(--cor-texto-secundario);text-transform:uppercase;letter-spacing:0.5px;">
                    Instituições <span style="font-weight:400;text-transform:none;">(selecione uma ou mais)</span>
                </span>
                <div style="border:1px solid var(--cor-tinte-borda);border-radius:10px;padding:8px 10px;max-height:130px;overflow-y:auto;
                            background:var(--cor-fundo-campo,var(--cor-fundo-card));display:flex;flex-direction:column;gap:2px;">
                    ${instChecksHtml}
                </div>
            </div>

            <!-- Multi-select: Categorias -->
            <div style="display:flex;flex-direction:column;gap:6px;">
                <span style="font-size:0.82rem;font-weight:700;color:var(--cor-texto-secundario);text-transform:uppercase;letter-spacing:0.5px;">
                    Categorias <span style="font-weight:400;text-transform:none;">(selecione uma ou mais)</span>
                </span>
                <div style="border:1px solid var(--cor-tinte-borda);border-radius:10px;padding:8px 10px;max-height:130px;overflow-y:auto;
                            background:var(--cor-fundo-campo,var(--cor-fundo-card));display:flex;flex-direction:column;gap:2px;">
                    ${catChecksHtml}
                </div>
            </div>

            <div class="er-field-wrap">
                <input id="erData" type="date" placeholder=" " value="${ef.dataEvento || ''}">
                <label for="erData">Data</label>
            </div>

            <p id="erMsgErro" style="color:var(--red-700);font-size:0.9rem;margin:0;display:none;"></p>

            <div style="display:flex;gap:12px;">
                <button id="erBtnCancelar"
                    style="flex:1;height:52px;background:transparent;color:var(--cor-principal);border:2px solid var(--cor-principal);
                           border-radius:10px;font-size:1rem;cursor:pointer;">
                    Cancelar
                </button>
                <button id="erBtnSalvar"
                    style="flex:1;height:52px;background:var(--cor-principal);color:var(--cor-texto-claro);border:none;
                           border-radius:10px;font-size:1rem;cursor:pointer;">
                    Salvar
                </button>
            </div>
        </div>
    `;

    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    modal.querySelector('#erBtnCancelar').addEventListener('click', () => modal.remove());

    modal.querySelector('#erBtnSalvar').addEventListener('click', async () => {
        const titulo    = modal.querySelector('#erTitulo').value.trim();
        const descricao = modal.querySelector('#erDescricao').value.trim() || 'Nenhuma descrição fornecida';
        const tipo      = modal.querySelector('#erTipo').value;
        const erValorEl = modal.querySelector('#erValor');
        const valor     = parseFloat(erValorEl.value.replace(',', '.'));
        const movimento = modal.querySelector('#erMovimento').value;
        const parcelas  = Number(modal.querySelector('#erParcelas').value) || 1;
        const data      = modal.querySelector('#erData').value;
        const msgErro   = modal.querySelector('#erMsgErro');
        const btn       = modal.querySelector('#erBtnSalvar');

        // Lê instituições e categorias selecionadas
        const instIds = Array.from(modal.querySelectorAll('.er-inst-check:checked')).map(i => Number(i.value));
        const catIds  = Array.from(modal.querySelectorAll('.er-cat-check:checked')).map(i => Number(i.value));

        if (!titulo)                    { msgErro.textContent = 'Título obrigatório.';   msgErro.style.display = ''; return; }
        if (valor <= 0 || isNaN(valor)) { msgErro.textContent = 'Valor inválido.';        msgErro.style.display = ''; return; }
        if (!data)                      { msgErro.textContent = 'Data obrigatória.';      msgErro.style.display = ''; return; }
        if (instIds.length === 0)       { msgErro.textContent = 'Selecione ao menos uma instituição.'; msgErro.style.display = ''; return; }
        msgErro.style.display = 'none';

        btn.disabled = true;
        btn.textContent = 'Salvando...';

        const payload = {
            financeiro:  { usuario_id: userId, tipo, valor, descricao, dataEvento: data },
            instituicao: instIds.map(id => ({ instituicaoUsuario_id: id, tipoMovimento: movimento, valor, parcelas })),
            detalhe:     { categoriaUsuario_id: catIds, tituloGasto: titulo }
        };

        try {
            const res = await MainAPI.editarRegistro(ef.id, payload);
            if (res.ok) {
                modal.remove();
                // Recarrega a página/visão atual (respeitando navegação ou filtro ativo)
                refrescarAtual();
            } else {
                let detalhe = `HTTP ${res.status}`;
                try { const corpo = await res.json(); detalhe = corpo.message || JSON.stringify(corpo); } catch (_) {}
                msgErro.textContent = `Erro ao salvar: ${detalhe}`;
                msgErro.style.display = '';
                btn.disabled = false;
                btn.textContent = 'Salvar';
            }
        } catch (e) {
            msgErro.textContent = 'Erro de conexão.';
            msgErro.style.display = '';
            btn.disabled = false;
            btn.textContent = 'Salvar';
        }
    });

    document.body.appendChild(modal);
}

// ── CONFIRMAR REMOÇÃO ────────────────────────────────────────────────────────
function confirmarRemocaoRegistro(registro) {
    let popup = document.getElementById('popupConfirmarRemocao');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'popupConfirmarRemocao';
        popup.style.cssText = `
            position:fixed;inset:0;background:rgba(0,0,0,0.5);
            display:flex;align-items:center;justify-content:center;z-index:9999;
        `;
        popup.innerHTML = `
            <div style="background:var(--cor-fundo-card);border-radius:20px;padding:32px;width:min(380px,90vw);
                        color:var(--cor-texto-principal);
                        display:flex;flex-direction:column;gap:20px;box-shadow:0 8px 32px var(--sombra-caixa);
                        align-items:center;text-align:center;">
                <i class='bx bx-error-circle' style="font-size:3rem;color:var(--red-700);"></i>
                <div>
                    <p style="font-size:1.1rem;font-weight:600;color:var(--cor-texto-principal);margin:0 0 6px;">Remover registro?</p>
                    <p id="popupRemocaoNome" style="font-size:0.95rem;color:var(--cor-texto-secundario);margin:0;"></p>
                </div>
                <p style="font-size:0.85rem;color:var(--cor-texto-secundario);margin:0;">Esta ação não pode ser desfeita.</p>
                <div style="display:flex;gap:12px;width:100%;">
                    <button onclick="document.getElementById('popupConfirmarRemocao').style.display='none'"
                        style="flex:1;height:48px;background:transparent;color:var(--cor-principal);border:2px solid var(--cor-principal);
                               border-radius:10px;font-size:1rem;cursor:pointer;transition:background 0.2s;">
                        Cancelar
                    </button>
                    <button id="popupBtnConfirmar"
                        style="flex:1;height:48px;background:var(--red-700);color:var(--cor-texto-claro);border:none;border-radius:10px;
                               font-size:1rem;cursor:pointer;transition:background 0.2s;">
                        Remover
                    </button>
                </div>
            </div>
        `;

        // Fecha ao clicar fora
        popup.addEventListener('click', e => {
            if (e.target === popup) popup.style.display = 'none';
        });

        popup.querySelector('#popupBtnConfirmar').addEventListener('mouseover', e => e.target.style.background = 'var(--red-800)');
        popup.querySelector('#popupBtnConfirmar').addEventListener('mouseout', e => e.target.style.background = 'var(--red-700)');

        document.body.appendChild(popup);
    }

    popup.querySelector('#popupRemocaoNome').textContent = registro.titulo ? `"${registro.titulo}"` : '';
    popup.dataset.registroId = registro.id;

    // Botão Confirmar — preparado para integração
    popup.querySelector('#popupBtnConfirmar').onclick = async () => {
        const btn = popup.querySelector('#popupBtnConfirmar');
        btn.disabled = true;
        btn.textContent = 'Removendo...';
        try {
            const res = await MainAPI.deletarRegistro(popup.dataset.registroId);
            if (res.ok) {
                btn.disabled = false;
                btn.textContent = 'Remover';
                popup.style.display = 'none';

                // Se a página atual ficar vazia após remover e não for a primeira, volta uma página
                if (_regEstado.modo === 'navegacao' && _regEstado.paginaAtual > 0) {
                    irParaPagina(_regEstado.paginaAtual - 1);
                } else {
                    refrescarAtual();
                }
            } else {
                btn.disabled = false;
                btn.textContent = 'Remover';
            }
        } catch (e) {
            console.error('Erro ao remover registro:', e);
            btn.disabled = false;
            btn.textContent = 'Remover';
        }
    };

    popup.style.display = 'flex';
}
