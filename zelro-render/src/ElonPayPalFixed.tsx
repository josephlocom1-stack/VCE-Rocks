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
const CREAM = '#F2EDDF';
const BLACK = '#10100E';
const WHITE = '#FFFFFF';
const RED = '#E84B42';
const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const start = (i: number) => SENTENCE_STARTS[i] ?? TOTAL_FRAMES;

type Beat = {
  kicker: string;
  hero: string;
  detail: string;
  palette: 'dark' | 'cream' | 'yellow';
  visual: 'board' | 'money' | 'equity' | 'timeline' | 'browser' | 'ymca' | 'xcom' | 'stack' | 'email' | 'merge' | 'filing' | 'callback';
};

const beats: Beat[] = [
  {kicker:'SEPTEMBER 2000',hero:'REMOVED\nAS CEO',detail:'The board removed him from the top job.',palette:'dark',visual:'board'},
  {kicker:'TWO YEARS LATER',hero:'$1.5B',detail:'eBay buys PayPal.',palette:'cream',visual:'money'},
  {kicker:'BUT OWNERSHIP REMAINED',hero:'≈12%',detail:'He still owned roughly twelve percent.',palette:'yellow',visual:'equity'},
  {kicker:'MEET',hero:'ELON\nMUSK',detail:'The ownership story starts years earlier.',palette:'dark',visual:'timeline'},
  {kicker:'1995',hero:'ZIP2',detail:'Musk and his brother build local-business software.',palette:'cream',visual:'browser'},
  {kicker:'THE PRODUCT',hero:'LISTINGS\n→ ONLINE',detail:'Newspapers could put local business directories on the web.',palette:'dark',visual:'browser'},
  {kicker:'FOUNDER MODE',hero:'OFFICE BED.\nYMCA SHOWER.',detail:'A direct recollection from his early Silicon Valley years.',palette:'yellow',visual:'ymca'},
  {kicker:'1999',hero:'$307M',detail:'Compaq buys Zip2 for cash.',palette:'cream',visual:'money'},
  {kicker:'MUSK OWNED 7%',hero:'7% → $22M',detail:'The stake funds his next move.',palette:'dark',visual:'money'},
  {kicker:'HE PUT MOST OF IT BACK IN',hero:'X.COM',detail:'A new online bank.',palette:'yellow',visual:'xcom'},
  {kicker:'THE PLAN WAS HUGE',hero:'ONE WEBSITE',detail:'Banking + investments + payments.',palette:'dark',visual:'stack'},
  {kicker:'USERS WANTED ONE SIMPLE THING',hero:'SEND MONEY\nBY EMAIL',detail:'The simplest feature became the behavior that mattered.',palette:'cream',visual:'email'},
  {kicker:'ANOTHER STARTUP',hero:'CONFINITY',detail:'It had a similar payment service called PayPal.',palette:'dark',visual:'merge'},
  {kicker:'2000',hero:'X.COM +\nCONFINITY',detail:'The companies merge. Musk becomes CEO.',palette:'yellow',visual:'merge'},
  {kicker:'THEN THE BOARD ACTED',hero:'CEO → OUT',detail:'The title disappeared.',palette:'dark',visual:'board'},
  {kicker:'THE KEY DISTINCTION',hero:'THE JOB ≠\nTHE SHARES',detail:'Losing the CEO role did not erase ownership.',palette:'yellow',visual:'equity'},
  {kicker:'PAYPAL S-1/A • FEB 2002',hero:'13.0% → 11.9%',detail:'SEC principal-stockholders figures: before / after offering.',palette:'cream',visual:'filing'},
  {kicker:'OCTOBER 2002',hero:'$1.5 BILLION',detail:'eBay completes the PayPal acquisition.',palette:'dark',visual:'money'},
  {kicker:'THE CALLBACK',hero:'LOST THE\nCEO JOB',detail:'Position gone.',palette:'cream',visual:'callback'},
  {kicker:'BUT',hero:'KEPT THE\nSHARES',detail:'Ownership stayed.',palette:'yellow',visual:'callback'},
  {kicker:'MUSK LATER SAID',hero:'≈$180M',detail:'After tax from the PayPal sale.',palette:'dark',visual:'money'},
];

const palette = (name: Beat['palette']) => {
  if (name === 'yellow') return {bg:YELLOW, fg:BLACK, accent:BLACK};
  if (name === 'cream') return {bg:CREAM, fg:BLACK, accent:RED};
  return {bg:BLACK, fg:WHITE, accent:YELLOW};
};

const Texture: React.FC<{dark:boolean}> = ({dark}) => (
  <AbsoluteFill style={{
    opacity: dark ? 0.10 : 0.07,
    backgroundImage: 'radial-gradient(circle at 20% 15%, rgba(255,255,255,.32) 0 1px, transparent 1.4px),radial-gradient(circle at 77% 61%, rgba(0,0,0,.30) 0 1px, transparent 1.4px)',
    backgroundSize:'20px 20px, 29px 29px',
    mixBlendMode: dark ? 'screen' : 'multiply',
  }}/>
);

const Chrome: React.FC<{accent:string}> = ({accent}) => {
  const frame = useCurrentFrame();
  const w = interpolate(frame,[0,12],[0,1],clamp);
  return <>
    <div style={{position:'absolute',left:54,right:54,top:58,height:6,background:accent,transform:`scaleX(${w})`,transformOrigin:'left center'}}/>
    <div style={{position:'absolute',left:54,right:54,bottom:67,height:2,background:'currentColor',opacity:.22}}/>
    <div style={{position:'absolute',left:54,bottom:29,fontFamily:'Arial, sans-serif',fontSize:19,fontWeight:900,letterSpacing:4}}>ZELRO / BUSINESS STORIES</div>
  </>;
};

const BoardGraphic: React.FC<{accent:string}> = ({accent}) => {
  const frame = useCurrentFrame();
  const strike = interpolate(frame,[16,30],[0,1],clamp);
  return <div style={{position:'absolute',left:78,right:78,top:930,height:430}}>
    <div style={{height:125,border:'4px solid currentColor',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 34px',fontFamily:'Arial Black, Arial, sans-serif',fontSize:42}}><span>CHIEF EXECUTIVE</span><span>CEO</span></div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:16,marginTop:42}}>{[0,1,2,3,4].map(i=><div key={i} style={{height:120,border:'3px solid currentColor',opacity:.28+i*.10}}/>)}</div>
    <div style={{position:'absolute',left:8,right:8,top:69,height:18,background:accent,transform:`rotate(-7deg) scaleX(${strike})`,transformOrigin:'center'}}/>
  </div>;
};

const MoneyGraphic: React.FC<{accent:string; hero:string}> = ({accent,hero}) => {
  const frame = useCurrentFrame();
  const p = spring({frame,fps:30,config:{damping:17,stiffness:95}});
  return <div style={{position:'absolute',left:82,right:82,top:950,height:400,border:'5px solid currentColor',padding:36,overflow:'hidden'}}>
    <div style={{fontFamily:'Arial, sans-serif',fontSize:24,fontWeight:950,letterSpacing:5}}>VALUE / OWNERSHIP PAYOFF</div>
    <div style={{fontFamily:'Arial Black, Impact, sans-serif',fontSize:hero.length>8?105:150,fontWeight:950,letterSpacing:-7,color:accent,marginTop:38,transform:`scale(${.84+p*.16})`,transformOrigin:'left center'}}>{hero.replace('\n',' ')}</div>
    <div style={{position:'absolute',left:36,right:36,bottom:38,height:16,background:'currentColor',opacity:.14}}><div style={{height:'100%',width:`${interpolate(frame,[8,48],[0,100],clamp)}%`,background:accent,opacity:1}}/></div>
  </div>;
};

const EquityGraphic: React.FC<{accent:string}> = ({accent}) => {
  const frame = useCurrentFrame();
  const pct = interpolate(frame,[7,35],[0,12],clamp);
  return <div style={{position:'absolute',left:135,right:135,top:910,height:500,display:'flex',alignItems:'center',justifyContent:'center'}}>
    <div style={{position:'absolute',width:470,height:470,borderRadius:'50%',border:'64px solid currentColor',opacity:.12}}/>
    <div style={{textAlign:'center'}}><div style={{fontFamily:'Arial Black, Impact, sans-serif',fontSize:165,letterSpacing:-9,color:accent}}>{pct.toFixed(0)}%</div><div style={{fontFamily:'Arial, sans-serif',fontSize:28,fontWeight:950,letterSpacing:6}}>EQUITY DOESN'T VANISH WITH A TITLE</div></div>
  </div>;
};

const TimelineGraphic: React.FC<{accent:string}> = ({accent}) => {
  const frame = useCurrentFrame();
  const items = ['1995\nZIP2','1999\nX.COM','2000\nPAYPAL','2002\n$1.5B'];
  return <div style={{position:'absolute',left:68,right:68,top:980,display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>{items.map((x,i)=>{
    const y=interpolate(frame,[i*5,i*5+12],[36,0],clamp); const o=interpolate(frame,[i*5,i*5+8],[0,1],clamp);
    return <div key={x} style={{height:260,border:`4px solid ${i===3?accent:'currentColor'}`,opacity:o,padding:18,fontFamily:'Arial Black, Arial, sans-serif',fontSize:31,lineHeight:1.05,whiteSpace:'pre-line',transform:`translateY(${y}px)`}}>{x}</div>;
  })}</div>;
};

const BrowserGraphic: React.FC<{accent:string}> = ({accent}) => {
  const frame = useCurrentFrame();
  return <div style={{position:'absolute',left:72,right:72,top:900,height:525,border:'5px solid currentColor',padding:28}}>
    <div style={{display:'flex',gap:10,marginBottom:30}}>{[0,1,2].map(i=><div key={i} style={{width:18,height:18,borderRadius:20,background:i===0?accent:'currentColor',opacity:.65}}/>)}</div>
    <div style={{fontFamily:'Courier New, monospace',fontSize:30,fontWeight:900}}>ZIP2 / CITY DIRECTORY</div>
    {[0,1,2,3].map(i=>{const x=interpolate(frame,[i*5,i*5+10],[-28,0],clamp);return <div key={i} style={{marginTop:26,display:'grid',gridTemplateColumns:'85px 1fr 150px',gap:18,alignItems:'center',opacity:interpolate(frame,[i*5,i*5+8],[0,1],clamp),transform:`translateX(${x}px)`}}><div style={{height:55,background:i===0?accent:'currentColor',opacity:.68}}/><div style={{height:14,background:'currentColor',opacity:.42}}/><div style={{height:14,background:'currentColor',opacity:.20}}/></div>})}
  </div>;
};

const YmcaGraphic: React.FC<{accent:string}> = ({accent}) => {
  const frame = useCurrentFrame();
  const water = interpolate(frame,[5,45],[0,1],clamp);
  return <div style={{position:'absolute',left:104,right:104,top:980,display:'grid',gridTemplateColumns:'1fr 1fr',gap:28}}>
    <div style={{height:380,border:'5px solid currentColor',padding:28}}><div style={{fontFamily:'Arial Black',fontSize:29}}>OFFICE</div><div style={{marginTop:78,width:270,height:105,border:'8px solid currentColor'}}/><div style={{marginTop:15,width:325,height:26,background:'currentColor',opacity:.36}}/></div>
    <div style={{height:380,border:'5px solid currentColor',padding:28,position:'relative'}}><div style={{fontFamily:'Arial Black',fontSize:29}}>YMCA</div><div style={{position:'absolute',left:92,top:130,width:190,height:22,background:'currentColor'}}/><div style={{position:'absolute',left:236,top:130,width:22,height:85,background:'currentColor'}}/><div style={{position:'absolute',left:126,top:207,width:12,height:105*water,borderRadius:9,background:accent,opacity:.75}}/><div style={{position:'absolute',left:190,top:215,width:12,height:125*water,borderRadius:9,background:accent,opacity:.46}}/></div>
  </div>;
};

const XcomGraphic: React.FC = () => {
  const frame=useCurrentFrame(); const p=spring({frame,fps:30,config:{damping:18,stiffness:85}});
  return <div style={{position:'absolute',left:108,right:108,top:940,height:500,border:'7px solid currentColor',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{fontFamily:'Arial Black, Impact, sans-serif',fontSize:205,letterSpacing:-15,transform:`scale(${.9+p*.1})`}}>X.COM</div></div>;
};

const StackGraphic: React.FC<{accent:string}> = ({accent}) => {
  const frame=useCurrentFrame(); return <div style={{position:'absolute',left:82,right:82,top:930,display:'grid',gap:17}}>{['BANKING','INVESTMENTS','PAYMENTS'].map((x,i)=>{const dx=interpolate(frame,[i*6,i*6+12],[-65,0],clamp);return <div key={x} style={{height:126,border:`4px solid ${i===2?accent:'currentColor'}`,padding:'0 32px',display:'flex',alignItems:'center',justifyContent:'space-between',fontFamily:'Arial Black, Arial, sans-serif',fontSize:44,opacity:interpolate(frame,[i*6,i*6+8],[0,1],clamp),transform:`translateX(${dx}px)`}}><span>{x}</span><span style={{color:accent}}>0{i+1}</span></div>})}</div>;
};

const EmailGraphic: React.FC<{accent:string}> = ({accent}) => {
  const frame=useCurrentFrame(); const p=interpolate(frame,[10,50],[0,1],clamp);
  return <div style={{position:'absolute',left:78,right:78,top:1010,display:'grid',gridTemplateColumns:'1fr 180px 1fr',gap:16,alignItems:'center'}}><div style={{height:220,border:'5px solid currentColor',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Arial Black',fontSize:38}}>YOU</div><div style={{height:145,border:`5px solid ${accent}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:68,color:accent,transform:`scale(${.84+p*.16})`}}>✉</div><div style={{height:220,border:'5px solid currentColor',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Arial Black',fontSize:38}}>FRIEND</div></div>;
};

const MergeGraphic: React.FC<{accent:string}> = ({accent}) => {
  const frame=useCurrentFrame(); const p=interpolate(frame,[8,42],[0,1],clamp);
  return <div style={{position:'absolute',left:68,right:68,top:980,height:390}}><div style={{position:'absolute',left:0,top:50,width:350,height:160,border:'5px solid currentColor',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Arial Black',fontSize:45,transform:`translateX(${p*105}px)`}}>X.COM</div><div style={{position:'absolute',right:0,top:50,width:350,height:160,border:'5px solid currentColor',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Arial Black',fontSize:39,transform:`translateX(${-p*105}px)`}}>CONFINITY</div><div style={{position:'absolute',left:280,right:280,bottom:12,height:105,background:accent,color:accent===BLACK?WHITE:BLACK,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Arial Black',fontSize:42,opacity:interpolate(frame,[28,42],[0,1],clamp)}}>PAYPAL</div></div>;
};

const FilingGraphic: React.FC = () => {
  const frame=useCurrentFrame(); const reveal=interpolate(frame,[8,28],[0,1],clamp);
  return <div style={{position:'absolute',left:68,right:68,top:875,height:575,border:'4px solid #111',background:WHITE,color:BLACK,padding:32,boxShadow:'0 18px 0 rgba(0,0,0,.10)'}}><div style={{fontFamily:'Times New Roman, serif',fontWeight:900,fontSize:31}}>PAYPAL, INC. — FORM S-1/A</div><div style={{marginTop:8,fontFamily:'Arial, sans-serif',fontSize:20,fontWeight:900,letterSpacing:3}}>PRINCIPAL STOCKHOLDERS • 14 FEB 2002</div><div style={{marginTop:48,borderTop:'4px solid #111',borderBottom:'4px solid #111',display:'grid',gridTemplateColumns:'1.5fr 1fr 1fr',padding:'20px 8px',fontFamily:'Arial Black',fontSize:25}}><span>NAME</span><span>BEFORE</span><span>AFTER</span></div><div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr 1fr',padding:'29px 8px',fontFamily:'Arial Black',fontSize:34,background:`rgba(255,212,0,${.16+reveal*.52})`}}><span>ELON MUSK</span><span>13.0%</span><span>11.9%</span></div><div style={{marginTop:30,fontFamily:'Arial, sans-serif',fontSize:24,fontWeight:700,lineHeight:1.35}}>Evidence graphic using the figures from PayPal's SEC filing. It is not presented as a historical screenshot.</div></div>;
};

const Visual: React.FC<{beat:Beat; accent:string}> = ({beat,accent}) => {
  if(beat.visual==='board') return <BoardGraphic accent={accent}/>;
  if(beat.visual==='money') return <MoneyGraphic accent={accent} hero={beat.hero}/>;
  if(beat.visual==='equity') return <EquityGraphic accent={accent}/>;
  if(beat.visual==='timeline') return <TimelineGraphic accent={accent}/>;
  if(beat.visual==='browser') return <BrowserGraphic accent={accent}/>;
  if(beat.visual==='ymca') return <YmcaGraphic accent={accent}/>;
  if(beat.visual==='xcom') return <XcomGraphic/>;
  if(beat.visual==='stack') return <StackGraphic accent={accent}/>;
  if(beat.visual==='email') return <EmailGraphic accent={accent}/>;
  if(beat.visual==='merge') return <MergeGraphic accent={accent}/>;
  if(beat.visual==='filing') return <FilingGraphic/>;
  return <MoneyGraphic accent={accent} hero={beat.hero}/>;
};

const Scene: React.FC<{beat:Beat}> = ({beat}) => {
  const frame=useCurrentFrame(); const {fps}=useVideoConfig(); const c=palette(beat.palette); const p=spring({frame,fps,config:{damping:19,stiffness:100,mass:.9}}); const y=interpolate(p,[0,1],[62,0],clamp);
  return <AbsoluteFill style={{background:c.bg,color:c.fg,overflow:'hidden'}}><Texture dark={beat.palette==='dark'}/><Chrome accent={c.accent}/><div style={{position:'absolute',left:68,right:68,top:145}}><div style={{fontFamily:'Arial, sans-serif',fontSize:26,fontWeight:950,letterSpacing:6,color:c.accent,opacity:interpolate(frame,[0,7],[0,1],clamp)}}>{beat.kicker}</div><div style={{marginTop:24,fontFamily:'Arial Black, Impact, sans-serif',fontSize:beat.hero.length>18?103:120,lineHeight:.88,letterSpacing:-6,whiteSpace:'pre-line',opacity:interpolate(frame,[0,9],[0,1],clamp),transform:`translateY(${y}px)`}}>{beat.hero}</div><div style={{marginTop:27,maxWidth:865,fontFamily:'Georgia, Times New Roman, serif',fontSize:38,lineHeight:1.16,fontWeight:700,fontStyle:'italic',opacity:interpolate(frame,[9,20],[0,1],clamp)}}>{beat.detail}</div></div><Visual beat={beat} accent={c.accent}/></AbsoluteFill>;
};

const CaptionLayer: React.FC = () => {
  const frame=useCurrentFrame(); const phrase=PHRASES.find(p=>frame>=p.startFrame&&frame<=p.endFrame); if(!phrase)return null;
  return <div style={{position:'absolute',left:62,right:62,bottom:128,zIndex:80,display:'flex',justifyContent:'center'}}><div style={{maxWidth:950,display:'flex',flexWrap:'wrap',justifyContent:'center',gap:16,padding:'17px 23px 15px',background:'rgba(16,16,14,.86)',boxShadow:'0 12px 40px rgba(0,0,0,.22)'}}>{phrase.words.map((word,i)=>{const d=frame-word.startFrame;const visible=d>=0;const emph=i===phrase.emphasis;const dy=visible?interpolate(d,[0,5],[emph?22:10,0],clamp):20;const sc=visible?interpolate(d,[0,4],[emph?.91:.97,1],clamp):.96;return <span key={`${word.word}-${word.startFrame}`} style={{fontFamily:emph?'Arial Black, Impact, sans-serif':'Arial, sans-serif',fontWeight:emph?950:800,fontSize:emph?78:65,lineHeight:.96,color:emph?YELLOW:WHITE,letterSpacing:emph?-2:-1,opacity:visible?interpolate(d,[0,3],[0,1],clamp):0,transform:`translateY(${dy}px) scale(${sc})`}}>{word.word}</span>})}</div></div>;
};

const SoundDesign: React.FC = () => <>{[0,14,18].map(i=><Sequence key={`impact-${i}`} from={start(i)} durationInFrames={28}><Audio src={staticFile('media/impact.wav')} volume={0.32}/></Sequence>)}{[1,7,8,16,17,20].map(i=><Sequence key={`proof-${i}`} from={start(i)} durationInFrames={20}><Audio src={staticFile('media/proof.wav')} volume={0.22}/></Sequence>)}{[9,12,13,19].map(i=><Sequence key={`riser-${i}`} from={Math.max(0,start(i)-7)} durationInFrames={25}><Audio src={staticFile('media/riser.wav')} volume={0.16}/></Sequence>)}</>;

export const ElonPayPalReel: React.FC<{prototype?:boolean}> = ({prototype=false}) => {
  const count=prototype?5:beats.length;
  return <AbsoluteFill style={{background:BLACK}}>{beats.slice(0,count).map((beat,i)=><Sequence key={i} from={start(i)} durationInFrames={Math.max(24,start(i+1)-start(i)+3)}><Scene beat={beat}/></Sequence>)}<Audio src={staticFile('media/music.m4a')} volume={0.16}/><Audio src={staticFile('media/narration.mp3')} volume={1}/><SoundDesign/><CaptionLayer/></AbsoluteFill>;
};
