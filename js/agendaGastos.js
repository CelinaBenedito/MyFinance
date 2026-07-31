(function () {
    const MESES = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

    const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado") || "null");
    const userId = usuarioLogado ? usuarioLogado.id : null;

    let hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    let anoAtual = hoje.getFullYear();
    let mesAtual = hoje.getMonth();

    let eventosPorDia = {};

    // ── Classificação ────────────────────────────────────────────
    function classificar(registro) {
        const tipo = (registro.eventoFinanceiro && registro.eventoFinanceiro.tipo
            ? registro.eventoFinanceiro.tipo : "").toLowerCase();
        const dataEvento = registro.eventoFinanceiro && registro.eventoFinanceiro.dataEvento
            ? new Date(registro.eventoFinanceiro.dataEvento + "T00:00:00") : null;

        if (tipo === "transferencia")  return "transferencia";
        if (tipo === "recebimento")    return "recebimento";
        if (tipo === "poupanca")       return "poupanca";
        if (tipo === "emprestimo")     return "emprestimo";
        if (tipo === "gasto") {
            if (dataEvento && dataEvento > hoje) return "agendamento";
            return "gasto";
        }
        return "gasto";
    }

    function toLocalDateKey(iso) { return iso.substring(0, 10); }

    // ── Carregar eventos ─────────────────────────────────────────
    function carregarEventos() {
        if (!userId) { renderizarCalendario(); return Promise.resolve(); }
        return MainAPI.carregarRegistros(userId)
            .then(registros => {
                eventosPorDia = {};
                registros.forEach(r => {
                    const dataISO = r.eventoFinanceiro && r.eventoFinanceiro.dataEvento;
                    if (!dataISO) return;
                    const key = toLocalDateKey(dataISO);
                    if (!eventosPorDia[key]) eventosPorDia[key] = [];
                    eventosPorDia[key].push(r);
                });
                renderizarCalendario();
            })
            .catch(() => renderizarCalendario());
    }

    // ── Renderizar calendário ────────────────────────────────────
    function renderizarCalendario() {
        const grid = document.getElementById("calGrid");
        document.getElementById("mesNome").textContent = MESES[mesAtual] + " " + anoAtual;
        grid.innerHTML = "";

        const primeiroDia  = new Date(anoAtual, mesAtual, 1).getDay();
        const diasNoMes    = new Date(anoAtual, mesAtual + 1, 0).getDate();
        const todayKey     = anoAtual + "-" + String(mesAtual + 1).padStart(2, "0") + "-" + String(hoje.getDate()).padStart(2, "0");

        for (let i = 0; i < primeiroDia; i++) {
            const v = document.createElement("div");
            v.className = "ag-day ag-empty";
            grid.appendChild(v);
        }

        for (let dia = 1; dia <= diasNoMes; dia++) {
            const key  = anoAtual + "-" + String(mesAtual + 1).padStart(2, "0") + "-" + String(dia).padStart(2, "0");
            const cell = document.createElement("div");
            cell.className = "ag-day";
            if (key === todayKey) cell.classList.add("ag-today");
            cell.dataset.key = key;

            const numEl = document.createElement("div");
            numEl.className = "ag-day-num";
            numEl.textContent = dia;
            cell.appendChild(numEl);

            const eventos = eventosPorDia[key] || [];
            if (eventos.length > 0) {
                const dotsEl = document.createElement("div");
                dotsEl.className = "ag-dots";
                const tiposVistos = new Set();
                eventos.forEach(r => {
                    const tipo = classificar(r);
                    if (!tiposVistos.has(tipo)) {
                        tiposVistos.add(tipo);
                        const dot = document.createElement("div");
                        dot.className = "ag-dot ag-dot-" + tipo;
                        dotsEl.appendChild(dot);
                    }
                });
                cell.appendChild(dotsEl);
            }

            cell.addEventListener("click", (function(k, d) {
                return function() { selecionarDia(k, d); };
            })(key, dia));
            grid.appendChild(cell);
        }
    }

    // ── Selecionar dia → abrir modal ─────────────────────────────
    function selecionarDia(key, dia) {
        // Marcar no calendário
        document.querySelectorAll(".ag-day.ag-selected").forEach(el => el.classList.remove("ag-selected"));
        const cell = document.querySelector(".ag-day[data-key='" + key + "']");
        if (cell) cell.classList.add("ag-selected");

        // Também atualizar painel lateral (mantido para visão mensal)
        const empty    = document.getElementById("resumoEmpty");
        const conteudo = document.getElementById("resumoConteudo");
        const eventos  = eventosPorDia[key] || [];

        conteudo.innerHTML = "";
        if (eventos.length === 0) {
            empty.style.display = "";
            empty.textContent   = "Nenhum evento neste dia.";
        } else {
            empty.style.display = "none";
            const partes = key.split("-");
            const dh = document.createElement("div");
            dh.className = "ag-resumo-data";
            dh.textContent = partes[2] + "/" + partes[1] + "/" + partes[0];
            conteudo.appendChild(dh);
            eventos.forEach(r => {
                const tipo = classificar(r);
                const titulo = r.gastoDetalhe ? r.gastoDetalhe.tituloGasto : "-";
                const valor  = r.eventoFinanceiro ? (r.eventoFinanceiro.valor || 0) : 0;
                const chip = document.createElement("div");
                chip.className = "ag-evento " + tipo;
                const prefix = tipo === "recebimento" ? "+" : tipo === "transferencia" ? "↔" : "-";
                chip.innerHTML = '<span class="ag-evento-titulo">' + titulo + '</span>'
                    + '<span class="ag-evento-valor">' + prefix + fmt.format(Math.abs(valor)) + '</span>';
                conteudo.appendChild(chip);
            });
        }

        // Abrir modal detalhado se houver eventos
        if (eventos.length > 0) abrirModalDia(key, eventos);
    }

    // ── Modal de detalhes do dia ──────────────────────────────────
    const GRUPOS = [
        { tipo: "recebimento",  label: "Recebimentos",   icon: "bx-trending-up",    sinal:  1 },
        { tipo: "gasto",        label: "Gastos",          icon: "bx-trending-down",  sinal: -1 },
        { tipo: "transferencia",label: "Transferências",  icon: "bx-transfer",       sinal:  0 },
        { tipo: "poupanca",     label: "Poupança",        icon: "bx-piggy-bank",     sinal: -1 },
        { tipo: "emprestimo",   label: "Empréstimos",     icon: "bx-money",          sinal:  0 },
        { tipo: "agendamento",  label: "Agendamentos",    icon: "bx-calendar-check", sinal: -1 }
    ];

    function abrirModalDia(key, eventos) {
        const partes  = key.split("-");
        const dataFmt = partes[2] + "/" + partes[1] + "/" + partes[0];
        document.getElementById("agDiaModalTitulo").textContent = "Eventos de " + dataFmt;

        const body = document.getElementById("agDiaModalBody");
        body.innerHTML = "";

        let saldo = 0;

        GRUPOS.forEach(grupo => {
            const lista = eventos.filter(r => classificar(r) === grupo.tipo);
            if (lista.length === 0) return;

            const total = lista.reduce((s, r) => s + (r.eventoFinanceiro ? (r.eventoFinanceiro.valor || 0) : 0), 0);
            if (grupo.sinal !== 0) saldo += grupo.sinal * total;

            // Seção
            const secao = document.createElement("div");
            secao.className = "ag-modal-secao";

            const header = document.createElement("div");
            header.className = "ag-modal-secao-header ag-secao-" + grupo.tipo;
            header.innerHTML = `<i class='bx ${grupo.icon}'></i><span>${grupo.label}</span>`;
            secao.appendChild(header);

            const tabela = document.createElement("div");
            tabela.className = "ag-modal-tabela";

            lista.forEach(r => {
                const titulo = r.gastoDetalhe ? r.gastoDetalhe.tituloGasto : "-";
                const valor  = r.eventoFinanceiro ? (r.eventoFinanceiro.valor || 0) : 0;
                const linha  = document.createElement("div");
                linha.className = "ag-modal-linha";
                linha.innerHTML = `<span class="ag-modal-linha-titulo">${escHtml(titulo)}</span>`
                    + `<span class="ag-modal-linha-valor ag-val-${grupo.tipo}">${fmt.format(Math.abs(valor))}</span>`;
                tabela.appendChild(linha);
            });

            // Subtotal
            const subtotal = document.createElement("div");
            subtotal.className = "ag-modal-subtotal";
            subtotal.innerHTML = `<span>Total ${grupo.label}</span><span class="ag-val-${grupo.tipo}">${fmt.format(total)}</span>`;
            tabela.appendChild(subtotal);

            secao.appendChild(tabela);
            body.appendChild(secao);
        });

        // Saldo final
        const saldoEl = document.getElementById("agDiaSaldo");
        saldoEl.textContent = fmt.format(saldo);
        saldoEl.className = "ag-dia-saldo-valor " + (saldo >= 0 ? "ag-saldo-positivo" : "ag-saldo-negativo");

        document.getElementById("agDiaModalOverlay").classList.add("aberto");
    }

    window.fecharModalDia = function(e) {
        if (e && e.target !== document.getElementById("agDiaModalOverlay")) return;
        document.getElementById("agDiaModalOverlay").classList.remove("aberto");
    };

    function escHtml(str) {
        return String(str || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    }

    // ── Visão mensal (painel lateral) ────────────────────────────
    function mostrarMesCompleto() {
        const empty    = document.getElementById("resumoEmpty");
        const conteudo = document.getElementById("resumoConteudo");
        conteudo.innerHTML = "";

        const prefixo = anoAtual + "-" + String(mesAtual + 1).padStart(2, "0") + "-";
        const chaves  = Object.keys(eventosPorDia).filter(k => k.startsWith(prefixo)).sort();

        if (chaves.length === 0) {
            empty.style.display = "";
            empty.textContent   = "Nenhum evento neste mês.";
            return;
        }
        empty.style.display = "none";

        chaves.forEach(key => {
            const partes = key.split("-");
            const dh = document.createElement("div");
            dh.className = "ag-resumo-data";
            dh.textContent = partes[2] + "/" + partes[1] + "/" + partes[0];
            conteudo.appendChild(dh);

            eventosPorDia[key].forEach(r => {
                const tipo  = classificar(r);
                const titulo = r.gastoDetalhe ? r.gastoDetalhe.tituloGasto : "-";
                const valor  = r.eventoFinanceiro ? (r.eventoFinanceiro.valor || 0) : 0;
                const chip   = document.createElement("div");
                chip.className = "ag-evento " + tipo;
                const prefix = tipo === "recebimento" ? "+" : tipo === "transferencia" ? "↔" : "-";
                chip.innerHTML = '<span class="ag-evento-titulo">' + titulo + '</span>'
                    + '<span class="ag-evento-valor">' + prefix + fmt.format(Math.abs(valor)) + '</span>';
                conteudo.appendChild(chip);
            });
        });
    }

    document.getElementById("btnPrevMes").addEventListener("click", function() {
        mesAtual--;
        if (mesAtual < 0) { mesAtual = 11; anoAtual--; }
        renderizarCalendario();
        mostrarMesCompleto();
    });

    document.getElementById("btnNextMes").addEventListener("click", function() {
        mesAtual++;
        if (mesAtual > 11) { mesAtual = 0; anoAtual++; }
        renderizarCalendario();
        mostrarMesCompleto();
    });

    carregarEventos().then(function() { mostrarMesCompleto(); });

})();