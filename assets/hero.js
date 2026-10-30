/* Hero em vídeo (tools/hero_video.py): a legenda acompanha o tempo do vídeo; pausa fora da tela. */
(function () {
  const raiz = document.getElementById('hero-tela');
  if (!raiz) return;
  const v = raiz.querySelector('video'), lis = [...raiz.querySelectorAll('.fases li')], nome = raiz.querySelector('[data-nome]');
  const dur = +raiz.dataset.dur, fimAntes = +raiz.dataset.antes, fimRisco = +raiz.dataset.risco, nomes = JSON.parse(raiz.dataset.nomes);
  let ultimo = '';
  function marcar() {
    const t = v.currentTime || 0, i = Math.floor(t / dur) % nomes.length, s = t % dur;
    const k = s < fimAntes ? 0 : s < fimRisco ? 1 : 2, chave = i + ':' + k;
    if (chave !== ultimo) { ultimo = chave; lis.forEach((li, j) => { li.classList.toggle('ativa', j === k); li.classList.toggle('feita', j < k); }); nome.textContent = nomes[i]; }
    if (!v.paused) requestAnimationFrame(marcar);
  }
  v.addEventListener('play', () => requestAnimationFrame(marcar));
  v.addEventListener('seeked', marcar);
  marcar();
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { v.removeAttribute('autoplay'); v.pause(); return; }
  new IntersectionObserver(es => { es[0].isIntersecting ? v.play().catch(() => {}) : v.pause(); }).observe(v);
})();
