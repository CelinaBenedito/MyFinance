const _divAlerta = document.getElementById('div_alerta');
if (_divAlerta) _divAlerta.style.display = 'none';

// Máscara monetária (aplicada depois do DOM carregar via gerarInformacoes)
let dataGasto;
const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado") || "null");
const userId = usuarioLogado ? usuarioLogado.id : null;
let _alertaTimer = null;

/* ══════════════════════════════════════════════════
   Alertas
══════════════════════════════════════════════════ */
function habilitarFecharAlertaAoClicarFora() {
    const divAl = document.getElementById("div_alerta");
    const contAl = document.getElementById("conteudoAlerta");
    if (!divAl || !contAl || divAl.dataset.closeOutsideBound === "1") return;
    divAl.dataset.closeOutsideBound = "1";
    divAl.addEventListener("click", (event) => {
        if (event.target === divAl) {
            divAl.style.display = "none";
            if (_alertaTimer) { clearTimeout(_alertaTimer); _alertaTimer = null; }
        }
    });
}

function alerta(texto, duracaoMs = 4000) {
    const divAl = document.getElementById("div_alerta");
    const contAl = document.getElementById("conteudoAlerta");
    habilitarFecharAlertaAoClicarFora();
    if (divAl) divAl.style.display = "flex";
    if (contAl) contAl.innerHTML = texto;
    if (_alertaTimer) clearTimeout(_alertaTimer);
    if (duracaoMs > 0) {
        _alertaTimer = setTimeout(() => {
            if (divAl) divAl.style.display = "none";
            _alertaTimer = null;
        }, duracaoMs);
    }
}

/* ══════════════════════════════════════════════════
   Clear-on-focus (campos mantidos após registro)
══════════════════════════════════════════════════ */
function setupClearOnFocus() {
    const ids = ['ipt_nome','ipt_valor','ipt_desc','ipt_multi_nome','ipt_multi_valor','ipt_multi_desc'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('focus', function () {
            if (this.dataset.pendingClear !== 'true') return;
            if (this.id === 'ipt_valor' || this.id === 'ipt_multi_valor') {
                if (window.MainAPI && window.MainAPI.resetarMascaraMoeda) {
                    window.MainAPI.resetarMascaraMoeda(this);
                } else {
                    this.value = '';
                }
            } else {
                this.value = '';
            }
            delete this.dataset.pendingClear;
            this.classList.remove('ar-field-submitted');
        });
    });
}

function markFieldsForClear(ids) {
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.value) {
            el.dataset.pendingClear = 'true';
            el.classList.add('ar-field-submitted');
        }
    });
}

/* ══════════════════════════════════════════════════
   Tag Picker system
══════════════════════════════════════════════════ */
const _tp = {}; // id -> { options, selected, placeholder, onchange }

function initTagPicker(id, options, placeholder, onchange) {
    if (_tp[id]) {
        // Reload: preserve selected, update options
        _tp[id].options = options;
        _tp[id].selected = _tp[id].selected.filter(s =>
            options.some(o => String(o.id) === String(s.id))
        );
        if (onchange) _tp[id].onchange = onchange;
    } else {
        _tp[id] = { options, selected: [], placeholder: placeholder || 'Selecionar...', onchange: onchange || null };
    }
    _renderTagPicker(id);
}

function openTagPicker(event, id) {
    event.stopPropagation();
    const dd = document.getElementById('tp-dd-' + id);
    const display = dd ? dd.previousElementSibling : null;
    if (!dd) return;
    const isOpen = dd.style.display !== 'none';
    // Close all
    document.querySelectorAll('.ar-tp-dd').forEach(el => {
        el.style.display = 'none';
        if (el.previousElementSibling) el.previousElementSibling.classList.remove('open');
    });
    if (!isOpen) {
        dd.style.display = '';
        if (display) display.classList.add('open');
    }
}

function _toggleTagItem(id, itemId, itemLabel) {
    const state = _tp[id];
    if (!state) return;
    const idx = state.selected.findIndex(s => String(s.id) === String(itemId));
    if (idx >= 0) {
        state.selected.splice(idx, 1);
    } else {
        state.selected.push({ id: itemId, label: itemLabel });
    }
    _renderTagPicker(id);
    if (state.onchange) state.onchange(state.selected);
}

function _removeTagItem(id, itemId) {
    const state = _tp[id];
    if (!state) return;
    state.selected = state.selected.filter(s => String(s.id) !== String(itemId));
    _renderTagPicker(id);
    if (state.onchange) state.onchange(state.selected);
}

function _renderTagPicker(id) {
    const state = _tp[id];
    const tagsEl = document.getElementById('tp-tags-' + id);
    const ddEl   = document.getElementById('tp-dd-'   + id);
    if (!tagsEl || !ddEl) return;

    // Tags display
    if (state.selected.length === 0) {
        tagsEl.innerHTML = `<span class="ar-tp-ph">${state.placeholder}</span>`;
    } else {
        tagsEl.innerHTML = state.selected.map(s =>
            `<span class="ar-tp-tag">${s.label}<button type="button" class="ar-tp-tag-rm"
                onclick="event.stopPropagation();_removeTagItem('${id}','${s.id}')">×</button></span>`
        ).join('');
    }

    // Dropdown options
    ddEl.innerHTML = '';
    state.options.forEach(opt => {
        const sel = state.selected.some(s => String(s.id) === String(opt.id));
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ar-tp-option' + (sel ? ' ar-tp-option-sel' : '');
        const check = document.createElement('span');
        check.className = 'ar-tp-opt-check';
        check.textContent = sel ? '✓' : '';
        btn.appendChild(check);
        btn.appendChild(document.createTextNode(opt.label));
        btn.addEventListener('click', e => {
            e.stopPropagation();
            _toggleTagItem(id, opt.id, opt.label);
        });
        ddEl.appendChild(btn);
    });

    // Botão "Criar novo" para pickers de inst e cat
    const _isInstPicker = (id === 'inst' || id === 'm-inst');
    const _isCatPicker  = (id === 'cat'  || id === 'm-cat');
    if (_isInstPicker || _isCatPicker) {
        const sep = document.createElement('div');
        sep.className = 'ar-tp-separator';
        ddEl.appendChild(sep);

        const newBtn = document.createElement('button');
        newBtn.type = 'button';
        newBtn.className = 'ar-tp-option ar-tp-new-btn';
        const newCheck = document.createElement('span');
        newCheck.className = 'ar-tp-opt-check ar-tp-new-icon';
        newCheck.textContent = '+';
        newBtn.appendChild(newCheck);
        newBtn.appendChild(document.createTextNode(
            _isInstPicker ? 'Nova instituição...' : 'Nova categoria...'
        ));
        newBtn.addEventListener('click', e => {
            e.stopPropagation();
            _abrirFormularioNova(id);
        });
        ddEl.appendChild(newBtn);
    }
}

// Close all dropdowns when clicking outside
document.addEventListener('click', () => {
    document.querySelectorAll('.ar-tp-dd').forEach(dd => {
        dd.style.display = 'none';
        if (dd.previousElementSibling) dd.previousElementSibling.classList.remove('open');
    });
});

/* ══════════════════════════════════════════════════
   Vincular / Criar inline de Instituição / Categoria
══════════════════════════════════════════════════ */

// Passo 1: mostra as disponíveis no banco que o usuário ainda não vinculou
async function _abrirFormularioNova(id) {
    const ddEl = document.getElementById('tp-dd-' + id);
    if (!ddEl) return;
    const isInst = (id === 'inst' || id === 'm-inst');

    ddEl.innerHTML = `<div class="ar-tp-new-form" style="text-align:center;padding:12px 0;">
        <span style="color:var(--cor-texto-secundario);font-size:0.88rem;">Carregando...</span>
    </div>`;

    try {
        let disponiveis = [];
        if (isInst) {
            const [todas, vinculadas] = await Promise.all([
                MainAPI.getTodasInstituicoes(),
                MainAPI.getInstituicoes(userId)
            ]);
            const vinculadasIds = new Set(vinculadas.map(v => String(v.intituicao?.id)));
            disponiveis = todas
                .filter(i => !vinculadasIds.has(String(i.id)))
                .map(i => ({ id: i.id, label: i.nome }));
        } else {
            const [todas, vinculadas] = await Promise.all([
                MainAPI.getTodasCategorias(),
                MainAPI.getTipos(userId)
            ]);
            const vinculadasIds = new Set(vinculadas.map(c => String(c.categoria?.id)));
            disponiveis = todas
                .filter(c => !vinculadasIds.has(String(c.id)))
                .map(c => ({ id: c.id, label: c.titulo }));
        }

        ddEl.innerHTML = '';

        if (disponiveis.length > 0) {
            const header = document.createElement('div');
            header.style.cssText = 'padding:6px 10px 2px;font-size:0.75rem;font-weight:700;color:var(--cor-texto-secundario);text-transform:uppercase;letter-spacing:0.5px;';
            header.textContent = isInst ? 'Vincular instituição existente' : 'Vincular categoria existente';
            ddEl.appendChild(header);

            disponiveis.forEach(item => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'ar-tp-option';
                const icon = document.createElement('span');
                icon.className = 'ar-tp-opt-check ar-tp-new-icon';
                icon.textContent = '+';
                btn.appendChild(icon);
                btn.appendChild(document.createTextNode(item.label));
                btn.addEventListener('click', async e => {
                    e.stopPropagation();
                    await _vincularESelecionarExistente(id, item.id, item.label, isInst);
                });
                ddEl.appendChild(btn);
            });

            const sep = document.createElement('div');
            sep.className = 'ar-tp-separator';
            ddEl.appendChild(sep);
        }

        // Botão criar nova (personalizada)
        const newBtn = document.createElement('button');
        newBtn.type = 'button';
        newBtn.className = 'ar-tp-option ar-tp-new-btn';
        const newIcon = document.createElement('span');
        newIcon.className = 'ar-tp-opt-check ar-tp-new-icon';
        newIcon.textContent = '+';
        newBtn.appendChild(newIcon);
        newBtn.appendChild(document.createTextNode(
            isInst ? 'Criar nova instituição...' : 'Criar nova categoria...'
        ));
        newBtn.addEventListener('click', e => { e.stopPropagation(); _mostrarFormCriarNova(id, isInst); });
        ddEl.appendChild(newBtn);

        // Botão voltar
        const backBtn = document.createElement('button');
        backBtn.type = 'button';
        backBtn.className = 'ar-tp-option';
        backBtn.style.cssText = 'color:var(--cor-texto-secundario);font-size:0.85rem;';
        backBtn.textContent = '← Voltar';
        backBtn.addEventListener('click', e => { e.stopPropagation(); _renderTagPicker(id); });
        ddEl.appendChild(backBtn);

    } catch (err) {
        console.error('[_abrirFormularioNova]', err);
        alerta('Erro ao carregar opções disponíveis');
        _renderTagPicker(id);
    }
}

// Passo 2a: vincular uma existente do banco e selecioná-la no picker
async function _vincularESelecionarExistente(id, globalId, label, isInst) {
    if (!userId) return alerta('Nenhum usuário logado');
    const ddEl = document.getElementById('tp-dd-' + id);
    if (ddEl) ddEl.innerHTML = `
        <div class="ar-tp-new-form" style="text-align:center;padding:14px 0;">
            <span style="color:var(--cor-principal);font-size:0.9rem;">
                Vinculando ${isInst ? 'instituição' : 'categoria'}...
            </span>
        </div>`;
    try {
        let novoId, novoLabel;
        if (isInst) {
            const res = await MainAPI.vincularInstituicaoUsuario(globalId, userId);
            if (!res.ok) { const c = await res.json().catch(()=>({})); throw new Error(c.message || `HTTP ${res.status}`); }
            const data = await res.json();
            novoId = data.id; novoLabel = data.intituicao?.nome || label;
        } else {
            const res = await MainAPI.vincularCategoriaUsuario(globalId, userId);
            if (!res.ok) { const c = await res.json().catch(()=>({})); throw new Error(c.message || `HTTP ${res.status}`); }
            const data = await res.json();
            novoId = data.id; novoLabel = data.categoria?.titulo || label;
        }
        const twin = id.startsWith('m-') ? id.slice(2) : 'm-' + id;
        [id, twin].forEach(pid => {
            const st = _tp[pid];
            if (!st) return;
            if (!st.options.some(o => String(o.id) === String(novoId)))
                st.options.push({ id: novoId, label: novoLabel });
        });
        _toggleTagItem(id, novoId, novoLabel);
        if (ddEl) ddEl.style.display = 'none';
        const display = ddEl ? ddEl.previousElementSibling : null;
        if (display) display.classList.remove('open');
        alerta(`✔ ${isInst ? 'Instituição' : 'Categoria'} "${novoLabel}" vinculada e selecionada!`, 3000);
    } catch (err) {
        console.error('[vincularESelecionarExistente]', err);
        alerta(`Erro ao vincular: ${err.message}`);
        _renderTagPicker(id);
    }
}

// Passo 2b: mostrar formulário para criar uma personalizada (não existe no banco)
function _mostrarFormCriarNova(id, isInst) {
    const ddEl = document.getElementById('tp-dd-' + id);
    if (!ddEl) return;
    const placeholder = isInst ? 'Nome da instituição' : 'Nome da categoria';
    const maxLen = isInst ? 50 : 30;

    ddEl.innerHTML = `
        <div class="ar-tp-new-form">
            <input type="text" id="tp-new-input-${id}"
                   class="ar-tp-new-input"
                   placeholder="${placeholder}"
                   maxlength="${maxLen}"
                   autocomplete="off">
            <div class="ar-tp-new-btns">
                <button type="button" class="ar-tp-new-confirm">Criar</button>
                <button type="button" class="ar-tp-new-cancel">← Voltar</button>
            </div>
        </div>`;

    const input = document.getElementById(`tp-new-input-${id}`);
    if (input) setTimeout(() => input.focus(), 50);

    ddEl.querySelector('.ar-tp-new-confirm').addEventListener('click', async e => {
        e.stopPropagation();
        const nome = input ? input.value.trim() : '';
        if (!nome) return alerta(isInst ? 'Digite o nome da instituição' : 'Digite o nome da categoria');
        await _criarESelecionarNova(id, nome);
    });
    ddEl.querySelector('.ar-tp-new-cancel').addEventListener('click', e => {
        e.stopPropagation();
        _abrirFormularioNova(id);
    });
    if (input) {
        input.addEventListener('keydown', async e => {
            e.stopPropagation();
            if (e.key === 'Enter') { const nome = input.value.trim(); if (nome) await _criarESelecionarNova(id, nome); }
            else if (e.key === 'Escape') _abrirFormularioNova(id);
        });
        input.addEventListener('click', e => e.stopPropagation());
    }
}

async function _criarESelecionarNova(id, nome) {
    if (!userId) return alerta('Nenhum usuário logado');

    const ddEl  = document.getElementById('tp-dd-' + id);
    const isInst = (id === 'inst' || id === 'm-inst');

    // Spinner enquanto cria
    if (ddEl) ddEl.innerHTML = `
        <div class="ar-tp-new-form" style="text-align:center;padding:14px 0;">
            <span style="color:var(--cor-principal);font-size:0.9rem;">
                Criando ${isInst ? 'instituição' : 'categoria'}...
            </span>
        </div>`;

    try {
        let novoId, novoLabel;

        if (isInst) {
            // 1. Criar a instituição global
            const resInst = await MainAPI.criarInstituicao(nome);
            if (!resInst.ok) {
                const corpo = await resInst.json().catch(() => ({}));
                throw new Error(corpo.message || `HTTP ${resInst.status}`);
            }
            const instData = await resInst.json();
            const instituicaoId = instData.id;

            // 2. Vincular ao usuário
            const resLink = await MainAPI.vincularInstituicaoUsuario(instituicaoId, userId);
            if (!resLink.ok) {
                const corpo = await resLink.json().catch(() => ({}));
                throw new Error(corpo.message || `HTTP ${resLink.status}`);
            }
            const linkData = await resLink.json();
            novoId    = linkData.id;                      // instUsuario_id
            novoLabel = linkData.intituicao?.nome || nome;

        } else {
            // Criar categoria e já associar ao usuário (atômico)
            const resCat = await MainAPI.adicionarTipo({ titulo: nome }, userId);
            if (!resCat.ok) {
                const corpo = await resCat.json().catch(() => ({}));
                throw new Error(corpo.message || `HTTP ${resCat.status}`);
            }
            const catData = await resCat.json();
            novoId    = catData.id;                       // categoriaUsuario_id
            novoLabel = catData.categoria?.titulo || nome;
        }

        // Adicionar às opções do picker atual e do picker irmão
        const twin = id.startsWith('m-') ? id.slice(2) : 'm-' + id;
        [id, twin].forEach(pickerId => {
            const st = _tp[pickerId];
            if (!st) return;
            if (!st.options.some(o => String(o.id) === String(novoId))) {
                st.options.push({ id: novoId, label: novoLabel });
            }
        });

        // Selecionar automaticamente no picker atual
        // (_toggleTagItem chama _renderTagPicker internamente e reconstrói o dropdown)
        _toggleTagItem(id, novoId, novoLabel);

        // Fechar dropdown (conteúdo já foi reconstruído pelo _renderTagPicker acima)
        if (ddEl) ddEl.style.display = 'none';
        const display = ddEl ? ddEl.previousElementSibling : null;
        if (display) display.classList.remove('open');

        alerta(`✔ ${isInst ? 'Instituição' : 'Categoria'} "${novoLabel}" criada e selecionada!`, 3000);

    } catch (err) {
        console.error('[criarESelecionarNova]', err);
        alerta(`Erro ao criar ${isInst ? 'instituição' : 'categoria'}: ${err.message}`);
        _renderTagPicker(id); // Restaura o dropdown normal
    }
}

/* ── Institution amounts handler ── */
function _onInstChange(pickerId, selected) {
    const amountsId   = pickerId === 'inst' ? 'inst-amounts'   : 'm-inst-amounts';
    const wrapValorId = pickerId === 'inst' ? 'wrap_valor'      : 'wrap_multi_valor';

    const amountsEl   = document.getElementById(amountsId);
    const wrapValorEl = document.getElementById(wrapValorId);

    if (selected.length > 1) {
        // Esconde o campo de valor único
        if (wrapValorEl) wrapValorEl.style.display = 'none';

        // Mostra painel de valor por instituição
        if (amountsEl) {
            amountsEl.style.display = '';
            // Mantém o título, remove linhas antigas
            while (amountsEl.children.length > 1) amountsEl.removeChild(amountsEl.lastChild);
            selected.forEach(s => {
                const row = document.createElement('div');
                row.className = 'ar-inst-amount-row';
                const nameEl = document.createElement('span');
                nameEl.className = 'ar-inst-name';
                nameEl.textContent = s.label;
                const inp = document.createElement('input');
                inp.type = 'text';
                inp.id = `inst-amt-${pickerId}-${s.id}`;
                inp.className = 'ar-inst-amt-input';
                inp.setAttribute('inputmode', 'numeric');
                inp.setAttribute('autocomplete', 'off');
                row.appendChild(nameEl);
                row.appendChild(inp);
                amountsEl.appendChild(row);
                // Aplica máscara APÓS o elemento estar no DOM
                if (window.MainAPI && window.MainAPI.aplicarMascaraMoeda) {
                    window.MainAPI.aplicarMascaraMoeda(inp);
                }
            });
        }
    } else {
        // Mostra o campo de valor único novamente
        if (wrapValorEl) wrapValorEl.style.display = '';

        // Esconde painel de valor por instituição
        if (amountsEl) {
            amountsEl.style.display = 'none';
            while (amountsEl.children.length > 1) amountsEl.removeChild(amountsEl.lastChild);
        }
    }

    // Saldo display (formulário único apenas)
    if (pickerId === 'inst') {
        if (selected.length === 1) {
            atualizarSaldoDisplay(selected[0].id);
        } else {
            const saldoEl = document.getElementById('saldo_display');
            if (saldoEl) saldoEl.style.display = 'none';
        }
    }
}

/* ══════════════════════════════════════════════════
   Recurring section
══════════════════════════════════════════════════ */
let _isRecorrente = false;
let _periodicidade = null;
let _diasSemana    = [];
let _diaMes        = null;
let _mesAnual      = null;
let _diaAnual      = null;
let _dataFimRecorrente = null;

// Mapeamento: índice do botão DOM (0=Dom, 1=Seg, …, 6=Sáb) → DayOfWeek do Java
const _DOW_MAP = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
const _DOW_LABEL = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const _MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function _atualizarResumoRecorrencia() {
    const el = document.getElementById('ar-recorrente-resumo');
    if (!el) return;
    if (!_isRecorrente || !_periodicidade) { el.style.display = 'none'; el.textContent = ''; return; }
    const partes = [_periodicidade.charAt(0).toUpperCase() + _periodicidade.slice(1)];
    if (_periodicidade === 'semanal' && _diasSemana.length > 0)
        partes.push(_diasSemana.map(d => _DOW_LABEL[d]).join(', '));
    if (_periodicidade === 'mensal' && _diaMes)
        partes.push(`Dia ${_diaMes}`);
    if (_periodicidade === 'anual') {
        if (_mesAnual) partes.push(_MESES_LABEL[_mesAnual - 1]);
        if (_diaAnual) partes.push(`Dia ${_diaAnual}`);
    }
    if (_dataFimRecorrente) partes.push(`até ${_dataFimRecorrente.split('-').reverse().join('/')}`);
    el.textContent = partes.join(' · ');
    el.style.display = '';
}

function toggleRecorrente() {
    _isRecorrente = !_isRecorrente;
    if (!_isRecorrente) {
        _periodicidade = null; _diasSemana = []; _diaMes = null; _mesAnual = null; _diaAnual = null; _dataFimRecorrente = null;
        const fim = document.getElementById('rec-data-fim');
        if (fim) fim.value = '';
        _atualizarResumoRecorrencia();
    }    const btn  = document.getElementById('ar-recorrente-btn');
    const icon = document.getElementById('ar-recorrente-icon');
    const opts = document.getElementById('recurring-options');
    if (btn)  btn.classList.toggle('active', _isRecorrente);
    if (icon) icon.style.display = _isRecorrente ? '' : 'none';
    if (opts) opts.style.display = _isRecorrente ? '' : 'none';
    if (!_isRecorrente) {
        ['rec-semanal','rec-mensal','rec-anual'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        document.querySelectorAll('.ar-pill[data-period]').forEach(p => p.classList.remove('active'));
    }
}

function setPeriodicity(p) {
    _periodicidade = p;
    _diasSemana = []; _diaMes = null; _mesAnual = null; _diaAnual = null;
    document.querySelectorAll('.ar-pill[data-period]').forEach(pill =>
        pill.classList.toggle('active', pill.dataset.period === p)
    );
    document.getElementById('rec-semanal').style.display = p === 'semanal' ? '' : 'none';
    document.getElementById('rec-mensal').style.display  = p === 'mensal'  ? '' : 'none';
    document.getElementById('rec-anual').style.display   = p === 'anual'   ? '' : 'none';
    document.querySelectorAll('.ar-pill[data-day]').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('#rec-mensal-days .ar-pill').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('#rec-anual-months .ar-pill').forEach(p => p.classList.remove('active'));
    _atualizarResumoRecorrencia();
}

function toggleWeekDay(day) {
    const idx = _diasSemana.indexOf(day);
    if (idx >= 0) _diasSemana.splice(idx, 1); else _diasSemana.push(day);
    const pill = document.querySelector(`.ar-pill[data-day="${day}"]`);
    if (pill) pill.classList.toggle('active', _diasSemana.includes(day));
    _atualizarResumoRecorrencia();
}

function setMonthDay(day) {
    _diaMes = (_diaMes === day) ? null : day;
    document.querySelectorAll('#rec-mensal-days .ar-pill').forEach(p =>
        p.classList.toggle('active', Number(p.dataset.monthday) === _diaMes)
    );
    _atualizarResumoRecorrencia();
}

function setAnnualMonth(month) {
    _mesAnual = (_mesAnual === month) ? null : month;
    document.querySelectorAll('#rec-anual-months .ar-pill').forEach(p =>
        p.classList.toggle('active', Number(p.dataset.annualmonth) === _mesAnual)
    );
    _atualizarResumoRecorrencia();
}

function _initRecurringSubOptions() {
    // Monthly days 1-31
    const mensal = document.getElementById('rec-mensal-days');
    if (mensal && mensal.children.length === 0) {
        for (let d = 1; d <= 31; d++) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'ar-pill ar-pill-sm';
            btn.dataset.monthday = d;
            btn.textContent = d;
            btn.addEventListener('click', () => setMonthDay(d));
            mensal.appendChild(btn);
        }
    }
    // Annual months
    const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const anualMonths = document.getElementById('rec-anual-months');
    if (anualMonths && anualMonths.children.length === 0) {
        MONTHS.forEach((m, i) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'ar-pill';
            btn.dataset.annualmonth = i + 1;
            btn.textContent = m;
            btn.addEventListener('click', () => setAnnualMonth(i + 1));
            anualMonths.appendChild(btn);
        });
    }
    // Annual day select
    const anualDay = document.getElementById('rec-anual-day');
    if (anualDay && anualDay.options.length <= 1) {
        for (let d = 1; d <= 31; d++) {
            const opt = document.createElement('option');
            opt.value = d; opt.textContent = `Dia ${d}`;
            anualDay.appendChild(opt);
        }
        anualDay.addEventListener('change', () => { _diaAnual = anualDay.value ? parseInt(anualDay.value) : null; });
    }

    // Campo de data final da recorrência — mesmo estilo da tela de filtros (dd/mm/aaaa)
    const recurringOpts = document.getElementById('recurring-options');
    if (recurringOpts && !document.getElementById('rec-data-fim')) {
        const grp = document.createElement('div');
        grp.className = 'ar-recurring-group';
        grp.id = 'rec-data-fim-group';
        grp.innerHTML = `
            <span class="ar-group-label">Data final da recorrência</span>
            <div style="margin-top:6px;display:flex;align-items:center;gap:8px;">
                <input type="text" id="rec-data-fim" class="ar-select-small"
                       placeholder="dd/mm/aaaa" maxlength="10" inputmode="numeric"
                       style="min-width:180px;max-width:220px;cursor:text;">
            </div>
        `;
        recurringOpts.appendChild(grp);

        const inputDataFim = document.getElementById('rec-data-fim');
        // Aplica a mesma máscara usada no filtro de registros
        if (window.MainAPI && window.MainAPI.aplicarMascaraData) {
            window.MainAPI.aplicarMascaraData(inputDataFim);
        }
        // Converte dd/mm/aaaa → aaaa-mm-dd para o backend
        inputDataFim.addEventListener('input', function () {
            _dataFimRecorrente = (window.MainAPI && window.MainAPI.dataParaISO)
                ? window.MainAPI.dataParaISO(this.value)
                : null;
            _atualizarResumoRecorrencia();
        });
    }
} // fim _initRecurringSubOptions

/* ══════════════════════════════════════════════════
   Painel de Poupança (Caixinha)
══════════════════════════════════════════════════ */
let _caixinhas = [];
let _caixinhaSelecionadaId = null;

async function _carregarCaixinhas() {
    if (!userId) return;
    try {
        _caixinhas = await MainAPI.getCaixinhas(userId);
    } catch (e) {
        _caixinhas = [];
    }
}

function _renderPainelPoupanca(show) {
    let painel = document.getElementById('ar-poupanca-painel');
    if (!show) {
        if (painel) painel.style.display = 'none';
        _caixinhaSelecionadaId = null;
        return;
    }
    if (!painel) {
        // Cria o painel dinamicamente na primeira vez
        painel = document.createElement('div');
        painel.id = 'ar-poupanca-painel';
        painel.className = 'ar-recurring-wrap ar-span-3';
        // Insere após o bloco de tipo de movimento
        const movWrap = document.getElementById('select_movimento')?.closest('.ar-field-wrap');
        if (movWrap && movWrap.parentNode) {
            movWrap.parentNode.insertBefore(painel, movWrap.nextSibling);
        }
    }
    painel.style.display = '';

    if (_caixinhas.length === 0) {
        painel.innerHTML = `
            <div style="background:var(--cor-tinte-suave);border-radius:12px;padding:14px 16px;border:1px solid var(--cor-tinte-borda);">
                <p style="margin:0;color:var(--cor-texto-secundario);font-size:0.92rem;">
                    <i class='bx bx-info-circle' style="color:var(--cor-principal);"></i>
                    Nenhuma caixinha ativa encontrada. 
                    <strong>Registre o aporte mesmo assim</strong> — ele aparecerá como Poupança sem caixinha vinculada.
                </p>
            </div>`;
        _caixinhaSelecionadaId = null;
        return;
    }

    const opts = _caixinhas.map(c => {
        const pct   = c.percentualAtingido != null ? `${c.percentualAtingido.toFixed(1)}%` : '—';
        const prazo = c.dataPrazo ? ` · prazo ${c.dataPrazo}` : '';
        return `<option value="${c.id}">${c.nome} (${pct} atingido${prazo})</option>`;
    }).join('');

    painel.innerHTML = `
        <div style="background:var(--cor-tinte-suave);border-radius:12px;padding:14px 16px;border:1px solid var(--cor-tinte-borda);display:flex;flex-direction:column;gap:10px;">
            <span style="font-size:0.82rem;font-weight:700;color:var(--cor-texto-secundario);text-transform:uppercase;letter-spacing:0.5px;">Vincular a uma Caixinha</span>
            <select id="ar-select-caixinha" style="background:var(--cor-fundo-card);border:1px solid var(--cor-tinte-borda);border-radius:8px;padding:8px 12px;color:var(--cor-texto-principal);font-size:0.95rem;">
                <option value="">Sem caixinha (aporte avulso)</option>
                ${opts}
            </select>
            <div id="ar-caixinha-info" style="display:none;font-size:0.87rem;color:var(--cor-texto-secundario);line-height:1.6;padding:8px 10px;background:var(--cor-fundo-campo);border-radius:8px;"></div>
        </div>`;

    document.getElementById('ar-select-caixinha').addEventListener('change', function () {
        _caixinhaSelecionadaId = this.value || null;
        const info = document.getElementById('ar-caixinha-info');
        if (!_caixinhaSelecionadaId) { info.style.display = 'none'; return; }
        const cx = _caixinhas.find(c => c.id === _caixinhaSelecionadaId);
        if (!cx) { info.style.display = 'none'; return; }
        const fmt = v => v != null ? `R$ ${Number(v).toFixed(2)}` : '—';
        const pct = cx.percentualAtingido != null ? `${cx.percentualAtingido.toFixed(1)}%` : '—';
        info.style.display = '';
        info.innerHTML = `
            <b>${cx.nome}</b><br>
            Meta: <b>${fmt(cx.valorMeta)}</b> · Acumulado: <b>${fmt(cx.valorAtual)}</b> (${pct})<br>
            ${cx.aporteMensalSugerido != null ? `Aporte mensal sugerido: <b style="color:var(--cor-principal)">${fmt(cx.aporteMensalSugerido)}</b>` : ''}
            ${cx.mesesRestantes != null ? ` · ${cx.mesesRestantes} meses restantes` : ''}`;
    });
}

function _onTipoChange() {
    const tipo = document.getElementById('select_tipo')?.value;
    _renderPainelPoupanca(tipo === 'Poupanca');
    _renderPainelEmprestimo(tipo === 'Emprestimo');
    _renderPainelTransferencia(tipo === 'Transferencia');

    // Para Empréstimo, força parcelas sempre visíveis independente do movimento
    if (tipo === 'Emprestimo') {
        const wrap = document.getElementById('wrap_parcelas');
        if (wrap) wrap.style.display = '';
    }
}

/* ══════════════════════════════════════════════════
   Inicialização
══════════════════════════════════════════════════ */
function gerarInformacoes() {
    // Init tag pickers (empty – options loaded async)
    initTagPicker('inst',   [], 'Escolha instituições...', sel => _onInstChange('inst',   sel));
    initTagPicker('cat',    [], 'Escolha categorias...',   null);
    initTagPicker('m-inst', [], 'Escolha...',              sel => _onInstChange('m-inst', sel));
    initTagPicker('m-cat',  [], 'Escolha...',              null);

    // Apply money mask
    const iV  = document.getElementById('ipt_valor');
    const imV = document.getElementById('ipt_multi_valor');
    if (iV  && window.MainAPI?.aplicarMascaraMoeda) window.MainAPI.aplicarMascaraMoeda(iV);
    if (imV && window.MainAPI?.aplicarMascaraMoeda) window.MainAPI.aplicarMascaraMoeda(imV);

    // Recurring sub-option builders
    _initRecurringSubOptions();

    // Clear-on-focus for text fields
    setupClearOnFocus();

    // Poupança: carrega caixinhas e escuta mudança de tipo
    _carregarCaixinhas();
    const selectTipo = document.getElementById('select_tipo');
    if (selectTipo) selectTipo.addEventListener('change', _onTipoChange);

    // Atualiza saldo display quando o tipo de movimento muda
    // (crédito mostra limite disponível; débito mostra saldo de caixa)
    const selectMov = document.getElementById('select_movimento');
    if (selectMov) selectMov.addEventListener('change', () => {
        const selectedInst = _tp['inst']?.selected || [];
        if (selectedInst.length === 1) atualizarSaldoDisplay(selectedInst[0].id);
    });

    // Load data from API
    gerarCategorias();
    gerarInstituicao();
}

async function atualizarSaldoDisplay(instituicaoUsuarioId) {
    const el = document.getElementById('saldo_display');
    if (!el) return;
    if (!instituicaoUsuarioId || instituicaoUsuarioId === '#') { el.style.display = 'none'; return; }
    try {
        const res = await fetch(`https://my-finance-api-eqdubfc7bvg6brdw.brazilsouth-01.azurewebsites.net/instituicoes/saldo/${Number(instituicaoUsuarioId)}`);
        if (!res.ok) { el.style.display = 'none'; return; }
        const saldo = await res.json();
        const valor = Number(saldo);
        el.textContent = `Saldo disponível: R$ ${valor.toFixed(2)}`;
        // Usa variáveis CSS para cores de saldo
        el.style.color = valor <= 0 ? 'var(--red-700)' : 'var(--cor-principal)';
        el.style.display = '';
    } catch (e) { el.style.display = 'none'; }
}

function toggleParcelas(inputId, movimento) {
    const requer = movimento === 'Credito' || movimento === 'Boleto';
    const wrapId = inputId === 'ipt_parcelas' ? 'wrap_parcelas' : 'wrap_multi_parcelas';
    const wrap  = document.getElementById(wrapId);
    const input = document.getElementById(inputId);
    if (wrap)  wrap.style.display  = requer ? '' : 'none';
    if (input && !requer) input.value = '1';
}

function gerarCategorias() {
    if (!userId) return;
    MainAPI.getTipos(userId)
        .then(json => {
            const options = json.map(c => ({ id: c.id, label: c.categoria.titulo }));
            initTagPicker('cat',   options, 'Escolha categorias...');
            initTagPicker('m-cat', options, 'Escolha...');
        })
        .catch(() => alerta("Não foi possível carregar as categorias. Tente novamente."));
}

const gerarTipos = gerarCategorias;

async function gerarInstituicao() {
    if (!userId) return;
    try {
        const json = await MainAPI.getInstituicoes(userId);
        const options = json.map(i => ({ id: i.id, label: i.intituicao.nome }));
        initTagPicker('inst',   options, 'Escolha instituições...', sel => _onInstChange('inst',   sel));
        initTagPicker('m-inst', options, 'Escolha...',              sel => _onInstChange('m-inst', sel));
        // Atualiza também o picker de destino se já existir
        if (_tp['dest']) initTagPicker('dest', options, 'Escolha a instituição destino...');
    } catch (e) {
        alerta("Não foi possível carregar as instituições. Tente novamente.");
    }
}

/* ══════════════════════════════════════════════════
   Registrar (formulário único)
══════════════════════════════════════════════════ */
async function registrar() {
    const valorInput = document.getElementById('ipt_valor');
    const valor      = window.MainAPI ? window.MainAPI.obterValorMoeda(valorInput) : Number(valorInput.value);
    const titulo     = document.getElementById('ipt_nome').value;
    const tipo       = document.getElementById('select_tipo').value;
    const descRaw    = document.getElementById('ipt_desc').value;
    const Desc       = descRaw || 'Nenhuma descrição fornecida';
    const movimento  = document.getElementById('select_movimento').value;
    const parcelas   = Number(document.getElementById('ipt_parcelas').value) || 1;
    const data       = dataGasto;

    const selectedInst = _tp['inst'] ? _tp['inst'].selected : [];
    const selectedCat  = _tp['cat']  ? _tp['cat'].selected  : [];

    // Para Empréstimo: parcelas obrigatório, taxa opcional
    const taxaEmprestimo = tipo === 'Emprestimo'
        ? (Number(document.getElementById('ar-emprestimo-taxa')?.value) || 0)
        : null;

    // Para Transferência: instituição destino obrigatória
    const selectedDest = _tp['dest'] ? _tp['dest'].selected : [];

    if (!data || data === 0)         return alerta("Data inválida");
    if (!titulo)                     return alerta("Título inválido");
    if (tipo === '#')                return alerta("Escolha o tipo do evento");
    if (selectedCat.length === 0)    return alerta("Escolha uma categoria");
    if (selectedInst.length === 0)   return alerta("Escolha uma instituição");
    if (movimento === '#')           return alerta("Escolha o tipo de movimento");
    if ((movimento === 'Credito' || movimento === 'Boleto') && (parcelas < 1 || isNaN(parcelas)))
        return alerta("Informe a quantidade de parcelas (mínimo 1)");
    if (tipo === 'Emprestimo' && (parcelas < 1 || isNaN(parcelas)))
        return alerta("Informe a quantidade de parcelas do empréstimo (mínimo 1)");
    if (tipo === 'Transferencia' && selectedDest.length === 0)
        return alerta("Escolha a instituição de destino para a transferência");

    // Validação de valor: quando múltiplas instituições o campo único fica oculto
    if (selectedInst.length <= 1) {
        if (valor <= 0 || !valor) return alerta("Valor inválido");
    } else {
        const algumValor = selectedInst.some(s => {
            const ai = document.getElementById(`inst-amt-inst-${s.id}`);
            return ai && (window.MainAPI ? window.MainAPI.obterValorMoeda(ai) : 0) > 0;
        });
        if (!algumValor) return alerta("Informe o valor para cada instituição");
    }

    // Verificar saldo quando o tipo exige débito (exceto crédito, que não debita imediatamente)
    // Usa saldo-debito para não considerar o limite de crédito em transações de débito
    if ((tipo === 'Gasto' || tipo === 'Transferencia') && selectedInst.length === 1 && movimento !== 'Credito') {
        try {
            const resSaldo = await fetch(`https://my-finance-api-eqdubfc7bvg6brdw.brazilsouth-01.azurewebsites.net/instituicoes/saldo-debito/${Number(selectedInst[0].id)}`);
            if (resSaldo.ok) {
                const saldo = await resSaldo.json();
                if (Number(saldo) < valor)
                    return alerta(`Saldo insuficiente. Disponível: R$ ${Number(saldo).toFixed(2)}`);
            }
        } catch (e) { console.warn("Não foi possível verificar saldo:", e); }
    }

    // Montar lista de instituições (com valor individual quando múltiplas)
    const instituicaoList = selectedInst.map(s => {
        let instValor = valor;
        if (selectedInst.length > 1) {
            const amtInput = document.getElementById(`inst-amt-inst-${s.id}`);
            if (amtInput) {
                const v = window.MainAPI ? window.MainAPI.obterValorMoeda(amtInput) : Number(amtInput.value);
                if (v > 0) instValor = v;
            }
        }
        return { instituicaoUsuario_id: Number(s.id), tipoMovimento: movimento, valor: instValor, parcelas };
    });

    // Para Transferência: adiciona destino como segunda instituição
    if (tipo === 'Transferencia' && selectedDest.length > 0) {
        const dest = selectedDest[0];
        instituicaoList.push({ instituicaoUsuario_id: Number(dest.id), tipoMovimento: movimento, valor, parcelas: 1 });
    }

    // Quando múltiplas instituições, valor total = soma dos valores individuais
    const valorTotal = selectedInst.length > 1
        ? instituicaoList.filter(i => !selectedDest.some(d => Number(d.id) === i.instituicaoUsuario_id))
              .reduce((acc, i) => acc + i.valor, 0)
        : valor;

    // Dados de recorrência — se ativada, usa endpoint /registros/recorrente
    if (_isRecorrente) {
        // Validações extras de recorrência
        if (tipo !== 'Gasto' && tipo !== 'Recebimento')
            return alerta("Recorrência disponível apenas para Gasto e Recebimento");
        if (!_periodicidade)
            return alerta("Escolha a periodicidade da recorrência");
        if (_periodicidade === 'semanal' && _diasSemana.length === 0)
            return alerta("Escolha pelo menos um dia da semana");
        if (_periodicidade === 'mensal' && !_diaMes)
            return alerta("Escolha o dia do mês");
        if (_periodicidade === 'anual' && (!_mesAnual || !_diaAnual))
            return alerta("Escolha o mês e o dia do ano");
        if (!_dataFimRecorrente)
            return alerta("Informe a data final da recorrência");

        // Capitalizar primeira letra do periodicidade (ex: 'semanal' → 'Semanal')
        const periodicidade = _periodicidade.charAt(0).toUpperCase() + _periodicidade.slice(1);

        // Mapear índices numéricos para DayOfWeek Java
        const diasDaSemana = _diasSemana.map(n => _DOW_MAP[n]);

        // Dia do mês ou do ano
        const dia = _diaMes || _diaAnual || null;

        alerta(`Registrando recorrência...
            ${ window.MascoteApp ? window.MascoteApp.getCorrendoHTML() : '<div class="glaceonCorrendoDiv"><img class="glaceon correndo" src="/assets/gif/Gifs da Glaceon/glaceon-correndo-unscreen.gif" alt=""></div>' }`, 0);

        MainAPI.registrarRecorrente({
            financeiro: {
                usuario_id: userId,
                tipo,
                valor: valorTotal,
                descricao: Desc,
                dataEvento: data,          // data de início
                periodicidade,             // Diario | Semanal | Mensal | Anual
                diasDaSemana,              // ["MONDAY", "FRIDAY", ...]
                dia,                       // dia do mês ou do ano
                dataFim: _dataFimRecorrente, // data final
                intervalo: 1
            },
            instituicao: instituicaoList,
            detalhe: { categoriaUsuario_id: selectedCat.map(s => Number(s.id)), tituloGasto: titulo }
        }).then(async (response) => {
            if (response.ok) {
                window.dispatchEvent(new Event('xp:refresh'));
                markFieldsForClear(['ipt_nome', 'ipt_valor', 'ipt_desc']);
                alerta('✔ Recorrência registrada com sucesso!', 3000);
            } else {
                let detalhe = "";
                try { const corpo = await response.json(); detalhe = corpo.message || corpo.error || JSON.stringify(corpo); }
                catch (_) { detalhe = `HTTP ${response.status}`; }
                alerta(`Erro ao registrar recorrência (${response.status}): ${detalhe}`);
            }
        }).catch(err => {
            console.error("Erro de rede:", err);
            alerta("Erro de conexão ao registrar recorrência.");
        });
        return; // não continua para o registro normal
    }

    alerta(`Registrando...
        ${ window.MascoteApp ? window.MascoteApp.getCorrendoHTML() : '<div class="glaceonCorrendoDiv"><img class="glaceon correndo" src="/assets/gif/Gifs da Glaceon/glaceon-correndo-unscreen.gif" alt=""></div>' }`, 0);

    MainAPI.registrarGasto({
        financeiro: {
            usuario_id: userId,
            tipo,
            valor: valorTotal,
            descricao: Desc,
            dataEvento: data,
            ...(tipo === 'Poupanca' && _caixinhaSelecionadaId ? { caixinha_id: _caixinhaSelecionadaId } : {}),
            ...(tipo === 'Emprestimo' && taxaEmprestimo != null ? { taxaRendimento: taxaEmprestimo } : {})
        },
        instituicao: instituicaoList,
        detalhe: { categoriaUsuario_id: selectedCat.map(s => Number(s.id)), tituloGasto: titulo }
    }).then(async (response) => {
        if (response.ok) {
            window.dispatchEvent(new Event('xp:refresh'));
            if (selectedInst.length === 1) atualizarSaldoDisplay(selectedInst[0].id);
            // Manter campos – marcar para limpar ao clicar
            markFieldsForClear(['ipt_nome', 'ipt_valor', 'ipt_desc']);
            alerta('✔ Registro realizado com sucesso!<br><small>Clique nos campos de texto para editá-los.</small>', 3000);
        } else {
            let detalhe = "";
            try { const corpo = await response.json(); detalhe = corpo.message || corpo.error || JSON.stringify(corpo); }
            catch (_) { detalhe = `HTTP ${response.status}`; }
            alerta(`Erro ao registrar (${response.status}): ${detalhe}`);
        }
    }).catch(err => {
        console.error("Erro de rede:", err);
        alerta("Erro de conexão ao registrar.");
    });
}

function atualizarSaldo(valor, instituicao) {
    MainAPI.atualizarSaldo({ valorServer: valor, instituicaoServer: instituicao })
        .then(resposta => {
            if (!resposta.ok) console.error("Erro ao atualizar saldo", resposta);
        });
}

function adicionarTipos() {
    if (!userId) return alerta(`Nenhum usuário logado. <button onclick='div_alerta.style.display="none"'>OK</button>`);
    const titulo = document.getElementById("ipt_tituloTipo").value.trim();
    if (!titulo) return alerta(`Digite um nome para o tipo <button onclick='div_alerta.style.display="none"'>OK</button>`);
    MainAPI.adicionarTipo({ titulo }, userId).then(resposta => {
        if (resposta.ok) {
            gerarTipos();
            adicionarTipo.close();
            alerta(`Tipo adicionado com sucesso!<br><button onclick="div_alerta.style.display='none'">OK</button>`);
        } else {
            alerta(`Houve um erro ao adicionar tipo <button onclick='div_alerta.style.display="none"'>OK</button>`);
        }
    }).catch(() => alerta(`Erro ao conectar ao servidor. <button onclick='div_alerta.style.display="none"'>OK</button>`));
}

/* ══════════════════════════════════════════════════
   Calendário
══════════════════════════════════════════════════ */
const btnAbrir    = document.getElementById("calendario");
const modal       = document.getElementById("modal");
const fechar      = document.getElementById("fechar");
const dias        = document.getElementById("dias");
const mesAno      = document.getElementById("mesAno");
const gastosDoDia = document.getElementById("gastosDoDia");
const confirmar   = document.getElementById("confirmar");
const btnAnterior = document.getElementById("btnAnterior");
const btnProximo  = document.getElementById("btnProximo");

let dataSelecionada = null;
let hoje     = new Date();
let mesAtual = hoje.getMonth();
let anoAtual = hoje.getFullYear();
let modalAbertoPor = 'single';
let lote = [];

// O botão #calendario abre o modal para selecionar a data do evento único
btnAbrir.onclick = () => { modalAbertoPor = 'single'; modal.style.display = "flex"; };

function abrirCalendarioMulti() { modalAbertoPor = 'multi'; modal.style.display = 'flex'; }
fechar.onclick    = () => modal.style.display = "none";
btnAnterior.onclick = () => {
    mesAtual--; if (mesAtual < 0) { mesAtual = 11; anoAtual--; } gerarCalendario();
};
btnProximo.onclick = () => {
    mesAtual++; if (mesAtual > 11) { mesAtual = 0; anoAtual++; } gerarCalendario();
};

async function buscarGastosDia(dataSelecionada) {
    const json = await MainAPI.buscarRegistrosPorData(userId, dataSelecionada);
    let listaGastos = [];
    for (let c = 0; c < json.length; c++) {
        const data = new Date(json[c].dataGasto);
        if (data.toISOString().split("T")[0] === dataSelecionada) listaGastos.push(json[c]);
    }
    return listaGastos;
}

function gerarCalendario() {
    dias.innerHTML = "";
    let primeiroDia = new Date(anoAtual, mesAtual, 1).getDay();
    let totalDias   = new Date(anoAtual, mesAtual + 1, 0).getDate();
    mesAno.innerText = new Date(anoAtual, mesAtual).toLocaleString("pt-BR", { month: "long", year: "numeric" });
    for (let i = 0; i < primeiroDia; i++) dias.innerHTML += `<span></span>`;
    for (let dia = 1; dia <= totalDias; dia++) {
        let dataFormatada = `${anoAtual}-${String(mesAtual + 1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
        let span = document.createElement("span");
        span.innerText = dia;
        span.onclick = () => selecionarDia(dataFormatada, span);
        dias.appendChild(span);
    }
}

async function selecionarDia(data, elemento) {
    dataSelecionada = data;
    document.querySelectorAll(".diaSelecionado").forEach(e => e.classList.remove("diaSelecionado"));
    elemento.classList.add("diaSelecionado");
    confirmar.disabled = false;
    try {
        const listaGastos = await buscarGastosDia(data);
        const gastosDia = document.getElementById('gastosDia');
        if (listaGastos.length > 0) {
            const dataRegistro = listaGastos[0].eventoFinanceiro?.dataEvento ?? listaGastos[0].dataGasto;
            const novaData     = new Date(dataRegistro);
            const dataFmt = isNaN(novaData.getTime()) ? formatarDataBR(data) : novaData.toLocaleDateString("pt-BR");
            gastosDia.innerHTML = `<b>Gastos de ${dataFmt}:</b><br>`;
            listaGastos.forEach(g => {
                const titulo = g.gastoDetalhe?.tituloGasto ?? g.tituloGasto;
                const valor  = g.eventoFinanceiro?.valor ?? g.valor;
                gastosDia.innerHTML += `<b>${titulo} - R$${valor}</b><br>`;
            });
        } else {
            gastosDia.innerHTML = "<i>Nenhum gasto neste dia.</i>";
        }
    } catch (e) {
        const gastosDia = document.getElementById('gastosDia');
        if (gastosDia) gastosDia.innerHTML = "";
    }
}

confirmar.onclick = () => {
    modal.style.display = "none";
    const dataFormatada = formatarDataBR(dataSelecionada);
    if (modalAbertoPor === 'multi') {
        const label  = document.getElementById('multi_data_label');
        const hidden = document.getElementById('multi_data');
        if (label)  { label.textContent = "Dia: " + dataFormatada; label.classList.remove('hidden'); label.style.display = ''; }
        if (hidden) hidden.value = dataSelecionada;
    } else {
        const dataEl = document.getElementById('data');
        if (dataEl) { dataEl.style.display = ''; dataEl.textContent = dataFormatada; dataEl.classList.remove('hidden'); }
        dataGasto = dataSelecionada;
    }
};

gerarCalendario();

function formatarDataBR(dataISO) {
    const [ano, mes, dia] = dataISO.split("-");
    return `${dia}/${mes}/${ano}`;
}

/* ══════════════════════════════════════════════════
   Múltiplos Registros
══════════════════════════════════════════════════ */
function adicionarAoLote() {
    const titulo    = document.getElementById('ipt_multi_nome').value.trim();
    const tipo      = document.getElementById('multi_select_tipo').value;
    const movimento = document.getElementById('multi_select_movimento').value;
    const parcelas  = Number(document.getElementById('ipt_multi_parcelas').value) || 1;
    const valorInput = document.getElementById('ipt_multi_valor');
    const valor     = window.MainAPI ? window.MainAPI.obterValorMoeda(valorInput) : Number(valorInput.value);
    const descRaw   = document.getElementById('ipt_multi_desc').value.trim();
    const desc      = descRaw || 'Nenhuma descrição fornecida';
    const data      = document.getElementById('multi_data').value;

    const selectedInst = _tp['m-inst'] ? _tp['m-inst'].selected : [];
    const selectedCat  = _tp['m-cat']  ? _tp['m-cat'].selected  : [];

    if (!titulo)                   return alerta('Título inválido');
    if (tipo === '#')              return alerta('Escolha o tipo do evento');
    if (selectedCat.length === 0)  return alerta('Escolha uma categoria');
    if (selectedInst.length === 0) return alerta('Escolha uma instituição');
    if (movimento === '#')         return alerta('Escolha o tipo de movimento');
    if ((movimento === 'Credito' || movimento === 'Boleto') && (parcelas < 1 || isNaN(parcelas)))
        return alerta('Informe a quantidade de parcelas (mínimo 1)');
    if (!data)                      return alerta('Escolha uma data');

    // Validação de valor: múltiplas instituições têm campos próprios
    if (selectedInst.length <= 1) {
        if (valor <= 0 || isNaN(valor)) return alerta('Valor inválido');
    } else {
        const algumValor = selectedInst.some(s => {
            const ai = document.getElementById(`inst-amt-m-inst-${s.id}`);
            return ai && (window.MainAPI ? window.MainAPI.obterValorMoeda(ai) : 0) > 0;
        });
        if (!algumValor) return alerta('Informe o valor para cada instituição');
    }

    const instituicaoList = selectedInst.map(s => {
        let instValor = valor;
        if (selectedInst.length > 1) {
            const amtInput = document.getElementById(`inst-amt-m-inst-${s.id}`);
            if (amtInput) {
                const v = window.MainAPI ? window.MainAPI.obterValorMoeda(amtInput) : Number(amtInput.value);
                if (v > 0) instValor = v;
            }
        }
        return { instituicaoUsuario_id: Number(s.id), tipoMovimento: movimento, valor: instValor, parcelas };
    });

    const valorTotal = selectedInst.length > 1
        ? instituicaoList.reduce((acc, i) => acc + i.valor, 0)
        : valor;

    lote.push({
        financeiro: { usuario_id: userId, tipo, valor: valorTotal, descricao: desc, dataEvento: data },
        instituicao: instituicaoList,
        detalhe: { categoriaUsuario_id: selectedCat.map(s => Number(s.id)), tituloGasto: titulo },
        _display: {
            titulo, tipo, movimento,
            instNome: selectedInst.map(s => s.label).join(', '),
            categorias: selectedCat.map(s => s.label).join(', '),
            valor: valorTotal
        }
    });

    renderizarLote();

    // Manter campos – marcar para limpar ao clicar
    markFieldsForClear(['ipt_multi_nome', 'ipt_multi_valor', 'ipt_multi_desc']);
}

function renderizarLote() {
    const tbody = document.getElementById('corpoLote');
    if (lote.length === 0) {
        tbody.innerHTML = `<tr id="loteVazio"><td colspan="6" class="ar-lote-vazio">Nenhum registro adicionado ainda.</td></tr>`;
        return;
    }
    tbody.innerHTML = '';
    lote.forEach((item, i) => {
        const d = item._display;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${d.titulo}</td>
            <td>${d.tipo}</td>
            <td>${d.movimento}</td>
            <td>${d.instNome}</td>
            <td>R$ ${d.valor.toFixed(2)}</td>
            <td>
                <div class="ar-lote-actions">
                    <button class="ar-lote-btn edit" onclick="editarDoLote(${i})" title="Editar">✏</button>
                    <button class="ar-lote-btn delete" onclick="removerDoLote(${i})" title="Remover">✕</button>
                </div>
            </td>`;
        tbody.appendChild(tr);
    });
}

function removerDoLote(i) {
    lote.splice(i, 1);
    renderizarLote();
}

function editarDoLote(i) {
    const item = lote[i];
    const d    = item._display;

    // Preencher campos do formulário
    document.getElementById('ipt_multi_nome').value = d.titulo;
    document.getElementById('multi_select_tipo').value = item.financeiro.tipo || '#';
    document.getElementById('multi_select_movimento').value = item.instituicao[0]?.tipoMovimento || '#';
    toggleParcelas('ipt_multi_parcelas', item.instituicao[0]?.tipoMovimento || '#');

    const valInput = document.getElementById('ipt_multi_valor');
    valInput.value = d.valor.toFixed(2).replace('.', ',');
    // Reaplica máscara se disponível
    if (window.MainAPI?.aplicarMascaraMoeda) window.MainAPI.aplicarMascaraMoeda(valInput);

    document.getElementById('ipt_multi_desc').value =
        item.financeiro.descricao !== 'Nenhuma descrição fornecida' ? item.financeiro.descricao : '';

    // Restaurar tag pickers de instituição
    if (_tp['m-inst']) {
        _tp['m-inst'].selected = item.instituicao.map(inst => {
            const opt = _tp['m-inst'].options.find(o => String(o.id) === String(inst.instituicaoUsuario_id));
            return opt || { id: inst.instituicaoUsuario_id, label: String(inst.instituicaoUsuario_id) };
        });
        _renderTagPicker('m-inst');
        _onInstChange('m-inst', _tp['m-inst'].selected);
    }

    // Restaurar tag pickers de categoria
    if (_tp['m-cat']) {
        _tp['m-cat'].selected = item.detalhe.categoriaUsuario_id.map(catId => {
            const opt = _tp['m-cat'].options.find(o => String(o.id) === String(catId));
            return opt || { id: catId, label: String(catId) };
        });
        _renderTagPicker('m-cat');
    }

    // Remover do lote e atualizar tabela
    lote.splice(i, 1);
    renderizarLote();

    // Scroll até o formulário
    const form = document.querySelector('#multiplosRegistros .multi-form');
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });

    alerta('Registro movido para edição. Altere e clique em Adicionar.', 3000);
}

function salvarLote() {
    if (lote.length === 0) return alerta('Nenhum registro no lote');
    alerta(`Salvando ${lote.length} registro(s)...`, 0);
    const promessas = lote.map(item => MainAPI.registrarGasto({
        financeiro: item.financeiro,
        instituicao: item.instituicao,
        detalhe: item.detalhe
    }));
    Promise.all(promessas).then(respostas => {
        const erros = respostas.filter(r => !r.ok).length;
        if (erros === 0) {
            window.dispatchEvent(new Event('xp:refresh'));
            lote = [];
            renderizarLote();
            alerta(`${respostas.length} registro(s) salvos com sucesso!<br><button onclick="document.getElementById('div_alerta').style.display='none'">OK</button>`, 0);
        } else {
            alerta(`${erros} erro(s) ao salvar. Verifique e tente novamente.`);
        }
    }).catch(() => alerta('Erro ao conectar ao servidor'));
}

/* ══════════════════════════════════════════════════
   Troca de aba
══════════════════════════════════════════════════ */
function trocarFormulario(tela) {
    const cardUnico    = document.getElementById("cardUnico");
    const cardMultiplo = document.getElementById("multiplosRegistros");
    const tabUnico     = document.getElementById("tabUnico");
    const tabMultiplo  = document.getElementById("tabMultiplo");
    if (tela === "multiplosRegistros") {
        if (cardUnico)    cardUnico.style.display    = "none";
        if (cardMultiplo) cardMultiplo.style.display = "flex";
        if (tabUnico)     tabUnico.classList.remove("ativo");
        if (tabMultiplo)  tabMultiplo.classList.add("ativo");
    } else {
        if (cardUnico)    cardUnico.style.display    = "";
        if (cardMultiplo) cardMultiplo.style.display = "none";
        if (tabUnico)     tabUnico.classList.add("ativo");
        if (tabMultiplo)  tabMultiplo.classList.remove("ativo");
    }
}

/* Header titulos (mantido para compatibilidade) */
const titulos = document.querySelectorAll(".headerFormulario .titulo");
titulos.forEach(item => {
    item.addEventListener("click", () => {
        titulos.forEach(e => e.classList.remove("ativo"));
        item.classList.add("ativo");
    });
});

