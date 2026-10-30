/* Allan Mine · entrada do hero em camadas e o nanquim em shader (fumaca.js) no hero e no processo.
   A fumaça é macia: meia resolução basta; se o quadro passar de ~22 ms, baixa mais. Só desenha na tela. */
(function () {
  const hero = document.querySelector('.hero');
  const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const arte = hero && hero.querySelector('.hero__arte img');
  const entrar = () => hero.classList.add('entrou');
  if (hero) {
    // espera a arte (ou 900 ms) para a entrada não acontecer sobre um buraco preto
    let feito = false;
    const vai = () => { if (feito) return; feito = true; void hero.offsetWidth; entrar(); };
    if (arte && !arte.complete) { arte.addEventListener('load', vai, { once: true }); arte.addEventListener('error', vai, { once: true }); setTimeout(vai, 900); }
    else vai();
  }

  document.querySelectorAll('.fumaca').forEach(box => {
    const cv = box.querySelector('canvas');
    if (!cv || !window.fumacaGL) return;
    let T = null;
    try { T = fumacaGL(cv, { modo: +box.dataset.modo, forca: +box.dataset.forca }); } catch (e) { T = null; }
    if (!T) return;
    const CICLO = (+box.dataset.ciclo || 30) * 1000;
    const toque = matchMedia('(hover: none)').matches;
    let esc = Math.min(devicePixelRatio || 1, 2) * (toque ? .38 : .5);
    const ajusta = () => T.tamanho(Math.max(2, Math.round(box.clientWidth * esc)), Math.max(2, Math.round(box.clientHeight * esc)));
    ajusta();
    addEventListener('resize', ajusta);
    cv.addEventListener('webglcontextlost', e => { e.preventDefault(); cv.classList.remove('on'); });
    if (reduz) { T.desenhar(1.2); cv.classList.add('on'); return; }
    let ve = false, ult = 0, soma = 0, n = 0;
    const t0 = performance.now();
    const quadro = t => {
      requestAnimationFrame(quadro);
      if (!ve || document.hidden) { ult = 0; return; }
      if (ult) { soma += t - ult; n++; }
      ult = t;
      if (n === 40) { if (soma / n > 22 && esc > .22) { esc *= .8; ajusta(); } soma = 0; n = 0; }
      T.desenhar(((t - t0) % CICLO) / CICLO * 6.283185307179586);
      cv.classList.add('on');
    };
    new IntersectionObserver(es => { ve = es[0].isIntersecting; ult = 0; }).observe(box);
    requestAnimationFrame(quadro);
  });
})();
