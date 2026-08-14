/**
 * AppCache — cache em localStorage com TTL para dados da API MyFinance.
 *
 * Chaves armazenadas com prefixo "mf_c_" para fácil identificação e limpeza.
 * TTLs configuram por quanto tempo cada tipo de dado é considerado fresco.
 */
window.AppCache = (function () {
    const PREFIX = 'mf_c_';

    // Tempos de vida (ms) por tipo de dado
    const TTL = {
        CATEGORIES_ALL:    4 * 60 * 60 * 1000,  // 4h  — categorias globais (raramente mudam)
        INSTITUTIONS_ALL:  4 * 60 * 60 * 1000,  // 4h  — instituições globais
        CATEGORIES_USER:  30 * 60 * 1000,        // 30min — categorias do usuário
        INSTITUTIONS_USER:30 * 60 * 1000,        // 30min — instituições do usuário
        RECORDS_NAV:      20 * 60 * 1000,        // 20min — anos/meses de navegação
        RECORDS_PAGE:     10 * 60 * 1000,        // 10min — página de registros
        DASHBOARD:        10 * 60 * 1000,        // 10min — dados do dashboard
    };

    function _key(k) { return PREFIX + k; }

    function get(k) {
        try {
            const raw = localStorage.getItem(_key(k));
            if (!raw) return null;
            const entry = JSON.parse(raw);
            if (Date.now() > entry.exp) {
                localStorage.removeItem(_key(k));
                return null;
            }
            return entry.d;
        } catch (_) { return null; }
    }

    function set(k, data, ttlMs) {
        try {
            localStorage.setItem(_key(k), JSON.stringify({ d: data, exp: Date.now() + ttlMs }));
        } catch (_) {}
    }

    function del(k) {
        try { localStorage.removeItem(_key(k)); } catch (_) {}
    }

    // Remove todas as entradas cujas chaves começam com PREFIX + prefix
    function delPattern(prefix) {
        try {
            const full = PREFIX + prefix;
            const toRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith(full)) toRemove.push(k);
            }
            toRemove.forEach(k => localStorage.removeItem(k));
        } catch (_) {}
    }

    // Remove todo o cache de dados de API (mantém sessão e imagens)
    function clearAll() {
        try {
            const toRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith(PREFIX)) toRemove.push(k);
            }
            toRemove.forEach(k => localStorage.removeItem(k));
        } catch (_) {}
    }

    // ── Chaves por tipo de dado ──────────────────────────────────────────────
    function keyCategoriasAll()                          { return 'cat_all'; }
    function keyInstituicoesAll()                        { return 'inst_all'; }
    function keyCategoriasUser(uid)                      { return `cat_u_${uid}`; }
    function keyInstituicoesUser(uid)                    { return `inst_u_${uid}`; }
    function keyRegAnos(uid)                             { return `reg_a_${uid}`; }
    function keyRegMeses(uid, ano)                       { return `reg_m_${uid}_${ano}`; }
    function keyRegPagina(uid, ano, mes, pg, tam)        { return `reg_p_${uid}_${ano}_${mes}_${pg}_${tam}`; }
    function keyAgendaMes(uid, ano, mes)                 { return `ag_${uid}_${ano}_${mes}`; }
    function keyDash(uid, pathKey)                       { return `dash_${uid}_${pathKey}`; }

    // ── Invalidações agrupadas ───────────────────────────────────────────────

    // Invalida cache de registros (anos, meses, páginas e agenda) de um usuário
    function invalidarRegistros(uid) {
        del(keyRegAnos(uid));
        delPattern(`reg_m_${uid}_`);
        delPattern(`reg_p_${uid}_`);
        delPattern(`ag_${uid}_`);
    }

    // Invalida cache do dashboard de um usuário
    function invalidarDashboard(uid) {
        delPattern(`dash_${uid}_`);
    }

    return {
        TTL,
        get, set, del, delPattern, clearAll,
        keyCategoriasAll, keyInstituicoesAll,
        keyCategoriasUser, keyInstituicoesUser,
        keyRegAnos, keyRegMeses, keyRegPagina,
        keyAgendaMes, keyDash,
        invalidarRegistros, invalidarDashboard,
    };
})();
