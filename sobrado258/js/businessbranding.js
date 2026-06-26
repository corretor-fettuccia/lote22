 (function(){
      // ========== EFEITO MÁQUINA DE ESCREVER ==========
      const textToType = "ROBERTO FETTUCCIA - Creci 83599-F";
      const targetSpan = document.getElementById('typingTarget');
      if(targetSpan && !targetSpan.querySelector('.typing-text')) {
        // Cria elemento para o texto digitável
        const typingSpan = document.createElement('span');
        typingSpan.className = 'typing-text';
        typingSpan.style.cssText = 'display: inline-flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: flex-end;';
        targetSpan.innerHTML = '';
        targetSpan.appendChild(typingSpan);
        // adiciona o ícone
        const iconI = document.createElement('i');
        iconI.style.display = 'inline-block';
        iconI.style.width = '40px';
        iconI.style.height = '1px';
        iconI.style.background = '#ccb78b';
        typingSpan.appendChild(iconI);
        
        let i = 0;
        function typeWriter() {
          if (i < textToType.length) {
            typingSpan.insertBefore(document.createTextNode(textToType.charAt(i)), iconI);
            i++;
            setTimeout(typeWriter, 100);
          } else {
            typingSpan.style.borderRight = 'none';
          }
        }
        typeWriter();
      }

      // ========== CARROSSEL COM EFEITO WIPE ==========
      const track = document.getElementById('bb-track');
      if(!track) return;
      let currentIndex = 0;
      const slides = Array.from(track.children);
      const total = slides.length;
      if(total === 0) return;
      
      let slideWidth = 0;
      let isAnimating = false;
      let resizeTimer;
      let autoTimer = null;
      
      function getSlideWidth() { return slides[0].getBoundingClientRect().width; }
      
      function setPosition(animate = true) {
        slideWidth = getSlideWidth();
        const newPos = -currentIndex * slideWidth;
        if(animate) {
          track.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
        } else {
          track.style.transition = 'none';
        }
        track.style.transform = `translateX(${newPos}px)`;
      }
      
      function applyWipeEffect(newIndex) {
        // Adiciona classe de animação no slide ativo (o que entrou)
        slides.forEach((slide, idx) => {
          if(idx === newIndex) {
            slide.classList.remove('wipe-in');
            void slide.offsetHeight; // força reflow
            slide.classList.add('wipe-in');
          } else {
            slide.classList.remove('wipe-in');
          }
        });
      }
      
      function changeSlide(direction) {
        if(isAnimating) return;
        isAnimating = true;
        let newIndex = currentIndex + direction;
        if(newIndex < 0) newIndex = total - 1;
        if(newIndex >= total) newIndex = 0;
        
        // Aplica efeito visual no card que vai aparecer
        applyWipeEffect(newIndex);
        
        currentIndex = newIndex;
        setPosition(true);
        setTimeout(() => {
          isAnimating = false;
        }, 600);
      }
      
      function nextSlide() { changeSlide(1); }
      function prevSlide() { changeSlide(-1); }
      
      // Botões
      const prevBtns = document.querySelectorAll('.bb-prev, .prev-arrow-custom');
      const nextBtns = document.querySelectorAll('.bb-next, .next-arrow-custom');
      prevBtns.forEach(btn => btn.addEventListener('click', prevSlide));
      nextBtns.forEach(btn => btn.addEventListener('click', nextSlide));
      
      // Auto-play suave (opcional)
      function startAutoPlay() { if(autoTimer) clearInterval(autoTimer); autoTimer = setInterval(nextSlide, 5000); }
      function stopAutoPlay() { if(autoTimer) clearInterval(autoTimer); autoTimer = null; }
      startAutoPlay();
      const sliderContainer = document.querySelector('.bb-slides-container');
      if(sliderContainer) {
        sliderContainer.addEventListener('mouseenter', stopAutoPlay);
        sliderContainer.addEventListener('mouseleave', startAutoPlay);
      }
      
      // Redimensionamento sem glitch
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { if(track) setPosition(false); }, 100);
      });
      
      // Swipe mobile
      let touchStartX = 0, touchEndX = 0, touchMoved = false;
      const container = document.querySelector('.bb-slides-container');
      if(container) {
        container.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].clientX; touchMoved = false; }, { passive: true });
        container.addEventListener('touchmove', () => { touchMoved = true; }, { passive: true });
        container.addEventListener('touchend', (e) => {
          if(!touchMoved) return;
          touchEndX = e.changedTouches[0].clientX;
          const diff = touchEndX - touchStartX;
          if(Math.abs(diff) > 50) diff > 0 ? prevSlide() : nextSlide();
          touchStartX = 0; touchEndX = 0; touchMoved = false;
        });
      }
      
      setPosition(false);
      applyWipeEffect(currentIndex);
      setTimeout(() => setPosition(false), 50);
    })();