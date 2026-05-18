/**
 * ============================================================
 * SISTEMA: Mapa Interativo - Implantação 4.1.1 Rv.1 15.05.26
 * AUTOR: Roberto de Paula Fettuccia
 * CONTATO: (51) 99811-1078 | corretor.fettuccia@gmail.com
 * LICENÇA: Código proprietário - Todos os direitos reservados
 * ============================================================
 * ATENÇÃO: Este software é protegido por leis de direitos autorais.
 * A reprodução, distribuição, modificação ou uso não autorizado
 * está sujeito a sanções legais (Lei 9.610/98).
 * ============================================================
 */
// ==================== VARIÁVEIS GLOBAIS ====================
let pontos = [];
let popupAtual = null;
let mapMarkers = {};
let map = null;
let currentBounds = null;
let carouselIndexMap = {};

// ==================== FUNÇÕES DE POPUP ====================
function fecharPopup() {
    if (popupAtual) {
        popupAtual.remove();
        popupAtual = null;
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    }).replace(/[\n\r]/g, '<br>');
}

function carregarCarrossel(id, index) {
    const container = document.getElementById(`carousel-images-${id}`);
    if (!container) return;
    
    const images = container.querySelectorAll('.carousel-image');
    if (images.length === 0) return;
    
    const width = images[0].clientWidth;
    container.style.transform = `translateX(-${index * width}px)`;
    
    const indicators = document.getElementById(`indicators-${id}`);
    if (indicators) {
        const dots = indicators.querySelectorAll('.indicator');
        dots.forEach((dot, i) => {
            if (i === index) dot.classList.add('active');
            else dot.classList.remove('active');
        });
    }
}

window.carouselPrev = function(id) {
    const ponto = pontos.find(p => p.id === id);
    if (!ponto || !ponto.imagens) return;
    
    let current = carouselIndexMap[id] || 0;
    current = (current - 1 + ponto.imagens.length) % ponto.imagens.length;
    carouselIndexMap[id] = current;
    carregarCarrossel(id, current);
}

window.carouselNext = function(id) {
    const ponto = pontos.find(p => p.id === id);
    if (!ponto || !ponto.imagens) return;
    
    let current = carouselIndexMap[id] || 0;
    current = (current + 1) % ponto.imagens.length;
    carouselIndexMap[id] = current;
    carregarCarrossel(id, current);
}

window.carouselGoTo = function(id, index) {
    carouselIndexMap[id] = index;
    carregarCarrossel(id, index);
}

function mostrarPopup(dados) {
    fecharPopup();
    
    const popup = document.createElement('div');
    popup.className = 'custom-popup';
    
    let html = `
        <div class="popup-header">
            <span>📍 ${escapeHtml(dados.nome) || 'Marcador'}</span>
            <button class="popup-close" onclick="fecharPopup()">✕</button>
        </div>
        <div class="popup-content">
    `;
    
    // CARROSSEL DE IMAGENS
    if (dados.imagens && dados.imagens.length > 0) {
        html += `<div class="carousel-container" id="carousel-${dados.id}">
            <div class="carousel">
                <div class="carousel-images" id="carousel-images-${dados.id}">`;
        
        dados.imagens.forEach(img => {
            html += `<img class="carousel-image" src="${escapeHtml(img)}" onerror="this.style.display='none'" loading="lazy">`;
        });
        
        html += `</div>`;
        if (dados.imagens.length > 1) {
            html += `<button class="carousel-btn carousel-prev" onclick="carouselPrev(${dados.id})">◀</button>
                     <button class="carousel-btn carousel-next" onclick="carouselNext(${dados.id})">▶</button>`;
        }
        html += `</div>`;
        if (dados.imagens.length > 1) {
            html += `<div class="carousel-indicators" id="indicators-${dados.id}">`;
            for (let i = 0; i < dados.imagens.length; i++) {
                html += `<div class="indicator ${i === 0 ? 'active' : ''}" onclick="carouselGoTo(${dados.id}, ${i})"></div>`;
            }
            html += `</div>`;
        }
        html += `</div>`;
    }
    
    // BOTÕES (LINKS)
    if (dados.botoes && dados.botoes.length > 0) {
        html += `<div class="info-row"><div class="info-label">🔗 LINKS</div><div class="info-value" style="display: flex; flex-direction: column; gap: 8px;">`;
        dados.botoes.forEach(btn => {
            if (btn.texto && btn.link) {
                html += `<a href="${escapeHtml(btn.link)}" target="_blank" rel="noopener noreferrer" style="background: rgba(212,175,55,0.2); border: 1px solid #d4af37; color: #d4af37; padding: 8px 15px; border-radius: 30px; text-decoration: none; font-size: 13px; display: inline-block; text-align: center;">🔗 ${escapeHtml(btn.texto)}</a>`;
            }
        });
        html += `</div></div>`;
    }
    
    // DADOS DO MARCADOR
    if (dados.lote && dados.lote.trim() !== '') {
        html += `<div class="info-row"><div class="info-label">🏷️ LOTE</div><div class="info-value">${escapeHtml(dados.lote)}</div></div>`;
    }
    if (dados.quadra && dados.quadra.trim() !== '') {
        html += `<div class="info-row"><div class="info-label">📐 QUADRA</div><div class="info-value">${escapeHtml(dados.quadra)}</div></div>`;
    }
    if (dados.tipo && dados.tipo.trim() !== '') {
        html += `<div class="info-row"><div class="info-label">🏢 TIPO</div><div class="info-value">${escapeHtml(dados.tipo)}</div></div>`;
    }
    if (dados.detalhe && dados.detalhe.trim() !== '') {
        html += `<div class="info-row"><div class="info-label">🔧 DETALHE</div><div class="info-value">${escapeHtml(dados.detalhe)}</div></div>`;
    }
    if (dados.testada && dados.testada.trim() !== '') {
        html += `<div class="info-row"><div class="info-label">📏 TESTADA</div><div class="info-value">${escapeHtml(dados.testada)} metros</div></div>`;
    }
    if (dados.areaTotal && dados.areaTotal.trim() !== '') {
        html += `<div class="info-row"><div class="info-label">📐 ÁREA TOTAL</div><div class="info-value">${escapeHtml(dados.areaTotal)} m²</div></div>`;
    }
    if (dados.descricaoDetalhada && dados.descricaoDetalhada.trim() !== '') {
        html += `<div class="divider-line"></div>`;
        html += `<div class="info-row"><div class="info-label">📝 DESCRIÇÃO</div><div class="info-value">${escapeHtml(dados.descricaoDetalhada)}</div></div>`;
    }
    
    html += `</div></div>`;
    popup.innerHTML = html;
    document.body.appendChild(popup);
    popupAtual = popup;
    
    if (dados.imagens && dados.imagens.length > 0) {
        setTimeout(() => carregarCarrossel(dados.id, 0), 100);
    }
}

// ==================== FUNÇÕES DO MAPA ====================
function inicializarMapa(tileSize, originalWidth, originalHeight, maxZoom) {
    const WIDTH = originalWidth;
    const HEIGHT = originalHeight;
    
    map = L.map('map', {
        crs: L.CRS.Simple,
        minZoom: 0,
        maxZoom: maxZoom,
        zoomSnap: 0.25,
        zoomDelta: 0.5,
        zoomControl: true,
        inertia: true,
        inertiaDeceleration: 3000
    });
    
    const southWest = map.unproject([0, HEIGHT], maxZoom);
    const northEast = map.unproject([WIDTH, 0], maxZoom);
    currentBounds = new L.LatLngBounds(southWest, northEast);
    
    L.tileLayer('./tiles/{z}/{x}/{y}.webp', {
        tileSize: tileSize,
        minZoom: 0,
        maxZoom: maxZoom,
        noWrap: true,
        bounds: currentBounds
    }).addTo(map);
    
    map.fitBounds(currentBounds);
    map.setMaxBounds(currentBounds);
    
    console.log(`✅ Mapa inicializado: ${WIDTH}x${HEIGHT}, Zoom max: ${maxZoom}`);
}

function getLatLngFromCoords(x, y) {
    const lng = currentBounds.getWest() + (x * (currentBounds.getEast() - currentBounds.getWest()));
    const lat = currentBounds.getSouth() + (y * (currentBounds.getNorth() - currentBounds.getSouth()));
    return { lat, lng };
}

function adicionarMarcador(x, y, dados) {
    if (!map) return null;
    
    const { lat, lng } = getLatLngFromCoords(x, y);
    
    const markerHtml = `
        <div style="
            width: 18px; 
            height: 18px; 
            background: ${dados.cor || '#d4af37'}; 
            border: 2px solid white; 
            border-radius: 50%; 
            box-shadow: 0 0 5px rgba(0,0,0,0.3); 
            cursor: pointer;
            animation: pulseBolinha 2s ease-in-out infinite;
            transform-origin: center;
        "></div>
    `;
    
    const icon = L.divIcon({
        html: markerHtml,
        iconSize: [18, 18],
        className: 'custom-marker',
        popupAnchor: [0, -10]
    });
    
    const marker = L.marker([lat, lng], { icon: icon }).addTo(map);
    marker.bindTooltip(dados.nome, { permanent: false, direction: 'top', offset: [0, -10] });
    marker.on('click', () => mostrarPopup(dados));
    
    mapMarkers[dados.id] = marker;
    return marker;
}

function limparMarcadores() {
    Object.keys(mapMarkers).forEach(id => {
        if (mapMarkers[id] && map) {
            map.removeLayer(mapMarkers[id]);
        }
    });
    mapMarkers = {};
    pontos = [];
}

function carregarMarcadores() {
    console.log('🔄 Carregando marcadores...');
    
    fetch('./tiles/marcadores.xml?t=' + Date.now())
        .then(response => {
            if (!response.ok) throw new Error('Arquivo marcadores.xml não encontrado');
            return response.text();
        })
        .then(xmlText => {
            const parser = new DOMParser();
            const xml = parser.parseFromString(xmlText, 'application/xml');
            const marcadores = xml.querySelectorAll('marcador');
            
            limparMarcadores();
            
            marcadores.forEach(marcador => {
                // Carregar imagens
                const imagens = [];
                marcador.querySelectorAll('imagem').forEach(img => {
                    const url = img.textContent;
                    if (url && url.trim() !== '') imagens.push(url);
                });
                
                // Carregar botões
                const botoes = [];
                marcador.querySelectorAll('botao').forEach(btn => {
                    const texto = btn.querySelector('texto')?.textContent || '';
                    const link = btn.querySelector('link')?.textContent || '';
                    if (texto && link) botoes.push({ texto, link });
                });
                
                const dados = {
                    id: parseInt(marcador.getAttribute('id')) || Date.now(),
                    x: parseFloat(marcador.querySelector('x')?.textContent || 0),
                    y: parseFloat(marcador.querySelector('y')?.textContent || 0),
                    nome: marcador.querySelector('nome')?.textContent || '',
                    lote: marcador.querySelector('lote')?.textContent || '',
                    quadra: marcador.querySelector('quadra')?.textContent || '',
                    tipo: marcador.querySelector('tipo')?.textContent || '',
                    detalhe: marcador.querySelector('detalhe')?.textContent || '',
                    testada: marcador.querySelector('testada')?.textContent || '',
                    areaTotal: marcador.querySelector('areaTotal')?.textContent || '',
                    descricaoDetalhada: marcador.querySelector('descricaoDetalhada')?.textContent || '',
                    cor: marcador.querySelector('cor')?.textContent || '#d4af37',
                    imagens: imagens,
                    botoes: botoes
                };
                
                if (!isNaN(dados.x) && !isNaN(dados.y) && dados.nome) {
                    adicionarMarcador(dados.x, dados.y, dados);
                    pontos.push(dados);
                }
            });
            
            const totalImagens = pontos.reduce((acc, p) => acc + (p.imagens?.length || 0), 0);
            const totalBotoes = pontos.reduce((acc, p) => acc + (p.botoes?.length || 0), 0);
            console.log(`✅ ${pontos.length} marcadores | Imagens: ${totalImagens} | Botões: ${totalBotoes}`);
            mostrarMensagem(`✅ ${pontos.length} pontos carregados`, '#4caf50');
            hideLoading();
        })
        .catch(erro => {
            console.log('ℹ️ Nenhum arquivo marcadores.xml encontrado');
            hideLoading();
            mostrarMensagem('📂 Nenhum ponto encontrado. Use o editor para adicionar pontos.', '#d4af37');
        });
}

function carregarConfiguracoes() {
    showLoading();
    
    fetch('./tiles/tiles.xml?t=' + Date.now())
        .then(response => {
            if (!response.ok) throw new Error('Arquivo tiles.xml não encontrado');
            return response.text();
        })
        .then(xmlText => {
            const parser = new DOMParser();
            const xml = parser.parseFromString(xmlText, 'application/xml');
            
            const tileSize = parseInt(xml.querySelector('tileSize')?.textContent || 256);
            const originalWidth = parseInt(xml.querySelector('originalWidth')?.textContent || 0);
            const originalHeight = parseInt(xml.querySelector('originalHeight')?.textContent || 0);
            const maxZoom = parseInt(xml.querySelector('maxZoom')?.textContent || 3);
            
            if (originalWidth === 0 || originalHeight === 0) {
                throw new Error('Dimensões inválidas');
            }
            
            console.log(`📋 Configurações: ${originalWidth}x${originalHeight}, Zoom: ${maxZoom}`);
            inicializarMapa(tileSize, originalWidth, originalHeight, maxZoom);
            carregarMarcadores();
        })
        .catch(erro => {
            console.log('ℹ️ Usando configurações padrão');
            inicializarMapa(256, 5938, 3677, 3);
            carregarMarcadores();
        });
}

// ==================== UTILITÁRIOS ====================
function showLoading() {
    let loading = document.getElementById('loading');
    if (!loading) {
        loading = document.createElement('div');
        loading.id = 'loading';
        loading.className = 'loading';
        loading.innerHTML = '📂 Carregando mapa...';
        document.body.appendChild(loading);
    }
}

function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.remove();
}

function mostrarMensagem(mensagem, cor = '#d4af37') {
    const msg = document.createElement('div');
    msg.style.position = 'fixed';
    msg.style.bottom = '80px';
    msg.style.left = '50%';
    msg.style.transform = 'translateX(-50%)';
    msg.style.background = 'rgba(0,0,0,0.9)';
    msg.style.color = cor;
    msg.style.padding = '10px 20px';
    msg.style.borderRadius = '30px';
    msg.style.fontSize = '12px';
    msg.style.zIndex = '1000';
    msg.style.border = `1px solid ${cor}`;
    msg.style.backdropFilter = 'blur(10px)';
    msg.innerHTML = mensagem;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
}

// ==================== INICIALIZAÇÃO ====================
carregarConfiguracoes();

window.addEventListener('resize', () => {
    if (map) setTimeout(() => map.invalidateSize(), 100);
});
