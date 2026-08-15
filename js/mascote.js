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
            preview: "assets/gif/vampiro/morcego batendo asas.gif",
            imagens: {
                fofinha02:    "assets/gif/vampiro/vampira com a saia voando ao vento virada para a direita.gif",
                fofinha:      "assets/gif/vampiro/cruz gotica.png",
                costas:       "assets/gif/vampiro/cruz gotica.png",
                poder:        "assets/gif/vampiro/cruz gotica.png",
                balancante:   "assets/gif/vampiro/vampira com a saia voando ao vento virada para a direita.gif",
                balancante02: "assets/gif/vampiro/morcego batendo asas.gif"
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
                fofinha02:  "assets/gif/Gifs da Glaceon/glaceon fofinha 02.gif",
                fofinha:    "assets/gif/Gifs da Glaceon/glaceon fofinha.gif",
                poder:      "assets/gif/Gifs da Glaceon/glaceon poder.gif",
                costas:     "assets/gif/Gifs da Glaceon/glaceon de costas.gif",
                correndo:   "assets/gif/Gifs da Glaceon/glaceon-correndo-unscreen.gif",
                balancante: "assets/gif/Gifs da Glaceon/glaceon balancante.gif"
            }
        },
        eevee: {
            nome: "Eevee",
            icone: "🟤",
            categoria: "eeveelution",
            preview: "assets/gif/eevee/eevee fofinha.gif",
            imagens: {
                fofinha:    "assets/gif/eevee/eevee fofinha.gif",
                poder:      "assets/gif/eevee/eevee poder.gif",
                costas:     "assets/gif/eevee/eevee de costas.gif",
                correndo:   "assets/gif/eevee/eevee correndo.gif",
                balancante: "assets/gif/eevee/eevee balancante.gif"
            }
        },
        vaporeon: {
            nome: "Vaporeon",
            icone: "💧",
            categoria: "eeveelution",
            preview: "assets/gif/vaporeon/vaporeon sentado.gif",
            imagens: {
                fofinha:    "assets/gif/vaporeon/vaporeon sentado.gif",
                costas:     "assets/gif/vaporeon/vaporeon de costas.gif",
                correndo:   "assets/gif/vaporeon/vaporeon andandinho.gif",
                balancante: "assets/gif/vaporeon/vaporeeon.gif"
            }
        },
        jolteon: {
            nome: "Jolteon",
            icone: "⚡",
            categoria: "eeveelution",
            preview: "assets/gif/jolteon/jolteon poder.gif",
            imagens: {
                poder:      "assets/gif/jolteon/jolteon poder.gif",
                costas:     "assets/gif/jolteon/jolteon de costas.gif",
                correndo:   "assets/gif/jolteon/jolteon correndo.gif",
                balancante: "assets/gif/jolteon/jolteon balancante.gif"
            }
        },
        flareon: {
            nome: "Flareon",
            icone: "🔥",
            categoria: "eeveelution",
            preview: "assets/gif/flareon/flareon fofinho.gif",
            imagens: {
                fofinha:    "assets/gif/flareon/flareon fofinho.gif",
                poder:      "assets/gif/flareon/flareeon poder.gif",
                costas:     "assets/gif/flareon/flareon de costas.gif",
                correndo:   "assets/gif/flareon/flareon correndo.gif",
                balancante: "assets/gif/flareon/flareon balancante.gif"
            }
        },
        espeon: {
            nome: "Espeon",
            icone: "🔮",
            categoria: "eeveelution",
            preview: "assets/gif/espeon/espeon poder.gif",
            imagens: {
                poder:      "assets/gif/espeon/espeon poder.gif",
                costas:     "assets/gif/espeon/espeon de costas.gif",
                balancante: "assets/gif/espeon/espeon balancante.gif"
            }
        },
        umbreon: {
            nome: "Umbreon",
            icone: "🌑",
            categoria: "eeveelution",
            preview: "assets/gif/umbreon/umbreon fofinho.gif",
            imagens: {
                fofinha:    "assets/gif/umbreon/umbreon fofinho.gif",
                poder:      "assets/gif/umbreon/umbreon poder.gif",
                costas:     "assets/gif/umbreon/umbreon de costas.gif",
                correndo:   "assets/gif/umbreon/umbreon shiny correndo.gif",
                balancante: "assets/gif/umbreon/umbreon balancante shiny.gif"
            }
        },
        leafeon: {
            nome: "Leafeon",
            icone: "🍃",
            categoria: "eeveelution",
            preview: "assets/gif/leafeon/lefeaon balancante.gif",
            imagens: {
                costas:     "assets/gif/leafeon/leafeon de costas.gif",
                correndo:   "assets/gif/leafeon/lefeaon correndo.gif",
                balancante: "assets/gif/leafeon/lefeaon balancante.gif"
            }
        },
        sylveon: {
            nome: "Sylveon",
            icone: "🎀",
            categoria: "eeveelution",
            preview: "assets/gif/Sylveon/sylveon fofinha.gif",
            imagens: {
                fofinha:      "assets/gif/Sylveon/sylveon fofinha.gif",
                poder:        "assets/gif/Sylveon/sylveon poder.gif",
                costas:       "assets/gif/Sylveon/sylveon de costas.gif",
                correndo:     "assets/gif/Sylveon/sylveon correndo.gif",
                balancante:   "assets/gif/Sylveon/sylveon balacante.gif",
                balancante02: "assets/gif/Sylveon/sylveon balancante02.gif"
            }
        },

        // ── Geração 1 ─────────────────────────────────────────────────
        pikachu: {
            nome: "Pikachu",
            icone: "⚡",
            categoria: "eletrico",
            preview: "assets/gif/pikachu/pikachu fofinho.gif",
            imagens: {
                fofinha:    "assets/gif/pikachu/pikachu fofinho.gif",
                costas:     "assets/gif/pikachu/pikachu de costas.gif",
                correndo:   "assets/gif/pikachu/pikachu correndo.gif",
                balancante: "assets/gif/pikachu/pikachu pulando.gif"
            }
        },
        charmander: {
            nome: "Charmander",
            icone: "🔥",
            categoria: "fogo",
            preview: "assets/gif/charmander/charmander balancante.gif",
            imagens: {
                costas:     "assets/gif/charmander/charmander de costas.gif",
                balancante: "assets/gif/charmander/charmander balancante.gif"
            }
        },
        charizard: {
            nome: "Charizard",
            icone: "🐉",
            categoria: "fogo",
            preview: "assets/gif/charizard/charizard poder.gif",
            imagens: {
                poder:      "assets/gif/charizard/charizard poder.gif",
                costas:     "assets/gif/charizard/charizard de costas.gif",
                balancante: "assets/gif/charizard/charizard balancante.gif"
            }
        },
        squirtle: {
            nome: "Squirtle",
            icone: "💧",
            categoria: "agua",
            preview: "assets/gif/squirtle/squirtle poder.gif",
            imagens: {
                poder:      "assets/gif/squirtle/squirtle poder.gif",
                costas:     "assets/gif/squirtle/squirtle de costas.gif",
                balancante: "assets/gif/squirtle/squirtle balancante.gif"
            }
        },
        bulbasaur: {
            nome: "Bulbasaur",
            icone: "🌿",
            categoria: "planta",
            preview: "assets/gif/bulbasaur/bulbasaur poder.gif",
            imagens: {
                poder:      "assets/gif/bulbasaur/bulbasaur poder.gif",
                costas:     "assets/gif/bulbasaur/bulbasaur de costas.gif",
                balancante: "assets/gif/bulbasaur/bulbasaur balancante.gif"
            }
        },
        mewtwo: {
            nome: "Mewtwo",
            icone: "👾",
            categoria: "psiquico",
            preview: "assets/gif/mewtwo/mewtwo poder.gif",
            imagens: {
                poder:      "assets/gif/mewtwo/mewtwo poder.gif",
                costas:     "assets/gif/mewtwo/mewtwo de costas.gif",
                balancante: "assets/gif/mewtwo/mewtwo balancante.gif"
            }
        },
        mew: {
            nome: "Mew",
            icone: "✨",
            categoria: "psiquico",
            preview: "assets/gif/mew/mew fofinho.gif",
            imagens: {
                fofinha:    "assets/gif/mew/mew fofinho.gif",
                costas:     "assets/gif/mew/mew de costas.gif",
                balancante: "assets/gif/mew/mew balancante.gif"
            }
        },
        gengar: {
            nome: "Gengar",
            icone: "👻",
            categoria: "fantasma",
            preview: "assets/gif/gengar/gengar fofinho.gif",
            imagens: {
                fofinha:    "assets/gif/gengar/gengar fofinho.gif",
                poder:      "assets/gif/gengar/gengar poder.gif",
                costas:     "assets/gif/gengar/gengar de costas.gif",
                balancante: "assets/gif/gengar/gengar balancante.gif"
            }
        },
        snorlax: {
            nome: "Snorlax",
            icone: "😴",
            categoria: "normal",
            preview: "assets/gif/snorlax/snorlax fofinho.gif",
            imagens: {
                fofinha:      "assets/gif/snorlax/snorlax fofinho.gif",
                poder:        "assets/gif/snorlax/snorlax poder.gif",
                costas:       "assets/gif/snorlax/snorlax de costas.gif",
                balancante:   "assets/gif/snorlax/snorlax balancante.gif",
                balancante02: "assets/gif/snorlax/snorlax balancante 02.gif",
                correndo:     "assets/gif/snorlax/snorlax correndo.gif"
            }
        },
        jigglypuff: {
            nome: "Jigglypuff",
            icone: "🎤",
            categoria: "normal",
            preview: "assets/gif/jiglypuff/jigglypuff fofinho.gif",
            imagens: {
                fofinha:    "assets/gif/jiglypuff/jigglypuff fofinho.gif",
                poder:      "assets/gif/jiglypuff/jigglipuff poder.gif",
                costas:     "assets/gif/jiglypuff/jigglypuff de costas.gif",
                balancante: "assets/gif/jiglypuff/jigglypuff balancante.gif"
            }
        },
        meowth: {
            nome: "Meowth",
            icone: "🪙",
            categoria: "normal",
            preview: "assets/gif/meowth/meothw poder.gif",
            imagens: {
                poder:      "assets/gif/meowth/meothw poder.gif",
                costas:     "assets/gif/meowth/meowth de costas.gif",
                balancante: "assets/gif/meowth/meowth balancante.gif"
            }
        },
        psyduck: {
            nome: "Psyduck",
            icone: "🤕",
            categoria: "agua",
            preview: "assets/gif/psyduck/psyduck balancante.gif",
            imagens: {
                fofinha:    "assets/gif/psyduck/psyduck.gif",
                costas:     "assets/gif/psyduck/psyduck  de costas.gif",
                balancante: "assets/gif/psyduck/psyduck balancante.gif"
            }
        },
        magikarp: {
            nome: "Magikarp",
            icone: "🐟",
            categoria: "agua",
            preview: "assets/gif/magikarp/magikarp poder.gif",
            imagens: {
                poder:      "assets/gif/magikarp/magikarp poder.gif",
                costas:     "assets/gif/magikarp/magikarp de costas.gif",
                balancante: "assets/gif/magikarp/magikarp balancante.gif"
            }
        },
        clefairy: {
            nome: "Clefairy",
            icone: "⭐",
            categoria: "normal",
            preview: "assets/gif/clefairy/clefairy balancante.gif",
            imagens: {
                costas:     "assets/gif/clefairy/clefairy de costas.gif",
                balancante: "assets/gif/clefairy/clefairy balancante.gif"
            }
        },

        // ── Outros Famosos ────────────────────────────────────────────
        togepi: {
            nome: "Togepi",
            icone: "🥚",
            categoria: "normal",
            preview: "assets/gif/togepi/togepi balancante.gif",
            imagens: {
                costas:     "assets/gif/togepi/togepi de costas.gif",
                balancante: "assets/gif/togepi/togepi balancante.gif"
            }
        },
        lucario: {
            nome: "Lucario",
            icone: "💪",
            categoria: "lutador",
            preview: "assets/gif/lucario/lucario fofinho.gif",
            imagens: {
                fofinha:    "assets/gif/lucario/lucario fofinho.gif",
                poder:      "assets/gif/lucario/lucario poder.gif",
                costas:     "assets/gif/lucario/lucario de costas.gif",
                correndo:   "assets/gif/lucario/lucario correndo.gif",
                balancante: "assets/gif/lucario/lucario balancante.gif"
            }
        },
        gardevoir: {
            nome: "Gardevoir",
            icone: "🌸",
            categoria: "psiquico",
            preview: "assets/gif/gardevoir/gardevoir poder.gif",
            imagens: {
                poder:      "assets/gif/gardevoir/gardevoir poder.gif",
                costas:     "assets/gif/gardevoir/gardevoir de costas.gif",
                balancante: "assets/gif/gardevoir/gardevoir balancante.gif"
            }
        },
        mimikyu: {
            nome: "Mimikyu",
            icone: "🪄",
            categoria: "fantasma",
            preview: "assets/gif/mimikyu/mimikyu fofinho.gif",
            imagens: {
                fofinha:    "assets/gif/mimikyu/mimikyu fofinho.gif",
                costas:     "assets/gif/mimikyu/mimikyu de costas.gif",
                balancante: "assets/gif/mimikyu/mimikyu balancante.gif"
            }
        },
        greninja: {
            nome: "Greninja",
            icone: "🐸",
            categoria: "agua",
            preview: "assets/gif/greninja/greninja poder.gif",
            imagens: {
                poder:      "assets/gif/greninja/greninja poder.gif",
                balancante: "assets/gif/greninja/greninja balancante.gif"
            }
        },
        zoroark: {
            nome: "Zoroark",
            icone: "🦊",
            categoria: "sombrio",
            preview: "assets/gif/zoroark/zoroark balancante.gif",
            imagens: {
                costas:     "assets/gif/zoroark/zoroark de costas.gif",
                balancante: "assets/gif/zoroark/zoroark balancante.gif"
            }
        }
    };

    var CATEGORIAS = {
        especial:    "Especial",
        eeveelution: "Eeveelutions",
        fogo:        "Fogo",
        eletrico:    "Elétrico",
        agua:        "Água",
        planta:      "Planta",
        psiquico:    "Psíquico",
        fantasma:    "Fantasma",
        sombrio:     "Sombrio",
        lutador:     "Lutador",
        normal:      "Normal"
    };

    var ORDEM_CATEGORIAS = ["especial", "eeveelution", "fogo", "eletrico", "agua", "planta", "psiquico", "fantasma", "sombrio", "lutador", "normal"];

    // Retorna a chave de mascote com prefixo do usuário logado
    function _mascoteKey() {
        var u = JSON.parse(localStorage.getItem('usuarioLogado') || 'null');
        var id = (u && u.id) ? u.id : 'guest';
        return 'mascote_' + id;
    }

    // Aplica data-mascote imediatamente para evitar flash
    var _salvo = localStorage.getItem(_mascoteKey()) || "glaceon";
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
            bat.style.top = cfg.top;
            bat.style.animationDuration = cfg.dur;
            bat.style.animationDelay = cfg.delay;

            var img = document.createElement("img");
            img.src = "assets/gif/vampiro/morcego batendo asas.gif";
            img.alt = "morcego";
            img.style.width = cfg.size;
            img.style.height = "auto";
            img.style.display = "block";
            // gif aponta para esquerda; inverter horizontalmente quando voar para direita (ltr)
            if (!cfg.rtl) img.style.transform = "scaleX(-1)";

            bat.appendChild(img);
            container.appendChild(bat);
        });

        document.body.appendChild(container);
    }

    // ══ Partículas das Eeveelutions ══════════════════════════════════════

    var EEVEELUTION_PARTICLES = {
        glaceon:  ["❄️", "🌨️", "❄️", "✦"],
        vaporeon: ["💧", "🌊", "💦", "💧"],
        leafeon:  ["🍃", "🍂", "🌿", "🍃"],
        jolteon:  ["⚡", "✦", "⚡", "💥"],
        flareon:  ["🔥", "✨", "🔥", "💫"],
        espeon:   ["✨", "💜", "⭐", "✦"],
        umbreon:  ["🌑", "⭐", "💜", "✦"],
        sylveon:  ["🎀", "💗", "✨", "🎀"],
        eevee:    ["⭐", "✦", "💫", "⭐"]
    };

    function _dispararParticulas(key) {
        var emojis = EEVEELUTION_PARTICLES[key];
        if (!emojis) return;

        var containerId = "mascote-particle-container";
        var old = document.getElementById(containerId);
        if (old) old.remove();

        var container = document.createElement("div");
        container.id = containerId;
        container.className = "mascote-particle-container";

        for (var i = 0; i < 28; i++) {
            var p = document.createElement("span");
            p.className = "mascote-particle";
            p.textContent = emojis[Math.floor(Math.random() * emojis.length)];

            var dur  = (2.5 + Math.random() * 2.5).toFixed(2);
            var del  = (Math.random() * 1.5).toFixed(2);
            var size = (1.2 + Math.random() * 1.6).toFixed(2);
            var left = (Math.random() * 100).toFixed(1);
            var sway = ((Math.random() - 0.5) * 120).toFixed(0);

            p.style.left            = left + "%";
            p.style.fontSize        = size + "rem";
            p.style.animationDuration  = dur + "s";
            p.style.animationDelay     = del + "s";
            p.style.setProperty("--sway", sway + "px");

            container.appendChild(p);
        }

        document.body.appendChild(container);
        setTimeout(function () {
            var el = document.getElementById(containerId);
            if (el) el.remove();
        }, 5500);
    }

    // Cadeias de fallback por tipo de pose
    var FALLBACKS_TIPO = {
        fofinha:      ["fofinha", "poder", "balancante"],
        poder:        ["poder", "fofinha", "balancante"],
        costas:       ["costas", "poder", "fofinha"],
        correndo:     ["correndo", "poder", "fofinha"],
        balancante:   ["balancante", "poder", "fofinha"],
        balancante02: ["balancante02", "correndo", "poder", "costas"]
    };

    function _resolverTipo(imagens, tipo) {
        var chain = FALLBACKS_TIPO[tipo] || [tipo];
        for (var i = 0; i < chain.length; i++) {
            if (imagens[chain[i]]) return imagens[chain[i]];
        }
        // último recurso: qualquer imagem disponível
        var keys = Object.keys(imagens);
        for (var j = 0; j < keys.length; j++) {
            if (imagens[keys[j]]) return imagens[keys[j]];
        }
        return null;
    }

    function aplicarMascote(key) {
        var mascote = MASCOTES[key];
        if (!mascote) { key = "glaceon"; mascote = MASCOTES.glaceon; }

        document.body.setAttribute("data-mascote", key);

        _removerMorcegos();

        // Atualiza todos os [data-mascote-tipo] no DOM
        document.querySelectorAll("[data-mascote-tipo]").forEach(function (el) {
            var tipo = el.getAttribute("data-mascote-tipo");

            if (key === "nenhum" || !mascote.imagens) return; // CSS cuida de ocultar

            if (el.tagName === "IMG") {
                var imgSrc = _resolverTipo(mascote.imagens, tipo);
                if (imgSrc) {
                    el.src = imgSrc;
                    el.alt = mascote.nome;
                }
            }
        });
    }

    // ══ HTML do mascote correndo (para alertas de carregamento) ═════════

    function getCorrendoHTML() {
        var key = localStorage.getItem(_mascoteKey()) || "glaceon";
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
            localStorage.setItem(_mascoteKey(), key);
            _salvo = key;
            aplicarMascote(key);
            if (key === "vampiro") {
                _injetarMorcegos();
                setTimeout(_removerMorcegos, 5000);
            } else if (EEVEELUTION_PARTICLES[key]) {
                _dispararParticulas(key);
            }
        },
        getSalvo: function () {
            return localStorage.getItem(_mascoteKey()) || "glaceon";
        },
        getCorrendoHTML: getCorrendoHTML
    };
})();
