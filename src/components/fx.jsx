import { useEffect, useRef, useState } from 'react';

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Número que cuenta hacia arriba al aparecer. */
export function CountUp({ value, ms = 900 }) {
  const [n, setN] = useState(() => (reduced() ? value : 0));
  useEffect(() => {
    if (reduced()) { setN(value); return; }
    let raf, t0;
    const step = (t) => {
      if (t0 == null) t0 = t;
      const k = Math.min(1, (t - t0) / ms);
      setN(Math.round(value * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return <>{n}</>;
}

/** Barra fina de progreso de lectura bajo la barra superior. */
export function ScrollProgress() {
  const ref = useRef(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const k = h > 0 ? Math.min(1, window.scrollY / h) : 0;
      if (ref.current) ref.current.style.transform = `scaleX(${k})`;
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    const ro = new ResizeObserver(on);
    ro.observe(document.body);
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); ro.disconnect(); cancelAnimationFrame(raf); };
  }, []);
  return <div className="progress" aria-hidden="true"><div className="progress-bar" ref={ref} /></div>;
}
