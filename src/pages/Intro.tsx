import { useEffect, useRef, useState } from 'react';
import Stage, { asset } from '../Stage';
import BgmToggle from '../BgmToggle';
import { loopStart, loopStop } from '../sfx';

type Item = {
  file: string;
  l: number;
  r: number;
  top: number;
  aspect: number;
  hyp: [number, number, number, number];
  rot: number;
  alt: number;
  dur: number;
  crop?: [number, number, number, number];
  blend?: boolean;
  full?: boolean;
};

const ITEMS: Item[] = [
  { file: 'a9221.png', l: 0, r: 0.7299, top: 490.9, aspect: 403.37 / 387.83, hyp: [28.6255, 67.0244, 71.3745, -32.9756], rot: -23.95, crop: [183.37, -9.27, -41.69, 132.45], alt: -15, dur: 1.00 },
  { file: '6937b.png', l: 0.7083, r: 0.0669, top: 427, aspect: 335.73 / 376.47, hyp: [33.2906, 77.0896, 66.7094, -22.9104], rot: -21.06, alt: 0, dur: 1.17 },
  { file: '2449b.png', l: 0.0293, r: 0.8659, top: 168, aspect: 156.57 / 140.27, hyp: [13.1463, 82.8226, 86.8537, -17.1774], rot: -10.05, crop: [117.06, 0, 0, 100], alt: -30, dur: 1.34 },
  { file: '41746.png', l: 0.49, r: 0.394, top: 621, aspect: 173.33 / 152.07, hyp: [-14.3411, 80.0674, 85.6589, 19.9326], rot: 11.54, crop: [147.68, -10.55, -18.35, 121.11], alt: 0, dur: 1.51 },
  { file: '638b4.png', l: 0.8067, r: 0, top: 137.47, aspect: 288.67 / 249.5, hyp: [87.5258, 17.7743, 12.4742, -82.2257], rot: -80.04, crop: [116.47, -21.72, 0, 143.44], alt: -90, dur: 1.68 },
  { file: '6c40b.png', l: 0.49, r: 0.3719, top: 38, aspect: 206.26 / 186.28, hyp: [11.4903, 85.4005, 88.5097, -14.5995], rot: -8.47, crop: [114.75, 0, 0, 100], alt: 15, dur: 1.85 },
  { file: 'door-intro.png', l: 0.1002, r: 0.7623, top: 0, aspect: 205.26 / 319, hyp: [-23.0733, 92.0135, 76.9267, 7.98654], rot: 0, alt: -9.17, blend: true, full: true, dur: 2.02 },
];

const CW = 1493.32;

function Scatter({ item }: { item: Item }) {
  const W = CW * (1 - item.l - item.r);
  const H = W / item.aspect;
  const [a, b, c, d] = item.hyp;
  const ih = item.full ? H : Math.hypot((a * W) / 100, (b * H) / 100);
  const iw = item.full ? W : Math.hypot((c * W) / 100, (d * H) / 100);
  return (
    <div
      className="absolute flex items-center justify-center"
      style={{ left: CW * item.l, top: item.top, width: W, height: H, mixBlendMode: item.blend ? 'darken' : undefined }}
    >
      <div
        className="relative flex-none wiggle"
        style={{ width: iw, height: ih, ['--r0' as string]: `${item.rot}deg`, ['--r1' as string]: `${item.alt}deg`, animationDuration: `${item.dur}s`, }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {item.crop ? (
            <img
              alt=""
              className="absolute max-w-none"
              style={{ height: `${item.crop[0]}%`, left: `${item.crop[1]}%`, top: `${item.crop[2]}%`, width: `${item.crop[3]}%` }}
              src={asset(item.file)}
            />
          ) : (
            <img alt="" className={`absolute inset-0 size-full max-w-none ${item.full ? "object-contain" : "object-cover"}`} src={asset(item.file)} />
          )}
        </div>
      </div>
    </div>
  );
}

const STEPS = [
  { t: '소리를 골라요', d: '마음에 드는 소리를 눌러  추가합니다', x: 120 },
  { t: '칸에 놓아요', d: '원하는 박자 칸을 눌러 소리를 놓을 수 있습니다', x: 528 },
  { t: '재생하고 이름 붙여요', d: '내 음악을 듣고 제목을 지어보세요', x: 936 },
];

export default function Intro({ onDone, muted, onToggleBgm }: { onDone: () => void; muted: boolean; onToggleBgm: () => void }) {
  const [phase, setPhase] = useState<'idle' | 'converge'>('idle');
  const [hover, setHover] = useState(false);
  useEffect(() => {
    if (hover || phase === 'converge') loopStart('return');
    else loopStop('return');
    return () => loopStop('return');
  }, [hover, phase]);

  useEffect(() => {
    if (phase !== 'converge') return;
    const t = setTimeout(onDone, 1500);
    return () => clearTimeout(t);
  }, [phase, onDone]);

  const go = phase === 'converge';
  const flowRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = flowRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.intersectionRatio >= 0.35) setShown(true);
        else if (e.intersectionRatio === 0) setShown(false);
      },
      { threshold: [0, 0.35] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="flex min-h-dvh flex-col justify-center bg-paper">
    <Stage height={900} fit>
      <BgmToggle
        muted={muted}
        onToggle={onToggleBgm}
        className="rounded-[10px]"
        imgStyle={{ marginTop: 5, top: 14, right: 519, bottom: 14 }}
      />
      <div
        className="absolute"
        style={{
          left: 15,
          top: 30,
          width: CW,
          height: 879,
          transformOrigin: '696px 338px',
          transform: go ? 'scale(0.03) rotate(200deg)' : 'none',
          opacity: go ? 0 : 1,
          transition: 'transform 1s cubic-bezier(.7,0,.9,.4), opacity 1s ease-in',
        }}
      >
        {ITEMS.map((it) => (
          <Scatter key={it.file} item={it} />
        ))}
      </div>

      <p className="absolute left-[44px] top-[390px] w-[28px] h-[119px] flex items-center justify-center">
        <span className="-rotate-90 whitespace-nowrap font-display text-[20px] text-ink-soft">Noh Yun Ah</span>
      </p>

      {(['Use', 'Less', 'Orchestra'] as const).map((w) => (
        <p
          key={w}
          className="absolute -translate-x-1/2 whitespace-nowrap text-center font-display text-[128px] leading-[1.4]"
          style={{ left: w === 'Use' ? 484 : w === 'Less' ? 976 : 720.5, top: w === 'Orchestra' ? 443 : 279 }}
        >
          {w}
        </p>
      ))}

      <button
        aria-label="시작하기"
        data-sfx="lp"
        disabled={go}
        onClick={() => setPhase('converge')}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="absolute -translate-x-1/2 -translate-y-1/2 size-[150px] cursor-pointer"
        style={{ left: 711, top: 368 }}
      >
        <img
          alt=""
          src={asset('4c8f9.png')}
          className={`absolute inset-0 size-full max-w-none ${go ? 'spin-fast' : hover ? 'spin-mid' : ''}`}
        />
      </button>

      <p
        className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-ko text-[24px]"
        style={{ top: 627 }}
      >
        "쓸모없는 소리들이 오케스트라가 된다"
      </p>

      <div className="transition-opacity duration-700" style={{ opacity: go ? 0 : 1 }}>
        <p className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-display text-[24px]" style={{ top: 853 }}>
          How to Play
        </p>
      </div>
    </Stage>
    <div ref={flowRef}>
    <Stage height={230} flow>
      <div className="transition-opacity duration-700" style={{ opacity: go ? 0 : 1 }}>
        {STEPS.map((s, i) => (
          <div
            key={s.t}
            className="absolute h-[150px] w-[384px] rounded-[10px] bg-white text-center text-ink-soft font-note"
            style={{
              left: s.x,
              top: 30,
              opacity: shown ? 1 : 0,
              transform: shown ? 'none' : 'translateY(70px) scale(0.92)',
              transition: `opacity .8s ease-out ${i * 0.18}s, transform .9s cubic-bezier(.2,.9,.3,1.15) ${i * 0.18}s`,
            }}
          >
            <p className="absolute left-0 right-0 top-[30px] text-[22px] leading-[1.4]">
              {i + 1}. {s.t}
            </p>
            <p className="absolute left-0 right-0 top-[88px] whitespace-pre text-[17px] leading-[1.4]">{s.d}</p>
          </div>
        ))}
      </div>
    </Stage>
    </div>
    </div>
  );
}
