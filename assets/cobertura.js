/* Hero: a tatuagem antiga some e a cobertura aparece por baixo, numa frente de traço vermelho,
   como a caneta com que o Allan desenha à mão livre direto na pele antes de tatuar.
   Três pares antes/depois em loop: antes parado → frente varre a foto → depois parado → escurece → próximo par.
   `prog` = 0→1 da varredura; `luz` = 0→1 entre pares (escurece para trocar as texturas). */
(function () {
  const caixa = document.getElementById('cobertura');
  if (!caixa) return;
  const tela = caixa.querySelector('canvas');
  const rotulo = caixa.querySelector('[data-rotulo]');
  const nome = caixa.querySelector('[data-par]');
  const PARES = JSON.parse(caixa.dataset.pares);
  const parado = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const congela = parseFloat(new URLSearchParams(location.search).get('prog'));  // ?prog=0.5 congela a varredura (conferência)

  const FS = `precision highp float;
uniform sampler2D A;uniform sampler2D D;uniform vec2 r;uniform float prog;uniform float luz;uniform float t;
varying vec2 uv;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.07+3.1;a*=.5;}return v;}
void main(){
  vec3 a=texture2D(A,uv).rgb, d=texture2D(D,uv).rgb;
  // frente: varre de baixo-esquerda para cima-direita, recortada por ruído (borda orgânica de tinta)
  float campo=(1.-uv.y)*.62+uv.x*.38;
  campo=campo*.78+fbm(uv*vec2(3.,3.8)+vec2(0.,t*.05))*.42;
  float f=prog*1.32-.16;
  float k=campo-f;                                   // <0 já virou cobertura
  float vira=smoothstep(.012,-.012,k);
  vec3 col=mix(a,d,vira);
  // véu escuro de tinta logo atrás da frente
  col*=1.-.35*smoothstep(.07,0.,abs(k+.03))*step(.001,prog)*step(prog,.999);
  // traço vermelho do estêncil na frente, com linhas de risco paralelas
  float fio=smoothstep(.0045,0.,abs(k));
  float risco=smoothstep(.55,.95,sin((uv.x*1.3+uv.y)*r.y*.09+fbm(uv*9.)*8.))*smoothstep(.05,0.,abs(k-.022));
  vec3 verm=vec3(.92,.16,.13);
  float ativo=step(.001,prog)*step(prog,.999);
  col=mix(col,verm,(fio*.95+risco*.55)*ativo);
  col+=verm*smoothstep(.03,0.,abs(k))*.09*ativo;
  // vinheta leve e escurecimento entre pares
  vec2 c=uv-.5;col*=1.-dot(c,c)*.55;
  col*=luz;
  gl_FragColor=vec4(col,1.);
}`;

  const gl = tela.getContext('webgl', { antialias: false, premultipliedAlpha: false });
  const imagens = {};
  function carregar(src) {
    return new Promise(ok => { const im = new Image(); im.decoding = 'async'; im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; });
  }

  if (!gl || parado) { caixa.classList.add('estatico'); return; }
  const sh = (tipo, src) => { const o = gl.createShader(tipo); gl.shaderSource(o, src); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; };
  const vs = sh(gl.VERTEX_SHADER, 'attribute vec2 p;varying vec2 uv;void main(){uv=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}');
  const fs = sh(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) { caixa.classList.add('estatico'); return; }
  const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { caixa.classList.add('estatico'); return; }
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const lp = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(pr, n);
  const uR = U('r'), uP = U('prog'), uL = U('luz'), uT = U('t');
  gl.uniform1i(U('A'), 0); gl.uniform1i(U('D'), 1);

  function textura(im) {
    const tx = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tx);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im);
    return tx;
  }
  function medir() {
    const dpr = Math.min(devicePixelRatio || 1, 2), b = tela.getBoundingClientRect();
    tela.width = Math.round(b.width * dpr); tela.height = Math.round(b.height * dpr);
  }
  medir(); addEventListener('resize', medir);

  const texs = [];
  let visivel = true;
  new IntersectionObserver(es => { visivel = es[0].isIntersecting; if (visivel) pedir(); }).observe(tela);

  // tempos (s): antes, varredura, depois, troca
  const T_ANTES = 1.6, T_VARRE = 2.4, T_DEPOIS = 3.4, T_TROCA = .9, CICLO = T_ANTES + T_VARRE + T_DEPOIS + T_TROCA;
  const suave = x => x * x * (3 - 2 * x);
  let t0 = null, pedido = 0, parAtual = -1, faseRotulo = '';

  function quadro(agora) {
    pedido = 0;
    if (t0 === null) t0 = agora;
    const s = (agora - t0) / 1000;
    const i = isNaN(congela) ? Math.floor(s / CICLO) % PARES.length : 0, c = s % CICLO;
    if (!texs[i]) { pedir(); return; }
    let prog = 0, luz = 1;
    if (c < T_ANTES) { prog = 0; luz = Math.min(1, c / .5); }
    else if (c < T_ANTES + T_VARRE) prog = suave((c - T_ANTES) / T_VARRE);
    else if (c < T_ANTES + T_VARRE + T_DEPOIS) prog = 1;
    else { prog = 1; luz = 1 - (c - T_ANTES - T_VARRE - T_DEPOIS) / T_TROCA; }
    if (!isNaN(congela)) { prog = congela; luz = 1; }
    if (i !== parAtual) {
      parAtual = i;
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texs[i].a);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texs[i].d);
      nome.textContent = PARES[i].nome;
    }
    const f = prog < .5 ? 'Antes' : 'Depois';
    if (f !== faseRotulo) { faseRotulo = f; rotulo.textContent = f; rotulo.classList.toggle('depois', f === 'Depois'); }
    gl.viewport(0, 0, tela.width, tela.height);
    gl.uniform2f(uR, tela.width, tela.height); gl.uniform1f(uP, prog); gl.uniform1f(uL, Math.max(0, luz)); gl.uniform1f(uT, s);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (visivel && !document.hidden) pedir();
  }
  function pedir() { if (!pedido) pedido = requestAnimationFrame(quadro); }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) pedir(); });

  // o primeiro par carrega antes de tudo; os outros em seguida
  (async () => {
    for (let k = 0; k < PARES.length; k++) {
      const [a, d] = await Promise.all([carregar(PARES[k].antes), carregar(PARES[k].depois)]);
      if (!a || !d) { caixa.classList.add('estatico'); return; }
      texs[k] = { a: textura(a), d: textura(d) };
      if (k === 0) { caixa.classList.add('pronto'); pedir(); }
    }
  })();
})();
