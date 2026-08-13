// ============================================================================
// EMPRÉSTIMOS - JavaScript
// ============================================================================

const API_BASE = 'http://localhost:8080';
let usuarioLogado = null;
let emprestimos = [];
let emprestimoEmEdicao = null;
let emprestimoParaPagamento = null;
let filtroAtual = 'todos';
let _instituicoes = [];

// Bancários
let bancarios = [];
let bancarioParaPagamento = null;
let filtroBancarioAtual = 'todos';
let parcelasCarregadas = {};
let parcelasPaginaAtual = 1;
let parcelasPorPagina = 5;
let emprestimoIdAtualParcelas = null;

// ── Inicialização ──
window.addEventListener('DOMContentLoaded', () => {
    const userData = localStorage.getItem('usuarioLogado');
    if (!userData) { window.location.href = 'index.html'; return; }
    usuarioLogado = JSON.parse(userData);

    // Aplicar máscaras - pessoais
    const aplicarMascara = (id, fn) => { const el = document.getElementById(id); if (el && window.MainAPI?.[fn]) window.MainAPI[fn](el); };
    aplicarMascara('inputValor', 'aplicarMascaraMoeda');
    aplicarMascara('inputDataPrevisao', 'aplicarMascaraData');
    aplicarMascara('inputDataEmprestimo', 'aplicarMascaraData');
    aplicarMascara('inputValorPagamento', 'aplicarMascaraMoeda');
    aplicarMascara('inputDataPagamento', 'aplicarMascaraData');
    // Máscaras bancários
    aplicarMascara('bInputPrincipal', 'aplicarMascaraMoeda');
    aplicarMascara('bInputContratacao', 'aplicarMascaraData');
    aplicarMascara('bInputPrimeiraParcela', 'aplicarMascaraData');
    aplicarMascara('bPagDataPagamento', 'aplicarMascaraData');

    // Auto-calcular parcela ao digitar
    ['bInputPrincipal','bInputTaxa','bInputParcelas'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', calcularParcelaEstimada);
    });

    carregarInstituicoes();
    carregarResumo();
    carregarEmprestimos();
    carregarBancarios();
});

// ── Tabs ──
function trocarAba(aba) {
    document.getElementById('abaPessoais').style.display = aba === 'pessoais' ? '' : 'none';
    document.getElementById('abaBancarios').style.display = aba === 'bancarios' ? '' : 'none';
    document.getElementById('tabPessoais').classList.toggle('ativo', aba === 'pessoais');
    document.getElementById('tabBancarios').classList.toggle('ativo', aba === 'bancarios');
}

// ============================================================================
// INSTITUIÇÕES
// ============================================================================

async function carregarInstituicoes() {
    try {
        _instituicoes = await window.MainAPI.getInstituicoes(usuarioLogado.id);
        popularSelectInstituicoes('inputInstituicao');
        popularSelectInstituicoes('inputInstituicaoPagamento');
    } catch (e) {
        console.error('Erro ao carregar instituições:', e);
    }
}

function popularSelectInstituicoes(selectId) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    sel.innerHTML = '<option value="">Selecione a conta...</option>';
    _instituicoes.forEach(inst => {
        const opt = document.createElement('option');
        opt.value = inst.id;
        opt.textContent = inst.intituicao.nome;
        sel.appendChild(opt);
    });
}

function atualizarLabelInstituicao() {
    const tipo = document.getElementById('inputTipo')?.value;
    const label = document.getElementById('labelInstituicao');
    if (!label) return;
    if (tipo === 'EMPRESTEI') {
        label.textContent = 'Conta de onde sairá o dinheiro *';
    } else if (tipo === 'PEDI_EMPRESTADO') {
        label.textContent = 'Conta onde o dinheiro será recebido *';
    } else {
        label.textContent = 'Conta *';
    }
}

// ============================================================================
// CARREGAR DADOS
// ============================================================================

async function carregarResumo() {
    try {
        const response = await fetch(`${API_BASE}/emprestimos/usuarios/${usuarioLogado.id}/resumo`);
        if (!response.ok) throw new Error('Erro ao carregar resumo');

        const resumo = await response.json();

        document.getElementById('valorAReceber').textContent = formatarMoeda(resumo.valorTotalAReceber);
        document.getElementById('detalhesReceber').textContent =
            `${resumo.quantidadePessoasDevem} pessoa(s)`;

        document.getElementById('valorAPagar').textContent = formatarMoeda(resumo.valorTotalAPagar);
        document.getElementById('detalhesPagar').textContent =
            `${resumo.quantidadePessoasDevo} pessoa(s)`;
    } catch (error) {
        console.error('Erro ao carregar resumo:', error);
        mostrarNotificacao('Erro ao carregar resumo', 'erro');
    }
}

async function carregarEmprestimos() {
    try {
        const response = await fetch(`${API_BASE}/emprestimos/usuarios/${usuarioLogado.id}`);

        if (response.status === 204) {
            emprestimos = [];
            renderizarEmprestimos();
            return;
        }

        if (!response.ok) throw new Error('Erro ao carregar empréstimos');

        emprestimos = await response.json();
        renderizarEmprestimos();
    } catch (error) {
        console.error('Erro ao carregar empréstimos:', error);
        mostrarNotificacao('Erro ao carregar empréstimos', 'erro');
    }
}

// ============================================================================
// RENDERIZAÇÃO
// ============================================================================

function renderizarEmprestimos() {
    const container = document.getElementById('listaEmprestimos');

    let emprestimosFiltrados = [...emprestimos];

    // Aplicar filtros
    switch (filtroAtual) {
        case 'EMPRESTEI':
            emprestimosFiltrados = emprestimos.filter(e => e.tipo === 'EMPRESTEI');
            break;
        case 'PEDI_EMPRESTADO':
            emprestimosFiltrados = emprestimos.filter(e => e.tipo === 'PEDI_EMPRESTADO');
            break;
        case 'pendentes':
            emprestimosFiltrados = emprestimos.filter(e =>
                e.status === 'PENDENTE' || e.status === 'PAGO_PARCIAL');
            break;
        case 'quitados':
            emprestimosFiltrados = emprestimos.filter(e => e.status === 'QUITADO');
            break;
    }

    if (emprestimosFiltrados.length === 0) {
        container.innerHTML = `
            <div class="estado-vazio">
                <i class='bx bx-wallet'></i>
                <h3>Nenhum empréstimo encontrado</h3>
                <p>Clique em "Novo Empréstimo" para registrar um empréstimo.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = emprestimosFiltrados.map(e => criarCardEmprestimo(e)).join('');
}

function criarCardEmprestimo(emprestimo) {
    const tipoClass = emprestimo.tipo === 'EMPRESTEI' ? 'emprestei' : 'pedi-emprestado';
    const tipoLabel = emprestimo.tipo === 'EMPRESTEI' ? 'Emprestei' : 'Peguei Emprestado';
    const tipoIcon = emprestimo.tipo === 'EMPRESTEI' ? 'bx-down-arrow-circle' : 'bx-up-arrow-circle';

    const statusClass = emprestimo.status.toLowerCase().replace('_', '-');
    const statusLabel = formatarStatus(emprestimo.status);
    const statusIcon = getStatusIcon(emprestimo.status);

    const isQuitado = emprestimo.status === 'QUITADO';

    let dataInfo = '';
    if (emprestimo.dataEmprestimo) {
        dataInfo += `
            <div class="emprestimo-data">
                <i class='bx bx-calendar-check'></i>
                Emprestado em: ${formatarData(emprestimo.dataEmprestimo)}
            </div>
        `;
    }
    if (emprestimo.dataPrevisao) {
        const dataPrevisao = new Date(emprestimo.dataPrevisao);
        const hoje = new Date();
        const atrasado = !isQuitado && dataPrevisao < hoje;
        const icon = atrasado ? 'bx-error-circle' : 'bx-calendar';
        const classe = atrasado ? 'style="color: #ef4444;"' : '';
        dataInfo += `
            <div class="emprestimo-data" ${classe}>
                <i class='bx ${icon}'></i>
                Previsão: ${formatarData(emprestimo.dataPrevisao)}
                ${atrasado ? '(Atrasado!)' : ''}
            </div>
        `;
    }

    const progressoHtml = emprestimo.status !== 'QUITADO' ? `
        <div class="emprestimo-progresso">
            <div class="progresso-bar-container">
                <div class="progresso-bar" style="width: ${emprestimo.percentualPago}%"></div>
            </div>
            <div class="progresso-texto">
                ${emprestimo.percentualPago.toFixed(1)}% pago
            </div>
        </div>
    ` : '';

    const observacoesHtml = emprestimo.observacoes ? `
        <div class="emprestimo-observacoes">
            <strong>Observações:</strong> ${emprestimo.observacoes}
        </div>
    ` : '';

    const botoesAcao = isQuitado ? `
        <button class="btn-acao reabrir" onclick="reabrirEmprestimo('${emprestimo.id}')">
            <i class='bx bx-refresh'></i> Reabrir
        </button>
        <button class="btn-acao deletar" onclick="confirmarDeletar('${emprestimo.id}')">
            <i class='bx bx-trash'></i> Deletar
        </button>
    ` : `
        <button class="btn-acao registrar" onclick="abrirModalPagamento('${emprestimo.id}')">
            <i class='bx bx-money'></i> Registrar Pagamento
        </button>
        <button class="btn-acao quitar" onclick="quitarEmprestimo('${emprestimo.id}')">
            <i class='bx bx-check-circle'></i> Quitar
        </button>
        <button class="btn-acao editar" onclick="editarEmprestimo('${emprestimo.id}')">
            <i class='bx bx-edit'></i> Editar
        </button>
        <button class="btn-acao deletar" onclick="confirmarDeletar('${emprestimo.id}')">
            <i class='bx bx-trash'></i> Deletar
        </button>
    `;

    return `
        <div class="emprestimo-item ${tipoClass} ${isQuitado ? 'quitado' : ''}">
            <div class="emprestimo-header">
                <div class="emprestimo-info">
                    <div class="emprestimo-tipo ${tipoClass}">
                        <i class='bx ${tipoIcon}'></i>
                        ${tipoLabel}
                    </div>
                    <h3 class="emprestimo-pessoa">${emprestimo.pessoaOuGrupo}</h3>
                    ${dataInfo}
                </div>
                <div class="emprestimo-status ${statusClass}">
                    <i class='bx ${statusIcon}'></i>
                    ${statusLabel}
                </div>
            </div>
            
            <div class="emprestimo-valores">
                <div class="emprestimo-valor-item">
                    <span class="emprestimo-valor-label">Valor Total</span>
                    <span class="emprestimo-valor-numero">${formatarMoeda(emprestimo.valorTotal)}</span>
                </div>
                <div class="emprestimo-valor-item">
                    <span class="emprestimo-valor-label">Valor Pago</span>
                    <span class="emprestimo-valor-numero">${formatarMoeda(emprestimo.valorPago)}</span>
                </div>
                <div class="emprestimo-valor-item">
                    <span class="emprestimo-valor-label">Valor Restante</span>
                    <span class="emprestimo-valor-numero">${formatarMoeda(emprestimo.valorRestante)}</span>
                </div>
            </div>
            
            ${progressoHtml}
            ${observacoesHtml}
            
            <div class="emprestimo-acoes-item">
                ${botoesAcao}
            </div>
        </div>
    `;
}

// ============================================================================
// FILTROS
// ============================================================================

function filtrarEmprestimos(filtro) {
    filtroAtual = filtro;

    // Atualizar botões ativos
    document.querySelectorAll('.btn-filtro').forEach(btn => {
        btn.classList.remove('ativo');
    });
    document.querySelector(`[data-filtro="${filtro}"]`).classList.add('ativo');

    renderizarEmprestimos();
}

// ============================================================================
// MODAIS
// ============================================================================

function abrirModalNovoEmprestimo() {
    emprestimoEmEdicao = null;
    document.getElementById('modalTitulo').textContent = 'Novo Empréstimo Pessoal';
    document.getElementById('formEmprestimo').reset();
    const iValor = document.getElementById('inputValor');
    if (iValor && window.MainAPI?.resetarMascaraMoeda) window.MainAPI.resetarMascaraMoeda(iValor);
    // Pré-preenche data do empréstimo com hoje
    const iDataEmpNovo = document.getElementById('inputDataEmprestimo');
    if (iDataEmpNovo) {
        const hoje = new Date();
        iDataEmpNovo.value = String(hoje.getDate()).padStart(2,'0') + '/' +
            String(hoje.getMonth()+1).padStart(2,'0') + '/' + hoje.getFullYear();
    }
    popularSelectInstituicoes('inputInstituicao');
    atualizarLabelInstituicao();
    document.getElementById('modalEmprestimo').classList.add('aberto');
}

function editarEmprestimo(emprestimoId) {
    emprestimoEmEdicao = emprestimos.find(e => e.id === emprestimoId);
    if (!emprestimoEmEdicao) return;

    document.getElementById('modalTitulo').textContent = 'Editar Empréstimo';
    document.getElementById('inputTipo').value    = emprestimoEmEdicao.tipo;
    document.getElementById('inputPessoa').value  = emprestimoEmEdicao.pessoaOuGrupo;
    document.getElementById('inputObservacoes').value = emprestimoEmEdicao.observacoes || '';

    // Valor com máscara
    const iValor = document.getElementById('inputValor');
    const cents  = Math.round((emprestimoEmEdicao.valorTotal || 0) * 100);
    iValor.dataset.centavos = String(cents);
    const reais = Math.floor(cents / 100);
    iValor.value = 'R$ ' + String(reais).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + String(cents % 100).padStart(2, '0');

    // Data do empréstimo
    const iDataEmpEdit = document.getElementById('inputDataEmprestimo');
    iDataEmpEdit.value = (window.MainAPI?.dataDeISO && emprestimoEmEdicao.dataEmprestimo)
        ? window.MainAPI.dataDeISO(emprestimoEmEdicao.dataEmprestimo)
        : '';

    // Data com máscara (ISO → dd/mm/aaaa)
    const iData = document.getElementById('inputDataPrevisao');
    iData.value = (window.MainAPI?.dataDeISO && emprestimoEmEdicao.dataPrevisao)
        ? window.MainAPI.dataDeISO(emprestimoEmEdicao.dataPrevisao)
        : '';

    document.getElementById('modalEmprestimo').classList.add('aberto');
}

function fecharModalEmprestimo() {
    document.getElementById('modalEmprestimo').classList.remove('aberto');
    emprestimoEmEdicao = null;
}

function abrirModalPagamento(emprestimoId) {
    emprestimoParaPagamento = emprestimos.find(e => e.id === emprestimoId);
    if (!emprestimoParaPagamento) return;

    document.getElementById('infoPagamento').innerHTML = `
        <strong>Empréstimo:</strong> ${emprestimoParaPagamento.pessoaOuGrupo}<br>
        <strong>Valor Total:</strong> ${formatarMoeda(emprestimoParaPagamento.valorTotal)}<br>
        <strong>Já Pago:</strong> ${formatarMoeda(emprestimoParaPagamento.valorPago)}<br>
        <strong>Restante:</strong> ${formatarMoeda(emprestimoParaPagamento.valorRestante)}
    `;

    // Atualizar label da conta conforme o tipo
    const labelPag = document.getElementById('labelInstituicaoPagamento');
    if (labelPag) {
        labelPag.textContent = emprestimoParaPagamento.tipo === 'EMPRESTEI'
            ? 'Conta onde receberá o pagamento *'
            : 'Conta de onde sairá o pagamento *';
    }

    document.getElementById('formPagamento').reset();
    const iPag = document.getElementById('inputValorPagamento');
    if (iPag && window.MainAPI?.resetarMascaraMoeda) window.MainAPI.resetarMascaraMoeda(iPag);
    // Pré-preenche data do pagamento com hoje
    const iDataPagModal = document.getElementById('inputDataPagamento');
    if (iDataPagModal) {
        const hoje = new Date();
        iDataPagModal.value = String(hoje.getDate()).padStart(2,'0') + '/' +
            String(hoje.getMonth()+1).padStart(2,'0') + '/' + hoje.getFullYear();
    }
    popularSelectInstituicoes('inputInstituicaoPagamento');
    document.getElementById('modalPagamento').classList.add('aberto');
}

function fecharModalPagamento() {
    document.getElementById('modalPagamento').classList.remove('aberto');
    emprestimoParaPagamento = null;
}

// ============================================================================
// OPERAÇÕES
// ============================================================================

async function salvarEmprestimo(event) {
    event.preventDefault();

    const iValor = document.getElementById('inputValor');
    const iData  = document.getElementById('inputDataPrevisao');
    const iDataEmp = document.getElementById('inputDataEmprestimo');
    const valorTotal = window.MainAPI ? window.MainAPI.obterValorMoeda(iValor) : parseFloat(iValor.value);
    const dataISO    = window.MainAPI ? window.MainAPI.dataParaISO(iData.value) : iData.value;
    const dataEmpISO = window.MainAPI ? window.MainAPI.dataParaISO(iDataEmp?.value || '') : null;
    const instituicaoUsuarioId = parseInt(document.getElementById('inputInstituicao').value);

    if (!instituicaoUsuarioId) return mostrarNotificacao('Selecione uma conta!', 'erro');

    const dados = {
        usuarioId: usuarioLogado.id,
        tipo: document.getElementById('inputTipo').value,
        pessoaOuGrupo: document.getElementById('inputPessoa').value,
        valorTotal,
        instituicaoUsuarioId,
        dataEmprestimo: dataEmpISO || null,
        dataPrevisao: dataISO || null,
        observacoes: document.getElementById('inputObservacoes').value || null
    };

    try {
        let response;
        if (emprestimoEmEdicao) {
            response = await fetch(`${API_BASE}/emprestimos/${emprestimoEmEdicao.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });
        } else {
            response = await fetch(`${API_BASE}/emprestimos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });
        }

        if (!response.ok) throw new Error('Erro ao salvar empréstimo');

        mostrarNotificacao(
            emprestimoEmEdicao ? 'Empréstimo atualizado!' : 'Empréstimo criado!',
            'sucesso'
        );

        fecharModalEmprestimo();
        await carregarResumo();
        await carregarEmprestimos();
    } catch (error) {
        console.error('Erro ao salvar:', error);
        mostrarNotificacao('Erro ao salvar empréstimo', 'erro');
    }
}

async function salvarPagamento(event) {
    event.preventDefault();

    const iPag = document.getElementById('inputValorPagamento');
    const valorPagamento = window.MainAPI ? window.MainAPI.obterValorMoeda(iPag) : parseFloat(iPag.value);
    const instituicaoUsuarioId = parseInt(document.getElementById('inputInstituicaoPagamento').value);

    if (!instituicaoUsuarioId) return mostrarNotificacao('Selecione uma conta!', 'erro');

    if (valorPagamento > emprestimoParaPagamento.valorRestante) {
        mostrarNotificacao('Valor não pode ser maior que o restante!', 'erro');
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE}/emprestimos/${emprestimoParaPagamento.id}/pagamento-parcial`,
            {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    valorPago: valorPagamento,
                    instituicaoUsuarioId,
                    dataPagamento: window.MainAPI?.dataParaISO(document.getElementById('inputDataPagamento')?.value) || null
                })
            }
        );

        if (!response.ok) throw new Error('Erro ao registrar pagamento');

        mostrarNotificacao('Pagamento registrado!', 'sucesso');
        fecharModalPagamento();
        await carregarResumo();
        await carregarEmprestimos();
    } catch (error) {
        console.error('Erro ao registrar pagamento:', error);
        mostrarNotificacao('Erro ao registrar pagamento', 'erro');
    }
}

async function quitarEmprestimo(emprestimoId) {
    const emprestimo = emprestimos.find(e => e.id === emprestimoId);
    const tipoLabel = emprestimo?.tipo === 'EMPRESTEI' ? 'receberá o valor restante' : 'pagará o valor restante';

    _abrirSeletorInstituicaoEQuitar(emprestimoId, tipoLabel, emprestimo);
}

function _abrirSeletorInstituicaoEQuitar(emprestimoId, tipoLabel, emprestimo) {
    const div = document.getElementById('div_alerta');
    const conteudo = document.getElementById('conteudoAlerta');
    if (!div || !conteudo) return;

    conteudo.innerHTML = '';

    const msg = document.createElement('p');
    msg.style.cssText = 'margin-bottom:10px;text-align:center;line-height:1.5;';
    msg.textContent = `Em qual conta ${tipoLabel}?`;
    conteudo.appendChild(msg);

    const sel = document.createElement('select');
    sel.style.cssText = 'width:100%;padding:8px;border-radius:8px;border:1px solid var(--cor-principal);background:var(--cor-fundo-campo,#fff);color:var(--cor-texto-principal);margin-bottom:12px;';
    sel.innerHTML = '<option value="">Selecione a conta...</option>';
    _instituicoes.forEach(inst => {
        const opt = document.createElement('option');
        opt.value = inst.id;
        opt.textContent = inst.intituicao.nome;
        sel.appendChild(opt);
    });
    conteudo.appendChild(sel);

    const btns = document.createElement('div');
    btns.style.cssText = 'display:flex;gap:8px;justify-content:center;';

    const btnNao = document.createElement('button');
    btnNao.textContent = 'Cancelar';
    btnNao.style.cssText = 'background:var(--cor-fundo-pagina,#e5e7eb);color:var(--cor-texto-principal);border:1px solid var(--cor-tinte-borda,#ccc);';
    btnNao.onclick = () => { div.style.display = 'none'; };

    const btnSim = document.createElement('button');
    btnSim.textContent = 'Quitar';
    btnSim.onclick = async () => {
        const instId = parseInt(sel.value);
        if (!instId) { mostrarNotificacao('Selecione uma conta!', 'erro'); return; }
        div.style.display = 'none';
        try {
            const response = await fetch(`${API_BASE}/emprestimos/${emprestimoId}/quitar`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ instituicaoUsuarioId: instId })
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.message || `HTTP ${response.status}`);
            }
            mostrarNotificacao('Empréstimo quitado!', 'sucesso');
            await carregarResumo();
            await carregarEmprestimos();
        } catch (error) {
            console.error('Erro ao quitar:', error);
            mostrarNotificacao('Erro ao quitar: ' + error.message, 'erro');
        }
    };

    btns.appendChild(btnNao);
    btns.appendChild(btnSim);
    conteudo.appendChild(btns);
    div.style.display = 'flex';
}

async function reabrirEmprestimo(emprestimoId) {
    confirmar('Deseja reabrir este empréstimo?', async () => {
        try {
            const response = await fetch(`${API_BASE}/emprestimos/${emprestimoId}/reabrir`, {
                method: 'PATCH'
            });
            if (!response.ok) throw new Error('Erro ao reabrir empréstimo');
            mostrarNotificacao('Empréstimo reaberto!', 'sucesso');
            await carregarResumo();
            await carregarEmprestimos();
        } catch (error) {
            console.error('Erro ao reabrir:', error);
            mostrarNotificacao('Erro ao reabrir empréstimo', 'erro');
        }
    });
}

async function confirmarDeletar(emprestimoId) {
    confirmar('Deseja realmente deletar este empréstimo? Esta ação não pode ser desfeita.', async () => {
        try {
            const response = await fetch(`${API_BASE}/emprestimos/${emprestimoId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Erro ao deletar empréstimo');
            mostrarNotificacao('Empréstimo deletado!', 'sucesso');
            await carregarResumo();
            await carregarEmprestimos();
        } catch (error) {
            console.error('Erro ao deletar:', error);
            mostrarNotificacao('Erro ao deletar empréstimo', 'erro');
        }
    });
}

// ============================================================================
// UTILITÁRIOS
// ============================================================================

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

function formatarData(dataStr) {
    if (!dataStr) return '';
    const data = new Date(dataStr + 'T00:00:00');
    return data.toLocaleDateString('pt-BR');
}

function formatarStatus(status) {
    const statusMap = {
        'PENDENTE': 'Pendente',
        'PAGO_PARCIAL': 'Pago Parcial',
        'QUITADO': 'Quitado'
    };
    return statusMap[status] || status;
}

function getStatusIcon(status) {
    const iconMap = {
        'PENDENTE': 'bx-time-five',
        'PAGO_PARCIAL': 'bx-info-circle',
        'QUITADO': 'bx-check-circle'
    };
    return iconMap[status] || 'bx-info-circle';
}

function confirmar(mensagem, onConfirm) {
    const div = document.getElementById('div_alerta');
    const conteudo = document.getElementById('conteudoAlerta');
    if (!div || !conteudo) { if (window.confirm(mensagem)) onConfirm(); return; }

    conteudo.innerHTML = '';

    const msg = document.createElement('p');
    msg.style.cssText = 'margin-bottom:16px;text-align:center;line-height:1.5;';
    msg.textContent = mensagem;

    const btns = document.createElement('div');
    btns.style.cssText = 'display:flex;gap:8px;justify-content:center;';

    const btnNao = document.createElement('button');
    btnNao.textContent = 'Cancelar';
    btnNao.style.cssText = 'background:var(--cor-fundo-pagina,#e5e7eb);color:var(--cor-texto-principal);border:1px solid var(--cor-tinte-borda,#ccc);';
    btnNao.onclick = () => { div.style.display = 'none'; };

    const btnSim = document.createElement('button');
    btnSim.textContent = 'Confirmar';
    btnSim.onclick = () => { div.style.display = 'none'; onConfirm(); };

    btns.appendChild(btnNao);
    btns.appendChild(btnSim);
    conteudo.appendChild(msg);
    conteudo.appendChild(btns);
    div.style.display = 'flex';
}

function mostrarNotificacao(mensagem, tipo = 'info') {
    // Criar elemento de notificação
    const notif = document.createElement('div');
    notif.className = `notificacao notif-${tipo}`;
    notif.innerHTML = `
        <i class='bx ${tipo === 'sucesso' ? 'bx-check-circle' : 'bx-error-circle'}'></i>
        <span>${mensagem}</span>
    `;

    // Adicionar estilos inline
    Object.assign(notif.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: '99999',
        background: tipo === 'sucesso' ? '#10b981' : '#ef4444',
        color: '#fff',
        padding: '1rem 1.5rem',
        borderRadius: '10px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontSize: '0.95rem',
        fontWeight: '600',
        animation: 'slideInRight 0.3s ease'
    });

    document.body.appendChild(notif);

    setTimeout(() => {
        notif.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

// Adicionar estilos de animação
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ============================================================================
// EMPRéSTIMOS BANCáRIOS
// ============================================================================
async function carregarBancarios() {
    try {
        const r = await fetch(API_BASE + '/emprestimos-bancarios/usuarios/' + usuarioLogado.id);
        if (r.status === 204) { bancarios = []; renderizarBancarios(); atualizarResumoBancarios(); return; }
        if (!r.ok) throw new Error('Erro');
        bancarios = await r.json();
        renderizarBancarios(); atualizarResumoBancarios();
    } catch(err) { console.error(err); mostrarNotificacao('Erro ao carregar empréstimos bancários', 'erro'); }
}
function atualizarResumoBancarios() {
    const ativos = bancarios.filter(b => b.status === 'ATIVO');
    document.getElementById('bancarioContratosAtivos').textContent = ativos.length;
    const saldo = ativos.reduce((s, b) => s + (b.saldoDevedor || 0), 0);
    document.getElementById('bancarioSaldoDevedor').textContent = 'Saldo devedor: ' + formatarMoeda(saldo);
    const comData = ativos.filter(b => b.proximaParcela).sort((a, b) => new Date(a.proximaParcela) - new Date(b.proximaParcela));
    if (comData.length > 0) {
        document.getElementById('bancarioProximaParcelaValor').textContent = formatarMoeda(comData[0].valorParcela);
        document.getElementById('bancarioProximaParcelaData').textContent = formatarData(comData[0].proximaParcela);
    } else {
        document.getElementById('bancarioProximaParcelaValor').textContent = 'R$ 0,00';
        document.getElementById('bancarioProximaParcelaData').textContent = '-';
    }
}
function filtrarBancarios(filtro) {
    filtroBancarioAtual = filtro;
    document.querySelectorAll('[data-filtro-b]').forEach(btn => btn.classList.remove('ativo'));
    document.querySelector('[data-filtro-b="' + filtro + '"]').classList.add('ativo');
    renderizarBancarios();
}
function renderizarBancarios() {
    const container = document.getElementById('listaBancarios');
    let lista = [...bancarios];
    if (filtroBancarioAtual === 'ATIVO') lista = lista.filter(b => b.status === 'ATIVO');
    else if (filtroBancarioAtual === 'QUITADO') lista = lista.filter(b => b.status === 'QUITADO');
    if (lista.length === 0) { container.innerHTML = '<div class="estado-vazio"><i class=\'bx bx-bank\'></i><h3>Nenhum empréstimo bancário</h3></div>'; return; }
    container.innerHTML = lista.map(b => criarCardBancario(b)).join('');
}
const _modLabel = { PESSOAL: 'Crédito Pessoal', VEICULO: 'Financ. Veículo', IMOVEL: 'Financ. Imóvel', CONSIGNADO: 'Consignado', CAPITAL_DE_GIRO: 'Capital de Giro' };
function criarCardBancario(b) {
    const isQ = b.status === 'QUITADO', atr = b.atrasado && !isQ;
    const pct = b.totalParcelas > 0 ? (b.parcelasPagas / b.totalParcelas * 100).toFixed(1) : 0;
    const sc = isQ ? 'quitado' : (atr ? 'atrasado' : 'ativo'), sl = isQ ? 'Quitado' : (atr ? 'Atrasado' : 'Ativo'), si = isQ ? 'bx-check-circle' : (atr ? 'bx-error-circle' : 'bx-time-five');
    const ph = b.proximaParcela ? '<div class="emprestimo-data"' + (atr ? ' style="color:#ef4444;"' : '') + '><i class=\'bx ' + (atr ? 'bx-error-circle' : 'bx-calendar') + '\'></i> ' + (atr ? 'Vencida: ' : 'Próxima: ') + formatarData(b.proximaParcela) + '</div>' : '';
    const ch = b.dataContratacao ? '<div class="emprestimo-data"><i class=\'bx bx-calendar-check\'></i> Contratado: ' + formatarData(b.dataContratacao) + '</div>' : '';
    const ba = isQ ? '<button class="btn-acao deletar" onclick="confirmarDeletarBancario(\'' + b.id + '\')"><i class=\'bx bx-trash\'></i> Deletar</button>'
        : '<button class="btn-acao visualizar" onclick="abrirModalParcelas(\'' + b.id + '\')"><i class=\'bx bx-list-ul\'></i> Ver Parcelas</button><button class="btn-acao registrar" onclick="abrirModalPagarParcela(\'' + b.id + '\')"><i class=\'bx bx-money\'></i> Pagar Parcela</button><button class="btn-acao quitar" onclick="quitarBancario(\'' + b.id + '\')"><i class=\'bx bx-check-circle\'></i> Quitar</button><button class="btn-acao deletar" onclick="confirmarDeletarBancario(\'' + b.id + '\')"><i class=\'bx bx-trash\'></i> Deletar</button>';

    return '<div class="emprestimo-item emprestei' + (isQ ? ' quitado' : '') + '"><div class="emprestimo-header"><div class="emprestimo-info"><div class="emprestimo-tipo emprestei"><i class=\'bx bx-bank\'></i> ' + (_modLabel[b.modalidade] || b.modalidade) + '</div><h3 class="emprestimo-pessoa">' + b.bancoNome + '</h3>' + ch + ph + '</div><div class="emprestimo-status ' + sc + '"><i class=\'bx ' + si + '\'></i> ' + sl + '</div></div><div class="emprestimo-valores"><div class="emprestimo-valor-item"><span class="emprestimo-valor-label">Valor Contratado</span><span class="emprestimo-valor-numero">' + formatarMoeda(b.valorPrincipal) + '</span></div><div class="emprestimo-valor-item"><span class="emprestimo-valor-label">Parcela (' + b.taxaJurosMensal + '% a.m.)</span><span class="emprestimo-valor-numero">' + formatarMoeda(b.valorParcela) + '</span></div><div class="emprestimo-valor-item"><span class="emprestimo-valor-label">Saldo Devedor</span><span class="emprestimo-valor-numero">' + formatarMoeda(b.saldoDevedor) + '</span></div></div>' + (!isQ ? '<div class="emprestimo-progresso"><div class="progresso-bar-container"><div class="progresso-bar" style="width:' + pct + '%"></div></div><div class="progresso-texto">' + b.parcelasPagas + '/' + b.totalParcelas + ' parcelas (' + pct + '%)</div></div>' : '') + (b.observacoes ? '<div class="emprestimo-observacoes"><strong>Obs:</strong> ' + b.observacoes + '</div>' : '') + '<div class="emprestimo-acoes-item">' + ba + '</div></div>';
}
function calcularParcelaEstimada() {
    const pv = window.MainAPI ? window.MainAPI.obterValorMoeda(document.getElementById('bInputPrincipal')) : 0;
    const tx = parseFloat(document.getElementById('bInputTaxa')?.value?.replace(',','.')) || 0;
    const n = parseInt(document.getElementById('bInputParcelas')?.value) || 0;
    const el = document.getElementById('bParcelaEstimada'); if (!el) return;
    if (pv <= 0 || n <= 0) { el.textContent = 'R$ 0,00'; return; }
    const pmt = tx <= 0 ? pv/n : (() => { const i=tx/100; const f=Math.pow(1+i,n); return pv*(i*f)/(f-1); })();
    el.textContent = formatarMoeda(pmt);
}
function abrirModalNovoBancario() {
    document.getElementById('formBancario').reset();
    const iv = document.getElementById('bInputPrincipal'); if (iv && window.MainAPI?.resetarMascaraMoeda) window.MainAPI.resetarMascaraMoeda(iv);
    document.getElementById('bParcelaEstimada').textContent = 'R$ 0,00';
    const h = new Date(); const hs = String(h.getDate()).padStart(2,'0') + '/' + String(h.getMonth()+1).padStart(2,'0') + '/' + h.getFullYear();
    const bc = document.getElementById('bInputContratacao'); if (bc) bc.value = hs;
    popularSelectInstituicoes('bInputInstituicao');
    document.getElementById('modalBancario').classList.add('aberto');
}
function fecharModalBancario() { document.getElementById('modalBancario').classList.remove('aberto'); }
async function salvarBancario(event) {
    event.preventDefault();
    const pv = window.MainAPI ? window.MainAPI.obterValorMoeda(document.getElementById('bInputPrincipal')) : 0;
    const tx = parseFloat(document.getElementById('bInputTaxa').value?.replace(',','.')) || 0;
    const n = parseInt(document.getElementById('bInputParcelas').value);
    const instId = parseInt(document.getElementById('bInputInstituicao').value) || null;
    const dataC = window.MainAPI?.dataParaISO(document.getElementById('bInputContratacao').value) || null;
    const dataP = window.MainAPI?.dataParaISO(document.getElementById('bInputPrimeiraParcela').value) || null;
    const dados = { usuarioId: usuarioLogado.id, bancoNome: document.getElementById('bInputBanco').value, modalidade: document.getElementById('bInputModalidade').value, valorPrincipal: pv, taxaJurosMensal: tx, totalParcelas: n, dataContratacao: dataC, dataPrimeiraParcela: dataP, instituicaoUsuarioId: instId, observacoes: document.getElementById('bInputObs').value || null };
    try {
        const resp = await fetch(API_BASE + '/emprestimos-bancarios', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(dados) });
        if (!resp.ok) { const err = await resp.json().catch(() => ({})); throw new Error(err.message || 'Erro ao registrar empréstimo bancário'); }
        mostrarNotificacao('Empréstimo bancário registrado!', 'sucesso'); fecharModalBancario(); await carregarBancarios();
    } catch(err) { mostrarNotificacao(err.message, 'erro'); }
}
function abrirModalPagarParcela(bid) {
    bancarioParaPagamento = bancarios.find(b => b.id === bid); if (!bancarioParaPagamento) return;
    document.getElementById('infoPagarParcela').innerHTML = '<strong>Banco:</strong> ' + bancarioParaPagamento.bancoNome + '<br><strong>Parcela:</strong> ' + (bancarioParaPagamento.parcelasPagas+1) + '/' + bancarioParaPagamento.totalParcelas + '<br><strong>Valor:</strong> ' + formatarMoeda(bancarioParaPagamento.valorParcela);
    document.getElementById('formPagarParcela').reset();
    const h = new Date(); const hs = String(h.getDate()).padStart(2,'0')+'/'+String(h.getMonth()+1).padStart(2,'0')+'/'+h.getFullYear();
    const bd = document.getElementById('bPagDataPagamento'); if (bd) bd.value = hs;
    popularSelectInstituicoes('bPagInstituicao');
    document.getElementById('modalPagarParcela').classList.add('aberto');
}
function fecharModalPagarParcela() { document.getElementById('modalPagarParcela').classList.remove('aberto'); bancarioParaPagamento = null; }
async function confirmarPagarParcela(event) {
    event.preventDefault();
    const instId = parseInt(document.getElementById('bPagInstituicao').value) || null;
    const dp = window.MainAPI?.dataParaISO(document.getElementById('bPagDataPagamento').value) || null;
    try {
        const resp = await fetch(API_BASE+'/emprestimos-bancarios/'+bancarioParaPagamento.id+'/pagar-parcela', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({instituicaoUsuarioId:instId,dataPagamento:dp}) });
        if (!resp.ok) {
            const errorData = await resp.text();
            let errorMessage = 'Erro ao pagar parcela';
            try {
                const jsonError = JSON.parse(errorData);
                errorMessage = jsonError.message || jsonError.error || errorData;
            } catch {
                errorMessage = errorData || errorMessage;
            }
            throw new Error(errorMessage);
        }
        mostrarNotificacao('Parcela paga!','sucesso');
        fecharModalPagarParcela();
        await carregarBancarios();
    } catch(err) {
        mostrarNotificacao(err.message,'erro');
    }
}
function quitarBancario(bid) {
    const b = bancarios.find(b => b.id === bid);
    const div = document.getElementById('div_alerta'), cnt = document.getElementById('conteudoAlerta');
    cnt.innerHTML = '';
    const msg = document.createElement('p'); msg.style.cssText='margin-bottom:10px;text-align:center;line-height:1.5;';
    msg.innerHTML = '<strong>Quitar:</strong> ' + b?.bancoNome + '<br>' + b?.parcelasRestantes + ' parcelas restantes x ' + formatarMoeda(b?.valorParcela);
    cnt.appendChild(msg);
    const sel = document.createElement('select'); sel.style.cssText='width:100%;padding:8px;border-radius:8px;border:1px solid var(--cor-principal);background:var(--cor-fundo-campo,#fff);color:var(--cor-texto-principal);margin-bottom:12px;';
    sel.innerHTML='<option value="">Selecione a conta...</option>'; _instituicoes.forEach(inst => { const o=document.createElement('option'); o.value=inst.id; o.textContent=inst.intituicao.nome; sel.appendChild(o); }); cnt.appendChild(sel);
    const btns=document.createElement('div'); btns.style.cssText='display:flex;gap:8px;justify-content:center;';
    const bn=document.createElement('button'); bn.textContent='Cancelar'; bn.style.cssText='background:var(--cor-fundo-pagina,#e5e7eb);color:var(--cor-texto-principal);border:1px solid #ccc;'; bn.onclick=()=>{div.style.display='none';};
    const bs=document.createElement('button'); bs.textContent='Confirmar';
    bs.onclick=async()=>{
        const ii=parseInt(sel.value)||null;
        div.style.display='none';
        try {
            const resp=await fetch(API_BASE+'/emprestimos-bancarios/'+bid+'/quitar',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({instituicaoUsuarioId:ii,dataPagamento:null})});
            if(!resp.ok) {
                const errorData = await resp.text();
                let errorMessage = 'Erro ao quitar empréstimo';
                try {
                    const jsonError = JSON.parse(errorData);
                    errorMessage = jsonError.message || jsonError.error || errorData;
                } catch {
                    errorMessage = errorData || errorMessage;
                }
                throw new Error(errorMessage);
            }
            mostrarNotificacao('Quitado!','sucesso');
            await carregarBancarios();
        } catch(err){
            mostrarNotificacao(err.message,'erro');
        }
    };
    btns.appendChild(bn); btns.appendChild(bs); cnt.appendChild(btns); div.style.display='flex';
}
function confirmarDeletarBancario(bid) {
    confirmar('Deletar este empréstimo bancário?', async () => {
        try {
            const r=await fetch(API_BASE+'/emprestimos-bancarios/'+bid,{method:'DELETE'});
            if(!r.ok) {
                const errorData = await r.text();
                let errorMessage = 'Erro ao deletar empréstimo';
                try {
                    const jsonError = JSON.parse(errorData);
                    errorMessage = jsonError.message || jsonError.error || errorData;
                } catch {
                    errorMessage = errorData || errorMessage;
                }
                throw new Error(errorMessage);
            }
            mostrarNotificacao('Deletado!','sucesso');
            await carregarBancarios();
        }
        catch(err) { mostrarNotificacao(err.message,'erro'); }
    });
}

// ============================================================================
// EXPANSÃO DE PARCELAS - MODAL COM PAGINAÇÃO
// ============================================================================
function abrirModalParcelas(bid) {
    emprestimoIdAtualParcelas = bid;
    parcelasPaginaAtual = 1;

    // Busca o empréstimo para pegar o nome
    const emprestimo = bancarios.find(b => b.id === bid);
    if (emprestimo) {
        document.getElementById('modalParcelasTitulo').textContent = `Parcelas - ${emprestimo.bancoNome}`;
    }

    document.getElementById('modalParcelas').classList.add('aberto');
    carregarParcelasBancario(bid);
}

function fecharModalParcelas() {
    document.getElementById('modalParcelas').classList.remove('aberto');
    emprestimoIdAtualParcelas = null;
    parcelasCarregadas = {};
}

async function carregarParcelasBancario(bid) {
    const container = document.getElementById('parcelasModalConteudo');
    if (!container) return;

    container.innerHTML = '<div class="parcelas-loading"><i class="bx bx-loader-alt bx-spin" style="font-size:2rem;"></i><p>Carregando parcelas...</p></div>';

    try {
        const resp = await fetch(`${API_BASE}/emprestimos-bancarios/${bid}/parcelas`);
        if (!resp.ok) throw new Error('Erro ao carregar parcelas');

        const parcelas = await resp.json();
        parcelasCarregadas[bid] = parcelas;
        renderizarParcelasPaginadas(bid);
    } catch(err) {
        container.innerHTML = '<div class="parcelas-erro"><i class="bx bx-error-circle" style="font-size:2rem;color:#ef4444;"></i><p>Erro ao carregar parcelas</p></div>';
        console.error(err);
    }
}

function renderizarParcelasPaginadas(bid) {
    const container = document.getElementById('parcelasModalConteudo');
    const paginacao = document.getElementById('parcelasPaginacao');
    if (!container) return;

    const parcelas = parcelasCarregadas[bid];
    if (!parcelas || parcelas.length === 0) {
        container.innerHTML = '<div class="parcelas-vazio"><i class="bx bx-info-circle" style="font-size:2rem;"></i><p>Nenhuma parcela encontrada</p></div>';
        paginacao.style.display = 'none';
        return;
    }

    // Calcular paginação
    const totalPaginas = Math.ceil(parcelas.length / parcelasPorPagina);
    const inicio = (parcelasPaginaAtual - 1) * parcelasPorPagina;
    const fim = inicio + parcelasPorPagina;
    const parcelasPagina = parcelas.slice(inicio, fim);

    // Renderizar parcelas da página atual
    let html = '<div class="parcelas-lista">';

    parcelasPagina.forEach(p => {
        const statusClass = p.status === 'PAGA' ? 'paga' : (p.status === 'ATRASADA' ? 'atrasada' : 'a-vencer');
        const statusLabel = p.status === 'PAGA' ? 'Paga' : (p.status === 'ATRASADA' ? 'Atrasada' : 'A Vencer');
        const statusIcon = p.status === 'PAGA' ? 'bx-check-circle' : (p.status === 'ATRASADA' ? 'bx-error-circle' : 'bx-time-five');

        html += `
            <div class="parcela-item ${statusClass}">
                <div class="parcela-header">
                    <div class="parcela-numero">
                        <i class='bx ${statusIcon}'></i>
                        Parcela ${p.numeroParcela}/${p.totalParcelas}
                    </div>
                    <div class="parcela-status ${statusClass}">${statusLabel}</div>
                </div>
                <div class="parcela-info">
                    <div class="parcela-info-item">
                        <span class="parcela-label">Vencimento:</span>
                        <span class="parcela-valor">${formatarData(p.dataVencimento)}</span>
                    </div>
                    <div class="parcela-info-item">
                        <span class="parcela-label">Valor:</span>
                        <span class="parcela-valor">${formatarMoeda(p.valor)}</span>
                    </div>
                </div>
                ${p.podeSerPaga ? `
                    <div class="parcela-acao">
                        <button class="btn-pagar-parcela" onclick="pagarParcelaDoModal('${bid}')">
                            <i class='bx bx-money'></i> Pagar Esta Parcela
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;

    // Atualizar controles de paginação
    if (totalPaginas > 1) {
        paginacao.style.display = 'flex';
        document.getElementById('pagInfo').textContent = `Página ${parcelasPaginaAtual} de ${totalPaginas}`;
        document.getElementById('btnPagAnterior').disabled = parcelasPaginaAtual === 1;
        document.getElementById('btnPagProxima').disabled = parcelasPaginaAtual === totalPaginas;
    } else {
        paginacao.style.display = 'none';
    }
}

function mudarPaginaParcelas(direcao) {
    if (!emprestimoIdAtualParcelas) return;

    const parcelas = parcelasCarregadas[emprestimoIdAtualParcelas];
    if (!parcelas) return;

    const totalPaginas = Math.ceil(parcelas.length / parcelasPorPagina);
    parcelasPaginaAtual += direcao;

    if (parcelasPaginaAtual < 1) parcelasPaginaAtual = 1;
    if (parcelasPaginaAtual > totalPaginas) parcelasPaginaAtual = totalPaginas;

    renderizarParcelasPaginadas(emprestimoIdAtualParcelas);
}

function pagarParcelaDoModal(bid) {
    fecharModalParcelas();
    abrirModalPagarParcela(bid);
}

// Fechar modal ao clicar fora
window.onclick = function(event) {
    [['modalEmprestimo',fecharModalEmprestimo],['modalPagamento',fecharModalPagamento],['modalBancario',fecharModalBancario],['modalPagarParcela',fecharModalPagarParcela],['modalParcelas',fecharModalParcelas]]
        .forEach(([id,fn]) => { const m=document.getElementById(id); if(event.target===m) fn(); });
};