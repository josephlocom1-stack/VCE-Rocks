import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {PHRASES, SENTENCE_STARTS, TOTAL_FRAMES} from './timings';

const YELLOW = '#FFD400';
const CREAM = '#F3EEDF';
const BLACK = '#11110F';
const CHARCOAL = '#24231F';
const WHITE = '#FFFFFF';
const RED = '#E5483F';
const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const s = (i: number) => SENTENCE_STARTS[i] ?? TOTAL_FRAMES;

type Beat = {
  eyebrow: string;
  title: string;
  sub?: string;
  kind: 'board' | 'deal' | 'equity' | 'identity' | 'zip2' | 'listing' | 'ymca' | 'equation' | 'xcom' | 'stack' | 'email' | 'merge' | 'sec' | 'card' | 'final';
  bg?: string;
  fg?: string;
  accent?: string;
};

const beats: Beat[] = [
  {eyebrow: 'SEPTEMBER 2000', title: 'REMOVED\nAS CEO.', sub: 'From the company he helped build.', kind: 'board', bg: BLACK, fg: WHITE, accent: RED},
  {eyebrow: 'TWO YEARS LATER', title: '$1.5B', sub: 'eBay buys PayPal.', kind: 'deal', bg: CREAM, fg: BLACK, accent: YELLOW},
  {eyebrow: 'THE PART THAT MATTERED', title: '≈12%', sub: 'He still owned the shares.', kind: 'equity', bg: YELLOW, fg: BLACK, accent: BLACK},
  {eyebrow: 'MEET', title: 'ELON\nMUSK', sub: 'Before Tesla. Before SpaceX.', kind: 'identity', bg: BLACK, fg: WHITE, accent: YELLOW},
  {eyebrow: '1995', title: 'ZIP2', sub: 'Musk + his brother built local-business software.', kind: 'zip2', bg: CREAM, fg: BLACK, accent: YELLOW},
  {eyebrow: 'THE PRODUCT', title: 'LOCAL\nLISTINGS → WEB', sub: 'Helping newspapers put city directories online.', kind: 'listing', bg: BLACK, fg: WHITE, accent: YELLOW},
  {eyebrow: 'FOUNDER MODE', title: 'OFFICE BED.\nYMCA SHOWER.', sub: 'A direct Musk recollection from his early Silicon Valley days.', kind: 'ymca', bg: YELLOW, fg: BLACK, accent: BLACK},
  {eyebrow: '1999', title: '$307M', sub: 'Compaq buys Zip2 for cash.', kind: 'deal', bg: CREAM, fg: BLACK, accent: RED},
  {eyebrow: 'MUSK OWNED 7%', title: '7%  →  $22M', sub: 'His stake became the next bet.', kind: 'equation', bg: BLACK, fg: WHITE, accent: YELLOW},
  {eyebrow: 'HE DIDN’T STOP', title: 'X.COM', sub: 'Most of the money went into a new online bank.', kind: 'xcom', bg: YELLOW, fg: BLACK, accent: BLACK},
  {eyebrow: 'THE PLAN', title: 'ONE WEBSITE', sub: 'Banking + investments + payments.', kind: 'stack', bg: BLACK, fg: WHITE, accent: YELLOW},
  {eyebrow: 'BUT USERS LOVED ONE THING', title: 'SEND MONEY\nBY EMAIL', sub: 'A simple behavior beat the giant vision.', kind: 'email', bg: CREAM, fg: BLACK, accent: RED},
  {eyebrow: 'ANOTHER STARTUP', title: 'CONFINITY', sub: 'It had a similar payment product called PayPal.', kind: 'merge', bg: BLACK, fg: WHITE, accent: YELLOW},
  {eyebrow: '2000', title: 'X.COM + CONFINITY', sub: 'Merged. Musk became CEO.', kind: 'merge', bg: YELLOW, fg: BLACK, accent: BLACK},
  {eyebrow: 'THEN THE BOARD ACTED', title: 'CEO → OUT', sub: 'The job disappeared.', kind: 'board', bg: BLACK, fg: WHITE, accent: RED},
  {eyebrow: 'BUT OWNERSHIP WORKS DIFFERENTLY', title: 'LOSING THE CEO JOB\nDIDN’T ERASE HIS SHARES.', kind: 'card', bg: YELLOW, fg: BLACK, accent: BLACK},
  {eyebrow: 'PAYPAL S-1/A • 14 FEB 2002', title: '13.0%  →  11.9%', sub: 'SEC principal-stockholders table: before / after offering.', kind: 'sec', bg: CREAM, fg: BLACK, accent: RED},
  {eyebrow: 'OCTOBER 2002', title: '$1.5 BILLION', sub: 'eBay completes the PayPal acquisition.', kind: 'deal', bg: BLACK, fg: WHITE, accent: YELLOW},
  {eyebrow: 'THE CALLBACK', title: 'LOST THE\nCEO JOB.', kind: 'card', bg: CREAM, fg: BLACK, accent: RED},
  {eyebrow: 'BUT', title: 'KEPT THE\nSHARES.', kind: 'card', bg: YELLOW, fg: BLACK, accent: BLACK},
  {eyebrow: 'MUSK LATER SAID', title: '≈$180M', sub: 'After tax from the PayPal sale.', kind: 'final', bg: BLACK, fg: WHITE, accent: YELLOW},
];

const Texture: React.FC<{dark?: boolean}> = ({dark = false}) => (
  <AbsoluteFill
    style={{
      opacity: dark ? 0.12 : 0.08,
      backgroundImage:
        'radial-gradient(circle at 20% 10%, rgba(255,255,255,.35) 0 1px, transparent 1.5px), radial-gradient(circle at 75% 55%, rgba(0,0,0,.3) 0 1px, transparent 1.5px)',
      backgroundSize: '18px 18px, 27px 27px',
      mixBlendMode: dark ? 'screen' : 'multiply',
    }}
  />
);

const FrameLines: React.FC<{accent: string}> = ({accent}) => {
  const frame = useCurrentFrame();
  return (
    <>
      <div style={{position: 'absolute', left: 56, right: 56, top: 58, height: 5, background: accent, scale: `${interpolate(frame, [0, 10], [0, 1], clamp)} 1`, transformOrigin: 'left'}} />
      <div style={{position: 'absolute', left: 56, right: 56, bottom: 66, height: 2, background: 'currentColor', opacity: 0.25}} />
      <div style={{position: 'absolute', left: 56, bottom: 30, fontFamily: 'Arial, sans-serif', fontWeight: 800, fontSize: 20, letterSpacing: 4}}>ZELRO / BUSINESS STORIES</div>
    </>
  );
};

const BoardVisual: React.FC<{accent: string}> = ({accent}) => {
  const frame = useCurrentFrame();
  const strike = interpolate(frame, [18, 30], [0, 1], clamp);
  return (
    <div style={{position: 'absolute', left: 80, right: 80, top: 910, height: 450}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 20, height: 120, border: '4px solid currentColor', display: 'grid', gridTemplateColumns: '1.3fr .7fr', alignItems: 'center', padding: '0 36px', fontFamily: 'Arial Black, Arial, sans-serif', fontSize: 42}}>
        <span>CHIEF EXECUTIVE</span><span style={{textAlign: 'right'}}>CEO</span>
      </div>
      <div style={{position: 'absolute', left: 28, right: 28, top: 185, display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 18}}>
        {[0,1,2,3,4].map((n) => <div key={n} style={{height: 120, border: '3px solid currentColor', opacity: .32 + n * .09}} />)}
      </div>
      <div style={{position: 'absolute', left: 6, right: 6, top: 78, height: 18, background: accent, rotate: '-7deg', scale: `${strike} 1`, transformOrigin: 'center'}} />
    </div>
  );
};

const DealVisual: React.FC<{accent: string}> = ({accent}) => {
  const frame = useCurrentFrame();
  const p = spring({frame, fps: 30, config: {damping: 17, stiffness: 105}});
  return (
    <div style={{position: 'absolute', left: 80, right: 80, top: 930, height: 360, border: '5px solid currentColor', padding: 36, overflow: 'hidden'}}>
      <div style={{fontFamily: 'Arial, sans-serif', fontWeight: 900, letterSpacing: 5, fontSize: 24}}>TRANSACTION VALUE</div>
      <div style={{marginTop: 34, fontFamily: 'Arial Black, Impact, sans-serif', fontSize: 118, letterSpacing: -6, color: accent, scale: .82 + p * .18, transformOrigin: 'left center'}}>$1.5B</div>
      <div style={{position: 'absolute', left: 36, right: 36, bottom: 38, height: 16, background: 'rgba(127,127,127,.25)'}}>
        <div style={{height: '100%', width: `${interpolate(frame, [8, 48], [0, 100], clamp)}%`, background: accent}} />
      </div>
    </div>
  );
};

const EquityVisual: React.FC = () => {
  const frame = useCurrentFrame();
  const pct = interpolate(frame, [6, 34], [0, 12], clamp);
  return (
    <div style={{position: 'absolute', left: 165, top: 900, width: 750, height: 520}}>
      <div style={{position: 'absolute', left: 110, top: 0, width: 510, height: 510, borderRadius: '50%', border: '66px solid rgba(17,17,15,.15)'}} />
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
        <div style={{fontFamily: 'Arial Black, Impact, sans-serif', fontSize: 160, letterSpacing: -8}}>{pct.toFixed(0)}%</div>
        <div style={{fontFamily: 'Arial, sans-serif', fontWeight: 900, letterSpacing: 5, fontSize: 28}}>OWNERSHIP</div>
      </div>
    </div>
  );
};

const IdentityVisual: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{position: 'absolute', left: 74, right: 74, top: 980, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12}}>
      {['1995\nZIP2','1999\nX.COM','2000\nPAYPAL','2002\n$1.5B'].map((x, i) => (
        <div key={x} style={{height: 260, border: `4px solid ${i === 3 ? YELLOW : 'rgba(255,255,255,.42)'}`, padding: 20, whiteSpace: 'pre-line', fontFamily: 'Arial Black, Arial, sans-serif', fontSize: 31, lineHeight: 1.05, translate: `0 ${interpolate(frame, [i * 4, i * 4 + 10], [36, 0], clamp)}px`, opacity: interpolate(frame, [i * 4, i * 4 + 8], [0, 1], clamp)}}>{x}</div>
      ))}
    </div>
  );
};

const Zip2Visual: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{position: 'absolute', left: 72, right: 72, top: 900, height: 520, border: '5px solid currentColor', background: 'rgba(255,255,255,.22)', padding: 30}}>
      <div style={{height: 54, display: 'flex', gap: 12}}>{[0,1,2].map(i => <div key={i} style={{width: 20, height: 20, borderRadius: 20, background: i === 0 ? RED : 'currentColor', opacity: .55}} />)}</div>
      <div style={{fontFamily: 'Courier New, monospace', fontSize: 30, fontWeight: 900}}>ZIP2 / CITY DIRECTORY</div>
      {[0,1,2,3].map((i) => <div key={i} style={{marginTop: 24, display: 'grid', gridTemplateColumns: '84px 1fr 160px', gap: 20, alignItems: 'center', opacity: interpolate(frame, [i*5, i*5+9], [0,1], clamp), translate: `${interpolate(frame,[i*5,i*5+9],[-28,0],clamp)}px 0`}}><div style={{height: 54, background: i===0 ? YELLOW : 'currentColor', opacity: .7}}/><div style={{height: 14, background: 'currentColor', opacity: .45}}/><div style={{height: 14, background: 'currentColor', opacity: .23}}/></div>)}
    </div>
  );
};

const ListingVisual: React.FC = () => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [8, 48], [0, 1], clamp);
  return (
    <div style={{position: 'absolute', left: 76, right: 76, top: 930, display: 'grid', gridTemplateColumns: '1fr 130px 1fr', gap: 20, alignItems: 'center'}}>
      <div style={{height: 460, background: CREAM, color: BLACK, padding: 28, rotate: `${-4 + x * 2}deg`}}><div style={{fontFamily: 'Georgia, serif', fontSize: 34, fontWeight: 900}}>CITY BUSINESS</div>{[0,1,2,3,4,5].map(i => <div key={i} style={{marginTop: 24, height: 12, background: BLACK, opacity: .18 + (i%2)*.12}}/> )}</div>
      <div style={{fontFamily: 'Arial Black, sans-serif', color: YELLOW, fontSize: 72, textAlign: 'center'}}>→</div>
      <div style={{height: 460, border: `5px solid ${YELLOW}`, padding: 26}}><div style={{fontFamily: 'Arial Black, sans-serif', fontSize: 29}}>ONLINE</div>{[0,1,2,3].map(i => <div key={i} style={{marginTop: 24, height: 60, border: '3px solid rgba(255,255,255,.42)', opacity: interpolate(frame,[18+i*4,26+i*4],[0,1],clamp)}}/> )}</div>
    </div>
  );
};

const YmcaVisual: React.FC = () => {
  const frame = useCurrentFrame();
  const drip = interpolate(frame, [0, 46], [0, 170], clamp);
  return (
    <div style={{position: 'absolute', left: 110, right: 110, top: 980, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30}}>
      <div style={{height: 390, border: '5px solid currentColor', padding: 30}}><div style={{fontSize: 30,fontFamily:'Arial Black'}}>OFFICE</div><div style={{marginTop: 80, width: 270,height:110,border:'8px solid currentColor'}}/><div style={{marginTop:16,width:330,height:28,background:'currentColor',opacity:.4}}/></div>
      <div style={{height: 390, border: '5px solid currentColor', padding: 30, position:'relative'}}><div style={{fontSize:30,fontFamily:'Arial Black'}}>YMCA</div><div style={{position:'absolute',left:90,top:130,width:190,height:24,background:'currentColor'}}/><div style={{position:'absolute',left:235,top:130,width:24,height:90,background:'currentColor'}}/><div style={{position:'absolute',left:105+drip*.25,top:210,width:14,height:90,borderRadius:12,background:'currentColor',opacity:.45}}/><div style={{position:'absolute',left:175,top:210+drip*.15,width:14,height:115,borderRadius:12,background:'currentColor',opacity:.35}}/></div>
    </div>
  );
};

const EquationVisual: React.FC<{accent: string}> = ({accent}) => {
  const frame = useCurrentFrame();
  return <div style={{position:'absolute',left:70,right:70,top:980,display:'grid',gridTemplateColumns:'1fr 120px 1.25fr',alignItems:'center',gap:18}}><div style={{fontFamily:'Arial Black,Impact,sans-serif',fontSize:128,textAlign:'center'}}>7%</div><div style={{fontSize:78,textAlign:'center',color:accent}}>→</div><div style={{fontFamily:'Arial Black,Impact,sans-serif',fontSize:118,textAlign:'center',color:accent,scale:.88+spring({frame,fps:30,config:{damping:16,stiffness:110}})*.12}}>$22M</div></div>;
};

const XcomVisual: React.FC = () => {
  const frame = useCurrentFrame();
  return <div style={{position:'absolute',left:115,right:115,top:925,height:510,border:'7px solid currentColor',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}><div style={{fontFamily:'Arial Black,Impact,sans-serif',fontSize:220,letterSpacing:-16,scale:.92+spring({frame,fps:30,config:{damping:18,stiffness:85}})*.08}}>X.COM</div><div style={{position:'absolute',left:0,bottom:0,height:22,width:`${interpolate(frame,[8,56],[0,100],clamp)}%`,background:BLACK}}/></div>;
};

const StackVisual: React.FC = () => {
  const frame = useCurrentFrame();
  return <div style={{position:'absolute',left:82,right:82,top:920,display:'grid',gap:18}}>{['BANKING','INVESTMENTS','PAYMENTS'].map((x,i)=><div key={x} style={{height:128,border:`4px solid ${i===2?YELLOW:'rgba(255,255,255,.42)'}`,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 34px',fontFamily:'Arial Black,Arial,sans-serif',fontSize:45,translate:`${interpolate(frame,[i*6,i*6+12],[-70,0],clamp)}px 0`,opacity:interpolate(frame,[i*6,i*6+8],[0,1],clamp)}}><span>{x}</span><span style={{color:i===2?YELLOW:WHITE}}>0{i+1}</span></div>)}</div>;
};

const EmailVisual: React.FC = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame,[12,52],[0,1],clamp);
  return <div style={{position:'absolute',left:75,right:75,top:990,display:'grid',gridTemplateColumns:'1fr 180px 1fr',gap:18,alignItems:'center'}}><div style={{height:230,border:'5px solid currentColor',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Arial Black',fontSize:38}}>YOU</div><div style={{height:150,border:`5px solid ${RED}`,position:'relative',display:'flex',alignItems:'center',justifyContent:'center',fontSize:70,color:RED,scale:.85+p*.15}}>✉</div><div style={{height:230,border:'5px solid currentColor',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Arial Black',fontSize:38}}>FRIEND</div><div style={{position:'absolute',left:250,right:250,top:260,height:10,background:'rgba(0,0,0,.15)'}}><div style={{height:'100%',width:`${p*100}%`,background:RED}}/></div></div>;
};

const MergeVisual: React.FC = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame,[10,46],[0,1],clamp);
  return <div style={{position:'absolute',left:70,right:70,top:970,height:420}}><div style={{position:'absolute',left:0,top:80,width:350,height:170,border:'5px solid currentColor',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Arial Black',fontSize:48,translate:`${p*105}px 0`}}>X.COM</div><div style={{position:'absolute',right:0,top:80,width:350,height:170,border:'5px solid currentColor',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Arial Black',fontSize:42,translate:`${-p*105}px 0`}}>CONFINITY</div><div style={{position:'absolute',left:280,right:280,bottom:10,height:110,background:YELLOW,color:BLACK,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Arial Black',fontSize:43,opacity:interpolate(frame,[32,45],[0,1],clamp)}}>PAYPAL</div></div>;
};

const SecVisual: React.FC = () => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame,[8,26],[0,1],clamp);
  return <div style={{position:'absolute',left:70,right:70,top:890,height:570,border:'4px solid currentColor',background:WHITE,color:BLACK,padding:34,boxShadow:'0 20px 0 rgba(0,0,0,.10)'}}><div style={{fontFamily:'Times New Roman,serif',fontWeight:900,fontSize:31}}>PAYPAL, INC. — FORM S-1/A</div><div style={{marginTop:9,fontFamily:'Arial,sans-serif',fontWeight:800,fontSize:20,letterSpacing:3}}>PRINCIPAL STOCKHOLDERS • 14 FEB 2002</div><div style={{marginTop:55,borderTop:'4px solid #111',borderBottom:'4px solid #111',display:'grid',gridTemplateColumns:'1.6fr 1fr 1fr',padding:'22px 10px',fontFamily:'Arial Black',fontSize:26}}><span>NAME</span><span>BEFORE</span><span>AFTER</span></div><div style={{display:'grid',gridTemplateColumns:'1.6fr 1fr 1fr',padding:'30px 10px',fontFamily:'Arial Black',fontSize:34,background:`linear-gradient(90deg,rgba(255,212,0,${.2+reveal*.5}),transparent)`}}><span>ELON MUSK</span><span>13.0%</span><span>11.9%</span></div><div style={{marginTop:32,fontFamily:'Arial,sans-serif',fontSize:25,lineHeight:1.35,fontWeight:700}}>Reconstructed evidence card using the figures in PayPal’s SEC filing. Not a fabricated historical screenshot.</div></div>;
};

const FinalVisual: React.FC = () => {
  const frame = useCurrentFrame();
  return <div style={{position:'absolute',left:60,right:60,top:850,textAlign:'center'}}><div style={{fontFamily:'Arial Black,Impact,sans-serif',fontSize:235,letterSpacing:-16,color:YELLOW,scale:.84+spring({frame,fps:30,config:{damping:16,stiffness:90}})*.16}}>≈$180M</div><div style={{marginTop:25,fontFamily:'Georgia,serif',fontStyle:'italic',fontWeight:700,fontSize:48}}>after tax</div></div>;
};

const Visual: React.FC<{beat: Beat}> = ({beat}) => {
  if (beat.kind === 'board') return <BoardVisual accent={beat.accent ?? YELLOW}/>;
  if (beat.kind === 'deal') return <DealVisual accent={beat.accent ?? YELLOW}/>;
  if (beat.kind === 'equity') return <EquityVisual/>;
  if (beat.kind === 'identity') return <IdentityVisual/>;
  if (beat.kind === 'zip2') return <Zip2Visual/>;
  if (beat.kind === 'listing') return <ListingVisual/>;
  if (beat.kind === 'ymca') return <YmcaVisual/>;
  if (beat.kind === 'equation') return <EquationVisual accent={beat.accent ?? YELLOW}/>;
  if (beat.kind === 'xcom') return <XcomVisual/>;
  if (beat.kind === 'stack') return <StackVisual/>;
  if (beat.kind === 'email') return <EmailVisual/>;
  if (beat.kind === 'merge') return <MergeVisual/>;
  if (beat.kind === 'sec') return <SecVisual/>;
  if (beat.kind === 'final') return <FinalVisual/>;
  return null;
};

const BeatScene: React.FC<{beat: Beat}> = ({beat}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 19, stiffness: 105, mass: .9}});
  const titleY = interpolate(enter,[0,1],[70,0],clamp);
  const isCard = beat.kind === 'card';
  return (
    <AbsoluteFill style={{background: beat.bg, color: beat.fg, overflow:'hidden'}}>
      <Texture dark={beat.bg === BLACK}/>
      <FrameLines accent={beat.accent ?? YELLOW}/>
      <div style={{position:'absolute',left:70,right:70,top:isCard?420:150}}>
        <div style={{fontFamily:'Arial, sans-serif',fontSize:27,fontWeight:950,letterSpacing:6,color:beat.accent ?? YELLOW,opacity:interpolate(frame,[0,7],[0,1],clamp)}}>{beat.eyebrow}</div>
        <div style={{marginTop:26,fontFamily:'Arial Black, Impact, sans-serif',fontSize:isCard?112:118,lineHeight:.88,letterSpacing:-6,whiteSpace:'pre-line',translate:`0 ${titleY}px`,opacity:interpolate(frame,[0,8],[0,1],clamp)}}>{beat.title}</div>
        {beat.sub ? <div style={{marginTop:30,maxWidth:850,fontFamily:'Georgia, Times New Roman, serif',fontSize:39,lineHeight:1.16,fontWeight:700,fontStyle:'italic',opacity:interpolate(frame,[10,20],[0,1],clamp)}}>{beat.sub}</div> : null}
      </div>
      {!isCard ? <Visual beat={beat}/> : <div style={{position:'absolute',left:70,right:70,bottom:420,height:22,background:'currentColor',opacity:.12}}><div style={{height:'100%',width:`${interpolate(frame,[10,55],[0,100],clamp)}%`,background:beat.accent ?? BLACK,opacity:1}}/></div>}
    </AbsoluteFill>
  );
};

const CaptionLayer: React.FC = () => {
  const frame = useCurrentFrame();
  const phrase = PHRASES.find((p) => frame >= p.startFrame && frame <= p.endFrame);
  if (!phrase) return null;
  return (
    <div style={{position:'absolute',left:66,right:66,bottom:130,zIndex:50,display:'flex',justifyContent:'center',pointerEvents:'none'}}>
      <div style={{display:'flex',gap:18,flexWrap:'wrap',justifyContent:'center',alignItems:'baseline',padding:'18px 24px 16px',background:'rgba(17,17,15,.84)',boxShadow:'0 12px 45px rgba(0,0,0,.24)',maxWidth:950}}>
        {phrase.words.map((word, i) => {
          const delta = frame - word.startFrame;
          const visible = delta >= 0;
          const emphasized = i === phrase.emphasis;
          return <span key={`${word.word}-${word.startFrame}`} style={{fontFamily:emphasized?'Arial Black, Impact, sans-serif':'Arial, sans-serif',fontWeight:emphasized?950:800,fontSize:emphasized?79:67,lineHeight:.95,color:emphasized?YELLOW:WHITE,opacity:visible?interpolate(delta,[0,3],[0,1],clamp):0,translate:`0 ${visible?interpolate(delta,[0,5],[emphasized?24:12,0],clamp):20}px`,scale:visible?interpolate(delta,[0,4],[emphasized?.91:.97,1],clamp):.96,letterSpacing:emphasized?-2:-1}}>{word.word}</span>;
        })}
      </div>
    </div>
  );
};

const SoundDesign: React.FC = () => (
  <>
    {[0,14,18].map((i) => <Sequence key={`impact-${i}`} from={s(i)} durationInFrames={30}><Audio src={staticFile('media/impact.wav')} volume={0.34}/></Sequence>)}
    {[1,7,8,16,17,20].map((i) => <Sequence key={`proof-${i}`} from={s(i)} durationInFrames={22}><Audio src={staticFile('media/proof.wav')} volume={0.24}/></Sequence>)}
    {[9,12,13,19].map((i) => <Sequence key={`riser-${i}`} from={Math.max(0,s(i)-8)} durationInFrames={28}><Audio src={staticFile('media/riser.wav')} volume={0.17}/></Sequence>)}
  </>
);

export const ElonPayPalReel: React.FC<{prototype?: boolean}> = ({prototype = false}) => {
  const maxBeat = prototype ? 5 : beats.length;
  return (
    <AbsoluteFill style={{background: BLACK}}>
      {beats.slice(0,maxBeat).map((beat,i) => (
        <Sequence key={i} from={s(i)} durationInFrames={Math.max(24,s(i+1)-s(i)+4)}>
          <BeatScene beat={beat}/>
        </Sequence>
      ))}
      <Audio src={staticFile('media/music.m4a')} volume={0.16}/>
      <Audio src={staticFile('media/narration.mp3')} volume={1}/>
      <SoundDesign/>
      <CaptionLayer/>
    </AbsoluteFill>
  );
};
