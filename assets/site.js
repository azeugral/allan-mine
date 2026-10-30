/* Allan Mine · riscados, galeria horizontal, processo fixado e contadores (GSAP ScrollTrigger),
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
  const alvos = $$('section:not(.hero) .rotulo, section:not(.hero) h2, .obra, .trabalhos__cabeca p, .caso__fala, .cicatriz p, .cicatriz .link-seta, .sobre__frase, .sobre__foto, .pedido, .contatos, .numeros');
  if (!parado) {
    alvos.forEach(el => el.classList.add('revela'));
    $$('.obra').forEach((o, n) => { o.style.transitionDelay = (n % 4) * .07 + 's'; });
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
      return;
    }
    gsap.registerPlugin(ST);
    ST.config({ ignoreMobileResize: true });

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

    // processo: palco fixado; a rolagem leva a foto do antes à avaliação (zoom e o círculo da caneta),
    // ao risco (as linhas aparecem por cima da mesma foto) e à cobertura, que se espalha do centro como tinta
    const palco = $('.processo__palco'), passos = $$('.passo'), trilho = $$('.processo__trilho i');
    const foto = $('.processo__foto'), mira = $('.processo__mira');
    const num = $('[data-num]', palco), leg = $('[data-etapa]', palco);
    let atual = 0;
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: palco, start: 'top top', end: () => '+=' + Math.round(innerHeight * 3.2), pin: true, scrub: .7, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: s => {
          const p = s.progress * 4;
          trilho.forEach((t, j) => t.style.setProperty('--f', Math.min(1, Math.max(0, p - j)).toFixed(3)));
          const n = Math.min(3, Math.floor(p));
          if (n === atual) return;
          atual = n;
          passos.forEach((x, j) => x.classList.toggle('ativo', j === n));
          num.textContent = '0' + (n + 1);
          leg.textContent = passos[n].dataset.legenda;
        }
      }
    });
    tl.fromTo(foto, { scale: 1.08 }, { scale: 1, duration: 1 }, 0)
      .to(foto, { scale: 1.16, duration: 1 }, 1)
      .to(mira, { opacity: 1, duration: .12 }, 1.1)
      .fromTo(mira, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: .7 }, 1.1)
      .to(mira, { opacity: 0, duration: .3 }, 2)
      .to('.p-risco', { opacity: 1, duration: 1 }, 2)
      .to(foto, { scale: 1.02, duration: 1 }, 2)
      .fromTo('.p-final', { '--r': -30 }, { '--r': 100, duration: 1, ease: 'power1.inOut' }, 3);

    // riscados: cada frase é riscada ao passar pelo meio da tela
    $$('.risca').forEach(r => {
      gsap.fromTo($('svg', r), { clipPath: 'inset(-50% 100% -50% -2%)' }, {
        clipPath: 'inset(-50% -2% -50% -2%)', ease: 'none',
        scrollTrigger: { trigger: r, start: 'top 72%', end: 'top 42%', scrub: .6, onUpdate: s => r.classList.toggle('feito', s.progress > .85) }
      });
    });

    // rodapé
    gsap.fromTo('.rodape__nome svg', { clipPath: 'inset(-50% 100% -50% -2%)' }, { clipPath: 'inset(-50% -2% -50% -2%)', ease: 'none', scrollTrigger: { trigger: '.rodape__nome', start: 'top 85%', end: 'top 45%', scrub: .6 } });

    ST.refresh();
  }
  if (document.readyState === 'complete') comGsap(); else addEventListener('load', comGsap);
})();
