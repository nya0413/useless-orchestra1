import { useEffect } from 'react';

const cache: Record<string, HTMLAudioElement> = {};
const get = (n: string) => (cache[n] ??= Object.assign(new Audio(`${import.meta.env.BASE_URL}audio/${n}.mp3`), { preload: 'auto' }));

const pending = new WeakSet<HTMLAudioElement>();

export function shot(n: string, vol = 1) {
  const a = get(n);
  a.volume = vol;
  a.currentTime = 0;
  a.play().catch(() => {});
}

export function loopStart(n: string, vol = 1) {
  const a = get(n);
  a.loop = true;
  a.volume = vol;
  a.play().catch(() => {
    if (pending.has(a)) return;
    pending.add(a);
    window.addEventListener(
      'pointerdown',
      () => {
        pending.delete(a);
        if (a.loop && a.paused) a.play().catch(() => {});
      },
      { once: true },
    );
  });
}

export function loopStop(n: string, reset = true) {
  const a = get(n);
  a.loop = false;
  a.pause();
  if (reset) a.currentTime = 0;
}

export function useLoop(n: string, vol = 1) {
  useEffect(() => {
    loopStart(n, vol);
    return () => loopStop(n);
  }, [n, vol]);
}

export function installClickSfx() {
  ['click', 'LP', 'return', 'loading', 'bgmusic'].forEach((n) => get(n).load());
  const h = (e: Event) => {
    const b = (e.target as HTMLElement | null)?.closest?.('button');
    if (!b || (b as HTMLButtonElement).disabled) return;
    const k = b.closest('[data-sfx]')?.getAttribute('data-sfx');
    if (k === 'none') return;
    shot(k === 'lp' ? 'LP' : 'click');
  };
  document.addEventListener('click', h, true);
  return () => document.removeEventListener('click', h, true);
}
