/* ================================================================
   instituicoes.js  –  Tela de Instituições Financeiras
   ================================================================ */

(function () {

    /* ─── Helpers de formatação ─────────────────────────────── */
    function fmtBRL(val) {
        const n = Number(val) || 0;
        return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }

    function fmtNum(val) {
        return (Number(val) || 0).toLocaleString("pt-BR");
    }

    /* ─── Cores dos bancos (círculo no card) ─────────────────── */
    const COR_BANCOS = {
        "nubank":          "#820AD1",
        "itaú":            "#FF6200",
        "itau":            "#FF6200",
        "bradesco":        "#CC092F",
        "banco do brasil": "#F7CD00",
        "bb":              "#F7CD00",
        "caixa":           "#006B3F",
        "santander":       "#EC0000",
        "inter":           "#FF7A00",
        "c6":              "#1A1A2E",
        "xp":              "#000000",
        "picpay":          "#11C76F",
        "next":            "#00E64B",
        "neon":            "#00D4FF",
        "original":        "#00A651",
        "sicoob":          "#006B3F",
        "sicredi":         "#009B3A",
        "alelo":           "#F7941D",
        "aelo":            "#F7941D",
        "ticket":          "#EF3829",
        "vale":            "#009B3A",
        "pluxee":          "#6C2FF7",
        "sodexo":          "#D22630",
    };

    function corInstituicao(nome) {
        if (!nome) return "var(--cor-principal)";
        const chave = nome.toLowerCase();
        for (const [k, v] of Object.entries(COR_BANCOS)) {
            if (chave.includes(k)) return v;
        }
        // gera cor determinística baseada no nome
        let hash = 0;
        for (let i = 0; i < nome.length; i++) hash = (hash * 31 + nome.charCodeAt(i)) & 0xffffffff;
        const h = Math.abs(hash) % 360;
        return `hsl(${h},52%,42%)`;
    }

    function inicialInstituicao(nome) {
        if (!nome) return "?";
        const partes = nome.trim().split(/\s+/);
        if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
        return nome.slice(0, 2).toUpperCase();
    }

    /* ─── Estado Global ──────────────────────────────────────── */
    let _userId       = null;
    let _resumoList   = [];   // ResumoInstituicaoDto[]
    let _caixinhas    = [];   // CaixinhaResponseDTO[]
    let _instAtual    = null; // resumo selecionado para o modal
    let _atalhoAtivo  = null;

    /* ══════════════════════════════════════════════════════════
       PERÍODO (mesmo padrão do dashboard)
    ══════════════════════════════════════════════════════════ */
    const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                   "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
    const TRIMESTRES = ["1º Trimestre","2º Trimestre","3º Trimestre","4º Trimestre"];
    const SEMESTRES  = ["1º Semestre","2º Semestre"];

    function periodoAtual() {
        const tipo = document.getElementById("select_tempo")?.value || "MENSAL";
        const ano  = parseInt(document.getElementById("select_ano")?.value  || new Date().getFullYear(), 10);
        switch (tipo) {
            case "MENSAL": {
                const mes = parseInt(document.getElementById("select_mes")?.value || (new Date().getMonth()+1), 10);
                return { tipo, ano, mes };
            }
            case "TRIMESTRAL": {
                const t = parseInt(document.getElementById("select_trimestre")?.value || 1, 10);
                return { tipo, ano, trimestre: t };
            }
            case "SEMESTRAL": {
                const s = parseInt(document.getElementById("select_semestre")?.value || 1, 10);
                return { tipo, ano, semestre: s };
            }
            case "ANUAL":
                return { tipo, ano };
        }
    }

    function labelPeriodo(p) {
        if (!p) return "–";
        switch (p.tipo) {
            case "MENSAL":     return `${MESES[(p.mes||1)-1]} / ${p.ano}`;
            case "TRIMESTRAL": return `${TRIMESTRES[(p.trimestre||1)-1]} / ${p.ano}`;
            case "SEMESTRAL":  return `${SEMESTRES[(p.semestre||1)-1]} / ${p.ano}`;
            case "ANUAL":      return `${p.ano}`;
        }
        return "–";
    }

    function buildPeriodoParams(p) {
        let url = `periodo=${p.tipo}&ano=${p.ano}`;
        if (p.tipo === "MENSAL"     && p.mes)       url += `&mes=${p.mes}`;
        if (p.tipo === "TRIMESTRAL" && p.trimestre) url += `&trimestre=${p.trimestre}`;
        if (p.tipo === "SEMESTRAL"  && p.semestre)  url += `&semestre=${p.semestre}`;
        return url;
    }

    window.atualizarSeletoresPeriodo = function () {
        const tipo  = document.getElementById("select_tempo")?.value;
        const divs  = { MENSAL:"div_mes", TRIMESTRAL:"div_trimestre", SEMESTRAL:"div_semestre", ANUAL:"div_ano" };
        const todos = ["div_mes","div_trimestre","div_semestre","div_ano"];
        todos.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = "none";
        });
        if (divs[tipo]) {
            const el = document.getElementById(divs[tipo]);
            if (el) el.style.display = "";
        }
        document.getElementById("div_ano").style.display = "";
        marcarAtalhoAtivo(null);
        carregarInstituicoes();
    };

    window.marcarAtalhoAtivo = function (nome) {
        _atalhoAtivo = nome;
        document.querySelectorAll(".dash-atalho-btn").forEach(btn => {
            btn.classList.toggle("ativo", btn.dataset.atalho === nome);
        });
    };

    window.selecionarRapido = function (atalho) {
        const hoje = new Date();
        const anoAtual = hoje.getFullYear();
        const mesAtual = hoje.getMonth() + 1;

        const selTempo  = document.getElementById("select_tempo");
        const selMes    = document.getElementById("select_mes");
        const selAno    = document.getElementById("select_ano");

        if (!selTempo || !selMes || !selAno) return;

        if (atalho === "mes-atual") {
            selTempo.value = "MENSAL";
            selMes.value   = mesAtual;
            selAno.value   = anoAtual;
        } else if (atalho === "mes-passado") {
            const mP = mesAtual === 1 ? 12 : mesAtual - 1;
            const aP = mesAtual === 1 ? anoAtual - 1 : anoAtual;
            selTempo.value = "MENSAL";
            selMes.value   = mP;
            selAno.value   = aP;
        } else if (atalho === "ano-atual") {
            selTempo.value = "ANUAL";
            selAno.value   = anoAtual;
        } else if (atalho === "ano-passado") {
            selTempo.value = "ANUAL";
            selAno.value   = anoAtual - 1;
        }

        atualizarSeletoresPeriodo();
        marcarAtalhoAtivo(atalho);
        carregarInstituicoes();
    };

    function inicializarPeriodo() {
        const hoje = new Date();
        const selMes = document.getElementById("select_mes");
        const selAno = document.getElementById("select_ano");
        if (selMes) selMes.value = hoje.getMonth() + 1;
        if (selAno) selAno.value = hoje.getFullYear();
        atualizarSeletoresPeriodo();
        marcarAtalhoAtivo("mes-atual");
    }

    function atualizarLabelPeriodo() {
        const label = document.getElementById("labelPeriodoAtual");
        if (label) label.textContent = labelPeriodo(periodoAtual());
    }

    /* ══════════════════════════════════════════════════════════
       KPIs
    ══════════════════════════════════════════════════════════ */
    function calcularEExibirKPIs(lista) {
        if (!lista || lista.length === 0) {
            document.getElementById("kpi1Nome").textContent       = "Sem dados";
            document.getElementById("kpi1Sub").textContent        = "–";
            document.getElementById("kpi2Nome").textContent        = "Sem dados";
            document.getElementById("kpi2Valor").textContent       = "–";
            document.getElementById("kpi3Total").textContent       = "0";
            return;
        }

        // KPI 1 – Instituição mais utilizada (maior quantidadeTransacoes)
        const maisUsada = lista.reduce((a, b) =>
            (b.quantidadeTransacoes > a.quantidadeTransacoes ? b : a), lista[0]);
        document.getElementById("kpi1Nome").textContent = maisUsada.nomeInstituicao;
        document.getElementById("kpi1Sub").textContent  = `${fmtNum(maisUsada.quantidadeTransacoes)} transações`;

        // KPI 2 – Maior gasto médio / transação
        let maiorMedia = null;
        lista.forEach(inst => {
            if (!inst.quantidadeTransacoes || inst.quantidadeTransacoes === 0) return;
            const totalGasto = (Number(inst.totalCredito) || 0) + (Number(inst.totalDebito) || 0);
            const media = totalGasto / inst.quantidadeTransacoes;
            if (maiorMedia === null || media > maiorMedia.media) {
                maiorMedia = { inst, media };
            }
        });
        if (maiorMedia) {
            document.getElementById("kpi2Nome").textContent  = maiorMedia.inst.nomeInstituicao;
            // Apenas o valor — "por operação" já está no HTML como kpi-sub
            document.getElementById("kpi2Valor").textContent = fmtBRL(maiorMedia.media);
        } else {
            document.getElementById("kpi2Nome").textContent  = "Sem dados";
            document.getElementById("kpi2Valor").textContent = "–";
        }

        // KPI 3 – Total de parcelamentos ativos
        const totalParcelas = lista.reduce((acc, inst) => acc + (inst.parcelamentosAtivos || 0), 0);
        document.getElementById("kpi3Total").textContent = fmtNum(totalParcelas);
    }

    /* ══════════════════════════════════════════════════════════
       CARDS DAS INSTITUIÇÕES
    ══════════════════════════════════════════════════════════ */
    function renderizarCards(lista) {
        const grid    = document.getElementById("instituicoesGrid");
        const loading = document.getElementById("loadingInstituicoes");
        const vazio   = document.getElementById("semInstituicoes");

        if (loading) loading.style.display = "none";

        if (!lista || lista.length === 0) {
            grid.innerHTML = "";
            if (vazio) vazio.style.display = "flex";
            return;
        }

        if (vazio) vazio.style.display = "none";

        grid.innerHTML = lista.map(inst => buildCardHTML(inst)).join("");

        // Adiciona click handler em cada card
        grid.querySelectorAll(".inst-card").forEach(card => {
            card.addEventListener("click", () => {
                const id = parseInt(card.dataset.instId, 10);
                const resumo = _resumoList.find(r => r.instUsuarioId === id);
                if (resumo) abrirModalInstituicao(resumo);
            });
        });
    }

    function buildCardHTML(inst) {
        const cor     = corInstituicao(inst.nomeInstituicao);
        const inicial = inicialInstituicao(inst.nomeInstituicao);
        const pct     = Math.min(inst.percentualCreditoUtilizado || 0, 100);
        const limStr  = inst.limiteCredito > 0 ? `de ${fmtBRL(inst.limiteCredito)}` : "";
        const corBarra = pct > 80 ? "var(--red-700)" : pct > 50 ? "#f59e0b" : "var(--cor-principal)";
        const hasCred = inst.temCredito !== false;

        return `
        <div class="inst-card" data-inst-id="${inst.instUsuarioId}" title="Clique para ver detalhes">
            <!-- Cabeçalho do card -->
            <div class="inst-card-header">
                <div class="inst-card-avatar" style="background:${cor};">${inicial}</div>
                <div class="inst-card-info">
                    <span class="inst-card-nome">${inst.nomeInstituicao}</span>
                    <span class="inst-card-sub">${fmtNum(inst.quantidadeTransacoes)} transações</span>
                </div>
                <div class="inst-card-saldo-wrap">
                    <span class="inst-card-saldo-label">Saldo</span>
                    <span class="inst-card-saldo">${fmtBRL(inst.saldoDisponivel)}</span>
                </div>
            </div>

            <!-- Crédito / Débito -->
            <div class="inst-card-cd-row">
                <div class="inst-card-cd">
                    <span class="inst-cd-label">${hasCred ? "CRÉDITO" : "GASTO"}</span>
                    <span class="inst-cd-valor vermelho">${fmtBRL(inst.totalCredito)}</span>
                </div>
                <div class="inst-card-cd">
                    <span class="inst-cd-label">DÉBITO</span>
                    <span class="inst-cd-valor vermelho">${fmtBRL(inst.totalDebito)}</span>
                </div>
            </div>

            ${hasCred ? `
            <!-- Barra de crédito (somente para instituições com crédito) -->
            <div>
                <div class="inst-card-progress-header">
                    <span class="kpi-sub">Crédito usado</span>
                    <span class="kpi-sub"><strong>${pct}%</strong> ${limStr}</span>
                </div>
                <div class="inst-progress-track">
                    <div class="inst-progress-fill"
                         style="width:${pct}%; background:${corBarra};"></div>
                </div>
            </div>` : ""}

            <!-- Parcelas ativas -->
            ${inst.parcelamentosAtivos > 0 ? `
            <div class="inst-card-parcelas">
                <i class='bx bx-refresh'></i>
                <span>${inst.parcelamentosAtivos} parcelamento${inst.parcelamentosAtivos > 1 ? "s" : ""} ativo${inst.parcelamentosAtivos > 1 ? "s" : ""}</span>
            </div>` : ""}
        </div>`;
    }

    /* ══════════════════════════════════════════════════════════
       MODAL DE DETALHE
    ══════════════════════════════════════════════════════════ */
    let _inputLimiteCredito = null;

    function abrirModalInstituicao(resumo) {
        _instAtual = resumo;
        _parcelamentosCarregados = false; // reset lazy load
        _recorrentesCarregados   = false; // reset lazy load

        const hasCred = resumo.temCredito !== false;

        // Avatar e título
        const cor = corInstituicao(resumo.nomeInstituicao);
        const ini = inicialInstituicao(resumo.nomeInstituicao);
        document.getElementById("instModalAvatar").style.background = cor;
        document.getElementById("instModalAvatar").textContent      = ini;
        document.getElementById("instModalNome").textContent        = resumo.nomeInstituicao;

        const badge = document.getElementById("instModalBadge");
        if (hasCred) {
            const pct = resumo.percentualCreditoUtilizado || 0;
            badge.textContent = `${pct}% crédito usado`;
            badge.className   = "inst-modal-badge" + (pct > 80 ? " vermelho" : pct > 50 ? " amarelo" : "");
        } else {
            badge.textContent = "Sem crédito rotativo";
            badge.className   = "inst-modal-badge";
        }

        // Preenche aba Resumo
        document.getElementById("mdSaldo").textContent      = fmtBRL(resumo.saldoDisponivel);
        document.getElementById("mdTransacoes").textContent = fmtNum(resumo.quantidadeTransacoes);
        document.getElementById("mdCredito").textContent    = fmtBRL(resumo.totalCredito);
        document.getElementById("mdDebito").textContent     = fmtBRL(resumo.totalDebito);
        document.getElementById("mdParcelas").textContent   = fmtNum(resumo.parcelamentosAtivos);
        document.getElementById("mdTaxa").textContent       = resumo.taxaJuros != null
            ? `${Number(resumo.taxaJuros).toFixed(2)}% a.m.` : "–";

        // Seção de crédito (somente se houver crédito)
        const creditoSection = document.getElementById("mdCreditoSection");
        if (creditoSection) creditoSection.style.display = hasCred ? "" : "none";

        if (hasCred) {
            const pct = resumo.percentualCreditoUtilizado || 0;
            document.getElementById("mdCreditoPct").textContent  = `${pct}%`;
            document.getElementById("mdCreditoLimite").textContent = resumo.limiteCredito > 0
                ? `de ${fmtBRL(resumo.limiteCredito)}` : "";
            const fill = document.getElementById("mdCreditoFill");
            fill.style.width      = `${Math.min(pct, 100)}%`;
            fill.style.background = pct > 80 ? "var(--red-700)" : pct > 50 ? "#f59e0b" : "var(--cor-principal)";
        }

        // Rótulo de "Total Crédito" no resumo da aba
        const mdCreditoLabel = document.querySelector("#tab-resumo .inst-stat-card:nth-child(3) .inst-stat-label");
        if (mdCreditoLabel) mdCreditoLabel.textContent = hasCred ? "Total Crédito" : "Gastos";

        // Config tab: campo de limite de crédito
        const campLimite = document.getElementById("campLimiteCredito");
        if (campLimite) campLimite.style.display = hasCred ? "" : "none";

        // Seção de pagamento de fatura (só para instituições com crédito)
        const secFatura = document.getElementById("secaoPagarFatura");
        if (secFatura) secFatura.style.display = hasCred ? "" : "none";

        // Aplica máscara no campo de fatura se ainda não foi aplicada
        const inputFatura = document.getElementById("inputValorFatura");
        if (inputFatura && !inputFatura.dataset.mascaraAplicada) {
            MainAPI.aplicarMascaraMoeda(inputFatura);
            inputFatura.dataset.mascaraAplicada = "1";
        }
        if (inputFatura) MainAPI.resetarMascaraMoeda(inputFatura);

        // Carrega distribuição por movimento (detalhe)
        carregarDetalheInstituicao(resumo.instUsuarioId);

        // Preenche aba Config
        if (!_inputLimiteCredito) {
            _inputLimiteCredito = document.getElementById("inputLimiteCredito");
            MainAPI.aplicarMascaraMoeda(_inputLimiteCredito);
        }
        MainAPI.resetarMascaraMoeda(_inputLimiteCredito);
        if (hasCred && resumo.limiteCredito > 0) {
            const centavos = Math.round(Number(resumo.limiteCredito) * 100);
            _inputLimiteCredito.dataset.centavos = String(centavos);
            const reais = Math.floor(centavos / 100);
            const cts   = String(centavos % 100).padStart(2, "0");
            _inputLimiteCredito.value = `R$ ${String(reais).replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${cts}`;
        }
        const taxaInput = document.getElementById("inputTaxaJuros");
        if (taxaInput) taxaInput.value = resumo.taxaJuros != null ? resumo.taxaJuros : "";

        // Preenche aba Poupança
        carregarPoupancasInstituicao(resumo.instUsuarioId);

        // Feedback
        const fb = document.getElementById("configFeedback");
        if (fb) { fb.style.display = "none"; fb.textContent = ""; }

        // Abre na aba resumo
        trocarAba("resumo");

        // Exibe overlay
        const overlay = document.getElementById("instModalOverlay");
        overlay.style.display = "flex";
        document.body.style.overflow = "hidden";
    }

    async function carregarDetalheInstituicao(instUsuarioId) {
        try {
            const res = await MainAPI.request(`/instituicoes/${instUsuarioId}/detalhe`, { method: "GET" });
            if (!res.ok) return;
            const detalhe = await res.json();

            const sec  = document.getElementById("mdDistribuicaoSection");
            const grid = document.getElementById("mdDistribuicao");

            if (detalhe.distribuicaoPorMovimento && detalhe.distribuicaoPorMovimento.length > 0) {
                sec.style.display = "";
                grid.innerHTML = detalhe.distribuicaoPorMovimento.map(d => `
                    <div class="inst-stat-card">
                        <span class="inst-stat-label">${d.tipoMovimento}</span>
                        <span class="inst-stat-valor">${fmtBRL(d.valorTotal)}</span>
                    </div>
                `).join("");
            } else {
                sec.style.display = "none";
            }
        } catch (e) {
            console.warn("Erro ao carregar detalhe:", e);
        }
    }

    function carregarPoupancasInstituicao(instUsuarioId) {
        const lista   = _caixinhas.filter(c => {
            if (!c.instituicoes) return false;
            return c.instituicoes.some(i => i.id === instUsuarioId);
        });

        const listaEl   = document.getElementById("poupancaLista");
        const vazioEl   = document.getElementById("poupancaVazio");
        const qtdEl     = document.getElementById("poupQtd");
        const valorEl   = document.getElementById("poupValor");
        const metaEl    = document.getElementById("poupMeta");

        const totalValor = lista.reduce((a, c) => a + (Number(c.valorAtual) || 0), 0);
        const totalMeta  = lista.reduce((a, c) => a + (Number(c.valorMeta)  || 0), 0);

        qtdEl.textContent  = lista.length;
        valorEl.textContent = fmtBRL(totalValor);
        metaEl.textContent  = fmtBRL(totalMeta);

        if (lista.length === 0) {
            listaEl.innerHTML  = "";
            vazioEl.style.display = "flex";
        } else {
            vazioEl.style.display = "none";
            listaEl.innerHTML = lista.map(c => {
                const pct     = Math.min(c.percentualAtingido || 0, 100).toFixed(1);
                const corBrr  = pct >= 100 ? "var(--cor-principal)" : pct > 60 ? "#f59e0b" : "var(--cor-principal)";
                return `
                <div class="inst-poupanca-item">
                    <div class="inst-poupanca-header">
                        <span class="inst-poupanca-nome">${c.nome}</span>
                        <span class="inst-poupanca-valor">${fmtBRL(c.valorAtual)}</span>
                    </div>
                    <div class="inst-poupanca-meta">Meta: ${fmtBRL(c.valorMeta)}</div>
                    <div class="inst-progress-track" style="margin-top:6px;">
                        <div class="inst-progress-fill"
                             style="width:${pct}%; background:${corBrr};"></div>
                    </div>
                    <div style="font-size:0.72rem; color:var(--cor-texto-secundario); margin-top:3px;">
                        ${pct}% atingido${c.mesesRestantes != null ? ` · ${c.mesesRestantes} meses restantes` : ""}
                    </div>
                </div>`;
            }).join("");
        }
    }

    window.trocarAba = function (nomAba) {
        document.querySelectorAll(".inst-tab").forEach(btn => {
            btn.classList.toggle("ativo", btn.dataset.tab === nomAba);
        });
        document.querySelectorAll(".inst-tab-panel").forEach(panel => {
            panel.classList.toggle("ativo", panel.id === `tab-${nomAba}`);
        });
        // Lazy load da aba de parcelamentos
        if (nomAba === "parcelamentos" && _instAtual) {
            carregarParcelamentos(_instAtual.instUsuarioId);
        }
        // Lazy load da aba de recorrentes
        if (nomAba === "recorrentes" && _instAtual) {
            carregarRecorrentes(_instAtual.instUsuarioId);
        }
    };

    window.fecharModalInstituicao = function (event) {
        if (event && event.target !== document.getElementById("instModalOverlay")) return;
        _fecharModal();
    };

    window.fecharModalInstituicaoBtn = function () {
        _fecharModal();
    };

    function _fecharModal() {
        const overlay = document.getElementById("instModalOverlay");
        if (overlay) overlay.style.display = "none";
        document.body.style.overflow = "";
        _instAtual = null;
    }

    /* ── Fechar com ESC ────────────────────────────────────── */
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") _fecharModal();
    });

    /* ══════════════════════════════════════════════════════════
       ABA PARCELAMENTOS
    ══════════════════════════════════════════════════════════ */
    let _parcelamentosCarregados = false;

    async function carregarParcelamentos(instUsuarioId) {
        if (_parcelamentosCarregados) return;
        _parcelamentosCarregados = true;

        const loadEl   = document.getElementById("parcelamentosLoading");
        const listaEl  = document.getElementById("parcelamentosLista");
        const vazioEl  = document.getElementById("parcelamentosVazio");
        const resumoEl = document.getElementById("parcelamentosResumo");

        if (loadEl)  loadEl.style.display  = "flex";
        if (listaEl) listaEl.innerHTML     = "";
        if (vazioEl) vazioEl.style.display = "none";
        if (resumoEl) resumoEl.innerHTML   = "";

        try {
            const res = await MainAPI.request(
                `/registros/filtro/usuarios/${_userId}?tipo=Gasto`,
                { method: "GET" }
            );

            if (loadEl) loadEl.style.display = "none";

            if (!res.ok || res.status === 204) {
                if (vazioEl) vazioEl.style.display = "flex";
                return;
            }

            const registros = await res.json();
            if (!Array.isArray(registros) || registros.length === 0) {
                if (vazioEl) vazioEl.style.display = "flex";
                return;
            }

            // Filtra apenas eventos associados a ESTA instituição E com múltiplas EIs (parcelados)
            const parcs = [];
            registros.forEach(r => {
                const eis = r.eventoInstituicao || [];
                // Filtra EIs desta instituição usando instUsuarioId
                const eisDaInst = eis.filter(e => e.instUsuarioId === instUsuarioId);
                if (eisDaInst.length === 0) return;

                // Total de parcelas = número total de EIs desta instituição neste evento
                const totalParcelas = eisDaInst.length > 1
                    ? eisDaInst.length
                    : Math.max(...eis.map(e => e.parcelas || 1));

                if (totalParcelas > 1) {
                    parcs.push({ registro: r, totalParcelas, ei: eisDaInst[0] });
                }
            });

            if (parcs.length === 0) {
                if (vazioEl) vazioEl.style.display = "flex";
                return;
            }

            // Calcula resumo
            const hoje = new Date();
            const ativos = parcs.filter(p => {
                const dataEvt = parseDateField(p.registro.eventoFinanceiro?.dataEvento);
                if (!dataEvt) return false;
                const fim = new Date(dataEvt);
                fim.setMonth(fim.getMonth() + p.totalParcelas);
                return fim >= hoje;
            }).length;

            if (resumoEl) {
                resumoEl.innerHTML = `
                <div class="inst-poupanca-resumo" style="margin-bottom:16px;">
                    <div class="inst-stat-card">
                        <span class="inst-stat-label">Total</span>
                        <span class="inst-stat-valor">${parcs.length}</span>
                    </div>
                    <div class="inst-stat-card">
                        <span class="inst-stat-label">Ativos</span>
                        <span class="inst-stat-valor" style="color:var(--cor-principal);">${ativos}</span>
                    </div>
                    <div class="inst-stat-card">
                        <span class="inst-stat-label">Encerrados</span>
                        <span class="inst-stat-valor">${parcs.length - ativos}</span>
                    </div>
                </div>`;
            }

            if (listaEl) {
                listaEl.innerHTML = parcs.map(p => buildParcelamentoItemHTML(p)).join("");
                listaEl.querySelectorAll("[data-del-evento]").forEach(btn => {
                    btn.addEventListener("click", () => {
                        const id = btn.dataset.delEvento;
                        deletarParcelamento(id, btn.closest(".inst-parc-item"));
                    });
                });
            }

        } catch (e) {
            console.error("Erro ao carregar parcelamentos:", e);
            if (loadEl) loadEl.style.display = "none";
            if (vazioEl) vazioEl.style.display = "flex";
        }
    }

    /** Converte dataEvento (array ou string) em Date */
    function parseDateField(raw) {
        if (!raw) return null;
        if (Array.isArray(raw) && raw.length >= 3) {
            return new Date(raw[0], raw[1] - 1, raw[2]);
        }
        if (typeof raw === "string") return new Date(raw);
        return null;
    }

    function buildParcelamentoItemHTML({ registro, ei, totalParcelas }) {
        const ef     = registro.eventoFinanceiro || {};
        const titulo = registro.gastoDetalhe?.tituloGasto || ef.descricao || "Sem título";
        const dataEvt = parseDateField(ef.dataEvento);
        let dataFmt = "–";
        let isAtivo = false;

        const numParcelas = totalParcelas || ei.parcelas || 1;

        if (dataEvt) {
            const dia = String(dataEvt.getDate()).padStart(2, "0");
            const mes = String(dataEvt.getMonth() + 1).padStart(2, "0");
            const ano = dataEvt.getFullYear();
            dataFmt = `${dia}/${mes}/${ano}`;
            const fim = new Date(dataEvt);
            fim.setMonth(fim.getMonth() + numParcelas);
            isAtivo = fim >= new Date();
        }

        // Valor total = soma de todos os EIs, ou valor do EI x numParcelas
        const eis = registro.eventoInstituicao || [];
        const valorTotal = eis.length > 1
            ? eis.reduce((s, e) => s + (Number(e.valor) || 0), 0)
            : (Number(ei.valor) || 0) * numParcelas;
        const valorParcela  = numParcelas > 0 ? valorTotal / numParcelas : valorTotal;
        const statusCls     = isAtivo ? "verde" : "";
        const statusTxt     = isAtivo ? "Ativo" : "Encerrado";
        const badgeCls      = isAtivo ? "ativo" : "encerrado";

        return `
        <div class="inst-parc-item">
            <div class="inst-parc-info">
                <span class="inst-parc-titulo">${titulo}</span>
                <span class="inst-parc-data">${dataFmt}</span>
            </div>
            <div class="inst-parc-valores">
                <span class="inst-stat-valor ${statusCls}">${fmtBRL(valorTotal)}</span>
                <span class="inst-parc-parcelas">${numParcelas}x de ${fmtBRL(valorParcela)}</span>
            </div>
            <div class="inst-parc-actions">
                <span class="inst-parc-badge ${badgeCls}">${statusTxt}</span>
                <button class="inst-parc-del-btn" data-del-evento="${ef.id}" title="Excluir parcelamento">
                    <i class='bx bx-trash'></i>
                </button>
            </div>
        </div>`;
    }

    async function deletarParcelamento(eventoId, itemEl) {
        if (!confirm("Tem certeza que deseja excluir este parcelamento? Todos os dados serão removidos.")) return;
        try {
            const res = await MainAPI.request(`/registros/${eventoId}`, { method: "DELETE" });
            if (res.ok || res.status === 204) {
                if (itemEl) {
                    itemEl.style.animation = "inst-parc-fade-out 0.3s forwards";
                    setTimeout(() => {
                        itemEl.remove();
                        // Atualiza lista e KPIs
                        _parcelamentosCarregados = false;
                        carregarInstituicoes();
                        carregarParcelamentos(_instAtual?.instUsuarioId);
                    }, 300);
                }
            } else {
                alert("Erro ao excluir parcelamento. Tente novamente.");
            }
        } catch (e) {
            alert("Erro de conexão ao excluir.");
        }
    }

    /* ══════════════════════════════════════════════════════════
       ABA RECORRENTES
    ══════════════════════════════════════════════════════════ */
    let _recorrentesCarregados = false;

    async function carregarRecorrentes(instUsuarioId) {
        if (_recorrentesCarregados) return;
        _recorrentesCarregados = true;

        const painel = document.getElementById("tab-recorrentes");
        if (!painel) return;

        painel.innerHTML = `
            <div class="inst-loading" style="display:flex;">
                <i class='bx bx-loader-alt bx-spin'></i> Carregando recorrentes...
            </div>`;

        try {
            const res = await MainAPI.request(
                `/registros/recorrentes/instituicoes/${instUsuarioId}`,
                { method: "GET" }
            );

            if (!res.ok || res.status === 204) {
                painel.innerHTML = buildRecorrentesVazio();
                return;
            }

            const lista = await res.json();
            if (!Array.isArray(lista) || lista.length === 0) {
                painel.innerHTML = buildRecorrentesVazio();
                return;
            }

            painel.innerHTML = `
                <p class="kpi-label" style="margin-bottom:12px;">Eventos Recorrentes desta Instituição</p>
                <div class="inst-rec-lista" id="recLista">
                    ${lista.map(r => buildRecorrenteItemHTML(r)).join("")}
                </div>`;

            painel.querySelectorAll("[data-del-rec]").forEach(btn => {
                btn.addEventListener("click", () => {
                    const id = btn.dataset.delRec;
                    deletarRecorrente(id, btn.closest(".inst-rec-item"), instUsuarioId);
                });
            });

        } catch (e) {
            console.error("Erro ao carregar recorrentes:", e);
            painel.innerHTML = buildRecorrentesVazio();
        }
    }

    function buildRecorrentesVazio() {
        return `
        <div class="inst-vazio" style="display:flex; flex-direction:column; align-items:center; gap:12px; padding:32px 0;">
            <i class='bx bx-repeat' style="font-size:2.5rem; color:var(--cor-texto-secundario);"></i>
            <h3>Nenhum evento recorrente</h3>
            <p style="color:var(--cor-texto-secundario);">Nenhuma recorrência vinculada a esta instituição.</p>
            <a href="adicionarRegistros.html" class="inst-btn-recorrente">
                <i class='bx bx-plus-circle'></i> Criar Evento Recorrente
            </a>
        </div>`;
    }

    function buildRecorrenteItemHTML(r) {
        const PERIODOS = {
            Diario: 'Diário', Semanal: 'Semanal', Mensal: 'Mensal', Anual: 'Anual'
        };
        const TIPOS_LABEL = {
            Gasto: '🔴 Gasto', Recebimento: '🟢 Recebimento'
        };
        const per = PERIODOS[r.periodicidade] || r.periodicidade || '–';
        const tipo = TIPOS_LABEL[r.tipo] || r.tipo || '–';
        const dataInicio = r.dataInicio ? new Date(r.dataInicio).toLocaleDateString('pt-BR') : '–';
        const dataFim    = r.dataFim    ? new Date(r.dataFim).toLocaleDateString('pt-BR')    : '–';
        const valor      = r.valor != null ? fmtBRL(r.valor) : '–';
        const descricao  = r.descricao || '';

        return `
        <div class="inst-rec-item" style="background:var(--cor-fundo-card);border:1px solid var(--cor-tinte-borda);border-radius:12px;padding:14px 16px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
            <div style="flex:1;min-width:0;">
                <div style="font-weight:700;font-size:0.97rem;margin-bottom:4px;">${descricao || tipo}</div>
                <div style="font-size:0.83rem;color:var(--cor-texto-secundario);">
                    ${tipo} · ${per} · ${valor}
                </div>
                <div style="font-size:0.8rem;color:var(--cor-texto-secundario);margin-top:3px;">
                    ${dataInicio} → ${dataFim}
                </div>
            </div>
            <button class="inst-parc-del-btn" data-del-rec="${r.id}" title="Excluir recorrência">
                <i class='bx bx-trash'></i>
            </button>
        </div>`;
    }

    async function deletarRecorrente(recorrenciaId, itemEl, instUsuarioId) {
        if (!confirm("Excluir esta recorrência? Os eventos futuros vinculados serão removidos.")) return;
        try {
            const res = await MainAPI.request(
                `/registros/recorrentes/${recorrenciaId}`,
                { method: "DELETE" }
            );
            if (res.ok || res.status === 204) {
                if (itemEl) itemEl.remove();
                _recorrentesCarregados = false;
                carregarRecorrentes(instUsuarioId);
            } else {
                alert("Erro ao excluir recorrência. Tente novamente.");
            }
        } catch (e) {
            alert("Erro de conexão ao excluir.");
        }
    }

    /* ══════════════════════════════════════════════════════════
       PAGAMENTO DE FATURA
    ══════════════════════════════════════════════════════════ */
    window.pagarFaturaInstituicao = async function () {
        if (!_instAtual) return;

        const inputValor = document.getElementById("inputValorFatura");
        const feedback   = document.getElementById("faturaFeedback");
        const btnPagar   = document.getElementById("btnPagarFatura");

        const valor = window.MainAPI ? window.MainAPI.obterValorMoeda(inputValor) : Number(inputValor?.value);
        if (!valor || valor <= 0) {
            if (feedback) { feedback.textContent = "Informe um valor válido."; feedback.className = "inst-feedback erro"; feedback.style.display = "block"; }
            return;
        }

        if (btnPagar) { btnPagar.disabled = true; btnPagar.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Pagando..."; }

        try {
            const res = await MainAPI.request(
                `/instituicoes/${_instAtual.instUsuarioId}/pagar-fatura`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ valor })
                }
            );

            if (res.ok) {
                if (feedback) { feedback.textContent = "✔ Pagamento registrado com sucesso!"; feedback.className = "inst-feedback sucesso"; feedback.style.display = "block"; }
                // Recarrega dados
                await carregarInstituicoes();
                const novo = _resumoList.find(r => r.instUsuarioId === _instAtual.instUsuarioId);
                if (novo) {
                    _instAtual = novo;
                    const badge = document.getElementById("instModalBadge");
                    const pct = novo.percentualCreditoUtilizado || 0;
                    if (badge) { badge.textContent = `${pct}% crédito usado`; badge.className = "inst-modal-badge" + (pct > 80 ? " vermelho" : pct > 50 ? " amarelo" : ""); }
                }
            } else {
                const msg = await res.text().catch(() => "Erro ao processar pagamento.");
                if (feedback) { feedback.textContent = `✘ ${msg}`; feedback.className = "inst-feedback erro"; feedback.style.display = "block"; }
            }
        } catch (e) {
            if (feedback) { feedback.textContent = "✘ Erro de conexão."; feedback.className = "inst-feedback erro"; feedback.style.display = "block"; }
        } finally {
            if (btnPagar) { btnPagar.disabled = false; btnPagar.innerHTML = "<i class='bx bx-credit-card'></i> Pagar Fatura"; }
        }
    };

    /* ══════════════════════════════════════════════════════════
       SALVAR CONFIGURAÇÃO
    ══════���═══════════════════════════════════════════════════ */
    window.salvarConfiguracaoInstituicao = async function () {
        if (!_instAtual) return;

        const btnSalvar = document.getElementById("btnSalvarConfig");
        const feedback  = document.getElementById("configFeedback");
        const taxaInput = document.getElementById("inputTaxaJuros");

        const limiteCredito = MainAPI.obterValorMoeda(_inputLimiteCredito);
        const taxaJuros     = taxaInput && taxaInput.value !== "" ? parseFloat(taxaInput.value) : null;

        btnSalvar.disabled = true;
        btnSalvar.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Salvando...";

        try {
            const payload = {};
            if (limiteCredito > 0) payload.limiteCredito = limiteCredito;
            if (taxaJuros !== null && !isNaN(taxaJuros)) payload.taxaJuros = taxaJuros;

            const res = await MainAPI.request(
                `/instituicoes/${_instAtual.instUsuarioId}/configurar`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                }
            );

            if (res.ok) {
                exibirFeedback(feedback, "✔ Configurações salvas com sucesso!", "sucesso");
                await carregarInstituicoes();
                const novo = _resumoList.find(r => r.instUsuarioId === _instAtual.instUsuarioId);
                if (novo) _instAtual = novo;
            } else {
                const msg = await res.text().catch(() => "Erro ao salvar.");
                exibirFeedback(feedback, `✘ ${msg}`, "erro");
            }
        } catch (e) {
            exibirFeedback(feedback, "✘ Erro de conexão.", "erro");
        } finally {
            btnSalvar.disabled = false;
            btnSalvar.innerHTML = "<i class='bx bx-save'></i> Salvar Configurações";
        }
    };

    function exibirFeedback(el, msg, tipo) {
        if (!el) return;
        el.textContent = msg;
        el.className   = `inst-feedback ${tipo}`;
        el.style.display = "block";
        setTimeout(() => { el.style.display = "none"; }, 4000);
    }

    /* ══════════════════════════════════════════════════════════
       CARREGAMENTO PRINCIPAL
    ══════════════════════════════════════════════════════════ */
    window.carregarInstituicoes = async function () {
        if (!_userId) return;

        atualizarLabelPeriodo();

        const loading = document.getElementById("loadingInstituicoes");
        const grid    = document.getElementById("instituicoesGrid");
        if (loading) loading.style.display = "flex";
        if (grid) grid.innerHTML = "";

        try {
            const p   = periodoAtual();
            const url = `/instituicoes/resumo/usuarios/${_userId}?${buildPeriodoParams(p)}`;
            const res = await MainAPI.request(url, { method: "GET" });

            if (res.status === 204 || !res.ok) {
                _resumoList = [];
            } else {
                _resumoList = await res.json();
            }

            calcularEExibirKPIs(_resumoList);
            renderizarCards(_resumoList);
        } catch (e) {
            console.error("Erro ao carregar instituições:", e);
            if (loading) loading.style.display = "none";
        }
    };

    async function carregarCaixinhas() {
        if (!_userId) return;
        try {
            _caixinhas = await MainAPI.getCaixinhas(_userId);
        } catch (e) {
            _caixinhas = [];
            console.warn("Erro ao carregar caixinhas:", e);
        }
    }

    /* ══════════════════════════════════════════════════════════
       INICIALIZAÇÃO
    ══════════════════════════════════════════════════════════ */
    window.iniciarPagina = async function () {
        const usuario = JSON.parse(localStorage.getItem("usuarioLogado") || "null");
        if (!usuario || !usuario.id) {
            window.location.href = "index.html";
            return;
        }
        _userId = usuario.id;

        // Aplica tema salvo
        const temaSalvo = localStorage.getItem("tema");
        const modoSalvo = localStorage.getItem("modo");
        if (temaSalvo) document.body.setAttribute("data-tema", temaSalvo);
        if (modoSalvo === "dark") document.body.setAttribute("data-mode", "dark");

        inicializarPeriodo();

        await Promise.all([
            carregarInstituicoes(),
            carregarCaixinhas()
        ]);
    };

})();


