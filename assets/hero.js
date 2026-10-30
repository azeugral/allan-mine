/* Hero em vídeo (tools/hero_video.py): a legenda acompanha o tempo do vídeo; pausa fora da tela.
   Começa "estático" (pôster com a cobertura pronta, sem as fases) e só mostra as fases quando o vídeo de fato toca. */
(function () {
  const raiz = document.getElementById('hero-tela');
  if (!raiz) return;
  const v = raiz.querySelector('video'), lis = [...raiz.querySelectorAll('.fases li')], nome = raiz.querySelector('[data-nome]');
  const dur = +raiz.dataset.dur, fimAntes = +raiz.dataset.antes, fimRisco = +raiz.dataset.risco, troca = +raiz.dataset.troca || 0;
  const nomes = JSON.parse(raiz.dataset.nomes);
  let ultimo = '', laco = 0;
  function marcar() {
    const t = v.currentTime || 0;
    let i = Math.floor(t / dur) % nomes.length, s = t % dur;
    // na segunda metade da troca a imagem já é o "antes" da próxima sequência
    if (s >= dur - troca / 2) { i = (i + 1) % nomes.length; s = 0; }
    const k = s < fimAntes ? 0 : s < fimRisco ? 1 : 2, chave = i + ':' + k;
    if (chave !== ultimo) { ultimo = chave; lis.forEach((li, j) => { li.classList.toggle('ativa', j === k); li.classList.toggle('feita', j < k); }); nome.textContent = nomes[i]; }
  }
  // um único laço por vez (o "loop" do vídeo dispara seeked e antes empilhava laços)
  function rodar() { marcar(); laco = v.paused ? 0 : requestAnimationFrame(rodar); }
  v.addEventListener('playing', () => { raiz.classList.remove('estatico'); if (!laco) laco = requestAnimationFrame(rodar); });
  v.addEventListener('seeked', marcar);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  new IntersectionObserver(es => {
    if (es[0].isIntersecting) v.play().catch(() => raiz.classList.add('estatico'));
    else v.pause();
  }).observe(v);
})();
