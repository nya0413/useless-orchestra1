import { useCallback, useEffect, useState } from 'react';
import Intro from './pages/Intro';
import Songs from './pages/Songs';
import Edit from './pages/Edit';
import Loading from './pages/Loading';
import Play from './pages/Play';
import { preloadSamples, type SongState } from './audio';
import { installClickSfx, loopStart, loopStop } from './sfx';

type Page = 'start' | 'list' | 'edit' | 'loading' | 'play';
type Song = SongState & { id: number; title: string; sample?: number };

const KEY = 'uo.songs';
const fresh = (): Song => ({
  id: Date.now(),
  title: '',
  bpm: 100,
  tracks: [{ id: 'keyboard', vol: 0.7, on: true, hits: [0, 2, 4, 6, 8, 10, 12, 14] }],
});

const mk = (id: number, title: string, sample: number, rows: [string, number, number[]][]): Song => ({
  id,
  title,
  sample,
  bpm: 100,
  tracks: rows.map(([tid, vol, hits]) => ({ id: tid, vol, on: true, hits })),
});

const SAMPLES: Song[] = [
  mk(1, 'Groove', 1, [
    ['keyboard', 0.27, [0, 2, 4, 6, 8, 10, 12, 14]],
    ['water', 0.46, [1, 4, 7, 10, 13]],
    ['oven', 0.41, [8]],
    ['cat', 0.92, [12.5]],
    ['pot', 0.5, [4, 12]],
    ['zipper', 0.5, [9]],
    ['door', 0.55, [5.5, 9.5, 15.5]],
  ]),
  mk(2, 'We Will Rock You', 2, [
    ['pot', 0.82, [0, 2, 8, 10]],
    ['keyboard', 0.77, [4, 12]],
    ['door', 0.5, [3.5, 11.5]],
    ['zipper', 0.23, [6, 14]],
    ['water', 0.23, [3, 11]],
    ['cat', 0.14, [6.5, 14.5]],
    ['oven', 0.3, [0, 8]],
  ]),
  mk(3, 'Bounce', 3, [
    ['keyboard', 0.26, [0, 2, 4, 6, 8, 10, 12, 14, 15]],
    ['water', 0.37, [1, 3, 5, 7.5, 9, 11, 13, 15]],
    ['oven', 0.41, [0, 8]],
    ['cat', 0.92, [6, 14]],
    ['pot', 0.5, [4, 12, 14.5]],
    ['zipper', 0.46, [10]],
    ['door', 0.55, [5.5, 7.5, 13.5, 15.5]],
  ]),
];

function load(): Song[] {
  try {
    const raw: Song[] = JSON.parse(localStorage.getItem(KEY) || '[]');
    const list: Song[] = raw.map((s) => ({ ...s, sample: s.sample ? Number(s.sample) || 1 : undefined, tracks: s.tracks.filter((t) => !t.id.startsWith('rec')) }));
    if (!localStorage.getItem('uo.sample.v2')) {
      localStorage.setItem('uo.sample.v2', '1');
      SAMPLES.forEach((sm) => {
        const i = list.findIndex((x) => x.id === sm.id);
        if (i >= 0) list[i] = sm;
      });
    }
    for (const sm of SAMPLES) {
      const flag = sm.sample === 1 ? 'uo.sample' : `uo.sample.${sm.sample}`;
      if (localStorage.getItem(flag)) continue;
      localStorage.setItem(flag, '1');
      if (list.some((x) => x.id === sm.id)) continue;
      let at = 0;
      while (at < list.length && list[at].sample) at++;
      list.splice(at, 0, sm);
    }
    return list;
  } catch {
    return [];
  }
}

export default function App() {
  const [page, setPage] = useState<Page>('start');
  const [songs, setSongs] = useState<Song[]>(load);
  const [curId, setCurId] = useState(0);
  useEffect(() => preloadSamples(), []);
  useEffect(() => installClickSfx(), []);
  const [muted, setMuted] = useState(false);
  const bgm = (page === 'start' || page === 'list') && !muted;
  useEffect(() => {
    if (bgm) loopStart('bgmusic', 0.5);
    else loopStop('bgmusic');
  }, [bgm]);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(songs));
    } catch {
      /* storage unavailable */
    }
  }, [songs]);

  const song = songs.find((s) => s.id === curId) ?? songs[0] ?? fresh();
  const setSong = useCallback(
    (fn: (s: SongState) => SongState) => setSongs((ss) => ss.map((s) => (s.id === curId ? { ...s, ...fn(s) } : s))),
    [curId],
  );
  const setTitle = (title: string) => setSongs((ss) => ss.map((s) => (s.id === curId ? { ...s, title } : s)));
  const toList = useCallback(() => setPage('list'), []);
  const toEdit = useCallback(() => setPage('edit'), []);
  const open = (id: number, p: Page) => {
    setCurId(id);
    setPage(p);
  };

  if (page === 'start') return <Intro onDone={toList} muted={muted} onToggleBgm={() => setMuted((m) => !m)} />;
  if (page === 'list')
    return (
      <Songs
        songs={songs.map((s) => ({ id: s.id, title: s.title, sample: s.sample, trackCount: s.tracks.length }))}
        onNew={() => {
          const s = fresh();
          setSongs((ss) => [...ss, s]);
          open(s.id, 'edit');
        }}
        onPlay={(id) => open(id, 'loading')}
        onEdit={(id) => open(id, 'edit')}
        onDelete={(id) => setSongs((ss) => ss.filter((s) => s.id !== id))}
        onHome={() => setPage('start')}
        muted={muted}
        onToggleBgm={() => setMuted((m) => !m)}
      />
    );
  if (page === 'loading') return <Loading onDone={() => setPage('play')} />;
  if (page === 'play') return <Play song={song} setSong={setSong} title={song.title} onEdit={toEdit} />;
  return <Edit song={song} setSong={setSong} title={song.title} setTitle={setTitle} onPlay={() => setPage('loading')} onBack={toList} />;
}
