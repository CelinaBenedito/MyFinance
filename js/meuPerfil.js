(function () {
    const API = "http://localhost:8080";
    const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado") || "null");
    const userId = usuarioLogado?.id;

    // ── helpers ──────────────────────────────────────────────────
    function habilitarFecharAlertaAoClicarFora() {
        const div = document.getElementById("div_alerta");
        const conteudo = document.getElementById("conteudoAlerta");
        if (!div || !conteudo || div.dataset.closeOutsideBound === "1") return;

        div.dataset.closeOutsideBound = "1";
        div.addEventListener("click", (event) => {
            if (event.target === div) {
                div.style.display = "none";
            }
        });
    }

    function mostrarAlerta(texto) {
        habilitarFecharAlertaAoClicarFora();
        const div = document.getElementById("div_alerta");
        const conteudo = document.getElementById("conteudoAlerta");
        if (!div || !conteudo) return;
        conteudo.textContent = texto;
        div.style.display = "flex";
        setTimeout(() => { div.style.display = "none"; }, 3000);
    }

    function mostrarConfirmacao(texto, onConfirm) {
        habilitarFecharAlertaAoClicarFora();
        const div = document.getElementById("div_alerta");
        const conteudo = document.getElementById("conteudoAlerta");
        if (!div || !conteudo) { onConfirm(); return; }
        conteudo.innerHTML = "";
        const msg = document.createElement("span");
        msg.textContent = texto;
        const divBtns = document.createElement("div");
        divBtns.style.cssText = "display:flex;gap:8px;margin-top:10px;";
        const btnOk = document.createElement("button");
        btnOk.textContent = "Confirmar";
        btnOk.addEventListener("click", () => { div.style.display = "none"; onConfirm(); });
        const btnNo = document.createElement("button");
        btnNo.textContent = "Cancelar";
        btnNo.style.background = "var(--cor-toggle-inativo)";
        btnNo.style.color = "var(--cor-texto-principal)";
        btnNo.addEventListener("click", () => { div.style.display = "none"; });
        divBtns.appendChild(btnNo);
        divBtns.appendChild(btnOk);
        conteudo.appendChild(msg);
        conteudo.appendChild(divBtns);
        div.style.display = "flex";
    }

    function putJson(url, payload) {
        return fetch(url, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
    }

    function formatarData(isoStr) {
        if (!isoStr) return "—";
        const [y, m, d] = isoStr.split("-");
        return `${d}/${m}/${y}`;
    }

    function formatarLocalDateTime(valor) {
        if (window.MainAPI?.formatarLocalDateTime) {
            return window.MainAPI.formatarLocalDateTime(valor, "—");
        }
        return "—";
    }

    function arquivoParaDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error("Falha ao ler imagem local."));
            reader.readAsDataURL(file);
        });
    }

    function renderizarAvatar(caminhoImagem) {
        const avatarImg = document.getElementById("pfAvatarImg");
        const avatarIcon = document.getElementById("pfAvatarIcon");
        if (!avatarImg || !avatarIcon) return;

        const url = window.MainAPI?.resolverUrlImagem
            ? window.MainAPI.resolverUrlImagem(caminhoImagem, userId)
            : null;

        if (url) {
            const urlFinal = /^data:image\//i.test(url)
                ? url
                : `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`;
            avatarImg.src = urlFinal;
            avatarImg.style.display = "block";
            avatarIcon.style.display = "none";
        } else {
            avatarImg.removeAttribute("src");
            avatarImg.style.display = "none";
            avatarIcon.style.display = "block";
        }
    }

    function bindUploadImagemPerfil() {
        const avatar = document.getElementById("pfAvatar");
        const input = document.getElementById("inputFotoPerfil");
        if (!avatar || !input) return;

        avatar.addEventListener("click", () => input.click());

        input.addEventListener("change", async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";

            if (!file) return;
            if (!file.type.startsWith("image/")) {
                mostrarAlerta("Selecione um arquivo de imagem válido.");
                return;
            }

            try {
                const res = await window.MainAPI.enviarImagemUsuario(userId, file);
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    mostrarAlerta(body.message || "Erro ao enviar imagem.");
                    return;
                }

                const atualizado = await res.json();
                const dataUrl = await arquivoParaDataUrl(file);
                const atualLocal = JSON.parse(localStorage.getItem("usuarioLogado") || "null") || {};
                const novoUsuario = { ...atualLocal, ...atualizado, imagem: dataUrl };
                window.MainAPI.salvarImagemLocal(userId, dataUrl);
                localStorage.setItem("usuarioLogado", JSON.stringify(novoUsuario));

                // Atualiza também a lista de perfis na tela de seleção (index.html)
                try {
                    const perfis = JSON.parse(localStorage.getItem("perfis") || "[]");
                    const idx = perfis.findIndex(p => p.id === userId);
                    const perfilEntry = idx !== -1 ? perfis[idx] : { id: userId, nome: novoUsuario.nome, sobrenome: novoUsuario.sobrenome };
                    const perfilAtualizado = Object.assign({}, perfilEntry, { imagem: atualizado.imagem || perfilEntry.imagem });
                    if (idx !== -1) {
                        perfis[idx] = perfilAtualizado;
                    } else {
                        perfis.push(perfilAtualizado);
                    }
                    const perfisJson = JSON.stringify(perfis);
                    localStorage.setItem("perfis", perfisJson);
                    // Salva via desktopBridge (síncrono Java → arquivo) para persistir entre sessões
                    if (window.desktopBridge) {
                        try { window.desktopBridge.savePerfis(perfisJson); } catch (_) {}
                    }
                } catch (_) {}

                popularHero(novoUsuario);
                window.dispatchEvent(new Event("usuario:imagemAtualizada"));
                mostrarAlerta("Imagem de perfil atualizada com sucesso.");
            } catch (e) {
                console.error("Erro ao enviar imagem:", e);
                mostrarAlerta("Erro ao enviar imagem.");
            }
        });
    }

    function xpNecessarioDoNivel(nivelAtual) {
        return Math.round(500 * Math.pow(nivelAtual, 1.5));
    }

    function calcularNivelEProgresso(xpTotal) {
        const xpSeguro = Number.isFinite(xpTotal) && xpTotal > 0 ? xpTotal : 0;
        let nivel = 1;
        let xpNoNivel = xpSeguro;
        let xpProximoNivel = xpNecessarioDoNivel(nivel);

        while (xpNoNivel >= xpProximoNivel) {
            xpNoNivel -= xpProximoNivel;
            nivel += 1;
            xpProximoNivel = xpNecessarioDoNivel(nivel);
        }

        const progresso = xpProximoNivel > 0
            ? Math.max(0, Math.min(100, (xpNoNivel / xpProximoNivel) * 100))
            : 0;

        return { nivel, xpNoNivel, xpProximoNivel, progresso };
    }

    async function carregarXpPerfil() {
        const xpBar = document.getElementById("xpBar");
        const xpLabel = document.querySelector(".pf-xp-label");
        if (!xpBar || !xpLabel || !userId) return;

        try {
            const res = await fetch(`${API}/usuarios/calculo-xp/${userId}`);
            if (!res.ok) {
                xpBar.style.width = "0%";
                xpLabel.textContent = "LVL 1 - 0/500 XP";
                return;
            }

            const xp = Number(await res.json());
            const info = calcularNivelEProgresso(xp);
            xpBar.style.width = `${info.progresso.toFixed(2)}%`;
            xpLabel.textContent = `LVL ${info.nivel} - ${Math.floor(info.xpNoNivel)}/${info.xpProximoNivel} XP`;
        } catch (e) {
            console.error("Erro ao carregar XP do perfil:", e);
        }
    }

    // ── INIT ─────────────────────────────────────────────────────
    async function init() {
        if (!userId) {
            window.location.href = "login.html";
            return;
        }
        // Busca dados frescos da API para garantir sobrenome, sexo, dataNascimento e email
        try {
            const usuarioAtualizado = await window.MainAPI.obterUsuario(userId);
            const merged = { ...usuarioLogado, ...usuarioAtualizado };
            const imagemLocal = window.MainAPI.obterImagemLocal(userId);
            if (imagemLocal) merged.imagem = imagemLocal;
            localStorage.setItem("usuarioLogado", JSON.stringify(merged));
            popularHero(merged);
        } catch (e) {
            popularHero(usuarioLogado);
        }

        bindUploadImagemPerfil();

        await Promise.all([
            carregarXpPerfil(),
            carregarConfig(),
            carregarInstituicoes(),
            carregarCategorias()
        ]);
    }

    window.addEventListener("xp:refresh", carregarXpPerfil);

    // ── HERO ─────────────────────────────────────────────────────
    function popularHero(u) {
        const nomeEl = document.getElementById("pfNome");
        if (nomeEl) nomeEl.textContent = `${u.nome} ${u.sobrenome}`;
        const sexoEl = document.getElementById("pfSexo");
        if (sexoEl) sexoEl.textContent = u.sexo || "—";
        const nascEl = document.getElementById("pfNascimento");
        if (nascEl) nascEl.textContent = formatarData(u.dataNascimento);
        const emailEl = document.getElementById("pfEmail");
        if (emailEl) emailEl.textContent = u.email || "—";
        renderizarAvatar(u.imagem || null);
    }

    // ── EDITAR PERFIL ─────────────────────────────────────────────
    window.abrirEdicaoPerfil = function () {
        // Lê sempre o dado mais recente do localStorage
        const u = JSON.parse(localStorage.getItem("usuarioLogado") || "null") || {};

        let modal = document.getElementById("modalEdicao");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "modalEdicao";
            modal.style.cssText = `
                position:fixed;inset:0;background:var(--cor-overlay);
                display:flex;align-items:center;justify-content:center;z-index:9999;
            `;
            modal.innerHTML = `
                <div style="background:var(--cor-fundo-card);border-radius:20px;padding:32px;width:min(460px,90vw);
                            color:var(--cor-texto-principal);
                            display:flex;flex-direction:column;gap:16px;box-shadow:0 8px 32px var(--sombra-caixa);">
                    <h2 style="color:var(--cor-titulo);margin:0;font-size:1.4rem;">Editar Perfil</h2>
                    <input id="edNome" type="text" placeholder="Nome"
                        style="height:48px;border:2px solid var(--cor-principal);border-radius:8px;padding:0 14px;font-size:16px;background:var(--cor-fundo-campo);color:var(--cor-texto-principal);">
                    <input id="edSobrenome" type="text" placeholder="Sobrenome"
                        style="height:48px;border:2px solid var(--cor-principal);border-radius:8px;padding:0 14px;font-size:16px;background:var(--cor-fundo-campo);color:var(--cor-texto-principal);">
                    <input id="edEmail" type="email" placeholder="Email"
                        style="height:48px;border:2px solid var(--cor-principal);border-radius:8px;padding:0 14px;font-size:16px;background:var(--cor-fundo-campo);color:var(--cor-texto-principal);">
                    <input id="edNascimento" type="date"
                        style="height:48px;border:2px solid var(--cor-principal);border-radius:8px;padding:0 14px;font-size:16px;background:var(--cor-fundo-campo);color:var(--cor-texto-principal);">
                    <select id="edSexo" style="height:48px;border:2px solid var(--cor-principal);border-radius:8px;padding:0 14px;font-size:16px;appearance:none;background:var(--cor-fundo-campo);color:var(--cor-texto-principal);">
                        <option value="">Sexo</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Feminino">Feminino</option>
                        <option value="PrefiroNãoIdentificar">Prefiro não identificar</option>
                    </select>
                    <div style="display:flex;gap:12px;margin-top:4px;">
                        <button onclick="salvarEdicaoPerfil()"
                            style="flex:1;height:48px;background:var(--cor-principal);color:var(--cor-texto-claro);border:none;border-radius:8px;font-size:16px;cursor:pointer;">
                            Salvar
                        </button>
                        <button onclick="document.getElementById('modalEdicao').style.display='none'"
                            style="flex:1;height:48px;background:transparent;color:var(--cor-principal);border:2px solid var(--cor-principal);border-radius:8px;font-size:16px;cursor:pointer;">
                            Cancelar
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // Preenche os campos com os dados atuais sempre que o modal abre
        document.getElementById("edNome").value = u.nome || "";
        document.getElementById("edSobrenome").value = u.sobrenome || "";
        document.getElementById("edEmail").value = u.email || "";
        document.getElementById("edNascimento").value = u.dataNascimento || "";
        document.getElementById("edSexo").value = u.sexo || "";

        modal.style.display = "flex";
    };

    window.salvarEdicaoPerfil = async function () {
        const emailVal = document.getElementById("edEmail").value.trim();
        const payload = {
            nome: document.getElementById("edNome").value.trim(),
            sobrenome: document.getElementById("edSobrenome").value.trim(),
            dataNascimento: document.getElementById("edNascimento").value || undefined,
            sexo: document.getElementById("edSexo").value || undefined
        };
        if (emailVal) payload.email = emailVal;

        if (!payload.nome || !payload.sobrenome || !payload.email) {
            mostrarAlerta("Preencha nome, sobrenome e email.");
            return;
        }

        try {
            const res = await putJson(`${API}/usuarios/${userId}`, payload);
            if (!res.ok) { mostrarAlerta("Erro ao salvar perfil."); return; }
            const atualizado = await res.json();
            // Atualiza localStorage
            const novoUsuario = { ...usuarioLogado, ...atualizado };
            localStorage.setItem("usuarioLogado", JSON.stringify(novoUsuario));
            // Atualiza lista de perfis
            try {
                const perfis = JSON.parse(localStorage.getItem("perfis") || "[]");
                const idx = perfis.findIndex(p => p.id === userId);
                const entrada = { id: novoUsuario.id, nome: novoUsuario.nome, sobrenome: novoUsuario.sobrenome, imagem: novoUsuario.imagem || null };
                if (idx !== -1) { perfis[idx] = Object.assign({}, perfis[idx], entrada); }
                else { perfis.push(entrada); }
                const perfisJson = JSON.stringify(perfis);
                localStorage.setItem("perfis", perfisJson);
                if (window.desktopBridge) {
                    try { window.desktopBridge.savePerfis(perfisJson); } catch (_) {}
                }
            } catch (_) {}
            popularHero(novoUsuario);
            document.getElementById("modalEdicao").style.display = "none";
        } catch (e) {
            mostrarAlerta("Erro ao salvar perfil.");
            console.error(e);
        }
    };

    // ── CONFIGURAÇÕES (resumo) ────────────────────────────────────
    async function carregarConfig() {
        try {
            const res = await fetch(`${API}/configuracoes/usuarios/${userId}`);
            if (!res.ok) return;
            const cfg = await res.json();

            const mfEl = document.getElementById("resumoMesFiscal");
            if (mfEl) mfEl.textContent = cfg.inicioMesFiscal != null
                ? `Dia ${cfg.inicioMesFiscal}` : "—";

            const limEl = document.getElementById("resumoLimite");
            if (limEl) limEl.textContent = cfg.limiteDesejadoMensal != null
                ? `R$ ${Number(cfg.limiteDesejadoMensal).toFixed(2)}` : "—";

            const atEl = document.getElementById("resumoAtualizacao");
            if (atEl) atEl.textContent = cfg.ultimaAtualizacao
                ? formatarData(cfg.ultimaAtualizacao) : "—";
        } catch (e) {
            console.error("Erro ao carregar configurações:", e);
        }
    }

    // ── Auxiliar: busca todas as páginas de endpoint paginado ─────
    async function fetchTodasPaginas(url) {
        const allContent = [];
        let pagina = 0;
        let isLast = false;
        const LIMITE = 100;
        while (!isLast && pagina < LIMITE) {
            const sep = url.includes("?") ? "&" : "?";
            const res = await fetch(`${url}${sep}pagina=${pagina}`);
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
                break;
            }
            pagina++;
        }
        return allContent;
    }

    // ── INSTITUIÇÕES ──────────────────────────────────────────────
    async function carregarInstituicoes() {
        try {
            const lista = await fetchTodasPaginas(`${API}/instituicoes/usuarios/${userId}`);
            renderInstituicoes(lista);
        } catch (e) {
            console.error("Erro ao carregar instituições:", e);
        }
    }

    function renderInstituicoes(lista) {
        const tbody = document.getElementById("corpoInstituicoes");
        if (!tbody) return;
        tbody.innerHTML = "";
        if (lista.length === 0) {
            const tr = document.createElement("tr");
            const td = document.createElement("td");
            td.colSpan = 4;
            td.style.cssText = "padding:16px;text-align:center;color:var(--cor-texto-secundario);";
            td.textContent = "Nenhuma instituição vinculada.";
            tr.appendChild(td);
            tbody.appendChild(tr);
            return;
        }
        lista.forEach(inst => {
            const tr = document.createElement("tr");

            const tdNome = document.createElement("td");
            tdNome.textContent = inst.intituicao.nome;
            tr.appendChild(tdNome);

            const tdLimite = document.createElement("td");
            tdLimite.textContent = "—";
            tr.appendChild(tdLimite);

            const tdMod = document.createElement("td");
            tdMod.textContent = formatarLocalDateTime(inst.ultimaAtualizacao);
            tr.appendChild(tdMod);

            const tdAcoes = document.createElement("td");
            const divAcoes = document.createElement("div");
            divAcoes.className = "pf-table-actions";
            const btn = document.createElement("button");
            btn.className = "pf-icon-btn delete";
            btn.title = "Desvincular";
            btn.innerHTML = "<i class='bx bx-trash'></i>";
            btn.addEventListener("click", () => desvincularInstituicao(inst.intituicao.id));
            divAcoes.appendChild(btn);
            tdAcoes.appendChild(divAcoes);
            tr.appendChild(tdAcoes);

            tbody.appendChild(tr);
        });
    }

    window.desvincularInstituicao = function (instId) {
        mostrarConfirmacao("Desvincular esta instituição do seu perfil?", async () => {
            try {
                await fetch(`${API}/instituicoes/${instId}/usuarios/${userId}`, { method: "PATCH" });
                await carregarInstituicoes();
            } catch (e) {
                mostrarAlerta("Erro ao desvincular instituição.");
                console.error(e);
            }
        });
    };

    window.adicionarInstituicaoModal = async function () {
        // Carrega todas as instituições disponíveis para o usuário escolher
        let todasInst = [];
        try {
            todasInst = await fetchTodasPaginas(`${API}/instituicoes`);
        } catch (e) { console.error(e); }

        if (document.getElementById("modalInstituicao")) {
            document.getElementById("modalInstituicao").remove();
        }

        const options = todasInst.map(i =>
            `<option value="${i.id}">${i.nome}</option>`
        ).join("");

        const modal = document.createElement("div");
        modal.id = "modalInstituicao";
        modal.style.cssText = `
            position:fixed;inset:0;background:var(--cor-overlay);
            display:flex;align-items:center;justify-content:center;z-index:9999;
        `;
        modal.innerHTML = `
            <div style="background:var(--cor-fundo-card);border-radius:20px;padding:32px;width:min(400px,90vw);
                        color:var(--cor-texto-principal);
                        display:flex;flex-direction:column;gap:16px;box-shadow:0 8px 32px var(--sombra-caixa);">
                <h2 style="color:var(--cor-titulo);margin:0;font-size:1.4rem;">Vincular Instituição</h2>
                <select id="selNovaInst" style="height:48px;border:2px solid var(--cor-principal);border-radius:8px;padding:0 14px;font-size:16px;appearance:none;background:var(--cor-fundo-campo);color:var(--cor-texto-principal);">
                    <option value="">Selecione...</option>
                    ${options}
                </select>
                <div style="display:flex;gap:12px;">
                    <button onclick="confirmarAdicionarInst()"
                        style="flex:1;height:48px;background:var(--cor-principal);color:var(--cor-texto-claro);border:none;border-radius:8px;font-size:16px;cursor:pointer;">
                        Vincular
                    </button>
                    <button onclick="document.getElementById('modalInstituicao').remove()"
                        style="flex:1;height:48px;background:transparent;color:var(--cor-principal);border:2px solid var(--cor-principal);border-radius:8px;font-size:16px;cursor:pointer;">
                        Cancelar
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    };

    window.confirmarAdicionarInst = async function () {
        const instId = document.getElementById("selNovaInst")?.value;
        if (!instId) { mostrarAlerta("Selecione uma instituição."); return; }
        try {
            const res = await fetch(`${API}/instituicoes/${instId}/usuarios/${userId}`, { method: "POST" });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                mostrarAlerta(body.message || "Erro ao vincular instituição.");
                return;
            }
            document.getElementById("modalInstituicao")?.remove();
            await carregarInstituicoes();
            window.dispatchEvent(new Event("xp:refresh"));
        } catch (e) {
            mostrarAlerta("Erro ao vincular instituição.");
            console.error(e);
        }
    };

    // ── CATEGORIAS ────────────────────────────────────────────────
    async function carregarCategorias() {
        try {
            const lista = await fetchTodasPaginas(`${API}/categorias/usuario/${userId}`);
            renderCategorias(lista);
        } catch (e) {
            console.error("Erro ao carregar categorias:", e);
        }
    }

    function renderCategorias(lista) {
        const tbody = document.getElementById("corpoCategorias");
        if (!tbody) return;
        tbody.innerHTML = "";
        if (lista.length === 0) {
            const tr = document.createElement("tr");
            const td = document.createElement("td");
            td.colSpan = 4;
            td.style.cssText = "padding:16px;text-align:center;color:var(--cor-texto-secundario);";
            td.textContent = "Nenhuma categoria registrada.";
            tr.appendChild(td);
            tbody.appendChild(tr);
            return;
        }
        lista.forEach(cat => {
            const tr = document.createElement("tr");

            const tdNome = document.createElement("td");
            tdNome.textContent = cat.categoria.titulo;
            tr.appendChild(tdNome);

            const tdLimite = document.createElement("td");
            tdLimite.textContent = "—";
            tr.appendChild(tdLimite);

            const tdMod = document.createElement("td");
            tdMod.textContent = formatarLocalDateTime(cat.ultimaAtualizacao);
            tr.appendChild(tdMod);

            const tdAcoes = document.createElement("td");
            const divAcoes = document.createElement("div");
            divAcoes.className = "pf-table-actions";
            const btn = document.createElement("button");
            btn.className = "pf-icon-btn delete";
            btn.title = "Remover";
            btn.innerHTML = "<i class='bx bx-trash'></i>";
            btn.addEventListener("click", () => removerCategoria(cat.categoria.id));
            divAcoes.appendChild(btn);
            tdAcoes.appendChild(divAcoes);
            tr.appendChild(tdAcoes);

            tbody.appendChild(tr);
        });
    }

    window.removerCategoria = function (catId) {
        mostrarConfirmacao("Remover esta categoria do seu perfil?", async () => {
            try {
                await fetch(`${API}/categorias/${catId}/usuarios/${userId}`, { method: "PATCH" });
                await carregarCategorias();
            } catch (e) {
                mostrarAlerta("Erro ao remover categoria.");
                console.error(e);
            }
        });
    };

    window.adicionarCategoriaModal = function () {
        if (document.getElementById("modalCategoria")) {
            document.getElementById("modalCategoria").style.display = "flex";
            return;
        }
        const modal = document.createElement("div");
        modal.id = "modalCategoria";
        modal.style.cssText = `
            position:fixed;inset:0;background:var(--cor-overlay);
            display:flex;align-items:center;justify-content:center;z-index:9999;
        `;
        modal.innerHTML = `
            <div style="background:var(--cor-fundo-card);border-radius:20px;padding:32px;width:min(400px,90vw);
                        color:var(--cor-texto-principal);
                        display:flex;flex-direction:column;gap:16px;box-shadow:0 8px 32px var(--sombra-caixa);">
                <h2 style="color:var(--cor-titulo);margin:0;font-size:1.4rem;">Nova Categoria</h2>
                <input id="edTituloCategoria" type="text" placeholder="Nome da categoria"
                    style="height:48px;border:2px solid var(--cor-principal);border-radius:8px;padding:0 14px;font-size:16px;background:var(--cor-fundo-campo);color:var(--cor-texto-principal);">
                <div style="display:flex;gap:12px;">
                    <button onclick="confirmarAdicionarCategoria()"
                        style="flex:1;height:48px;background:var(--cor-principal);color:var(--cor-texto-claro);border:none;border-radius:8px;font-size:16px;cursor:pointer;">
                        Adicionar
                    </button>
                    <button onclick="document.getElementById('modalCategoria').style.display='none'"
                        style="flex:1;height:48px;background:transparent;color:var(--cor-principal);border:2px solid var(--cor-principal);border-radius:8px;font-size:16px;cursor:pointer;">
                        Cancelar
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    };

    window.confirmarAdicionarCategoria = async function () {
        const titulo = document.getElementById("edTituloCategoria")?.value?.trim();
        if (!titulo) { mostrarAlerta("Informe o nome da categoria."); return; }
        try {
            const res = await fetch(`${API}/categorias/usuario/${userId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ titulo })
            });
            if (!res.ok) { mostrarAlerta("Erro ao criar categoria."); return; }
            document.getElementById("modalCategoria").style.display = "none";
            document.getElementById("edTituloCategoria").value = "";
            await carregarCategorias();
            window.dispatchEvent(new Event("xp:refresh"));
        } catch (e) {
            mostrarAlerta("Erro ao criar categoria.");
            console.error(e);
        }
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    // SEGURANÇA
    window.editarSenhaUsuario = async function () {
        let senhaAntiga = document.getElementById("edSenhaAntiga")?.value.trim();
        let senhaNova = document.getElementById("edSenhaNova")?.value.trim();
        let senhaNovaConf = document.getElementById("edSenhaNovaConf")?.value.trim();

        const payload = {
            novaSenha: senhaNova,
            antigaSenha: senhaAntiga
        };

        if (!senhaAntiga || !payload.novaSenha || !payload.antigaSenha) {
            mostrarAlerta("Preencha todos os campos de senha.");
            return;
        }
        if (payload.novaSenha !== senhaNovaConf) {
            mostrarAlerta("A nova senha e a confirmação não coincidem.");
            return;
        }

        try {
            const res = await MainAPI.editarSenhaUsuario(userId, payload);
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                mostrarAlerta(body.message || "Erro ao alterar senha.");
                return;
            }
            mostrarAlerta("Senha alterada com sucesso.");
            document.getElementById("edSenhaAntiga").value = "";
            document.getElementById("edSenhaNova").value = "";
            document.getElementById("edSenhaNovaConf").value = "";
        } catch (e) {
            mostrarAlerta("Erro ao alterar senha.");
            console.error(e);
        }
    }

    // AÇÕES CRÍTICAS
    window.excluirConta = async function () {
        mostrarConfirmacao("Tem certeza que deseja excluir sua conta? Esta ação é irreversível.", async () => {
            try {
                const res = await MainAPI.excluirUsuario(userId);
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    mostrarAlerta(body.message || "Erro ao excluir conta.");
                    return;
                }
                mostrarAlerta("Conta excluída com sucesso.");

                // Remove o usuário do array de perfis salvos
                try {
                    const raw = localStorage.getItem("perfis");
                    const perfis = raw ? JSON.parse(raw) : [];
                    const perfisAtualizados = perfis.filter(function(p) {
                        return p.id !== userId && String(p.id) !== String(userId);
                    });
                    const perfisJson = JSON.stringify(perfisAtualizados);
                    localStorage.setItem("perfis", perfisJson);
                    if (window.desktopBridge) {
                        try { window.desktopBridge.savePerfis(perfisJson); } catch (_) {}
                    }
                } catch (errPerfis) {
                    console.error("Erro ao remover perfil da lista:", errPerfis);
                }

                localStorage.removeItem("usuarioLogado");
                setTimeout(() => {
                    window.location.href = "index.html";
                }, 1500);
            } catch (e) {
                mostrarAlerta("Erro ao excluir conta.");
                console.error(e);
            }
        });
    }

    window.desvincularTodasInstituicoes = async function () {
        mostrarConfirmacao("Tem certeza que deseja desvincular todas as instituições? Esta ação não pode ser desfeita.", async () => {
            try {
                const res = await MainAPI.desvincularTodasInstituicoes(userId);
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    mostrarAlerta(body.message || "Erro ao desvincular instituições.");
                    return;
                }
                mostrarAlerta("Todas as instituições desvinculadas com sucesso.");
                await carregarInstituicoes();
            } catch (e) {
                mostrarAlerta("Erro ao desvincular instituições.");
                console.error(e);
            }
        });
    }

    window.deletarTodosEventos = async function () {
        mostrarConfirmacao("Tem certeza que deseja apagar todos os eventos financeiros? Esta ação é irreversível.", async () => {
            try {
                const res = await MainAPI.deletarTodosEventos(userId);
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    mostrarAlerta(body.message || "Erro ao apagar eventos.");
                    return;
                }
                mostrarAlerta("Todos os eventos apagados com sucesso.");
                window.dispatchEvent(new Event("xp:refresh"));
            } catch (e) {
                mostrarAlerta("Erro ao apagar eventos.");
                console.error(e);
            }
        });
    }
})();
