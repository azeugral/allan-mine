# Allan Mine · Cobertura de tatuagem

Prévia do site do Allan Mine ([@allan.mine](https://www.instagram.com/allan.mine/)), tatuador há mais de 10 anos em Curitiba, especialista em cobertura.

Publicado em https://azeugral.github.io/allan-mine/ (com `noindex` até a aprovação).

## Página

Uma página editorial (`index.html`), com animações em GSAP ScrollTrigger (cdnjs):
- **Hero:** "Cobertura não precisa parecer cobertura." ao lado do processo real dele, em vídeo (`assets/hero/hero.mp4`, renderizado por `tools/hero_video.py`; a legenda das fases fica em `assets/hero.js`). Mostra a tatuagem antiga, o risco vermelho à mão livre se desenhando traço a traço e a cortina com a linha vermelha revelando a cobertura pronta. As texturas saem de `tools/hero.py`, que apaga o vermelho das fotos de risco por inpainting e calcula a ordem do traço pela distância geodésica. São duas sequências, andorinha e escorpião. Se mudar os tempos no `hero_video.py`, copie o `assets/hero/fases.json` para os `data-*` de `#hero-tela` no `index.html`.
- **Riscados:** frases ("O nome do ex.", "A borboleta dos 15 anos."...) riscadas em vermelho conforme a rolagem.
- **Antes e depois:** galeria horizontal fixada na tela (no celular, carrossel nativo), com o antes em polaroid e falas tiradas das legendas dele.
- **Processo:** a andorinha pronta cobre o risco conforme os passos avançam.
- **Cicatrizes:** bloco vermelho.
- **Trabalhos:** colagem em três colunas com parallax e foto ampliada.
- **Sobre:** retrato em duotone com contadores.
- **Orçamento:** formulário que manda a mensagem pronta para o WhatsApp.
- **Rodapé:** o nome em tamanho grande.

## Identidade

Nanquim `#0d0c0b`, papel de estêncil `#ebe4d8` e o vermelho `#e3261c` da caneta com que ele risca. Gloock nos títulos, Instrument Sans no texto e IBM Plex Mono nos rótulos. Grão de papel na página toda. Ele não tem logo: o nome é composto em Gloock.

## Ferramentas

```
python -I tools/processar.py  # fotos 4:5 a partir de ../_ref/ig
python -I tools/hero.py       # texturas do hero (limpo, risco, tempo, final)
python -I tools/hero_video.py # vídeo do hero, pôster e fases.json (precisa de ffmpeg)
python -I tools/marca.py      # favicons (o og.jpg da v2 foi feito à parte, com o hero)
```

## CONFIRMAR antes do domínio

- [ ] **WhatsApp:** 41 9987-3760, tirado do bio.site dele, onde está com 8 dígitos. Conferir se o número certo tem o 9 na frente.
- [ ] **Endereço:** o site só diz "Curitiba". Confirmar se ele atende no Inédita Café e Arte (post de 17/08) e o endereço.
- [ ] **Cicatrizes:** o texto é genérico, a partir do destaque "Cicatrizes". Confirmar quais tipos ele aceita e o tempo mínimo de cicatrização.
- [ ] **Pares de antes e depois:** conferir se cada antes corresponde ao depois (leão: o antes é de outro post do mesmo dia).
- [ ] **Foto do Sobre:** é a capa de um reel. Pedir um retrato melhor.
- [ ] **Valores e forma de pagamento**, se ele quiser mostrar.
- [ ] Domínio (sugestão: allanmine.com.br) e remover o `noindex`.

Site por [L R G Z](https://lrgz.com.br).
