// CarroselSF - Plugin (corrigido)
(function(global) {
  'use strict';

  function CarroselSF(container, options) {
    if (!container) {
      console.warn('CarroselSF: container não fornecido.');
      return;
    }

    const defaults = { autoplay: true, delay: 4000, pauseOnHover: true };
    this.opts = Object.assign({}, defaults, options, container.dataset);

    // Converte strings
    if (typeof this.opts.autoplay === 'string') {
      this.opts.autoplay = this.opts.autoplay !== 'false';
    }
    if (typeof this.opts.delay === 'string') {
      this.opts.delay = parseInt(this.opts.delay, 10) || 4000;
    }
    if (typeof this.opts.pauseOnHover === 'string') {
      this.opts.pauseOnHover = this.opts.pauseOnHover !== 'false';
    }

    this.container = container;
    this.track = container.querySelector('.sf-track');
    if (!this.track) {
      console.warn('CarroselSF: .sf-track não encontrado.');
      return;
    }

    this.slides = this.track.children;
    this.total = this.slides.length;
    if (this.total === 0) {
      console.warn('CarroselSF: Nenhum slide encontrado.');
      return;
    }

    this.current = 0;
    this.interval = null;
    this.isPlaying = false;

    // Elementos de controle
    this.prevBtn = container.querySelector('.sf-btn-prev');
    this.nextBtn = container.querySelector('.sf-btn-next');
    this.indicatorsWrap = container.querySelector('.sf-indicators');
    this.counter = container.querySelector('.sf-counter');
    this.autoplayBtn = container.querySelector('.sf-autoplay-btn');

    if (this.autoplayBtn) {
      this.autoplayIcon = this.autoplayBtn.querySelector('i');
      this.autoplayLabel = this.autoplayBtn.querySelector('span');
    }

    // Inicializa
    this.buildIndicators();
    this.updateCounter();
    this.bindEvents();

    if (this.opts.autoplay) {
      this.start();
    }

    if (this.opts.pauseOnHover) {
      this.container.addEventListener('mouseenter', () => {
        if (this.isPlaying) {
          this.pause();
          this.container.dataset.sfWasPlaying = 'true';
        }
      });
      this.container.addEventListener('mouseleave', () => {
        if (this.container.dataset.sfWasPlaying === 'true') {
          this.start();
          this.container.dataset.sfWasPlaying = 'false';
        }
      });
    }
  }

  CarroselSF.prototype.goTo = function(index) {
    if (index < 0) index = this.total - 1;
    if (index >= this.total) index = 0;
    if (index === this.current) return;

    this.current = index;
    this.track.style.transform = 'translateX(-' + (this.current * 100) + '%)';

    if (this.indicatorsWrap) {
      const dots = this.indicatorsWrap.querySelectorAll('.sf-dot');
      dots.forEach((dot, i) => {
        dot.classList.toggle('sf-active', i === this.current);
      });
    }
    this.updateCounter();
  };

  CarroselSF.prototype.next = function() {
    this.goTo(this.current + 1);
  };

  CarroselSF.prototype.prev = function() {
    this.goTo(this.current - 1);
  };

  CarroselSF.prototype.buildIndicators = function() {
    if (!this.indicatorsWrap) return;
    this.indicatorsWrap.innerHTML = '';
    for (let i = 0; i < this.total; i++) {
      const dot = document.createElement('button');
      dot.className = 'sf-dot' + (i === 0 ? ' sf-active' : '');
      dot.setAttribute('data-sf-index', i);
      dot.setAttribute('aria-label', 'Slide ' + (i + 1));
      dot.addEventListener('click', () => {
        this.goTo(i);
        this.resetAutoPlay();
      });
      this.indicatorsWrap.appendChild(dot);
    }
  };

  CarroselSF.prototype.updateCounter = function() {
    if (this.counter) {
      this.counter.textContent = (this.current + 1) + ' / ' + this.total;
    }
  };

  CarroselSF.prototype.bindEvents = function() {
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.prev();
        this.resetAutoPlay();
      });
    }
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.next();
        this.resetAutoPlay();
      });
    }
    if (this.autoplayBtn) {
      this.autoplayBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (this.isPlaying) {
          this.pause();
        } else {
          this.start();
        }
      });
    }

    this.container.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.prev();
        this.resetAutoPlay();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.next();
        this.resetAutoPlay();
      }
    });

    let touchStartX = 0, touchEndX = 0;
    const viewport = this.container.querySelector('.sf-viewport') || this.container;
    viewport.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    viewport.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) this.next();
        else this.prev();
        this.resetAutoPlay();
      }
    }, { passive: true });
  };

  CarroselSF.prototype.start = function() {
    if (this.interval) clearInterval(this.interval);
    this.interval = setInterval(() => {
      this.next();
    }, this.opts.delay);
    this.isPlaying = true;
    this.updateAutoplayUI();
  };

  CarroselSF.prototype.pause = function() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isPlaying = false;
    this.updateAutoplayUI();
  };

  CarroselSF.prototype.resetAutoPlay = function() {
    if (this.isPlaying) {
      this.pause();
      this.start();
    }
  };

  CarroselSF.prototype.updateAutoplayUI = function() {
    if (!this.autoplayBtn) return;
    if (this.autoplayIcon) {
      this.autoplayIcon.className = this.isPlaying ? 'fas fa-pause' : 'fas fa-play';
    }
    if (this.autoplayLabel) {
      this.autoplayLabel.textContent = this.isPlaying ? 'Pausar' : 'Play';
    }
  };

  // Exposição global
  global.CarroselSF = CarroselSF;

})(window);

