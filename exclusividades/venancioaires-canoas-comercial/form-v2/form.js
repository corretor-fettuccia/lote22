/**
 * FormBuilder.js - Sistema de formulários dinâmicos com integração Google Sheets
 * Versão: 3.1.0
 * Data: 2025
 * 
 * DESCRIÇÃO:
 * Classe para criação dinâmica de formulários baseados em configuração XML
 * com integração direta com Google Sheets via Google Apps Script.
 * 
 * CARACTERÍSTICAS:
 * - Formulários dinâmicos baseados em XML
 * - Validação de campos e máscaras
 * - Popup automático com controle de cookies
 * - Integração com Google Sheets
 * - Data/hora automática
 * - Design responsivo
 * 
 * INSTRUÇÕES DE USO:
 * 
 * 1. INCLUSÃO DO ARQUIVO:
 *    <script src="caminho/para/FormBuilder.js"></script>
 * 
 * 2. CONFIGURAÇÃO XML:
 *    Criar arquivo XML com a estrutura dos formulários:
 *    <?xml version="1.0" encoding="UTF-8"?>
 *    <forms>
 *      <form id="modelo1" name="Formulário Principal">
 *        <field name="nome" type="text" label="Nome Completo" required="true" placeholder="Digite seu nome"/>
 *        <field name="email" type="email" label="E-mail" required="true" placeholder="seu@email.com"/>
 *        <field name="telefone" type="tel" label="Telefone" required="true" mask="phone" placeholder="(11) 99999-9999"/>
 *        <field name="produto" type="hidden" value="Produto Padrão"/>
 *      </form>
 *    </forms>
 * 
 * 3. INICIALIZAÇÃO:
 *    // Carregar configuração primeiro
 *    FormBuilder.loadConfig('caminho/para/config.xml').then(() => {
 *        // Inicializar formulário principal
 *        new FormBuilder('containerId', 'modelo1');
 *        
 *        // Inicializar popup automático (opcional)
 *        FormBuilder.initPopup('modelo1', 30000); // Aparece após 30 segundos
 *    });
 * 
 * 4. PERSONALIZAÇÃO:
 *    const options = {
 *        hiddenFields: { origem: 'site', campanha: 'verao2024' },
 *        styles: {
 *            formClass: 'minha-classe-form',
 *            inputClass: 'minha-classe-input',
 *            buttonClass: 'minha-classe-botao'
 *        }
 *    };
 *    new FormBuilder('containerId', 'modelo1', options);
 * 
 * ESTRUTURA DA PLANILHA GOOGLE SHEETS:
 * As colunas devem estar nesta ordem:
 * 1. dataHora | 2. produto | 3. nome | 4. email | 5. telefone
 * 6. renda | 7. nascimento | 8. fatorSocial | 9. imovelNome 
 * 10. fgts3anos | 11. mensagem
 * 
 * GOOGLE APPS SCRIPT:
 * O script deve estar configurado para receber os parâmetros com estes nomes exatos.
 * 
 * LICENÇA: MIT
 * AUTOR: Roberto fettuccia
 */

// Classe principal do construtor de formulários
class FormBuilder {
    constructor(containerId, modelType, options = {}) {
        this.container = document.getElementById(containerId);
        this.modelType = modelType;
        this.options = options;
        this.formId = `form-${containerId}`;
        this.responseId = `response-${containerId}`;
        this.submitButtonId = `submit-${containerId}`;
        
        if (!this.container) {
            console.error(`Container com ID ${containerId} não encontrado.`);
            return;
        }
        
        this.buildForm();
        this.setupFormEvents();
    }
    
    buildForm() {
        // Obter configuração do modelo a partir do XML
        const modelConfig = FormBuilder.getModelConfig(this.modelType);
        
        if (!modelConfig) {
            console.error(`Modelo ${this.modelType} não encontrado na configuração XML.`);
            return;
        }
        
        // Criar formulário
        const form = document.createElement('form');
        form.id = this.formId;
        form.className = this.options.styles?.formClass || 'form_dynamic-form';
        
        // Adicionar campos ocultos se especificados
        this.addHiddenFields(form);
        
        // Adicionar campos baseado no modelo
        this.addFormFields(form, modelConfig);
        
        // Adicionar container de resposta
        const responseDiv = document.createElement('div');
        responseDiv.id = this.responseId;
        responseDiv.className = 'form_response';
        
        // Adicionar elementos ao container
        this.container.appendChild(form);
        this.container.appendChild(responseDiv);
    }
    
    // Adicionar campos hidden ao formulário
    addHiddenFields(form) {
        // Adicionar campos hidden das opções
        if (this.options.hiddenFields) {
            for (const [name, value] of Object.entries(this.options.hiddenFields)) {
                const hiddenField = document.createElement('input');
                hiddenField.type = 'hidden';
                hiddenField.name = name;
                hiddenField.value = value;
                form.appendChild(hiddenField);
            }
        }
        
        // Adicionar campos hidden do XML
        const modelConfig = FormBuilder.getModelConfig(this.modelType);
        if (modelConfig && modelConfig.hiddenFields) {
            modelConfig.hiddenFields.forEach(field => {
                const hiddenField = document.createElement('input');
                hiddenField.type = 'hidden';
                hiddenField.name = field.name;
                hiddenField.value = field.value;
                form.appendChild(hiddenField);
            });
        }
    }
    
    addFormFields(form, modelConfig) {
        // Adicionar campos do modelo
        modelConfig.fields.forEach(field => {
            const fieldElement = this.createField(
                field.name, 
                field.type, 
                field.label, 
                field.required === 'true',
                field
            );
            
            if (fieldElement) {
                // Campos hidden são adicionados diretamente, outros são agrupados
                if (field.type === 'hidden') {
                    form.appendChild(fieldElement);
                } else {
                    form.appendChild(fieldElement);
                }
            }
        });
        
        // Adicionar botão de envio
        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.id = this.submitButtonId;
        submitButton.textContent = 'Enviar';
        submitButton.className = this.options.styles?.buttonClass || 'form_submit-btn';
        form.appendChild(submitButton);
    }
    
    createField(name, type, label, required, fieldConfig) {
        // Para campos hidden, criar input diretamente
        if (type === 'hidden') {
            const inputEl = document.createElement('input');
            inputEl.type = 'hidden';
            inputEl.name = name;
            inputEl.value = fieldConfig.value || '';
            return inputEl;
        }
        
        const formGroup = document.createElement('div');
        formGroup.className = 'form_form-group';
        
        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        labelEl.htmlFor = name;
        labelEl.className = this.options.styles?.labelClass || 'form_form-label';
        
        let inputEl;
        if (type === 'textarea') {
            inputEl = document.createElement('textarea');
            inputEl.rows = 4;
            inputEl.className = this.options.styles?.textareaClass || 'form_form-textarea';
        } else {
            inputEl = document.createElement('input');
            inputEl.type = type;
            inputEl.className = this.options.styles?.inputClass || 'form_form-input';
        }
        
        inputEl.id = name;
        inputEl.name = name;
        inputEl.required = required;
        
        // Definir valor padrão se especificado
        if (fieldConfig.value) {
            inputEl.value = fieldConfig.value;
        }
        
        // Aplicar máscara se especificado
        if (fieldConfig.mask === 'phone') {
            this.applyPhoneMask(inputEl);
        }
        
        // Adicionar atributos adicionais
        if (fieldConfig.placeholder) {
            inputEl.placeholder = fieldConfig.placeholder;
        }
        
        if (fieldConfig.min) {
            inputEl.min = fieldConfig.min;
        }
        
        if (fieldConfig.max) {
            inputEl.max = fieldConfig.max;
        }
        
        if (fieldConfig.step) {
            inputEl.step = fieldConfig.step;
        }
        
        formGroup.appendChild(labelEl);
        formGroup.appendChild(inputEl);
        
        return formGroup;
    }
    
    applyPhoneMask(input) {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.length > 11) {
                value = value.slice(0, 11);
            }
            
            if (value.length > 0) {
                value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
                
                if (value.length > 10) {
                    value = value.replace(/(\d{5})(\d)/, '$1-$2');
                } else if (value.length > 6) {
                    value = value.replace(/(\d{4})(\d)/, '$1-$2');
                }
            }
            
            e.target.value = value;
        });
    }
    
    setupFormEvents() {
        const form = document.getElementById(this.formId);
        const resposta = document.getElementById(this.responseId);
        const submitButton = document.getElementById(this.submitButtonId);
        
        if (!form || !resposta || !submitButton) return;
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Desabilita o botão e muda o texto
            submitButton.disabled = true;
            submitButton.textContent = "Enviando...";
            
            // Gera data/hora atual no formato "dd/mm/aa hh:mm:ss"
            const agora = new Date();
            const dataHoraFormatada = agora.toLocaleString("pt-BR", {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }).replace(',', '');
            
            // Coletar todos os dados do formulário
            const formData = new FormData(form);
            
            // Adiciona a data/hora formatada aos dados do formulário
            // Usando o nome exato que o Google Script espera: 'dataHora'
            formData.append('dataHora', dataHoraFormatada);
            
            // Para debug: verificar todos os campos que estão sendo enviados
            console.log("Campos a serem enviados:");
            for (let pair of formData.entries()) {
                console.log(pair[0] + ': ' + pair[1]);
            }
            
            // URL de execução
            const urlEXEC = "https://script.google.com/macros/s/AKfycbzszUr6ZdX4UPgZPe_HQPQ-gHpkVrV02ic1NYttpFlhcuXdMy0-HnzZyVQDAfmXxsnv/exec";
            
            fetch(urlEXEC, {
                method: "POST",
                body: formData
            })
            .then(response => response.text())
            .then(msg => {
                resposta.innerText = msg;
                resposta.className = "response success";
                form.reset();
                
                // Reabilita o botão e restaura o texto original
                submitButton.disabled = false;
                submitButton.textContent = "Enviar";
                
                setTimeout(() => {
                    resposta.innerText = "";
                    resposta.className = "response";
                }, 5000);
            })
            .catch(err => {
                resposta.innerText = "Erro ao enviar dados. Por favor, tente novamente.";
                resposta.className = "response error";
                console.error(err);
                
                // Reabilita o botão em caso de erro
                submitButton.disabled = false;
                submitButton.textContent = "Enviar";
            });
        });
    }
    
    // Carregar configuração do XML
    static async loadConfig(xmlPath) {
        try {
            const response = await fetch(xmlPath);
            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "text/xml");
            
            // Armazenar configuração globalmente
            FormBuilder.xmlConfig = xmlDoc;
            return true;
        } catch (error) {
            console.error('Erro ao carregar configuração XML:', error);
            return false;
        }
    }
    
    // Obter configuração de um modelo específico
    static getModelConfig(modelId) {
        if (!FormBuilder.xmlConfig) {
            console.error('Configuração XML não carregada.');
            return null;
        }
        
        const formElement = FormBuilder.xmlConfig.querySelector(`form[id="${modelId}"]`);
        
        if (!formElement) {
            return null;
        }
        
        const fields = [];
        const hiddenFields = [];
        const fieldElements = formElement.querySelectorAll('field');
        
        fieldElements.forEach(fieldEl => {
            const fieldType = fieldEl.getAttribute('type');
            const fieldData = {
                name: fieldEl.getAttribute('name'),
                type: fieldType,
                label: fieldEl.getAttribute('label'),
                required: fieldEl.getAttribute('required'),
                value: fieldEl.getAttribute('value'),
                mask: fieldEl.getAttribute('mask'),
                placeholder: fieldEl.getAttribute('placeholder'),
                min: fieldEl.getAttribute('min'),
                max: fieldEl.getAttribute('max'),
                step: fieldEl.getAttribute('step')
            };
            
            // Separar campos hidden dos campos visíveis
            if (fieldType === 'hidden') {
                hiddenFields.push(fieldData);
            } else {
                fields.push(fieldData);
            }
        });
        
        return {
            id: formElement.getAttribute('id'),
            name: formElement.getAttribute('name'),
            fields: fields,
            hiddenFields: hiddenFields
        };
    }
    
    // Método estático para inicializar o popup
    static initPopup(modelType, delay = 30000) {
        // Verificar cookie antes de abrir
        if (this.getCookie('formPopupShown')) {
            return;
        }
        
        setTimeout(() => {
            this.openPopup(modelType);
            // Definir cookie para 1 dia
            this.setCookie('formPopupShown', 'true', 1);
        }, delay);
    }
    
    // Abrir popup
    static openPopup(modelType) {
        const popup = document.getElementById('formPopup');
        const container = document.getElementById('popupFormContainer');
        
        if (!popup || !container) return;
        
        // Limpar container e criar novo formulário
        container.innerHTML = '';
        new FormBuilder('popupFormContainer', modelType);
        
        // Mostrar popup
        popup.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    // Fechar popup
    static closePopup() {
        const popup = document.getElementById('formPopup');
        if (popup) {
            popup.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }
    
    // Gerenciamento de cookies
    static setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = "expires=" + date.toUTCString();
        document.cookie = name + "=" + value + ";" + expires + ";path=/";
    }
    
    static getCookie(name) {
        const cookieName = name + "=";
        const decodedCookie = decodeURIComponent(document.cookie);
        const cookieArray = decodedCookie.split(';');
        
        for(let i = 0; i < cookieArray.length; i++) {
            let cookie = cookieArray[i];
            while (cookie.charAt(0) === ' ') {
                cookie = cookie.substring(1);
            }
            if (cookie.indexOf(cookieName) === 0) {
                return cookie.substring(cookieName.length, cookie.length);
            }
        }
        return "";
    }
}
