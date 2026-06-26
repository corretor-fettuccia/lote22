/* popup_promo.js v4.0 – Framework XML */
(function(global, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = factory();
    } else {
        global.PopupPromo = factory();
    }
}(typeof window !== 'undefined' ? window : this, function() {
    'use strict';

    // --- helpers ---
    function esc(s) {
        return String(s || '').replace(/[&<>'"]/g, function(m) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[m];
        });
    }
    function hexToRgb(hex) {
        hex = String(hex || '#000000').replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
        var n = parseInt(hex, 16) || 0;
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(',');
    }
    function localYMD() {
        var dt = new Date();
        var m = String(dt.getMonth() + 1).padStart(2, '0');
        var d = String(dt.getDate()).padStart(2, '0');
        return dt.getFullYear() + '-' + m + '-' + d;
    }
    function isBetween(date, start, end) {
        if (!start && !end) return true;
        if (start && date < start) return false;
        if (end && date > end) return false;
        return true;
    }

    // --- armazenamento ---
    var STORE_KEY = 'popupPromo4';
    function readState() {
        try {
            var raw = localStorage.getItem(STORE_KEY) || sessionStorage.getItem(STORE_KEY) || '{"shown":{},"firstShownAt":{},"repeatDone":{}}';
            return JSON.parse(raw);
        } catch (e) {
            return { shown: {}, firstShownAt: {}, repeatDone: {} };
        }
    }
    function saveState(state) {
        try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {
            try { sessionStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (_) {}
        }
    }

    // --- parser XML ---
    function parseXML(xmlText) {
        var doc = new DOMParser().parseFromString(xmlText, 'text/xml');
        if (doc.querySelector('parsererror')) throw new Error('XML inválido');
        var camps = [];
        var nodes = doc.querySelectorAll('promocao');
        nodes.forEach(function(p) {
            var c = { ativo: p.getAttribute('ativo') !== 'false' };
            var get = function(tag) {
                var el = p.querySelector(tag);
                return el ? el.textContent.trim() : '';
            };
            c.id = get('id') || 'popup';
            c.titulo = get('titulo') || 'Título';
            c.subtitulo = get('subtitulo');
            c.imagem = get('imagem');
            c.botaoTexto = get('botaoTexto') || 'Saber mais';
            c.botaoUrl = get('botaoUrl') || '#';
            c.topicos = [];
            p.querySelectorAll('topicos > topico').forEach(function(t) {
                var v = t.textContent.trim();
                if (v) c.topicos.push(v);
            });
            // cores
            c.corOverlay = get('overlay') || '#000000';
            c.corFundo = get('fundo') || '#ffffff';
            c.corTitulo = get('tituloCor') || get('titulo') || '#151526'; // compat
            c.corTexto = get('texto') || '#2d2d3a';
            c.corDestaque = get('destaque') || '#f97316';
            c.corBotaoInicio = get('botaoInicio') || '#f97316';
            c.corBotaoFim = get('botaoFim') || '#ea580c';
            c.corBotaoTexto = get('botaoTextoCor') || get('botaoTexto') || '#ffffff';
            c.corFechar = get('fechar') || '#000000';

            // gatilho principal
            var gt = p.querySelector('gatilhoPrincipal');
            if (gt) {
                c.gatilhoTipo = gt.getAttribute('tipo') || 'delay';
                c.dataInicio = get('dataInicio');
                c.dataFim = get('dataFim');
                c.delaySegundos = parseInt(get('delaySegundos')) || 0;
                c.scrollPercent = parseInt(get('scrollPercent')) || 50;
                // fallback para campos antigos
                if (!c.delaySegundos && c.gatilhoTipo === 'delay') c.delaySegundos = 5;
            } else {
                // fallback para estrutura antiga
                var showSempre = get('showSempre') === 'true';
                var showOnScroll = get('showOnScroll') === 'true';
                var showBeforeLoading = get('showBeforeLoading') === 'true';
                if (showOnScroll) {
                    c.gatilhoTipo = 'scroll';
                    c.scrollPercent = parseInt(get('scrollPercent')) || 50;
                    c.delaySegundos = parseInt(get('scrollDelay')) || 0;
                } else if (showBeforeLoading || !showSempre) {
                    c.gatilhoTipo = 'data';
                    c.dataInicio = get('inicio') || '';
                    c.dataFim = get('fim') || '';
                    c.delaySegundos = parseInt(get('delaySegundos')) || 0;
                } else {
                    c.gatilhoTipo = 'delay';
                    c.delaySegundos = parseInt(get('delaySegundos')) || 5;
                }
            }

            // persistência
            var pst = p.querySelector('persistencia');
            if (pst) {
                c.persistente = get('persistente') === 'true';
                c.repeatVezes = parseInt(get('reabrirDepoisFecharVezes')) || 0;
                c.repeatIntervalo = parseInt(get('intervaloSegundos')) || 10;
                c.repeatPopupId = get('popupSecundarioId') || '';
            } else {
                c.persistente = false;
                c.repeatVezes = 0;
                c.repeatIntervalo = 10;
                c.repeatPopupId = '';
            }

            // limites
            var lim = p.querySelector('limites');
            if (lim) {
                c.maxExibicoes = get('maxExibicoes') ? parseInt(get('maxExibicoes')) : null;
                c.reexibirDias = get('reexibirAposDias') ? parseInt(get('reexibirAposDias')) : null;
            } else {
                c.maxExibicoes = null;
                c.reexibirDias = null;
            }

            camps.push(c);
        });
        return camps;
    }

    // --- classe principal ---
    function PopupPromo() {
        this.camps = [];
        this.state = readState();
        this.pageFired = {};
        this.timers = [];
        this._destroyed = false;
        this._booted = false;
        this._currentOverlay = null;
        this._closeHandler = null;
        this._scrollListener = null;
        this._pendingScroll = false;
    }

    PopupPromo.prototype = {
        _saveState: function() {
            saveState(this.state);
        },
        _resetState: function() {
            try { localStorage.removeItem(STORE_KEY); } catch(e) {}
            try { sessionStorage.removeItem(STORE_KEY); } catch(e) {}
            this.state = { shown: {}, firstShownAt: {}, repeatDone: {} };
            this.pageFired = {};
            this.timers.forEach(clearTimeout);
            this.timers = [];
        },
        _findCampaign: function(id) {
            return this.camps.find(function(c) { return c.id === id; });
        },
        _isActive: function(c) {
            if (!c || c.ativo === false) return false;
            // verifica data
            if (c.gatilhoTipo === 'data') {
                var today = localYMD();
                if (c.dataInicio && today < c.dataInicio) return false;
                if (c.dataFim && today > c.dataFim) return false;
            }
            return true;
        },
        _isEligible: function(c, opts) {
            opts = opts || {};
            if (!this._isActive(c)) return false;
            // se for secundário e não for chamado por persistência, bloqueia
            var secondaryIds = {};
            this.camps.forEach(function(camp) {
                if (camp.persistente && camp.repeatPopupId) secondaryIds[camp.repeatPopupId] = true;
            });
            if (!opts.fromPersistence && secondaryIds[c.id]) return false;

            // limites
            var limit = c.maxExibicoes;
            if (limit !== null && limit !== undefined && limit > 0) {
                var n = this.state.shown[c.id] || 0;
                var first = this.state.firstShownAt[c.id] || 0;
                var days = c.reexibirDias || 0;
                if (days > 0 && first && Date.now() - first >= days * 86400000) {
                    this.state.shown[c.id] = 0;
                    this.state.firstShownAt[c.id] = 0;
                    n = 0;
                    this._saveState();
                }
                if (n >= limit) return false;
            }
            return true;
        },
        _schedule: function(fn, sec) {
            var t = setTimeout(fn, Math.max(0, Number(sec) || 0) * 1000);
            this.timers.push(t);
            return t;
        },
        _applyColors: function(el, c) {
            el.style.setProperty('--pp-overlay-rgb', hexToRgb(c.corOverlay));
            el.style.setProperty('--pp-close-rgb', hexToRgb(c.corFechar));
            el.style.setProperty('--pp-bg', c.corFundo);
            el.style.setProperty('--pp-title', c.corTitulo);
            el.style.setProperty('--pp-text', c.corTexto);
            el.style.setProperty('--pp-accent', c.corDestaque);
            el.style.setProperty('--pp-btn-a', c.corBotaoInicio);
            el.style.setProperty('--pp-btn-b', c.corBotaoFim);
            el.style.setProperty('--pp-btn-text', c.corBotaoTexto);
        },
        _buildPopupHTML: function(c) {
            var topics = (c.topicos && c.topicos.length) ?
                '<ul class="pp-topics">' + c.topicos.map(function(t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' :
                '';
            return '<div class="pp-overlay">' +
                '<div class="pp-container">' +
                '<button class="pp-close" aria-label="Fechar">×</button>' +
                (c.imagem ? '<img class="pp-image" src="' + esc(c.imagem) + '" alt="' + esc(c.titulo) + '">' : '') +
                '<div class="pp-content">' +
                '<h2 class="pp-title">' + esc(c.titulo) + '</h2>' +
                (c.subtitulo ? '<p class="pp-subtitle">' + esc(c.subtitulo) + '</p>' : '') +
                topics +
                '<a class="pp-button" href="' + esc(c.botaoUrl) + '" target="_blank" rel="noopener">' + esc(c.botaoTexto) + '</a>' +
                '</div></div></div>';
        },
        _showPopup: function(c, opts) {
            if (this._destroyed) return false;
            if (document.querySelector('.pp-overlay')) return false;
            if (!this._isEligible(c, opts)) return false;

            this.state.shown[c.id] = (this.state.shown[c.id] || 0) + 1;
            if (!this.state.firstShownAt[c.id]) this.state.firstShownAt[c.id] = Date.now();
            this._saveState();

            var self = this;
            var container = document.createElement('div');
            container.innerHTML = this._buildPopupHTML(c);
            var overlay = container.firstElementChild;
            this._applyColors(overlay, c);
            document.body.appendChild(overlay);
            this._currentOverlay = overlay;

            var closeBtn = overlay.querySelector('.pp-close');
            var closeHandler = function(e) {
                e.preventDefault();
                self.hide();
                self._afterClose(c);
            };
            closeBtn.addEventListener('click', closeHandler);
            overlay.addEventListener('click', function(e) {
                if (e.target === overlay) {
                    self.hide();
                    self._afterClose(c);
                }
            });
            this._closeHandler = closeHandler;
            return true;
        },
        _afterClose: function(c) {
            if (!c.persistente) return;
            var max = Number(c.repeatVezes || 0);
            if (max <= 0) return;
            var key = c.id + ':' + (c.repeatPopupId || '');
            var done = this.state.repeatDone[key] || 0;
            if (done >= max) return;
            var next = this._findCampaign(c.repeatPopupId);
            if (!next) return;
            this.state.repeatDone[key] = done + 1;
            this._saveState();
            var self = this;
            this._schedule(function() {
                self._showPopup(next, { fromPersistence: true });
            }, Number(c.repeatIntervalo || 10));
        },
        _bindScroll: function() {
            var self = this;
            var ticking = false;
            var onScroll = function() {
                if (!ticking) {
                    window.requestAnimationFrame(function() {
                        var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
                        var y = window.scrollY || document.documentElement.scrollTop || 0;
                        var pct = (y / max) * 100;
                        self.camps.forEach(function(c) {
                            if (c.gatilhoTipo !== 'scroll') return;
                            if (self.pageFired[c.id]) return;
                            if (!self._isEligible(c)) return;
                            if (pct >= (c.scrollPercent || 50)) {
                                self.pageFired[c.id] = true;
                                self._schedule(function() {
                                    self._showPopup(c, { trigger: 'scroll' });
                                }, Number(c.delaySegundos || 0));
                            }
                        });
                        ticking = false;
                    });
                    ticking = true;
                }
            };
            window.addEventListener('scroll', onScroll, { passive: true });
            this._scrollCleanup = function() {
                window.removeEventListener('scroll', onScroll);
            };
        },
        _scheduleInitial: function() {
            var self = this;
            // delay
            this.camps.forEach(function(c) {
                if (c.gatilhoTipo === 'delay') {
                    self.pageFired[c.id] = true;
                    self._schedule(function() {
                        self._showPopup(c, { trigger: 'delay' });
                    }, Number(c.delaySegundos || 0));
                }
                // data: verifica se está no intervalo e agenda delay
                if (c.gatilhoTipo === 'data') {
                    var today = localYMD();
                    if (isBetween(today, c.dataInicio, c.dataFim)) {
                        self.pageFired[c.id] = true;
                        self._schedule(function() {
                            self._showPopup(c, { trigger: 'data' });
                        }, Number(c.delaySegundos || 0));
                    }
                }
                // scroll é tratado no evento
            });
            this._bindScroll();
        },
        // --- API pública ---
        init: function(xmlText) {
            if (this._destroyed) { console.warn('PopupPromo: instância destruída.'); return this; }
            if (this._booted) { console.warn('PopupPromo: já inicializado. Use updateConfig().'); return this; }
            try {
                this.camps = parseXML(xmlText);
            } catch (e) {
                console.error('PopupPromo: erro ao parsear XML', e);
                return this;
            }
            this.state = readState();
            this._scheduleInitial();
            this._booted = true;
            return this;
        },
        show: function(id, options) {
            if (this._destroyed) return false;
            var c = this._findCampaign(id);
            if (!c) { console.warn('PopupPromo: campanha "' + id + '" não encontrada.'); return false; }
            return this._showPopup(c, options || { fromPersistence: true });
        },
        hide: function() {
            if (this._currentOverlay && this._currentOverlay.parentNode) {
                this._currentOverlay.parentNode.removeChild(this._currentOverlay);
                this._currentOverlay = null;
                this._closeHandler = null;
                return true;
            }
            return false;
        },
        updateConfig: function(xmlText) {
            if (this._destroyed) { console.warn('PopupPromo: instância destruída.'); return this; }
            try {
                this.camps = parseXML(xmlText);
            } catch (e) {
                console.error('PopupPromo: erro ao atualizar XML', e);
                return this;
            }
            this.timers.forEach(clearTimeout);
            this.timers = [];
            this.pageFired = {};
            this._scheduleInitial();
            return this;
        },
        destroy: function() {
            if (this._destroyed) return;
            this._destroyed = true;
            this.hide();
            this.timers.forEach(clearTimeout);
            this.timers = [];
            if (this._scrollCleanup) this._scrollCleanup();
            document.querySelectorAll('.pp-overlay').forEach(function(el) { el.remove(); });
            this._booted = false;
            this.camps = [];
            this.state = { shown: {}, firstShownAt: {}, repeatDone: {} };
            this.pageFired = {};
            this._currentOverlay = null;
            this._closeHandler = null;
        },
        resetState: function() {
            this._resetState();
            return this;
        },
        reload: function() {
            if (this._destroyed) return this;
            this.timers.forEach(clearTimeout);
            this.timers = [];
            this.pageFired = {};
            this._scheduleInitial();
            return this;
        }
    };

    // --- singleton com auto-boot ---
    var singleton = null;
    function getInstance() {
        if (!singleton) singleton = new PopupPromo();
        return singleton;
    }

    function autoBoot() {
        // tenta carregar popup_promo.xml via fetch
        var paths = ['../popup_promo.xml', './popup_promo.xml', 'popup_promo.xml'];
        var attempt = 0;
        function tryNext() {
            if (attempt >= paths.length) {
                console.warn('PopupPromo: popup_promo.xml não encontrado.');
                return;
            }
            fetch(paths[attempt])
                .then(function(res) {
                    if (!res.ok) throw new Error('HTTP ' + res.status);
                    return res.text();
                })
                .then(function(xml) {
                    getInstance().init(xml);
                })
                .catch(function(err) {
                    attempt++;
                    tryNext();
                });
        }
        tryNext();
    }

    var PublicAPI = {
        init: function(xmlText) { return getInstance().init(xmlText); },
        show: function(id, options) { return getInstance().show(id, options); },
        hide: function() { return getInstance().hide(); },
        updateConfig: function(xmlText) { return getInstance().updateConfig(xmlText); },
        destroy: function() { if (singleton) { singleton.destroy(); singleton = null; } },
        resetState: function() { if (singleton) singleton.resetState(); return this; },
        reload: function() { if (singleton) singleton.reload(); return this; },
        create: function() { return new PopupPromo(); }
    };

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', autoBoot);
        } else {
            autoBoot();
        }
    }

    return PublicAPI;
}));
