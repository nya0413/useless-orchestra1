import { useEffect, useState } from 'react';
import Stage, { asset } from '../Stage';
import BgmToggle from '../BgmToggle';
import { loopStart, loopStop, shot } from '../sfx';

export type SongItem = { id: number; title: string; sample?: number; trackCount: number };

const Z = 380;

type Props = {
  songs: SongItem[];
  onNew: () => void;
  onPlay: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onHome: () => void;
  muted: boolean;
  onToggleBgm: () => void;
};

export default function Songs({ songs, onNew, onPlay, onEdit, onDelete, onHome, muted, onToggleBgm }: Props) {
  const [idx, setIdx] = useState(0);
  const hasSongs = songs.length > 0;
  useEffect(() => {
    if (hasSongs) loopStart('return', 0.6);
    else loopStop('return');
    return () => loopStop('return');
  }, [hasSongs]);
  const items = [...songs, null];
  const li = Math.min(idx, items.length - 1);
  const cur = items[li];
  const pill = 'flex h-[64px] items-center gap-[8px] rounded-full px-[28px] text-[24px] transition-colors';
  const sand = `${pill} bg-sand hover:bg-[#ddd8cc]`;
  const main = `${pill} border-2 border-black bg-white hover:bg-[#fff6ef]`;
  const arrow =
    'absolute top-[245px] z-20 flex size-[70px] items-center justify-center rounded-full bg-white text-[32px] transition-transform hover:scale-105';

  return (
    <div className="flex min-h-dvh flex-col justify-center bg-paper">
    <Stage height={900} fit>
      <div className="contents font-ko">
      <BgmToggle muted={muted} onToggle={onToggleBgm} />
      <p className="absolute left-[120px] top-[70px] text-[48px] leading-[1.3]">내 레코드</p>
      <p className="absolute left-[330px] top-[92px] text-[22px] text-ink-soft">LP를 넘겨 보고, 새 노래를 추가해요</p>
      <button onClick={onHome} className={`${sand} absolute right-[120px] top-[78px]`}>
        <img alt="" src={asset('home-icon.png')} className="size-[30px]" />
        처음으로
      </button>

      <div className="absolute left-[120px] top-[200px] h-[560px] w-[1200px] overflow-hidden rounded-[20px] bg-sand">
        <div className="absolute left-0 top-[90px] h-[420px] w-[1200px]">
          {items.map((s, i) => {
            const o = i - li;
            const a = Math.abs(o);
            const focus = o === 0;
            return (
              <div
                key={s ? s.id : 'new'}
                onClick={() => {
                  shot('click');
                  if (focus) (s ? onEdit(s.id) : onNew());
                  else setIdx(i);
                }}
                className="absolute top-0 cursor-pointer transition-all duration-500 ease-out"
                style={{
                  left: 600 - Z / 2,
                  width: Z,
                  height: Z,
                  transform: `translateX(${o * Z * 0.8}px) scale(${focus ? 1 : Math.max(0.6, 0.82 - 0.08 * (a - 1))})`,
                  opacity: a > 2 ? 0 : focus ? 1 : 0.75,
                  pointerEvents: a > 2 ? 'none' : 'auto',
                  zIndex: 10 - a,
                }}
              >
                {s && (
                  <div
                    className="absolute transition-transform duration-500"
                    style={{ top: '8%', left: '10%', width: '84%', height: '84%', transform: focus ? 'translateX(42%)' : 'none' }}
                  >
                    <img
                      alt=""
                      src={asset('lp-record3.png')}
                      className="lp-spin size-full max-w-none object-contain"
                    />
                  </div>
                )}
                <div
                  className={`absolute inset-0 flex flex-col justify-between rounded-[20px] p-[28px] ${s ? '' : 'items-center justify-center border-2 border-dashed border-ink-soft text-center text-ink-soft'}`}
                  style={{ background: s ? (focus ? '#FF5A1F' : '#f7f4ee') : 'transparent' }}
                >
                  {s ? (
                    <>
                      <img alt="" src={asset('cd-box.png')} className="absolute left-1/2 top-[56px] size-[190px] -translate-x-1/2 object-contain" />
                      <span className={`relative text-[20px] ${focus ? 'text-black' : 'text-ink-soft'}`}>{s.sample ? (
                          <>
                            SAMPLE
                            <br />
                            {String(s.sample).padStart(2, '0')}
                          </>
                        ) : (
                          `NO.${String(i + 1).padStart(2, '0')}`
                        )}</span>
                      <span className="relative">
                        <span className="block text-[40px] leading-[1.2]">{s.title || '이름 없는 곡'}</span>
                        <span className={`text-[20px] ${focus ? 'text-black/70' : 'text-ink-soft'}`}>소리 {s.trackCount}개</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[96px] leading-none">+</span>
                      <span className="text-[28px]">새 노래 추가</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {li > 0 && (
          <button aria-label="이전" onClick={() => setIdx(li - 1)} className={`${arrow} left-[30px]`}>
            &lt;
          </button>
        )}
        {li < items.length - 1 && (
          <button aria-label="다음" onClick={() => setIdx(li + 1)} className={`${arrow} right-[30px]`}>
            &gt;
          </button>
        )}
      </div>

      <div className="absolute left-[120px] top-[790px] flex w-[1200px] justify-center gap-[12px]">
        {cur ? (
          <>
            <button onClick={() => onPlay(cur.id)} className={main}>
              공연 보기
            </button>
            <button onClick={() => onEdit(cur.id)} className={sand}>
              편집하기
            </button>
            <button
              onClick={() => {
                if (confirm('이 곡을 삭제할까요?')) onDelete(cur.id);
              }}
              className={sand}
            >
              삭제
            </button>
          </>
        ) : (
          <button onClick={onNew} className={main}>
            새 노래 만들기
          </button>
        )}
      </div>
      </div>
    </Stage>
    </div>
  );
}
