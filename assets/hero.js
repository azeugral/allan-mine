/* Hero: as coberturas em sequência, antes e depois, com troca suave e zoom lento.
   Pausa fora da tela e com a aba escondida; com reduced-motion fica parado no primeiro "depois". */
(function () {
  const raiz = document.getElementById('hero-mostra');
  if (!raiz) return;
  const pares = [
    ['escorpiao', 'Escorpião antigo coberto com rosas'],
    ['leao', 'Estrela e escrita viraram um leão com flores'],
    ['rosa', 'Tatuagem azul borrada virou uma rosa'],
    ['costas', 'A fada da adolescência virou rosas delicadas'],
    ['borboleta-colorida', 'Borboleta antiga renovada com flores'],
    ['nome', 'O nome do ex coberto por um floral'],
    ['borboleta', 'Borboleta antiga refeita em fine line'],
  ];
  const quadros = pares.flatMap(([id, nome], i) => [
    { src: `assets/p/${id}-antes-g.webp`, fase: 'Antes', nome, i },
    { src: `assets/p/${id}-depois-g.webp`, fase: 'Depois', nome, i },
  ]);
  const TEMPO = { Antes: 2400, Depois: 4600 };
  const imgs = [...raiz.querySelectorAll('.mostra__quadro img')];
  const fase = raiz.querySelector('[data-fase]'), nome = raiz.querySelector('[data-nome]'), conta = raiz.querySelector('[data-conta]');
  const barra = raiz.querySelector('.mostra__barra i');
  const dois = n => String(n).padStart(2, '0');
  let k = 1, vez = 0, timer = 0, rodando = false, ocupado = false;

  const carregar = n => { const im = new Image(); im.src = quadros[n % quadros.length].src; return im.decode().catch(() => {}); };

  function legenda(q) {
    raiz.classList.add('troca');
    setTimeout(() => {
      fase.textContent = q.fase; fase.dataset.fase = q.fase;
      nome.textContent = q.nome; conta.textContent = `${dois(q.i + 1)} / ${dois(pares.length)}`;
      raiz.classList.remove('troca');
    }, 320);
  }

  function correr(t) {
    barra.style.transition = 'none'; barra.style.transform = 'scaleX(0)';
    void barra.offsetWidth;
    barra.style.transition = `transform ${t}ms linear`; barra.style.transform = 'scaleX(1)';
  }

  function agendar() {
    clearTimeout(timer);
    const t = TEMPO[quadros[k].fase];
    correr(t);
    timer = setTimeout(proximo, t);
    carregar(k + 1);
  }

  async function proximo() {
    if (ocupado) return;
    ocupado = true;
    const n = (k + 1) % quadros.length, q = quadros[n];
    await carregar(n);
    ocupado = false;
    if (!rodando) return;
    const entra = imgs[1 - vez], sai = imgs[vez];
    // a imagem que entra volta ao zoom inicial sem transição antes de aparecer
    entra.style.transition = 'none'; entra.classList.remove('on'); entra.src = q.src;
    void entra.offsetWidth; entra.style.transition = '';
    entra.classList.add('on'); sai.classList.remove('on');
    vez = 1 - vez; k = n;
    legenda(q); agendar();
  }

  function tocar(sim) {
    if (sim === rodando) return;
    rodando = sim;
    if (sim) agendar();
    else { clearTimeout(timer); barra.style.transition = 'none'; }
  }

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let visivel = true;
  new IntersectionObserver(es => { visivel = es[0].isIntersecting; tocar(visivel && !document.hidden); }).observe(raiz);
  document.addEventListener('visibilitychange', () => tocar(visivel && !document.hidden));
})();
