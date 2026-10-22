/**
 * ================================================================
 * notify-send.js v1.2.0 - Sistema de Notificações e Alertas
 * ================================================================
 */

(function() {
    'use strict';
    
    // ============================================================
    // CONFIGURAÇÕES
    // ============================================================
    
    const CONFIG = {
        notificationDuration: 5000,
        alertDefaultAvatar: 'fa-info-circle',
        alertTypes: {
            success: { icon: 'fa-check-circle', color: '#27ae60', title: 'Sucesso' },
            error: { icon: 'fa-times-circle', color: '#e74c3c', title: 'Erro' },
            warning: { icon: 'fa-exclamation-triangle', color: '#f39c12', title: 'Atenção' },
            info: { icon: 'fa-info-circle', color: '#3498db', title: 'Informação' },
            question: { icon: 'fa-question-circle', color: '#9b59b6', title: 'Pergunta' }
        },
        defaultMessages: {
            success: { title: 'Sucesso!', message: 'Operação realizada com sucesso.' },
            error: { title: 'Erro!', message: 'Ocorreu um erro. Tente novamente.' },
            warning: { title: 'Atenção!', message: 'Verifique as informações antes de continuar.' },
            info: { title: 'Informação', message: 'Aguarde enquanto processamos sua solicitação.' }
        },
        icons: {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        },
        defaultAvatar: 'fa-bell'
    };
    
    // ============================================================
    // CRIAÇÃO DOS CONTAINERS
    // ============================================================
    
    function createContainers() {
        // Container de Notificações
        if (!document.getElementById('ns-notification-container')) {
            const container = document.createElement('div');
            container.id = 'ns-notification-container';
            container.className = 'ns-notification-container';
            document.body.appendChild(container);
        }
        
        // Modal Overlay
        if (!document.getElementById('ns-modal-overlay')) {
            const modalOverlay = document.createElement('div');
            modalOverlay.id = 'ns-modal-overlay';
            modalOverlay.className = 'ns-modal-overlay';
            modalOverlay.innerHTML = `
                <div class="ns-modal">
                    <div class="ns-modal-avatar-container" style="text-align: center; margin-bottom: 15px; display: none;">
                        <div class="ns-modal-avatar" style="width: 80px; height: 80px; border-radius: 50%; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; overflow: hidden;">
                            <i class="fas fa-info-circle" style="font-size: 48px; color: white;"></i>
                        </div>
                    </div>
                    <div class="ns-modal-icon" style="text-align: center; font-size: 50px; margin-bottom: 20px;">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <h2 class="ns-modal-title">Título</h2>
                    <p class="ns-modal-message">Mensagem</p>
                    <div class="ns-modal-buttons">
                        <button class="ns-modal-button confirm" style="background: #3498db; padding: 12px 28px; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; color: white;">OK</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modalOverlay);
        }
        
        // Toast
        if (!document.getElementById('ns-toast')) {
            const toast = document.createElement('div');
            toast.id = 'ns-toast';
            toast.className = 'ns-toast';
            document.body.appendChild(toast);
        }
    }
    
    // ============================================================
    // FUNÇÃO PRINCIPAL: ALERT COM AVATAR
    // ============================================================
    
    window.notify_Send_alert = function(message, type = 'info', title = '', avatar = '') {
        return new Promise((resolve) => {
            const modalOverlay = document.getElementById('ns-modal-overlay');
            if (!modalOverlay) {
                console.error('notify_Send: Modal overlay não encontrado');
                resolve();
                return;
            }
            
            const modal = modalOverlay.querySelector('.ns-modal');
            const modalTitle = modal.querySelector('.ns-modal-title');
            const modalMessage = modal.querySelector('.ns-modal-message');
            const confirmBtn = modal.querySelector('.ns-modal-button.confirm');
            const modalIcon = modal.querySelector('.ns-modal-icon');
            const modalIconI = modal.querySelector('.ns-modal-icon i');
            const avatarContainer = modal.querySelector('.ns-modal-avatar-container');
            const avatarDiv = modal.querySelector('.ns-modal-avatar');
            
            // Configurar tipo
            const typeConfig = CONFIG.alertTypes[type] || CONFIG.alertTypes.info;
            const finalTitle = title || typeConfig.title;
            
            // Atualizar conteúdo
            modalTitle.textContent = finalTitle;
            modalMessage.textContent = message || 'Mensagem';
            confirmBtn.textContent = 'OK';
            confirmBtn.style.background = typeConfig.color;
            
            // Configurar avatar
            if (avatar) {
                // Mostrar container de avatar, esconder ícone padrão
                avatarContainer.style.display = 'block';
                modalIcon.style.display = 'none';
                
                // Configurar avatar
                if (avatar.match(/^(https?:\/\/|data:image|\/)/i) || avatar.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
                    // É URL de imagem
                    avatarDiv.innerHTML = `<img src="${avatar}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;">`;
                } else if (avatar.startsWith('fa-')) {
                    // É ícone Font Awesome
                    avatarDiv.innerHTML = `<i class="fas ${avatar}" style="font-size: 48px; color: white;"></i>`;
                } else {
                    // Fallback
                    avatarDiv.innerHTML = `<i class="fas ${CONFIG.alertDefaultAvatar}" style="font-size: 48px; color: white;"></i>`;
                }
            } else {
                // Sem avatar, mostrar ícone padrão do tipo
                avatarContainer.style.display = 'none';
                modalIcon.style.display = 'block';
                if (modalIconI) {
                    modalIconI.className = `fas ${typeConfig.icon}`;
                    modalIconI.style.color = typeConfig.color;
                }
            }
            
            // Função para fechar
            function closeModal() {
                modalOverlay.classList.remove('show');
                resolve();
            }
            
            // Remover listener antigo e adicionar novo
            const newConfirmBtn = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
            
            newConfirmBtn.addEventListener('click', closeModal);
            
            // Fechar ao clicar fora
            modalOverlay.onclick = function(e) {
                if (e.target === modalOverlay) {
                    closeModal();
                }
            };
            
            // Mostrar modal
            modalOverlay.classList.add('show');
        });
    };
    
    // ============================================================
    // SOBRESCREVER ALERT NATIVO
    // ============================================================
    
    let alertOverridden = false;
    let originalAlert = null;
    
    window.notify_Send_override_alert = function(enable = true, defaultAvatar = '') {
        if (enable && !alertOverridden) {
            // Salvar referência do alert original
            originalAlert = window.alert;
            
            // Substituir
            window.alert = function(message) {
                window.notify_Send_alert(message, 'info', 'Aviso', defaultAvatar);
            };
            alertOverridden = true;
            console.log('✅ Alert nativo substituído pelo notify_Send_alert');
        } else if (!enable && alertOverridden) {
            // Restaurar alert original
            window.alert = originalAlert;
            alertOverridden = false;
            console.log('✅ Alert nativo restaurado');
        }
    };
    
    // ============================================================
    // FUNÇÕES DE NOTIFICAÇÃO
    // ============================================================
    
    function getAvatarHTML(avatar) {
        if (!avatar) {
            return `<div class="ns-notification-avatar"><i class="fas ${CONFIG.defaultAvatar}"></i></div>`;
        }
        
        if (avatar.match(/^(https?:\/\/|data:image|\/)/i) || avatar.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
            return `<div class="ns-notification-avatar"><img src="${avatar}" alt="Avatar" onerror="this.parentElement.innerHTML='<i class=\'fas fa-user-circle\'></i>'"></div>`;
        }
        
        if (avatar.startsWith('fa-')) {
            return `<div class="ns-notification-avatar"><i class="fas ${avatar}"></i></div>`;
        }
        
        return `<div class="ns-notification-avatar"><i class="fas fa-user-circle"></i></div>`;
    }
    
    function closeNotification(notificationElement) {
        if (!notificationElement || !notificationElement.parentElement) return;
        notificationElement.classList.remove('show');
        notificationElement.classList.add('hide');
        setTimeout(() => {
            if (notificationElement.parentElement) {
                notificationElement.parentElement.removeChild(notificationElement);
            }
        }, 400);
    }
    
    window.notify_Send_notification = function(type, message = '', title = '', avatar = '') {
        const validTypes = ['success', 'error', 'warning', 'info'];
        if (!validTypes.includes(type)) {
            console.warn(`notify_Send: Tipo inválido "${type}". Usando "info".`);
            type = 'info';
        }
        
        const finalTitle = title || CONFIG.defaultMessages[type].title;
        const finalMessage = message || CONFIG.defaultMessages[type].message;
        
        const notification = document.createElement('div');
        notification.className = `ns-notification ${type}`;
        
        const avatarHTML = getAvatarHTML(avatar);
        const iconHTML = !avatar ? `<i class="fas ${CONFIG.icons[type]} ns-notification-icon"></i>` : '';
        
        notification.innerHTML = `
            ${avatarHTML}
            ${iconHTML}
            <div class="ns-notification-content">
                <div class="ns-notification-title">${escapeHtml(finalTitle)}</div>
                <div class="ns-notification-message">${escapeHtml(finalMessage)}</div>
            </div>
            <button class="ns-notification-close" onclick="notify_Send_close_notification(this.parentElement)">
                <i class="fas fa-times"></i>
            </button>
            <div class="ns-notification-progress"></div>
        `;
        
        const container = document.getElementById('ns-notification-container');
        if (container) {
            container.appendChild(notification);
        } else {
            console.error('notify_Send: Container de notificações não encontrado');
            return;
        }
        
        setTimeout(() => {
            notification.classList.add('show');
            const progressBar = notification.querySelector('.ns-notification-progress');
            if (progressBar) {
                setTimeout(() => {
                    progressBar.style.transform = 'scaleX(0)';
                }, 50);
            }
        }, 10);
        
        const timeoutId = setTimeout(() => {
            if (notification.parentElement) {
                closeNotification(notification);
            }
        }, CONFIG.notificationDuration);
        
        notification.dataset.timeoutId = timeoutId;
    };
    
    window.notify_Send_close_notification = function(notificationElement) {
        if (notificationElement && notificationElement.dataset.timeoutId) {
            clearTimeout(parseInt(notificationElement.dataset.timeoutId));
        }
        closeNotification(notificationElement);
    };
    
    window.notify_Send_close_all = function() {
        const container = document.getElementById('ns-notification-container');
        if (container) {
            const notifications = container.querySelectorAll('.ns-notification');
            notifications.forEach(notification => {
                closeNotification(notification);
            });
        }
    };
    
    window.notify_Send_toast = function(message, duration = 3000) {
        const toast = document.getElementById('ns-toast');
        if (!toast) {
            console.error('notify_Send: Toast element não encontrado');
            return;
        }
        toast.textContent = message || 'Notificação';
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    };
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Inicialização
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createContainers);
    } else {
        createContainers();
    }
    
    console.log('🎉 notify-send.js carregado com sucesso!');
    console.log('📌 Funções disponíveis:');
    console.log('   - notify_Send_alert()');
    console.log('   - notify_Send_notification()');
    console.log('   - notify_Send_modal()');
    console.log('   - notify_Send_toast()');
    console.log('   - notify_Send_override_alert()');
    
})();