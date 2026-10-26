import { useEffect, useRef, useState } from "react"
import Stage, { asset } from "../Stage"
import { libOf } from "../ui"
import { createEngine, type SongState } from "../audio"

type Props = {
  song: SongState
  setSong: (fn: (s: SongState) => SongState) => void
  title: string
  onEdit: () => void
}

const KEYS = [
  { l: "A", cx: 143.2, rot: "", lx: 144.74, ly: 485.45, lr: 0 },
  { l: "B", cx: 295.5, rot: "rotate(11.92deg)", lx: 297.1, ly: 485.45, lr: 0 },
  { l: "C", cx: 457, rot: "scaleX(-1)", lx: 458.3, ly: 485.45, lr: 0 },
  { l: "D", cx: 613.1, rot: "rotate(11.33deg)", lx: 614.2, ly: 485.45, lr: 0 },
  {
    l: "E",
    cx: 774.7,
    rot: "rotate(-23.98deg)",
    lx: 776.2,
    ly: 483.58,
    lr: -27.02,
  },
  { l: "F", cx: 930.8, rot: "scaleY(-1)", lx: 932.4, ly: 497.44, lr: 0 },
  {
    l: "G",
    cx: 1092.2,
    rot: "rotate(-7.59deg)",
    lx: 1093.1,
    ly: 485.45,
    lr: 0,
  },
  {
    l: "H",
    cx: 1248.3,
    rot: "rotate(101.48deg)",
    lx: 1252.3,
    ly: 491.93,
    lr: 0,
  },
]

const DUR: Record<string, number> = {
  door: 620,
  zipper: 1300,
  water: 1400,
  cat: 1100,
  oven: 1000,
  pot: 1000,
}

type Fx = { id: number; ty: string; x: number; y: number }
let fxId = 0

const cellX = (i: number) => 102.79 + i * 77.97 + Math.floor(i / 4) * 5.4
const ROW0 = 559.1
const ROW_H = 15.45

function ZipStrip({ left, dir }: { left: number; dir: "a" | "b" }) {
  return (
    <div
      className="absolute flex h-[66.08px] w-[354.264px] items-center justify-center"
      style={{ left, top: 156.94 }}
    >
      <div
        className={
          dir === "a"
            ? "flex-none -rotate-90 -scale-y-100"
            : "flex-none rotate-90"
        }
      >
        <div className="relative h-[354.264px] w-[66.08px]">
          <div className="absolute inset-0 overflow-hidden">
            <img
              alt=""
              src={asset("06f2a.png")}
              className="absolute left-[-375%] top-0 h-[158.55%] w-[850%] max-w-none"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function Door({ side }: { side: "l" | "r" }) {
  return (
    <div
      className={`absolute h-[801.084px] w-[430.939px] ${
        side === "r" ? "-scale-x-100" : ""
      }`}
      style={{ left: side === "l" ? -51.4 : 1009.6, top: -45.89 }}
    >
      <div className="absolute inset-0 overflow-hidden">
        <img
          alt=""
          src={asset("77ac3.png")}
          className="absolute left-[-82.68%] top-[-23.15%] h-[158.98%] w-[214.11%] max-w-none"
        />
      </div>
    </div>
  )
}

export default function Play({ song, setSong, title, onEdit }: Props) {
  const [playing, setPlaying] = useState(false)
  const [head, setHead] = useState(-1)
  const [fire, setFire] = useState<Record<string, number>>({})
  const [fxs, setFxs] = useState<Fx[]>([])
  const cardRef = useRef<HTMLDivElement>(null)
  const timers = useRef<number[]>([])
  const songRef = useRef(song)
  songRef.current = song

  useEffect(() => {
    if (!playing) {
      setHead(-1)
      setFire({})
      setFxs([])
      return
    }
    return createEngine(() => songRef.current, setHead)
  }, [playing])

  useEffect(() => {
    if (head < 0) return
    const hit = songRef.current.tracks.filter(
      (t) => t.on && t.hits.some((h) => Math.floor(h) === head),
    )
    if (!hit.length) return
    setFire((f) => {
      const nf = { ...f }
      hit.forEach((t) => {
        nf[t.id] = (nf[t.id] ?? 0) + 1
      })
      return nf
    })
    const add: Fx[] = []
    hit.forEach((t) => {
      if (!DUR[t.id]) return
      const x =
        t.id === "water"
          ? 60 + Math.random() * 560
          : t.id === "cat"
            ? 60 + Math.random() * 1000
            : 0
      const y = t.id === "cat" ? 230 + Math.random() * 190 : 0
      add.push({ id: ++fxId, ty: t.id, x, y })
    })
    if (!add.length) return
    setFxs((f) => [...f.slice(-30), ...add])
    add.forEach((e) =>
      timers.current.push(
        window.setTimeout(
          () => setFxs((f) => f.filter((q) => q.id !== e.id)),
          DUR[e.ty] + 150,
        ),
      ),
    )
    if (add.some((e) => e.ty === "door"))
      cardRef.current?.animate(
        [
          { translate: "0 0" },
          { translate: "-4px 2px", offset: 0.15 },
          { translate: "3px -2px", offset: 0.35 },
          { translate: "-2px 1px", offset: 0.6 },
          { translate: "0 0" },
        ],
        { duration: 420, easing: "ease-out" },
      )
  }, [head])

  useEffect(
    () => () =>
      timers.current.forEach((t) => window.clearTimeout(t)),
    [],
  )

  const rows = song.tracks
  const pitch = Math.min(157.9, 1090 / Math.max(rows.length, 1))
  const pillW = Math.min(139.5, pitch - 8)
  const n = (id: string) => fire[id] ?? 0
  const keyN = n("keyboard")
  const keysShown = keyN > 0 ? ((keyN - 1) % KEYS.length) + 1 : 0
  const of = (ty: string) => fxs.filter((f) => f.ty === ty)
  const beatSec = (60 / song.bpm) * 2

  return (
    <div className="flex min-h-dvh flex-col justify-center bg-paper">
    <Stage height={960} fit>
      <div className="contents font-ko">
        <p className="absolute left-[40px] top-[22px] max-w-[900px] truncate whitespace-nowrap text-[34px] leading-[1.3]">
          {title || "이름 없는 곡"}
        </p>
        <div className="absolute right-[40px] top-[29px] flex items-center gap-[7px]">
          <img
            alt=""
            src={asset(playing ? "8a74e.svg" : "24f0a.svg")}
            className={`size-[27.5px] max-w-none ${playing ? "pulse-dot" : ""}`}
          />
          <p className="whitespace-nowrap font-display text-[22.027px] leading-normal">
            {playing ? "NOW PLAYING" : "READY"}
          </p>
        </div>
        <div
          ref={cardRef}
          className="absolute left-[27.53px] top-[87.53px] h-[688.337px] w-[1384.933px] overflow-hidden rounded-[18.356px] border-[0.918px] border-ink-soft bg-white shadow-[4.236px_5.648px_0px_0px_#d0ccc2]"
          style={{
            backgroundImage:
              "radial-gradient(#e6e2d8 1.4px, transparent 1.6px)",
            backgroundSize: "22px 22px",
          }}
        >
          {!playing && (
            <p className="absolute left-1/2 top-[250px] -translate-x-1/2 whitespace-nowrap text-[40px]">
              재생 버튼을 눌러 연주를 시작하세요
            </p>
          )}

          {of("zipper").map((f) => (
            <div key={f.id} className="pointer-events-none absolute inset-0">
              <div className="fx-zip-strips absolute inset-0">
                <ZipStrip left={535} dir="a" />
                <ZipStrip left={1242.7} dir="a" />
                <ZipStrip left={888.5} dir="b" />
              </div>
              <div
                className="fx-zip-head absolute flex size-[561.683px] items-center justify-center"
                style={{ left: -26.62, top: -90.86 }}
              >
                <div className="flex-none rotate-90">
                  <div className="relative size-[561.683px]">
                    <img
                      alt=""
                      src={asset("06f2a.png")}
                      className="absolute inset-0 size-full max-w-none object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {of("pot").map((f) => (
            <div key={f.id} className="pointer-events-none absolute inset-0">
              <img
                alt=""
                src={asset("87232.svg")}
                className="fx-ring absolute size-[759.924px] max-w-none"
                style={{ left: 331.6, top: -36.71 }}
              />
              <img
                alt=""
                src={asset("cda98.svg")}
                className="fx-ring absolute size-[574.532px] max-w-none"
                style={{ left: 424.5, top: 55.98, animationDelay: "0.05s" }}
              />
            </div>
          ))}

          {of("door").map((f) => (
            <div key={f.id} className="pointer-events-none absolute inset-0">
              <div className="fx-door-l absolute inset-0">
                <Door side="l" />
              </div>
              <div className="fx-door-r absolute inset-0">
                <Door side="r" />
              </div>
            </div>
          ))}

          {of("water").map((f) => (
            <div key={f.id} className="pointer-events-none absolute inset-0">
              <div
                className="fx-drop absolute size-[302.868px]"
                style={{ left: f.x, top: -5.51 }}
              >
                <img
                  alt=""
                  src={asset("eef1b.png")}
                  className="size-full max-w-none object-cover"
                />
              </div>
              <div
                className="fx-drop absolute size-[278.088px]"
                style={{ left: f.x + 430, top: -34.88, animationDelay: "0.12s" }}
              >
                <img
                  alt=""
                  src={asset("eef1b.png")}
                  className="size-full max-w-none -scale-x-100 object-cover"
                />
              </div>
            </div>
          ))}

          {rows.map((t, i) => {
            const top = ROW0 + i * ROW_H
            return (
              <div
                key={t.id}
                className="transition-opacity"
                style={{ opacity: t.on ? 1 : 0.35 }}
              >
                <p
                  className="absolute left-[26.62px] whitespace-nowrap text-[12.849px] leading-[15px] text-black"
                  style={{ top: top - 2 }}
                >
                  {libOf(t.id).short}
                </p>
                {Array.from({ length: 16 }, (_, k) => {
                  const hit = t.hits.some((h) => Math.floor(h) === k)
                  const cur = head === k
                  return (
                    <span
                      key={k}
                      className={`absolute h-[11.768px] w-[74.285px] rounded-[91.778px] transition-colors duration-100 ${
                        hit
                          ? cur
                            ? "bg-ember"
                            : "bg-[#ffaf92] opacity-50"
                          : cur
                            ? "bg-[#ddd8cc]"
                            : "bg-[#eeebe4] opacity-50"
                      }`}
                      style={{ left: cellX(k), top }}
                    />
                  )
                })}
              </div>
            )
          })}

          {of("cat").map((f) => (
            <div
              key={f.id}
              className="fx-cat pointer-events-none absolute h-[253.069px] w-[195.672px]"
              style={{ left: f.x, top: f.y }}
            >
              <img
                alt=""
                src={asset("6937b.png")}
                className="size-full max-w-none object-cover"
              />
            </div>
          ))}

          {of("oven").map((f) => (
            <div
              key={f.id}
              className="fx-pop pointer-events-none absolute size-[338.662px]"
              style={{ left: 936.5, top: 81.68 }}
            >
              <img
                alt=""
                src={asset("burst-ddang.png")}
                className="size-full max-w-none object-contain"
              />
            </div>
          ))}

          {of("pot").map((f) => (
            <img
              key={f.id}
              alt=""
              src={asset("c0fb8.svg")}
              className="fx-ring pointer-events-none absolute size-[313.881px] max-w-none"
              style={{ left: 554.9, top: 186.31, animationDelay: "0.1s" }}
            />
          ))}

          {keysShown > 0 && (
            <div className="pointer-events-none absolute inset-0">
              {KEYS.slice(0, keysShown).map((k, i) => {
                const pressed = i === keysShown - 1
                return (
                  <div
                    key={pressed ? `${k.l}${keyN}` : k.l}
                    className={pressed ? "fx-key-in" : ""}
                  >
                    <div
                      className="absolute h-[75.205px] w-[80.765px]"
                      style={{
                        left: k.cx - 40.38,
                        top: 470.82,
                        transform: k.rot,
                      }}
                    >
                      <div className="absolute inset-0 overflow-hidden">
                        <img
                          alt=""
                          src={asset("732d2.png")}
                          className="absolute left-[-86.59%] top-[-194.94%] h-[466.93%] w-[266.67%] max-w-none"
                        />
                      </div>
                    </div>
                    <p
                      className={`absolute -translate-x-1/2 whitespace-nowrap text-center font-display text-[24.08px] leading-[1.4] ${
                        pressed ? "text-ember" : "text-black"
                      }`}
                      style={{ left: k.lx, top: k.ly, rotate: `${k.lr}deg` }}
                    >
                      {k.l}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <button
          aria-label={playing ? "정지" : "재생"}
          onClick={() => setPlaying((p) => !p)}
          className="absolute left-0 top-[774px] size-[170px] scale-[0.86] transition-transform duration-300 hover:scale-[0.9]"
        >
          {playing && (
            <>
              <span
                className="fx-ripple absolute left-[29.4px] top-[30.4px] size-[110.134px] rounded-full bg-[rgba(255,90,31,0.35)]"
                style={{ animationDuration: `${beatSec}s` }}
              />
              <span
                className="fx-ripple absolute left-[29.4px] top-[30.4px] size-[110.134px] rounded-full bg-[rgba(255,90,31,0.35)]"
                style={{
                  animationDuration: `${beatSec}s`,
                  animationDelay: `${beatSec / 2}s`,
                }}
              />
            </>
          )}
          <img
            alt=""
            src={asset(playing ? "btn-stop.png" : "btn-play.png")}
            className="absolute left-[25px] top-[26px] size-[118px] max-w-none"
          />
        </button>

        {rows.map((t, i) => {
          const lit = n(t.id) > 0
          return (
            <button
              key={t.id}
              onClick={() =>
                setSong((s) => ({
                  ...s,
                  tracks: s.tracks.map((x) =>
                    x.id === t.id ? { ...x, on: !x.on } : x,
                  ),
                }))
              }
              className={`absolute top-[831.85px] h-[54.149px] overflow-hidden rounded-[18.356px] border-[0.918px] border-ink-soft bg-white text-[22.027px] transition-opacity ${
                t.on ? "" : "opacity-40"
              }`}
              style={{ left: 183.56 + i * pitch, width: pillW }}
            >
              {lit && (
                <span
                  key={n(t.id)}
                  className="fx-flash absolute inset-0 bg-ember"
                />
              )}
              <span className="relative">{libOf(t.id).short}</span>
            </button>
          )
        })}
        <button
          onClick={onEdit}
          className="absolute left-[1290px] top-[831.85px] flex h-[54.149px] w-[122px] items-center justify-center gap-[4px] overflow-hidden rounded-[18.356px] border-[0.918px] border-ink-soft bg-sand text-[22.027px] transition-colors hover:bg-white"
        >
          <span className="relative size-[24px] shrink-0">
            <span className="absolute inset-[10.42%_12.5%]">
              <span className="absolute inset-[-3.16%_-3.33%]">
                <img alt="" src={asset("c3bdf.svg")} className="block size-full max-w-none" />
              </span>
            </span>
          </span>
          편집하기
        </button>
      </div>
    </Stage>
    </div>
  )
}
