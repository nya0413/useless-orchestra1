import { useEffect, useState } from 'react';
import { asset } from './Stage';
import { loopStart, loopStop } from './sfx';

export default function Floating({ onClick }: { onClick: () => void }) {
  const [open, setOpen] = useState(false);
  const [k, setK] = useState(1);
  useEffect(() => {
    const f = () => setK(Math.min(1.35, Math.max(0.55, (window.innerWidth / 2200) * 1.6)));
    f();
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);
  useEffect(() => {
    if (open) loopStart('return');
    else loopStop('return');
    return () => loopStop('return');
  }, [open]);
  return (
    <button
      aria-label="완성하기, 연주하러 가기"
      data-sfx="lp"
      onClick={onClick}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      className="fixed bottom-4 right-4 z-50 h-[150px] origin-bottom-right  cursor-pointer transition-[width] duration-500 ease-out"
      style={{ width: open ? 347 : 150, transform: `scale(${k})` }}
    >
      <span
        className="absolute top-[16px] right-0 h-[118px] overflow-hidden rounded-[20px] bg-ember transition-[width] duration-500 ease-out"
        style={{ width: open ? 288 : 0 }}
      >
        <span
          className="absolute left-[99px] top-1/2 -translate-y-1/2 whitespace-nowrap text-left text-[32px] leading-[1.4] text-black transition-opacity duration-300"
          style={{ opacity: open ? 1 : 0, transitionDelay: open ? '0.2s' : '0s' }}
        >
          완성!
          <br />
          연주하러 가기
        </span>
      </span>
      <span className="absolute left-0 top-0 size-[150px]">
        <img
          alt=""
          src={asset('4c8f9.png')}
          className={`absolute inset-0 size-full max-w-none ${open ? 'spin-mid' : ''}`}
        />
      </span>
    </button>
  );
}
