(function() {
  'use strict';
  
  let player = null;
  
  function extractId(url) {
    if (!url) return null;
    if (url.match(/^[a-zA-Z0-9_-]{11}$/)) return url;
    const match = url.match(/(?:youtube\.com\/watch\?v=)([^&]+)/);
    return match ? match[1] : null;
  }
  
  function init() {
    const container = document.querySelector('.dv-youtube-container');
    if (!container) return;
    
    let videoId = container.getAttribute('data-video-id');
    if (!videoId || videoId.includes('youtube.com')) {
      videoId = extractId(videoId) || '9vntypeV5QU';
    }
    
    player = new YT.Player(container.id || 'dv-youtube-player', {
      videoId: videoId,
      playerVars: { autoplay: 1, mute: 1, controls: 0, loop: 1, playsinline: 1 },
      events: { onReady: e => e.target.playVideo() }
    });
  }
  
  window.onYouTubeIframeAPIReady = init;
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof YT !== 'undefined') init();
  });
})();
