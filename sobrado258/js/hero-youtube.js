/**
 * HERO VIDEO YOUTUBE - VIVA BRASIL
 * Prefixo: HVYouTube (para evitar conflitos)
 * Versão: 1.0.0
 */

(function() {
  'use strict';
  
  // CONFIGURAÇÕES
  const HVYouTubeConfig = {
    defaultVideoId: '9vntypeV5QU',
    startSeconds: 0,
    loop: true,
    fallbackImage: 'https://images.pexels.com/photos/2587054/pexels-photo-2587054.jpeg?auto=compress&cs=tinysrgb&w=1920'
  };
  
  // VARIÁVEIS PRIVADAS
  let HVYouTubePlayer = null;
  let HVYouTubeIsInitialized = false;
  
  // FUNÇÃO PARA EXTRAIR ID DO VÍDEO
  function HVYouTubeExtractId(url) {
    if (!url) return null;
    if (url.match(/^[a-zA-Z0-9_-]{11}$/)) return url;
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([^&]+)/,
      /(?:youtu\.be\/)([^?]+)/,
      /(?:youtube\.com\/embed\/)([^?]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) return match[1];
    }
    return null;
  }
  
  // FUNÇÃO PARA CARREGAR FALLBACK
  function HVYouTubeLoadFallback() {
    const container = document.querySelector('.hv-youtube-container');
    if (!container) return;
    
    const wrapper = container.closest('.hv-youtube-wrapper');
    if (wrapper) wrapper.style.filter = 'none';
    
    let fallbackImg = container.querySelector('.hv-youtube-fallback');
    if (!fallbackImg) {
      fallbackImg = document.createElement('img');
      fallbackImg.src = HVYouTubeConfig.fallbackImage;
      fallbackImg.className = 'hv-youtube-fallback';
      fallbackImg.alt = 'Background fallback';
      container.appendChild(fallbackImg);
    }
    fallbackImg.classList.add('active');
    
    console.log('[HVYouTube] Fallback image carregada');
  }
  
  // PLAYER READY
  function HVYouTubeOnReady(event) {
    console.log('[HVYouTube] Player pronto');
    event.target.mute();
    event.target.playVideo();
  }
  
  // PLAYER ERROR
  function HVYouTubeOnError(event) {
    console.error('[HVYouTube] Erro:', event.data);
    HVYouTubeLoadFallback();
  }
  
  // PLAYER STATE CHANGE
  function HVYouTubeOnStateChange(event) {
    if (event.data === YT.PlayerState.ENDED && HVYouTubeConfig.loop) {
      HVYouTubePlayer.playVideo();
    }
  }
  
  // INICIALIZAR PLAYER
  function HVYouTubeInit() {
    const container = document.querySelector('.hv-youtube-container');
    if (!container) {
      console.warn('[HVYouTube] Container não encontrado');
      return;
    }
    
    let videoId = container.getAttribute('data-video-id');
    
    if (!videoId || videoId.includes('youtube.com') || videoId.includes('youtu.be')) {
      videoId = HVYouTubeExtractId(videoId || HVYouTubeConfig.defaultVideoId);
    }
    
    if (!videoId) {
      HVYouTubeLoadFallback();
      return;
    }
    
    console.log('[HVYouTube] Carregando vídeo:', videoId);
    
    HVYouTubePlayer = new YT.Player(container.id || 'hv-youtube-player', {
      videoId: videoId,
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: 1,
        mute: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        loop: HVYouTubeConfig.loop ? 1 : 0,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        showinfo: 0,
        origin: window.location.origin
      },
      events: {
        onReady: HVYouTubeOnReady,
        onError: HVYouTubeOnError,
        onStateChange: HVYouTubeOnStateChange
      }
    });
    
    HVYouTubeIsInitialized = true;
  }
  
  // BOTÃO CTA
  function HVYouTubeInitCTA() {
    const btn = document.querySelector('.hv-youtube-btn');
    if (btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const event = new CustomEvent('hvYoutubeClick', {
          detail: { action: 'cta', timestamp: Date.now() },
          bubbles: true
        });
        window.dispatchEvent(event);
      });
    }
  }
  
  // API DO YOUTUBE READY
  window.onYouTubeIframeAPIReady = function() {
    HVYouTubeInit();
  };
  
  // INICIALIZAÇÃO GERAL
  document.addEventListener('DOMContentLoaded', function() {
    HVYouTubeInitCTA();
    
    // Fallback se API demorar
    setTimeout(function() {
      if (!HVYouTubeIsInitialized && typeof YT === 'undefined') {
        console.warn('[HVYouTube] API não carregou');
        HVYouTubeLoadFallback();
      }
    }, 5000);
    
    // Se a API já estiver carregada
    if (typeof YT !== 'undefined' && YT.loaded) {
      HVYouTubeInit();
    }
  });
  
  // EXPORTA API PÚBLICA (sem conflito)
  window.HVYouTube = {
    init: HVYouTubeInit,
    loadFallback: HVYouTubeLoadFallback,
    isReady: function() { return HVYouTubeIsInitialized; },
    getPlayer: function() { return HVYouTubePlayer; }
  };
  
})();
