// Função para carregar e processar o XML
function loadXMLData() {
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState === 4) {
            if (this.status === 200) {
                console.log("XML carregado com sucesso. Status:", this.status);
                
                try {
                    // Tentar parsear o XML manualmente
                    let xmlDoc;
                    if (window.DOMParser) {
                        const parser = new DOMParser();
                        xmlDoc = parser.parseFromString(this.responseText, "text/xml");
                        
                        // Verificar se há erros de parsing
                        const parseError = xmlDoc.getElementsByTagName("parsererror");
                        if (parseError.length > 0) {
                            console.error("Erro no parsing do XML:", parseError[0].textContent);
                            console.log("Conteúdo do XML:", this.responseText);
                            return;
                        }
                        
                        console.log("XML parseado com sucesso");
                        populatePageFromXML(xmlDoc);
                    } else {
                        // Fallback para Internet Explorer
                        console.error("DOMParser não suportado neste navegador");
                        xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
                        xmlDoc.async = false;
                        xmlDoc.loadXML(this.responseText);
                        populatePageFromXML(xmlDoc);
                    }
                } catch (error) {
                    console.error("Erro ao processar XML:", error);
                    console.log("Conteúdo do XML:", this.responseText);
                }
            } else {
                console.error("Erro ao carregar XML. Status:", this.status);
                console.log("Tentativa de carregar: dados.xml");
            }
        }
    };
    xhttp.onerror = function() {
        console.error("Erro de rede ao tentar carregar o XML.");
    };
    xhttp.open("GET", "dados.xml", true);
    xhttp.send();
}


// Continuação do código (a função populatePageFromXML e outras permanecem as mesmas)
// Função para popular a página com dados do XML
function populatePageFromXML(xml) {
    if (!xml || !xml.documentElement) {
        console.error("XML inválido ou vazio.");
        return;
    }
    
    // Configurações gerais
    const titulo = getNodeValue(xml, "titulo", "config");
    if (titulo) document.title = titulo;
    
    // Configuração de cores do tema
    const primaryColor = getNodeValue(xml, "primary", "theme");
    const secondaryColor = getNodeValue(xml, "secondary", "theme");
    const accentColor = getNodeValue(xml, "accent", "theme");
    
    if (primaryColor && secondaryColor && accentColor) {
        document.documentElement.style.setProperty('--color-primary', primaryColor);
        document.documentElement.style.setProperty('--color-secondary', secondaryColor);
        document.documentElement.style.setProperty('--color-accent', accentColor);
    }
    
    // Navegação
    const logo = getNodeValue(xml, "logo", "navigation");
    if (logo) document.getElementById("logo").textContent = logo;
    
    const navLinksContainer = document.getElementById("nav-links");
    if (navLinksContainer) {
        navLinksContainer.innerHTML = '';
        
        const links = xml.getElementsByTagName("link");
        for (let i = 0; i < links.length; i++) {
            const linkTexto = getNodeValue(links[i], "texto");
            const linkUrl = getNodeValue(links[i], "url");
            
            if (linkTexto && linkUrl) {
                const link = document.createElement("a");
                link.href = linkUrl;
                link.textContent = linkTexto;
                link.className = "hover:text-accent transition";
                navLinksContainer.appendChild(link);
            }
        }
    }
    
    // Hero Section
    const heroImagem = getNodeValue(xml, "imagem", "hero");
    if (heroImagem) {
        const heroSection = document.getElementById("hero");
        if (heroSection) {
            heroSection.style.backgroundImage = `url('${heroImagem}')`;
        }
    }
    
    const heroTitulo = getNodeValue(xml, "titulo", "hero");
    if (heroTitulo) {
        const heroTitleElement = document.getElementById("hero-title");
        if (heroTitleElement) {
            heroTitleElement.innerHTML = formatTextWithHighlight(heroTitulo);
        }
    }
    
    const heroSubtitulo = getNodeValue(xml, "subtitulo", "hero");
    if (heroSubtitulo) {
        const heroSubtitleElement = document.getElementById("hero-subtitle");
        if (heroSubtitleElement) {
            heroSubtitleElement.textContent = heroSubtitulo;
        }
    }
    
    const botaoTexto = getNodeValue(xml, "texto", "botao");
    const botaoUrl = getNodeValue(xml, "url", "botao");
    const heroButton = document.getElementById("hero-button");
    if (heroButton) {
        if (botaoTexto) {
            heroButton.innerHTML = botaoTexto + ' <i data-feather="arrow-right" class="ml-2"></i>';
        }
        if (botaoUrl) {
            heroButton.href = botaoUrl;
        }
    }
    
    // Continuação do código para as outras seções (property, features, location, etc.)
    // Property Section
    const propertyTitulo = getNodeValue(xml, "titulo", "property");
    if (propertyTitulo) {
        const propertyTitleElement = document.getElementById("property-title");
        if (propertyTitleElement) {
            propertyTitleElement.textContent = propertyTitulo;
        }
    }
    
    const propertyImagem = getNodeValue(xml, "imagem", "property");
    if (propertyImagem) {
        const propertyImageElement = document.getElementById("property-image");
        if (propertyImageElement) {
            propertyImageElement.src = propertyImagem;
        }
    }
    
    const propertySubtitulo = getNodeValue(xml, "subtitulo", "property");
    if (propertySubtitulo) {
        const propertySubtitleElement = document.getElementById("property-subtitle");
        if (propertySubtitleElement) {
            propertySubtitleElement.innerHTML = formatTextWithHighlight(propertySubtitulo);
        }
    }
    
    // Detalhes do imóvel
    const detailsContainer = document.getElementById("property-details");
    if (detailsContainer) {
        detailsContainer.innerHTML = '';
        
        const detalhes = xml.getElementsByTagName("detalhe");
        for (let i = 0; i < detalhes.length; i++) {
            const valor = getNodeValue(detalhes[i], "valor");
            const descricao = getNodeValue(detalhes[i], "descricao");
            
            if (valor && descricao) {
                const detail = document.createElement("div");
                detail.className = "bg-secondary p-4 rounded-lg";
                
                const value = document.createElement("div");
                value.className = "text-primary font-bold text-lg";
                value.innerHTML = `<span class="text-accent">${valor}</span>`;
                
                const description = document.createElement("div");
                description.className = "text-gray-600";
                description.textContent = descricao;
                
                value.appendChild(description);
                detail.appendChild(value);
                detailsContainer.appendChild(detail);
            }
        }
    }
    
    const propertyDescricao = getNodeValue(xml, "descricao", "property");
    if (propertyDescricao) {
        const propertyDescriptionElement = document.getElementById("property-description");
        if (propertyDescriptionElement) {
            propertyDescriptionElement.textContent = propertyDescricao;
        }
    }
    
    // Características do imóvel
    const featuresContainer = document.getElementById("property-features");
    if (featuresContainer) {
        featuresContainer.innerHTML = '';
        
        const caracteristicas = xml.getElementsByTagName("caracteristica");
        for (let i = 0; i < caracteristicas.length; i++) {
            const featureText = caracteristicas[i].textContent;
            if (featureText) {
                const feature = document.createElement("li");
                feature.className = "flex items-center";
                feature.innerHTML = `<i data-feather="check" class="text-accent mr-2"></i> ${featureText}`;
                featuresContainer.appendChild(feature);
            }
        }
    }
    
    // Features Section
    const featuresTitulo = getNodeValue(xml, "titulo", "features");
    if (featuresTitulo) {
        const featuresTitleElement = document.getElementById("features-title");
        if (featuresTitleElement) {
            featuresTitleElement.textContent = featuresTitulo;
        }
    }
    
    const featuresItemsContainer = document.getElementById("features-items");
    if (featuresItemsContainer) {
        featuresItemsContainer.innerHTML = '';
        
        const featureItems = xml.getElementsByTagName("item");
        for (let i = 0; i < featureItems.length; i++) {
            const icone = getNodeValue(featureItems[i], "icone");
            const titulo = getNodeValue(featureItems[i], "titulo");
            const descricao = getNodeValue(featureItems[i], "descricao");
            
            if (icone && titulo && descricao) {
                const item = document.createElement("div");
                item.className = "bg-white p-8 rounded-lg property-card";
                item.setAttribute("data-aos", "zoom-in");
                if (i === 1) item.setAttribute("data-aos-delay", "100");
                if (i === 2) item.setAttribute("data-aos-delay", "200");
                
                const icon = document.createElement("div");
                icon.className = "text-accent mb-4";
                icon.innerHTML = `<i data-feather="${icone}" class="w-10 h-10"></i>`;
                
                const title = document.createElement("h3");
                title.className = "text-xl font-bold text-primary mb-3";
                title.textContent = titulo;
                
                const description = document.createElement("p");
                description.className = "text-gray-600";
                description.textContent = descricao;
                
                item.appendChild(icon);
                item.appendChild(title);
                item.appendChild(description);
                featuresItemsContainer.appendChild(item);
            }
        }
    }
    
    // Location Section
    const locationTitulo = getNodeValue(xml, "titulo", "location");
    if (locationTitulo) {
        const locationTitleElement = document.getElementById("location-title");
        if (locationTitleElement) {
            locationTitleElement.textContent = locationTitulo;
        }
    }
    
    const locationSubtitulo = getNodeValue(xml, "subtitulo", "location");
    if (locationSubtitulo) {
        const locationSubtitleElement = document.getElementById("location-subtitle");
        if (locationSubtitleElement) {
            locationSubtitleElement.innerHTML = formatTextWithHighlight(locationSubtitulo);
        }
    }
    
    const locationEndereco = getNodeValue(xml, "endereco", "location");
    if (locationEndereco) {
        const locationAddressElement = document.getElementById("location-address");
        if (locationAddressElement) {
            locationAddressElement.textContent = locationEndereco;
        }
    }
    
    const locationMapa = getNodeValue(xml, "mapa", "location");
    if (locationMapa) {
        const locationMapElement = document.getElementById("location-map");
        if (locationMapElement) {
            locationMapElement.src = locationMapa;
        }
    }
    
    // Entorno
    const surroundingsContainer = document.getElementById("location-surroundings");
    if (surroundingsContainer) {
        surroundingsContainer.innerHTML = '';
        
        const entorno = xml.getElementsByTagName("entorno")[0];
        if (entorno) {
            const entornoItems = entorno.getElementsByTagName("item");
            for (let i = 0; i < entornoItems.length; i++) {
                const itemText = entornoItems[i].textContent;
                if (itemText) {
                    const item = document.createElement("li");
                    item.className = "flex items-start";
                    item.innerHTML = `<i data-feather="map" class="text-accent mr-2 mt-1"></i> ${itemText}`;
                    surroundingsContainer.appendChild(item);
                }
            }
        }
    }
    
    // Acessos
    const accessContainer = document.getElementById("location-access");
    if (accessContainer) {
        accessContainer.innerHTML = '';
        
        const acessos = xml.getElementsByTagName("acessos")[0];
        if (acessos) {
            const accessItems = acessos.getElementsByTagName("item");
            for (let i = 0; i < accessItems.length; i++) {
                const itemText = accessItems[i].textContent;
                if (itemText) {
                    const item = document.createElement("li");
                    item.className = "flex items-start";
                    item.innerHTML = `<i data-feather="compass" class="text-accent mr-2 mt-1"></i> ${itemText}`;
                    accessContainer.appendChild(item);
                }
            }
        }
    }
    
    // Gallery Section
    const galleryTitulo = getNodeValue(xml, "titulo", "gallery");
    if (galleryTitulo) {
        const galleryTitleElement = document.getElementById("gallery-title");
        if (galleryTitleElement) {
            galleryTitleElement.textContent = galleryTitulo;
        }
    }
    
    const galleryContainer = document.getElementById("gallery-items");
    if (galleryContainer) {
        galleryContainer.innerHTML = '';
        
        const imagens = xml.getElementsByTagName("imagens")[0];
        if (imagens) {
            const galleryImagens = imagens.getElementsByTagName("imagem");
            for (let i = 0; i < galleryImagens.length; i++) {
                const imageSrc = galleryImagens[i].textContent;
                if (imageSrc) {
                    const item = document.createElement("div");
                    item.className = "gallery-item rounded-lg overflow-hidden shadow-lg";
                    item.setAttribute("data-aos", "zoom-in");
                    
                    if (i === 1 || i === 4) item.setAttribute("data-aos-delay", "100");
                    if (i === 2 || i === 5) item.setAttribute("data-aos-delay", "200");
                    
                    const img = document.createElement("img");
                    img.src = imageSrc;
                    img.alt = `Imagem ${i+1} da galeria`;
                    img.className = "w-full h-64 object-cover";
                    
                    item.appendChild(img);
                    galleryContainer.appendChild(item);
                }
            }
        }
    }
    
    // Contact Section
    const contactTitulo = getNodeValue(xml, "titulo", "contact");
    if (contactTitulo) {
        const contactTitleElement = document.getElementById("contact-title");
        if (contactTitleElement) {
            contactTitleElement.textContent = contactTitulo;
        }
    }
    
    // Footer
    const footerEmpresaNome = getNodeValue(xml, "nome", "empresa");
    if (footerEmpresaNome) {
        const footerCompanyNameElement = document.getElementById("footer-company-name");
        if (footerCompanyNameElement) {
            footerCompanyNameElement.textContent = footerEmpresaNome;
        }
    }
    
    const footerEmpresaDesc = getNodeValue(xml, "descricao", "empresa");
    if (footerEmpresaDesc) {
        const footerCompanyDescElement = document.getElementById("footer-company-desc");
        if (footerCompanyDescElement) {
            footerCompanyDescElement.textContent = footerEmpresaDesc;
        }
    }
    
    const footerTelefone = getNodeValue(xml, "telefone", "contato");
    if (footerTelefone) {
        const footerPhoneElement = document.getElementById("footer-phone");
        if (footerPhoneElement) {
            footerPhoneElement.innerHTML = `<i data-feather="phone" class="mr-2"></i> ${footerTelefone}`;
        }
    }
    
    const footerEmail = getNodeValue(xml, "email", "contato");
    if (footerEmail) {
        const footerEmailElement = document.getElementById("footer-email");
        if (footerEmailElement) {
            footerEmailElement.innerHTML = `<i data-feather="mail" class="mr-2"></i> ${footerEmail}`;
        }
    }
    
    const footerEndereco = getNodeValue(xml, "endereco", "contato");
    if (footerEndereco) {
        const footerAddressElement = document.getElementById("footer-address");
        if (footerAddressElement) {
            footerAddressElement.innerHTML = `<i data-feather="map-pin" class="mr-2"></i> ${footerEndereco}`;
        }
    }
    
    const footerFacebook = getNodeValue(xml, "facebook", "social");
    if (footerFacebook) {
        const footerFacebookElement = document.getElementById("footer-facebook");
        if (footerFacebookElement) {
            footerFacebookElement.href = footerFacebook;
        }
    }
    
    const footerInstagram = getNodeValue(xml, "instagram", "social");
    if (footerInstagram) {
        const footerInstagramElement = document.getElementById("footer-instagram");
        if (footerInstagramElement) {
            footerInstagramElement.href = footerInstagram;
        }
    }
    
    const footerLinkedin = getNodeValue(xml, "linkedin", "social");
    if (footerLinkedin) {
        const footerLinkedinElement = document.getElementById("footer-linkedin");
        if (footerLinkedinElement) {
            footerLinkedinElement.href = footerLinkedin;
        }
    }
    
    const footerYoutube = getNodeValue(xml, "youtube", "social");
    if (footerYoutube) {
        const footerYoutubeElement = document.getElementById("footer-youtube");
        if (footerYoutubeElement) {
            footerYoutubeElement.href = footerYoutube;
        }
    }
    
    const footerCopyright = getNodeValue(xml, "copyright", "footer");
    if (footerCopyright) {
        const footerCopyrightElement = document.getElementById("footer-copyright");
        if (footerCopyrightElement) {
            footerCopyrightElement.textContent = footerCopyright;
        }
    }
    
    // Atualizar ícones
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
    
    // Inicializar animações
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true
        });
    }
}

// Função auxiliar para obter valor de um nó
function getNodeValue(xml, tagName, parentTag = null) {
    try {
        if (parentTag) {
            const parent = xml.getElementsByTagName(parentTag)[0];
            if (parent && parent.getElementsByTagName(tagName).length > 0) {
                return parent.getElementsByTagName(tagName)[0].textContent;
            }
        } else {
            if (xml.getElementsByTagName(tagName).length > 0) {
                return xml.getElementsByTagName(tagName)[0].textContent;
            }
        }
    } catch (error) {
        console.error(`Erro ao acessar tag ${tagName}:`, error);
    }
    return null;
}

// Função para formatar texto com destaque
function formatTextWithHighlight(text) {
    if (!text) return "";
    return text.replace(/<destaque>(.*?)<\/destaque>/g, '<span class="text-accent">$1</span>');
}

// Carregar dados quando a página estiver pronta
document.addEventListener("DOMContentLoaded", function() {
    loadXMLData();
    
    // Mobile menu toggle
    const mobileMenuButton = document.querySelector('button.md\\:hidden');
    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', function() {
            const menu = document.querySelector('.hidden.md\\:flex');
            if (menu) {
                menu.classList.toggle('hidden');
                menu.classList.toggle('flex');
                menu.classList.toggle('flex-col');
                menu.classList.toggle('absolute');
                menu.classList.toggle('top-16');
                menu.classList.toggle('left-0');
                menu.classList.toggle('right-0');
                menu.classList.toggle('bg-primary');
                menu.classList.toggle('py-4');
                menu.classList.toggle('px-6');
                menu.classList.toggle('space-y-4');
                menu.classList.toggle('space-x-8');
            }
        });
    }
});
