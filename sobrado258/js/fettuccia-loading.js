/**
 * FettucciaLoading v1.0
 * Partículas adaptativas com magnetismo progressivo
 * Imagem de fundo difusa, textos de branding
 * Auto-destruição e liberação de memória
 */

(function(global) {
    'use strict';
    
    if (global.FettucciaLoading) {
        console.warn('[FettucciaLoading] Já definido. Pulando inicialização.');
        return;
    }
    
    class FettucciaLoading {
        /**
         * @param {Object} config - Configurações
         * @param {string} config.empreendimentoNome - Nome do imóvel
         * @param {string} [config.logoUrl] - URL da logo do corretor
         * @param {string} [config.imagemFundoUrl] - URL da imagem do imóvel (fundo difuso)
         * @param {string} [config.textoBy="By Roberto Fettuccia"] - Texto abaixo do empreendimento
         * @param {string} [config.textoSlogan="Excelência está nos detalhes"] - Texto abaixo do percentual
         * @param {number} [config.minDisplayTime=2800] - Tempo mínimo em ms
         * @param {number} [config.particleCount=200] - Número de partículas
         * @param {boolean} [config.autoDestroy=true] - Auto-destruir após finalizar
         * @param {Function} [config.onComplete] - Callback ao finalizar
         */
        constructor(config) {
            if (!config || !config.empreendimentoNome) {
                throw new Error('[FettucciaLoading] empreendimentoNome é obrigatório');
            }
            
            this.instanceId = 'fl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
            
            this.config = {
                empreendimentoNome: config.empreendimentoNome,
                logoUrl: config.logoUrl || 'https://raw.githubusercontent.com/corretor-fettuccia/img/refs/heads/main/Logo-CorretorRobertoFettuccia-Final.png',   
                imagemFundoUrl: config.imagemFundoUrl || null,
                textoBy: config.textoBy || 'By Roberto Fettuccia',
                textoSlogan: config.textoSlogan || 'Excelência está nos detalhes',
                minDisplayTime: config.minDisplayTime || 2800,
                particleCount: Math.min(config.particleCount || 200, 400),
                autoDestroy: config.autoDestroy !== false,
                onComplete: config.onComplete || null
            };
            
            this.progress = 0;
            this.isComplete = false;
            this.finalized = false;
            this.cleaned = false;
            this.animationId = null;
            this.progressInterval = null;
            this.particles = null;
            this.loadStartTime = null;
            this.assetsLoaded = false;
            this.canvasWidth = 0;
            this.canvasHeight = 0;
            this.elements = {};
            
            this.init = this.init.bind(this);
            this.destroy = this.destroy.bind(this);
            this.resizeHandler = this.resizeHandler.bind(this);
            this.cleanup = this.cleanup.bind(this);
        }
        
        createDOM() {
            if (document.querySelector(`.fettuccia-lp-loading[data-fettuccia-id="${this.instanceId}"]`)) {
                return;
            }
            
            const bgImageHtml = this.config.imagemFundoUrl ? `
                <div class="fettuccia-lp-bg-image">
                    <img src="${this.config.imagemFundoUrl}" alt="Imagem do imóvel" loading="eager">
                </div>
            ` : '';
            
            const html = `
                <div class="fettuccia-lp-loading" data-fettuccia-id="${this.instanceId}">
                    ${bgImageHtml}
                    <div class="fettuccia-lp-ocean-bg"></div>
                    <canvas class="fettuccia-lp-canvas" data-fettuccia-canvas="${this.instanceId}"></canvas>
                    <div class="fettuccia-lp-content">
                        <div class="fettuccia-lp-empreendimento" data-fettuccia-empreendimento="${this.instanceId}">${this.escapeHtml(this.config.empreendimentoNome)}</div>
                        <div class="fettuccia-lp-by" data-fettuccia-by="${this.instanceId}">${this.escapeHtml(this.config.textoBy)}</div>
                        <div class="fettuccia-lp-logo-wrapper" data-fettuccia-logo-wrapper="${this.instanceId}">
                            <img src="${this.config.logoUrl}" 
                                 alt="Roberto Fettuccia" 
                                 class="fettuccia-lp-logo"
                                 data-fettuccia-logo="${this.instanceId}"
                                 onerror="this.src='https://placehold.co/140x140?text=RF'">
                        </div>
                        <div class="fettuccia-lp-progress-container">
                            <div class="fettuccia-lp-progress-bg">
                                <div class="fettuccia-lp-progress-fill" data-fettuccia-progress="${this.instanceId}"></div>
                            </div>
                            <div class="fettuccia-lp-percentage" data-fettuccia-percentage="${this.instanceId}">0%</div>
                            <div class="fettuccia-lp-slogan" data-fettuccia-slogan="${this.instanceId}">${this.escapeHtml(this.config.textoSlogan)}</div>
                        </div>
                    </div>
                </div>
                <div class="fettuccia-lp-curtain" data-fettuccia-curtain="${this.instanceId}"></div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', html);
            
            this.elements.container = document.querySelector(`.fettuccia-lp-loading[data-fettuccia-id="${this.instanceId}"]`);
            this.elements.canvas = document.querySelector(`.fettuccia-lp-canvas[data-fettuccia-canvas="${this.instanceId}"]`);
            this.elements.logoWrapper = document.querySelector(`.fettuccia-lp-logo-wrapper[data-fettuccia-logo-wrapper="${this.instanceId}"]`);
            this.elements.progressFill = document.querySelector(`.fettuccia-lp-progress-fill[data-fettuccia-progress="${this.instanceId}"]`);
            this.elements.percentageSpan = document.querySelector(`.fettuccia-lp-percentage[data-fettuccia-percentage="${this.instanceId}"]`);
            this.elements.curtain = document.querySelector(`.fettuccia-lp-curtain[data-fettuccia-curtain="${this.instanceId}"]`);
            this.elements.bgImage = document.querySelector(`.fettuccia-lp-bg-image`);
            this.elements.byText = document.querySelector(`.fettuccia-lp-by[data-fettuccia-by="${this.instanceId}"]`);
            this.elements.sloganText = document.querySelector(`.fettuccia-lp-slogan[data-fettuccia-slogan="${this.instanceId}"]`);
            
            this.updateCanvasDimensions();
        }
        
        updateCanvasDimensions() {
            if (this.elements.canvas) {
                this.canvasWidth = window.innerWidth;
                this.canvasHeight = window.innerHeight;
                this.elements.canvas.width = this.canvasWidth;
                this.elements.canvas.height = this.canvasHeight;
            }
        }
        
        escapeHtml(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }
        
        createParticles() {
            const particles = [];
            const count = this.config.particleCount;
            
            for (let i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * this.canvasWidth,
                    y: Math.random() * this.canvasHeight,
                    vx: (Math.random() - 0.5) * 0.25,
                    vy: (Math.random() - 0.5) * 0.25,
                    size: 1.5 + Math.random() * 4,
                    opacity: 0.2 + Math.random() * 0.45,
                    baseOpacity: 0.2 + Math.random() * 0.45,
                    hue: 45 + Math.random() * 20,
                    attracted: false,
                    orbitAngle: Math.random() * Math.PI * 2,
                    orbitRadius: 10 + Math.random() * 35,
                    orbitSpeed: 0.003 + Math.random() * 0.01
                });
            }
            
            return particles;
        }
        
        resetFreeParticles() {
            if (!this.particles) return;
            for (let i = 0; i < this.particles.length; i++) {
                const p = this.particles[i];
                if (p && !p.attracted) {
                    p.x = Math.random() * this.canvasWidth;
                    p.y = Math.random() * this.canvasHeight;
                    p.vx = (Math.random() - 0.5) * 0.25;
                    p.vy = (Math.random() - 0.5) * 0.25;
                }
            }
        }
        
        initParticles() {
            if (!this.elements.canvas || this.finalized) return;
            
            this.updateCanvasDimensions();
            this.particles = this.createParticles();
            
            const canvas = this.elements.canvas;
            const ctx = canvas.getContext('2d');
            
            const animate = () => {
                if (this.finalized || this.cleaned || !this.elements.canvas || !this.elements.logoWrapper) {
                    return;
                }
                
                if (window.innerWidth !== this.canvasWidth || window.innerHeight !== this.canvasHeight) {
                    this.updateCanvasDimensions();
                    this.resetFreeParticles();
                }
                
                ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
                
                const magnetForce = Math.min(1.3, Math.pow(this.progress / 60, 1.15));
                const isAttractionActive = magnetForce > 0.04;
                
                const logoRect = this.elements.logoWrapper.getBoundingClientRect();
                const targetX = logoRect.left + logoRect.width / 2;
                const targetY = logoRect.top + logoRect.height / 2;
                
                if (this.elements.logoWrapper) {
                    const glowIntensity = Math.min(0.7, magnetForce);
                    if (glowIntensity > 0.08) {
                        this.elements.logoWrapper.classList.add('fettuccia-lp-logo-wrapper--glow');
                    } else {
                        this.elements.logoWrapper.classList.remove('fettuccia-lp-logo-wrapper--glow');
                    }
                }
                
                for (const p of this.particles) {
                    if (!p) continue;
                    
                    if (!p.attracted && isAttractionActive) {
                        const dx = targetX - p.x;
                        const dy = targetY - p.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        const influenceRadius = 120 + magnetForce * 250;
                        
                        if (distance < influenceRadius && distance > 3) {
                            const angle = Math.atan2(dy, dx);
                            const force = magnetForce * (1 - Math.min(0.85, distance / influenceRadius)) * 1.3;
                            p.vx += Math.cos(angle) * force;
                            p.vy += Math.sin(angle) * force;
                            p.opacity = Math.min(0.85, p.baseOpacity + (1 - distance / influenceRadius) * 0.5);
                        }
                        
                        const maxSpeed = 4 + magnetForce * 3.5;
                        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                        if (speed > maxSpeed) {
                            p.vx = (p.vx / speed) * maxSpeed;
                            p.vy = (p.vy / speed) * maxSpeed;
                        }
                        
                        const distToLogo = Math.sqrt(dx * dx + dy * dy);
                        if (distToLogo < 18 && !p.attracted) {
                            p.attracted = true;
                        }
                    }
                    
                    p.x += p.vx;
                    p.y += p.vy;
                    
                    if (!p.attracted) {
                        p.vx *= 0.997;
                        p.vy *= 0.997;
                    }
                    
                    if (p.x < -30) p.x = this.canvasWidth + 30;
                    if (p.x > this.canvasWidth + 30) p.x = -30;
                    if (p.y < -30) p.y = this.canvasHeight + 30;
                    if (p.y > this.canvasHeight + 30) p.y = -30;
                    
                    p.x += Math.sin(Date.now() * 0.0008 * p.size) * 0.04;
                    p.y += Math.cos(Date.now() * 0.0008 * p.size + 1) * 0.04;
                    
                    if (p.attracted && targetX && targetY) {
                        p.orbitAngle += p.orbitSpeed * (1 + magnetForce * 0.6);
                        p.x = targetX + Math.cos(p.orbitAngle) * p.orbitRadius;
                        p.y = targetY + Math.sin(p.orbitAngle) * p.orbitRadius;
                        p.opacity = 0.55 + Math.sin(Date.now() * 0.006) * 0.2;
                    }
                    
                    ctx.beginPath();
                    
                    let gradient;
                    if (p.attracted && magnetForce > 0.2) {
                        gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 1.6);
                        gradient.addColorStop(0, `rgba(245, 215, 110, ${p.opacity})`);
                        gradient.addColorStop(0.6, `rgba(202, 162, 86, ${p.opacity * 0.6})`);
                        ctx.shadowBlur = 9;
                    } else {
                        gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                        gradient.addColorStop(0, `rgba(232, 200, 122, ${p.opacity * 0.8})`);
                        gradient.addColorStop(1, `rgba(202, 162, 86, ${p.opacity * 0.2})`);
                        ctx.shadowBlur = 5;
                    }
                    
                    ctx.fillStyle = gradient;
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowColor = '#CAA256';
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
                
                if (!this.finalized && !this.cleaned) {
                    this.animationId = requestAnimationFrame(animate);
                }
            };
            
            animate();
        }
        
        resizeHandler() {
            if (this.finalized || this.cleaned || !this.elements.canvas) return;
            
            const newWidth = window.innerWidth;
            const newHeight = window.innerHeight;
            
            if (newWidth !== this.canvasWidth || newHeight !== this.canvasHeight) {
                this.canvasWidth = newWidth;
                this.canvasHeight = newHeight;
                this.elements.canvas.width = this.canvasWidth;
                this.elements.canvas.height = this.canvasHeight;
                this.resetFreeParticles();
            }
        }
        
        startProgressSimulation() {
            let currentProgress = 0;
            
            this.progressInterval = setInterval(() => {
                if (this.isComplete || this.finalized || this.cleaned) return;
                
                if (this.assetsLoaded) {
                    const increment = Math.random() * 11 + 5;
                    currentProgress = Math.min(100, currentProgress + increment);
                } else {
                    const increment = Math.random() * 1.5 + 0.5;
                    currentProgress = Math.min(78, currentProgress + increment);
                }
                
                this.progress = currentProgress;
                
                if (this.elements.progressFill) {
                    this.elements.progressFill.style.width = currentProgress + '%';
                }
                if (this.elements.percentageSpan) {
                    this.elements.percentageSpan.innerText = Math.floor(currentProgress) + '%';
                }
                
                if (currentProgress >= 100 && !this.isComplete) {
                    clearInterval(this.progressInterval);
                    this.progressInterval = null;
                    this.isComplete = true;
                    
                    const elapsedTime = Date.now() - this.loadStartTime;
                    const remainingTime = Math.max(0, this.config.minDisplayTime - elapsedTime);
                    setTimeout(() => this.finalize(), remainingTime);
                }
            }, 65);
        }
        /*
        waitForAssets() {
            const promises = [];
            
            if (this.elements.bgImage) {
                const bgImg = this.elements.bgImage.querySelector('img');
                if (bgImg && !bgImg.complete) {
                    promises.push(new Promise(resolve => {
                        bgImg.addEventListener('load', resolve);
                        bgImg.addEventListener('error', resolve);
                    }));
                }
            }
            
            const images = document.querySelectorAll('img:not(.fettuccia-lp-logo)');
            images.forEach(img => {
                if (!img.complete) {
                    promises.push(new Promise(resolve => {
                        img.addEventListener('load', resolve);
                        img.addEventListener('error', resolve);
                    }));
                }
            });
            
            if (document.fonts && document.fonts.ready) {
                promises.push(document.fonts.ready);
            }
            
            if (document.readyState === 'complete') {
                promises.push(Promise.resolve());
            } else {
                promises.push(new Promise(resolve => {
                    window.addEventListener('load', resolve);
                }));
            }
            
            Promise.all(promises).then(() => {
                this.assetsLoaded = true;
            });
        } */
        
waitForAssets() {
    const promises = [];

    const waitImage = (img, timeout = 5000) => {
        return new Promise(resolve => {
            if (!img || img.complete) return resolve();

            const done = () => resolve();

            img.addEventListener('load', done, { once: true });
            img.addEventListener('error', done, { once: true });

            setTimeout(done, timeout);
        });
    };

    if (this.elements.bgImage) {
        const bgImg = this.elements.bgImage.querySelector('img');
        promises.push(waitImage(bgImg, 5000));
    }

    const logo = document.querySelector(`.fettuccia-lp-logo[data-fettuccia-logo="${this.instanceId}"]`);
    promises.push(waitImage(logo, 5000));

    if (document.fonts && document.fonts.ready) {
        promises.push(Promise.race([
            document.fonts.ready,
            new Promise(resolve => setTimeout(resolve, 3000))
        ]));
    }

    Promise.all(promises).then(() => {
        this.assetsLoaded = true;
    });

    setTimeout(() => {
        this.assetsLoaded = true;
    }, 6000);
}

        cleanup() {
            if (this.cleaned) return;
            this.cleaned = true;
            
            if (this.progressInterval) {
                clearInterval(this.progressInterval);
                this.progressInterval = null;
            }
            
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
            
            window.removeEventListener('resize', this.resizeHandler);
            this.particles = null;
            
            if (this.elements.container) {
                this.elements.container.remove();
                this.elements.container = null;
            }
            if (this.elements.curtain) {
                this.elements.curtain.remove();
                this.elements.curtain = null;
            }
            
            this.elements = null;
            console.log('[FettucciaLoading] ✅ Memória completamente liberada');
        }
        
        finalize() {
            if (this.finalized) return;
            this.finalized = true;
            
            if (this.elements.logoWrapper) {
                this.elements.logoWrapper.classList.add('fettuccia-lp-logo-wrapper--fadeout');
            }
            
            setTimeout(() => {
                if (this.elements.curtain) {
                    this.elements.curtain.classList.add('fettuccia-lp-curtain--active');
                }
                
                setTimeout(() => {
                    if (this.elements.container) {
                        this.elements.container.classList.add('fettuccia-lp-loading--hidden');
                    }
                    
                    if (this.config.onComplete) {
                        this.config.onComplete();
                    }
                    
                    if (this.config.autoDestroy) {
                        setTimeout(() => this.cleanup(), 100);
                    } else {
                        if (this.animationId) {
                            cancelAnimationFrame(this.animationId);
                            this.animationId = null;
                        }
                    }
                }, 1000);
            }, 2000);
        }
        
        destroy() {
            this.finalized = true;
            this.cleanup();
        }
        
        init() {
            this.loadStartTime = Date.now();
            this.createDOM();
            this.updateCanvasDimensions();
            
            setTimeout(() => {
                if (!this.finalized && !this.cleaned) {
                    this.initParticles();
                    this.startProgressSimulation();
                    this.waitForAssets();
                }
            }, 10);
            
            window.addEventListener('resize', this.resizeHandler);
        }
    }
    
    global.FettucciaLoading = FettucciaLoading;
    
})(typeof window !== 'undefined' ? window : this);
