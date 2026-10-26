import { useEffect, useState } from 'react';
import Stage, { asset } from '../Stage';
import { useLoop } from '../sfx';

export default function Loading({ onDone }: { onDone: () => void }) {
  const [frame, setFrame] = useState(0);
  useLoop('loading');
  useEffect(() => {
    const iv = setInterval(() => setFrame((f) => (f + 1) % 3), 350);
    return () => clearInterval(iv);
  }, []);
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="flex min-h-dvh flex-col justify-center bg-paper">
    <Stage height={900} fit>
      <p className="absolute left-[342px] top-[150px] w-[755px] whitespace-nowrap font-display text-[64px] leading-[1.4]">
        Preparing the stage{'.'.repeat(frame + 1)}
      </p>
      <img alt="" src={asset('5475e.svg')} className="pulse-dot absolute left-[659px] top-[389px] size-[121px]" />
      <div className="absolute left-[470px] top-[298px] size-[500px] overflow-clip">
        <div className={frame === 0 ? "contents" : "contents invisible"}>
            <img alt="" src={asset('2a387.png')} className="absolute left-[25px] top-0 h-[500px] w-[449px] max-w-none" />
            <div className="absolute left-[281px] top-[114px] flex h-[109.765px] w-[116.182px] items-center justify-center">
              <div className="relative h-[93px] w-[101px] flex-none -rotate-[10.44deg] overflow-hidden">
                <img alt="" src={asset('96572.png')} className="absolute max-w-none" style={{ height: '1094.26%', left: '-451.49%', top: '-384.76%', width: '711.88%' }} />
              </div>
            </div>
          </div>
        <div className={frame === 1 ? "contents" : "contents invisible"}>
            <div className="absolute left-[4.07px] top-[-18.62px] flex h-[537.23px] w-[490.869px] items-center justify-center">
              <div className="h-[500px] w-[449px] flex-none -rotate-[5deg]">
                <img alt="" src={asset('a3280.png')} className="size-full max-w-none" />
              </div>
            </div>
            <div className="absolute left-[267.32px] top-[28.36px] flex h-[195.509px] w-[194.405px] items-center justify-center">
              <div className="relative h-[167.906px] w-[166.526px] flex-none rotate-[10.53deg] overflow-hidden">
                <img alt="" src={asset('96572.png')} className="absolute max-w-none" style={{ height: '606.09%', left: '-273.83%', top: '-168.5%', width: '431.76%' }} />
              </div>
            </div>
          </div>
        <div className={frame === 2 ? "contents" : "contents invisible"}>
            <div className="absolute left-[-15px] top-[-35.19px] flex h-[570.372px] w-[529.003px] items-center justify-center">
              <div className="h-[500px] w-[449px] flex-none rotate-[10deg]">
                <img alt="" src={asset('5048a.png')} className="size-full max-w-none" />
              </div>
            </div>
            <div className="absolute left-[250px] top-[-11px] flex h-[261.29px] w-[308.071px] items-center justify-center">
              <div className="relative h-[192px] w-[263px] flex-none -rotate-[17.23deg] overflow-hidden">
                <img alt="" src={asset('96572.png')} className="absolute max-w-none" style={{ height: '530.03%', left: '-173.38%', top: '-134.81%', width: '273.38%' }} />
              </div>
            </div>
          </div>
      </div>
    </Stage>
    </div>
  );
}
