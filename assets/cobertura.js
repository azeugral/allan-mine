/* Hero: o processo real do Allan, com fotos dele.
   1. a pele com a tatuagem antiga (foto do risco com o vermelho apagado, tools/hero.py)
   2. o risco à mão livre se desenha traço a traço (mapa "tempo": quando cada pixel vermelho entra)
   3. a tinta preta escorre e a cobertura pronta aparece
   Duas sequências (escorpião, pássaro) em loop. As fases saem num evento 'fase' para a legenda.
   `?fase=antes|risco|tinta|final&p=0.5` congela um quadro; `?seg=N` começa o loop em N segundos (conferência). */
(function () {
  const raiz = document.getElementById('hero-tela');
  if (!raiz) return;
  const tela = raiz.querySelector('canvas');
  const SEQ = JSON.parse(raiz.dataset.seq);
  const parado = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const q = new URLSearchParams(location.search);
  const fq = q.get('fase');
  const desloc = parseFloat(q.get('seg')) || 0;  // ?seg=13.9 começa o loop nesse instante (conferência)

  const FS = `precision highp float;
uniform sampler2D L,R,T,F,P;uniform vec2 r;uniform vec2 img;
uniform float prog,tinta,troca,zoom,t;
varying vec2 v;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n(p);p=p*2.03+1.7;a*=.5;}return s;}
void main(){
  // cobre a tela mantendo a proporção da foto (object-fit: cover), com zoom lento
  float ar=r.x/r.y, ai=img.x/img.y;
  vec2 esc=ar>ai?vec2(1.,ai/ar):vec2(ar/ai,1.);
  vec2 uv=(v-.5)*esc/zoom+.5;
  vec3 limpo=texture2D(L,uv).rgb, risco=texture2D(R,uv).rgb, fim=texture2D(F,uv).rgb;
  float tp=texture2D(T,uv).r;                      // 1 = não é risco
  float eh=1.-step(.999,tp);
  // risco desenhando
  float desenhado=eh*smoothstep(tp,tp+.014,prog);
  vec3 col=mix(limpo,risco,desenhado);
  float ponta=eh*smoothstep(.025,0.,abs(tp-prog))*step(.001,prog)*step(prog,.995);
  col+=vec3(1.,.4,.3)*ponta*.4;
  // tinta: nuvem de nanquim que desce, com borda escura
  float campo=fbm(uv*vec2(2.6,3.2)+vec2(0.,t*.03))*.55+uv.y*.35;
  float k=campo-(tinta*1.25-.12);
  float vira=smoothstep(.02,-.02,k);
  float borda=smoothstep(.07,0.,abs(k))*step(.001,tinta)*step(tinta,.999);
  col=mix(col,fim,vira);
  col=mix(col,vec3(.03,.025,.022),borda*.4);
  // troca de sequência: a cobertura anterior se dissolve na pele da próxima (sem passar pelo preto)
  float campo2=fbm(uv*vec2(3.1,2.4)+7.3);
  col=mix(col,texture2D(P,uv).rgb,smoothstep(-.05,.05,troca*1.25-.12-campo2));
  vec2 c=v-.5;col*=1.-dot(c,c)*.35;
  col+=(h(gl_FragCoord.xy+fract(t*7.))-.5)*.035;
  gl_FragColor=vec4(col,1.);
}`;

  if (parado) { raiz.classList.add('estatico'); return; }
  const gl = tela.getContext('webgl', { antialias: false, alpha: false });
  if (!gl) { raiz.classList.add('estatico'); return; }
  tela.addEventListener('webglcontextlost', e => { e.preventDefault(); raiz.classList.remove('pronto'); raiz.classList.add('estatico'); });
  const sh = (tipo, src) => { const o = gl.createShader(tipo); gl.shaderSource(o, src); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; };
  const vs = sh(gl.VERTEX_SHADER, 'attribute vec2 p;varying vec2 v;void main(){v=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}');
  const fs = sh(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) { raiz.classList.add('estatico'); return; }
  const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { raiz.classList.add('estatico'); return; }
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const lp = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(pr, n);
  ['L', 'R', 'T', 'F', 'P'].forEach((n, i) => gl.uniform1i(U(n), i));
  const uR = U('r'), uI = U('img'), uP = U('prog'), uTi = U('tinta'), uTr = U('troca'), uZ = U('zoom'), uT = U('t');
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

  const carregar = src => new Promise(ok => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; });
  function textura(im, cinza) {
    const tx = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tx);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, cinza ? gl.NEAREST : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fmt = cinza ? gl.LUMINANCE : gl.RGB;
    gl.texImage2D(gl.TEXTURE_2D, 0, fmt, fmt, gl.UNSIGNED_BYTE, im);
    return tx;
  }
  function medir() {
    const dpr = Math.min(devicePixelRatio || 1, 2), b = tela.getBoundingClientRect();
    tela.width = Math.max(1, Math.round(b.width * dpr)); tela.height = Math.max(1, Math.round(b.height * dpr));
  }
  medir(); addEventListener('resize', () => { medir(); if (seqs.length) { pedido = 0; quadro(performance.now()); } });

  // fases (s)
  const F_ANTES = 1.8, F_RISCO = 4.4, F_PAUSA = 1.1, F_TINTA = 2, F_FINAL = 4.2, F_TROCA = 1.1;
  const CICLO = F_ANTES + F_RISCO + F_PAUSA + F_TINTA + F_FINAL;
  const suave = x => x * x * (3 - 2 * x);
  const seqs = [];
  let visivel = true, pedido = 0, t0 = null, atual = -1, faseAtual = '';
  const pedir = () => { if (!pedido) pedido = requestAnimationFrame(quadro); };
  new IntersectionObserver(es => { visivel = es[0].isIntersecting; if (visivel) pedir(); }).observe(tela);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) pedir(); });

  function quadro(agora) {
    pedido = 0;
    if (t0 === null) t0 = agora;
    const s = (agora - t0) / 1000 + desloc;
    const volta = Math.floor(s / CICLO);
    let i = volta % SEQ.length, c = s % CICLO;
    if (!seqs[i]) i = 0;
    const ant = (i - 1 + SEQ.length) % SEQ.length;
    let prog = 0, tinta = 0, troca = 0, fase = 'antes';
    if (c < F_ANTES) { if (volta > 0 && seqs[ant] && ant !== i) troca = 1 - suave(Math.min(1, c / F_TROCA)); }
    else if ((c -= F_ANTES) < F_RISCO) { prog = c / F_RISCO; fase = 'risco'; }
    else if ((c -= F_RISCO) < F_PAUSA) { prog = 1; fase = 'risco'; }
    else if ((c -= F_PAUSA) < F_TINTA) { prog = 1; tinta = suave(c / F_TINTA); fase = 'tinta'; }
    else { prog = 1; tinta = 1; fase = 'final'; }
    if (fq) {
      i = 0; troca = 0; fase = fq; const p = parseFloat(q.get('p') || '.5');
      prog = fq === 'antes' ? 0 : fq === 'risco' ? p : 1; tinta = fq === 'tinta' ? p : fq === 'final' ? 1 : 0;
    }
    if (i !== atual) {
      atual = i;
      const x = seqs[i], pa = seqs[ant] || x;
      [x.L, x.R, x.T, x.F, pa.F].forEach((tx, k) => { gl.activeTexture(gl.TEXTURE0 + k); gl.bindTexture(gl.TEXTURE_2D, tx); });
      gl.uniform2f(uI, x.w, x.h);
      faseAtual = '';
    }
    if (fase !== faseAtual) { faseAtual = fase; raiz.dispatchEvent(new CustomEvent('fase', { detail: { fase, seq: SEQ[i] } })); }
    gl.viewport(0, 0, tela.width, tela.height);
    gl.uniform2f(uR, tela.width, tela.height);
    gl.uniform1f(uP, prog); gl.uniform1f(uTi, tinta); gl.uniform1f(uTr, troca);
    gl.uniform1f(uZ, 1.03 + .05 * ((s % CICLO) / CICLO)); gl.uniform1f(uT, s);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (visivel && !document.hidden && !fq && !gl.isContextLost()) pedir();
  }

  (async () => {
    for (let k = 0; k < SEQ.length; k++) {
      const b = SEQ[k].base;
      const [L, R, T, F] = await Promise.all(['-limpo.webp', '-risco.webp', '-tempo.png', '-final.webp'].map(x => carregar(b + x)));
      if (!L || !R || !T || !F) { if (k === 0) raiz.classList.add('estatico'); return; }
      seqs[k] = { L: textura(L), R: textura(R), T: textura(T), F: textura(F), w: L.width, h: L.height };
      if (k === 0) { raiz.classList.add('pronto'); pedir(); }
    }
  })();
})();
