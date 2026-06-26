/**
 * formsenderJS.Plugin - Formulário de contato com validação e integração com notify-send
 * 
 * Uso:
 * new formsenderJS.Plugin('#meu-formulario', {
 *   produto: 'The Garden - New Edition',
 *   endpoint: 'https://script.google.com/macros/s/.../exec',
 *   textoBotao: 'Enviar Mensagem'
 * });
 */
(function() {
    'use strict';

    window.formsenderJS = window.formsenderJS || {};

    class FormPlugin {
        constructor(selector, options = {}) {
            // Container
            this.container = document.querySelector(selector);
            if (!this.container) {
                console.error(`[formsenderJS] Elemento "${selector}" não encontrado.`);
                throw new Error(`Elemento "${selector}" não encontrado.`);
            }

            // Opções padrão
            const defaults = {
                produto: 'The Garden - New Edition',
                endpoint: '',                    // obrigatório
                textoBotao: 'Enviar Mensagem',
                mostrarMensagem: true,
                mostrarCheckboxes: false,
                mostrarDataNasc: false,
                notificacao: null,               // função personalizada (tipo, mensagem, titulo)
                onSuccess: null,
                onError: null
            };
            this.opts = { ...defaults, ...options };

            if (!this.opts.endpoint) {
                throw new Error('[formsenderJS] A opção "endpoint" é obrigatória.');
            }

            // Gera ID único
            this.uid = 'fs-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);

            // Constrói o HTML
            this.buildForm();

            // Inicializa eventos
            this.initEvents();

            console.log('[formsenderJS] Plugin inicializado com sucesso!');
        }

        // ---------- Monta o formulário (com prefixo CSS) ----------
        buildForm() {
            const uid = this.uid;
            const opts = this.opts;
            const css = 'formsenderCSS_';

            const hiddenFields = `
                <input type="hidden" name="produto" value="${opts.produto.replace(/"/g, '&quot;')}">
                <input type="hidden" name="dataHora" id="dataHora_${uid}">
            `;

            const nascimentoHtml = opts.mostrarDataNasc ? `
                <div class="${css}field">
                    <label for="nascimento_${uid}" class="${css}label">Data de Nascimento</label>
                    <input type="date" id="nascimento_${uid}" name="nascimento" class="${css}input">
                </div>
            ` : `
                <input type="date" name="nascimento" style="display:none;">
            `;

            const checkboxesHtml = opts.mostrarCheckboxes ? `
                <div class="${css}field">
                    <label class="${css}label">Informações Adicionais</label>
                    <div class="${css}checkbox-group">
                        <label class="${css}checkbox">
                            <input type="checkbox" name="anosCtps" value="X"> 3 Anos de carteira assinada?
                        </label>
                        <label class="${css}checkbox">
                            <input type="checkbox" name="fatorsocial" value="X"> Possui cônjuge ou dependente(a)
                        </label>
                        <label class="${css}checkbox">
                            <input type="checkbox" name="imovelnome" value="X"> Possui imóvel no nome?
                        </label>
                    </div>
                </div>
            ` : '';

            const mensagemHtml = opts.mostrarMensagem ? `
                <div class="${css}field">
                    <label for="msg_${uid}" class="${css}label">Mensagem</label>
                    <textarea id="msg_${uid}" name="msg" rows="4" class="${css}input ${css}textarea"></textarea>
                </div>
            ` : '';

            const formHtml = `
                <form id="form_${uid}" class="${css}form" novalidate>
                    ${hiddenFields}
                    <div class="${css}field">
                        <label for="nome_${uid}" class="${css}label">Nome Completo *</label>
                        <input type="text" id="nome_${uid}" name="nome" required class="${css}input">
                    </div>
                    <div class="${css}row">
                        <div class="${css}col">
                            <label for="email_${uid}" class="${css}label">E-mail *</label>
                            <input type="email" id="email_${uid}" name="email" required class="${css}input">
                        </div>
                        <div class="${css}col">
                            <label for="telefone_${uid}" class="${css}label">Telefone *</label>
                            <input type="tel" id="telefone_${uid}" name="telefone" required class="${css}input">
                        </div>
                    </div>
                    ${nascimentoHtml}
                    ${checkboxesHtml}
                    ${mensagemHtml}
                    <button type="submit" id="submit_${uid}" class="${css}button">${opts.textoBotao}</button>
                    <div id="resposta_${uid}" class="${css}resposta"></div>
                </form>
            `;

            this.container.innerHTML = formHtml;

            // Referências
            this.form = document.getElementById(`form_${uid}`);
            this.submitBtn = document.getElementById(`submit_${uid}`);
            this.resposta = document.getElementById(`resposta_${uid}`);
            this.dataHoraInput = document.getElementById(`dataHora_${uid}`);
        }

        // ---------- Eventos ----------
        initEvents() {
            // Máscara de telefone
            const telInput = this.form.querySelector('input[name="telefone"]');
            if (telInput) {
                telInput.addEventListener('input', (e) => {
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length > 11) value = value.substring(0, 11);
                    if (value.length > 0) {
                        value = value.replace(/^(\d{0,2})(\d{0,5})(\d{0,4}).*/, '($1) $2-$3');
                    }
                    e.target.value = value;
                });
            }

            // Validação de data
            const dateInput = this.form.querySelector('input[type="date"]');
            if (dateInput && this.opts.mostrarDataNasc) {
                dateInput.addEventListener('change', (e) => {
                    const selected = new Date(e.target.value);
                    const today = new Date();
                    if (selected > today) {
                        this.mostrarNotificacao('error', 'Data de nascimento não pode ser no futuro', 'Erro!');
                        e.target.value = '';
                    }
                });
            }

            // Envio
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // ---------- VALIDAÇÃO MANUAL DOS CAMPOS OBRIGATÓRIOS ----------
        validarCampos() {
            // Define quais campos são obrigatórios conforme as opções
            const obrigatorios = ['nome', 'email', 'telefone'];
            
            // Se quiser tornar a data obrigatória, descomente a linha abaixo:
            // if (this.opts.mostrarDataNasc) obrigatorios.push('nascimento');

            let valido = true;
            const css = 'formsenderCSS_';

            for (const campo of obrigatorios) {
                const input = this.form.querySelector(`[name="${campo}"]`);
                if (input) {
                    // Remove espaços e verifica se está vazio
                    if (!input.value.trim()) {
                        input.classList.add(`${css}input_error`);
                        valido = false;
                    } else {
                        input.classList.remove(`${css}input_error`);
                    }
                }
            }
            return valido;
        }

        // ---------- Envio com validação ----------
        handleSubmit(e) {
            e.preventDefault();

            // 1. VALIDA OS CAMPOS
            if (!this.validarCampos()) {
                this.mostrarNotificacao('error', 'Preencha todos os campos obrigatórios.', 'Atenção!');
                return; // Não envia
            }

            // 2. DESABILITA BOTÃO
            this.submitBtn.disabled = true;
            const originalText = this.submitBtn.textContent;
            this.submitBtn.textContent = 'Enviando...';

            // 3. PREENCHE DATA/HORA
            if (this.dataHoraInput) {
                this.dataHoraInput.value = new Date().toLocaleString('pt-BR');
            }

            const formData = new FormData(this.form);

            // 4. ENVIA
            fetch(this.opts.endpoint, {
                method: 'POST',
                body: formData,
            })
                .then(response => response.text())
                .then(msg => {
                    this.resposta.innerText = msg;
                    this.resposta.className = 'formsenderCSS_resposta formsenderCSS_success';
                    this.mostrarNotificacao('success', 'Mensagem enviada com sucesso!', 'Sucesso!');
                    this.form.reset();
                    if (this.opts.onSuccess) this.opts.onSuccess(msg);
                })
                .catch(err => {
                    this.resposta.innerText = 'Erro ao enviar dados. Por favor, tente novamente.';
                    this.resposta.className = 'formsenderCSS_resposta formsenderCSS_error';
                    this.mostrarNotificacao('error', 'Erro no envio. Tente novamente.', 'Erro!');
                    console.error(err);
                    if (this.opts.onError) this.opts.onError(err);
                })
                .finally(() => {
                    this.submitBtn.disabled = false;
                    this.submitBtn.textContent = originalText;
                    setTimeout(() => {
                        this.resposta.innerText = '';
                        this.resposta.className = 'formsenderCSS_resposta';
                    }, 3000);
                });
        }

        // ---------- Sistema de notificação (integrado ao notify-send) ----------
        mostrarNotificacao(tipo, mensagem, titulo) {
            // 1. Se o usuário forneceu uma função personalizada, usa ela
            if (typeof this.opts.notificacao === 'function') {
                this.opts.notificacao(tipo, mensagem, titulo);
                return;
            }

            // 2. Se o notify-send estiver disponível, usa-o
            if (typeof window.notify_Send_notification === 'function') {
                const avatar = (tipo === 'success')
                    ? 'https://randomuser.me/api/portraits/men/32.jpg'
                    : 'fas fa-exclamation-triangle';
                window.notify_Send_notification(tipo, mensagem, titulo, avatar);
                return;
            }

            // 3. Fallback para showfeedview_notification
            if (typeof window.showfeedview_notification === 'function') {
                window.showfeedview_notification(tipo, mensagem, titulo);
                return;
            }

            // 4. Último recurso: alert simples
            alert(`${titulo}: ${mensagem}`);
        }
    }

    // Exporta a classe no namespace
    window.formsenderJS.Plugin = FormPlugin;

    //console.log(' formsenderJS.Plugin carregado com sucesso!');
    //console.log(' Uso: new formsenderJS.Plugin("#seletor", { ... });');
})();