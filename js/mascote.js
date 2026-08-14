/**
 * mascote.js — Gerenciador de Mascote do MyFinance
 * Define todos os mascotes disponíveis, aplica imagens em todo o site
 * e gerencia o modo especial Vampiro (morcegos animados).
 */
(function () {
    'use strict';

    // ══ Registro de mascotes ════════════════════════════════════════════
    var MASCOTES = {

        // ── Especial ──────────────────────────────────────────────────
        nenhum: {
            nome: "Nenhum",
            icone: "🚫",
            categoria: "especial",
            preview: null,
            imagens: null
        },
        vampiro: {
            nome: "Vampiro",
            icone: "🦇",
            categoria: "especial",
            preview: null,
            imagens: {
                fofinha: "assets/gif/mascotes/vampiro/fofinha.gif",
                costas:  "assets/gif/mascotes/vampiro/costas.gif",
                correndo: "assets/gif/mascotes/vampiro/correndo.gif"
            },
            especial: "vampiro"
        },

        // ── Eeveelutions ──────────────────────────────────────────────
        glaceon: {
            nome: "Glaceon",
            icone: "❄️",
            categoria: "eeveelution",
            preview: "assets/gif/Gifs da Glaceon/glaceon fofinha.gif",
            imagens: {
                fofinha:    "assets/gif/Gifs da Glaceon/glaceon fofinha.gif",
                costas:     "assets/gif/Gifs da Glaceon/glaceon de costas.gif",
                correndo:   "assets/gif/Gifs da Glaceon/glaceon-correndo-unscreen.gif",
                balancante: "assets/gif/Gifs da Glaceon/glaceon balancante.gif"
            }
        },
        eevee: {
            nome: "Eevee",
            icone: "🟤",
            categoria: "eeveelution",
            preview: "assets/gif/mascotes/eevee/preview.gif",
            imagens: { fofinha: "assets/gif/mascotes/eevee/fofinha.gif", costas: "assets/gif/mascotes/eevee/costas.gif", correndo: "assets/gif/mascotes/eevee/correndo.gif" }
        },
        vaporeon: {
            nome: "Vaporeon",
            icone: "💧",
            categoria: "eeveelution",
            preview: "assets/gif/mascotes/vaporeon/preview.gif",
            imagens: { fofinha: "assets/gif/mascotes/vaporeon/fofinha.gif", costas: "assets/gif/mascotes/vaporeon/costas.gif", correndo: "assets/gif/mascotes/vaporeon/correndo.gif" }
        },
        jolteon: {
            nome: "Jolteon",
            icone: "⚡",
            categoria: "eeveelution",
            preview: "assets/gif/mascotes/jolteon/preview.gif",
            imagens: { fofinha: "assets/gif/mascotes/jolteon/fofinha.gif", costas: "assets/gif/mascotes/jolteon/costas.gif", correndo: "assets/gif/mascotes/jolteon/correndo.gif" }
        },
        flareon: {
            nome: "Flareon",
            icone: "🔥",
            categoria: "eeveelution",
            preview: "assets/gif/mascotes/flareon/preview.gif",
            imagens: { fofinha: "assets/gif/mascotes/flareon/fofinha.gif", costas: "assets/gif/mascotes/flareon/costas.gif", correndo: "assets/gif/mascotes/flareon/correndo.gif" }
        },
        espeon: {
            nome: "Espeon",
            icone: "🔮",
            categoria: "eeveelution",
            preview: "assets/gif/mascotes/espeon/preview.gif",
            imagens: { fofinha: "assets/gif/mascotes/espeon/fofinha.gif", costas: "assets/gif/mascotes/espeon/costas.gif", correndo: "assets/gif/mascotes/espeon/correndo.gif" }
        },
        umbreon: {
            nome: "Umbreon",
            icone: "🌑",
            categoria: "eeveelution",
            preview: "assets/gif/mascotes/umbreon/preview.gif",
            imagens: { fofinha: "assets/gif/mascotes/umbreon/fofinha.gif", costas: "assets/gif/mascotes/umbreon/costas.gif", correndo: "assets/gif/mascotes/umbreon/correndo.gif" }
        },
        leafeon: {
            nome: "Leafeon",
            icone: "🍃",
            categoria: "eeveelution",
            preview: "assets/gif/mascotes/leafeon/preview.gif",
            imagens: { fofinha: "assets/gif/mascotes/leafeon/fofinha.gif", costas: "assets/gif/mascotes/leafeon/costas.gif", correndo: "assets/gif/mascotes/leafeon/correndo.gif" }
        },
        sylveon: {
            nome: "Sylveon",
            icone: "🎀",
            categoria: "eeveelution",
            preview: "assets/gif/Gifs do sylveon/sylveon fofinha.gif",
            imagens: {
                fofinha:    "assets/gif/Gifs do sylveon/sylveon fofinha.gif",
                costas:     "assets/gif/Gifs do sylveon/sylveon poder.gif",
                correndo:   "assets/gif/Gifs do sylveon/sylveon balancante02.gif",
                balancante: "assets/gif/Gifs do sylveon/sylveon balacante.gif"
            }
        },

        // ── Geração 1 ─────────────────────────────────────────────────
        pikachu: {
            nome: "Pikachu",
            icone: "⚡",
            categoria: "gen1",
            preview: "assets/gif/mascotes/pikachu/preview.gif",
            imagens: { fofinha: "assets/gif/mascotes/pikachu/fofinha.gif", costas: "assets/gif/mascotes/pikachu/costas.gif", correndo: "assets/gif/mascotes/pikachu/correndo.gif" }
        },
        charmander: {
            nome: "Charmander",
            icone: "🔥",
            categoria: "gen1",
            preview: "assets/gif/mascotes/charmander/preview.gif",
            imagens: { fofinha: "assets/gif/mascotes/charmander/fofinha.gif", costas: "assets/gif/mascotes/charmander/costas.gif", correndo: "assets/gif/mascotes/charmander/correndo.gif" }
        },
        charizard: {
            nome: "Charizard",
            icone: "🐉",
            categoria: "gen1",
            preview: "assets/gif/mascotes/charizard/preview.gif",
            imagens: { fofinha: "assets/gif/mascotes/charizard/fofinha.gif", costas: "assets/gif/mascotes/charizard/costas.gif", correndo: "assets/gif/mascotes/charizard/correndo.gif" }
        },
        squirtle: {
            nome: "Squirtle",
            icone: "💧",
            categoria: "gen1",
            preview: "assets/gif/mascotes/squirtle/preview.gif",
            imagens: { fofinha: "assets/gif/mascotes/squirtle/fofinha.gif", costas: "assets/gif/mascotes/squirtle/costas.gif", correndo: "assets/gif/mascotes/squirtle/correndo.gif" }
        },
        bulbasaur: {
            nome: "Bulbasaur",
            icone: "🌿",
            categoria: "gen1",
            preview: "assets/gif/mascotes/bulbasaur/preview.gif",
            imagens: { fofinha: "assets/gif/mascotes/bulbasaur/fofinha.gif", costas: "assets/gif/mascotes/bulbasaur/costas.gif", correndo: "assets/gif/mascotes/bulbasaur/correndo.gif" }
        },
        mewtwo: {
            nome: "Mewtwo",
            icone: "👾",
            categoria: "gen1",
            preview: "assets/gif/mascotes/mewtwo/preview.gif",
            imagens: { fofinha: "assets/gif/mascotes/mewtwo/fofinha.gif", costas: "assets/gif/mascotes/mewtwo/costas.gif", correndo: "assets/gif/mascotes/mewtwo/correndo.gif" }
        },
        mew: {
            nome: "Mew",
            icone: "✨",
            categoria: "gen1",
            preview: "assets/gif/mascotes/mew/preview.gif",
            imagens: { fofinha: "assets/gif/mascotes/mew/fofinha.gif", costas: "assets/gif/mascotes/mew/costas.gif", correndo: "assets/gif/mascotes/mew/correndo.gif" }
        },
        gengar: {
            nome: "Gengar",
            icone: "👻",
            categoria: "gen1",
            preview: "assets/gif/mascotes/gengar/preview.gif",
            imagens: { fofinha: "assets/gif/mascotes/gengar/fofinha.gif", costas: "assets/gif/mascotes/gengar/costas.gif", correndo: "assets/gif/mascotes/gengar/correndo.gif" }
        },
        snorlax: {
            nome: "Snorlax",
            icone: "😴",
            categoria: "gen1",
            preview: "assets/gif/mascotes/snorlax/preview.gif",
            imagens: { fofinha: "assets/gif/mascotes/snorlax/fofinha.gif", costas: "assets/gif/mascotes/snorlax/costas.gif", correndo: "assets/gif/mascotes/snorlax/correndo.gif" }
        },
        jigglypuff: {
            nome: "Jigglypuff",
            icone: "🎤",
            categoria: "gen1",
            preview: "assets/gif/mascotes/jigglypuff/preview.gif",
            imagens: { fofinha: "assets/gif/mascotes/jigglypuff/fofinha.gif", costas: "assets/gif/mascotes/jigglypuff/costas.gif", correndo: "assets/gif/mascotes/jigglypuff/correndo.gif" }
        },
        meowth: {
            nome: "Meowth",
            icone: "🪙",
            categoria: "gen1",
            preview: "assets/gif/mascotes/meowth/preview.gif",
            imagens: { fofinha: "assets/gif/mascotes/meowth/fofinha.gif", costas: "assets/gif/mascotes/meowth/costas.gif", correndo: "assets/gif/mascotes/meowth/correndo.gif" }
        },
        psyduck: {
            nome: "Psyduck",
            icone: "🤕",
            categoria: "gen1",
            preview: "assets/gif/mascotes/psyduck/preview.gif",
            imagens: { fofinha: "assets/gif/mascotes/psyduck/fofinha.gif", costas: "assets/gif/mascotes/psyduck/costas.gif", correndo: "assets/gif/mascotes/psyduck/correndo.gif" }
        },
        magikarp: {
            nome: "Magikarp",
            icone: "🐟",
            categoria: "gen1",
            preview: "assets/gif/mascotes/magikarp/preview.gif",
            imagens: { fofinha: "assets/gif/mascotes/magikarp/fofinha.gif", costas: "assets/gif/mascotes/magikarp/costas.gif", correndo: "assets/gif/mascotes/magikarp/correndo.gif" }
        },
        clefairy: {
            nome: "Clefairy",
            icone: "⭐",
            categoria: "gen1",
            preview: "assets/gif/mascotes/clefairy/preview.gif",
            imagens: { fofinha: "assets/gif/mascotes/clefairy/fofinha.gif", costas: "assets/gif/mascotes/clefairy/costas.gif", correndo: "assets/gif/mascotes/clefairy/correndo.gif" }
        },

        // ── Outros Famosos ────────────────────────────────────────────
        togepi: {
            nome: "Togepi",
            icone: "🥚",
            categoria: "outros",
            preview: "assets/gif/mascotes/togepi/preview.gif",
            imagens: { fofinha: "assets/gif/mascotes/togepi/fofinha.gif", costas: "assets/gif/mascotes/togepi/costas.gif", correndo: "assets/gif/mascotes/togepi/correndo.gif" }
        },
        lucario: {
            nome: "Lucario",
            icone: "💪",
            categoria: "outros",
            preview: "assets/gif/mascotes/lucario/preview.gif",
            imagens: { fofinha: "assets/gif/mascotes/lucario/fofinha.gif", costas: "assets/gif/mascotes/lucario/costas.gif", correndo: "assets/gif/mascotes/lucario/correndo.gif" }
        },
        gardevoir: {
            nome: "Gardevoir",
            icone: "🌸",
            categoria: "outros",
            preview: "assets/gif/mascotes/gardevoir/preview.gif",
            imagens: { fofinha: "assets/gif/mascotes/gardevoir/fofinha.gif", costas: "assets/gif/mascotes/gardevoir/costas.gif", correndo: "assets/gif/mascotes/gardevoir/correndo.gif" }
        },
        mimikyu: {
            nome: "Mimikyu",
            icone: "🪄",
            categoria: "outros",
            preview: "assets/gif/mascotes/mimikyu/preview.gif",
            imagens: { fofinha: "assets/gif/mascotes/mimikyu/fofinha.gif", costas: "assets/gif/mascotes/mimikyu/costas.gif", correndo: "assets/gif/mascotes/mimikyu/correndo.gif" }
        },
        greninja: {
            nome: "Greninja",
            icone: "🐸",
            categoria: "outros",
            preview: "assets/gif/mascotes/greninja/preview.gif",
            imagens: { fofinha: "assets/gif/mascotes/greninja/fofinha.gif", costas: "assets/gif/mascotes/greninja/costas.gif", correndo: "assets/gif/mascotes/greninja/correndo.gif" }
        },
        zoroark: {
            nome: "Zoroark",
            icone: "🦊",
            categoria: "outros",
            preview: "assets/gif/mascotes/zoroark/preview.gif",
            imagens: { fofinha: "assets/gif/mascotes/zoroark/fofinha.gif", costas: "assets/gif/mascotes/zoroark/costas.gif", correndo: "assets/gif/mascotes/zoroark/correndo.gif" }
        }
    };

    var CATEGORIAS = {
        especial:    "⭐ Especial",
        eeveelution: "🌿 Eeveelutions",
        gen1:        "🔴 Geração 1",
        outros:      "🌍 Outros Famosos"
    };

    var ORDEM_CATEGORIAS = ["especial", "eeveelution", "gen1", "outros"];

    // Aplica data-mascote imediatamente para evitar flash
    var _salvo = localStorage.getItem("mascote") || "glaceon";
    document.body.setAttribute("data-mascote", _salvo);

    // ══ Morcegos (modo Vampiro) ═════════════════════════════════════════

    function _removerMorcegos() {
        var el = document.getElementById("mascote-bat-container");
        if (el) el.remove();
    }

    function _injetarMorcegos() {
        if (document.getElementById("mascote-bat-container")) return;

        var container = document.createElement("div");
        container.id = "mascote-bat-container";
        container.className = "mascote-bat-container";

        var configs = [
            { top: "6%",  delay: "0s",    dur: "11s",  size: "1.8rem", rtl: false },
            { top: "15%", delay: "2.5s",  dur: "14s",  size: "2.2rem", rtl: true  },
            { top: "28%", delay: "5s",    dur: "9s",   size: "1.5rem", rtl: false },
            { top: "42%", delay: "7.5s",  dur: "13s",  size: "2rem",   rtl: true  },
            { top: "58%", delay: "1s",    dur: "10s",  size: "1.6rem", rtl: false },
            { top: "72%", delay: "9s",    dur: "12s",  size: "2.3rem", rtl: true  },
            { top: "85%", delay: "4s",    dur: "8s",   size: "1.4rem", rtl: false },
            { top: "20%", delay: "11s",   dur: "15s",  size: "1.9rem", rtl: true  }
        ];

        configs.forEach(function (cfg) {
            var bat = document.createElement("div");
            bat.className = "mascote-bat " + (cfg.rtl ? "rtl" : "ltr");
            bat.textContent = "🦇";
            bat.style.top = cfg.top;
            bat.style.animationDuration = cfg.dur;
            bat.style.animationDelay = cfg.delay;
            bat.style.fontSize = cfg.size;
            container.appendChild(bat);
        });

        document.body.appendChild(container);
    }

    // ══ Aplicação do mascote ════════════════════════════════════════════

    // Retorna uma imagem ainda não usada por outra pose; evita repetição
    function _resolverFallback(imagens, tipoAusente) {
        var POSES = ["fofinha", "costas", "correndo", "balancante"];
        var jaUsados = {};
        POSES.forEach(function(p) {
            if (p !== tipoAusente && imagens[p]) jaUsados[imagens[p]] = true;
        });
        // Tenta encontrar alguma imagem ainda não atribuída a outra pose
        for (var i = 0; i < POSES.length; i++) {
            var src = imagens[POSES[i]];
            if (src && !jaUsados[src]) return src;
        }
        // Todas compartilhadas — retorna fofinha como último recurso
        return imagens.fofinha;
    }

    function aplicarMascote(key) {
        var mascote = MASCOTES[key];
        if (!mascote) { key = "glaceon"; mascote = MASCOTES.glaceon; }

        document.body.setAttribute("data-mascote", key);

        _removerMorcegos();
        if (key === "vampiro") _injetarMorcegos();

        // Atualiza todos os [data-mascote-tipo] no DOM
        document.querySelectorAll("[data-mascote-tipo]").forEach(function (el) {
            var tipo = el.getAttribute("data-mascote-tipo");

            if (key === "nenhum" || !mascote.imagens) return; // CSS cuida de ocultar

            if (el.tagName === "IMG") {
                // Usa o pose pedido; se não existir, tenta uma que ainda não foi usada por outra pose
                var imgSrc = mascote.imagens[tipo] || _resolverFallback(mascote.imagens, tipo);
                if (imgSrc) {
                    el.src = imgSrc;
                    el.alt = mascote.nome;
                }
            }
        });
    }

    // ══ HTML do mascote correndo (para alertas de carregamento) ═════════

    function getCorrendoHTML() {
        var key = localStorage.getItem("mascote") || "glaceon";
        var mascote = MASCOTES[key];

        if (!mascote || key === "nenhum") return "";

        if (key === "vampiro") {
            return '<div class="glaceonCorrendoDiv"><span style="font-size:3rem;display:inline-block;animation:mascote-bat-ltr 1.5s linear infinite">🦇</span></div>';
        }

        var src = (mascote.imagens && mascote.imagens.correndo) ? mascote.imagens.correndo : "";
        if (!src) return "";

        return '<div class="glaceonCorrendoDiv"><img class="glaceon correndo" data-mascote-tipo="correndo" src="' + src + '" alt="' + mascote.nome + '"></div>';
    }

    // ══ Inicialização ═══════════════════════════════════════════════════

    function inicializar() {
        aplicarMascote(_salvo);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", inicializar);
    } else {
        inicializar();
    }

    // ══ API pública ══════════════════════════════════════════════════════

    window.MascoteApp = {
        MASCOTES: MASCOTES,
        CATEGORIAS: CATEGORIAS,
        ORDEM_CATEGORIAS: ORDEM_CATEGORIAS,
        aplicar: aplicarMascote,
        salvar: function (key) {
            localStorage.setItem("mascote", key);
            _salvo = key;
            aplicarMascote(key);
        },
        getSalvo: function () {
            return localStorage.getItem("mascote") || "glaceon";
        },
        getCorrendoHTML: getCorrendoHTML
    };
})();
