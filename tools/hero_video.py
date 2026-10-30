"""Renderiza o hero como vídeo (assets/hero/hero.mp4), quadro a quadro, a partir das texturas de tools/hero.py.
Por sequência: antes (pele com a tatuagem antiga) → o risco vermelho se desenha traço a traço (mapa "tempo")
→ pausa → cortina com a linha vermelha descendo revela a cobertura pronta → pausa → cortina para a próxima sequência.
Cortina em vez de dissolução: as fotos têm enquadramentos diferentes e a dissolução criava dupla exposição.
Vídeo em vez de WebGL ao vivo: fica igual em qualquer aparelho, sem depender da placa de vídeo.
Os tempos (FASES) também vão para assets/hero/fases.json, que a legenda do site usa.

Uso: python -I tools/hero_video.py
"""
from pathlib import Path
import json, subprocess, shutil
import numpy as np, cv2
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
H = RAIZ / "assets" / "hero"
SEQ = ["passaro", "escorpiao"]
FPS = 30
L, A = 720, 924                 # saída (proporção .78 das fotos)
T_ANTES, T_RISCO, T_PAUSA, T_FUNDE, T_FINAL, T_TROCA = 1.4, 4.2, .8, 1.3, 3.6, 1.0
VERM = np.array([1.0, .29, .24], np.float32)


def carregar(nome):
    abre = lambda s, m="RGB": np.asarray(Image.open(H / f"{nome}-{s}").convert(m)).astype(np.float32)
    return abre("limpo.webp") / 255, abre("risco.webp") / 255, abre("tempo.png", "L") / 255, abre("final.webp") / 255


def zoom(img, z):
    h, w = img.shape[:2]
    ch, cw = int(h / z), int(w / z)
    y, x = (h - ch) // 2, (w - cw) // 2
    return cv2.resize(img[y:y + ch, x:x + cw], (L, A), interpolation=cv2.INTER_AREA)


def suave(x):
    x = min(max(x, 0.0), 1.0)
    return x * x * (3 - 2 * x)


def cortina(a, b, f, linha=True):
    """Troca a por b de cima para baixo; borda macia e, opcionalmente, a linha vermelha na frente."""
    h = a.shape[0]
    y = np.arange(h, dtype=np.float32)[:, None, None]
    frente = f * (h + 40) - 20
    m = np.clip((frente - y) / 14 + .5, 0, 1)
    out = a * (1 - m) + b * m
    if linha and 0 < f < 1:
        brilho = np.clip(1 - np.abs(y - frente) / 3.5, 0, 1)
        out = out * (1 - brilho) + VERM * brilho
        out = np.clip(out + VERM * np.clip(1 - np.abs(y - frente) / 26, 0, 1) * .12, 0, 1)
    return out


def quadro_seq(dados, s, dur):
    """Quadro da sequência no instante s (sem a troca para a próxima)."""
    limpo, risco, tp, fim = dados
    eh = tp < .999
    z = 1.0 + .05 * (s / dur)
    if s < T_ANTES:
        img = limpo
    elif s < T_ANTES + T_RISCO + T_PAUSA:
        p = min(1.0, (s - T_ANTES) / T_RISCO)
        d = (np.clip((p - tp) / .014, 0, 1) * eh)[..., None]
        img = limpo * (1 - d) + risco * d
        if p < 1:
            ponta = (np.clip(1 - np.abs(tp - p) / .025, 0, 1) * eh)[..., None]
            img = np.clip(img + np.array([1, .42, .32]) * ponta * .45, 0, 1)
    else:
        f = suave((s - T_ANTES - T_RISCO - T_PAUSA) / T_FUNDE)
        img = cortina(risco, fim, f)
    return zoom(img, z)


def main():
    dados = [carregar(n) for n in SEQ]
    dur = T_ANTES + T_RISCO + T_PAUSA + T_FUNDE + T_FINAL      # cada sequência
    total = dur * len(SEQ)
    tmp = RAIZ.parent / "_ref" / "quadros-hero"
    shutil.rmtree(tmp, ignore_errors=True); tmp.mkdir(parents=True)
    n = int(round(total * FPS))
    vinheta = None
    for k in range(n):
        t = k / FPS
        i = int(t // dur) % len(SEQ); s = t - i * dur
        img = quadro_seq(dados[i], s, dur)
        # troca: o fim desta sequência dissolve no começo da próxima (o vídeo fecha o loop sem emenda)
        if s > dur - T_TROCA:
            j = (i + 1) % len(SEQ)
            f = suave((s - (dur - T_TROCA)) / T_TROCA)
            img = cortina(img, quadro_seq(dados[j], 0, dur), f, linha=False)
        if vinheta is None:
            yy, xx = np.mgrid[0:A, 0:L]
            vinheta = (1 - (((xx / L - .5) ** 2 + (yy / A - .5) ** 2) * .35))[..., None]
        out = np.clip(img * vinheta, 0, 1)
        Image.fromarray((out * 255).astype(np.uint8)).save(tmp / f"{k:05d}.png")
    mp4 = H / "hero.mp4"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", str(tmp / "%05d.png"),
                    "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-pix_fmt", "yuv420p", "-profile:v", "high",
                    "-movflags", "+faststart", "-an", str(mp4)], check=True)
    # poster: a cobertura pronta da primeira sequência (aparece se o vídeo não tocar)
    Image.open(tmp / f"{int((dur - T_TROCA - .5) * FPS):05d}.png").save(H / "hero-poster.webp", quality=82)
    fases = {"duracao": dur, "seq": len(SEQ),
             "antes": T_ANTES, "risco": T_ANTES + T_RISCO + T_PAUSA, "final": dur}
    (H / "fases.json").write_text(json.dumps(fases), encoding="utf-8")
    shutil.rmtree(tmp)
    print("hero.mp4", round(mp4.stat().st_size / 1e6, 2), "MB,", n, "quadros,", round(total, 1), "s")


if __name__ == "__main__":
    main()
