/* =========================================================
   연습장 시뮬레이터 9종
   각 시뮬레이터: SIMS[key](host, {cleared, onClear, toast})
   ========================================================= */
(function(){
const $ = (s, r=document) => r.querySelector(s);
const h = (tag, attrs={}, html='') => { const e=document.createElement(tag); for(const k in attrs){ if(k==='class') e.className=attrs[k]; else if(k.startsWith('on')) e.addEventListener(k.slice(2),attrs[k]); else e.setAttribute(k,attrs[k]); } if(html) e.innerHTML=html; return e; };
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

function shell(host, {title, hint, goals}, opt){
  host.innerHTML = `<div class="sim" tabindex="-1"><div class="sim-head"><h4>${title}</h4><span class="fine">${hint}</span></div>
  <div class="sim-body"><div class="sim-stage"></div><div class="sim-side"><h5>목표</h5><ul class="goals">${goals.map(g=>`<li>${g}</li>`).join('')}</ul>
  <div class="sim-done" role="status">연습장 클리어! +40 XP</div><div class="extra" style="display:grid;gap:12px"></div></div></div></div>`;
  const root=$('.sim',host);
  if(opt.cleared) root.classList.add('cleared');
  const lis=[...root.querySelectorAll('.goals li')];
  return {root, stage:$('.sim-stage',root), extra:$('.extra',root),
    set(states){
      states.forEach((s,i)=>lis[i] && lis[i].classList.toggle('ok',!!s));
      if(states.every(Boolean) && !root.classList.contains('cleared')){ root.classList.add('cleared'); opt.onClear && opt.onClear(); }
    }};
}
const eyeSvg = on => on
  ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>'
  : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity=".5"><path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c7 0 11 7 11 7a18 18 0 0 1-3.2 4M6.6 6.6A18 18 0 0 0 1 12s4 7 11 7a10 10 0 0 0 5.4-1.6"/></svg>';

const SIMS = {};

/* ---------- 1. Photoshop 레이어 ---------- */
SIMS.layers = function(host,opt){
  const S = shell(host,{title:'레이어 연습장', hint:'레이어를 끌어서 순서를 바꿔 보세요', goals:[
    '“제목” 레이어를 맨 위로 올리기',
    '“해” 레이어 불투명도를 70% 이하로',
    '“산” 레이어 혼합 모드를 곱하기로',
    '눈 아이콘으로 레이어를 껐다 켜 보기']},opt);
  const L = [
    {id:'sun', name:'해', op:100, blend:'normal', vis:true, thumb:'radial-gradient(circle,#FFE38A,#FF9F43 60%,#7FB2F0 61%)',
     html:'<div style="position:absolute;right:15%;top:12%;width:21%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,#FFF1B8,#FFB443 70%)"></div>'},
    {id:'mount', name:'산', op:100, blend:'normal', vis:true, thumb:'linear-gradient(160deg,#7FB2F0 45%,#2F5D50 46%)',
     html:'<svg viewBox="0 0 160 100" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%"><path d="M0 100V68l30-24 25 20 30-36 35 32 20-12 20 14v38z" fill="#4E7F6E"/><path d="M0 100V82l40-16 40 14 40-10 40 14v16z" fill="#2E5548"/></svg>'},
    {id:'title', name:'제목 MY TRIP', op:100, blend:'normal', vis:true, thumb:'linear-gradient(#5A6175,#5A6175)',
     html:'<div style="position:absolute;inset:0;display:grid;place-items:center;padding-top:14%"><span style="font:700 clamp(22px,6vw,40px)/1 var(--font);color:#fff;letter-spacing:-.02em;text-shadow:0 2px 12px rgba(0,0,0,.35)">MY TRIP</span></div>'},
    {id:'sky', name:'배경 하늘', op:100, blend:'normal', vis:true, thumb:'linear-gradient(#7FB2F0,#F7C59F)',
     html:'<div style="position:absolute;inset:0;background:linear-gradient(#6FA6EC,#F7C59F)"></div>'}
  ];
  let sel='title', toggles=0, dragId=null;
  const canvas=h('div',{class:'ps-canvas','aria-label':'캔버스 미리보기'});
  S.stage.append(canvas);
  const list=h('ul',{class:'layer-list','aria-label':'레이어 패널'});
  const ctrls=h('div',{style:'display:grid;gap:10px'});
  ctrls.innerHTML=`<div class="ctrl"><label>불투명도 <output>100%</output></label><input type="range" min="0" max="100" value="100" aria-label="불투명도"></div>
   <div class="ctrl"><label>혼합 모드</label><select aria-label="혼합 모드"><option value="normal">표준</option><option value="multiply">곱하기</option><option value="screen">스크린</option><option value="overlay">오버레이</option><option value="soft-light">소프트 라이트</option></select></div>`;
  S.extra.append(h('h5',{},'레이어 패널'),list,ctrls,h('p',{class:'fine',style:'margin:0'},'위에 있는 레이어가 화면 앞쪽에 보여요. ▲▼ 버튼으로도 옮길 수 있어요.'));
  const range=$('input',ctrls), out=$('output',ctrls), selBox=$('select',ctrls);
  function render(){
    canvas.innerHTML='';
    [...L].reverse().forEach(l=>{ const d=h('div',{},l.html); d.style.opacity=l.vis?l.op/100:0; d.style.mixBlendMode=l.blend; canvas.append(d); });
    list.innerHTML='';
    L.forEach((l,i)=>{
      const li=h('li',{class:(l.id===sel?'sel ':'')+(l.vis?'':'hidden-l'),draggable:'true','data-id':l.id});
      li.innerHTML=`<button class="eye" aria-label="${l.name} ${l.vis?'숨기기':'보이기'}">${eyeSvg(l.vis)}</button><span class="thumb" style="background:${l.thumb}"></span><span class="name">${l.name}</span><span class="mv"><button aria-label="위로">▲</button><button aria-label="아래로">▼</button></span>`;
      li.addEventListener('click',e=>{ if(e.target.closest('button'))return; sel=l.id; sync(); });
      $('.eye',li).addEventListener('click',()=>{ l.vis=!l.vis; toggles++; sync(); });
      const [up,down]=li.querySelectorAll('.mv button');
      up.addEventListener('click',()=>move(i,i-1)); down.addEventListener('click',()=>move(i,i+1));
      li.addEventListener('dragstart',e=>{dragId=l.id; e.dataTransfer.effectAllowed='move'; try{e.dataTransfer.setData('text/plain',l.id)}catch(_){}});
      li.addEventListener('dragover',e=>{e.preventDefault(); li.classList.add('drag-over');});
      li.addEventListener('dragleave',()=>li.classList.remove('drag-over'));
      li.addEventListener('drop',e=>{e.preventDefault(); const from=L.findIndex(x=>x.id===dragId); move(from,i);});
      list.append(li);
    });
    const s=L.find(x=>x.id===sel); range.value=s.op; out.textContent=s.op+'%'; selBox.value=s.blend;
  }
  function move(a,b){ if(b<0||b>=L.length||a===b||a<0)return; const [x]=L.splice(a,1); L.splice(b,0,x); sel=x.id; sync(); }
  range.addEventListener('input',()=>{ L.find(x=>x.id===sel).op=+range.value; sync(); });
  selBox.addEventListener('change',()=>{ L.find(x=>x.id===sel).blend=selBox.value; sync(); });
  function sync(){ render(); const g=id=>L.find(x=>x.id===id);
    S.set([L[0].id==='title', g('sun').op<=70, g('mount').blend==='multiply', toggles>=2 && L.every(x=>x.vis)]); }
  sync();
};

/* ---------- 2. Illustrator 펜 ---------- */
SIMS.pen = function(host,opt){
  const S=shell(host,{title:'펜 도구 연습장', hint:'클릭 = 직선 점, 클릭+드래그 = 곡선 점', goals:[
    '점 3개 이상 찍기','드래그해서 곡선 점 만들기','시작점을 클릭해 패스 닫기','닫힌 도형에 칠 색 넣기']},opt);
  const NS='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(NS,'svg'); svg.setAttribute('viewBox','0 0 400 300'); svg.setAttribute('class','pen-svg'); svg.setAttribute('aria-label','펜 도구 캔버스');
  S.stage.append(svg);
  const COLORS=['#E07A12','#3046E0','#14946B','#E23D6E','#151A26'];
  let paths=[{pts:[],closed:false,fill:null}], cur=0, down=null, outline=false, curvy=0, filled=false;
  const tb=h('div',{class:'toolbar'});
  tb.innerHTML=`<button class="tbtn" data-a="new">새 패스</button><button class="tbtn" data-a="undo">마지막 점 취소</button><button class="tbtn" data-a="out" aria-pressed="false">윤곽선 보기 <kbd>Ctrl+Y</kbd></button><button class="tbtn" data-a="clear">모두 지우기</button>`;
  const sw=h('div',{class:'swatches'}); COLORS.forEach(c=>{ const b=h('button',{style:`--sw:${c}`,'aria-label':'칠 색 '+c,'aria-pressed':'false'}); b.onclick=()=>{ const p=paths[cur].closed?paths[cur]:paths.slice().reverse().find(x=>x.closed); if(!p){opt.toast&&opt.toast('먼저 패스를 닫아야 색을 채울 수 있어요');return;} p.fill=c; filled=true; [...sw.children].forEach(x=>x.setAttribute('aria-pressed',x===b)); draw(); }; sw.append(b); });
  S.extra.append(h('h5',{},'도구'),tb,h('h5',{},'칠 색 (닫힌 패스에 적용)'),sw,h('p',{class:'fine',style:'margin:0'},'곡선 점을 만들 땐 핸들을 다음 점 방향으로 당기세요. 점은 적을수록 매끈해요.'));
  tb.addEventListener('click',e=>{ const a=e.target.closest('button')?.dataset.a; if(!a)return;
    if(a==='new'){ if(paths[cur].pts.length){ paths.push({pts:[],closed:false,fill:null}); cur=paths.length-1; } }
    if(a==='undo'){ const p=paths[cur]; if(p.closed)p.closed=false; else p.pts.pop(); }
    if(a==='out'){ outline=!outline; e.target.closest('button').setAttribute('aria-pressed',outline); }
    if(a==='clear'){ paths=[{pts:[],closed:false,fill:null}]; cur=0; }
    draw(); });
  function pt(e){ const r=svg.getBoundingClientRect(); return {x:(e.clientX-r.left)/r.width*400, y:(e.clientY-r.top)/r.height*300}; }
  function dPath(p){ if(!p.pts.length) return ''; let d=`M${p.pts[0].x} ${p.pts[0].y}`;
    const seg=(a,b)=>` C${a.hx} ${a.hy} ${2*b.x-b.hx} ${2*b.y-b.hy} ${b.x} ${b.y}`;
    for(let i=1;i<p.pts.length;i++) d+=seg(p.pts[i-1],p.pts[i]);
    if(p.closed && p.pts.length>2) d+=seg(p.pts[p.pts.length-1],p.pts[0])+'Z';
    return d; }
  function draw(){
    svg.innerHTML='';
    paths.forEach((p,pi)=>{
      const path=document.createElementNS(NS,'path'); path.setAttribute('d',dPath(p));
      path.setAttribute('fill', !outline && p.closed && p.fill ? p.fill : (p.closed&&!outline?'rgba(48,70,224,.06)':'none'));
      path.setAttribute('stroke', outline?'#151A26':'#3046E0'); path.setAttribute('stroke-width', outline?1:2); svg.append(path);
      if(pi!==cur && !outline) return;
      p.pts.forEach((q,i)=>{
        const curve=Math.hypot(q.hx-q.x,q.hy-q.y)>3;
        if(curve && pi===cur){ [[q.hx,q.hy],[2*q.x-q.hx,2*q.y-q.hy]].forEach(([x,y])=>{ const l=document.createElementNS(NS,'line'); l.setAttribute('x1',q.x);l.setAttribute('y1',q.y);l.setAttribute('x2',x);l.setAttribute('y2',y);l.setAttribute('stroke','#8FA2FF'); svg.append(l); const c=document.createElementNS(NS,'circle'); c.setAttribute('cx',x);c.setAttribute('cy',y);c.setAttribute('r',3.5);c.setAttribute('fill','#8FA2FF'); svg.append(c); }); }
        const r=document.createElementNS(NS,'rect'); r.setAttribute('x',q.x-4);r.setAttribute('y',q.y-4);r.setAttribute('width',8);r.setAttribute('height',8);
        r.setAttribute('fill', i===0&&!p.closed&&p.pts.length>2&&pi===cur?'#FFC83D':'#fff'); r.setAttribute('stroke','#3046E0'); r.setAttribute('stroke-width',1.5); svg.append(r);
      });
    });
    const all=paths.reduce((n,p)=>n+p.pts.length,0);
    S.set([all>=3, curvy>0, paths.some(p=>p.closed), filled && paths.some(p=>p.closed&&p.fill)]);
  }
  svg.addEventListener('pointerdown',e=>{
    e.preventDefault(); const q=pt(e); let p=paths[cur];
    if(p.closed){ paths.push({pts:[],closed:false,fill:null}); cur=paths.length-1; p=paths[cur]; }
    if(p.pts.length>2 && Math.hypot(q.x-p.pts[0].x,q.y-p.pts[0].y)<12){ p.closed=true; opt.toast&&opt.toast('패스를 닫았어요. 이제 칠 색을 골라 보세요'); draw(); return; }
    const np={x:q.x,y:q.y,hx:q.x,hy:q.y}; p.pts.push(np); down=np; svg.setPointerCapture(e.pointerId); draw();
  });
  svg.addEventListener('pointermove',e=>{ if(!down)return; const q=pt(e); down.hx=q.x; down.hy=q.y; draw(); });
  const end=()=>{ if(down && Math.hypot(down.hx-down.x,down.hy-down.y)>6) curvy++; else if(down){down.hx=down.x;down.hy=down.y;} down=null; draw(); };
  svg.addEventListener('pointerup',end); svg.addEventListener('pointercancel',end);
  draw();
};

/* ---------- 3. Lightroom 보정 ---------- */
SIMS.develop = function(host,opt){
  const S=shell(host,{title:'보정 연습장', hint:'흐린 날 사진을 노을 느낌으로 바꿔 보세요', goals:[
    '전·후 비교 버튼 눌러 보기','노출을 -0.3 이하로 내려 하늘 살리기','색온도 +40 이상 (따뜻하게)','채도 또는 활기를 +15 이상']},opt);
  const ph=h('div',{class:'lr-photo'});
  ph.innerHTML=`<svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="lrSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9FB4C8"/><stop offset="1" stop-color="#E6D2BC"/></linearGradient><linearGradient id="lrSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FA3B3"/><stop offset="1" stop-color="#5E7385"/></linearGradient></defs>
  <rect width="300" height="200" fill="url(#lrSky)"/><circle cx="212" cy="96" r="20" fill="#F4DDB0"/>
  <path d="M0 120 50 86l38 22 46-40 52 46 34-20 80 34v20H0z" fill="#6D7E7A"/><rect y="132" width="300" height="68" fill="url(#lrSea)"/>
  <path d="M190 140h44" stroke="#F4DDB0" stroke-width="3" opacity=".6"/><path d="M196 150h30" stroke="#F4DDB0" stroke-width="2" opacity=".45"/>
  <path d="M60 168l18-10 18 10z" fill="#3E4A52"/><path d="M78 158v-20l12 16z" fill="#E7E2D8"/>
  <path d="M0 200v-18c30-8 60 2 80-4s40-14 70 0v22z" fill="#4C5A55"/></svg><div class="tint"></div><span class="label">보정 후</span>`;
  S.stage.append(ph);
  const svg=$('svg',ph), tint=$('.tint',ph), label=$('.label',ph);
  const V={exp:0,con:0,temp:0,sat:0,vib:0}; let compared=false, before=false;
  const defs=[['exp','노출',-2,2,.1],['con','대비',-50,50,1],['temp','색온도',-100,100,1],['vib','활기',-100,100,1],['sat','채도',-100,100,1]];
  const box=h('div',{style:'display:grid;gap:8px'});
  defs.forEach(([k,n,mi,ma,st])=>{ const c=h('div',{class:'ctrl'}); c.innerHTML=`<label>${n} <output>0</output></label><input type="range" min="${mi}" max="${ma}" step="${st}" value="0" data-k="${k}" aria-label="${n}">`; box.append(c); });
  const tb=h('div',{class:'toolbar'}); tb.innerHTML=`<button class="tbtn" data-a="ba" aria-pressed="false">전·후 비교 <kbd>\\</kbd></button><button class="tbtn" data-a="auto">자동</button><button class="tbtn" data-a="reset">초기화</button>`;
  const pr=h('div',{class:'toolbar'}); pr.innerHTML=`<button class="tbtn" data-p="sunset">프리셋: 따뜻한 노을</button><button class="tbtn" data-p="cool">프리셋: 맑은 아침</button><button class="tbtn" data-p="mono">프리셋: 흑백</button>`;
  S.extra.append(h('h5',{},'기본 패널'),box,tb,h('h5',{},'프리셋'),pr);
  const fmt=(k,v)=>k==='exp'?(v>0?'+':'')+(+v).toFixed(1):(v>0?'+':'')+v;
  function apply(){
    box.querySelectorAll('input').forEach(i=>{ i.value=V[i.dataset.k]; i.previousElementSibling.querySelector('output').textContent=fmt(i.dataset.k,V[i.dataset.k]); });
    const sat=1+(V.sat+V.vib*.7)/100;
    svg.style.filter = before?'none':`brightness(${1+V.exp*.32}) contrast(${1+V.con/100}) saturate(${Math.max(0,sat)})`;
    const t=V.temp; tint.style.background = before||t===0?'transparent': t>0?`rgba(255,130,30,${t/100*.75})`:`rgba(30,110,255,${-t/100*.75})`;
    label.textContent=before?'보정 전 (원본)':'보정 후';
    S.set([compared, V.exp<=-0.3, V.temp>=40, V.sat>=15||V.vib>=15]);
  }
  box.addEventListener('input',e=>{ const k=e.target.dataset.k; if(k){V[k]=+e.target.value; apply();} });
  const ba=$('[data-a=ba]',tb);
  const toggleBA=()=>{ before=!before; compared=true; ba.setAttribute('aria-pressed',before); apply(); };
  tb.addEventListener('click',e=>{ const a=e.target.closest('button')?.dataset.a; if(a==='ba')toggleBA(); if(a==='auto'){Object.assign(V,{exp:.3,con:12,temp:8,vib:18,sat:4}); apply();} if(a==='reset'){Object.assign(V,{exp:0,con:0,temp:0,sat:0,vib:0}); apply();} });
  pr.addEventListener('click',e=>{ const p=e.target.closest('button')?.dataset.p; if(!p)return;
    Object.assign(V,{sunset:{exp:-.4,con:18,temp:55,vib:30,sat:10},cool:{exp:.4,con:8,temp:-35,vib:20,sat:0},mono:{exp:.1,con:30,temp:0,vib:0,sat:-100}}[p]); apply(); });
  S.root.addEventListener('keydown',e=>{ if(e.key==='\\'){ e.preventDefault(); toggleBA(); } });
  apply();
};

/* ---------- 4. Premiere 타임라인 ---------- */
SIMS.timeline = function(host,opt){
  const S=shell(host,{title:'타임라인 연습장', hint:'연습장을 클릭한 뒤 V·C·Delete·Space 키도 써 보세요', goals:[
    '자르기 도구(C)로 클립 자르기','“NG 장면” 클립 지우기','전체 길이를 12초 이하로','Space로 재생해 확인하기']},opt);
  const TOTAL=16;
  let clips=[{n:'인트로',l:4,c:'#6F45D9'},{n:'인터뷰',l:5,c:'#3A7BD5'},{n:'NG 장면',l:2,c:'#C0392B'},{n:'풍경',l:3,c:'#1E9E7A'},{n:'엔딩',l:2,c:'#D48A1E'}];
  let tool='V', sel=-1, t=0, cuts=0, played=false, raf=null;
  const wrap=h('div',{class:'pr-wrap'});
  wrap.innerHTML=`<div class="pr-monitor"><span class="mon-t"></span><small class="tc">00:00</small></div>
   <div><div class="pr-ruler">${[0,4,8,12,16].map(s=>`<span>${s}s</span>`).join('')}</div>
   <div class="pr-track"><div class="pr-clips"></div><div class="pr-head"></div></div>
   <input type="range" min="0" max="${TOTAL}" step="0.1" value="0" aria-label="재생헤드 위치" style="margin-top:6px"></div>`;
  S.stage.append(wrap); S.stage.style.alignItems='stretch';
  const track=$('.pr-track',wrap), cl=$('.pr-clips',wrap), head=$('.pr-head',wrap), scrub=$('input',wrap), mon=$('.pr-monitor',wrap);
  const tb=h('div',{class:'toolbar'});
  tb.innerHTML=`<button class="tbtn" data-a="V" aria-pressed="true">선택 <kbd>V</kbd></button><button class="tbtn" data-a="C" aria-pressed="false">자르기 <kbd>C</kbd></button><button class="tbtn" data-a="K">재생헤드에서 자르기</button><button class="tbtn" data-a="del">잔물결 삭제 <kbd>Del</kbd></button><button class="tbtn" data-a="play">재생 <kbd>Space</kbd></button><button class="tbtn" data-a="reset">처음부터</button>`;
  const info=h('p',{class:'fine',style:'margin:0'});
  S.extra.append(h('h5',{},'도구'),tb,info);
  const total=()=>clips.reduce((s,c)=>s+c.l,0);
  function at(time){ let acc=0; for(let i=0;i<clips.length;i++){ if(time<acc+clips[i].l) return {i,off:time-acc}; acc+=clips[i].l; } return null; }
  function split(i,off){ off=Math.round(off*10)/10; const c=clips[i]; if(off<.3||c.l-off<.3)return false;
    clips.splice(i,1,{n:c.n,l:off,c:c.c},{n:c.n,l:+(c.l-off).toFixed(1),c:c.c}); cuts++; sel=i+1; return true; }
  function render(){
    cl.innerHTML='';
    clips.forEach((c,i)=>{ const d=h('div',{class:'pr-clip'+(i===sel?' sel':''),style:`width:${c.l/TOTAL*100}%;background:${c.c}`,title:`${c.n} ${c.l}초`},`${c.n}<br><span style="opacity:.75">${c.l}s</span>`);
      d.addEventListener('click',e=>{ if(tool==='C'){ const r=d.getBoundingClientRect(); split(i,(e.clientX-r.left)/r.width*c.l); } else sel=i; render(); });
      cl.append(d); });
    track.classList.toggle('razor',tool==='C');
    head.style.left=`calc(${Math.min(t,TOTAL)/TOTAL*100}% - 1px)`; scrub.value=t;
    const a=at(t); $('.mon-t',mon).textContent=a?clips[a.i].n:'(검은 화면)'; mon.style.background=a?clips[a.i].c:'#111';
    $('.tc',mon).textContent=`00:${String(Math.floor(t)).padStart(2,'0')} / 총 ${total().toFixed(1)}초`;
    tb.querySelectorAll('[data-a=V],[data-a=C]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.a===tool));
    info.textContent = tool==='C' ? '자르기 도구: 클립 위 자를 지점을 클릭하세요.' : '선택 도구: 클립을 클릭해 고른 뒤 잔물결 삭제를 눌러 보세요.';
    S.set([cuts>0, !clips.some(c=>c.n==='NG 장면'), total()<=12, played]);
  }
  function act(a){
    if(a==='V'||a==='C') tool=a;
    if(a==='K'){ const r=at(t); if(r) split(r.i,r.off); }
    if(a==='del' && sel>=0 && clips[sel]){ clips.splice(sel,1); sel=-1; }
    if(a==='play') play();
    if(a==='reset'){ clips=[{n:'인트로',l:4,c:'#6F45D9'},{n:'인터뷰',l:5,c:'#3A7BD5'},{n:'NG 장면',l:2,c:'#C0392B'},{n:'풍경',l:3,c:'#1E9E7A'},{n:'엔딩',l:2,c:'#D48A1E'}]; sel=-1; t=0; }
    render();
  }
  function play(){ if(raf){cancelAnimationFrame(raf); raf=null; return;} if(t>=total()) t=0; let last=performance.now();
    const step=now=>{ t+= (now-last)/1000*3; last=now; if(t>=total()){ t=total(); raf=null; played=true; render(); return; } render(); raf=requestAnimationFrame(step); }; raf=requestAnimationFrame(step); }
  tb.addEventListener('click',e=>{ const a=e.target.closest('button')?.dataset.a; if(a) act(a); });
  scrub.addEventListener('input',()=>{ t=+scrub.value; render(); });
  S.root.addEventListener('keydown',e=>{
    if(e.target.tagName==='INPUT' && e.key!==' ') return;
    const k=e.key.toLowerCase();
    if(k==='v'||k==='c'){ act(k.toUpperCase()); e.preventDefault(); }
    else if((e.ctrlKey||e.metaKey)&&k==='k'){ act('K'); e.preventDefault(); }
    else if(k==='delete'||k==='backspace'){ act('del'); e.preventDefault(); }
    else if(k===' '){ act('play'); e.preventDefault(); }
  });
  render();
};

/* ---------- 5. After Effects 키프레임 ---------- */
SIMS.keyframe = function(host,opt){
  const S=shell(host,{title:'키프레임 연습장', hint:'시간을 옮기고 → 위치를 바꾸고 → ◆ 추가', goals:[
    '키프레임 2개 이상 만들기','두 키프레임의 위치를 다르게','이징(F9) 켜기','재생해서 움직임 확인']},opt);
  const st=h('div',{class:'ae-stage'},'<div class="ae-obj">Aa</div>');
  const tl=h('div',{class:'ae-tl'},'<div class="ph"></div>');
  S.stage.append(st,tl);
  const obj=$('.ae-obj',st), ph=$('.ph',tl);
  let kfs=[], ease=false, t=0, x=12, played=false, raf=null;
  const box=h('div',{style:'display:grid;gap:8px'});
  box.innerHTML=`<div class="ctrl"><label>시간 <output class="ot">0.00s</output></label><input type="range" min="0" max="2" step="0.05" value="0" data-k="t" aria-label="시간"></div>
   <div class="ctrl"><label>위치 X <output class="ox">12%</output></label><input type="range" min="8" max="92" step="1" value="12" data-k="x" aria-label="위치 X"></div>`;
  const tb=h('div',{class:'toolbar'}); tb.innerHTML=`<button class="tbtn" data-a="kf">◆ 키프레임 추가</button><button class="tbtn" data-a="ease" aria-pressed="false">Easy Ease <kbd>F9</kbd></button><button class="tbtn" data-a="play">재생</button><button class="tbtn" data-a="clear">키프레임 지우기</button>`;
  const hint=h('p',{class:'fine',style:'margin:0'},'예: 0초에서 ◆ → 시간을 1.5초로 → 위치를 오른쪽 끝으로 → ◆');
  S.extra.append(h('h5',{},'위치 속성 (P)'),box,tb,hint);
  const tIn=$('[data-k=t]',box), xIn=$('[data-k=x]',box);
  const E=p=>p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
  function val(time){ if(kfs.length===0) return x; if(time<=kfs[0].t) return kfs[0].x; const L=kfs[kfs.length-1]; if(time>=L.t) return L.x;
    for(let i=0;i<kfs.length-1;i++){ const a=kfs[i],b=kfs[i+1]; if(time>=a.t&&time<=b.t){ let p=(time-a.t)/(b.t-a.t||1); if(ease)p=E(p); return a.x+(b.x-a.x)*p; } } return x; }
  function render(){
    obj.style.left=x+'%'; ph.style.left=`calc(${t/2*100}% - 1px)`; tIn.value=t; xIn.value=Math.round(x);
    $('.ot',box).textContent=t.toFixed(2)+'s'; $('.ox',box).textContent=Math.round(x)+'%';
    tl.querySelectorAll('.kf').forEach(k=>k.remove());
    kfs.forEach(k=>tl.append(h('i',{class:'kf'+(ease?' ease':''),style:`left:${k.t/2*100}%`,title:`${k.t}s · ${Math.round(k.x)}%`})));
    $('[data-a=ease]',tb).setAttribute('aria-pressed',ease);
    const xs=new Set(kfs.map(k=>Math.round(k.x)));
    S.set([kfs.length>=2, xs.size>=2, ease, played]);
  }
  tIn.addEventListener('input',()=>{ t=+tIn.value; if(kfs.length) x=val(t); render(); });
  xIn.addEventListener('input',()=>{ x=+xIn.value; render(); });
  function act(a){
    if(a==='kf'){ const i=kfs.findIndex(k=>Math.abs(k.t-t)<.001); if(i>=0) kfs[i].x=x; else kfs.push({t:+t.toFixed(2),x}); kfs.sort((a,b)=>a.t-b.t); }
    if(a==='ease') ease=!ease;
    if(a==='clear'){ kfs=[]; }
    if(a==='play'){ if(kfs.length<2){ opt.toast&&opt.toast('키프레임을 2개 이상 만든 뒤 재생해 보세요'); return; }
      if(raf)cancelAnimationFrame(raf); const start=performance.now(); const dur=2000;
      const step=now=>{ t=Math.min(2,(now-start)/dur*2); x=val(t); render(); if(t<2) raf=requestAnimationFrame(step); else { played=true; raf=null; render(); } }; raf=requestAnimationFrame(step); return; }
    render();
  }
  tb.addEventListener('click',e=>{ const a=e.target.closest('button')?.dataset.a; if(a) act(a); });
  S.root.addEventListener('keydown',e=>{ if(e.key==='F9'){ e.preventDefault(); act('ease'); } });
  render();
};

/* ---------- 6. InDesign 타이포그래피 ---------- */
SIMS.type = function(host,opt){
  const S=shell(host,{title:'타이포그래피 연습장', hint:'읽기 불편한 본문을 읽기 좋게 고쳐 보세요', goals:[
    '본문 크기 15px 이상','행간 1.5 ~ 1.9','자간 -0.03 ~ 0.02em','긴 본문은 왼쪽 또는 양쪽 정렬']},opt);
  const page=h('div',{class:'id-page'});
  page.innerHTML=`<h6>스페인어로 여는 하루</h6><p>아침마다 스페인어 문장 하나를 소리 내어 읽어 보세요. 짧은 문장이라도 매일 반복하면 입과 귀가 함께 익숙해집니다. 처음에는 뜻을 다 몰라도 괜찮아요. 리듬을 따라 읽다 보면 어느새 단어가 먼저 떠오르고, 그다음엔 문장이 자연스럽게 이어져요. 오늘의 문장은 “Hoy es un buen día para empezar.”입니다.</p>`;
  S.stage.append(page);
  const p=$('p',page);
  const V={fs:12,lh:1.1,ls:.08,al:'center',col:1};
  const box=h('div',{style:'display:grid;gap:8px'});
  [['fs','글자 크기',11,22,1,'px'],['lh','행간',1,2.2,.05,''],['ls','자간',-.1,.15,.01,'em']].forEach(([k,n,a,b,s,u])=>{ const c=h('div',{class:'ctrl'}); c.innerHTML=`<label>${n} <output data-o="${k}"></output></label><input type="range" min="${a}" max="${b}" step="${s}" data-k="${k}" data-u="${u}" aria-label="${n}">`; box.append(c); });
  const al=h('div',{class:'toolbar'}); al.innerHTML=['left:왼쪽','center:가운데','justify:양쪽'].map(s=>{const[v,n]=s.split(':');return `<button class="tbtn" data-al="${v}">${n} 정렬</button>`;}).join('');
  const co=h('div',{class:'toolbar'}); co.innerHTML='<button class="tbtn" data-col="1">1단</button><button class="tbtn" data-col="2">2단</button>';
  S.extra.append(h('h5',{},'문자 · 단락'),box,al,co,h('p',{class:'fine',style:'margin:0'},'한국어 본문은 행간 1.6 안팎, 자간 0 근처가 편안해요.'));
  function render(){
    p.style.fontSize=V.fs+'px'; p.style.lineHeight=V.lh; p.style.letterSpacing=V.ls+'em'; p.style.textAlign=V.al; p.style.columnCount=V.col; p.style.columnGap='20px';
    box.querySelectorAll('input').forEach(i=>{ i.value=V[i.dataset.k]; $(`[data-o=${i.dataset.k}]`,box).textContent=(+V[i.dataset.k]).toFixed(i.dataset.k==='fs'?0:2)+i.dataset.u; });
    al.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.al===V.al));
    co.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.col===V.col));
    S.set([V.fs>=15, V.lh>=1.5&&V.lh<=1.9, V.ls>=-.03-1e-9&&V.ls<=.02+1e-9, V.al!=='center']);
  }
  box.addEventListener('input',e=>{ const k=e.target.dataset.k; if(k){ V[k]=+e.target.value; render(); } });
  al.addEventListener('click',e=>{ const v=e.target.closest('button')?.dataset.al; if(v){V.al=v; render();} });
  co.addEventListener('click',e=>{ const v=e.target.closest('button')?.dataset.col; if(v){V.col=+v; render();} });
  render();
};

/* ---------- 7. Acrobat 페이지 구성 ---------- */
SIMS.pdf = function(host,opt){
  const S=shell(host,{title:'PDF 정리 연습장', hint:'페이지를 끌어서 순서를 바꾸고, 선택 후 버튼으로 회전·삭제', goals:[
    '빈 페이지 삭제','옆으로 누운 “1장” 바로 세우기','표지 → 목차 → 1장 → 2장 → 부록 순서로']},opt);
  const init=()=>[{id:'cover',n:'표지',r:0},{id:'ch2',n:'2장',r:0},{id:'blank',n:'',r:0},{id:'toc',n:'목차',r:0},{id:'ch1',n:'1장',r:90},{id:'app',n:'부록',r:0}];
  let P=init(), sel=null, drag=null;
  const grid=h('div',{class:'pdf-pages',role:'list','aria-label':'페이지 썸네일'});
  S.stage.append(grid);
  const tb=h('div',{class:'toolbar'}); tb.innerHTML=`<button class="tbtn" data-a="l">◀ 앞으로</button><button class="tbtn" data-a="r">뒤로 ▶</button><button class="tbtn" data-a="rot">⟳ 90° 회전</button><button class="tbtn" data-a="del">🗑 삭제</button><button class="tbtn" data-a="reset">처음부터</button>`;
  const info=h('p',{class:'fine',style:'margin:0'},'페이지를 먼저 클릭해 선택하세요.');
  S.extra.append(h('h5',{},'페이지 구성 도구'),tb,info);
  function render(){
    grid.innerHTML='';
    P.forEach((p,i)=>{
      const d=h('div',{class:'pdf-page'+(p.id===sel?' sel':''),draggable:'true',role:'listitem',tabindex:'0','aria-label':`${i+1}쪽 ${p.n||'빈 페이지'}`});
      d.innerHTML=`<div class="sheet" style="transform:rotate(${p.r}deg)">${p.n?`<span>${p.n}</span><i></i><i></i><i style="width:30px"></i>`:''}</div><span class="pn">${i+1}</span>`;
      d.addEventListener('click',()=>{ sel=p.id; render(); });
      d.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); sel=p.id; render(); } });
      d.addEventListener('dragstart',e=>{ drag=p.id; try{e.dataTransfer.setData('text/plain',p.id)}catch(_){} });
      d.addEventListener('dragover',e=>{ e.preventDefault(); d.classList.add('drag-over'); });
      d.addEventListener('dragleave',()=>d.classList.remove('drag-over'));
      d.addEventListener('drop',e=>{ e.preventDefault(); if(!drag||drag===p.id){ render(); return; } const a=P.findIndex(x=>x.id===drag); if(a<0)return; const [m]=P.splice(a,1); const b=P.findIndex(x=>x.id===p.id); P.splice(a<i?b+1:b,0,m); sel=m.id; drag=null; render(); });
      grid.append(d);
    });
    const s=P.find(x=>x.id===sel); info.textContent = s?`선택: ${P.indexOf(s)+1}쪽 (${s.n||'빈 페이지'})`:'페이지를 먼저 클릭해 선택하세요.';
    const order=P.filter(x=>x.id!=='blank').map(x=>x.id).join();
    S.set([!P.some(x=>x.id==='blank'), (P.find(x=>x.id==='ch1')?.r||0)%360===0, order==='cover,toc,ch1,ch2,app' && !P.some(x=>x.id==='blank')]);
  }
  tb.addEventListener('click',e=>{ const a=e.target.closest('button')?.dataset.a; if(!a)return;
    if(a==='reset'){ P=init(); sel=null; return render(); }
    const i=P.findIndex(x=>x.id===sel); if(i<0){ opt.toast&&opt.toast('먼저 페이지를 선택하세요'); return; }
    if(a==='l'&&i>0){ [P[i-1],P[i]]=[P[i],P[i-1]]; }
    if(a==='r'&&i<P.length-1){ [P[i+1],P[i]]=[P[i],P[i+1]]; }
    if(a==='rot'){ P[i].r=(P[i].r+90)%360; }
    if(a==='del'){ P.splice(i,1); sel=null; }
    render(); });
  render();
};

/* ---------- 8. Express SNS 디자인 ---------- */
SIMS.express = function(host,opt){
  const S=shell(host,{title:'SNS 디자인 연습장', hint:'템플릿 하나로 크기·색·문구를 바꿔 보세요', goals:[
    '제목 문구 바꾸기','스토리 크기(9:16)로 바꾸기','색 조합 바꾸기','레이아웃 바꾸기']},opt);
  const SIZES={'1:1':['1/1','1080×1080 · 인스타 게시물'],'4:5':['4/5','1080×1350 · 세로 게시물'],'9:16':['9/16','1080×1920 · 스토리·릴스'],'16:9':['16/9','1280×720 · 유튜브 썸네일']};
  const PAL=[['#1F2A6B','#FFC83D','남색 × 노랑'],['#E23D6E','#FFE3EC','핑크 × 연분홍'],['#0F5F4D','#F2E8CF','숲색 × 아이보리'],['#151A26','#7CF2D0','먹색 × 민트']];
  const DEF='겨울 특강 오픈';
  const V={t1:DEF,t2:'12월 2일 시작 · 선착순 10명',size:'1:1',pal:0,lay:0};
  const art=h('div',{class:'ex-art'}); const sz=h('div',{class:'ex-size'});
  S.stage.append(art,sz);
  const form=h('div',{style:'display:grid;gap:8px'});
  form.innerHTML=`<label class="fine" for="exT1">제목</label><input id="exT1" type="text" maxlength="30"><label class="fine" for="exT2">부제</label><input id="exT2" type="text" maxlength="40">`;
  const sizes=h('div',{class:'toolbar'}); sizes.innerHTML=Object.keys(SIZES).map(k=>`<button class="tbtn" data-s="${k}">${k}</button>`).join('');
  const pals=h('div',{class:'swatches'}); PAL.forEach((p,i)=>{ const b=h('button',{style:`--sw:linear-gradient(135deg,${p[0]} 50%,${p[1]} 50%)`,'aria-label':p[2],'data-p':i}); b.style.background=`linear-gradient(135deg,${p[0]} 50%,${p[1]} 50%)`; pals.append(b); });
  const lays=h('div',{class:'toolbar'}); lays.innerHTML=['아래 정렬','가운데','큰 원'].map((n,i)=>`<button class="tbtn" data-l="${i}">${n}</button>`).join('');
  const cp=h('button',{class:'copy'},'Claude에게 보낼 요청 복사');
  S.extra.append(form,h('h5',{},'크기 조정'),sizes,h('h5',{},'색 조합'),pals,h('h5',{},'레이아웃'),lays,cp);
  const t1=$('#exT1',form), t2=$('#exT2',form); t1.value=V.t1; t2.value=V.t2;
  const touched={size:false,pal:false,lay:false};
  function render(){
    const [bg,fg]=PAL[V.pal];
    art.style.aspectRatio=SIZES[V.size][0]; art.style.background=bg; art.style.color=V.lay===2?bg:'#fff';
    art.style.justifyContent=['flex-end','center','center'][V.lay]; art.style.textAlign=V.lay===0?'left':'center';
    art.innerHTML=`${V.lay===2?`<div class="shape" style="width:78%;aspect-ratio:1;left:11%;top:50%;transform:translateY(-50%);background:${fg}"></div>`:`<div class="shape" style="width:55%;aspect-ratio:1;right:-14%;top:-10%;background:${fg};opacity:.9"></div>`}<div style="position:relative"><div class="t1"></div><div class="t2"></div></div>`;
    $('.t1',art).textContent=V.t1; $('.t2',art).textContent=V.t2; if(V.lay!==2) $('.t1',art).style.color=fg;
    sz.textContent=SIZES[V.size][1];
    sizes.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.s===V.size));
    pals.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.p===V.pal));
    lays.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.l===V.lay));
    S.set([V.t1.trim()!==''&&V.t1!==DEF, V.size==='9:16', touched.pal&&V.pal!==0, touched.lay&&V.lay!==0]);
  }
  t1.addEventListener('input',()=>{V.t1=t1.value; render();}); t2.addEventListener('input',()=>{V.t2=t2.value; render();});
  sizes.addEventListener('click',e=>{ const s=e.target.closest('button')?.dataset.s; if(s){V.size=s; render();} });
  pals.addEventListener('click',e=>{ const p=e.target.closest('button')?.dataset.p; if(p!=null){V.pal=+p; touched.pal=true; render();} });
  lays.addEventListener('click',e=>{ const l=e.target.closest('button')?.dataset.l; if(l!=null){V.lay=+l; touched.lay=true; render();} });
  cp.addEventListener('click',()=>window.copyText(`Adobe Express에서 ${SIZES[V.size][1].split(' · ')[1]}용(${SIZES[V.size][1].split(' · ')[0]}) 디자인을 만들어 줘. 제목은 “${V.t1}”, 부제는 “${V.t2}”, 색은 ${PAL[V.pal][2]} 조합으로 해 줘.`, cp));
  render();
};

/* ---------- 9. Firefly 프롬프트 조립 ---------- */
SIMS.prompt = function(host,opt){
  const S=shell(host,{title:'프롬프트 조립 연습장', hint:'항목을 하나씩 골라 문장을 완성하세요', goals:[
    '항목 5개 이상 골라 구체적으로','화면 비율 정하기','완성한 프롬프트 복사하기']},opt);
  const G=[
    ['주제',[['안경 쓴 고양이 선생님','a cat teacher wearing glasses'],['우주복 입은 강아지','a puppy in a spacesuit'],['스페인 골목의 작은 카페','a tiny café in a Spanish alley'],['하늘을 나는 책들','books flying through the air']]],
    ['배경·행동',[['칠판 앞에서 수업하는','teaching in front of a chalkboard'],['달 표면을 걷는','walking on the surface of the moon'],['비 갠 오후 햇살이 드는','sunlit after the rain, with outdoor tables on a fresh afternoon after rain'],['도서관 천장 위로 날아가는','soaring under a library ceiling']]],
    ['스타일',[['수채화','watercolor illustration'],['3D 클레이','3D clay style'],['필름 사진','35mm film photo'],['플랫 일러스트','flat vector illustration']]],
    ['빛',[['부드러운 아침 햇살','soft morning sunlight'],['노을빛 역광','golden-hour backlight'],['네온 조명','neon lighting'],['흐린 날의 은은한 빛','diffused overcast light']]],
    ['구도',[['정면 상반신','front-facing medium shot'],['멀리서 넓게','wide establishing shot'],['아래에서 올려다본','low-angle view'],['위에서 내려다본','top-down view']]],
    ['비율',[['1:1','1:1'],['4:5','4:5'],['16:9','16:9'],['9:16','9:16']]]
  ];
  const pick={}; let copied=false;
  const wrap=h('div',{class:'ff-groups'});
  G.forEach(([name,opts],gi)=>{ const g=h('div',{class:'ff-group'}); g.innerHTML=`<h6>${name}</h6><div class="chips">${opts.map((o,i)=>`<button class="chip" data-g="${gi}" data-i="${i}" aria-pressed="false">${o[0]}</button>`).join('')}</div>`; wrap.append(g); });
  S.stage.append(wrap); S.stage.style.alignItems='stretch'; S.stage.style.justifyContent='flex-start';
  const out=h('div',{class:'ff-out',role:'status'}); const score=h('div',{class:'score'},'<i></i>'.repeat(6)); const sc=h('p',{class:'fine',style:'margin:0'});
  const cp=h('button',{class:'copy'},'프롬프트 복사');
  S.extra.append(h('h5',{},'완성된 프롬프트'),out,h('h5',{},'구체성'),score,sc,cp);
  function build(){
    const k=[],e=[];
    if(pick[0]!=null){k.push(G[0][1][pick[0]][0]); e.push(G[0][1][pick[0]][1]);}
    if(pick[1]!=null){k.unshift(G[1][1][pick[1]][0]); e.push(G[1][1][pick[1]][1]);}
    const rest=[2,3,4].filter(i=>pick[i]!=null);
    const ko=(k.join(' ')+(rest.length?', '+rest.map(i=>G[i][1][pick[i]][0]).join(', '):'')).trim();
    const en=[...e,...rest.map(i=>G[i][1][pick[i]][1])].join(', ');
    return {ko,en,ar:pick[5]!=null?G[5][1][pick[5]][0]:null};
  }
  function render(){
    wrap.querySelectorAll('.chip').forEach(c=>c.setAttribute('aria-pressed',pick[c.dataset.g]==c.dataset.i));
    const b=build(), n=Object.keys(pick).length;
    out.innerHTML = b.ko ? `${b.ko}${b.ar?` <span style="color:#FFD877">(비율 ${b.ar})</span>`:''}<span class="en">EN: ${b.en||'—'}</span>` : '<span style="color:#A9B3CC">왼쪽에서 항목을 골라 보세요.</span>';
    score.querySelectorAll('i').forEach((x,i)=>x.classList.toggle('on',i<n));
    sc.textContent = n<=2?'아직 짧아요. AI가 대부분을 짐작해야 해요.':n<=4?'좋아요. 빛이나 구도를 더하면 결과가 안정돼요.':'아주 구체적이에요! 원하는 그림이 나올 확률이 높아요.';
    S.set([n>=5, pick[5]!=null, copied]);
  }
  wrap.addEventListener('click',e=>{ const c=e.target.closest('.chip'); if(!c)return; const g=+c.dataset.g,i=+c.dataset.i; if(pick[g]===i) delete pick[g]; else pick[g]=i; render(); });
  cp.addEventListener('click',()=>{ const b=build(); if(!b.ko){opt.toast&&opt.toast('먼저 항목을 골라 주세요');return;} window.copyText(`${b.ko}${b.ar?` / 화면 비율 ${b.ar}`:''}\n(EN) ${b.en}`,cp); copied=true; render(); });
  render();
};

window.SIMS=SIMS;
})();
