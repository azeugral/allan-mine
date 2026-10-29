"""Texturas do hero a partir das fotos de risco do próprio Allan (caneta vermelha à mão livre sobre a pele).
Para cada sequência:
  limpo  = a foto do risco com o vermelho apagado por inpainting (a tatuagem antiga / a pele antes do desenho)
  risco  = a foto original (com o vermelho)
  tempo  = PNG cinza: para cada pixel vermelho, quando ele é desenhado (0..254), pela distância ao longo do traço;
           255 = não é risco. Os traços entram em ordem, de cima para baixo, como a mão desenhando.
  final  = a tatuagem pronta (outro post do mesmo trabalho)
Tudo no mesmo recorte (RECORTE = proporção largura/altura), 1100 px de altura.

Uso: python -I tools/hero.py
"""
from pathlib import Path
import numpy as np, cv2
from PIL import Image, ImageOps
from skimage.graph import MCP_Geometric

RAIZ = Path(__file__).resolve().parent.parent
IG = RAIZ.parent / "_ref" / "ig"
SAI = RAIZ / "assets" / "hero"
ALT = 1100
RECORTE = .78

SEQ = {
    # nome: (risco, final, foco_x risco, foco_x final, (saturação, brilho, vermelho acima de g/b) mínimos)
    "escorpiao": ("054_*_2.jpg", "054_*_5.jpg", .45, .5, (100, 85, 56)),
    "passaro": ("083_*_1.jpg", "083_*_3.jpg", .5, .55, (85, 70, 42)),
}


def abrir(padrao, fx):
    im = ImageOps.exif_transpose(Image.open(next(IG.glob(padrao)))).convert("RGB")
    w, h = im.size
    alvo = RECORTE
    if w / h > alvo:
        nw = int(h * alvo); x = int((w - nw) * fx); im = im.crop((x, 0, x + nw, h))
    else:
        nh = int(w / alvo); y = (h - nh) // 2; im = im.crop((0, y, w, y + nh))
    return np.asarray(im.resize((int(ALT * alvo), ALT), Image.LANCZOS))


def mascara_vermelha(a, lim):
    ms, mv, md = lim
    hsv = cv2.cvtColor(a, cv2.COLOR_RGB2HSV)
    hh, s, v = hsv[..., 0].astype(int), hsv[..., 1].astype(int), hsv[..., 2].astype(int)
    r, g, b = a[..., 0].astype(int), a[..., 1].astype(int), a[..., 2].astype(int)
    m = ((hh < 7) | (hh > 170)) & (s > ms) & (v > mv) & (r - np.maximum(g, b) > md)
    m = cv2.morphologyEx(m.astype(np.uint8), cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    keep = np.isin(lab, [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] >= 25])
    return keep


def tempo(m):
    """Ordem de desenho: componentes por y do topo; dentro de cada um, distância geodésica desde o ponto mais alto."""
    n, lab, st, _ = cv2.connectedComponentsWithStats(m.astype(np.uint8), 8)
    comps = sorted(range(1, n), key=lambda i: st[i, cv2.CC_STAT_TOP] + .3 * st[i, cv2.CC_STAT_LEFT])
    out = np.full(m.shape, 255, np.uint8)
    custo = np.where(m, 1.0, np.inf)
    mcp = MCP_Geometric(custo)
    N = len(comps)
    for k, i in enumerate(comps):
        ys, xs = np.where(lab == i)
        j = np.argmin(ys)
        dist, _ = mcp.find_costs([(ys[j], xs[j])])
        d = dist[ys, xs]
        d = d / max(d.max(), 1)
        ini = k / max(N, 1) * .72                          # componentes entram escalonados
        dur = .28 + .12 * min(1, st[i, cv2.CC_STAT_AREA] / 4000)
        out[ys, xs] = np.clip((ini + d * dur) * 254, 0, 254).astype(np.uint8)
    return out


def main():
    SAI.mkdir(parents=True, exist_ok=True)
    for nome, (pr, pf, fxr, fxf, lim) in SEQ.items():
        a = abrir(pr, fxr)
        m = mascara_vermelha(a, lim)
        mi = cv2.dilate(m.astype(np.uint8) * 255, np.ones((5, 5), np.uint8))
        limpo = cv2.inpaint(cv2.cvtColor(a, cv2.COLOR_RGB2BGR), mi, 7, cv2.INPAINT_TELEA)
        limpo = cv2.cvtColor(limpo, cv2.COLOR_BGR2RGB)
        # só na área reconstruída: suaviza as manchas do inpainting (com borda macia para não marcar)
        suave = cv2.GaussianBlur(limpo, (0, 0), 3.2)
        peso = cv2.GaussianBlur(mi.astype(np.float32) / 255, (0, 0), 4)[..., None]
        limpo = (limpo * (1 - peso) + suave * peso).astype(np.uint8)
        t = tempo(cv2.dilate(m.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0)
        Image.fromarray(limpo).save(SAI / f"{nome}-limpo.webp", quality=84, method=6)
        Image.fromarray(a).save(SAI / f"{nome}-risco.webp", quality=84, method=6)
        Image.fromarray(t, "L").save(SAI / f"{nome}-tempo.png", optimize=True)
        Image.fromarray(abrir(pf, fxf)).save(SAI / f"{nome}-final.webp", quality=84, method=6)
        print(nome, a.shape, "pixels de risco:", int(m.sum()))


if __name__ == "__main__":
    main()
