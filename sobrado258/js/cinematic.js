  (function() {
    // ==============================================
    // DEFINIÇÃO DO EFEITO CINEMATIC MOTION
    // Escalável: detecta automaticamente todos os elementos com as classes
    // cinematicmotion__slide--left e cinematicmotion__slide--right
    // ==============================================

    // Seleciona todos os elementos que usam o namespace do efeito
    const motionElements = document.querySelectorAll('.cinematicmotion__slide--left, .cinematicmotion__slide--right');

    // Configuração do Intersection Observer: ativa quando 20% do elemento está visível
    const observerOptions = {
      root: null,          // viewport do navegador
      threshold: 0.7,      // 20% de exposição (exatamente conforme solicitado)
      rootMargin: "0px 0px 0px 0px"
    };

    // Callback que adiciona a classe .active e para de observar o elemento
    function handleIntersect(entries, observer) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          el.classList.add('active');    // ativa a animação (transform, opacidade, blur)
          observer.unobserve(el);        // garante que a animação ocorra apenas uma vez
        }
      });
    }

    // Cria o observer
    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    // Observa cada elemento encontrado
    motionElements.forEach(element => {
      observer.observe(element);
    });

    // Pequeno log para debug (opcional, pode ser removido em produção)
    console.log('[CinematicMotion] Efeito ativado para', motionElements.length, 'elementos. Trigger aos 20% do scroll.');
  })();
