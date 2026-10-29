"""Favicons (A em serifa + traço vermelho) e og.jpg (antes/depois da rosa + frase).
Uso: python -I tools/marca.py"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
RAIZ = Path(__file__).resolve().parent.parent
def fonte(t):
    for f in ["georgia.ttf", "times.ttf", "arial.ttf"]:
        try: return ImageFont.truetype(f, t)
        except OSError: pass
for nome, lado in [("favicon-32.png", 32), ("favicon-192.png", 192), ("apple-touch-icon.png", 180)]:
    im = Image.new("RGB", (lado, lado), (16, 15, 14)); d = ImageDraw.Draw(im)
    f = fonte(int(lado * .78)); w = d.textlength("A", font=f)
    d.text(((lado - w) / 2, lado * .02), "A", font=f, fill=(239, 233, 224))
    d.rectangle([lado * .18, lado * .86, lado * .82, lado * .86 + max(1, lado // 32)], fill=(226, 50, 42))
    im.save(RAIZ / nome)
Image.open(RAIZ / "favicon-32.png").save(RAIZ / "favicon.ico", sizes=[(32, 32), (16, 16)])
og = Image.new("RGB", (1200, 630), (16, 15, 14)); d = ImageDraw.Draw(og)
for i, k in enumerate(["rosa-antes", "rosa-depois"]):
    og.paste(Image.open(RAIZ / "assets" / "p" / f"{k}-640.webp").convert("RGB").resize((280, 350)), (620 + i * 290, 140))
d.rectangle([620 + 280 + 3, 140, 620 + 290 - 3, 490], fill=(226, 50, 42))
d.text((70, 150), "Cobertura não", font=fonte(64), fill=(239, 233, 224))
d.text((70, 225), "precisa parecer", font=fonte(64), fill=(239, 233, 224))
d.text((70, 300), "cobertura.", font=fonte(64), fill=(239, 233, 224))
d.text((72, 420), "ALLAN MINE · CURITIBA", font=fonte(24), fill=(255, 90, 74))
d.text((620, 505), "Antes", font=fonte(22), fill=(163, 154, 143)); d.text((910, 505), "Depois", font=fonte(22), fill=(163, 154, 143))
og.save(RAIZ / "og.jpg", quality=86); print("ok")
