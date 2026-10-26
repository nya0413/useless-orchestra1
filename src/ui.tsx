import { asset } from './Stage';
import { customName } from './audio';

export const LIB = [
  { id: 'keyboard', name: '키보드 타자', short: '키보드 타자' },
  { id: 'water', name: '수도꼭지', short: '수도꼭지' },
  { id: 'oven', name: '전자레인지', short: '전자레인지' },
  { id: 'cat', name: '고양이', short: '고양이' },
  { id: 'pot', name: '냄비 두드리기', short: '냄비' },
  { id: 'zipper', name: '지퍼 올리기', short: '지퍼' },
  { id: 'door', name: '문 닫기', short: '문 닫기' },
] as const;

const ICONS: Record<string, { file: string; box: string; img: string }> = {
  keyboard: { file: 'icon-keyboard.png', box: 'absolute inset-0', img: '' },
  water: { file: 'deb1e.svg', box: 'absolute inset-[12.5%]', img: '' },
  oven: { file: 'e3963.svg', box: 'absolute inset-0', img: '' },
  cat: { file: '36153.svg', box: 'absolute inset-0', img: '' },
  pot: { file: 'c13cf.svg', box: 'absolute inset-0', img: '' },
  zipper: { file: 'b9231.svg', box: 'absolute inset-[-2.19%_0_-0.67%_0]', img: '' },
  door: { file: 'icon-door.png', box: 'absolute inset-0', img: '' },
  mic: { file: '586a2.svg', box: 'absolute inset-[0_-1.39%_-1.39%_0]', img: '' },
};

export function libOf(id: string) {
  return LIB.find((l) => l.id === id) ?? { id, name: customName(id), short: customName(id) };
}

export function LibIcon({ id, size }: { id: string; size: number }) {
  const i = ICONS[id] ?? (id.startsWith('rec') ? ICONS.mic : ICONS.oven);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className={i.box}>
        <img alt="" className="absolute block inset-0 max-w-none size-full object-contain" src={asset(i.file)} />
      </div>
    </div>
  );
}

export function Slider({
  value,
  onChange,
  width,
  track = '#e9e5dc',
}: {
  value: number;
  onChange: (v: number) => void;
  width: number;
  track?: string;
}) {
  return (
    <div className="relative h-[26px]" style={{ width }}>
      <div className="absolute left-0 top-[8px] h-[10px] w-full rounded-full" style={{ background: track }} />
      <div className="absolute left-0 top-[8px] h-[10px] rounded-full bg-ember" style={{ width: Math.max(8, value * width) }} />
      <img
        alt=""
        className="absolute top-[-3px] size-[32px] max-w-none"
        style={{ left: value * (width - 26) - 3 }}
        src={asset('77819.svg')}
      />
      <input
        aria-label="slider"
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="absolute inset-0 size-full cursor-pointer opacity-0"
      />
    </div>
  );
}

export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      aria-pressed={on}
      onClick={() => onChange(!on)}
      className={`relative h-[36px] w-[70px] rounded-full transition-colors ${on ? 'bg-ember' : 'bg-[#d9d4c8]'}`}
    >
      <img
        alt=""
        className="absolute top-[3px] size-[32px] max-w-none transition-all duration-200"
        style={{ left: on ? 36 : 2 }}
        src={asset('e76ef.svg')}
      />
    </button>
  );
}
