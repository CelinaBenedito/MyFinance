const navbar = document.getElementById("navbar");
const main = document.getElementById("main");
const home = document.getElementById("home");
const reg = document.getElementById("reg");
const add = document.getElementById("add");
const agenda = document.getElementById("agenda");
const config = document.getElementById("config");
const tema = document.getElementById("tema");
const caixinhaN = document.getElementById("caixinhas"); // pode ser null em páginas sem o item

// Aplica modo vidro imediatamente para evitar flash
(function () {
    var v = localStorage.getItem("vidro");
    if (v) document.body.setAttribute("data-vidro", v);
})();

let ativo = false;

const isMobile = () => window.matchMedia('(max-width: 768px)').matches;

function _applyInitialState() {
    if (isMobile()) {
        navbar.style.width = "0";
        navbar.style.overflow = "hidden";
        navbar.style.padding = "0";
        main.style.marginLeft = "0";
        main.style.paddingTop = "68px";
    } else {
        navbar.style.width = "70px";
        navbar.style.overflow = "";
        navbar.style.padding = "20px";
        main.style.marginLeft = "70px";
        main.style.paddingTop = "";
    }
}

_applyInitialState();

function _closeSidebarMobile() {
    ativo = false;
    navbar.classList.remove('sidebar--aberta');
    navbar.style.width = "0";
    navbar.style.overflow = "hidden";
    navbar.style.padding = "0";
    var bd = document.getElementById('sidebar-backdrop');
    if (bd) bd.style.display = 'none';
}

function sidebarFunction() {
    if (isMobile()) {
        if (!ativo) {
            ativo = true;
            navbar.classList.add('sidebar--aberta');
            navbar.style.width = "270px";
            navbar.style.overflow = "";
            navbar.style.padding = "20px";
            var bd = document.getElementById('sidebar-backdrop');
            if (bd) bd.style.display = 'block';
        } else {
            _closeSidebarMobile();
        }
    } else {
        if (!ativo) {
            ativo = true;
            navbar.classList.add('sidebar--aberta');
            navbar.style.width = "300px";
            main.style.marginLeft = "300px";
        } else {
            ativo = false;
            navbar.classList.remove('sidebar--aberta');
            navbar.style.width = "70px";
            main.style.marginLeft = "70px";
        }
    }
}

// Inject mobile hamburger button and backdrop
(function () {
    var hamBtn = document.createElement('button');
    hamBtn.id = 'mobile-ham-btn';
    hamBtn.setAttribute('aria-label', 'Menu');
    hamBtn.innerHTML = "<i class='bx bx-menu'></i>";
    hamBtn.addEventListener('click', sidebarFunction);
    document.body.appendChild(hamBtn);

    var backdrop = document.createElement('div');
    backdrop.id = 'sidebar-backdrop';
    backdrop.addEventListener('click', function () { if (ativo) sidebarFunction(); });
    document.body.appendChild(backdrop);
})();

// Handle window resize (e.g. phone rotation)
var _lastMobile = isMobile();
window.addEventListener('resize', function () {
    var nowMobile = isMobile();
    if (nowMobile === _lastMobile) return;
    _lastMobile = nowMobile;
    ativo = false;
    navbar.classList.remove('sidebar--aberta');
    var bd = document.getElementById('sidebar-backdrop');
    if (bd) bd.style.display = 'none';
    main.style.paddingTop = "";
    _applyInitialState();
});

/*---------------- Modal de confirmação de Logout ----------------*/
(function () {
    // Cria o modal de confirmação de logout dinamicamente
    const modalHtml = `
    <div id="uwLogoutOverlay" style="
        display:none; position:fixed; top:0; right:0; bottom:0; left:0; z-index:99999;
        background:rgba(0,0,0,0.45);
        -webkit-align-items:center; align-items:center;
        -webkit-justify-content:center; justify-content:center;">
        <div id="uwLogoutModal" style="
            background:var(--cor-fundo-card, #fff);
            border-radius:18px;
            box-shadow:0 16px 48px rgba(0,0,0,0.28);
            padding:36px 32px 28px;
            max-width:400px; width:90%;
            display:flex; flex-direction:column; align-items:center; gap:16px;
            animation:uwModalIn 0.2s ease;">
            <div style="
                width:60px; height:60px; border-radius:50%;
                background:var(--red-100,#fee2e2);
                display:flex; align-items:center; justify-content:center;">
                <i class='bx bx-log-out' style="font-size:1.8rem; color:var(--red-700,#b91c1c);"></i>
            </div>
            <h2 style="
                font-size:1.15rem; font-weight:700; margin:0;
                color:var(--cor-titulo); text-align:center;">
                Fazer Logout?
            </h2>
            <p style="
                font-size:0.9rem; color:var(--cor-texto-secundario);
                text-align:center; margin:0; line-height:1.55;">
                Você será desconectado desta sessão.<br>
                Seu perfil será removido da tela inicial neste dispositivo.
            </p>
            <div style="display:flex; gap:12px; width:100%; margin-top:8px;">
                <button id="uwLogoutCancelar" style="
                    flex:1; padding:11px; border-radius:10px; cursor:pointer;
                    background:var(--cor-fundo-pagina); color:var(--cor-texto-principal);
                    font-size:0.9rem; font-weight:600; border:1px solid var(--cor-tinte-borda, #ccc);
                    transition:background 0.18s; margin:0;">
                    Cancelar
                </button>
                <button id="uwLogoutConfirmar" style="
                    flex:1; padding:11px; border-radius:10px; cursor:pointer;
                    background:var(--red-700,#b91c1c); color:#fff;
                    font-size:0.9rem; font-weight:600; border:none;
                    transition:background 0.18s; margin:0;">
                    Sim, fazer logout
                </button>
            </div>
        </div>
    </div>
    <style>
        @keyframes uwModalIn {
            from { opacity:0; transform:scale(0.92) translateY(12px); }
            to   { opacity:1; transform:scale(1)    translateY(0);     }
        }
        #uwLogoutCancelar:hover  { background:var(--cor-hover, #e2e8f0) !important; }
        #uwLogoutConfirmar:hover { background:#991b1b !important; }
    </style>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const overlay  = document.getElementById('uwLogoutOverlay');
    const btnCanc  = document.getElementById('uwLogoutCancelar');
    const btnConf  = document.getElementById('uwLogoutConfirmar');

    window._abrirLogoutModal = function () {
        overlay.style.display = 'flex';
    };

    btnCanc.addEventListener('click', function () {
        overlay.style.display = 'none';
    });

    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) overlay.style.display = 'none';
    });

    btnConf.addEventListener('click', function () {
        // Mesma regra do "excluir conta": remove apenas o perfil da tela inicial/local.
        try {
            var usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado') || 'null');
            var userId = usuarioLogado ? usuarioLogado.id : null;
            if (userId !== null && userId !== undefined) {
                var raw = localStorage.getItem('perfis');
                var perfis = raw ? JSON.parse(raw) : [];
                var perfisAtualizados = perfis.filter(function(p) {
                    return p.id !== userId && String(p.id) !== String(userId);
                });
                var perfisJson = JSON.stringify(perfisAtualizados);
                localStorage.setItem('perfis', perfisJson);
                if (window.desktopBridge) {
                    try { window.desktopBridge.savePerfis(perfisJson); } catch (_) {}
                }
            }
        } catch (errPerfis) {
            console.error('Erro ao remover perfil da lista no logout:', errPerfis);
        }

        if (window.MainAPI && window.MainAPI.limparSessao) {
            window.MainAPI.limparSessao();
        } else {
            localStorage.removeItem('usuarioLogado');
            localStorage.removeItem('authToken');
        }
        setTimeout(function () {
            window.location.href = 'index.html';
        }, 150);
    });
})();

/*---------------- User widget dropdown ----------------*/
(function () {
    const userWidget = document.getElementById('userWidget');
    const dropdown   = document.getElementById('uwDropdown');
    const btnLogout  = document.getElementById('btnLogout');

    if (!userWidget || !dropdown) return;

    // Abre/fecha o dropdown ao clicar no widget
    userWidget.addEventListener('click', function (e) {
        e.stopPropagation();
        dropdown.classList.toggle('aberto');
    });

    // Fecha ao clicar fora
    document.addEventListener('click', function () {
        dropdown.classList.remove('aberto');
    });

    // Impede que cliques dentro do dropdown fechem ele imediatamente
    dropdown.addEventListener('click', function (e) {
        e.stopPropagation();
    });

    // LogOut: abre modal de confirmação
    if (btnLogout) {
        btnLogout.addEventListener('click', function () {
            dropdown.classList.remove('aberto');
            window._abrirLogoutModal();
        });
    }
})();

/*---------------- User widget ----------------*/
(function () {
    const uwNome = document.getElementById("uw_nome");
    const uwXp = document.getElementById("uw_xp");
    const uwLvl = document.getElementById("uw_lvl");
    const uwAvatar = document.querySelector(".uw-avatar");
    if (!uwNome) return;

    const user = JSON.parse(localStorage.getItem("usuarioLogado") || "null");
    if (user && user.nome) uwNome.textContent = user.nome;

    function renderizarAvatarWidget(usuarioAtual) {
        if (!uwAvatar) return;
        const url = window.MainAPI?.resolverUrlImagem
            ? window.MainAPI.resolverUrlImagem(usuarioAtual?.imagem, usuarioAtual?.id)
            : null;

        if (url) {
            const urlFinal = /^data:image\//i.test(url)
                ? url
                : `${url}${url.includes("?") ? "&" : "?"}v=${usuarioAtual?.id || 0}`;
            uwAvatar.innerHTML = `<img src="${urlFinal}" alt="Foto de perfil" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
        } else {
            uwAvatar.innerHTML = "<i class='bx bx-user' style='font-size:1.6rem; color:var(--cor-principal);'></i>";
        }

        _injetarMascoteWidget();
    }

    function _injetarMascoteWidget() {
        if (!uwAvatar || !window.MascoteApp) return;
        const key = window.MascoteApp.getSalvo();
        const m = window.MascoteApp.MASCOTES[key];
        if (!m || !m.imagens || key === 'nenhum') return;

        const chain = ['fofinha02', 'fofinha', 'poder', 'balancante02', 'balancante'];
        let src = null;
        for (let i = 0; i < chain.length; i++) {
            if (m.imagens[chain[i]]) { src = m.imagens[chain[i]]; break; }
        }
        if (!src) return;

        const img = document.createElement('img');
        img.src = src;
        img.alt = m.nome;
        img.className = 'uw-mascote';
        uwAvatar.appendChild(img);
    }

    renderizarAvatarWidget(user);

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

    async function atualizarXPWidget() {
        if (!uwXp || !uwLvl || !user?.id) return;
        try {
            // Cache de 5 minutos no sessionStorage para evitar fetch em toda navegação
            const cacheKey = `xp_cache_${user.id}`;
            const cacheTs  = `xp_cache_ts_${user.id}`;
            const cached   = sessionStorage.getItem(cacheKey);
            const ts       = Number(sessionStorage.getItem(cacheTs) || 0);
            const AGE_MS   = 5 * 60 * 1000; // 5 minutos

            let xp;
            if (cached !== null && (Date.now() - ts) < AGE_MS) {
                xp = Number(cached);
            } else {
                const res = await fetch(`https://my-finance-api-eqdubfc7bvg6brdw.brazilsouth-01.azurewebsites.net/usuarios/calculo-xp/${user.id}`);
                if (!res.ok) {
                    uwXp.style.width = "0%";
                    uwLvl.textContent = "LVL 1";
                    return;
                }
                xp = Number(await res.json());
                try {
                    sessionStorage.setItem(cacheKey, String(xp));
                    sessionStorage.setItem(cacheTs, String(Date.now()));
                } catch(_) {}
            }

            const info = calcularNivelEProgresso(xp);

            uwXp.style.width = `${info.progresso.toFixed(2)}%`;
            uwLvl.textContent = `LVL ${info.nivel}`;
            uwLvl.title = `${Math.floor(info.xpNoNivel)}/${info.xpProximoNivel} XP`;
        } catch (e) {
            console.error("Erro ao atualizar XP:", e);
        }
    }

    window.atualizarXPWidget = atualizarXPWidget;
    window.addEventListener("xp:refresh", () => {
        try {
            sessionStorage.removeItem(`xp_cache_${user?.id}`);
            sessionStorage.removeItem(`xp_cache_ts_${user?.id}`);
        } catch(_) {}
        atualizarXPWidget();
    });
    window.addEventListener("usuario:imagemAtualizada", () => {
        const usuarioAtual = JSON.parse(localStorage.getItem("usuarioLogado") || "null");
        renderizarAvatarWidget(usuarioAtual);
    });
    atualizarXPWidget();
})();

/*---------------- Tema dark — FAB flutuante ----------------*/

// Aplica modo salvo antes do render para evitar flash
var _modoSalvo = localStorage.getItem("modo");
if (_modoSalvo === "dark") {
    document.body.setAttribute("data-mode", "dark");
}

// ── Seletor de temas coloridos (página Configurações) ──
var _temas = document.querySelectorAll(".pf-tema-item");
var _temaSelecionado = "padrao";
var _btnEscolherTema = document.getElementById("btnEscolherTema");

_temas.forEach(function (tema) {
    tema.addEventListener("click", function () {
        _temas.forEach(function (t) { t.classList.remove("ativo"); });
        tema.classList.add("ativo");
        _temaSelecionado = tema.dataset.tema;
    });
});

function aplicarModoVidro(ativo) {
    document.body.setAttribute("data-vidro", ativo ? "on" : "off");
}

if (_btnEscolherTema) {
    _btnEscolherTema.addEventListener("click", function () {
        document.body.setAttribute("data-tema", _temaSelecionado);
        localStorage.setItem("tema", _temaSelecionado);

        var toggleVidro = document.getElementById("toggleVidro");
        var vidroAtivo = toggleVidro ? toggleVidro.checked : localStorage.getItem("vidro") === "on";
        aplicarModoVidro(vidroAtivo);
        localStorage.setItem("vidro", vidroAtivo ? "on" : "off");
    });
}

window.addEventListener("DOMContentLoaded", function () {
    var temaSalvo = localStorage.getItem("tema");
    var modoSalvo = localStorage.getItem("modo");
    var vidroSalvo = localStorage.getItem("vidro");

    if (temaSalvo) {
        document.body.setAttribute("data-tema", temaSalvo);
        _temas.forEach(function (t) {
            t.classList.remove("ativo");
            if (t.dataset.tema === temaSalvo) t.classList.add("ativo");
        });
        _temaSelecionado = temaSalvo;
    }
    if (modoSalvo) {
        document.body.setAttribute("data-mode", modoSalvo);
    }
    if (vidroSalvo) {
        aplicarModoVidro(vidroSalvo === "on");
    }

    // Sincroniza o toggle na página de perfil com o estado salvo
    var toggleVidro = document.getElementById("toggleVidro");
    var estadoVidro = document.getElementById("estadoVidro");
    if (toggleVidro) {
        toggleVidro.checked = vidroSalvo === "on";
        if (estadoVidro) estadoVidro.textContent = vidroSalvo === "on" ? "ON" : "OFF";
    }
});

// ── Botão de alternância claro/escuro (ao lado do user widget) ──
(function () {
    var moonSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    var sunSvg  = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="4" fill="currentColor"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

    var styles = [
        /* ── Botão inline (ao lado do user widget) ── */
        "#theme-fab {",
        "    width: 46px;",
        "    height: 46px;",
        "    border-radius: 50%;",
        "    border: none;",
        "    cursor: pointer;",
        "    background: var(--cor-fundo-card);",
        "    color: var(--cor-principal);",
        "    display: flex;",
        "    align-items: center;",
        "    justify-content: center;",
        "    flex-shrink: 0;",
        "    align-self: center;",
        "    position: relative;",
        "    overflow: visible;",
        "    box-shadow: 0px 4px 4px var(--sombra-caixa), 0 0 0 2px var(--cor-tinte-borda);",
        "    transition: box-shadow 0.35s ease, transform 0.22s cubic-bezier(0.34,1.56,0.64,1), color 0.35s ease;",
        "}",
        "#theme-fab:hover {",
        "    box-shadow: 0px 4px 8px var(--sombra-caixa), 0 0 0 2px var(--cor-principal);",
        "    transform: scale(1.1);",
        "}",
        "#theme-fab:active { transform: scale(0.92); }",
        "body[data-mode='dark']  #theme-fab { box-shadow: 0px 4px 4px var(--sombra-caixa), 0 0 0 2px var(--cor-principal), 0 0 18px rgba(255,195,30,0.35); }",
        "body[data-mode='dark']  #theme-fab:hover { box-shadow: 0px 4px 8px var(--sombra-caixa), 0 0 0 2px var(--cor-principal), 0 0 26px rgba(255,195,30,0.55); }",
        /* ── Fallback fixo (páginas sem user widget) ── */
        "#theme-fab.theme-fab--fixed {",
        "    position: fixed;",
        "    bottom: 28px;",
        "    right: 28px;",
        "    z-index: 99990;",
        "    width: 52px;",
        "    height: 52px;",
        "    background: var(--cor-principal);",
        "    color: var(--cor-texto-claro, #fff);",
        "    align-self: unset;",
        "    box-shadow: 0 4px 20px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10);",
        "}",
        "body[data-mode='dark']  #theme-fab.theme-fab--fixed { box-shadow: 0 4px 24px rgba(255,195,30,0.50), 0 2px 10px rgba(0,0,0,0.35); }",
        "body[data-mode='light'] #theme-fab.theme-fab--fixed { box-shadow: 0 4px 24px rgba(54,115,115,0.32), 0 2px 8px rgba(0,0,0,0.12); }",
        "#theme-fab.theme-fab--fixed:hover { box-shadow: 0 6px 28px rgba(0,0,0,0.24); }",
        /* ── Track dos ícones ── */
        ".theme-fab-track {",
        "    position: relative;",
        "    width: 22px;",
        "    height: 22px;",
        "}",
        ".theme-fab-icon {",
        "    position: absolute;",
        "    inset: 0;",
        "    display: flex;",
        "    align-items: center;",
        "    justify-content: center;",
        "    transition: transform 0.55s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease;",
        "    will-change: transform, opacity;",
        "}",
        /* Modo claro: lua visível, sol entra de baixo */
        "body[data-mode='light'] .theme-fab-moon { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }",
        "body[data-mode='light'] .theme-fab-sun  { transform: translateY(46px) rotate(180deg) scale(0.15); opacity: 0; }",
        /* Modo escuro: sol visível, lua sai para cima */
        "body[data-mode='dark']  .theme-fab-sun  { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }",
        "body[data-mode='dark']  .theme-fab-moon { transform: translateY(-46px) rotate(-180deg) scale(0.15); opacity: 0; }",
        /* ── Tooltip ── */
        ".theme-fab-tooltip {",
        "    position: absolute;",
        "    bottom: calc(100% + 10px);",
        "    left: 50%;",
        "    transform: translateX(-50%) translateY(6px);",
        "    white-space: nowrap;",
        "    background: var(--cor-fundo-card, #fff);",
        "    color: var(--cor-texto-principal, #1a1a1a);",
        "    font-size: 0.72rem;",
        "    font-weight: 600;",
        "    font-family: 'Open Sans', sans-serif;",
        "    padding: 5px 10px;",
        "    border-radius: 7px;",
        "    box-shadow: 0 4px 14px rgba(0,0,0,0.12);",
        "    border: 1px solid var(--cor-tinte-borda, rgba(0,0,0,0.08));",
        "    pointer-events: none;",
        "    opacity: 0;",
        "    transition: opacity 0.2s ease, transform 0.2s ease;",
        "    z-index: 10;",
        "}",
        "#theme-fab:hover .theme-fab-tooltip { opacity: 1; transform: translateX(-50%) translateY(0); }"
    ].join("\n");

    var fabHtml = '<button id="theme-fab" aria-label="Alternar modo claro/escuro">'
        + '<span class="theme-fab-track">'
        + '<span class="theme-fab-icon theme-fab-moon">' + moonSvg + '</span>'
        + '<span class="theme-fab-icon theme-fab-sun">'  + sunSvg  + '</span>'
        + '</span>'
        + '<span class="theme-fab-tooltip" id="theme-fab-tooltip"></span>'
        + '</button>';

    function atualizarTooltip() {
        var tip = document.getElementById("theme-fab-tooltip");
        if (!tip) return;
        tip.textContent = document.body.getAttribute("data-mode") === "dark"
            ? "Modo claro"
            : "Modo escuro";
    }

    function injectFab() {
        if (document.getElementById("theme-fab")) return;

        var styleEl = document.createElement("style");
        styleEl.id = "theme-fab-styles";
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);

        var userWidget = document.getElementById("userWidget");
        if (userWidget) {
            var parentEl = userWidget.parentElement;
            if (parentEl && parentEl.classList.contains('top-actions')) {
                // Estrutura correta: injeta antes do user-widget dentro de top-actions
                userWidget.insertAdjacentHTML("beforebegin", fabHtml);
            } else {
                // Estrutura sem wrapper: cria top-actions agrupando fab + user-widget
                var wrapper = document.createElement('div');
                wrapper.className = 'top-actions';
                parentEl.insertBefore(wrapper, userWidget);
                wrapper.insertAdjacentHTML("afterbegin", fabHtml);
                wrapper.appendChild(userWidget);
            }
        } else {
            // Fallback fixo para páginas sem user widget
            document.body.insertAdjacentHTML("beforeend", fabHtml);
            document.getElementById("theme-fab").classList.add("theme-fab--fixed");
        }

        atualizarTooltip();

        document.getElementById("theme-fab").addEventListener("click", function () {
            var atual = document.body.getAttribute("data-mode");
            var novo  = atual === "dark" ? "light" : "dark";
            document.body.setAttribute("data-mode", novo);
            localStorage.setItem("modo", novo);
            atualizarTooltip();
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", injectFab);
    } else {
        injectFab();
    }
})();

/*---------------- Toast de Status de Atualização ----------------*/
(function () {
    // Cria toast persistente de status de atualização
    const updateToastHtml = `
    <div id="mf-update-toast" style="
        position:fixed; top:80px; right:24px; z-index:99999;
        background:var(--cor-fundo-card,#fff);
        border:1.5px solid var(--cor-principal,#6366f1);
        border-radius:16px;
        box-shadow:0 12px 40px rgba(0,0,0,0.25);
        padding:20px 24px;
        min-width:320px; max-width:380px;
        display:none;
        animation:mfToastSlide 0.3s ease;">
        <div style="display:flex; align-items:flex-start; gap:14px;">
            <div id="mf-toast-spinner" style="
                width:40px; height:40px; border-radius:50%;
                border:3px solid var(--cor-tinte-borda,#e2e8f0);
                border-top-color:var(--cor-principal,#6366f1);
                animation:mfSpin 0.8s linear infinite;
                flex-shrink:0;
                margin-top:2px;">
            </div>
            <div style="flex:1; min-width:0;">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
                    <h3 id="mf-toast-title" style="
                        font-size:1rem; font-weight:700; margin:0;
                        color:var(--cor-titulo);">
                        Atualizando...
                    </h3>
                    <button id="mf-toast-close" title="Fechar" style="
                        background:none; border:none; cursor:pointer;
                        color:var(--cor-texto-secundario); font-size:1.3rem;
                        padding:0; line-height:1; width:20px; height:20px;
                        display:flex; align-items:center; justify-content:center;
                        transition:color 0.2s;">✕</button>
                </div>
                <p id="mf-toast-message" style="
                    font-size:0.85rem; color:var(--cor-texto-secundario);
                    margin:0; line-height:1.5;">
                    Baixando nova versão...
                </p>
                <div id="mf-toast-progress-wrap" style="
                    margin-top:12px; width:100%; height:6px;
                    background:var(--cor-tinte-borda,#e2e8f0);
                    border-radius:3px; overflow:hidden;">
                    <div id="mf-toast-progress-bar" style="
                        height:100%; width:0%; border-radius:3px;
                        background:linear-gradient(90deg, var(--cor-principal,#6366f1), var(--cor-principal-hover,#4f46e5));
                        transition:width 0.4s ease;">
                    </div>
                </div>
                <span id="mf-toast-percentage" style="
                    display:block; margin-top:6px; font-size:0.75rem;
                    color:var(--cor-texto-secundario); font-weight:600;">
                    0%
                </span>
            </div>
        </div>
    </div>
    <style>
        @keyframes mfToastSlide {
            from { opacity:0; transform:translateX(100px); }
            to   { opacity:1; transform:translateX(0); }
        }
        @keyframes mfSpin {
            0%   { transform:rotate(0deg); }
            100% { transform:rotate(360deg); }
        }
        #mf-update-toast.success #mf-toast-spinner {
            border:3px solid transparent;
            background:var(--green-500,#22c55e);
            display:flex; align-items:center; justify-content:center;
            animation:none;
        }
        #mf-update-toast.success #mf-toast-spinner::after {
            content:'✓';
            color:#fff;
            font-size:1.4rem;
            font-weight:700;
        }
        #mf-toast-close:hover {
            color:var(--red-600,#dc2626);
        }
    </style>`;

    document.body.insertAdjacentHTML('beforeend', updateToastHtml);

    const toast = document.getElementById('mf-update-toast');
    const toastTitle = document.getElementById('mf-toast-title');
    const toastMessage = document.getElementById('mf-toast-message');
    const toastProgress = document.getElementById('mf-toast-progress-bar');
    const toastPercentage = document.getElementById('mf-toast-percentage');
    const toastSpinner = document.getElementById('mf-toast-spinner');
    const toastClose = document.getElementById('mf-toast-close');

    // Botão X para fechar manualmente
    toastClose.addEventListener('click', function() {
        hideUpdateToast();
    });

    // Verifica se há atualização em progresso ao carregar a página
    async function checkUpdateInProgress() {
        const updateStatus = localStorage.getItem('mf-update-status');
        if (updateStatus) {
            const status = JSON.parse(updateStatus);

            // Verifica se a versão armazenada mudou (indica que a atualização foi concluída)
            try {
                const res = await fetch('https://my-finance-api-eqdubfc7bvg6brdw.brazilsouth-01.azurewebsites.net/api/update/check');
                if (res.ok) {
                    const info = await res.json();
                    const currentVersion = info.currentVersion;
                    const storedVersion = localStorage.getItem('mf-app-version');

                    if (currentVersion && storedVersion && currentVersion !== storedVersion) {
                        // Versão mudou! A atualização foi bem-sucedida
                        localStorage.setItem('mf-app-version', currentVersion);
                        localStorage.removeItem('mf-update-status');
                        return; // Não mostra o toast
                    }

                    // Armazena a versão atual se ainda não foi armazenada
                    if (currentVersion && !storedVersion) {
                        localStorage.setItem('mf-app-version', currentVersion);
                    }
                }
            } catch (e) {
                // Se falhar ao buscar a versão, continua com a lógica de timeout
            }

            // Se a versão não mudou mas já passou tempo suficiente, limpa o status
            if (status.timestamp) {
                const elapsed = Date.now() - status.timestamp;
                if (elapsed > 60000) { // 60 segundos
                    localStorage.removeItem('mf-update-status');
                    return;
                }
            }

            if (status.inProgress) {
                showUpdateToast(status.title, status.message, status.progress);
            }
        }
    }

    function showUpdateToast(title, message, progress) {
        toast.style.display = 'block';
        toastTitle.textContent = title;
        toastMessage.textContent = message;
        toastProgress.style.width = progress + '%';
        toastPercentage.textContent = Math.round(progress) + '%';

        // Salva o estado no localStorage com timestamp
        localStorage.setItem('mf-update-status', JSON.stringify({
            inProgress: true,
            title: title,
            message: message,
            progress: progress,
            timestamp: Date.now()
        }));
    }

    function updateToastProgress(progress) {
        toastProgress.style.width = progress + '%';
        toastPercentage.textContent = Math.round(progress) + '%';

        const status = JSON.parse(localStorage.getItem('mf-update-status') || '{}');
        status.progress = progress;
        localStorage.setItem('mf-update-status', JSON.stringify(status));
    }

    function completeUpdateToast() {
        toast.classList.add('success');
        toastTitle.textContent = 'Atualização Concluída!';
        toastMessage.textContent = 'Reiniciando aplicação...';
        toastProgress.style.width = '100%';
        toastPercentage.textContent = '100%';

        localStorage.removeItem('mf-update-status');

        setTimeout(function() {
            toast.style.display = 'none';
            toast.classList.remove('success');
        }, 3000);
    }

    function hideUpdateToast() {
        toast.style.display = 'none';
        localStorage.removeItem('mf-update-status');
    }

    // Exporta funções globalmente
    window._showUpdateToast = showUpdateToast;
    window._updateToastProgress = updateToastProgress;
    window._completeUpdateToast = completeUpdateToast;
    window._hideUpdateToast = hideUpdateToast;

    // Verifica ao carregar
    checkUpdateInProgress();
})();

/*---------------- Ícone de Notificações ----------------*/
(function () {
    // Cria o ícone de notificações dinamicamente
    const notificationIconHtml = `
    <div id="mf-notification-icon" style="
        position:relative; cursor:pointer; margin-right:12px;
        width:40px; height:40px; border-radius:50%;
        display:flex; align-items:center; justify-content:center;
        background:var(--cor-fundo-card,#fff);
        border:1.5px solid var(--cor-tinte-borda,#e2e8f0);
        transition:all 0.2s ease;">
        <i class='bx bx-bell' style="font-size:1.3rem; color:var(--cor-texto-principal);"></i>
        <span id="mf-notification-badge" style="
            position:absolute; top:-4px; right:-4px;
            background:var(--red-600,#dc2626); color:#fff;
            border-radius:50%; width:20px; height:20px;
            display:none; align-items:center; justify-content:center;
            font-size:0.7rem; font-weight:700; border:2px solid var(--cor-fundo-pagina,#fff);">
            0
        </span>
    </div>
    <style>
        #mf-notification-icon:hover {
            background:var(--cor-hover,#f1f5f9);
            border-color:var(--cor-principal,#6366f1);
        }
        #mf-notification-icon:hover i {
            color:var(--cor-principal,#6366f1);
        }
    </style>`;

    // Injeta o ícone ao lado do user widget em todas as páginas
    function injectNotificationIcon() {
        const topActions = document.querySelector('.top-actions');
        if (topActions) {
            topActions.insertAdjacentHTML('afterbegin', notificationIconHtml);

            const notifIcon = document.getElementById('mf-notification-icon');
            if (notifIcon) {
                notifIcon.addEventListener('click', function() {
                    window._showUpdateNotifications();
                });
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectNotificationIcon);
    } else {
        injectNotificationIcon();
    }

    // Função global para atualizar contador de notificações
    window._updateNotificationBadge = function(count) {
        const badge = document.getElementById('mf-notification-badge');
        if (badge) {
            if (count > 0) {
                badge.textContent = count > 9 ? '9+' : count;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    };
})();

/*---------------- Auto-Update: verificação e notificação ----------------*/
(function () {
    const CHECK_INTERVAL_MS = 30 * 60 * 1000; // 30 minutos
    const SNOOZE_DURATION_MS = 12 * 60 * 60 * 1000; // 12 horas
    const API_BASE = 'https://my-finance-api-eqdubfc7bvg6brdw.brazilsouth-01.azurewebsites.net';

    let _updateInfo = null;
    let _isDismissed = false;

    // ── Injeta o banner de atualização no DOM ──
    const bannerHtml = `
    <div id="mf-update-banner" style="
        display:none; position:fixed; bottom:24px; right:24px; z-index:99998;
        background:var(--cor-fundo-card,#fff);
        border:1.5px solid var(--cor-principal,#6366f1);
        border-radius:16px;
        box-shadow:0 8px 32px rgba(0,0,0,0.18);
        padding:18px 22px 16px;
        min-width:300px; max-width:360px;
        animation:mfBannerIn 0.25s ease;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            <span style="
                background:var(--cor-principal,#6366f1);
                color:#fff; border-radius:50%; width:34px;height:34px;
                display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <i class='bx bx-cloud-download' style="font-size:1.2rem;"></i>
            </span>
            <div>
                <div style="font-weight:700;font-size:0.95rem;color:var(--cor-titulo);">Nova versão disponível!</div>
                <div id="mf-update-versions" style="font-size:0.78rem;color:var(--cor-texto-secundario);margin-top:2px;"></div>
            </div>
            <button id="mf-update-close" title="Fechar" style="
                margin-left:auto;background:none;border:none;cursor:pointer;
                color:var(--cor-texto-secundario);font-size:1.2rem;padding:2px 4px;line-height:1;">✕</button>
        </div>
        <p style="font-size:0.83rem;color:var(--cor-texto-secundario);margin:0 0 14px;line-height:1.5;">
            Clique em <strong>Atualizar agora</strong> para baixar e reiniciar automaticamente.
        </p>
        <button id="mf-update-toggle" style="
            display:none;align-items:center;gap:6px;background:none;border:none;padding:0;
            margin:0 0 10px;cursor:pointer;font-size:0.82rem;font-weight:600;
            color:var(--cor-principal,#6366f1);">
            <span id="mf-update-toggle-text">Mostrar mais detalhes</span>
            <span id="mf-update-arrow" aria-hidden="true" style="font-size:0.9rem;line-height:1;transition:transform 0.18s ease;">
                <i class='bx bx-chevron-down'></i>
            </span>
        </button>
        <div id="mf-update-details" style="
            display:none;max-height:160px;overflow:auto;
            border:1px solid var(--cor-tinte-borda,#e2e8f0);border-radius:8px;
            padding:10px 12px;margin:0 0 12px;
            background:var(--cor-fundo-pagina,#f8fafc);font-size:0.8rem;
            color:var(--cor-texto-secundario);line-height:1.45;white-space:pre-line;"></div>
        <div style="display:flex;gap:8px;">
            <button id="mf-update-btn" style="
                flex:1;padding:9px 0;border-radius:9px;border:none;cursor:pointer;
                background:var(--cor-principal,#6366f1);color:#fff;
                font-size:0.88rem;font-weight:600;transition:opacity 0.18s;">
                <i class='bx bx-refresh'></i> Atualizar agora
            </button>
            <button id="mf-update-later" style="
                padding:9px 14px;border-radius:9px;cursor:pointer;
                background:var(--cor-fundo-pagina);color:var(--cor-texto-principal);
                font-size:0.88rem;font-weight:600;border:1px solid var(--cor-tinte-borda,#ccc);
                transition:background 0.18s;">
                Depois
            </button>
        </div>
        <div id="mf-update-progress" style="display:none;margin-top:12px;text-align:center;">
            <div style="
                width:100%;height:6px;border-radius:3px;
                background:var(--cor-tinte-borda,#e2e8f0);overflow:hidden;">
                <div id="mf-update-bar" style="
                    height:100%;width:0%;border-radius:3px;
                    background:var(--cor-principal,#6366f1);
                    transition:width 0.4s ease;"></div>
            </div>
            <span id="mf-update-status" style="font-size:0.78rem;color:var(--cor-texto-secundario);margin-top:6px;display:block;">
                Baixando atualização...
            </span>
        </div>
    </div>
    <style>
        @keyframes mfBannerIn {
            from { opacity:0; transform:translateY(16px) scale(0.97); }
            to   { opacity:1; transform:translateY(0)   scale(1);     }
        }
        #mf-update-btn:hover   { opacity:0.85; }
        #mf-update-later:hover { background:var(--cor-hover,#e2e8f0)!important; }
    </style>`;

    document.body.insertAdjacentHTML('beforeend', bannerHtml);

    const banner        = document.getElementById('mf-update-banner');
    const btnAtualizar  = document.getElementById('mf-update-btn');
    const btnDepois     = document.getElementById('mf-update-later');
    const btnFechar     = document.getElementById('mf-update-close');
    const versionsEl    = document.getElementById('mf-update-versions');
    const btnDetalhes   = document.getElementById('mf-update-toggle');
    const txtDetalhes   = document.getElementById('mf-update-toggle-text');
    const setaDetalhes  = document.getElementById('mf-update-arrow');
    const detailsEl     = document.getElementById('mf-update-details');
    const progressArea  = document.getElementById('mf-update-progress');
    const progressBar   = document.getElementById('mf-update-bar');
    const statusEl      = document.getElementById('mf-update-status');

    let _downloadUrl = null;
    let _showingDetails = false;

    function setDetalhesVisiveis(visible) {
        _showingDetails = !!visible;
        detailsEl.style.display = _showingDetails ? 'block' : 'none';
        setaDetalhes.style.transform = _showingDetails ? 'rotate(180deg)' : 'rotate(0deg)';
        txtDetalhes.textContent = _showingDetails
            ? 'Ocultar detalhes'
            : 'Mostrar mais detalhes';
    }

    function mostrarBanner(info) {
        _updateInfo = info;
        versionsEl.textContent = 'Atual: v' + info.currentVersion + '  →  Nova: v' + info.latestVersion;
        _downloadUrl = info.downloadUrl || null;

        const releaseNotes = (info.releaseNotes || '').trim();
        if (releaseNotes) {
            detailsEl.textContent = releaseNotes;
            btnDetalhes.style.display = 'inline-flex';
            setDetalhesVisiveis(false);
        } else {
            detailsEl.textContent = '';
            btnDetalhes.style.display = 'none';
            setDetalhesVisiveis(false);
        }

        banner.style.display = 'block';

        // Remove a notificação do badge quando o banner é mostrado
        if (_isDismissed) {
            _isDismissed = false;
            localStorage.removeItem('mf-update-dismissed');
            window._updateNotificationBadge(0);
        }
    }

    function ocultarBanner() {
        banner.style.display = 'none';
    }

    function dismissarAtualizacao() {
        _isDismissed = true;
        localStorage.setItem('mf-update-dismissed', 'true');
        ocultarBanner();

        // Adiciona ao contador de notificações
        if (_updateInfo) {
            window._updateNotificationBadge(1);
        }
    }

    function adiarAtualizacao() {
        localStorage.setItem('mf-update-snoozed', Date.now().toString());
        ocultarBanner();
    }

    btnFechar.addEventListener('click', dismissarAtualizacao);
    btnDepois.addEventListener('click', adiarAtualizacao);
    btnDetalhes.addEventListener('click', function () {
        setDetalhesVisiveis(!_showingDetails);
    });

    btnAtualizar.addEventListener('click', async function () {
        if (!_downloadUrl) return;

        // Desabilita botões e esconde o banner
        btnAtualizar.disabled = true;
        btnDepois.disabled    = true;
        btnFechar.disabled    = true;
        ocultarBanner();

        // Mostra toast de atualização persistente
        window._showUpdateToast('Atualizando MyFinance', 'Iniciando download da nova versão...', 0);

        // Simula progresso visual enquanto o download ocorre no backend
        let pct = 0;
        const interval = setInterval(function() {
            pct = Math.min(pct + Math.random() * 5, 85);
            window._updateToastProgress(pct);
        }, 500);

        try {
            // Aguarda 800ms para dar tempo do toast aparecer
            await new Promise(resolve => setTimeout(resolve, 800));

            window._showUpdateToast('Baixando Atualização', 'Fazendo download do servidor...', pct);

            const res = await fetch(API_BASE + '/api/update/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ downloadUrl: _downloadUrl })
            });

            clearInterval(interval);

            if (res.ok) {
                window._showUpdateToast('Download Concluído', 'Preparando atualização...', 90);

                await new Promise(resolve => setTimeout(resolve, 1000));

                window._completeUpdateToast();

                // Monitora se a aplicação realmente fechou
                setTimeout(function() {
                    // Se ainda estiver aqui após 10s, mostra mensagem
                    window._showUpdateToast('Aguardando Fechamento', 'Aguarde o aplicativo reiniciar...', 100);
                }, 10000);
            } else {
                throw new Error('Falha na requisição: ' + res.status);
            }
        } catch (e) {
            clearInterval(interval);
            window._hideUpdateToast();

            // Reativa botões do banner
            btnAtualizar.disabled = false;
            btnDepois.disabled    = false;
            btnFechar.disabled    = false;
            mostrarBanner(_updateInfo);

            // Mostra erro no banner original
            progressBar.style.width = '0%';
            progressBar.style.background = '#ef4444';
            statusEl.textContent = 'Erro ao atualizar. Tente novamente.';
            progressArea.style.display = 'block';

            console.error('[Update] Erro:', e);
        }
    });

    // ── Verifica se há atualização disponível ──
    async function verificarAtualizacao() {
        try {
            const res = await fetch(API_BASE + '/api/update/check');
            if (!res.ok) return;
            const info = await res.json();

            if (info.hasUpdate && info.downloadUrl) {
                _updateInfo = info;

                // Verifica se o usuário clicou em X (dismissed)
                const dismissed = localStorage.getItem('mf-update-dismissed');
                if (dismissed === 'true') {
                    _isDismissed = true;
                    window._updateNotificationBadge(1);
                    return; // Não mostra o banner automaticamente
                }

                // Verifica se o usuário clicou em "depois" recentemente
                const snoozed = localStorage.getItem('mf-update-snoozed');
                if (snoozed) {
                    const snoozedTime = parseInt(snoozed, 10);
                    const elapsed = Date.now() - snoozedTime;
                    if (elapsed < SNOOZE_DURATION_MS) {
                        return; // Ainda no período de adiamento
                    }
                    localStorage.removeItem('mf-update-snoozed');
                }

                // Mostra o banner se não foi dismissed nem snoozed
                mostrarBanner(info);
            } else {
                // Se não há atualização, limpa o dismissed e badge
                _isDismissed = false;
                _updateInfo = null;
                localStorage.removeItem('mf-update-dismissed');
                window._updateNotificationBadge(0);
            }
        } catch (e) {
            // Silencioso: sem internet ou backend ainda não inicializado
        }
    }

    // ── Função para mostrar notificações quando clicar no sino ──
    window._showUpdateNotifications = function() {
        if (_updateInfo && _isDismissed) {
            mostrarBanner(_updateInfo);
        }
    };

    // Primeira verificação após 10s (dá tempo ao Spring Boot inicializar)
    setTimeout(verificarAtualizacao, 10000);
    // Verificações subsequentes a cada 30 minutos
    setInterval(verificarAtualizacao, CHECK_INTERVAL_MS);
})();

/*---------------- Skeleton Shimmer — carregamento estilo Instagram ----------------*/
(function () {
    // Seletores dos cards que recebem o efeito enquanto os dados carregam
    var SK_SEL = [
        '.KPI',
        '.campo-grafico',
        '.kpi-saude-card',
        '.historia-financeira-card',
        '.pf-card'
    ].join(',');

    var _pending     = 0;
    var _removeTimer = null;
    var _safetyTimer = null;

    function _apply() {
        var els = document.querySelectorAll(SK_SEL);
        for (var i = 0; i < els.length; i++) {
            els[i].classList.add('mf-sk');
        }
        // Segurança: remove skeleton após 5s no máximo, independente dos fetches
        clearTimeout(_safetyTimer);
        _safetyTimer = setTimeout(_remove, 5000);
    }

    function _remove() {
        clearTimeout(_removeTimer);
        clearTimeout(_safetyTimer);
        var els = document.querySelectorAll('.mf-sk');
        for (var i = 0; i < els.length; i++) {
            els[i].classList.remove('mf-sk');
        }
    }

    function _scheduleRemove() {
        if (_pending > 0) return;
        clearTimeout(_removeTimer);
        // pequeno delay para o JS da página processar a resposta e renderizar o DOM
        _removeTimer = setTimeout(_remove, 450);
    }

    // Intercepta window.fetch para rastrear requisições pendentes
    var _origFetch = window.fetch;
    window.fetch = function () {
        _pending++;
        clearTimeout(_removeTimer);
        var p = _origFetch.apply(this, arguments);
        p.then(
            function (r) { _pending--; _scheduleRemove(); return r; },
            function (e) { _pending--; _scheduleRemove(); throw e; }
        );
        return p;
    };

    // Aplica skeleton assim que o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _apply);
    } else {
        _apply();
    }
})();

