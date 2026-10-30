/* Hero em vídeo (tools/hero_video.py): a legenda acompanha o tempo do vídeo; pausa fora da tela. */
(function () {
  const raiz = document.getElementById('hero-tela');
  if (!raiz) return;
  const v = raiz.querySelector('video'), lis = [...raiz.querySelectorAll('.fases li')], nome = raiz.querySelector('[data-nome]');
  const dur = +raiz.dataset.dur, fimAntes = +raiz.dataset.antes, fimRisco = +raiz.dataset.risco, nomes = JSON.parse(raiz.dataset.nomes);
  // a cortina para a próxima sequência começa antes do fim: a legenda vira junto, no meio dela
  const adianta = (+raiz.dataset.troca || 0) / 2;
  let ultimo = '', laco = 0;
  function marcar() {
    const t = (v.currentTime || 0) + adianta, i = Math.floor(t / dur) % nomes.length, s = t % dur;
    const k = s < fimAntes + adianta ? 0 : s < fimRisco + adianta ? 1 : 2, chave = i + ':' + k;
    if (chave !== ultimo) { ultimo = chave; lis.forEach((li, j) => { li.classList.toggle('ativa', j === k); li.classList.toggle('feita', j < k); }); nome.textContent = nomes[i]; }
  }
  // um laço só: o loop do vídeo dispara 'seeked' a cada volta e não pode abrir outro
  function rodar() { marcar(); laco = v.paused ? 0 : requestAnimationFrame(rodar); }
  v.addEventListener('play', () => { if (!laco) laco = requestAnimationFrame(rodar); });
  v.addEventListener('seeked', marcar);
  v.addEventListener('timeupdate', marcar);
  marcar();
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { v.removeAttribute('autoplay'); v.pause(); return; }
  new IntersectionObserver(es => { es[0].isIntersecting ? v.play().catch(() => {}) : v.pause(); }).observe(v);
})();
