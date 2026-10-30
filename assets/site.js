/* Allan Mine · legenda do hero, riscados, galeria horizontal, processo, parallax e contadores (GSAP ScrollTrigger),
   antes/depois por toque, foto ampliada e pedido para o WhatsApp. Sem GSAP ou com reduced-motion, tudo aparece parado. */
(function () {
  const WHATS = '554199873760';
  const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const parado = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const largo = matchMedia('(min-width: 861px)');

  const topo = $('.topo');
  const rolar = () => topo.classList.toggle('rolou', scrollY > 40);
  addEventListener('scroll', rolar, { passive: true }); rolar();

  // antes e depois: toque troca a foto pequena com a grande
  $$('.caso__fotos').forEach(b => b.addEventListener('click', () => {
    const on = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', String(on));
  }));

  // foto ampliada
  const itens = $$('#grade a');
  const amp = $('#ampliada'), ampImg = $('img', amp);
  let i = 0, voltaFoco = null;
  function mostrar(n) {
    i = (n + itens.length) % itens.length;
    const a = itens[i];
    ampImg.style.opacity = 0;
    const im = new Image(); im.src = a.href;
    im.onload = () => { ampImg.src = a.href; ampImg.alt = $('img', a).alt; ampImg.style.opacity = 1; };
  }
  function abrir(a) {
    voltaFoco = a; amp.hidden = false; requestAnimationFrame(() => amp.classList.add('aberta'));
    mostrar(itens.indexOf(a)); document.body.style.overflow = 'hidden'; $('.ampliada__fechar').focus();
  }
  function fecharAmp() { amp.classList.remove('aberta'); setTimeout(() => { amp.hidden = true; }, 300); document.body.style.overflow = ''; voltaFoco && voltaFoco.focus(); }
  itens.forEach(a => a.addEventListener('click', e => { e.preventDefault(); abrir(a); }));
  $('.ampliada__fechar').addEventListener('click', fecharAmp);
  $('.ampliada__seta--ant').addEventListener('click', () => mostrar(i - 1));
  $('.ampliada__seta--prox').addEventListener('click', () => mostrar(i + 1));
  amp.addEventListener('click', e => { if (e.target === amp) fecharAmp(); });
  addEventListener('keydown', e => {
    if (amp.hidden) return;
    if (e.key === 'Escape') fecharAmp();
    if (e.key === 'ArrowLeft') mostrar(i - 1);
    if (e.key === 'ArrowRight') mostrar(i + 1);
  });
  let x0 = null;
  amp.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  amp.addEventListener('touchend', e => {
    if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) mostrar(i + (dx < 0 ? 1 : -1));
  });

  // pedido → WhatsApp
  const form = $('#pedido');
  $$('[data-tipo]').forEach(a => a.addEventListener('click', () => {
    const r = $(`input[name=tipo][value="${a.dataset.tipo}"]`, form); if (r) r.checked = true;
  }));
  form.addEventListener('submit', e => {
    e.preventDefault();
    const d = new FormData(form), nome = (d.get('nome') || '').trim();
    const campoNome = form.elements.nome.closest('.campo');
    if (!nome) { campoNome.classList.add('erro'); form.elements.nome.focus(); return; }
    campoNome.classList.remove('erro');
    const linhas = [`Olá Allan! Sou ${nome} e quero um orçamento de ${String(d.get('tipo')).toLowerCase()}.`];
    const add = (rot, k) => { const v = (d.get(k) || '').trim(); if (v) linhas.push(`${rot}: ${v}`); };
    add('Local do corpo', 'local'); add('Tamanho', 'tamanho'); add('O que eu gostaria', 'ideia');
    linhas.push('Vou mandar a foto aqui na conversa. (mensagem enviada pelo site)');
    window.open(`https://wa.me/${WHATS}?text=${encodeURIComponent(linhas.join('\n'))}`, '_blank', 'noopener');
  });

  // revelar títulos e blocos ao rolar
  const alvos = $$('section:not(.hero) .rotulo, section:not(.hero) h2, .caso__fala, .cicatriz p, .cicatriz .link-seta, .sobre__frase, .sobre__foto, .pedido, .contatos, .numeros');
  if (!parado) {
    alvos.forEach(el => el.classList.add('revela'));
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
    alvos.forEach(el => io.observe(el));
  }

  // contadores
  const contar = el => {
    const fim = +el.dataset.conta, t0 = performance.now();
    const passo = t => { const p = Math.min(1, (t - t0) / 1400); el.textContent = Math.round(fim * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(passo); };
    requestAnimationFrame(passo);
  };
  if (!parado) {
    const ioC = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { $$('[data-conta]', e.target).forEach(contar); ioC.unobserve(e.target); } }), { threshold: .4 });
    ioC.observe($('.numeros'));
  }

  // tudo que depende de rolagem: GSAP
  function comGsap() {
    const gsap = window.gsap, ST = window.ScrollTrigger;
    if (!gsap || !ST || parado) {
      document.documentElement.classList.add('sem-gsap');
      $$('.risca').forEach(r => r.classList.add('feito'));
      $$('.risca svg, .rodape__nome svg').forEach(s => s.style.clipPath = 'none');
      $('.processo__quadro').style.setProperty('--p', 1);
      $$('.passo').forEach(p => p.classList.add('ativo'));
      return;
    }
    gsap.registerPlugin(ST);

    // galeria: horizontal fixada no desktop. Criada antes dos gatilhos abaixo dela,
    // senão eles calculam início e fim sem o espaço do pin e o processo chega pronto.
    const mm = gsap.matchMedia();
    mm.add('(min-width: 861px)', () => {
      const trilho = $('.galeria__trilho');
      const abre = $('.galeria__abre');
      const dist = () => trilho.scrollWidth - (innerWidth - abre.offsetWidth);
      gsap.to(trilho, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: '.galeria', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: .8, invalidateOnRefresh: true, anticipatePin: 1 }
      });
    });

    // riscados: cada frase é riscada ao passar pelo meio da tela
    $$('.risca').forEach(r => {
      gsap.fromTo($('svg', r), { clipPath: 'inset(-50% 100% -50% -2%)' }, {
        clipPath: 'inset(-50% -2% -50% -2%)', ease: 'none',
        scrollTrigger: { trigger: r, start: 'top 72%', end: 'top 42%', scrub: .6, onUpdate: s => r.classList.toggle('feito', s.progress > .85) }
      });
    });

    // rodapé
    gsap.fromTo('.rodape__nome svg', { clipPath: 'inset(-50% 100% -50% -2%)' }, { clipPath: 'inset(-50% -2% -50% -2%)', ease: 'none', scrollTrigger: { trigger: '.rodape__nome', start: 'top 85%', end: 'top 45%', scrub: .6 } });

    // processo: a tatuagem pronta cobre o risco conforme os passos avançam (no celular, conforme a própria imagem passa)
    const quadro = $('.processo__quadro'), passos = $$('.passo');
    const mmP = gsap.matchMedia();
    mmP.add('(min-width: 861px)', () => {
      passos[0].classList.add('ativo');
      ST.create({
        trigger: '.processo ol', start: 'top 65%', end: 'bottom 55%', scrub: .5,
        onUpdate: s => {
          quadro.style.setProperty('--p', s.progress.toFixed(4));
          const k = Math.min(passos.length - 1, Math.floor(s.progress * passos.length));
          passos.forEach((p, j) => p.classList.toggle('ativo', j <= k));
        }
      });
    });
    mmP.add('(max-width: 860px)', () => {
      ST.create({ trigger: quadro, start: 'top 80%', end: 'bottom 35%', scrub: .5, onUpdate: s => quadro.style.setProperty('--p', s.progress.toFixed(4)) });
    });

    // trabalhos: colunas em velocidades diferentes (começam no lugar, para não subir sobre o título)
    $$('.coluna').forEach(c => {
      gsap.fromTo(c, { yPercent: 0 }, { yPercent: +c.dataset.vel, ease: 'none', scrollTrigger: { trigger: '.colagem', start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    ST.refresh();
  }
  if (document.readyState === 'complete') comGsap(); else addEventListener('load', comGsap);
})();
