(function () {
    const LOCAL_API = "https://my-finance-api-eqdubfc7bvg6brdw.brazilsouth-01.azurewebsites.net";
    const AUTH_TOKEN_KEY = "authToken";
    const AUTH_PERSIST_KEY = "authPersist";
    const AUTH_REDIRECT_MESSAGE_KEY = "authRedirectMessage";
    const REFRESH_TOKEN_PATHS = ["/usuarios/refresh-token", "/usuarios/renovar-token", "/auth/refresh", "/auth/refresh-token"];
    let renovacaoEmAndamento = null;

    function obterUsuarioLogado() {
        try {
            return JSON.parse(localStorage.getItem("usuarioLogado") || "null");
        } catch (_) {
            return null;
        }
    }

    function obterTokenAutenticacao() {
        const usuario = obterUsuarioLogado();
        return sessionStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(AUTH_TOKEN_KEY) || usuario?.token || null;
    }

    function deveManterContaConectada() {
        return localStorage.getItem(AUTH_PERSIST_KEY) === "1";
    }

    function salvarMensagemAutenticacao(mensagem) {
        if (!mensagem) return;
        localStorage.setItem(AUTH_REDIRECT_MESSAGE_KEY, mensagem);
    }

    function obterMensagemAutenticacao() {
        const mensagem = localStorage.getItem(AUTH_REDIRECT_MESSAGE_KEY) || null;
        if (mensagem) {
            localStorage.removeItem(AUTH_REDIRECT_MESSAGE_KEY);
        }
        return mensagem;
    }

    function salvarSessao(usuario, token, manterConectado = true) {
        if (!usuario || !usuario.id) return null;

        const sessao = Object.assign({}, usuario);
        delete sessao.token;

        localStorage.setItem("usuarioLogado", JSON.stringify(sessao));
        localStorage.setItem(AUTH_PERSIST_KEY, manterConectado ? "1" : "0");

        if (token) {
            if (manterConectado) {
                localStorage.setItem(AUTH_TOKEN_KEY, token);
                sessionStorage.removeItem(AUTH_TOKEN_KEY);
            } else {
                sessionStorage.setItem(AUTH_TOKEN_KEY, token);
                localStorage.removeItem(AUTH_TOKEN_KEY);
            }
        } else {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            sessionStorage.removeItem(AUTH_TOKEN_KEY);
        }

        return token
            ? Object.assign({}, sessao, { token })
            : sessao;
    }

    function limparSessao() {
        localStorage.removeItem("usuarioLogado");
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_PERSIST_KEY);
        sessionStorage.removeItem(AUTH_TOKEN_KEY);
        if (window.AppCache) window.AppCache.clearAll();
    }

    function paginaPublica() {
        const path = (window.location.pathname || "").replace(/\\/g, "/");
        const pagina = path.substring(path.lastIndexOf("/") + 1).toLowerCase();
        return !pagina || pagina === "index.html" || pagina === "login.html" || pagina === "cadastrar.html";
    }

    function garantirAutenticacaoDaPagina() {
        if (paginaPublica()) return;

        const usuario = obterUsuarioLogado();
        const token = obterTokenAutenticacao();
        if (usuario?.id && token) return;

        if (usuario?.id && !token) {
            salvarMensagemAutenticacao("Você foi desconectado. Faça login novamente.");
        }
        limparSessao();
        window.location.href = "login.html";
    }

    function buildUrl(path) {
        if (/^https?:\/\//i.test(path)) {
            return path;
        }
        return `${LOCAL_API}${path}`;
    }

    function ehRequisicaoDaApi(url) {
        if (!url) return false;

        try {
            const alvo = new URL(url, LOCAL_API);
            const api = new URL(LOCAL_API);
            return alvo.origin === api.origin;
        } catch (_) {
            return !/^https?:\/\//i.test(String(url));
        }
    }

    function criarHeadersComAuth(headersOriginais) {
        const headers = new Headers(headersOriginais || {});
        const token = obterTokenAutenticacao();

        if (token && !headers.has("Authorization")) {
            headers.set("Authorization", "Bearer " + token);
        }

        return headers;
    }

    function ehRespostaNaoAutorizada(response) {
        return response && (response.status === 401 || response.status === 403);
    }

    function ehEndpointRenovacao(url) {
        if (!url) return false;
        return REFRESH_TOKEN_PATHS.some(path => String(url).toLowerCase().includes(path.toLowerCase()));
    }

    function ehEndpointLogin(url) {
        return String(url || "").toLowerCase().includes("/usuarios/login");
    }

    function tratarSessaoExpirada() {
        salvarMensagemAutenticacao("Sua sessão expirou. Faça login novamente.");
        limparSessao();
        if (!paginaPublica()) {
            window.location.href = "login.html";
        }
    }

    async function tentarRenovarToken() {
        const tokenAtual = obterTokenAutenticacao();
        if (!tokenAtual) return null;

        for (const path of REFRESH_TOKEN_PATHS) {
            try {
                const resposta = await nativeFetch(buildUrl(path), {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + tokenAtual
                    },
                    body: JSON.stringify({ token: tokenAtual })
                });

                if (!resposta.ok) continue;

                let payload = null;
                try {
                    payload = await resposta.json();
                } catch (_) {
                    payload = null;
                }

                const tokenRenovado = payload?.token || payload?.accessToken || payload?.jwt || null;
                if (!tokenRenovado) continue;

                const usuario = obterUsuarioLogado();
                salvarSessao(usuario, tokenRenovado, true);
                return tokenRenovado;
            } catch (_) {
            }
        }

        return null;
    }

    const nativeFetch = window.fetch ? window.fetch.bind(window) : null;
    if (nativeFetch) {
        window.fetch = async function (input, init) {
            const url = typeof input === "string"
                ? input
                : (input && input.url ? input.url : "");

            if (!ehRequisicaoDaApi(url)) {
                return nativeFetch(input, init);
            }

            let requestInput = input;
            let requestOptions = init;

            if (typeof Request !== "undefined" && input instanceof Request) {
                const headers = criarHeadersComAuth(init && init.headers ? init.headers : input.headers);
                requestInput = new Request(input, Object.assign({}, init || {}, { headers }));
            } else {
                requestOptions = Object.assign({}, init || {});
                requestOptions.headers = criarHeadersComAuth(requestOptions.headers);
                requestInput = buildUrl(url);
            }

            const response = await nativeFetch(requestInput, requestOptions);

            if (!ehRespostaNaoAutorizada(response) || ehEndpointRenovacao(url) || ehEndpointLogin(url)) {
                return response;
            }

            if (!deveManterContaConectada()) {
                tratarSessaoExpirada();
                return response;
            }

            if (!renovacaoEmAndamento) {
                renovacaoEmAndamento = tentarRenovarToken().finally(() => {
                    renovacaoEmAndamento = null;
                });
            }
            const novoToken = await renovacaoEmAndamento;
            if (!novoToken) {
                tratarSessaoExpirada();
                return response;
            }

            if (typeof Request !== "undefined" && input instanceof Request) {
                const retryHeaders = criarHeadersComAuth(init && init.headers ? init.headers : input.headers);
                const retryRequest = new Request(input, Object.assign({}, init || {}, { headers: retryHeaders }));
                return nativeFetch(retryRequest);
            }

            const retryOptions = Object.assign({}, init || {});
            retryOptions.headers = criarHeadersComAuth(retryOptions.headers);
            return nativeFetch(buildUrl(url), retryOptions);
        };
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
        LOCAL_API,
        obterUsuarioLogado,
        obterTokenAutenticacao,
        salvarSessao,
        limparSessao,
        obterMensagemAutenticacao,
        formatarLocalDateTime,
        aplicarMascaraData,
        dataParaISO,
        dataDeISO,
        fetchTodasPaginas,
        aplicarMascaraMoeda,
        obterValorMoeda,
        resetarMascaraMoeda,
        getTipos(userId) {
            const C = window.AppCache;
            if (C) {
                const cached = C.get(C.keyCategoriasUser(userId));
                if (cached) return Promise.resolve(cached);
            }
            return fetchTodasPaginas(`/categorias/usuario/${userId}`).then(data => {
                if (C) C.set(C.keyCategoriasUser(userId), data, C.TTL.CATEGORIES_USER);
                return data;
            });
        },
        getInstituicoes(userId) {
            const C = window.AppCache;
            if (userId) {
                if (C) {
                    const cached = C.get(C.keyInstituicoesUser(userId));
                    if (cached) return Promise.resolve(cached);
                }
                return fetchTodasPaginas(`/instituicoes/usuarios/${userId}`).then(data => {
                    if (C) C.set(C.keyInstituicoesUser(userId), data, C.TTL.INSTITUTIONS_USER);
                    return data;
                });
            }
            if (C) {
                const cached = C.get(C.keyInstituicoesAll());
                if (cached) return Promise.resolve(cached);
            }
            return fetchTodasPaginas("/instituicoes").then(data => {
                if (C) C.set(C.keyInstituicoesAll(), data, C.TTL.INSTITUTIONS_ALL);
                return data;
            });
        },
        registrarGasto(payload) {
            return postJson("/registros", payload).then(res => {
                if (res.ok && window.AppCache) {
                    const uid = obterUsuarioLogado()?.id;
                    if (uid) {
                        window.AppCache.invalidarRegistros(uid);
                        window.AppCache.invalidarDashboard(uid);
                    }
                }
                return res;
            });
        },
        registrarRecorrente(payload) {
            return postJson("/registros/recorrente", payload).then(res => {
                if (res.ok && window.AppCache) {
                    const uid = obterUsuarioLogado()?.id;
                    if (uid) {
                        window.AppCache.invalidarRegistros(uid);
                        window.AppCache.invalidarDashboard(uid);
                    }
                }
                return res;
            });
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
        resgatarCaixinha(caixinhaId, payload) {
            return postJson(`/caixinhas/${caixinhaId}/resgatar`, payload).then(res => {
                if (res.ok && window.AppCache) {
                    const uid = obterUsuarioLogado()?.id;
                    if (uid) {
                        window.AppCache.invalidarRegistros(uid);
                        window.AppCache.invalidarDashboard(uid);
                    }
                }
                return res;
            });
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
        // ── AGENDA: todos os registros de um mês (sem paginação exposta) ──
        buscarTodosRegistrosMes(userId, ano, mes) {
            const C = window.AppCache;
            if (C) {
                const cached = C.get(C.keyAgendaMes(userId, ano, mes));
                if (cached) return Promise.resolve(cached);
            }
            return fetchTodasPaginas(`/registros/mes/usuarios/${userId}?ano=${ano}&mes=${mes}`)
                .then(data => {
                    if (C) C.set(C.keyAgendaMes(userId, ano, mes), data, C.TTL.RECORDS_PAGE);
                    return data;
                });
        },
        // ── PASSO 1: anos com registros ─────────────────────────────
        buscarAnosRegistros(userId) {
            const C = window.AppCache;
            if (C) {
                const cached = C.get(C.keyRegAnos(userId));
                if (cached) return Promise.resolve(cached);
            }
            return request(`/registros/anos/usuarios/${userId}`, { method: "GET" })
                .then(res => {
                    if (res.status === 204) return [];
                    return res.json();
                }).then(data => {
                    if (C) C.set(C.keyRegAnos(userId), data, C.TTL.RECORDS_NAV);
                    return data;
                });
        },
        // ── PASSO 2: meses (do ano) com registros ───────────────────
        buscarMesesRegistros(userId, ano) {
            const C = window.AppCache;
            if (C) {
                const cached = C.get(C.keyRegMeses(userId, ano));
                if (cached) return Promise.resolve(cached);
            }
            return request(`/registros/meses/usuarios/${userId}?ano=${ano}`, { method: "GET" })
                .then(res => {
                    if (res.status === 204) return [];
                    return res.json();
                }).then(data => {
                    if (C) C.set(C.keyRegMeses(userId, ano), data, C.TTL.RECORDS_NAV);
                    return data;
                });
        },
        // ── PASSO 3: registros do mês, paginados ────────────────────
        buscarRegistrosPorMes(userId, ano, mes, pagina = 0, tamanho = 20) {
            const C = window.AppCache;
            if (C) {
                const cached = C.get(C.keyRegPagina(userId, ano, mes, pagina, tamanho));
                if (cached) return Promise.resolve(cached);
            }
            return request(`/registros/mes/usuarios/${userId}?ano=${ano}&mes=${mes}&pagina=${pagina}&tamanho=${tamanho}`, { method: "GET" })
                .then(res => {
                    if (res.status === 204) {
                        return { content: [], totalElements: 0, totalPages: 0, number: 0, size: tamanho, first: true, last: true, empty: true };
                    }
                    return res.json();
                }).then(data => {
                    if (C) C.set(C.keyRegPagina(userId, ano, mes, pagina, tamanho), data, C.TTL.RECORDS_PAGE);
                    return data;
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
            return postJson(`/categorias/usuario/${userId}`, { titulo: payload.titulo }).then(res => {
                if (res.ok && window.AppCache) window.AppCache.del(window.AppCache.keyCategoriasUser(userId));
                return res;
            });
        },
        getTodasInstituicoes() {
            const C = window.AppCache;
            if (C) {
                const cached = C.get(C.keyInstituicoesAll());
                if (cached) return Promise.resolve(cached);
            }
            return fetchTodasPaginas("/instituicoes").then(data => {
                if (C) C.set(C.keyInstituicoesAll(), data, C.TTL.INSTITUTIONS_ALL);
                return data;
            });
        },
        getTodasCategorias() {
            const C = window.AppCache;
            if (C) {
                const cached = C.get(C.keyCategoriasAll());
                if (cached) return Promise.resolve(cached);
            }
            return fetchTodasPaginas("/categorias").then(data => {
                if (C) C.set(C.keyCategoriasAll(), data, C.TTL.CATEGORIES_ALL);
                return data;
            });
        },
        criarInstituicao(nome) {
            return postJson("/instituicoes", { nome }).then(res => {
                if (res.ok && window.AppCache) window.AppCache.del(window.AppCache.keyInstituicoesAll());
                return res;
            });
        },
        vincularInstituicaoUsuario(instituicaoId, userId) {
            return request(`/instituicoes/${instituicaoId}/usuarios/${userId}`, { method: "POST" }).then(res => {
                if (res.ok && window.AppCache) window.AppCache.del(window.AppCache.keyInstituicoesUser(userId));
                return res;
            });
        },
        vincularCategoriaUsuario(categoriaId, userId) {
            return request(`/categorias/${categoriaId}/usuarios/${userId}`, { method: "POST" }).then(res => {
                if (res.ok && window.AppCache) window.AppCache.del(window.AppCache.keyCategoriasUser(userId));
                return res;
            });
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
            }).then(res => {
                if (res.ok && window.AppCache) {
                    const uid = obterUsuarioLogado()?.id;
                    if (uid) {
                        window.AppCache.invalidarRegistros(uid);
                        window.AppCache.invalidarDashboard(uid);
                    }
                }
                return res;
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
            return request(`/instituicoes/desvincular-todas-as-instituicoes/usuarios/${userId}`, { method: "PUT" }).then(res => {
                if (res.ok && window.AppCache) window.AppCache.del(window.AppCache.keyInstituicoesUser(userId));
                return res;
            });
        },
        deletarTodosEventos(userId) {
            return request(`/configuracoes/usuarios/${userId}/dados/deletar-tudo`, { method: "DELETE" }).then(res => {
                if (res.ok && window.AppCache) {
                    window.AppCache.invalidarRegistros(userId);
                    window.AppCache.invalidarDashboard(userId);
                    window.AppCache.del(window.AppCache.keyCategoriasUser(userId));
                    window.AppCache.del(window.AppCache.keyInstituicoesUser(userId));
                }
                return res;
            });
        },
        deletarRegistro(eventoId) {
            return request(`/registros/${eventoId}`, { method: "DELETE" }).then(res => {
                if (res.ok && window.AppCache) {
                    const uid = obterUsuarioLogado()?.id;
                    if (uid) {
                        window.AppCache.invalidarRegistros(uid);
                        window.AppCache.invalidarDashboard(uid);
                    }
                }
                return res;
            });
        }
    };

    garantirAutenticacaoDaPagina();
})();
