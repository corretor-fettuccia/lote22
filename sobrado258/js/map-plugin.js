        // ============================================
        // MAP VIEW - Visualização do Mapa V.3.4.1
        // Com layout responsivo para mobile
        // Direitos reservados - corretor.fettuccia@gmail.com
        // ============================================

        (function() {
            // ==================== VARIÁVEIS ====================
            let map_view_mapa = null;
            let map_view_marcadorImovel = null;
            let map_view_circuloRaio = null;
            let map_view_marcadores = [];
            let map_view_linhaRota = null;
            let map_view_dados = null;
            let map_view_raioAtual = 500;

            // Configuração das categorias
            const MAP_VIEW_CATEGORIAS_CONFIG = {
                escolas: { icone: "🏫", titulo: "Escolas e Educação", cor: "#3498db" },
                saude: { icone: "🏥", titulo: "Saúde", cor: "#e74c3c" },
                farmacia: { icone: "💊", titulo: "Farmácias", cor: "#1abc9c" },
                bancos: { icone: "🏦", titulo: "Agências Bancárias", cor: "#f39c12" },
                servicos_publicos: { icone: "🏛️", titulo: "Serviços Públicos", cor: "#9b59b6" },
                servicos_privados: { icone: "🔧", titulo: "Serviços Privados", cor: "#e67e22" },
                compras: { icone: "🛒", titulo: "Compras e Mercados", cor: "#2ecc71" },
                transporte: { icone: "🚇", titulo: "Transporte", cor: "#00a8ff" },
                lazer: { icone: "🍺", titulo: "Lazer e Gastronomia", cor: "#e84393" },
                outros: { icone: "📌", titulo: "Outros", cor: "#95a5a6" }
            };

            // ==================== FUNÇÕES AUXILIARES ====================
            function map_view_mostrarMensagem(mensagem, isError = false) {
                const infoDiv = document.getElementById('map_view-info-rota');
                if (!infoDiv) return;
                
                infoDiv.innerHTML = isError ? `⚠️ ${mensagem}` : `📍 ${mensagem}`;
                infoDiv.classList.add('visible');
                
                setTimeout(() => {
                    infoDiv.classList.remove('visible');
                }, 4000);
            }

            function map_view_calcularDistancia(lat1, lon1, lat2, lon2) {
                const R = 6371;
                const dLat = (lat2 - lat1) * Math.PI / 180;
                const dLon = (lon2 - lon1) * Math.PI / 180;
                const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                          Math.sin(dLon/2) * Math.sin(dLon/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                return Math.round(R * c * 1000);
            }

            // ==================== CARREGAR DADOS ====================
            async function map_view_carregarDados(url) {
                try {
                    const response = await fetch(url);
                    if (!response.ok) throw new Error('Erro ao carregar markers.json');
                    map_view_dados = await response.json();
                    
                    const headerDiv = document.getElementById('map_view-header');
                    if (headerDiv && map_view_dados.imovel) {
                        headerDiv.innerHTML = `
                            <h2>${map_view_dados.imovel.titulo || 'Localização Privilegiada'}</h2>
                            <p>${map_view_dados.imovel.descricao || 'Viva perto de tudo que importa'}</p>
                            <div class="map_view-endereco">
                                <i>${map_view_dados.imovel.endereco}</i>
                            </div>
                        `;
                    }
                    return true;
                } catch (error) {
                    console.error('MapView:', error);
                    const headerDiv = document.getElementById('map_view-header');
                    if (headerDiv) {
                        headerDiv.innerHTML = `<h2>📍 Erro ao carregar mapa</h2><p>Verifique o arquivo markers.json</p>`;
                    }
                    return false;
                }
            }

            // ==================== MAPA ====================
            function map_view_inicializarMapa() {
                if (!map_view_dados) return;
                
                map_view_mapa = L.map('map_view-mapa').setView(
                    [map_view_dados.imovel.lat, map_view_dados.imovel.lng],
                    map_view_dados.configuracoes?.zoom_padrao || 15
                );
                
                L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                    subdomains: 'abcd',
                    maxZoom: 19
                }).addTo(map_view_mapa);
                
                map_view_adicionarMarcadorImovel();
                map_view_adicionarCirculo();
                map_view_adicionarTodosMarcadores();
            }
            
            function map_view_adicionarMarcadorImovel() {
                const iconeImovel = L.divIcon({
                    html: '🏠',
                    className: 'map_view-marcador-imovel',
                    iconSize: [40, 40],
                    popupAnchor: [0, -20]
                });
                
                map_view_marcadorImovel = L.marker([map_view_dados.imovel.lat, map_view_dados.imovel.lng], { icon: iconeImovel })
                    .addTo(map_view_mapa)
                    .bindPopup(`
                        <b>${map_view_dados.imovel.titulo || '🏠 SEU IMÓVEL'}</b><br>
                        ${map_view_dados.imovel.endereco}<br>
                        <i>${map_view_dados.imovel.descricao || 'Localização premium!'}</i>
                    `);
            }
            
            function map_view_adicionarCirculo() {
                if (map_view_circuloRaio) {
                    map_view_mapa.removeLayer(map_view_circuloRaio);
                }
                map_view_circuloRaio = L.circle([map_view_dados.imovel.lat, map_view_dados.imovel.lng], {
                    color: '#2d6a4f',
                    fillColor: '#2d6a4f',
                    fillOpacity: 0.08,
                    radius: map_view_raioAtual,
                    weight: 2
                }).addTo(map_view_mapa);
            }
            
            function map_view_criarMarcador(ponto, categoria, iconeCategoria) {
                const config = MAP_VIEW_CATEGORIAS_CONFIG[categoria] || { icone: "📍", cor: "#95a5a6" };
                
                const icone = L.divIcon({
                    html: iconeCategoria || config.icone,
                    className: `map_view-marcador-${categoria}`,
                    iconSize: [32, 32],
                    popupAnchor: [0, -16]
                });
                
                const distancia = ponto.distancia || map_view_calcularDistancia(
                    map_view_dados.imovel.lat, map_view_dados.imovel.lng,
                    ponto.lat, ponto.lng
                );
                
                const marcador = L.marker([ponto.lat, ponto.lng], { icon: icone })
                    .addTo(map_view_mapa)
                    .bindPopup(`
                        <div style="min-width: 180px;">
                            <b>${iconeCategoria || config.icone} ${ponto.nome}</b><br>
                            📍 Distância: ${distancia}m do imóvel<br>
                            ${ponto.descricao ? `<small>${ponto.descricao}</small><br>` : ''}
                            <hr style="margin: 8px 0;">
                            <button onclick="window.map_view_tracarRota(${ponto.lat}, ${ponto.lng}, '${ponto.nome.replace(/'/g, "\\'")}')" 
                                    style="background:#2d6a4f; color:white; border:none; padding:5px 12px; border-radius:20px; cursor:pointer; width:100%;">
                                🚶 Como chegar
                            </button>
                        </div>
                    `);
                
                return marcador;
            }
            
            function map_view_adicionarTodosMarcadores() {
                map_view_marcadores.forEach(m => {
                    if (map_view_mapa) map_view_mapa.removeLayer(m);
                });
                map_view_marcadores = [];
                
                for (const [catKey, catData] of Object.entries(map_view_dados.categorias)) {
                    catData.pontos.forEach(ponto => {
                        const marcador = map_view_criarMarcador(ponto, catKey, catData.icone);
                        map_view_marcadores.push(marcador);
                    });
                }
            }
            
            // ==================== ROTA ====================
            window.map_view_tracarRota = function(lat, lng, nome) {
                if (!map_view_mapa || !map_view_dados) return;
                
                // Fechar sidebar no mobile após selecionar rota
                if (window.innerWidth <= 768) {
                    document.getElementById('map_view-sidebar')?.classList.remove('open');
                    document.getElementById('map_view-overlay')?.classList.remove('active');
                }
                
                if (map_view_linhaRota) {
                    map_view_mapa.removeLayer(map_view_linhaRota);
                }
                
                const pontos = [
                    [map_view_dados.imovel.lat, map_view_dados.imovel.lng],
                    [lat, lng]
                ];
                
                map_view_linhaRota = L.polyline(pontos, {
                    color: '#e74c3c',
                    weight: 4,
                    opacity: 0.8,
                    dashArray: '10, 10'
                }).addTo(map_view_mapa);
                
                const distancia = map_view_calcularDistancia(map_view_dados.imovel.lat, map_view_dados.imovel.lng, lat, lng);
                const tempo = Math.round(distancia / 5 * 60);
                
                map_view_mostrarMensagem(`🚶 Rota para ${nome}: ${distancia.toFixed(1)}km - aprox. ${tempo} min a pé`);
                
                const bounds = L.latLngBounds(pontos);
                map_view_mapa.fitBounds(bounds, { padding: [50, 50] });
            };
            
            // ==================== CONFIGURAR RAIO ====================
            function map_view_configurarRaio() {
                document.querySelectorAll('.map_view-raio-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        document.querySelectorAll('.map_view-raio-btn').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        map_view_raioAtual = parseInt(btn.dataset.raio);
                        map_view_adicionarCirculo();
                        if (map_view_mapa) {
                            map_view_mapa.setView([map_view_dados.imovel.lat, map_view_dados.imovel.lng], 14);
                        }
                    });
                });
            }
            
            // ==================== SIDEBAR ====================
            function map_view_popularSidebar() {
                const container = document.getElementById('map_view-categorias');
                if (!container || !map_view_dados) return;
                
                let html = '';
                let totalPontos = 0;
                
                for (const [catKey, config] of Object.entries(MAP_VIEW_CATEGORIAS_CONFIG)) {
                    const catData = map_view_dados.categorias[catKey];
                    if (!catData) continue;
                    
                    const pontosCount = catData.pontos.length;
                    totalPontos += pontosCount;
                    
                    if (pontosCount === 0) continue;
                    
                    html += `
                        <div class="map_view-categoria" data-categoria="${catKey}">
                            <div class="map_view-categoria-header">
                                <span>${config.icone}</span>
                                <span>${config.titulo}</span>
                                <span style="margin-left: auto; font-size: 10px; background: ${config.cor}20; padding: 2px 6px; border-radius: 20px; color: ${config.cor};">
                                    ${pontosCount}
                                </span>
                            </div>
                            <div class="map_view-categoria-pontos">
                    `;
                    
                    catData.pontos.forEach(ponto => {
                        html += `
                            <div class="map_view-ponto-item" onclick="window.map_view_tracarRota(${ponto.lat}, ${ponto.lng}, '${ponto.nome.replace(/'/g, "\\'")}')">
                                <div class="map_view-ponto-header">
                                    <span class="map_view-ponto-icone">${config.icone}</span>
                                    <span class="map_view-ponto-nome">${ponto.nome}</span>
                                    <span class="map_view-ponto-distancia">${ponto.distancia}m</span>
                                </div>
                                ${ponto.descricao ? `<div class="map_view-ponto-descricao">${ponto.descricao}</div>` : ''}
                                <button class="map_view-rota-btn" onclick="event.stopPropagation(); window.map_view_tracarRota(${ponto.lat}, ${ponto.lng}, '${ponto.nome.replace(/'/g, "\\'")}')">
                                    🚶 Traçar rota
                                </button>
                            </div>
                        `;
                    });
                    
                    html += `</div></div>`;
                }
                
                if (totalPontos === 0) {
                    html = '<div style="text-align: center; color: #888; padding: 30px;">Nenhum ponto de interesse cadastrado.</div>';
                }
                
                container.innerHTML = html;
            }
            
            // ==================== MOBILE TOGGLE ====================
            function map_view_configurarMobile() {
                const toggleBtn = document.getElementById('map_view-toggle');
                const sidebar = document.getElementById('map_view-sidebar');
                const overlay = document.getElementById('map_view-overlay');
                
                if (!toggleBtn || !sidebar || !overlay) return;
                
                toggleBtn.addEventListener('click', () => {
                    sidebar.classList.add('open');
                    overlay.classList.add('active');
                });
                
                overlay.addEventListener('click', () => {
                    sidebar.classList.remove('open');
                    overlay.classList.remove('active');
                });
                
                // Fechar ao clicar em um item da sidebar (opcional)
                const closeOnItemClick = () => {
                    if (window.innerWidth <= 768) {
                        sidebar.classList.remove('open');
                        overlay.classList.remove('active');
                    }
                };
                
                // Adicionar evento para fechar ao clicar em qualquer ponto-item
                document.addEventListener('click', (e) => {
                    if (e.target.closest('.map_view-ponto-item')) {
                        closeOnItemClick();
                    }
                });
            }
            
            // ==================== LOCALIZAÇÃO ====================
            function map_view_configurarLocalizacao() {
                const locationBtn = document.getElementById('map_view-btn-localizacao');
                
                locationBtn?.addEventListener('click', () => {
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                            (pos) => {
                                const userLat = pos.coords.latitude;
                                const userLng = pos.coords.longitude;
                                
                                L.marker([userLat, userLng])
                                    .addTo(map_view_mapa)
                                    .bindPopup('📍 Você está aqui')
                                    .openPopup();
                                    
                                map_view_mapa.setView([userLat, userLng], 14);
                                
                                const distanciaImovel = map_view_calcularDistancia(userLat, userLng, map_view_dados.imovel.lat, map_view_dados.imovel.lng);
                                map_view_mostrarMensagem(`Você está a ${distanciaImovel.toFixed(1)}km do imóvel`);
                            },
                            () => {
                                map_view_mostrarMensagem('Não foi possível obter sua localização', true);
                            }
                        );
                    }
                });
            }
            
            // ==================== INICIALIZAÇÃO ====================
            window.map_view_tracarRota = map_view_tracarRota;
            
            async function map_view_init(jsonUrl = 'markers.json') {
                if (typeof L === 'undefined') {
                    console.error('MapView: Leaflet não está carregado');
                    return false;
                }
                
                // Loading
                const mapaDiv = document.getElementById('map_view-mapa');
                if (mapaDiv) {
                    const container = mapaDiv.parentElement;
                    const loadingDiv = document.createElement('div');
                    loadingDiv.id = 'map_view-loading';
                    loadingDiv.className = 'map_view-loading';
                    loadingDiv.innerHTML = '🔄 Carregando mapa...';
                    if (container) {
                        container.style.position = 'relative';
                        container.appendChild(loadingDiv);
                    }
                }
                
                const loaded = await map_view_carregarDados(jsonUrl);
                if (!loaded) {
                    const loadingEl = document.getElementById('map_view-loading');
                    if (loadingEl) loadingEl.remove();
                    return false;
                }
                
                map_view_inicializarMapa();
                map_view_popularSidebar();
                map_view_configurarRaio();
                map_view_configurarLocalizacao();
                map_view_configurarMobile();
                
                const loadingEl = document.getElementById('map_view-loading');
                if (loadingEl) loadingEl.remove();
                
                return true;
            }
            
            document.addEventListener('DOMContentLoaded', () => {
                map_view_init('markers.json');
            });
            
        })();