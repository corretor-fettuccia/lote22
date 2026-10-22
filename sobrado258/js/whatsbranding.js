/**
 * WhatsBranding Plugin
 * Botão flutuante do WhatsApp com pulsar reforçado, alternância ícone/foto, tooltip e badge de mensagem não lida.
 */
(function() {
  'use strict';

  class WhatsAppBranding {
    constructor(configElement) {
      if (!configElement) return;
      this.config = {
        phone: configElement.dataset.whatsbrandingPhone || '',
        enterprise: configElement.dataset.whatsbrandingEnterprise || 'este empreendimento',
        contactPhoto: configElement.dataset.whatsbrandingContactPhoto || '',
        unreadCount: configElement.dataset.whatsbrandingUnread || '1'
      };
      this.button = null;
      this.badge = null;
      this.init();
    }

    init() {
      if (!this.config.phone) {
        console.warn('[WhatsBranding] Número de telefone não informado (data-whatsbranding-phone)');
        return;
      }
      this.createButton();
      this.createBadge();
      this.attachEvent();
    }

    createButton() {
      this.button = document.createElement('div');
      this.button.className = 'whatsbranding-button pulse';
      
      if (this.config.contactPhoto) {
        this.button.style.setProperty('--whats-photo', `url('${this.config.contactPhoto}')`);
      }
      
      document.body.appendChild(this.button);
    }

    createBadge() {
      const count = parseInt(this.config.unreadCount, 10);
      if (isNaN(count) || count <= 0) return;
      
      this.badge = document.createElement('span');
      this.badge.className = 'whatsbranding-badge';
      this.badge.textContent = count > 99 ? '99+' : count;
      this.button.appendChild(this.badge);
    }

    attachEvent() {
      this.button.addEventListener('click', (e) => {
        e.preventDefault();
        this.openWhatsApp();
      });
    }

    openWhatsApp() {
      const message = `Olá, tenho interesse no empreendimento ${this.config.enterprise}. Pode me passar mais informações?`;
      const encodedMsg = encodeURIComponent(message);
      const rawPhone = this.config.phone.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/${rawPhone}?text=${encodedMsg}`;
      window.open(whatsappUrl, '_blank');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const pluginDiv = document.querySelector('.whatsbranding__plugin');
    if (pluginDiv) {
      new WhatsAppBranding(pluginDiv);
    } else {
      console.warn('[WhatsBranding] Nenhum elemento com classe "whatsbranding__plugin" encontrado.');
    }
  });
})();