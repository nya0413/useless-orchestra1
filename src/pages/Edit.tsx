import { useEffect, useRef, useState } from 'react';
import Floating from '../Floating';
import Stage, { asset } from '../Stage';
import { LIB, LibIcon, Slider, Toggle, libOf } from '../ui';
import { createEngine, currentStep, getCustoms, playVoice, startRecording, type SongState } from '../audio';

type Props = {
  song: SongState;
  setSong: (fn: (s: SongState) => SongState) => void;
  title: string;
  setTitle: (t: string) => void;
  onPlay: () => void;
  onBack: () => void;
};

const MODES = ['딱 맞게', '반칸', '자유'];
const EVENS = [0, 2, 4, 6, 8, 10, 12, 14];
const DEFAULTS: Record<string, number[]> = {
  keyboard: EVENS,
  water: [0, 3, 6, 10, 13.5],
  door: [4, 12],
  cat: [5, 11.5],
  pot: [0, 8],
  zipper: [14],
  oven: [15],
};
const snapTo = (v: number, mode: number) => {
  const r = mode === 0 ? Math.round(v) : mode === 1 ? Math.round(v * 2) / 2 : Math.round(v * 8) / 8;
  return Math.min(Math.max(r, 0), 15.875);
};
const PITCH = 49;

export default function Edit({ song, setSong, title, setTitle, onPlay, onBack }: Props) {
  const [mode, setMode] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [hint, setHint] = useState('칸을 누르면 박이 들어가요. 박을 옆으로 끌면 엇박이 돼요.');
  const [customs, setCustoms] = useState(getCustoms);
  const [recording, setRecording] = useState(false);
  const stopRec = useRef<null | (() => Promise<{ id: string; name: string } | null>)>(null);
  const [head, setHead] = useState(-1);
  const [active, setActive] = useState(0);
  const songRef = useRef(song);
  songRef.current = song;
  const headRef = useRef(-1);

  useEffect(() => {
    if (!playing) {
      setHead(-1);
      return;
    }
    return createEngine(
      () => songRef.current,
      (s) => {
        headRef.current = s;
        setHead(s);
      },
    );
  }, [playing]);

  const update = (i: number, patch: Partial<SongState['tracks'][number]>) =>
    setSong((s) => ({ ...s, tracks: s.tracks.map((t, k) => (k === i ? { ...t, ...patch } : t)) }));

  const toggleCell = (ti: number, si: number) => {
    const t = song.tracks[ti];
    if (t.hits.some((p) => Math.abs(p - si) < 0.3)) return setActive(ti);
    if (t.on) playVoice(t.id, t.vol);
    update(ti, { hits: [...t.hits, si] });
    setActive(ti);
  };

  const drag = useRef<{ ti: number; k: number; x: number; pos: number; moved: boolean; scale: number } | null>(null);
  const onHitDown = (e: React.PointerEvent<HTMLElement>, ti: number, k: number) => {
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const scale = el.getBoundingClientRect().width / el.offsetWidth || 1;
    drag.current = { ti, k, x: e.clientX, pos: song.tracks[ti].hits[k], moved: false, scale };
    setActive(ti);
  };
  const onHitMove = (e: React.PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.x) / d.scale;
    if (Math.abs(dx) > 4) d.moved = true;
    const np = snapTo(d.pos + dx / PITCH, mode);
    const t = songRef.current.tracks[d.ti];
    if (!t || t.hits[d.k] === np) return;
    if (t.hits.some((h, i) => i !== d.k && Math.abs(h - np) < 0.01)) return;
    update(d.ti, { hits: t.hits.map((h, i) => (i === d.k ? np : h)) });
  };
  const onHitUp = (e: React.PointerEvent<HTMLElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.moved) return;
    e.stopPropagation();
    const t = songRef.current.tracks[d.ti];
    update(d.ti, { hits: t.hits.filter((_, i) => i !== d.k) });
  };

  const toggleLib = (id: string) => {
    setSong((s) =>
      s.tracks.some((t) => t.id === id)
        ? { ...s, tracks: s.tracks.filter((t) => t.id !== id) }
        : { ...s, tracks: [...s.tracks, { id, hits: [...(DEFAULTS[id] ?? [0, 4, 8, 12])], vol: 0.7, on: true }] },
    );
    if (!song.tracks.some((t) => t.id === id)) {
      playVoice(id, 0.7);
      setActive(song.tracks.length);
    }
  };

  const randomize = () =>
    setSong((s) => ({
      ...s,
      tracks: s.tracks.map((t) => ({
        ...t,
        hits: Array.from({ length: 16 }, (_, k) => k).filter((k) => Math.random() < (k % 4 === 0 ? 0.6 : 0.25)),
      })),
    }));

  const reset = () => {
    setSong((s) => ({ ...s, tracks: [] }));
    setActive(0);
  };

  const tapRef = useRef<() => void>(() => {});
  const tapIn = () => {
    if (!playing) return setHint('재생 중에 눌러야 두드린 타이밍이 들어가요. 먼저 재생을 눌러 보세요.');
    const ti = Math.min(active, song.tracks.length - 1);
    const t = song.tracks[ti];
    if (!t) return;
    const v = snapTo(currentStep(), mode);
    if (t.hits.some((p) => Math.abs(p - v) < 0.2)) return;
    playVoice(t.id, t.vol);
    update(ti, { hits: [...t.hits, v] });
    setHint(`${libOf(t.id).name}에 ${Number.isInteger(v) ? '박' : '엇박'}으로 들어갔어요.`);
  };
  tapRef.current = tapIn;
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || (e.target as HTMLElement)?.tagName === 'INPUT') return;
      e.preventDefault();
      tapRef.current();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const toggleRec = async () => {
    if (recording) {
      const c = await stopRec.current?.();
      stopRec.current = null;
      setRecording(false);
      if (!c) return setHint('녹음에 실패했어요. 다시 시도해 주세요.');
      setCustoms(getCustoms());
      setSong((s) => ({ ...s, tracks: [...s.tracks, { id: c.id, hits: [0, 8], vol: 0.7, on: true }] }));
      setActive(song.tracks.length);
      return setHint(`${c.name}이 추가됐어요. 칸을 눌러 박을 찍어 보세요.`);
    }
    try {
      stopRec.current = await startRecording();
      setRecording(true);
      setHint('녹음 중이에요. 한 번 더 누르면 끝나요. (최대 3초)');
      setTimeout(() => {
        if (stopRec.current) toggleRecRef.current();
      }, 3000);
    } catch {
      setHint('마이크를 사용할 수 없어요. 권한을 확인해 주세요.');
    }
  };
  const toggleRecRef = useRef(toggleRec);
  toggleRecRef.current = toggleRec;

  const finish = () => {
    if (!song.tracks.some((t) => t.on && t.hits.length)) return setHint('트랙에 박을 하나 이상 넣어 주세요.');
    onPlay();
  };

  const n = song.tracks.length;
  const panelH = 185 + Math.max(n, 1) * 140 + 20;
  const libCount = LIB.length + customs.length + 1;
  const height = 270 + panelH + 50 + 45 + 20 + 200 + (Math.ceil(libCount / 8) - 1) * 211 + 80;

  return (
    <>
    <Stage height={height} width={2200} minScale={1.07}>
      <div className="absolute left-1/2 top-[40px] flex h-[80px] w-[580px] -translate-x-[calc(50%+4px)] items-center rounded-full border border-[#d9d9d9] bg-white">
        <img alt="" src={asset('9c73a.svg')} className="absolute left-[20px] top-[20px] size-[40px]" />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="이름 없는 곡"
          maxLength={20}
          className="h-full w-full bg-transparent px-[80px] text-center text-[32px] text-black outline-none placeholder:text-black/50"
        />
      </div>

      <div className="absolute left-[500px] top-[160px] flex w-[1200px] items-center">
        <button
          aria-label={playing ? "정지" : "재생"}
          onClick={() => setPlaying((v) => !v)}
          className="relative mr-[26px] size-[80px] shrink-0 transition-transform hover:scale-105"
        >
          <img alt="" src={asset(playing ? 'btn-stop.png' : 'btn-play.png')} className="absolute left-[-5px] top-[-5px] size-[90px] max-w-none" />
        </button>
        <button onClick={randomize} className="mr-[10px] flex h-[60px] w-[181px] items-center gap-[12px] rounded-full bg-sand pl-[20px] text-[24px] transition-colors hover:bg-[#ddd8cc]">
          <img alt="" src={asset('7ac36.svg')} className="size-[32px]" />
          랜덤 지휘자
        </button>
        <button onClick={reset} className="flex h-[60px] w-[153px] items-center gap-[10px] rounded-full bg-sand pl-[20px] text-[24px] transition-colors hover:bg-[#ddd8cc]">
          <img alt="" src={asset('e0319.svg')} className="size-[26px]" />
          초기화
        </button>
        <button onClick={onBack} className="ml-auto flex h-[64px] w-[153px] items-center gap-[8px] rounded-full bg-sand pl-[20px] text-[24px] transition-colors hover:bg-[#ddd8cc]">
          <img alt="" src={asset('08f48.svg')} className="size-[30px]" />
          목록으로
        </button>
      </div>

      <div className="absolute left-[500px] top-[270px] w-[1200px] rounded-[20px] bg-sand" style={{ height: panelH }}>
        <span className="absolute left-[20px] top-[40px] flex h-[50px] items-center text-[24px] text-ink-soft">박자 맞춤</span>
        <div className="absolute left-[150px] top-[40px] h-[50px] w-[300px]">
          <span
            className="absolute top-0 h-[50px] w-[100px] rounded-full bg-white transition-all duration-300"
            style={{ left: mode * 100 - 0 }}
          />
          {MODES.map((m, i) => (
            <button
              key={m}
              onClick={() => setMode(i)}
              className={`absolute top-0 h-[50px] w-[100px] text-[24px] ${i === mode ? 'text-black' : 'text-black/80'}`}
              style={{ left: i * 100 }}
            >
              {m}
            </button>
          ))}
        </div>
        <button
          onClick={tapIn}
          className="absolute left-[988px] top-[40px] h-[68px] w-[192px] rounded-full border-2 border-black bg-white text-[32px] transition-colors hover:bg-[#fff6ef] active:bg-ember active:text-white"
        >
          탭해서 넣기
        </button>
        <p className="absolute left-[20px] top-[120px] text-[20px] text-ink-soft">
          {hint}
        </p>

        <div className="absolute left-[20px] top-[185px] w-[1160px] rounded-[20px] bg-white" style={{ height: Math.max(n, 1) * 140 - 10 }}>
          {n === 0 && <p className="pt-[52px] text-center text-[24px] text-ink-soft">아래에서 소리를 골라 트랙을 추가하세요</p>}
          {song.tracks.map((t, ti) => {
            const lib = libOf(t.id);
            return (
              <div key={t.id} className="absolute left-0 w-full h-[130px]" style={{ top: ti * 140 }}>
                <button
                  onClick={() => setActive(ti)}
                  aria-label={lib.name}
                  className={`absolute left-[10px] top-[10px] flex size-[60px] items-center justify-center rounded-[20px] bg-sand ${active === ti ? 'ring-2 ring-ember' : ''}`}
                >
                  <LibIcon id={t.id} size={50} />
                </button>
                <p className="absolute left-[82px] top-[26px] whitespace-nowrap text-[24px]">{lib.name}</p>
                <div className="absolute left-[238px] top-[20px]">
                  <Toggle on={t.on} onChange={(v) => update(ti, { on: v })} />
                </div>
                <div className="absolute left-[10px] top-[92px]">
                  <Slider value={t.vol} onChange={(v) => update(ti, { vol: v })} width={298} />
                </div>
                <div
                  className="absolute left-[363px] top-[30px] h-[70px] w-[784px] transition-opacity duration-300"
                  style={{ opacity: t.on ? 1 : 0.3 }}
                >
                  <div className="flex gap-[6px]">
                    {Array.from({ length: 16 }, (_, si) => (
                      <button
                        key={si}
                        aria-label={`${lib.name} ${si + 1}번째 칸`}
                        onClick={() => toggleCell(ti, si)}
                        className={`relative h-[70px] w-[43px] shrink-0 rounded-[15px] transition-colors ${si % 4 === 0 ? 'bg-[#e4dfd3]' : 'bg-[#eeebe4]'} ${head === si ? 'outline-2 outline-ember/60 -outline-offset-2' : ''}`}
                      />
                    ))}
                  </div>
                  {t.hits.map((p, k) => (
                    <span
                      key={k}
                      role="button"
                      aria-label="박 (끌어서 이동)"
                      onPointerDown={(e) => onHitDown(e, ti, k)}
                      onPointerMove={onHitMove}
                      onPointerUp={onHitUp}
                      className={`absolute top-[10px] h-[50px] w-[39px] cursor-grab touch-none rounded-[15px] bg-ember active:cursor-grabbing ${Number.isInteger(p) ? 'border-2 border-[#b13408]' : ''}`}
                      style={{ left: p * PITCH + 2 }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute left-[500px] w-[1200px]" style={{ top: 270 + panelH + 50 }}>
        <div className="flex items-baseline gap-[14px]">
          <h2 className="text-[32px] leading-[1.3]">소리 라이브러리</h2>
          <p className="text-[20px] text-ink-soft">눌러서 트랙을 추가해요. 한번 더 누르면 트랙이 삭제할 수 있어요.</p>
        </div>
        <div className="mt-[15px] flex flex-wrap gap-[11px]">
          {[...LIB, ...customs.map((c) => ({ id: c.id, name: c.name }))].map((l) => {
            const used = song.tracks.some((t) => t.id === l.id);
            return (
              <button
                key={l.id}
                data-sfx="none"
                onClick={() => toggleLib(l.id)}
                className={`relative h-[200px] w-[140px] shrink-0 rounded-[20px] bg-sand text-ink-soft transition-all hover:-translate-y-1 ${used ? 'opacity-30' : ''}`}
              >
                <span className="absolute left-[25px] top-[20px]">
                  <LibIcon id={l.id} size={90} />
                </span>
                <span className="absolute inset-x-0 top-[138px] px-1 text-[24px] leading-[1.2]">{l.name}</span>
              </button>
            );
          })}
          <button
            data-sfx="none"
            onClick={toggleRec}
            className={`relative h-[198px] w-[139px] shrink-0 rounded-[20px] border-2 border-dashed text-ink-soft transition-all hover:-translate-y-1 ${recording ? 'border-ember bg-[#ffd3bf]' : 'border-ink-soft'}`}
          >
            <span className="absolute left-[25px] top-[20px]">
              <LibIcon id="mic" size={90} />
            </span>
            <span className="absolute inset-x-0 top-[138px] text-[24px] leading-[1.2]">{recording ? '녹음 중…' : '소리 추가'}</span>
          </button>
        </div>
      </div>
    </Stage>
    <Floating onClick={finish} />
    </>
  );
}
