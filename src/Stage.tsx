import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

export const asset = (f: string) => `${import.meta.env.BASE_URL}assets/${f}`;

type Props = { height: number; children: ReactNode; flow?: boolean; width?: number; fit?: boolean; minScale?: number };

export default function Stage({ height, children, flow, width = 1440, fit, minScale }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [m, setM] = useState({ scale: 1, w: width });
  useLayoutEffect(() => {
    const el = ref.current!;
    const calc = () => {
      const w = el.clientWidth;
      let scale = w / width;
      if (minScale) scale = Math.max(scale, Math.min(minScale, w / 1280));
      if (fit) scale = Math.min(scale, window.innerHeight / height);
      setM({ scale, w });
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    window.addEventListener('resize', calc);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', calc);
    };
  }, [width, height, fit, minScale]);
  const { scale, w } = m;
  return (
    <div className={`page-in w-full overflow-hidden bg-paper flex flex-col ${flow || fit ? '' : 'min-h-dvh justify-center'}`}>
      <div ref={ref} className="relative w-full" style={{ height: height * scale }}>
        <div
          className="absolute top-0 origin-top-left"
          style={{ left: (w - width * scale) / 2, width, height, transform: `scale(${scale})` }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
