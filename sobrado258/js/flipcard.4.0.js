
/**
 * FlipCard 3D Plugin v4
 * Inicializa cartões com classe .flip-card
 * v4: hover via CSS + click/toque via JS
 */
(function(global) {
    'use strict';

    class FlipCard {
        constructor(selector, options = {}) {
            this.options = {
                disableClick: false,
                onFlipStart: null,
                onFlipEnd: null,
                ...options
            };
            this.cards = typeof selector === 'string'
                ? document.querySelectorAll(selector)
                : (selector.length ? selector : [selector]);
            this.init();
        }

        init() {
            this.cards.forEach(card => {
                if (card.dataset.flipcard) return;
                card.dataset.flipcard = 'true';

                if (!this.options.disableClick) {
                    card.addEventListener('click', (e) => {
                        if (e.target.closest('.btn-flip, a')) return;
                        e.stopPropagation();
                        this.toggleFlip(card);
                    });
                }

                card.addEventListener('transitionstart', () => {
                    if (this.options.onFlipStart) this.options.onFlipStart(card);
                });
                card.addEventListener('transitionend', () => {
                    if (this.options.onFlipEnd) this.options.onFlipEnd(card);
                });
            });
        }

        flip(card) {
            if (card && !card.classList.contains('flipped')) {
                card.classList.add('flipped');
            }
        }

        unflip(card) {
            if (card && card.classList.contains('flipped')) {
                card.classList.remove('flipped');
            }
        }

        toggleFlip(card) {
            if (card) card.classList.toggle('flipped');
        }

        destroy() {
            this.cards.forEach(card => {
                delete card.dataset.flipcard;
                card.classList.remove('flipped');
            });
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = FlipCard;
    } else if (typeof define === 'function' && define.amd) {
        define([], () => FlipCard);
    } else {
        global.FlipCard = FlipCard;
    }
})(window);