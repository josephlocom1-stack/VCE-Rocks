import React from 'react';
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {TOTAL_FRAMES, WORDS, TimedWord} from './timings';

const YELLOW = '#FFD400';
const CREAM = '#F7F2E8';
const BLACK = '#111111';
const WHITE = '#FFFFFF';
const MIN_HOLD = 18;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9'-]/g, '');
const indexes = (needle: string) => WORDS.map((w, i) => ({w, i})).filter(({w}) => norm(w.word) === norm(needle));
const idx = (needle: string, occurrence = 0) => indexes(needle)[occurrence]?.i ?? 0;
const at = (needle: string, occurrence = 0) => WORDS[idx(needle, occurrence)]?.startFrame ?? 0;
const endAt = (needle: string, occurrence = 0) => WORDS[idx(needle, occurrence)]?.endFrame ?? at(needle, occurrence) + 8;
const minAfter = (candidate: number, previous: number, min = MIN_HOLD) => Math.max(candidate, previous + min);

const VideoFill: React.FC<{src: string; startFrom?: number; pos?: string; brightness?: number}> = ({src, startFrom = 0, pos = '50% 50%', brightness = 1.05}) => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, 90], [1.01, 1.045], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: CREAM}}>
      <OffthreadVideo
        muted
        src={staticFile(src)}
        startFrom={startFrom}
        style={{
          width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos,
          transform: `scale(${zoom})`,
          filter: `brightness(${brightness}) contrast(1.025) saturate(1.04)`,
        }}
      />
    </AbsoluteFill>
  );
};

const Clip: React.FC<{from: number; to: number; src: string; startFrom?: number; pos?: string; brightness?: number; boxes?: boolean}> = (p) => {
  const duration = Math.max(MIN_HOLD, p.to - p.from);
  return (
    <Sequence from={p.from} durationInFrames={duration}>
      <VideoFill src={p.src} startFrom={p.startFrom} pos={p.pos} brightness={p.brightness} />
      {p.boxes ? <AnnotationBoxes /> : null}
    </Sequence>
  );
};

const AnnotationBoxes: React.FC = () => {
  const f = useCurrentFrame();
  const opacity = interpolate(f, [2, 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{opacity, pointerEvents: 'none'}}>
      <div style={{position:'absolute', left:150, top:520, width:360, height:300, border:`5px solid ${YELLOW}`, borderRadius:18}}>
        <div style={{position:'absolute', left:-5, top:-44, background:YELLOW, color:BLACK, padding:'7px 14px', font:'900 24px Arial'}}>VEHICLE</div>
      </div>
      <div style={{position:'absolute', right:95, top:930, width:275, height:185, border:'4px solid white', borderRadius:16}}>
        <div style={{position:'absolute', right:-4, top:-40, background:WHITE, color:BLACK, padding:'6px 12px', font:'900 22px Arial'}}>ROAD</div>
      </div>
      <div style={{position:'absolute', left:150, top:1420, width:780, height:5, background:YELLOW, transform:'rotate(-2deg)', transformOrigin:'left center'}} />
    </AbsoluteFill>
  );
};

const Timeline: React.FC = () => {
  const billionaire = Math.max(MIN_HOLD, at('billionaire') - 3);
  const white1End = billionaire + 28;
  const humans = minAfter(at('humans') - 3, white1End, 26);
  const nineteen = minAfter(at('nineteen') - 3, humans, 34);
  const yellowEnd = nineteen + 28;
  const selfDriving = minAfter(at('self-driving') - 3, yellowEnd, 38);
  const millions = minAfter(at('millions') - 3, selfDriving, 26);
  const but = minAfter(at('but') - 2, millions, 24);
  const models = minAfter(at('models') - 2, but, 26);
  const year = minAfter(at('In') - 2, models, 28);
  const moneyStart = minAfter(at('fourteen') - 10, year, 26);
  const moneyEnd = Math.max(moneyStart + 36, endAt('dollars') + 7);
  const pctStart = minAfter(at('forty') - 2, moneyEnd, 2);
  const pctEnd = Math.max(pctStart + 28, endAt('percent') + 7);
  const finalStart = pctEnd;

  return (
    <AbsoluteFill>
      {/* Every source path below appears exactly once. */}
      <Clip from={0} to={billionaire} src="media/wang_leadership.mp4" startFrom={2} pos="50% 46%" brightness={1.12} />
      <Card from={billionaire} to={white1End} kind="white" hero="BILLIONAIRE" sub="AI'S DATA BOTTLENECK" />
      <Clip from={white1End} to={humans} src="media/server.mp4" startFrom={15} pos="50% 49%" brightness={1.14} />
      <Clip from={humans} to={nineteen} src="media/code_human.mp4" startFrom={25} pos="50% 50%" brightness={1.20} />
      <Card from={nineteen} to={yellowEnd} kind="yellow" hero="19" sub="MIT → SCALE AI" />
      <Clip from={yellowEnd} to={selfDriving} src="media/wang_gov24.mp4" startFrom={8} pos="50% 44%" brightness={1.13} />
      <Clip from={selfDriving} to={millions} src="media/autocar_wide.mp4" startFrom={12} pos="50% 48%" brightness={1.13} />
      <Clip from={millions} to={but} src="media/autocar_label.mp4" startFrom={18} pos="50% 48%" brightness={1.13} boxes />
      <Clip from={but} to={models} src="media/code_teach.mp4" startFrom={20} pos="50% 50%" brightness={1.22} />
      <Clip from={models} to={year} src="media/data_screen.mp4" startFrom={16} pos="50% 48%" brightness={1.24} />
      <Clip from={year} to={moneyStart} src="media/wang_gov23.mp4" startFrom={10} pos="50% 44%" brightness={1.14} />
      <Clip from={moneyStart} to={moneyEnd} src="media/finance_screen.mp4" startFrom={14} pos="50% 50%" brightness={1.22} />
      <Card from={pctStart} to={pctEnd} kind="white" hero="49%" sub="OF SCALE AI" />
      <Clip from={finalStart} to={TOTAL_FRAMES} src="media/wang_cnbc.mp4" startFrom={12} pos="53% 45%" brightness={1.15} />
    </AbsoluteFill>
  );
};

const Card: React.FC<{from:number; to:number; kind:'white'|'yellow'; hero:string; sub:string}> = ({from,to,kind,hero,sub}) => (
  <Sequence from={from} durationInFrames={Math.max(MIN_HOLD,to-from)}>
    <CardInner kind={kind} hero={hero} sub={sub} />
  </Sequence>
);

const CardInner: React.FC<{kind:'white'|'yellow'; hero:string; sub:string}> = ({kind,hero,sub}) => {
  const f = useCurrentFrame();
  const y = interpolate(f,[0,6],[28,0],{extrapolateRight:'clamp'});
  const opacity = interpolate(f,[0,4],[0,1],{extrapolateRight:'clamp'});
  const bg = kind === 'yellow' ? YELLOW : CREAM;
  return (
    <AbsoluteFill style={{background:bg, color:BLACK, justifyContent:'center', alignItems:'center'}}>
      <div style={{opacity, transform:`translateY(${y}px)`, textAlign:'center'}}>
        <div style={{fontFamily:"'Arial Narrow', Arial, sans-serif", fontSize:210, fontWeight:900, letterSpacing:-9, lineHeight:.82}}>{hero}</div>
        <div style={{marginTop:30, fontFamily:'Arial, sans-serif', fontSize:30, fontWeight:900, letterSpacing:9}}>{sub}</div>
      </div>
    </AbsoluteFill>
  );
};

const activeWord = (frame:number) => {
  if (!WORDS.length || frame < WORDS[0].startFrame) return -1;
  let n = 0;
  for (let i=0;i<WORDS.length;i++) {
    if (WORDS[i].startFrame <= frame) n=i; else break;
  }
  return n;
};

const isSpecialFrame = (frame:number) => {
  const b = Math.max(MIN_HOLD, at('billionaire') - 3);
  const n = minAfter(at('nineteen') - 3, minAfter(at('humans') - 3, b+28, 26), 34);
  const money = at('fourteen') - 10;
  const moneyEnd = endAt('dollars') + 7;
  const pct = at('forty') - 2;
  const pctEnd = endAt('percent') + 7;
  return (frame>=b && frame<b+28) || (frame>=n && frame<n+28) || (frame>=money && frame<=moneyEnd) || (frame>=pct && frame<=pctEnd);
};

const wordStyle = (item:TimedWord) => {
  const w = norm(item.word);
  if (['alexandr','wang','scale','meta'].includes(w)) return {size:80, weight:900, color:WHITE, font:"'Arial Narrow',Arial,sans-serif", entry:'hard'};
  if (w==='labeled' || w==='data') return {size:94, weight:900, color:YELLOW, font:"'Arial Narrow',Arial,sans-serif", entry:w==='data'?'punch':'rise'};
  if (w==='millions') return {size:103, weight:900, color:YELLOW, font:"'Arial Narrow',Arial,sans-serif", entry:'punch'};
  if (w==='humans' || w==='models') return {size:86, weight:900, color:WHITE, font:"Georgia,'Times New Roman',serif", entry:'blur'};
  if (w==='superintelligence') return {size:88, weight:900, color:YELLOW, font:"'Arial Narrow',Arial,sans-serif", entry:'rise'};
  if (w==='mit' || w==='cofounded') return {size:84, weight:900, color:YELLOW, font:"'Arial Narrow',Arial,sans-serif", entry:'hard'};
  return {size:61, weight:700, color:WHITE, font:'Arial,Helvetica,sans-serif', entry:'rise'};
};

const hiddenMoneyWords = new Set(['fourteen','point','three','billion','dollars','forty','nine','percent','nineteen','billionaire']);

const CaptionWord: React.FC<{item:TimedWord; frame:number}> = ({item,frame}) => {
  const s = wordStyle(item);
  const age = frame-item.startFrame;
  const reveal = interpolate(age,[0,5],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const rise = s.entry==='rise' ? interpolate(age,[0,5],[18,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}) : 0;
  const scale = s.entry==='punch' ? interpolate(age,[0,2,7],[.80,1.08,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}) : 1;
  const blur = s.entry==='blur' ? interpolate(age,[0,5],[10,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}) : 0;
  return <span style={{display:'inline-block', fontFamily:s.font, fontSize:s.size, fontWeight:s.weight, lineHeight:.95, letterSpacing:-1.5, color:s.color, opacity:s.entry==='hard'?1:reveal, transform:`translateY(${rise}px) scale(${scale})`, filter:`blur(${blur}px)`, textShadow:'0 3px 12px rgba(0,0,0,.86), WebkitTextStroke:'0.5px rgba(0,0,0,.35)'}}>{item.word}</span>;
};

const Captions: React.FC = () => {
  const frame=useCurrentFrame();
  const current=activeWord(frame);
  if (current<0 || isSpecialFrame(frame)) return null;
  const groupStart=Math.floor(current/4)*4;
  const visible=WORDS.slice(groupStart,current+1).filter(w=>!hiddenMoneyWords.has(norm(w.word)));
  return (
    <AbsoluteFill style={{pointerEvents:'none'}}>
      <div style={{position:'absolute', top:'47%', left:80, width:920, transform:'translateY(-50%)', display:'flex', flexWrap:'wrap', justifyContent:'center', alignItems:'baseline', gap:'10px 14px', textAlign:'center'}}>
        {visible.map((w,i)=><CaptionWord key={`${groupStart+i}-${w.startFrame}`} item={w} frame={frame}/>) }
      </div>
    </AbsoluteFill>
  );
};

const MoneyCounter: React.FC = () => {
  const frame=useCurrentFrame();
  const settle=at('fourteen');
  const start=settle-10;
  const end=endAt('dollars')+7;
  if(frame<start||frame>end) return null;
  const vals=['$0.8B','$2.4B','$5.9B','$8.7B','$11.2B','$12.9B','$13.8B','$14.1B','$14.2B','$14.3B'];
  const value=frame<settle?vals[Math.min(vals.length-1,Math.max(0,frame-start))]:'$14.3B';
  const age=frame-settle;
  const scale=frame<settle?1:interpolate(age,[0,2,8],[.84,1.10,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  return (
    <AbsoluteFill style={{justifyContent:'center',alignItems:'center',pointerEvents:'none'}}>
      <div style={{transform:`translateY(40px) scale(${scale})`, textAlign:'center', padding:'34px 42px', borderRadius:28, background:'rgba(247,242,232,.92)', boxShadow:'0 14px 55px rgba(0,0,0,.28)'}}>
        <div style={{fontFamily:"'Arial Narrow',Arial,sans-serif",fontSize:172,fontWeight:900,letterSpacing:-8,lineHeight:.84,color:BLACK}}>{value}</div>
        <div style={{marginTop:22,fontFamily:'Arial,sans-serif',fontSize:31,fontWeight:900,letterSpacing:8,color:BLACK}}>META → SCALE AI</div>
      </div>
    </AbsoluteFill>
  );
};

const GrowthWatermark: React.FC = () => {
  const frame=useCurrentFrame();
  const b=Math.max(MIN_HOLD,at('billionaire')-3);
  const n=minAfter(at('nineteen')-3,minAfter(at('humans')-3,b+28,26),34);
  const pct=at('forty')-2;
  const onCard=(frame>=b&&frame<b+28)||(frame>=n&&frame<n+28)||(frame>=pct&&frame<=endAt('percent')+7);
  const color=onCard?BLACK:YELLOW;
  return (
    <div style={{position:'absolute',bottom:78,left:'50%',transform:'translateX(-50%)',width:118,height:54,opacity:.21,pointerEvents:'none'}}>
      <svg width="118" height="54" viewBox="0 0 118 54" fill="none"><path d="M5 45 L32 31 L55 37 L91 10" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/><path d="M77 10 H91 V24" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/><circle cx="5" cy="45" r="4" fill={color}/></svg>
    </div>
  );
};

const Sound:React.FC=()=> {
  const money=Math.max(0,at('fourteen')-10);
  return <>
    <Audio src={staticFile('media/narration.mp3')} volume={1}/>
    <Audio src={staticFile('media/music.m4a')} volume={0.19}/>
    <Sequence from={0} durationInFrames={20}><Audio src={staticFile('media/impact.wav')} volume={.46}/></Sequence>
    <Sequence from={Math.max(0,at('billionaire')-4)} durationInFrames={24}><Audio src={staticFile('media/whoosh.wav')} volume={.36}/></Sequence>
    <Sequence from={Math.max(0,at('data')-2)} durationInFrames={14}><Audio src={staticFile('media/paper-tick.wav')} volume={.38}/></Sequence>
    <Sequence from={Math.max(0,at('nineteen')-2)} durationInFrames={20}><Audio src={staticFile('media/impact.wav')} volume={.42}/></Sequence>
    <Sequence from={Math.max(0,at('millions')-4)} durationInFrames={22}><Audio src={staticFile('media/whoosh.wav')} volume={.31}/></Sequence>
    <Sequence from={money} durationInFrames={26}><Audio src={staticFile('media/money-roll.wav')} volume={.58}/></Sequence>
    <Sequence from={at('fourteen')} durationInFrames={18}><Audio src={staticFile('media/cash-ding.wav')} volume={.68}/></Sequence>
    <Sequence from={Math.max(0,at('forty')-2)} durationInFrames={22}><Audio src={staticFile('media/impact.wav')} volume={.52}/></Sequence>
    <Sequence from={Math.max(0,at('superintelligence')-12)} durationInFrames={30}><Audio src={staticFile('media/riser.wav')} volume={.38}/></Sequence>
  </>;
};

export const ZelroAlexandrWang:React.FC=()=> (
  <AbsoluteFill style={{background:CREAM}}>
    <Timeline/>
    <Captions/>
    <MoneyCounter/>
    <GrowthWatermark/>
    <Sound/>
    <div style={{position:'absolute',top:64,left:72,fontFamily:'Arial,sans-serif',fontSize:22,fontWeight:900,letterSpacing:4,color:YELLOW,textShadow:'0 2px 8px rgba(0,0,0,.55)',opacity:.82}}>ZELRO</div>
  </AbsoluteFill>
);
