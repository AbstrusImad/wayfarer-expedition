'use client';

import { useEffect, useRef } from 'react';

// Animated topographic contour field — drifting concentric ridge lines that
// evoke a survival map. devicePixelRatio-aware and paused when the tab hides.
export function HeroCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let t = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const peaks = [
      { x: 0.22, y: 0.35 },
      { x: 0.72, y: 0.6 },
      { x: 0.48, y: 0.18 },
    ];

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      for (let p = 0; p < peaks.length; p++) {
        const cx = peaks[p].x * w;
        const cy = peaks[p].y * h;
        const rings = 16;
        for (let r = 0; r < rings; r++) {
          const base = 26 + r * 30;
          const wobble = Math.sin(t * 0.012 + r * 0.5 + p) * 6;
          const radius = base + wobble;
          const alpha = 0.06 + (1 - r / rings) * 0.1;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(240, 168, 48, ${alpha})`;
          ctx.ellipse(cx, cy, radius, radius * 0.62, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      // sweeping highlight line (radar-ish)
      const sweepY = ((t * 0.6) % (h + 80)) - 40;
      const grad = ctx.createLinearGradient(0, sweepY - 30, 0, sweepY + 30);
      grad.addColorStop(0, 'rgba(240,168,48,0)');
      grad.addColorStop(0.5, 'rgba(240,168,48,0.10)');
      grad.addColorStop(1, 'rgba(240,168,48,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, sweepY - 30, w, 60);

      t += 1;
      raf = requestAnimationFrame(draw);
    };

    const start = () => {
      cancelAnimationFrame(raf);
      if (!reduced) raf = requestAnimationFrame(draw);
      else draw();
    };
    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else start();
    };

    resize();
    start();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
}
