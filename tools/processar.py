"""Recorta as fotos escolhidas do Instagram (_ref/ig) em 4:5 e salva WebP em assets/p (640 e 1280 px).
FOTOS: chave -> (post, foto do carrossel, foco vertical 0..1).
PARES (antes e depois) usam o mesmo esquema. As texturas do hero saem de tools/hero.py.

Uso: python -I tools/processar.py
"""
from pathlib import Path
from PIL import Image, ImageOps

RAIZ = Path(__file__).resolve().parent.parent
IG = RAIZ.parent / "_ref" / "ig"
SAI = RAIZ / "assets" / "p"

# chave: (depois, antes)
PARES = {
    "rosa": ((7, 1, .45), (7, 2, .45)),
    "borboleta-colorida": ((43, 1, .4), (43, 2, .4)),
    "escorpiao": ((54, 5, .4), (54, 3, .45)),
    "borboleta": ((2, 1, .45), (2, 2, .45)),
    "nome": ((42, 1, .45), (42, 2, .5)),
    "leao": ((47, 1, .4), (48, 2, .45)),
    "costas": ((53, 1, .4), (53, 2, .45)),
}
FOTOS = {
    "mandala-mao": (1, 1, .4), "girassol": (4, 1, .45), "floral-braco": (5, 1, .45), "buda": (8, 1, .4),
    "cogumelos": (9, 1, .5), "coruja": (11, 1, .45), "flor-sombra": (12, 1, .5), "ampulheta": (13, 1, .45),
    "costela-floral": (16, 1, .4), "fechamento-floral": (17, 1, .45), "quadril-floral": (19, 1, .45),
    "margaridas": (23, 1, .5), "perna-floral": (33, 1, .4), "girassol-tornozelo": (37, 1, .5),
    "antebraco-floral": (39, 1, .45), "leopardo": (49, 6, .45), "passaro": (83, 3, .45),
    "fechamento": (101, 1, .4), "cobra": (105, 1, .5), "braco-floral": (108, 1, .4),
    "rosa-ombro": (117, 1, .45), "onca": (119, 1, .5), "lotus-mandala": (111, 1, .45),
    # processo: desenho à mão livre com caneta vermelha direto na pele
    "risco-passaro": (83, 1, .45), "risco-escorpiao": (54, 2, .45), "risco-peito": (74, 2, .45),
    # o pontilhismo freehand que ganhou troféu (foto do cliente com o troféu)
    "trofeu": (102, 1, 0),
    # retrato dele (capa do reel de 05/09/2026)
    "allan": ("020_*_1_v.jpg", 0, .25),
}


def achar(n, k):
    if isinstance(n, str):
        return next(IG.glob(n))
    for f in IG.glob(f"{n:03d}_*_{k}.jpg"):
        return f
    raise SystemExit(f"post {n} foto {k} não encontrado")


def recorte(n, k, fy):
    im = ImageOps.exif_transpose(Image.open(achar(n, k))).convert("RGB")
    w, h = im.size
    if w / h > .8:
        nw = int(h * .8); x = (w - nw) // 2; return im.crop((x, 0, x + nw, h))
    nh = int(w / .8); y = int((h - nh) * fy); return im.crop((0, y, w, y + nh))


def salvar(im, nome):
    im.resize((640, 800), Image.LANCZOS).save(SAI / f"{nome}-640.webp", quality=80, method=6)
    g = min(1280, im.width)
    im.resize((g, int(g / .8)), Image.LANCZOS).save(SAI / f"{nome}-g.webp", quality=80, method=6)


def main():
    SAI.mkdir(parents=True, exist_ok=True)
    for chave, (n, k, fy) in FOTOS.items():
        salvar(recorte(n, k, fy), chave)
    for i, (chave, (dep, ant)) in enumerate(PARES.items()):
        d, a = recorte(*dep), recorte(*ant)
        salvar(d, f"{chave}-depois"); salvar(a, f"{chave}-antes")
    print(len(FOTOS), "fotos,", len(PARES), "pares")


if __name__ == "__main__":
    main()
