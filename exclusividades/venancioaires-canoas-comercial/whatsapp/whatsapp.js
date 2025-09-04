// Configuração do WhatsApp
const WhatsAppConfig = {
    iconepagina: "",
    WPhone: "5551998111078", // telefone
    vProduto: "pavilão comercial na venâncio", // nome do produto 
    defaultmsg: "Gostaria de mais informações sobre o ", // msg padrão whats
    showNotification: true, // Mostrar notificação
    notificationCount: 1, // Número na notificação
    showTooltip: true, // Mostrar tooltip
    tooltipText: "Clique para nos enviar uma mensagem!" // Texto do tooltip
};

// Função para codificar a mensagem para o formato correto do WhatsApp
function formatarParaURLEncoding(texto) {
    return encodeURIComponent(texto).replace(/%0A/g, '%0A').replace(/\n/g, '%0A');
}

// Função para gerar o link do WhatsApp
function generateWhatsAppLink(phone, message) {
    const encodedMessage = formatarParaURLEncoding(message);
    return `https://wa.me/${phone}?text=${encodedMessage}`;
}

// Função principal para enviar mensagem
function wamesend() {
    const message = WhatsAppConfig.defaultmsg + WhatsAppConfig.vProduto;
    return generateWhatsAppLink(WhatsAppConfig.WPhone, message);
}

// Função para criar e adicionar o botão do WhatsApp
function createWhatsAppButton() {
    // Criar elemento de link
    const whatsappLink = document.createElement('a');
    whatsappLink.id = 'whatsappButton';
    whatsappLink.className = 'whatsapp-button';
    whatsappLink.href = wamesend();
    whatsappLink.target = '_blank';
    whatsappLink.setAttribute('aria-label', 'Contact via WhatsApp');
    
    // Adicionar ícone do WhatsApp
    const whatsappIcon = document.createElement('i');
    whatsappIcon.className = 'fab fa-whatsapp';
    whatsappLink.appendChild(whatsappIcon);
    
    // Adicionar notificação (se configurado)
    if (WhatsAppConfig.showNotification) {
        const notification = document.createElement('div');
        notification.className = 'whatsapp-notification';
        notification.textContent = WhatsAppConfig.notificationCount;
        whatsappLink.appendChild(notification);
    }
    
    // Adicionar tooltip (se configurado)
    if (WhatsAppConfig.showTooltip) {
        const tooltip = document.createElement('div');
        tooltip.className = 'whatsapp-tooltip';
        tooltip.textContent = WhatsAppConfig.tooltipText;
        whatsappLink.appendChild(tooltip);
    }
    
    // Adicionar o botão ao corpo do documento
    document.body.appendChild(whatsappLink);
}

// Função para carregar Font Awesome dinamicamente
function loadFontAwesome() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    document.head.appendChild(link);
}

// Inicializar o botão quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    loadFontAwesome();
    createWhatsAppButton();
});

// API pública para configuração
window.WhatsAppButton = {
    config: function(options) {
        Object.assign(WhatsAppConfig, options);
    },
    
    refresh: function() {
        // Remove o botão existente
        const existingButton = document.getElementById('whatsappButton');
        if (existingButton) {
            existingButton.remove();
        }
        
        // Recria o botão
        createWhatsAppButton();
    }
};
