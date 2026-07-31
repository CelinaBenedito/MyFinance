(function () {
    const LOCAL_API = "http://localhost:8080";

    function buildUrl(path) {
        if (/^https?:\/\//i.test(path)) {
            return path;
        }
        return `${LOCAL_API}${path}`;
    }

    function request(path, options) {
        return fetch(buildUrl(path), options);
    }

    function get(path) {
        return request(path, { method: "GET" }).then(res => res.json());
    }

    function postJson(path, payload) {
        return request(path, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
    }

    function chaveImagemLocal(userId) {
        return userId ? `usuarioImagemLocal:${userId}` : null;
    }

    function formatarLocalDateTime(valor, vazio = "-") {
        if (!valor) return vazio;

        if (Array.isArray(valor) && valor.length >= 5) {
            const [ano, mes, dia, hora = 0, min = 0] = valor;
            return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano} ${String(hora).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
        }

        if (typeof valor === "string") {
            const dt = new Date(valor);
            if (!isNaN(dt.getTime())) {
                const d = String(dt.getDate()).padStart(2, "0");
                const m = String(dt.getMonth() + 1).padStart(2, "0");
                const y = dt.getFullYear();
                const h = String(dt.getHours()).padStart(2, "0");
                const mi = String(dt.getMinutes()).padStart(2, "0");
                return `${d}/${m}/${y} ${h}:${mi}`;
            }
        }

        if (typeof valor === "object") {
            const ano = valor.year ?? valor.ano;
            const mes = valor.monthValue ?? valor.mes;
            const dia = valor.dayOfMonth ?? valor.dia;
            const hora = valor.hour ?? valor.hora ?? 0;
            const min = valor.minute ?? valor.minuto ?? 0;
            if (ano && mes && dia) {
                return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano} ${String(hora).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
            }
        }

        return vazio;
    }

    // ── MÁSCARA DE DATA (dd/mm/aaaa) ──────────────────────────────
    function aplicarMascaraData(input) {
        input.setAttribute("type", "text");
        input.setAttribute("placeholder", "dd/mm/aaaa");
        input.setAttribute("maxlength", "10");
        input.setAttribute("inputmode", "numeric");

        input.addEventListener("input", function () {
            const pos = this.selectionStart;
            let v = this.value.replace(/\D/g, "").slice(0, 8);
            let r = "";
            if (v.length > 0) r = v.slice(0, 2);
            if (v.length > 2) r += "/" + v.slice(2, 4);
            if (v.length > 4) r += "/" + v.slice(4, 8);
            this.value = r;
        });

        input.addEventListener("keydown", function (e) {
            // Backspace: se o cursor está após uma barra, apaga a barra junto
            if (e.key === "Backspace") {
                const cur = this.selectionStart;
                if (cur > 0 && this.value[cur - 1] === "/") {
                    this.value = this.value.slice(0, cur - 1) + this.value.slice(cur);
                    this.setSelectionRange(cur - 1, cur - 1);
                    e.preventDefault();
                }
            }
        });
    }

    function dataParaISO(dataBR) {
        // "dd/mm/aaaa" → "aaaa-mm-dd"
        const m = (dataBR || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (!m) return null;
        return `${m[3]}-${m[2]}-${m[1]}`;
    }

    function dataDeISO(dataISO) {
        // "aaaa-mm-dd" → "dd/mm/aaaa"
        const m = (dataISO || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!m) return dataISO;
        return `${m[3]}/${m[2]}/${m[1]}`;
    }

    // ── MÁSCARA MONETÁRIA (estilo caixa registradora) ─────────────
    function aplicarMascaraMoeda(input) {
        input.setAttribute("type", "text");
        input.setAttribute("inputmode", "numeric");
        input.setAttribute("autocomplete", "off");

        // Armazena o valor em centavos
        input.dataset.centavos = "0";

        function _formatar(cents) {
            // Formata sem toLocaleString (compatibilidade JavaFX)
            var reais = Math.floor(cents / 100);
            var centsStr = String(cents % 100).padStart(2, "0");
            var reaisStr = String(reais).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            return "R$ " + reaisStr + "," + centsStr;
        }

        function _atualizar() {
            input.value = _formatar(Number(input.dataset.centavos || 0));
        }

        _atualizar();

        input.addEventListener("keydown", function (e) {
            var centavos = Number(input.dataset.centavos || 0);

            // Normaliza e.key — fallback para e.keyCode (JavaFX WebView pode não ter e.key)
            var key = e.key;
            if (!key || key === "Unidentified") {
                var kc = e.keyCode || e.which || 0;
                if (kc >= 48 && kc <= 57)       key = String(kc - 48);   // 0-9
                else if (kc >= 96 && kc <= 105) key = String(kc - 96);   // Numpad 0-9
                else if (kc === 8)              key = "Backspace";
                else if (kc === 46)             key = "Delete";
                else if (kc === 27)             key = "Escape";
            }
            var isDigit = key && key.length === 1 && key >= "0" && key <= "9";

            if (isDigit) {
                e.preventDefault();
                if (centavos >= 999999999) return;
                centavos = centavos * 10 + parseInt(key, 10);
                input.dataset.centavos = String(centavos);
                _atualizar();

            } else if (key === "Backspace") {
                e.preventDefault();
                centavos = Math.floor(centavos / 10);
                input.dataset.centavos = String(centavos);
                _atualizar();

            } else if (key === "Delete" || key === "Escape") {
                e.preventDefault();
                input.dataset.centavos = "0";
                _atualizar();
            }
        });

        // Impede edição manual direta (paste, drag, etc.)
        input.addEventListener("paste", function (e) {
            e.preventDefault();
            var texto = (e.clipboardData || window.clipboardData || { getData: function () { return ""; } }).getData("text");
            // Extrai apenas dígitos
            var digitos = texto.replace(/\D/g, "").replace(/^0+/, "") || "0";
            input.dataset.centavos = String(Math.min(Number(digitos), 999999999));
            _atualizar();
        });

        // Garante que um clique no campo posicione o cursor no final
        input.addEventListener("click", function () {
            var len = input.value.length;
            input.setSelectionRange(len, len);
        });

        // Previne seleção e edição de trechos do valor
        input.addEventListener("input", function () {
            _atualizar();
        });
    }

    function obterValorMoeda(input) {
        return Number(input.dataset.centavos || 0) / 100;
    }

    function resetarMascaraMoeda(input) {
        input.dataset.centavos = "0";
        var reaisStr = "0";
        input.value = "R$ " + reaisStr + ",00";
    }

    // ── PAGINAÇÃO: busca todas as páginas de um endpoint paginado ──
    async function fetchTodasPaginas(path) {
        const allContent = [];
        let pagina = 0;
        let isLast = false;
        const LIMITE_PAGINAS = 100; // segurança

        while (!isLast && pagina < LIMITE_PAGINAS) {
            const sep = path.includes("?") ? "&" : "?";
            const res = await request(`${path}${sep}pagina=${pagina}`, { method: "GET" });

            if (res.status === 204) break;
            if (!res.ok) break;

            const data = await res.json();

            if (data && Array.isArray(data.content)) {
                allContent.push(...data.content);
                isLast = data.last === true;
            } else if (Array.isArray(data)) {
                allContent.push(...data);
                isLast = true;
            } else {
                // Resposta inesperada
                break;
            }
            pagina++;
        }

        return allContent;
    }

    window.MainAPI = {
        request,
        get,
        formatarLocalDateTime,
        aplicarMascaraData,
        dataParaISO,
        dataDeISO,
        fetchTodasPaginas,
        aplicarMascaraMoeda,
        obterValorMoeda,
        resetarMascaraMoeda,
        getTipos(userId) {
            // Endpoint paginado — busca todas as páginas
            return fetchTodasPaginas(`/categorias/usuario/${userId}`);
        },
        getInstituicoes(userId) {
            if (userId) {
                // Endpoint paginado — busca todas as páginas
                return fetchTodasPaginas(`/instituicoes/usuarios/${userId}`);
            }
            // Endpoint global também paginado
            return fetchTodasPaginas("/instituicoes");
        },
        registrarGasto(payload) {
            return postJson("/registros", payload);
        },
        registrarRecorrente(payload) {
            return postJson("/registros/recorrente", payload);
        },
        getCaixinhas(userId) {
            return request(`/caixinhas/ativas/usuarios/${userId}`, { method: "GET" })
                .then(res => {
                    if (res.status === 204) return [];
                    return res.json();
                });
        },
        adicionarSaldo(payload) {
            return this.registrarGasto(payload);
        },
        atualizarSaldo(payload) {
            return this.registrarGasto(payload);
        },
        carregarRegistros(userId) {
            return request(`/registros/${userId}`, { method: "GET" })
                .then(res => {
                    if (res.status === 204) return [];
                    return res.json();
                });
        },
        // ── PASSO 1: anos com registros ─────────────────────────────
        buscarAnosRegistros(userId) {
            return request(`/registros/anos/usuarios/${userId}`, { method: "GET" })
                .then(res => {
                    if (res.status === 204) return [];
                    return res.json();
                });
        },
        // ── PASSO 2: meses (do ano) com registros ───────────────────
        buscarMesesRegistros(userId, ano) {
            return request(`/registros/meses/usuarios/${userId}?ano=${ano}`, { method: "GET" })
                .then(res => {
                    if (res.status === 204) return [];
                    return res.json();
                });
        },
        // ── PASSO 3: registros do mês, paginados ────────────────────
        buscarRegistrosPorMes(userId, ano, mes, pagina = 0, tamanho = 20) {
            return request(`/registros/mes/usuarios/${userId}?ano=${ano}&mes=${mes}&pagina=${pagina}&tamanho=${tamanho}`, { method: "GET" })
                .then(res => {
                    if (res.status === 204) {
                        return { content: [], totalElements: 0, totalPages: 0, number: 0, size: tamanho, first: true, last: true, empty: true };
                    }
                    return res.json();
                });
        },
        filtrarRegistros(userId, filtros) {
            const params = new URLSearchParams();

            if (filtros.valor) params.append("valor", filtros.valor);
            if (filtros.dataEvento) params.append("dataEvento", filtros.dataEvento);
            if (filtros.descricao) params.append("descricao", filtros.descricao);
            if (filtros.titulo) params.append("titulo", filtros.titulo);

            (filtros.tipo || []).forEach(v => params.append("tipo", v));
            (filtros.tipoMovimento || []).forEach(v => params.append("tipoMovimento", v));
            (filtros.instituicaoUsuario || []).forEach(v => params.append("instituicaoUsuario", v));
            (filtros.categoriaUsuario || []).forEach(v => params.append("categoriaUsuario", v));

            const query = params.toString();
            const path = query
                ? `/registros/filtro/usuarios/${userId}?${query}`
                : `/registros/filtro/usuarios/${userId}`;

            return request(path, { method: "GET" })
                .then(res => {
                    if (res.status === 204) return [];
                    return res.json();
                });
        },
        adicionarTipo(payload, userId) {
            return postJson(`/categorias/usuario/${userId}`, { titulo: payload.titulo });
        },
        buscarRegistrosPorData(userId, dataSelecionada) {
            return request(`/registros/${userId}`, { method: "GET" })
                .then(res => {
                    if (res.status === 204) return [];
                    return res.json();
                })
                .then(registros => registros.filter(r => {
                    const dataEvento = r.eventoFinanceiro && r.eventoFinanceiro.dataEvento;
                    return dataEvento === dataSelecionada;
                }));
        },
        mostrarSaldoTotal(userId) {
            return request(`/registros/usuario/${userId}/saldo`, { method: "GET" })
                .then(res => res.json())
                .then(data => [{ valorTotal: data.valorTotal }]);
        },
        mostrarTodasInstituicoes(userId) {
            return request(`/registros/usuario/${userId}/saldo/instituicoes`, { method: "GET" })
                .then(res => {
                    if (res.status === 204) return [];
                    return res.json();
                });
        },
        cadastrarUsuario(payload) {
            return postJson("/usuarios", payload);
        },
        loginUsuario(payload) {
            return postJson("/usuarios/login", payload);
        },
        obterUsuario(userId) {
            return request(`/usuarios/${userId}`, { method: "GET" })
                .then(res => res.json());
        },
        enviarImagemUsuario(userId, file) {
            const formData = new FormData();
            formData.append("file", file);
            return request(`/usuarios/${userId}/upload-imagem`, {
                method: "PUT",
                body: formData
            });
        },
        salvarImagemLocal(userId, dataUrl) {
            const chave = chaveImagemLocal(userId);
            if (!chave || !dataUrl) return;
            try {
                localStorage.setItem(chave, dataUrl);
            } catch (_) {
            }
        },
        obterImagemLocal(userId) {
            const chave = chaveImagemLocal(userId);
            if (!chave) return null;
            return localStorage.getItem(chave);
        },
        resolverUrlImagem(caminhoImagem, userId) {
            // Tenta cache local primeiro (data URL)
            const local = this.obterImagemLocal(userId);
            if (local) return local;

            if (!caminhoImagem) return null;
            if (/^data:image\//i.test(caminhoImagem)) return caminhoImagem;
            if (/^https?:\/\//i.test(caminhoImagem)) return caminhoImagem;

            // Caminho relativo do servidor – constrói URL completa
            if (typeof caminhoImagem === "string" && caminhoImagem.trim()) {
                const path = caminhoImagem.startsWith("/") ? caminhoImagem : "/" + caminhoImagem;
                return `${LOCAL_API}${path}`;
            }

            return null;
        },
        editarRegistro(eventoId, payload) {
            return request(`/registros/${eventoId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        },
        editarSenhaUsuario(userId, payload) {
            return request(`/usuarios/editar-senha/${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        },
        excluirUsuario(userId) {
            return request(`/usuarios/${userId}`, { method: "DELETE" });
        },
        desvincularTodasInstituicoes(userId) {
            return request(`/instituicoes/desvincular-todas-as-instituicoes/usuarios/${userId}`, { method: "PUT" });
        },
        deletarTodosEventos(userId) {
            return request(`/configuracoes/usuarios/${userId}/dados/deletar-tudo`, { method: "DELETE" });
        },
        deletarRegistro(eventoId) {
            return request(`/registros/${eventoId}`, { method: "DELETE" });
        }
    };
})();
