/* Allan Mine · topo, menu, revelar ao rolar, antes/depois por toque, foto ampliada, pedido para o WhatsApp. */
(function () {
  const WHATS = '554199873760';
  const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const topo = $('.topo');
  const rolar = () => topo.classList.toggle('rolou', scrollY > 40);
  addEventListener('scroll', rolar, { passive: true }); rolar();

  const bt = $('.abre-menu'), menu = $('#menu');
  const fechar = () => { menu.classList.remove('aberto'); bt.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; };
  bt.addEventListener('click', () => {
    const abre = !menu.classList.contains('aberto');
    menu.classList.toggle('aberto', abre); bt.setAttribute('aria-expanded', String(abre));
    document.body.style.overflow = abre ? 'hidden' : '';
  });
  $$('a', menu).forEach(a => a.addEventListener('click', fechar));

  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('.revela').forEach(el => io.observe(el));

  // antes e depois: toque alterna, a linha vermelha corre por cima
  $$('.par__foto').forEach(b => b.addEventListener('click', () => {
    const on = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', String(on));
    $('.par__selo', b).textContent = on ? 'Depois' : 'Ver antes';
  }));

  // foto ampliada
  const itens = $$('#grade li a');
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

  // botões que já escolhem o tipo no pedido
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
})();
