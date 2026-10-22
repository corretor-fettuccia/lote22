/**
 * Menu Premium - Efeito 3D
 * Versão revisada para mobile + âncoras
 */
(function() {
    'use strict';

    const MenuPremium = {
        config: {
            scrollThreshold: 30,
            mobileBreakpoint: 768,
            closeDelay: 80
        },

        elements: {
            nav: null,
            hamburger: null,
            menu: null,
            links: []
        },

        state: {
            isMenuOpen: false,
            isSolid: false
        },

        init: function() {
            this.elements.nav = document.querySelector('.menuPremium__');
            this.elements.hamburger = document.querySelector('.menuPremium__hamburger');
            this.elements.menu = document.querySelector('.menuPremium__menu');
            this.elements.links = document.querySelectorAll('.menuPremium__list a');

            if (!this.elements.nav) return;

            this.bindEvents();
            this.checkScroll();
        },

        bindEvents: function() {
            let ticking = false;

            window.addEventListener('scroll', () => {
                if (!ticking) {
                    requestAnimationFrame(() => {
                        this.checkScroll();
                        ticking = false;
                    });
                    ticking = true;
                }
            });

            if (this.elements.hamburger) {
                this.elements.hamburger.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.toggleMobileMenu();
                });
            }

            this.elements.links.forEach(link => {
                link.addEventListener('click', (e) => {
                    this.handleMenuLinkClick(e, link);
                });
            });

            window.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.state.isMenuOpen) {
                    this.closeMobileMenu();
                }
            });

            let resizeTimer;

            window.addEventListener('resize', () => {
                clearTimeout(resizeTimer);

                resizeTimer = setTimeout(() => {
                    if (window.innerWidth > this.config.mobileBreakpoint && this.state.isMenuOpen) {
                        this.closeMobileMenu();
                    }
                }, 150);
            });
        },

        handleMenuLinkClick: function(e, link) {
            const href = link.getAttribute('href');
            const isMobile = window.innerWidth <= this.config.mobileBreakpoint;

            if (!href) return;

            if (!isMobile) return;

            if (href.startsWith('#')) {
                e.preventDefault();

                const target = document.querySelector(href);

                this.closeMobileMenu();

                if (target) {
                    setTimeout(() => {
                        const menuHeight = this.elements.nav.offsetHeight || 0;
                        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - menuHeight;

                        window.scrollTo({
                            top: targetPosition,
                            behavior: 'smooth'
                        });
                    }, this.config.closeDelay);
                }

                return;
            }

            this.closeMobileMenu();
        },

        checkScroll: function() {
            const scrollPosition = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
            const shouldBeSolid = scrollPosition > this.config.scrollThreshold;

            if (shouldBeSolid !== this.state.isSolid) {
                this.state.isSolid = shouldBeSolid;
                this.elements.nav.classList.toggle('solid', shouldBeSolid);
            }
        },

        toggleMobileMenu: function() {
            if (this.state.isMenuOpen) {
                this.closeMobileMenu();
            } else {
                this.openMobileMenu();
            }
        },

        openMobileMenu: function() {
            this.state.isMenuOpen = true;

            this.elements.menu?.classList.add('active');
            this.elements.hamburger?.classList.add('active');

            this.elements.hamburger?.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden';
        },

        closeMobileMenu: function() {
            this.state.isMenuOpen = false;

            this.elements.menu?.classList.remove('active');
            this.elements.hamburger?.classList.remove('active');

            this.elements.hamburger?.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => MenuPremium.init());
    } else {
        MenuPremium.init();
    }

    window.MenuPremium = MenuPremium;
})();