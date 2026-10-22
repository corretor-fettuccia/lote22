/**
 * GaleriaBigFour.js - Componente de Cortina Cinematográfica
 * Dependências: nenhuma (JavaScript puro)
 */

class GaleriaBigFour {
    constructor(selector, options = {}) {
        this.container = typeof selector === 'string' 
            ? document.querySelector(selector) 
            : selector;
        
        if (!this.container) {
            console.error('GaleriaBigFour: container não encontrado');
            return;
        }
        
        // Configurações
        this.config = {
            hoverInDelay: options.hoverInDelay || 300,    // ms para expansão
            hoverOutDelay: options.hoverOutDelay || 500,  // ms para recolher
            ...options
        };
        
        this.items = [];
        this.init();
    }
    
    init() {
        // Encontra todos os itens dentro do container
        this.items = Array.from(this.container.querySelectorAll('.galeria-big-four__item'));
        
        if (this.items.length === 0) {
            console.warn('GaleriaBigFour: nenhum item encontrado (.galeria-big-four__item)');
            return;
        }
        
        // Aplica a classe de container se não existir
        if (!this.container.querySelector('.galeria-big-four__container')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'galeria-big-four__container';
            while (this.container.firstChild) {
                wrapper.appendChild(this.container.firstChild);
            }
            this.container.appendChild(wrapper);
        }
        
        // Configura listeners para controle de delay (opcional, usando CSS transitions)
        // O CSS já cuida do efeito, mas podemos adicionar classes para controle extra
        
        // Adiciona atributos ARIA para acessibilidade
        this.items.forEach((item, index) => {
            item.setAttribute('role', 'button');
            item.setAttribute('tabindex', '0');
            item.setAttribute('aria-label', item.querySelector('.galeria-big-four__text-horizontal')?.innerText || `Imagem ${index + 1}`);
            
            // Suporte a teclado (Enter)
            item.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.triggerExpand(item);
                }
            });
        });
    }
    
    // Método para expandir programaticamente (útil para navegação por teclado)
    triggerExpand(item) {
        if (!item) return;
        // Simula hover programático
        const originalTransition = item.style.transition;
        item.style.transition = `flex ${this.config.hoverInDelay}ms cubic-bezier(0.2, 0.9, 0.4, 1.1)`;
        item.classList.add('ef-hover-simulate');
        
        setTimeout(() => {
            item.style.transition = originalTransition;
            // Remove classe após simulação
            setTimeout(() => {
                item.classList.remove('ef-hover-simulate');
            }, this.config.hoverOutDelay);
        }, this.config.hoverInDelay);
    }
    
    // Adiciona novo item dinamicamente
    addItem(imageSrc, titleHorizontal, titleVertical) {
        const container = this.container.querySelector('.galeria-big-four__container');
        if (!container) return;
        
        const item = document.createElement('div');
        item.className = 'galeria-big-four__item';
        item.innerHTML = `
            <img class="galeria-big-four__image" src="${imageSrc}" alt="${titleHorizontal}">
            <div class="galeria-big-four__overlay"></div>
            <div class="galeria-big-four__text-horizontal">${titleHorizontal}</div>
            <div class="galeria-big-four__text-vertical">${titleVertical}</div>
        `;
        
        container.appendChild(item);
        this.items.push(item);
        
        // Reaplica eventos
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.triggerExpand(item);
        });
        
        return item;
    }
    
    // Remove todos os itens
    clearItems() {
        const container = this.container.querySelector('.galeria-big-four__container');
        if (container) {
            container.innerHTML = '';
        }
        this.items = [];
    }
    
    // Destrói o componente (remove classes e listeners)
    destroy() {
        this.items.forEach(item => {
            item.removeAttribute('role');
            item.removeAttribute('tabindex');
            // Remove listeners (opcional, mas não necessário se o elemento sumir)
        });
        this.items = [];
    }
}

// Expor globalmente se necessário
if (typeof window !== 'undefined') {
    window.GaleriaBigFour = GaleriaBigFour;
}

export default GaleriaBigFour;
