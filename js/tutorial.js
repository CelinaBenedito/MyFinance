(function () {
    var DEFAULT_KEY = 'myfinance_tutorial_done';

    var _steps = [];
    var _currentStep = 0;
    var _overlayEl = null;
    var _spotlightEl = null;
    var _tooltipEl = null;
    var _onFinish = null;
    var _storageKey = DEFAULT_KEY;

    function _criar() {
        _overlayEl = document.createElement('div');
        _overlayEl.id = 'tour-overlay';
        document.body.appendChild(_overlayEl);

        _spotlightEl = document.createElement('div');
        _spotlightEl.id = 'tour-spotlight';
        document.body.appendChild(_spotlightEl);

        _tooltipEl = document.createElement('div');
        _tooltipEl.id = 'tour-tooltip';
        document.body.appendChild(_tooltipEl);
    }

    function _remover() {
        if (_overlayEl)  { _overlayEl.remove();  _overlayEl  = null; }
        if (_spotlightEl){ _spotlightEl.remove(); _spotlightEl = null; }
        if (_tooltipEl)  { _tooltipEl.remove();  _tooltipEl  = null; }
    }

    function _posicionarSpotlight(el) {
        var r = el.getBoundingClientRect();
        var pad = 8;
        _spotlightEl.style.top    = (r.top  - pad) + 'px';
        _spotlightEl.style.left   = (r.left - pad) + 'px';
        _spotlightEl.style.width  = (r.width  + pad * 2) + 'px';
        _spotlightEl.style.height = (r.height + pad * 2) + 'px';
    }

    function _posicionarTooltip(el) {
        var r = el.getBoundingClientRect();
        var vpH = window.innerHeight;
        var vpW = window.innerWidth;
        var tooltipW = Math.min(320, vpW - 32);

        _tooltipEl.style.width = tooltipW + 'px';

        var top, left;

        if (r.bottom + 200 <= vpH) {
            top = r.bottom + 16;
            _tooltipEl.style.transform = '';
        } else if (r.top - 200 >= 0) {
            top = r.top - 16;
            _tooltipEl.style.transform = 'translateY(-100%)';
        } else {
            top = (vpH / 2) - 100;
            _tooltipEl.style.transform = '';
        }

        left = r.left + (r.width / 2) - (tooltipW / 2);
        left = Math.max(16, Math.min(left, vpW - tooltipW - 16));

        _tooltipEl.style.top  = top  + 'px';
        _tooltipEl.style.left = left + 'px';
    }

    function _renderStep() {
        var step = _steps[_currentStep];
        var el = document.querySelector(step.alvo);

        if (!el) {
            if (_currentStep < _steps.length - 1) {
                _currentStep++;
                _renderStep();
            } else {
                _finalizar();
            }
            return;
        }

        el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setTimeout(function () {
            if (!_spotlightEl || !_tooltipEl) return;

            _posicionarSpotlight(el);
            _posicionarTooltip(el);

            var total   = _steps.length;
            var isLast  = _currentStep === total - 1;
            var isFirst = _currentStep === 0;

            var btnAnterior = !isFirst
                ? '<button class="tour-btn-nav" onclick="window.Tutorial._anterior()"><i class=\'bx bx-chevron-left\'></i> Anterior</button>'
                : '';
            var btnAvancar = !isLast
                ? '<button class="tour-btn-primary" onclick="window.Tutorial._proximo()">Próximo <i class=\'bx bx-chevron-right\'></i></button>'
                : '<button class="tour-btn-primary" onclick="window.Tutorial._finalizar()"><i class=\'bx bx-check\'></i> Concluir</button>';

            _tooltipEl.innerHTML =
                '<div class="tour-step-count">Passo ' + (_currentStep + 1) + ' de ' + total + '</div>' +
                '<h3 class="tour-titulo">' + step.titulo + '</h3>' +
                '<p class="tour-texto">' + step.texto + '</p>' +
                '<div class="tour-btns">' +
                    '<button class="tour-btn-skip" onclick="window.Tutorial._pular()">Pular tour</button>' +
                    '<div class="tour-nav">' + btnAnterior + btnAvancar + '</div>' +
                '</div>';
        }, 350);
    }

    function _finalizar() {
        localStorage.setItem(_storageKey, '1');
        _remover();
        if (_onFinish) _onFinish();
    }

    window.Tutorial = {
        DEFAULT_KEY: DEFAULT_KEY,

        jaViu: function (key) {
            return localStorage.getItem(key || DEFAULT_KEY) === '1';
        },

        /**
         * @param {Array}    steps       - passos do tour
         * @param {Function} [onFinish]  - callback ao concluir/pular
         * @param {string}   [storageKey] - chave localStorage (padrão: DEFAULT_KEY)
         */
        iniciar: function (steps, onFinish, storageKey) {
            if (!steps || !steps.length) return;
            _steps      = steps;
            _currentStep = 0;
            _onFinish   = onFinish || null;
            _storageKey = storageKey || DEFAULT_KEY;
            _remover();
            _criar();
            _renderStep();
        },

        resetar: function (storageKey, destino) {
            localStorage.removeItem(storageKey || DEFAULT_KEY);
            window.location.href = destino || 'dashboard.html';
        },

        // Métodos internos expostos para handlers inline
        _proximo: function () {
            if (_currentStep < _steps.length - 1) {
                _currentStep++;
                _renderStep();
            } else {
                _finalizar();
            }
        },

        _anterior: function () {
            if (_currentStep > 0) {
                _currentStep--;
                _renderStep();
            }
        },

        _pular: function () {
            _finalizar();
        },

        _finalizar: function () {
            _finalizar();
        }
    };
})();

