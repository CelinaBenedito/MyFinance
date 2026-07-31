const navbar = document.getElementById("navbar");
const main = document.getElementById("main");
const home = document.getElementById("home");
const reg = document.getElementById("reg");
const add = document.getElementById("add");
const agenda = document.getElementById("agenda");
const config = document.getElementById("config");
const tema = document.getElementById("tema");
const caixinhaN = document.getElementById("caixinhas"); // pode ser null em páginas sem o item

let ativo = false;

navbar.style.width = "70px";
home.style.display = "none";
reg.style.display = "none";
add.style.display = "none";
agenda.style.display = "none";
config.style.display = "none";
tema.style.display = "none";
if (caixinhaN) caixinhaN.style.display = "none";
main.style.marginLeft = "70px";


function sidebarFunction() {
    console.log("Entrei na funciton", ativo)
    if (!ativo) {
        ativo = true;

        navbar.style.width = "290px";
        main.style.marginLeft = "290px";
        home.style.display = "";
        reg.style.display = "";
        add.style.display = "";
        agenda.style.display = "";
        config.style.display = "";
        tema.style.display = "";
        if (caixinhaN) caixinhaN.style.display = "";

        console.log("Abriu", ativo);

    } else {
        ativo = false;

        navbar.style.width = "70px";
        main.style.marginLeft = "70px";
        home.style.display = "none";
        reg.style.display = "none";
        add.style.display = "none";
        agenda.style.display = "none";
        config.style.display = "none";
        tema.style.display = "none";
        if (caixinhaN) caixinhaN.style.display = "none";

        console.log("Fechou", ativo);
    }

}

/*---------------- Modal de confirmação de Logout ----------------*/
(function () {
    // Cria o modal de confirmação de logout dinamicamente
    const modalHtml = `
    <div id="uwLogoutOverlay" style="
        display:none; position:fixed; inset:0; z-index:99999;
        background:rgba(0,0,0,0.45); backdrop-filter:blur(2px);
        align-items:center; justify-content:center;">
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
                Seu perfil continuará salvo neste dispositivo.
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
        // Encerra apenas a sessão atual — o perfil permanece salvo para seleção futura
        localStorage.removeItem('usuarioLogado');
        window.location.href = 'index.html';
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
                : `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`;
            uwAvatar.innerHTML = `<img src="${urlFinal}" alt="Foto de perfil" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
        } else {
            uwAvatar.innerHTML = "<i class='bx bx-user' style='font-size:1.6rem; color:var(--cor-principal);'></i>";
        }
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
            const res = await fetch(`http://localhost:8080/usuarios/calculo-xp/${user.id}`);
            if (!res.ok) {
                uwXp.style.width = "0%";
                uwLvl.textContent = "LVL 1";
                return;
            }

            const xp = Number(await res.json());
            const info = calcularNivelEProgresso(xp);

            uwXp.style.width = `${info.progresso.toFixed(2)}%`;
            uwLvl.textContent = `LVL ${info.nivel}`;
            uwLvl.title = `${Math.floor(info.xpNoNivel)}/${info.xpProximoNivel} XP`;
        } catch (e) {
            console.error("Erro ao atualizar XP:", e);
        }
    }

    window.atualizarXPWidget = atualizarXPWidget;
    window.addEventListener("xp:refresh", atualizarXPWidget);
    window.addEventListener("usuario:imagemAtualizada", () => {
        const usuarioAtual = JSON.parse(localStorage.getItem("usuarioLogado") || "null");
        renderizarAvatarWidget(usuarioAtual);
    });
    atualizarXPWidget();
})();

/*---------------- Tema dark ----------------*/
const modoSalvo = localStorage.getItem("modo");

if (modoSalvo === "dark") {
    document.body.setAttribute("data-mode", "dark");
}

const temas = document.querySelectorAll(".pf-tema-item");
const btnEscolher = document.getElementById("btnEscolherTema");

let temaSelecionado = "padrao";

temas.forEach((tema) => {
    tema.addEventListener("click", () => {
        temas.forEach(t => t.classList.remove("ativo"));
        tema.classList.add("ativo");
        temaSelecionado = tema.dataset.tema;
    });
});

document.getElementById("toggleTheme").addEventListener("click", () => {

    const modo =  document.body.getAttribute("data-mode") == "dark" ? "light" : "dark";
    document.body.setAttribute("data-mode", modo);
    localStorage.setItem("modo", modo);
    atualizarIconeTema();
    console.log("mudei")
});

window.addEventListener("DOMContentLoaded", () => {

    const temaSalvo = localStorage.getItem("tema");
    const modoSalvo = localStorage.getItem("modo");

    if (temaSalvo) {
        document.body.setAttribute("data-tema", temaSalvo);
        temas.forEach(t => {
            t.classList.remove("ativo");

            if (t.dataset.tema === temaSalvo) {
                t.classList.add("ativo");
            }
        });
        temaSelecionado = temaSalvo;
    }

    if (modoSalvo) {
        document.body.setAttribute("data-mode", modoSalvo);
        atualizarIconeTema();
        console.log("mudei 2")
    }
});

function atualizarIconeTema() {
    const icone = document.getElementById("icone");
    const modoSalvo = localStorage.getItem("modo");
    if (modoSalvo === "dark") {
        icone.innerHTML = "<i class='bx bx-sun'></i>";
            console.log("cheguei 2")

    } else {
        icone.innerHTML = "<i class='bx bx-moon'></i>";
            console.log("cheguei 1")

    }
}

atualizarIconeTema();

/*---------------- Auto-Update: verificação e notificação ----------------*/
(function () {
    const CHECK_INTERVAL_MS = 30 * 60 * 1000; // 30 minutos
    const API_BASE = 'http://localhost:8080';

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
    const progressArea  = document.getElementById('mf-update-progress');
    const progressBar   = document.getElementById('mf-update-bar');
    const statusEl      = document.getElementById('mf-update-status');

    let _downloadUrl = null;

    function mostrarBanner(info) {
        versionsEl.textContent = 'Atual: v' + info.currentVersion + '  →  Nova: v' + info.latestVersion;
        banner.style.display = 'block';
    }

    function ocultarBanner() {
        banner.style.display = 'none';
    }

    btnFechar.addEventListener('click', ocultarBanner);
    btnDepois.addEventListener('click', ocultarBanner);

    btnAtualizar.addEventListener('click', async function () {
        if (!_downloadUrl) return;

        btnAtualizar.disabled = true;
        btnDepois.disabled    = true;
        btnFechar.disabled    = true;
        progressArea.style.display = 'block';

        // Simula progresso visual enquanto o download ocorre no backend
        let pct = 0;
        const interval = setInterval(function() {
            pct = Math.min(pct + Math.random() * 8, 85);
            progressBar.style.width = pct + '%';
        }, 400);

        try {
            statusEl.textContent = 'Baixando atualização...';
            const res = await fetch(API_BASE + '/api/update/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ downloadUrl: _downloadUrl })
            });

            clearInterval(interval);

            if (res.ok) {
                progressBar.style.width = '100%';
                statusEl.textContent = 'Atualização baixada! Reiniciando a aplicação...';
            } else {
                throw new Error('Falha na requisição: ' + res.status);
            }
        } catch (e) {
            clearInterval(interval);
            progressBar.style.width = '0%';
            progressBar.style.background = '#ef4444';
            statusEl.textContent = 'Erro ao atualizar. Tente novamente.';
            btnAtualizar.disabled = false;
            btnDepois.disabled    = false;
            btnFechar.disabled    = false;
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
                _downloadUrl = info.downloadUrl;
                mostrarBanner(info);
            }
        } catch (e) {
            // Silencioso: sem internet ou backend ainda não inicializado
        }
    }

    // Primeira verificação após 10s (dá tempo ao Spring Boot inicializar)
    setTimeout(verificarAtualizacao, 10000);
    // Verificações subsequentes a cada 30 minutos
    setInterval(verificarAtualizacao, CHECK_INTERVAL_MS);
})();
