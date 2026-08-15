(function () {
    var PASSOS_ADICIONAR = [
        {
            alvo: '.page-title-row',
            titulo: 'Adicionar Registros',
            texto: 'Aqui você registra todos os seus eventos financeiros: gastos, recebimentos, transferências, poupanças e empréstimos.'
        },
        {
            alvo: '.ar-tabs',
            titulo: 'Registro Único ou Múltiplos?',
            texto: 'Use <strong>Registro Único</strong> para lançar um evento por vez com mais detalhes. Use <strong>Múltiplos Registros</strong> para lançar vários eventos de uma só vez de forma rápida.'
        },
        {
            alvo: '.formulario-adicionar-gasto',
            titulo: 'Campos do Evento',
            texto: 'Preencha o <strong>Título</strong>, escolha o <strong>Tipo do Evento</strong> (Gasto, Recebimento, etc.), o <strong>Movimento</strong> (Débito, Pix, etc.), as <strong>Instituições</strong>, as <strong>Categorias</strong> e o <strong>Valor</strong>.'
        },
        {
            alvo: '.ar-recurring-wrap',
            titulo: 'Evento Recorrente',
            texto: 'Ative esta opção se o evento se repete com frequência. Você pode definir periodicidade diária, semanal, mensal ou anual — o sistema criará os lançamentos automaticamente.'
        },
        {
            alvo: '.botao-formulario',
            titulo: 'Data e Registro',
            texto: 'Clique em <strong>Escolher data</strong> para informar quando o evento aconteceu. Depois clique em <strong>Registrar</strong> para salvar o lançamento.'
        }
    ];

    var STORAGE_KEY = 'myfinance_tutorial_adicionarRegistros_done';

    document.addEventListener('DOMContentLoaded', function () {
        setTimeout(function () {
            if (!window.Tutorial) return;
            if (window.Tutorial.jaViu(STORAGE_KEY)) return;
            window.Tutorial.iniciar(PASSOS_ADICIONAR, null, STORAGE_KEY);
        }, 900);
    });

    window.iniciarTutorialAdicionarRegistros = function () {
        if (!window.Tutorial) return;
        window.Tutorial.iniciar(PASSOS_ADICIONAR, null, STORAGE_KEY);
    };
})();
