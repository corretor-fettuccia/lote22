/**
 * Cinematic Royale – Efeito Supremo
 * Ativa a classe .cinematic_royale quando 25% do elemento está visível
 * Ajuste threshold e rootMargin conforme desejado.
 */
(function() {
const royalElements = document.querySelectorAll('.cinematic_royale');
if (!royalElements.length) return;   

  const observerOptions = {
    root: null,
    threshold: 0.25,          // 25% visível -> ativa o efeito de realeza
    rootMargin: "0px 0px -5px 0px"   // pequeno ajuste de precisão
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        el.classList.add('active');
        obs.unobserve(el);
      }
    });
  }, observerOptions);

  royalElements.forEach(el => observer.observe(el));

  console.log(`✨ Cinematic Royale ativado para ${royalElements.length} elementos. Threshold: 25% visível.`);
})();
