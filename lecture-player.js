/* Lecture Player - drop-in. Needs hls.js loaded before this file. Exposes window.LecturePlayer */
(()=>{
const IC={back:'<path d="M15 5l-7 7 7 7"/>',play:'<path d="M8 5l11 7-11 7z"/>',pause:'<path d="M8 5v14M16 5v14"/>',prev:'<path d="M18 5l-9 7 9 7z" fill="currentColor"/><path d="M6 5v14"/>',next:'<path d="M6 5l9 7-9 7z" fill="currentColor"/><path d="M18 5v14"/>',vol:'<path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M17 9a4 4 0 010 6"/>',mute:'<path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M17 9l4 6M21 9l-4 6"/>',gear:'<path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z"/><circle cx="12" cy="12" r="3"/>',dl:'<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',fs:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',pip:'<rect x="3" y="5" width="18" height="14" rx="2"/><rect x="12" y="11" width="7" height="5" rx="1"/>',more:'<circle cx="12" cy="5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="19" r="1.2"/>',lock:'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',unlock:'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 017-1.5"/>',tl:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',att:'<path d="M20 11l-8 8a5 5 0 01-7-7l8-8a3.5 3.5 0 015 5l-8 8a2 2 0 01-3-3l7-7"/>',list:'<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',side:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/>',x:'<path d="M6 6l12 12M18 6L6 18"/>',vid:'<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M10 9.5l4.5 2.5-4.5 2.5z"/><path d="M2 6v12M22 6v12"/>',cmp:'<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>',chev:'<path d="M9 5l7 7-7 7"/>',b10:'<path d="M4 4v5h5"/><path d="M4.6 9A8 8 0 1112 20"/><text x="12" y="15.3" font-size="8.5" font-weight="700" fill="currentColor" stroke="none" text-anchor="middle">10</text>',f10:'<path d="M20 4v5h-5"/><path d="M19.4 9A8 8 0 1012 20"/><text x="12" y="15.3" font-size="8.5" font-weight="700" fill="currentColor" stroke="none" text-anchor="middle">10</text>',zm:'<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2M11 8v6M8 11h6"/>',spark:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',ff:'<path d="M4 6l8 6-8 6zM12 6l8 6-8 6z" fill="currentColor"/>',rw:'<path d="M20 6l-8 6 8 6zM12 6l-8 6 8 6z" fill="currentColor"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',aud:'<path d="M4 15v-3a8 8 0 0116 0v3"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>'};
const ic=n=>`<svg viewBox="0 0 24 24" fill="${n==='play'?'currentColor':'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${IC[n]}</svg>`;
const fmt=t=>{if(!isFinite(t))return'0:00';t=Math.max(0,t|0);const h=t/3600|0,m=(t%3600)/60|0,s=t%60;return(h?h+':'+String(m).padStart(2,'0'):m)+':'+String(s).padStart(2,'0')};
const sec=v=>typeof v==='number'?v:String(v).split(':').reduce((a,b)=>a*60+ +b,0);
const ls={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch{return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const SPEEDS=Array.from({length:56},(_,i)=>(i+5)/10),QORDER=['auto','360p','480p','720p','1080p'];
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ytId=u=>{try{if(!/^[\w+.-]+:/.test(u))u='https://'+u;const x=new URL(u),h=x.hostname.replace(/^(www|m|music)\./,''),ok=i=>/^[\w-]{11}$/.test(i||'')?i:null;if(h==='youtu.be')return ok(x.pathname.slice(1,12));if(h==='youtube.com'||h==='youtube-nocookie.com'){const m=x.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]{11})/);return m?m[1]:x.pathname==='/watch'?ok(x.searchParams.get('v')):null}}catch{}return null};
const ytq=[];const ytLoad=()=>{if(ytLoad.d)return;ytLoad.d=1;const e=document.createElement('script');e.src='https://www.youtube.com/iframe_api';e.onerror=()=>{ytLoad.d=0;ytq.splice(0).forEach(f=>f(1))};document.head.appendChild(e);window.onYouTubeIframeAPIReady=()=>ytq.splice(0).forEach(f=>f())};
let current=null;

class LecturePlayer{
constructor(root,d,o={}){this.r=root;this.o=o;this.speed=(x=>{x=Math.round(x*10)/10;return SPEEDS.includes(x)?x:1})(+ls.get('lp:speed',1));this.vol=ls.get('lp:vol',1);this.qSel=ls.get('lp:q','auto');this.locked=false;this.zs=1;this.zx=0;this.zy=0;this.menu=null;this.lv=[];this.sub=null;this.sl='0';this.audio=false;this.cc=ls.get('lp:cc',0)?1:0;this.build();this.setBri(ls.get('lp:bri',1));this.bind();this.load(d)}
static last(){return ls.get('lp:last',null)}
build(){const r=this.r;r.classList.add('lp');r.tabIndex=0;
r.innerHTML=`<video playsinline webkit-playsinline preload="metadata"></video><div class="lp-tap"></div><button class="lp-cen" data-a="play" aria-label="Play or pause"></button>
<div class="lp-fx l">−10s</div><div class="lp-fx r">+10s</div><div class="lp-spin"></div><div class="lp-aud"><p>Audio Mode</p><small>Audio only. Tap to show controls.</small></div><div class="lp-hud"></div>
<div class="lp-err"><p>This lecture couldn't be played.</p><button data-a="retry">Try again</button><a class="lp-ext" target="_blank" rel="noopener" hidden>Open in YouTube</a></div>
<div class="lp-top"><button data-a="back" aria-label="Back">${ic('back')}</button><h2 class="lp-title"></h2><button data-a="more" aria-label="More options">${ic('more')}</button></div>
<div class="lp-side"><button data-a="lock" aria-label="Lock controls">${ic('unlock')}</button><button data-a="side" aria-label="Toggle sidebar" hidden>${ic('side')}</button></div>
<div class="lp-bot"><div class="lp-prog"><div class="lp-times"><span class="lp-cur">0:00</span><span class="lp-dur">0:00</span></div><div class="lp-bar"><div class="lp-track"><div class="lp-buf"></div><div class="lp-fill"></div></div><div class="lp-thumb"></div><div class="lp-tip">0:00</div></div></div>
<div class="lp-ctl"><button data-a="play" aria-label="Play">${ic('play')}</button><button data-a="back10" aria-label="Back 10 seconds">${ic('b10')}</button><button data-a="fwd10" aria-label="Forward 10 seconds">${ic('f10')}</button><button data-a="prev" aria-label="Previous lecture">${ic('prev')}</button><button data-a="next" aria-label="Next lecture">${ic('next')}</button>
<span class="lp-vwrap" style="display:flex;align-items:center"><button data-a="mute" aria-label="Mute">${ic('vol')}</button><input class="lp-vol" type="range" min="0" max="1" step=".05" aria-label="Volume"></span><span class="lp-sp"></span>
<button class="ai" data-a="ai"><i>${ic('spark')}</i>Ask AI</button><button class="chip" data-a="spd" aria-label="Playback speed">1x</button><button data-a="lec" aria-label="Lecture list">${ic('list')}</button><button data-a="tl" aria-label="Timeline">${ic('vid')}</button><button data-a="aud" aria-label="Audio mode">${ic('aud')}</button><button data-a="set" aria-label="Settings">${ic('gear')}</button><button data-a="pip" aria-label="Picture in picture">${ic('pip')}</button><button data-a="zm" aria-label="Fit or fill screen">${ic('zm')}</button><button data-a="fs" aria-label="Fullscreen">${ic('fs')}</button></div></div>
<div class="lp-menu" data-m="set"></div><div class="lp-menu more" data-m="more"></div><div class="lp-panel"></div><div class="lp-toast"></div>`;
const q=s=>r.querySelector(s);this.q=q;this.v=q('video');this.title=q('.lp-title');this.cur=q('.lp-cur');this.dur=q('.lp-dur');this.fill=q('.lp-fill');this.buf=q('.lp-buf');this.thumb=q('.lp-thumb');this.tip=q('.lp-tip');this.bar=q('.lp-bar');this.vsl=q('.lp-vol');this.panel=q('.lp-panel');this.toastEl=q('.lp-toast');this.m={set:q('[data-m=set]'),more:q('[data-m=more]')};
if(this.o.onToggleSidebar)q('[data-a=side]').hidden=false;if(!this.o.onAskAI)q('[data-a=ai]').hidden=true}
bind(){const r=this.r,v=this.v;
const offTT=()=>this.applyCC();v.addEventListener('loadedmetadata',offTT);v.addEventListener('playing',offTT);try{v.textTracks.addEventListener('addtrack',offTT)}catch{}
r.addEventListener('click',e=>{const b=e.target.closest('button,a,[data-t]');if(!b||b.disabled)return;const D=b.dataset;
if(D.s!==undefined){this.sub=D.s||null;return this.renderSet()}
if(D.o!==undefined){const s=this.sub,o=D.o;if(s==='sp')this.setSpeed(+o);else if(s==='q')this.setQ(o);else if(s==='aud')this.setAudio(o==='1');else if(s==='sl')this.setSleep(o);else if(s==='cc')this.setCC(o==='1');return this.renderSet()}
if(D.t!=null){v.currentTime=+D.t;return this.show()}if(D.lec!=null){this.closeAll();return this.o.onSelectLecture?.(this.flat[+D.lec])}
({back:()=>this.o.onBack?this.o.onBack():history.back(),more:()=>this.openMenu('more'),set:()=>{this.openMenu('set')},lock:()=>this.setLock(!this.locked),side:()=>this.o.onToggleSidebar?.(),retry:()=>this.retry(),play:()=>this.toggle(),back10:()=>this.skip(-10,'l'),fwd10:()=>this.skip(10,'r'),aud:()=>this.setAudio(!this.audio),ai:()=>this.o.onAskAI?this.o.onAskAI(this.d):this.toast('Ask AI isn\'t connected yet'),prev:()=>this.nav('previousLecture'),next:()=>this.nav('nextLecture'),mute:()=>{v.muted=!v.muted;this.icons()},dl:()=>{this.closeAll();this.download()},pip:()=>{this.closeAll();this.pip()},zm:()=>this.zoomFill(),spd:()=>{this.openMenu('set');if(this.menu==='set'){this.sub='sp';this.renderSet()}},fs:()=>this.fs(),tl:()=>this.openPanel('tl'),att:()=>this.openPanel('att'),lec:()=>this.openPanel('lec'),close:()=>this.closeAll(),lockset:()=>{this.closeAll();this.setLock(true)}})[D.a]?.();this.show()});
r.addEventListener('pointermove',e=>{if(e.pointerType==='mouse')this.show()});
r.addEventListener('pointerdown',()=>current=this);r.addEventListener('focus',()=>current=this);
this.vsl.addEventListener('input',()=>{v.volume=+this.vsl.value;v.muted=false;ls.set('lp:vol',v.volume)});
/* tap layer */
const tap=this.q('.lp-tap');let last={t:0,s:''},timer,g=null,pz=null,pzF=false;const P=new Map();
tap.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'||this.locked)return;P.set(e.pointerId,[e.clientX,e.clientY]);if(P.size>=2){if(P.size===2){const[a,b]=[...P.values()];pz={d:Math.hypot(a[0]-b[0],a[1]-b[1])||1,s:this.zs,mx:(a[0]+b[0])/2,my:(a[1]+b[1])/2,x:this.zx,y:this.zy}}pzF=true;g=null;clearTimeout(timer);last.t=0;return}const rc=r.getBoundingClientRect(),x=(e.clientX-rc.left)/rc.width,z=x<.4?'l':x>.6?'r':'m';g={y:e.clientY,x:e.clientX,z,on:false,h:rc.height,base:z==='l'?(v.muted?0:v.volume):this.bri,t0:v.currentTime};clearTimeout(this.lpT);if(this.zs<=1.02&&!this.menu){const gg=g;this.lpT=setTimeout(()=>{if(g!==gg||gg.on||P.size!==1||v.paused&&!this.yt&&v.ended)return;gg.on=true;gg.lp=true;gg.ps=this.speed;gg.hr=+ls.get('lp:hold',2);v.playbackRate=gg.hr;this.hud(gg.hr+'x','r',{ms:60000});navigator.vibrate?.(15);try{tap.setPointerCapture(e.pointerId)}catch{}},400)}});
tap.addEventListener('pointermove',e=>{if(P.has(e.pointerId))P.set(e.pointerId,[e.clientX,e.clientY]);if(pz&&P.size>=2){const[a,b]=[...P.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]),rc=r.getBoundingClientRect(),cx=rc.left+rc.width/2,cy=rc.top+rc.height/2,s1=Math.min(4,Math.max(1,pz.s*d/pz.d)),k=s1/pz.s;this.setZoom(s1,(a[0]+b[0])/2-cx-k*(pz.mx-cx-pz.x),(a[1]+b[1])/2-cy-k*(pz.my-cy-pz.y));return}if(g&&this.zs>1){const dx=e.clientX-g.x,dy=e.clientY-g.y;if(!g.pan){if(Math.hypot(dx,dy)<10)return;g.pan={x:this.zx,y:this.zy};g.on=true;clearTimeout(timer);try{tap.setPointerCapture(e.pointerId)}catch{}}this.setZoom(this.zs,g.pan.x+dx,g.pan.y+dy,0);return}if(g&&g.lp){const hr=Math.min(3,Math.max(.5,Math.round((g.hr+(g.y-e.clientY)/60)*4)/4));if(hr!==v.playbackRate){v.playbackRate=hr;this.hud(hr+'x','r',{ms:60000})}return}if(g&&!g.on&&Math.hypot(e.clientX-g.x,e.clientY-g.y)>10)clearTimeout(this.lpT);if(g&&this.zs<=1.02&&(g.sk||!g.on)){const dx=e.clientX-g.x,ay=Math.abs(e.clientY-g.y);if(g.sk||(Math.abs(dx)>12&&Math.abs(dx)>ay*1.2)){if(!g.sk){navigator.vibrate?.(10);g.sk=true;g.on=true;clearTimeout(timer);clearTimeout(this.lpT);try{tap.setPointerCapture(e.pointerId)}catch{}}const rc=r.getBoundingClientRect(),dur=v.duration||0,d=dx/rc.width*120;let t=g.t0+d;t=Math.max(0,dur?Math.min(dur,t):t);g.tt=t;const df=Math.round(t-g.t0);this.hud((df>=0?'+':'')+df+'s  ('+fmt(t)+')','r',{ic:df>=0?'ff':'rw'});return}}if(!g||g.z==='m')return;const dy=g.y-e.clientY;if(!g.on){if(Math.abs(dy)<12||Math.abs(dy)<Math.abs(e.clientX-g.x))return;g.on=true;clearTimeout(timer);try{tap.setPointerCapture(e.pointerId)}catch{}}
const val=Math.min(1,Math.max(0,g.base+dy/(g.h*.8)));
if(g.z==='l'){v.muted=val===0;v.volume=val;ls.set('lp:vol',val);this.hud(val?Math.round(val*100)+'%':'Muted','l',{ic:val?'vol':'mute',p:val*100})}else{this.setBri(val);this.hud(Math.round(val*100)+'%','r',{ic:'sun',p:val*100})}});
tap.addEventListener('pointercancel',e=>{clearTimeout(this.lpT);if(g&&g.lp)v.playbackRate=g.ps;P.delete(e.pointerId);if(!P.size){pz=null;pzF=false}g=null});
tap.addEventListener('pointerup',e=>{this.pt=e.pointerType;P.delete(e.pointerId);if(pzF){if(P.size<2)pz=null;if(!P.size)pzF=false;g=null;return}clearTimeout(this.lpT);const w=g;g=null;if(w&&w.lp){v.playbackRate=w.ps;this.hud(w.ps+'x','r');return}if(w&&w.sk){if(w.tt!=null)v.currentTime=w.tt;this.show();return}if(w&&w.on)return;if(this.menu){this.closeAll();return}
if(e.pointerType==='mouse'){if(!this.locked)this.toggle();return this.show()}
const rc=r.getBoundingClientRect(),x=(e.clientX-rc.left)/rc.width,side=x<.35?'l':x>.65?'r':'m',now=Date.now();
if(now-last.t<300&&side===last.s&&side!=='m'&&!this.locked){clearTimeout(timer);this.skip(side==='l'?-10:10,side);last.t=now;return}
if(now-last.t<300&&side==='m'&&last.s==='m'&&!this.locked){clearTimeout(timer);this.zoomFill();last.t=0;return}last={t:now,s:side};clearTimeout(timer);timer=setTimeout(()=>this.tapToggle(),290)});
tap.addEventListener('dblclick',()=>{if(!this.locked&&this.pt==='mouse')this.fs()});
tap.addEventListener('wheel',e=>{if(!e.ctrlKey&&!e.altKey)return;e.preventDefault();this.setZoom(this.zs*(e.deltaY<0?1.12:1/1.12))},{passive:false});
/* seek bar */
const pos=e=>{const b=this.bar.getBoundingClientRect();return Math.min(1,Math.max(0,(e.clientX-b.left)/b.width))};
this.bar.addEventListener('pointerdown',e=>{if(!v.duration)return;this.bar.setPointerCapture(e.pointerId);this.drag=pos(e);r.classList.add('drag');this.drawDrag();clearTimeout(this.hideT)});
this.bar.addEventListener('pointermove',e=>{const p=pos(e);this.tip.style.left=p*100+'%';this.tip.textContent=fmt(p*(v.duration||0));if(this.drag!=null){this.drag=p;this.drawDrag()}});
const end=()=>{if(this.drag==null)return;v.currentTime=this.drag*v.duration;this.drag=null;r.classList.remove('drag');this.show()};
this.bar.addEventListener('pointerup',end);this.bar.addEventListener('pointercancel',end);
/* video events */
v.addEventListener('play',()=>{this.icons();this.show()});v.addEventListener('pause',()=>{this.icons();this.show()});
v.addEventListener('waiting',()=>this.busy(1));v.addEventListener('stalled',()=>{if(v.readyState<3)this.busy(1)});
['playing','canplay','loadeddata','seeked'].forEach(n=>v.addEventListener(n,()=>this.busy(0)));
v.addEventListener('timeupdate',()=>{if(!this.yt&&v.readyState>=3&&!v.seeking)this.busy(0);this.draw();const n=Date.now();if(n-(this.sv||0)>2000){this.sv=n;this.save()}});
v.addEventListener('progress',()=>this.draw());v.addEventListener('durationchange',()=>this.draw());
v.addEventListener('volumechange',()=>{this.icons();if(this.vhOk)this.volHud()});v.addEventListener('playing',()=>{this.vhOk=true});document.addEventListener('keydown',e=>{if(current!==this)return;if(e.key==='AudioVolumeUp'||e.key==='VolumeUp'||e.keyCode===175){v.volume=Math.min(1,v.volume+.1);v.muted=false;ls.set('lp:vol',v.volume)}else if(e.key==='AudioVolumeDown'||e.key==='VolumeDown'||e.keyCode===174){v.volume=Math.max(0,v.volume-.1);ls.set('lp:vol',v.volume)}else if(e.key==='AudioVolumeMute'||e.keyCode===173){v.muted=!v.muted}});v.addEventListener('ratechange',()=>this.labels());
v.addEventListener('loadedmetadata',()=>this.ready());
v.addEventListener('error',()=>{if(!this.hls)this.err()});
v.addEventListener('ended',()=>{try{this.o.onEnded&&this.o.onEnded(this.d)}catch(e){}this.show();ls.set('lp:pos:'+this.id,0);if(this.sl==='end')return this.sleepEnd();const n=this.d.nextLecture;if(n)this.toast('Up next: '+(n.title||'next lecture'),[['Play',()=>this.nav('nextLecture')]],8000)});
document.addEventListener('fullscreenchange',()=>{this.icons();this.show()});
addEventListener('resize',()=>this.show());addEventListener('orientationchange',()=>setTimeout(()=>this.show(),250));
document.addEventListener('keydown',e=>this.key(e));
document.addEventListener('pointerdown',e=>{if(current===this&&!r.contains(e.target))current=null});
addEventListener('pagehide',()=>this.save());
}
key(e){if(current!==this||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)&&e.target.type!=='range')return;const v=this.v,k=e.key;let h=true;
if(k===' '||k==='k'){if(e.target.tagName==='BUTTON'&&k===' ')return;this.toggle()}
else if(k==='ArrowLeft')this.skip(-10,'l');else if(k==='ArrowRight')this.skip(10,'r');
else if(k==='ArrowUp'){v.volume=Math.min(1,v.volume+.1);v.muted=false;ls.set('lp:vol',v.volume);this.volHud()}else if(k==='ArrowDown'){v.volume=Math.max(0,v.volume-.1);ls.set('lp:vol',v.volume);this.volHud()}
else if(k==='m'||k==='M')v.muted=!v.muted;else if(k==='f'||k==='F')this.fs();else if(k==='p'||k==='P')this.pip();
else if(k==='>'||k==='.'){const i=SPEEDS.indexOf(this.speed);this.setSpeed(SPEEDS[Math.min(SPEEDS.length-1,i+1)])}
else if(k==='<'||k===','){const i=SPEEDS.indexOf(this.speed);this.setSpeed(SPEEDS[Math.max(0,i-1)])}
else if(k==='Escape'&&this.menu)this.closeAll();else h=false;
if(h){e.preventDefault();this.show()}}
/* loading */
load(d){this.save();this.d=Object.assign({quality:{},attachments:[],chapters:[],lectures:[],previousLecture:null,nextLecture:null,downloadUrl:null},d);d=this.d;this.id=d.id||d.videoUrl;this.r.classList.remove('failed');this.closeAll();this.lv=[];this.retried=0;this.setZoom(1,0,0,0);
this.title.textContent=d.title||'';this.v.poster=d.poster||'';this.dur.textContent=typeof d.duration==='string'?d.duration:'0:00';
this.qs=QORDER.filter(k=>k==='auto'||d.quality[k]);this.hasMap=this.qs.length>1;this.cq=QORDER.includes(this.qSel)?this.qSel:'auto';
this.q('[data-a=prev]').disabled=!d.previousLecture;this.q('[data-a=next]').disabled=!d.nextLecture;this.q('[data-a=tl]').hidden=!d.chapters.length;this.q('[data-a=lec]').hidden=!(d.course?.subjects?.length||d.lectures.length);this.q('[data-a=more]').dataset.empty=d.attachments.length||d.downloadUrl||this.o.onDownload?'':'1';
this.v.volume=this.vol;this.vsl.value=this.vol;
this.saved=ls.get('lp:pos:'+this.id,0);this.offer=!d.startAt;
this.setSrc(this.urlFor(this.cq),d.startAt||0,!!d.autoplay);this.v.playbackRate=this.speed;this.labels();this.icons();this.draw();this.show()}
urlFor(k){return this.d.quality[k]||(this.hasMap&&this.d.quality[this.mapKey(k)])||this.d.videoUrl}
setSrc(url,t,play){const v=this.v;this.hls?.destroy();this.hls=null;this.pend={t,play};this.busy(1);this.r.classList.remove('failed');this.ytOff();const yi=ytId(url);if(yi){try{v.pause();v.removeAttribute('src');v.load()}catch{}return this.ytOn(yi)}
if(/\.m3u8(\?|$)/i.test(url)&&!v.canPlayType('application/vnd.apple.mpegurl')){
if(window.Hls&&Hls.isSupported()){const h=this.hls=new Hls({maxBufferLength:30,startLevel:-1,subtitleDisplay:!!this.cc});h.loadSource(url);h.attachMedia(v);
h.on(Hls.Events.MANIFEST_PARSED,()=>{this.lv=[...new Set(h.levels.map(l=>l.height).filter(Boolean))].sort((a,b)=>a-b);this.applyQ()});
h.on(Hls.Events.ERROR,(_,x)=>{if(!x.fatal)return;if(x.type===Hls.ErrorTypes.NETWORK_ERROR&&!this.retried){this.retried=1;h.startLoad()}else if(x.type===Hls.ErrorTypes.MEDIA_ERROR&&this.retried<2){this.retried=2;h.recoverMediaError()}else this.err()})}
else return this.err('This browser can\'t play HLS streams.')}
else{v.src=url;v.load()}}
ytOff(){if(this.ytKill){this.ytKill();this.ytKill=null}}
ytOn(id){const v=this.v,self=this,ev=n=>v.dispatchEvent(new Event(n)),DF=(k,g,st)=>Object.defineProperty(v,k,{configurable:true,get:g,set:st}),FN=(k,fn)=>Object.defineProperty(v,k,{configurable:true,value:fn}),cl=x=>Math.min(2,Math.max(.25,x));
let y,rd=0,pa=true,yv=v.volume,ym=v.muted,yr=this.speed,ct=0,sk=0,ld=0,tm,to;
const w=this.yw=document.createElement('div');w.className='lp-yt';w.style.filter=v.style.filter;w.innerHTML='<div></div><i class="lp-ytp" style="background-image:url(https://i.ytimg.com/vi/'+id+'/hqdefault.jpg)"></i>';v.after(w);v.style.display='none';this.yt=true;
DF('currentTime',()=>Date.now()-sk<700?ct:rd?y.getCurrentTime()||0:0,t=>{ct=t;sk=Date.now();if(rd){y.seekTo(t,true);ev('timeupdate');setTimeout(()=>ev('seeked'),350)}});
DF('duration',()=>rd?y.getDuration()||0:0);DF('paused',()=>pa);
DF('volume',()=>yv,x=>{yv=x;if(rd)y.setVolume(x*100);ev('volumechange')});
DF('muted',()=>ym,x=>{ym=!!x;if(rd)ym?y.mute():y.unMute();ev('volumechange')});
DF('playbackRate',()=>yr,x=>{yr=x;if(rd)y.setPlaybackRate(cl(x));ev('ratechange')});
DF('buffered',()=>({length:1,start:()=>0,end:()=>rd?y.getVideoLoadedFraction()*y.getDuration():0}));
FN('play',()=>{if(rd)y.playVideo();else if(this.pend)this.pend.play=true;return Promise.resolve()});
FN('pause',()=>{if(rd)y.pauseVideo();else if(this.pend)this.pend.play=false;return Promise.resolve()});
this.ytKill=()=>{clearInterval(tm);clearTimeout(to);try{y?.destroy?.()}catch{}const a=[yv,ym,yr];for(const k of['currentTime','duration','paused','volume','muted','playbackRate','buffered','play','pause'])delete v[k];w.remove();v.style.display='';this.yw=null;this.yt=false;v.volume=a[0];v.muted=a[1];v.playbackRate=a[2]};
const ccOff=()=>{try{if(self.cc)y.loadModule('captions');else{y.unloadModule('captions');y.unloadModule('cc')}}catch{}};this.ytCC=ccOff;const yerr=m=>{self.err(m);const a=self.q('.lp-ext');a.href='https://www.youtube.com/watch?v='+id;a.hidden=false},mk=bad=>{if(self.yw!==w)return;if(bad||!window.YT?.Player)return yerr('Couldn\'t load YouTube. Check your connection.');
const pv={controls:0,disablekb:1,fs:0,rel:0,modestbranding:1,playsinline:1,iv_load_policy:3,cc_load_policy:self.cc?1:0};if(/^https?:$/.test(location.protocol))pv.origin=location.origin;
y=new YT.Player(w.firstChild,{videoId:id,playerVars:pv,events:{
onReady:()=>{rd=1;ccOff();clearTimeout(to);y.setVolume(yv*100);ym?y.mute():y.unMute();y.setPlaybackRate(cl(yr));if(self.d.autoTitle){const t=y.getVideoData().title;if(t)self.title.textContent=t}ev('durationchange');ev('loadedmetadata');ev('canplay')},
onStateChange:e=>{const st=e.data;if(st===1){ccOff();pa=false;w.querySelector('.lp-ytp')?.remove();ev('play');ev('playing')}else if(st===3)ev('waiting');else if(st===2||st===0||st===5){const was=pa;pa=true;if(!was)ev('pause');if(st===0)ev('ended');ev('canplay')}},
onPlaybackRateChange:()=>ev('ratechange'),
onError:e=>{clearTimeout(to);yerr([101,150,153].includes(e.data)?(/^https?:$/.test(location.protocol)?'The owner of this video doesn\'t allow playing it here.':'YouTube can\'t play on a page opened from a file. Open this page from https or localhost, or watch it on YouTube.'):'This YouTube video can\'t be played.')}}})};
tm=setInterval(()=>{if(!rd)return;const d=y.getDuration();if(d!==ld){ld=d;ev('durationchange')}if(y.getPlayerState()!==3)ev('canplay');ev('timeupdate');ev('progress')},250);
to=setTimeout(()=>{if(!rd&&self.yw===w)yerr('YouTube is taking too long to load. Check your connection.')},12000);ytLoad();window.YT?.Player?mk():ytq.push(mk)}
ready(){const v=this.v,p=this.pend||{};if(p.t)v.currentTime=p.t;if(p.play)v.play().catch(()=>{});this.pend=null;this.draw();
if(this.offer){this.offer=false;const s=this.saved;if(s>10&&s<v.duration-15)this.toast('Continue from '+fmt(s),[['Start over',()=>{v.currentTime=0},1],['Continue',()=>{v.currentTime=s;v.play().catch(()=>{})}]],9000)}}
retry(){const v=this.v,t=v.currentTime||this.saved||0;this.retried=0;this.setSrc(this.urlFor(this.cq),t,true)}
err(m){this.busy(0);this.r.classList.add('failed');this.q('.lp-ext').hidden=true;this.q('.lp-err p').textContent=m||'This lecture couldn\'t be played.'}
busy(b){this.r.classList.toggle('busy',!!b)}
/* actions */
toggle(){this.v.paused?this.v.play().catch(()=>{}):this.v.pause()}
skip(s,side){const v=this.v;v.currentTime=Math.max(0,Math.min(v.duration||1e9,v.currentTime+s));const f=this.q('.lp-fx.'+(side==='l'?'l':'r'));f.classList.remove('go');void f.offsetWidth;f.classList.add('go');this.show()}
setSpeed(s){this.speed=s;this.v.playbackRate=s;ls.set('lp:speed',s);this.labels()}
qualityOpts(){return this.yt?['auto']:QORDER}
lvIdx(k){if(k==='auto')return -1;const t=parseInt(k),hs=this.lv,h=hs.filter(x=>x<=t).pop()??hs[0];return this.hls.levels.findIndex(l=>l.height===h)}
mapKey(k){if(k==='auto')return null;const t=parseInt(k),ks=this.qs.filter(x=>x!=='auto');return ks.filter(x=>parseInt(x)<=t).pop()||ks[0]||null}
setQ(k){if(this.yt)return;this.cq=k;this.qSel=k;ls.set('lp:q',k);if(this.hls&&this.lv.length>1){const i=this.lvIdx(k);this.hls.currentLevel=i;if(i>=0){const g=this.hls.levels[i].height;if(g!==parseInt(k))this.toast(k+' not available — playing '+g+'p')}}else if(this.hasMap){const t=this.v.currentTime,p=!this.v.paused;this.setSrc(this.urlFor(k),t,p)}else if(k!=='auto')this.toast('Only one quality available for this video');this.labels()}
nav(k){const n=this.d[k];if(n)this.o.onNavigate?this.o.onNavigate(n,k):this.toast('Open: '+(n.title||'lecture'))}
download(){const u=this.d.downloadUrl;if(this.o.onDownload)return this.o.onDownload(this.d);if(!u)return this.toast('Download unavailable for this lecture.');const a=document.createElement('a');a.href=u;a.download='';a.rel='noopener';document.body.appendChild(a);a.click();a.remove()}
async pip(){const v=this.v;try{if(document.pictureInPictureElement)await document.exitPictureInPicture();else if(document.pictureInPictureEnabled&&!v.disablePictureInPicture)await v.requestPictureInPicture();else this.toast('Picture-in-picture isn\'t supported here')}catch{this.toast('Picture-in-picture isn\'t available')}}
async fs(){const r=this.r,v=this.v;try{if(document.fullscreenElement){await document.exitFullscreen();screen.orientation?.unlock?.()}
else if(r.requestFullscreen){await r.requestFullscreen();if(/Mobi|Android/i.test(navigator.userAgent))screen.orientation?.lock?.('landscape').catch(()=>{})}
else if(v.webkitEnterFullscreen)v.webkitEnterFullscreen();else if(r.webkitRequestFullscreen)r.webkitRequestFullscreen()}catch{}}
setLock(l){this.locked=l;this.r.classList.toggle('locked',l);this.q('[data-a=lock]').innerHTML=ic(l?'lock':'unlock');if(l)this.closeAll();this.show()}
/* UI state */
show(){const r=this.r;r.classList.remove('idle');clearTimeout(this.hideT);if(!this.v.paused&&!this.menu&&this.drag==null)this.hideT=setTimeout(()=>{if(!this.v.paused&&!this.menu)r.classList.add('idle')},3000)}
tapToggle(){if(this.r.classList.contains('idle')){this.show()}else{this.closeAll();this.r.classList.add('idle');clearTimeout(this.hideT)}}
icons(){const v=this.v;this.r.querySelectorAll('[data-a=play]').forEach(b=>b.innerHTML=ic(v.paused?'play':'pause'));this.q('[data-a=mute]').innerHTML=ic(v.muted||!v.volume?'mute':'vol');this.q('[data-a=fs]').innerHTML=ic(document.fullscreenElement?'cmp':'fs');this.vsl.value=v.muted?0:v.volume;this.vol=v.volume}
labels(){this.q('[data-a=spd]').textContent=this.speed+'x';if(this.menu==='set')this.renderSet()}
draw(){const v=this.v,d=v.duration||0;if(this.drag==null){const p=d?v.currentTime/d:0;this.fill.style.width=p*100+'%';this.thumb.style.left=p*100+'%';this.cur.textContent=fmt(v.currentTime)}
if(d)this.dur.textContent=fmt(d);let e=0;for(let i=0;i<v.buffered.length;i++)if(v.buffered.start(i)<=v.currentTime+.5)e=Math.max(e,v.buffered.end(i));this.buf.style.width=d?e/d*100+'%':0;if(this.panel.dataset.k==='tl'&&this.panel.classList.contains('open'))this.hiChap();this.segs()}
segs(){const d=this.v.duration,c=this.d.chapters;if(!d||!c.length)return;const k=this.id+d;if(this.sk===k)return;this.sk=k;const tr=this.q('.lp-track');tr.querySelectorAll('.lp-seg').forEach(x=>x.remove());c.forEach(ch=>{const t=sec(ch.time??ch.start);if(t>0&&t<d){const e=document.createElement('div');e.className='lp-seg';e.style.left=t/d*100+'%';tr.appendChild(e)}})}
drawDrag(){const p=this.drag,d=this.v.duration;this.fill.style.width=p*100+'%';this.thumb.style.left=p*100+'%';this.cur.textContent=fmt(p*d);this.tip.style.left=p*100+'%';this.tip.textContent=fmt(p*d)}
save(){const v=this.v;if(!this.id||!v.duration||this.pend)return;const t=v.currentTime>v.duration-10?0:v.currentTime;ls.set('lp:pos:'+this.id,Math.floor(t));ls.set('lp:dur:'+this.id,Math.floor(v.duration));ls.set('lp:last',{id:this.id,title:this.d.title,t:Math.floor(t),at:Date.now()})}
toast(msg,btns=[],ms=2600){const t=this.toastEl;t.innerHTML=`<span>${esc(msg)}</span>`;btns.forEach(([l,fn,g])=>{const b=document.createElement('button');b.textContent=l;if(g)b.className='ghost';b.onclick=()=>{t.classList.remove('open');fn()};t.appendChild(b)});t.classList.add('open');clearTimeout(this.toT);this.toT=setTimeout(()=>t.classList.remove('open'),ms)}
hud(t,side,o){const h=this.q('.lp-hud');h.innerHTML='<b>'+esc(t)+'</b>'+(o&&o.p!=null?'<i class="bar"><u style="width:'+Math.round(o.p)+'%"></u></i>':'');h.className='lp-hud open';clearTimeout(this.hT);this.hT=setTimeout(()=>h.classList.remove('open'),o&&o.ms||900)}
volHud(){const v=this.v,m=v.muted||!v.volume;this.hud(m?'Muted':Math.round(v.volume*100)+'%','l',{ic:m?'mute':'vol',p:m?0:v.volume*100})}
setZoom(s,x=this.zx,y=this.zy,h=1){const r=this.r.getBoundingClientRect();s=Math.min(4,Math.max(1,s));if(s<1.02){s=1;x=0;y=0}const mx=r.width*(s-1)/2,my=r.height*(s-1)/2;x=Math.min(mx,Math.max(-mx,x));y=Math.min(my,Math.max(-my,y));this.zs=s;this.zx=x;this.zy=y;this.r.style.setProperty('--zt',s===1?'none':`translate(${x}px,${y}px) scale(${s})`);if(h)this.hud(Math.round(s*100)+'%','r',{ic:'zm'})}
zoomFill(){const v=this.v,r=this.r.getBoundingClientRect(),a=!this.yt&&v.videoWidth?v.videoWidth/v.videoHeight:16/9,c=r.width/r.height,f=Math.max(c/a,a/c);if(this.zs>1.02){this.setZoom(1,0,0,0);this.hud('Fit','r')}else{this.setZoom(f>1.05?f:1.5,0,0,0);this.hud(f>1.05?'Fill':'Zoom 150%','r')}}
setBri(b){this.bri=b;const fl=b<1?`brightness(${Math.max(.1,b)})`:'';this.v.style.filter=fl;if(this.yw)this.yw.style.filter=fl;ls.set('lp:bri',b)}
applyQ(){if(!this.hls||this.lv.length<2)return;const k=this.qSel,i=this.lvIdx(k);this.hls.currentLevel=i;this.cq=k;this.labels()}
setAudio(b){this.audio=b;this.q('[data-a=aud]').classList.toggle('on',b);this.r.classList.toggle('audio',b);if(b&&document.pictureInPictureElement)document.exitPictureInPicture().catch(()=>{});this.labels()}
setSleep(o){clearTimeout(this.slT);this.sl=o;if(o!=='0'&&o!=='end')this.slT=setTimeout(()=>this.sleepEnd(),o*60000)}
sleepEnd(){this.v.pause();this.sl='0';clearTimeout(this.slT);this.toast('Sleep Timer ended',[],4000)}
sleepLabel(){return this.sl==='0'?'Off':this.sl==='end'?'End of lecture':this.sl+' min'}
/* menus & panels */
openMenu(k){const was=this.menu===k;this.closeAll();if(was)return;this.menu=k;if(k==='set'){this.sub=null;this.renderSet()}else this.renderMore();this.m[k].classList.add('open');this.show()}
closeAll(){this.menu=null;Object.values(this.m).forEach(m=>m.classList.remove('open'));this.panel.classList.remove('open')}
renderSet(){const m=this.m.set,s=this.sub;
if(!s){const row=(k,l,v)=>`<button class="lp-row" data-s="${k}"><span>${l}</span><em>${v}</em>${ic('chev')}</button>`;
m.innerHTML=row('sp','Speed',this.speed===1?'Normal':this.speed+'x')+row('q','Quality',this.cq==='auto'?'Auto':this.cq)+row('aud','Audio Mode',this.audio?'On':'Off')+row('cc','Subtitles',this.ccLabel())+row('sl','Sleep Timer',this.sleepLabel());return}
const T={sp:'Speed',q:'Quality',aud:'Audio Mode',cc:'Subtitles',sl:'Sleep Timer'};
const O={sp:SPEEDS.map(x=>[x,x+'x',x===this.speed]),q:this.qualityOpts().map(k=>[k,k==='auto'?'Auto':k,k===this.cq]),aud:[['0','Off',!this.audio],['1','On',this.audio]],cc:[['0','Off',!this.cc],['1','On',!!this.cc]],sl:[['0','Off'],['15','15 minutes'],['30','30 minutes'],['45','45 minutes'],['60','60 minutes'],['end','End of lecture']].map(o=>[...o,o[0]===this.sl])};
const st=m.querySelector('.lp-opt')?m.scrollTop:null;
m.innerHTML=`<button class="lp-row back" data-s="">${ic('back')}<span>${T[s]}</span></button>${O[s].map(o=>`<button class="lp-opt ${o[2]?'on':''}" data-o="${o[0]}"><span>${o[1]}</span><i class="rd"></i></button>`).join('')}`;
if(st!=null)m.scrollTop=st;else{const on=m.querySelector('.lp-opt.on');m.scrollTop=on?on.offsetTop-m.clientHeight/2+27:0}}
renderMore(){const d=this.d,dl=d.downloadUrl||this.o.onDownload,R=(a,i,l)=>`<button class="lp-row" data-a="${a}">${ic(i)}${l}</button>`;this.m.more.innerHTML=(d.chapters.length?R('tl','tl','Timeline'):'')+(d.attachments.length?R('att','att','Attachments'):'')+R('pip','pip','Picture in picture')+(dl?R('dl','dl','Download'):'')}
openPanel(k){const d=this.d,P=this.panel;let h='',t='';
if(k==='tl'){t='Timeline';h=d.chapters.length?d.chapters.map((c,i)=>`<button class="lp-item" data-t="${sec(c.time??c.start)}" data-i="${i}"><b>${fmt(sec(c.time??c.start))}</b><span>${esc(c.title)}</span></button>`).join(''):'<div class="lp-empty">No timeline for this lecture.</div>'}
if(k==='att'){t='Attachments';h=d.attachments.length?d.attachments.map(a=>`<a class="lp-item" href="${esc(a.url)}" target="_blank" rel="noopener">${ic('att')}<span>${esc(a.title||a.name||'Attachment')}${a.size?`<small>${esc(a.size)}</small>`:''}</span></a>`).join(''):'<div class="lp-empty">No attachments for this lecture.</div>'}
if(k==='lec'){t=d.course?.title||'Lectures';this.flat=[];const it=l=>{this.flat.push(l);return `<button class="lp-item ${l.id===this.id?'on':''}" data-lec="${this.flat.length-1}"><span>${esc(l.title)}${l.duration?`<small>${esc(l.duration)}</small>`:''}</span></button>`};
const pn=`<div style="display:flex;gap:6px"><button class="lp-item" data-a="prev" ${d.previousLecture?'':'disabled'}>Previous</button><button class="lp-item" data-a="next" ${d.nextLecture?'':'disabled'}>Next</button></div>`;
const body=d.course?.subjects?.length?d.course.subjects.map(s=>`<div class="lp-sub">${esc(s.title)}</div>`+(s.chapters||[]).map(c=>`<div class="lp-ch">${esc(c.title)}</div>`+(c.lectures||[]).map(it).join('')).join('')).join(''):d.lectures.length?d.lectures.map(it).join(''):'<div class="lp-empty">No other lectures in this course.</div>';h=pn+body}
P.dataset.k=k;P.innerHTML=`<div class="lp-ph"><span>${t}</span><button data-a="close" aria-label="Close">${ic('x')}</button></div><div class="lp-pb">${h}</div>`;
Object.values(this.m).forEach(m=>m.classList.remove('open'));this.menu='panel';P.classList.add('open');if(k==='tl')this.hiChap()}
hiChap(){const t=this.v.currentTime;let a=-1;this.d.chapters.forEach((c,i)=>{if(sec(c.time??c.start)<=t)a=i});this.panel.querySelectorAll('[data-i]').forEach(b=>b.classList.toggle('on',+b.dataset.i===a))}
ccLabel(){return this.cc?'On':'Off'}
setCC(on){this.cc=on?1:0;ls.set('lp:cc',this.cc);this.applyCC()}
applyCC(){const v=this.v;try{for(const t of v.textTracks)t.mode=this.cc?'showing':'disabled'}catch{}if(this.hls)this.hls.subtitleDisplay=!!this.cc;this.ytCC?.()}
destroy(){this.save();this.hls?.destroy();this.ytOff();this.r.innerHTML=''}
}
window.LecturePlayer=LecturePlayer;
})();

/* Optional: lock-screen controls + background audio. Call LecturePlayer.mediaSession(player) after creating the player. */
LecturePlayer.mediaSession=function(P,icon){const v=P.v;
if('mediaSession' in navigator){const ms=navigator.mediaSession,mt=()=>{try{ms.metadata=new MediaMetadata({title:P.d.title||'Lecture',artist:P.d.course||'Lecture Player',artwork:icon?[{src:icon,sizes:'512x512',type:'image/png'}]:[]})}catch{}};v.addEventListener('loadedmetadata',mt);v.addEventListener('play',mt);const A2=(a,f)=>{try{ms.setActionHandler(a,f)}catch{}};A2('play',()=>v.play());A2('pause',()=>v.pause());A2('seekbackward',()=>P.skip(-10,'l'));A2('seekforward',()=>P.skip(10,'r'));A2('previoustrack',()=>{if(P.d.previousLecture)P.nav('previousLecture')});A2('nexttrack',()=>{if(P.d.nextLecture)P.nav('nextLecture')})}
let wp=false;document.addEventListener('visibilitychange',()=>{if(document.hidden){wp=!v.paused;if(wp)setTimeout(()=>{if(v.paused&&wp)v.play().catch(()=>{})},150)}});
};
