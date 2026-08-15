(function () {
    var PASSOS_DASHBOARD = [
        {
            alvo: '.page-title-row',
            titulo: 'Bem-vindo ao Dashboard!',
            texto: 'Esta é a sua central de controle financeiro. Aqui você encontra um resumo completo das suas finanças em um só lugar.'
        },
        {
            alvo: '.dashboard-periodo-card',
            titulo: 'Filtro de Período',
            texto: 'Escolha o período que deseja analisar: mensal, trimestral, semestral ou anual. Use os atalhos rápidos para acessar o mês atual, mês passado, ano atual ou ano passado.'
        },
        {
            alvo: '.historia-financeira-card',
            titulo: 'História Financeira',
            texto: 'Um resumo do seu comportamento financeiro no período selecionado. A mascote conta como foram seus gastos de forma simples e direta!'
        },
        {
            alvo: '#containerKPIS',
            titulo: 'Indicadores Principais',
            texto: 'Veja rapidamente seu saldo total, gasto total do período, o maior gasto registrado e a categoria que mais impactou seu bolso.'
        },
        {
            alvo: '.kpi-saude-card',
            titulo: 'Saúde Financeira',
            texto: 'Uma pontuação que resume sua situação financeira no período. Quanto maior a pontuação, melhor está sua saúde financeira!'
        },
        {
            alvo: '.container-kpi-secundarios',
            titulo: 'Poupança e Empréstimos',
            texto: 'Acompanhe o progresso das suas poupanças em relação à meta e veja o status dos empréstimos ativos.'
        },
        {
            alvo: '.containerGraficos',
            titulo: 'Gráficos e Análises',
            texto: 'Visualize a evolução dos gastos ao longo do tempo, comparações por período, distribuição por categoria, gastos por dia da semana e o fluxo completo de entradas e saídas.'
        }
    ];

    document.addEventListener('DOMContentLoaded', function () {
        setTimeout(function () {
            if (!window.Tutorial) return;
            if (window.Tutorial.jaViu('myfinance_tutorial_done')) return;
            window.Tutorial.iniciar(PASSOS_DASHBOARD, null, 'myfinance_tutorial_done');
        }, 900);
    });

    window.iniciarTutorialDashboard = function () {
        if (!window.Tutorial) return;
        window.Tutorial.iniciar(PASSOS_DASHBOARD, null, 'myfinance_tutorial_done');
    };
})();
