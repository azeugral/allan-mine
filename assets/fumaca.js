/* Allan Mine · nanquim subindo no hero (modo 0) e no processo (modo 1, calmo). Base: a fumaça do
   Zaparolli, com o bafo de brasa trocado pelo vermelho da caneta com que o Allan risca a pele.
   Fumaça suave do hero (lado esquerdo) e versão calma. Tudo no shader,
   sem imagem: ruído com domínio torcido que SOBE (dois campos defasados meio ciclo, trocados por
   peso triangular, então o quadro da fase 2π é igual ao da fase 0 e o vídeo fecha sem emenda).
   Véus cinza quente, fios claros cor de osso que a fumaça estica e um bafo de brasa vermelha
   embaixo. Desenha sobre preto: a tela entra com mix-blend-mode: screen, então o preto some
   e só a fumaça clareia o que está atrás (no desktop e nos MP4 do toque, que não têm alfa).
   fumacaGL(canvas, {modo, forca}) -> {tamanho(w,h), desenhar(fase)}
   modo 0 = hero (nasce embaixo à esquerda e some antes da arte); modo 1 = calma (rente às bordas);
   modo 2 = celular (no alto, por cima da arte; o vídeo é invertido e vira fumaça preta).
   O mesmo arquivo gera os MP4 em tools/gerar_fumaca.py. */
(function (g) {
  const VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  const FS = `
precision highp float;
uniform vec2 uRes; uniform float uFase; uniform float uModo; uniform float uForca;
#define TAU 6.28318530718
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float ruido(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*ruido(p);p=rot(.55)*p*2.03+vec2(1.7,9.2);a*=.5;}return s;}

/* um campo de fumaça subindo "sobe" unidades; c gira em círculo e torce sem emendar */
vec3 campo(vec2 p, float sobe, vec2 c){
  vec2 q=p+vec2(0.,-sobe);
  vec2 w=vec2(fbm(q*.8+c*.18),fbm(q*.8+vec2(5.2,1.3)-c.yx*.18));
  vec2 w2=vec2(fbm(q+w*1.4+vec2(1.7,9.2)),fbm(q+w*1.4+vec2(8.3,2.8)));
  float f=fbm(q*1.05+w2*1.3);
  /* fios: onde o ruído torcido cruza o meio, linha fina e comprida */
  float fio=pow(1.-abs(fbm(q*1.4+w2*1.8+w)*2.-1.),6.);
  return vec3(f,fio,length(w2-w));
}

void main(){
  vec2 fc=gl_FragCoord.xy;
  vec2 c01=fc/uRes;
  float esc=min(uRes.x,uRes.y);
  vec2 p=fc/esc*vec2(1.25,1.05);
  vec2 c=vec2(cos(uFase),sin(uFase));

  /* sobe sem fim: dois campos meio ciclo fora de fase, peso triangular */
  float t=uFase/TAU;
  float fa=fract(t), fb=fract(t+.5);
  vec3 A=campo(p,fa*.8,c), B=campo(p+vec2(3.7,1.9),fb*.8,c);
  float wa=1.-abs(fa*2.-1.);
  vec3 F=mix(B,A,wa);

  /* onde a fumaça mora */
  float zona;
  if(uModo<.5){
    /* hero: coluna à esquerda, mais densa embaixo, morre antes da arte */
    float lado=1.-smoothstep(.12,.62,c01.x);
    float baixo=mix(.8,1.,smoothstep(.95,.05,c01.y));
    zona=lado*baixo;
  }else if(uModo>1.5){
    /* celular (vira fumaça preta no vídeo invertido): passa por cima da arte, no alto da tela,
       e some antes do logo e dos botões, que ficam embaixo (o vídeo sai espelhado: o canto
       carregado fica à esquerda) */
    float alto=smoothstep(.4,.68,c01.y);
    float bordas=.55+.45*smoothstep(.15,.5,abs(c01.x-.5));
    zona=alto*bordas;
  }else{
    /* calma: rente às laterais e ao pé da seção, centro livre para o conteúdo */
    float ld=1.-smoothstep(.0,.32,min(c01.x,1.-c01.x));
    float pe=1.-smoothstep(.0,.38,c01.y);
    zona=clamp(ld*.85+pe*.6,0.,1.)*.9;
  }

  float veu=smoothstep(.3,.95,F.x*(.72+.45*zona)+zona*.12)*zona;
  float denso=smoothstep(.55,.98,F.x+zona*.1)*veu;
  float fio=F.y*smoothstep(.04,.5,veu+zona*.2)*zona;
  /* bolsões escuros onde o fluxo dobra: a fumaça fica pesada, não lisa */
  float bolsao=smoothstep(.38,.12,F.z);

  vec3 cinza=vec3(.40,.38,.35), osso=vec3(.93,.89,.84), brasa=vec3(.89,.15,.11);
  vec3 col=cinza*pow(veu,1.2)*.85+osso*denso*.4+osso*fio*.3;
  col*=1.-bolsao*.35;
  /* bafo de brasa embaixo, só no hero */
  float quente=max(0.,1.-uModo)*(1.-smoothstep(.0,.45,c01.y))*(1.-smoothstep(.0,.42,c01.x));
  col+=brasa*quente*(veu*.6+.05)*.45;
  /* alguns fios ficam vermelhos, como o traço da caneta */
  col+=brasa*fio*zona*smoothstep(.45,.9,F.x)*.55;
  col*=uForca;

  /* dither leve para o gradiente escuro não fazer degrau */
  col+=(fract(52.9829189*fract(dot(fc,vec2(.06711056,.00583715))))-.5)*.006;
  gl_FragColor=vec4(max(col,0.),1.);
}`;

  g.fumacaGL = function (cv, op = {}) {
    const gl = cv.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: !!op.preserveDrawingBuffer, powerPreference: 'low-power' });
    if (!gl) return null;
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(o); return o; };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(pr); gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    const u = n => gl.getUniformLocation(pr, n);
    const uR = u('uRes'), uF = u('uFase');
    gl.uniform1f(u('uModo'), op.modo || 0);
    gl.uniform1f(u('uForca'), op.forca ?? 1);
    return {
      tamanho(w, h) { cv.width = w; cv.height = h; },
      desenhar(fase) {
        gl.viewport(0, 0, cv.width, cv.height);
        gl.uniform2f(uR, cv.width, cv.height); gl.uniform1f(uF, fase);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };
  };
})(window);
