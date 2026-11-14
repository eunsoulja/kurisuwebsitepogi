/* halo + bloom + tile wall background for the carousel */
export interface HaloWall {
  halos(now: number, vv: number, pos: number): void;
  wall(t: number, pos: number, step: number, CY: number): void;
  wsize(): void;
  hzSize(CW: number, VW: number, vh: number): void;
}

export function createHaloWall(
  bgL: HTMLElement,
  AC: [number, number, number][],
  WI: (HTMLImageElement | null)[],
  imgOK: (k: number) => boolean,
  cl: (x: number, a?: number, b?: number) => number,
): HaloWall {
  const hz = document.createElement("div"); hz.className = "hz";
  const bloom = document.createElement("div"); bloom.className = "bloom";
  const wc = document.createElement("canvas"); wc.id = "wall"; bgL.append(hz, bloom, wc); const wx = wc.getContext("2d")!;
  const HW = 224, HH = 126, HZ: HTMLCanvasElement[] = [], HX: CanvasRenderingContext2D[] = [], MZ: HTMLCanvasElement[] = [], MX: CanvasRenderingContext2D[] = [], HT: number[] = []; let HZW = 1900, HZH = 1070;
  AC.forEach(() => {
    const c = document.createElement("canvas"); c.width = HW; c.height = HH; hz.append(c); HZ.push(c); HX.push(c.getContext("2d")!);
    const m = document.createElement("canvas"); m.width = 32; m.height = 18; MZ.push(m); const mc = m.getContext("2d")!; mc.imageSmoothingQuality = "high"; MX.push(mc); HT.push(-1e3);
  });
  const hs = (i: number, j: number) => { let h = i * 374761393 + j * 668265263; h = (h ^ h >> 13) * 1274126177; return ((h ^ h >> 16) >>> 0) / 4294967295; };
  function wsize() { wc.width = Math.ceil(innerWidth / 2); wc.height = Math.ceil(innerHeight / 2); } wsize();
  function hzSize(CW: number, VW: number, vh: number) { const hw = Math.max(CW * 1.95, VW * 1.1, vh * 1.1 * 16 / 9); HZW = hw; HZH = hw * 9 / 16; hz.style.setProperty("--hw", hw.toFixed(0) + "px"); hz.style.setProperty("--hh", HZH.toFixed(0) + "px"); }
  function paintHalo(k: number, now: number, amp: number) {
    const x = HX[k], im = WI[k], A = AC[k];
    const g = x.createRadialGradient(HW * .5, HH * .5, 0, HW * .5, HH * .5, HW * .6); g.addColorStop(0, `rgba(${A[0]},${A[1]},${A[2]},.9)`); g.addColorStop(1, "rgba(5,5,5,1)");
    x.fillStyle = g; x.fillRect(0, 0, HW, HH);
    if (imgOK(k) && im) {
      const iw = im.naturalWidth, ih = im.naturalHeight, sc = Math.max(HW / iw, HH / ih) * 1.14, sw = HW / sc, sh = HH / sc, sx0 = (iw - sw) / 2, sy0 = (ih - sh) / 2, S = 14, hh = HH / S;
      for (let s = 0; s < S; s++) {
        const dx = Math.sin(now * .0007 + s * .9 + k * 2.1) * (1.2 + amp * 5) + Math.sin(now * .0019 + s * 1.7) * .6;
        x.drawImage(im, sx0, sy0 + s * sh / S, sw, sh / S, dx - 8, s * hh, HW + 16, hh + 1);
      }
    }
    MX[k].drawImage(HZ[k], 0, 0, 32, 18);
  }
  function halos(now: number, vv: number, pos: number) {
    const amp = cl(Math.abs(vv) * .3, 0, .6);
    HZ.forEach((c, k) => {
      const w = Math.max(0, 1 - Math.abs(pos - k));
      if (w < .01) { if (c.style.opacity !== "0") c.style.opacity = "0"; return; }
      if (now - HT[k] > 34) { HT[k] = now; paintHalo(k, now, amp); }
      c.style.opacity = w.toFixed(3);
      c.style.transform = `translate(-50%,-50%) translate3d(${(-(pos - k) * 70 - vv * 14).toFixed(1)}px,${(Math.sin(now * .0004 + k) * 8).toFixed(1)}px,0) scale(${(1.04 + .02 * Math.sin(now * .0003 + k * 2)).toFixed(3)})`;
    });
    const f = cl(Math.floor(pos), 0, AC.length - 1), q = cl(pos - f, 0, 1), A = AC[f], B = AC[Math.min(AC.length - 1, f + 1)];
    bloom.style.setProperty("--acc", A.map((v, i) => (v + (B[i] - v) * q) | 0).join(","));
  }
  function wall(t: number, pos: number, step: number, CY: number) {
    const w = wc.width, h = wc.height, L = AC.length - 1, f = cl(Math.floor(pos), 0, L), q = cl(pos - f, 0, 1);
    wx.clearRect(0, 0, w, h);
    const TC = 84, RW = 12, span = Math.PI * 2 / TC, off = -pos * step * Math.PI / 180 * .6, D = .26, NX = w * .5 / (Math.sin(.75) * (1 + D) / (Math.cos(.75) + D)), SY = h * .5, cyW = h * CY, X: number[] = [], K: number[] = [], C: number[] = [], V: boolean[] = [];
    for (let i = 0; i <= TC; i++) { let p = (i * span + off) % (Math.PI * 2); if (p > Math.PI) p -= Math.PI * 2; if (p < -Math.PI) p += Math.PI * 2;
      const cs = Math.cos(p), z = cs + D; V[i] = z > .18 && cs > -.3; K[i] = (1 + D) / z; X[i] = w / 2 + Math.sin(p) * K[i] * NX; C[i] = cs; }
    const Y = (j: number) => (j / RW - .5) * 2.1, yy = (i: number, j: number) => cyW + Y(j) * SY * K[i];
    const sk = w / innerWidth, hwW = HZW * sk, hhW = HZH * sk, l0 = w / 2 - hwW / 2, t0 = cyW - hhW / 2;
    wx.imageSmoothingEnabled = false;
    const mos = (k: number, al: number) => {
      if (al < .01) return; const src = MZ[k];
      for (let i = 0; i < TC; i++) {
        if (!V[i] || !V[i + 1] || X[i + 1] < -10 || X[i] > w + 10) continue;
        const cc = Math.max(0, (C[i] + C[i + 1]) / 2) * .85 + .15, u = cl((((X[i] + X[i + 1]) / 2 - l0) / hwW * 32) | 0, 0, 31);
        for (let j = 0; j < RW; j++) {
          const n = hs(i, j), fl = n * (.55 + .45 * Math.sin(t * .0009 * (1 + n) + n * 30)), ya = yy(i, j), yb = yy(i, j + 1), v = cl((((ya + yb) / 2 - t0) / hhW * 18) | 0, 0, 17);
          wx.globalAlpha = al * cc * (.18 + .6 * fl);
          wx.drawImage(src, u, v, 1, 1, X[i], ya, X[i + 1] - X[i] + .5, yb - ya + .5);
        }
      }
    };
    mos(f, 1 - q); if (q > .001) mos(f + 1, q);
    wx.globalAlpha = 1; wx.lineWidth = 1; wx.strokeStyle = "rgba(5,5,5,.5)";
    wx.beginPath();
    for (let i = 0; i <= TC; i++) { if (!V[i] || X[i] < -10 || X[i] > w + 10) continue; wx.moveTo(X[i], yy(i, 0)); wx.lineTo(X[i], yy(i, RW)); }
    for (let j = 0; j <= RW; j++) { let on = false; for (let i = 0; i <= TC; i++) { if (V[i]) { if (on) wx.lineTo(X[i], yy(i, j)); else wx.moveTo(X[i], yy(i, j)); on = true; } else on = false; } }
    wx.stroke();
    for (let i = 0; i < TC; i += 3) {
      if (!V[i] || X[i] < -10 || X[i] > w + 10) continue; const cc = Math.max(0, C[i]) * .85 + .15; wx.fillStyle = `rgba(255,255,255,${(.28 * cc).toFixed(2)})`;
      for (let j = 0; j < RW; j += 2) { const cx = X[i], cy = yy(i, j); wx.fillRect(cx - 2, cy, 5, 1); wx.fillRect(cx, cy - 2, 1, 5); }
    }
  }
  return { halos, wall, wsize, hzSize };
}
