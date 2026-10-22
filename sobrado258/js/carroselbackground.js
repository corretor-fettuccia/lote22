 // ========== PLUGIN CARROSELBACKGROUND (VERSÃO FINAL CORRIGIDA) ==========
    (function(global) {
      "use strict";

      const DEFAULT = {
        interval: 5000,
        speed: 1200,
        blur: 4,
        opacity: 1,
        overlay: "rgba(0,0,0,0.3)",
        overlayBlendMode: "normal",
        position: "center center",
        scale: 1.02,
        images: [],
        mobileImages: [],
        mobileBreakpoint: 768,
        pauseOnHover: true,
        preload: true,
        lazyLoad: false,
        loop: true,
        startIndex: 0,
        random: false,
        fallbackImage: "",
        debug: false
      };

      const instances = new Map();

      function log(instance, msg, data) {
        if (instance && instance.config && instance.config.debug) {
          console.log(`[carroselbackground] ${msg}`, data || "");
        }
      }

      function merge(target, source) {
        const out = Object.assign({}, target);
        if (!source) return out;
        for (let key of Object.keys(source)) {
          if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
            out[key] = merge(target[key], source[key]);
          } else {
            out[key] = source[key];
          }
        }
        return out;
      }

      class CarroselBackground {
        constructor(element, profileConfig = {}) {
          this.el = element;
          this.id = Math.random().toString(36).substr(2, 8);
          this.currentIndex = 0;
          this.timer = null;
          this.paused = false;
          this.isMobile = false;
          this.imagesList = [];
          this.slideA = null;
          this.slideB = null;
          this.activeSlide = null;
          this.inactiveSlide = null;
          this.resizeObserver = null;

          let config = merge({}, DEFAULT);
          config = merge(config, profileConfig);
          // Garantir arrays
          if (!Array.isArray(config.images)) config.images = [];
          if (!Array.isArray(config.mobileImages)) config.mobileImages = [];
          this.config = config;

          this.readDataAttributes();
          this.applyCSSvars();
          this.init();
        }

        readDataAttributes() {
          const el = this.el;
          // Atributos simples
          const attrs = [
            "interval", "speed", "blur", "opacity", "overlay",
            "overlay-blend-mode", "position", "scale", "mobile-breakpoint",
            "pause-on-hover", "preload", "lazy-load", "loop", "start-index",
            "random", "debug"
          ];
          for (let attr of attrs) {
            const value = el.getAttribute(`data-carroselbackground-${attr}`);
            if (value !== null) {
              let parsed = value;
              if (value === "true") parsed = true;
              else if (value === "false") parsed = false;
              else if (!isNaN(Number(value))) parsed = Number(value);
              const key = attr.replace(/-([a-z])/g, (_, m) => m.toUpperCase());
              this.config[key] = parsed;
            }
          }
          // Overlay cor
          const overlayColor = el.getAttribute("data-carroselbackground-overlay");
          if (overlayColor !== null) this.config.overlay = overlayColor;

          // Suporte direto a data-carroselbackground-images (array JSON)
          const imagesAttr = el.getAttribute("data-carroselbackground-images");
          if (imagesAttr) {
            try {
              const parsed = JSON.parse(imagesAttr);
              if (Array.isArray(parsed)) this.config.images = parsed;
            } catch(e) { console.warn("carroselbackground: erro ao parsear images", e); }
          }
          // mobile-images
          const mobileImagesAttr = el.getAttribute("data-carroselbackground-mobile-images");
          if (mobileImagesAttr) {
            try {
              const parsed = JSON.parse(mobileImagesAttr);
              if (Array.isArray(parsed)) this.config.mobileImages = parsed;
            } catch(e) { console.warn("carroselbackground: erro ao parsear mobile-images", e); }
          }
        }

        applyCSSvars() {
          const s = this.el.style;
          s.setProperty("--cb-speed", `${this.config.speed}ms`);
          s.setProperty("--cb-blur", `${this.config.blur}px`);
          s.setProperty("--cb-scale", this.config.scale);
          s.setProperty("--cb-position", this.config.position);
          s.setProperty("--cb-blend-mode", this.config.overlayBlendMode);
        }

        init() {
          if (this.el.classList.contains("cb-initialized")) return;
          log(this, "Inicializando...");

          this.buildDOM();
          this.updateImagesList();   // ← agora sempre atualiza a lista
          this.preloadImages().then(() => {
            if (this.imagesList.length === 0) {
              console.warn("carroselbackground: NENHUMA IMAGEM definida. Use data-carroselbackground-images ou configure JSON.");
              return;
            }
            this.startSlideshow();
            if (this.config.pauseOnHover) this.setupHover();
            this.setupResize();
            this.el.classList.add("cb-initialized");
            if (this.config.debug) this.el.classList.add("cb-debug");
            log(this, "Inicializado com sucesso", { imagens: this.imagesList.length });
          });
        }

        buildDOM() {
          let stage = this.el.querySelector(".carroselbackground__stage");
          if (!stage) {
            stage = document.createElement("div");
            stage.className = "carroselbackground__stage";
            this.el.appendChild(stage);
          }
          let slideA = this.el.querySelector(".carroselbackground__slide--a");
          let slideB = this.el.querySelector(".carroselbackground__slide--b");
          if (!slideA) {
            slideA = document.createElement("div");
            slideA.className = "carroselbackground__slide carroselbackground__slide--a";
            stage.appendChild(slideA);
          }
          if (!slideB) {
            slideB = document.createElement("div");
            slideB.className = "carroselbackground__slide carroselbackground__slide--b";
            stage.appendChild(slideB);
          }
          this.slideA = slideA;
          this.slideB = slideB;

          let overlay = this.el.querySelector(".carroselbackground__overlay");
          if (!overlay) {
            overlay = document.createElement("div");
            overlay.className = "carroselbackground__overlay";
            overlay.style.backgroundColor = this.config.overlay;
            overlay.style.opacity = this.config.opacity;
            this.el.appendChild(overlay);
          }

          let content = this.el.querySelector(".carroselbackground__content");
          if (!content) {
            content = document.createElement("div");
            content.className = "carroselbackground__content";
            const children = Array.from(this.el.childNodes);
            for (let child of children) {
              if (child.nodeType === 1 && child.classList && (child.classList.contains("carroselbackground__stage") || child.classList.contains("carroselbackground__overlay"))) continue;
              content.appendChild(child.cloneNode(true));
            }
            this.el.innerHTML = "";
            this.el.appendChild(stage);
            this.el.appendChild(overlay);
            this.el.appendChild(content);
          }
        }

        // CORREÇÃO AQUI: sempre atualiza a lista de imagens baseada no estado atual
        updateImagesList() {
          const isMobileNow = window.innerWidth <= this.config.mobileBreakpoint;
          this.isMobile = isMobileNow;
          const mobile = Array.isArray(this.config.mobileImages) ? this.config.mobileImages : [];
          const desktop = Array.isArray(this.config.images) ? this.config.images : [];
          this.imagesList = (this.isMobile && mobile.length) ? [...mobile] : [...desktop];
          log(this, `Modo ${this.isMobile ? "mobile" : "desktop"}`, this.imagesList);
        }

        async preloadImages() {
          if (!this.config.preload) return;
          for (let i = 0; i < this.imagesList.length; i++) {
            const src = this.imagesList[i];
            if (!src) continue;
            await new Promise((resolve) => {
              const img = new Image();
              img.onload = () => resolve();
              img.onerror = () => { console.warn(`Falha: ${src}`); resolve(); };
              img.src = src;
            });
          }
        }

        startSlideshow() {
          if (this.imagesList.length === 0) return;
          let start = this.config.startIndex;
          if (this.config.random) start = Math.floor(Math.random() * this.imagesList.length);
          this.currentIndex = Math.min(start, this.imagesList.length - 1);

          this.updateSlideImage(this.slideA, this.currentIndex);
          const next = (this.currentIndex + 1) % this.imagesList.length;
          this.updateSlideImage(this.slideB, next);

          this.activeSlide = this.slideA;
          this.inactiveSlide = this.slideB;
          this.activeSlide.classList.add("carroselbackground__slide--active");
          this.resetTimer();
        }

        updateSlideImage(slide, index) {
          if (!slide || !this.imagesList[index]) return;
          const oldImg = slide.querySelector(".carroselbackground__image");
          if (oldImg) oldImg.remove();

          const img = document.createElement("img");
          img.src = this.imagesList[index];
          img.alt = "background";
          img.className = "carroselbackground__image";
          if (this.config.blur > 0) img.classList.add("carroselbackground__image--blur");
          img.style.opacity = this.config.opacity;
          if (this.config.lazyLoad) img.loading = "lazy";
          slide.appendChild(img);
        }

        nextSlide() {
          if (this.paused || this.imagesList.length <= 1) return;
          const nextIndex = (this.currentIndex + 1) % this.imagesList.length;
          if (!this.config.loop && nextIndex === 0 && this.currentIndex === this.imagesList.length - 1) return;

          const newActive = this.inactiveSlide;
          const newInactive = this.activeSlide;
          this.updateSlideImage(newActive, nextIndex);
          newActive.classList.add("carroselbackground__slide--active");
          newInactive.classList.remove("carroselbackground__slide--active");

          this.activeSlide = newActive;
          this.inactiveSlide = newInactive;
          this.currentIndex = nextIndex;
          this.resetTimer();
        }

        resetTimer() {
          if (this.timer) clearInterval(this.timer);
          if (this.imagesList.length > 1) {
            this.timer = setInterval(() => this.nextSlide(), this.config.interval);
          }
        }

        setupHover() {
          this.el.addEventListener("mouseenter", () => { this.paused = true; });
          this.el.addEventListener("mouseleave", () => { this.paused = false; this.resetTimer(); });
        }

        setupResize() {
          this.resizeObserver = new ResizeObserver(() => {
            const oldMobile = this.isMobile;
            this.updateImagesList();
            if (oldMobile !== this.isMobile) {
              log(this, "Mobile/desktop mudou, recriando...");
              this.destroy();
              this.init();
            }
          });
          this.resizeObserver.observe(this.el);
        }

        destroy() {
          if (this.timer) clearInterval(this.timer);
          if (this.resizeObserver) this.resizeObserver.disconnect();
          const content = this.el.querySelector(".carroselbackground__content");
          if (content) {
            const original = Array.from(content.childNodes);
            this.el.innerHTML = "";
            original.forEach(node => this.el.appendChild(node.cloneNode(true)));
          } else {
            this.el.innerHTML = "";
          }
          this.el.classList.remove("cb-initialized", "cb-debug");
        }

        refresh() {
          this.destroy();
          this.init();
        }
      }

      // API pública
      const CarroselBackgroundAPI = {
        async init(context = document) {
          const elements = context.querySelectorAll(".carroselbackground:not(.cb-initialized)");
          for (let el of elements) {
            if (instances.has(el)) continue;
            const instance = new CarroselBackground(el, {});
            instances.set(el, instance);
          }
        },
        refresh(element) {
          const inst = instances.get(element);
          if (inst) inst.refresh();
        },
        destroy(element) {
          const inst = instances.get(element);
          if (inst) {
            inst.destroy();
            instances.delete(element);
          }
        }
      };

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => CarroselBackgroundAPI.init());
      } else {
        CarroselBackgroundAPI.init();
      }

      global.carroselbackground = CarroselBackgroundAPI;
    })(window);