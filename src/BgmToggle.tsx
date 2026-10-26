import type { CSSProperties } from 'react';
import { asset } from './Stage';

export default function BgmToggle({ muted, onToggle, className = '', imgStyle }: { muted: boolean; onToggle: () => void; className?: string; imgStyle?: CSSProperties }) {
  return (
    <button
      aria-label={muted ? '배경음악 켜기' : '배경음악 끄기'}
      aria-pressed={!muted}
      onClick={onToggle}
      className={`absolute right-[40px] top-[8px] z-30 size-[52px] cursor-pointer transition-transform hover:scale-110 ${className}`}
    >
      <img
        alt=""
        src={asset(muted ? '41677.svg' : '0e603.svg')}
        className="absolute inset-0 size-full max-w-none transition-opacity"
        style={{ opacity: muted ? 0.5 : 1, ...imgStyle }}
      />
    </button>
  );
}
