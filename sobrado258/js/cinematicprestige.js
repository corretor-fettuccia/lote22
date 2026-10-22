/**
 * Cinematic Prestige - Efeito Elite
 * Ativa a classe .cinematic_prestige quando o elemento atinge 30% de visibilidade
 * Pode ajustar o threshold (0.0 a 1.0) e rootMargin para controlar o início
 */
(function() {
  // Seleciona todos os elementos que devem receber o efeito de prestígio
  const prestigeElements = document.querySelectorAll('.cinematic_prestige');
  
  if (prestigeElements.length === 0) return;

  // Configuração: ativa quando 30% do elemento estiver visível na tela
  // Você pode alterar o valor de threshold (ex: 0.2 = 20%, 0.5 = 50%)
  const observerOptions = {
    root: null,               // viewport do navegador
    threshold: 0.6,          // 30% visível → ativa o efeito elite
    rootMargin: "0px 0px -10px 0px"   // leve ajuste para suavizar a ativação
  };

  // Callback que adiciona a classe .active e para de observar o elemento
  function handleIntersect(entries, observer) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target;
        element.classList.add('active');
        observer.unobserve(element);  // ativa apenas uma vez
      }
    });
  }

  const observer = new IntersectionObserver(handleIntersect, observerOptions);
  prestigeElements.forEach(el => observer.observe(el));

  // Log opcional (pode ser removido em produção)
  console.log(`✨ Cinematic Prestige ativado para ${prestigeElements.length} elementos. Trigger: 30% visível.`);
})();
