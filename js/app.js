/* =========================================================
   라우터 · 진도 저장 · 페이지 렌더링
   ========================================================= */
(function(){
const {APPS, START, FINDER, CAPS, PIPES, RECIPES, KEYGAME, SCENARIOS, GLOSSARY, LEVELS} = window.DATA;
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const byId=id=>APPS.find(a=>a.id===id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- 상태 ---------- */
const KEY='adobe_apps_v1';
let ST={k:{},xp:0,name:'',os:'win'};
try{ const raw=localStorage.getItem(KEY); if(raw) ST=Object.assign(ST,JSON.parse(raw)); }catch(e){}
if(!ST.k) ST.k={};
if(ST.os!=='mac') ST.os='win';
function save(){ try{ localStorage.setItem(KEY,JSON.stringify(ST)); }catch(e){} }
function has(k){ return !!ST.k[k]; }
function levelOf(xp){ let L=LEVELS[0],i=0; LEVELS.forEach((l,j)=>{ if(xp>=l.xp){L=l;i=j;} }); return {L,i,next:LEVELS[i+1]}; }
function award(key,amount,label){
  if(has(key)) return false;
  const before=levelOf(ST.xp).i;
  ST.k[key]=1; ST.xp+=amount; save(); updateXP(true);
  toast(`${label||'완료'} <b>+${amount} XP</b>`);
  const after=levelOf(ST.xp);
  if(after.i>before) setTimeout(()=>toast(`레벨 업! <b>${after.L.name}</b>`,'level'),400);
  return true;
}
function addXP(amount,label){ if(amount<=0)return; const before=levelOf(ST.xp).i; ST.xp+=amount; save(); updateXP(true); toast(`${label} <b>+${amount} XP</b>`); const a=levelOf(ST.xp); if(a.i>before) setTimeout(()=>toast(`레벨 업! <b>${a.L.name}</b>`,'level'),400); }

/* ---------- UI 공통 ---------- */
function toast(html,cls=''){ const w=$('.toast-wrap'); const t=document.createElement('div'); t.className='toast '+cls; t.innerHTML=html; w.append(t); setTimeout(()=>{t.style.opacity='0';t.style.transition='opacity .3s';},2400); setTimeout(()=>t.remove(),2800); }
window.toast=toast;
function updateXP(bump){
  const {L,next}=levelOf(ST.xp);
  $('.xp-level b').textContent=L.name;
  const pct = next ? (ST.xp-L.xp)/(next.xp-L.xp)*100 : 100;
  $('.xp-fill').style.width=Math.min(100,pct)+'%';
  const n=$('.xp-num'); n.textContent=ST.xp+' XP';
  if(bump){ n.classList.remove('bump'); void n.offsetWidth; n.classList.add('bump'); }
  $('.xp').setAttribute('aria-label',`레벨 ${L.name}, ${ST.xp} XP${next?`, 다음 레벨까지 ${next.xp-ST.xp} XP`:''}`);
}
window.copyText=function(text,btn){
  const done=()=>{ if(btn){ const o=btn.textContent; btn.textContent='복사됨'; btn.classList.add('copied'); setTimeout(()=>{btn.textContent=o;btn.classList.remove('copied');},1400);} };
  if(navigator.clipboard && window.isSecureContext){ navigator.clipboard.writeText(text).then(done,()=>fallback()); } else fallback();
  function fallback(){ const ta=document.createElement('textarea'); ta.value=text; ta.style.position='fixed'; ta.style.opacity='0'; document.body.append(ta); ta.select(); try{document.execCommand('copy');}catch(e){} ta.remove(); done(); }
};
const MAC={Ctrl:'⌘ Cmd',Alt:'⌥ Option',Shift:'⇧ Shift',Delete:'Delete',Backspace:'Delete'};
function applyOS(root=document){
  $$('kbd',root).forEach(k=>{ if(!k.dataset.win) k.dataset.win=k.textContent; const w=k.dataset.win; k.textContent = ST.os==='mac' && MAC[w] ? MAC[w] : w; });
}
function keycaps(str){
  return str.split(' / ').map(alt=> alt.split('+').map(p=>`<kbd>${esc(p)}</kbd>`).join('<span aria-hidden="true">+</span>') ).join('<span class="fine" style="margin:0 4px">또는</span>');
}
function appProgress(a){
  let n=0,tot=a.missions.length+1+a.quiz.length;
  a.missions.forEach((_,i)=>{ if(has(`m:${a.id}:${i}`)) n++; });
  if(has(`s:${a.id}`)) n++;
  a.quiz.forEach((_,i)=>{ if(ST.k[`q:${a.id}:${i}`]!=null) n++; });
  return {n,tot,pct:Math.round(n/tot*100)};
}
const chev='<svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>';

/* ---------- 사이드 내비 ---------- */
function renderNav(route){
  const cur=route.join('/');
  const appItems=APPS.map(a=>{ const p=appProgress(a); return `<li><a href="#/app/${a.id}" ${cur==='app/'+a.id?'aria-current="page"':''}><span class="dot" style="--c:${a.color}"></span>${a.name}${p.pct===100?'<span class="done-tick" aria-label="완료">✓</span>':`<span class="mini">${p.pct}%</span>`}</a></li>`; }).join('');
  const link=(href,n,label)=>`<li><a href="#/${href}" ${cur===href?'aria-current="page"':''}><span class="step">${n}</span>${label}</a></li>`;
  $('.side').innerHTML=`<h2>코스 순서</h2><ul class="nav">
   ${link('','·','처음 화면')}${link('start',1,'시작 준비')}${link('apps',2,'나에게 맞는 앱')}</ul>
   <h2>3. 앱별 실습</h2><ul class="nav">${appItems}</ul>
   <h2>이어서</h2><ul class="nav">${link('claude',4,'Claude와 함께')}${link('recipes',5,'실전 레시피')}${link('games',6,'미니 게임')}${link('cert',7,'수료증')}</ul>
   <h2>참고</h2><ul class="nav">${link('glossary','?','용어 사전')}</ul>`;
}

/* ---------- 페이지: 홈 ---------- */
const LENS={
  all:['원본','<b>완성된 이미지</b>예요. 아래 버튼을 눌러 같은 그림을 각 앱의 눈으로 들여다보세요.'],
  ps:['Photoshop','<b>Photoshop은 레이어로 봐요.</b> 하늘, 해, 산, 글자가 각각 다른 층이라서 하나만 골라 고칠 수 있어요.'],
  ai:['Illustrator','<b>Illustrator는 점과 선으로 봐요.</b> 노란 점(앵커)을 옮기면 모양이 바뀌고, 아무리 키워도 깨지지 않아요.'],
  lr:['Lightroom','<b>Lightroom은 빛과 색으로 봐요.</b> 슬라이더 몇 개로 같은 사진을 노을처럼 따뜻하게 바꿨어요.'],
  ae:['After Effects','<b>After Effects는 시간으로 봐요.</b> 해가 떠오르고 글자가 미끄러져 들어오는 건 키프레임 덕분이에요.']
};
function heroSVG(){
  return `<svg class="scene" viewBox="0 0 560 360" role="img" aria-label="하늘, 해, 산, 호수, 배와 '나의 첫 작품' 글자가 있는 예시 그림">
  <defs><linearGradient id="hs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8DB7F0"/><stop offset="1" stop-color="#F9C9A0"/></linearGradient></defs>
  <g class="lyr lyr-0" style="transform-origin:50% 50%"><rect class="bgsky fillable" width="560" height="360" fill="url(#hs)"/><rect class="plate" x="1" y="1" width="558" height="358"/><text class="lyr-label" x="14" y="350" fill="#fff" font-size="15">레이어 1 – 배경 하늘</text></g>
  <g class="lyr lyr-1" style="transform-origin:50% 50%"><circle class="sun fillable" cx="420" cy="120" r="44" fill="#FFB443"/><rect class="plate" x="1" y="1" width="558" height="358"/><text class="lyr-label" x="14" y="350" fill="#fff" font-size="15">레이어 2 – 해</text></g>
  <g class="lyr lyr-2" style="transform-origin:50% 50%"><path class="fillable" d="M0 260 110 150l70 60 90-100 100 110 60-40 130 70v110H0z" fill="#3C6E5E"/><path class="fillable" d="M0 300l90-40 120 30 130-26 220 36v60H0z" fill="#2B5246"/><rect class="fillable" y="304" width="560" height="56" fill="#5E8FB5"/><path class="boat fillable" d="M360 314h56l-10 14h-36z" fill="#F4EFE6"/><rect class="plate" x="1" y="1" width="558" height="358"/><text class="lyr-label" x="14" y="350" fill="#fff" font-size="15">레이어 3 – 산과 호수</text></g>
  <g class="lyr lyr-3" style="transform-origin:50% 50%"><text class="title fillable" x="40" y="92" font-size="46" font-weight="700" fill="#fff" style="letter-spacing:-1.5px">나의 첫 작품</text><rect class="plate" x="1" y="1" width="558" height="358"/><text class="lyr-label" x="14" y="350" fill="#fff" font-size="15">레이어 4 – 제목</text></g>
  <g class="anchors" fill="#FFC83D" stroke="#1A2BB5" stroke-width="1">${[[110,150],[180,210],[270,110],[370,220],[430,180],[0,260],[560,250],[90,260],[210,290],[340,264],[420,76],[464,120],[420,164],[376,120],[360,314],[416,314],[406,328],[370,328]].map(([x,y])=>`<rect x="${x-4}" y="${y-4}" width="8" height="8"/>`).join('')}</g>
  </svg>`;
}
function pageHome(){
  const doneApps=APPS.filter(a=>appProgress(a).pct===100).length;
  return `<section class="hero">
    <div>
      <h1 class="display">Adobe 앱, 눈으로 보고 손으로 익히기</h1>
      <p class="lede">포토샵부터 프리미어, 아크로뱃까지 9개 앱을 미션 하나씩 따라 하며 배워요. 연습장에서 먼저 손에 익히고, 마지막엔 반복 작업을 Claude에게 맡기는 법까지 익힙니다.</p>
      <div class="btn-row"><a class="btn accent" href="#/start">첫 미션 시작하기</a><a class="btn ghost" href="#/apps">나에게 맞는 앱 찾기</a></div>
      <p class="fine" style="margin-top:18px">진도는 이 브라우저에 자동 저장돼요. 지금 ${ST.xp} XP · 완료한 앱 ${doneApps}/9</p>
    </div>
    <div class="lens">
      <div class="lens-tabs" role="group" aria-label="앱의 눈으로 보기">${Object.entries(LENS).map(([k,v])=>`<button data-lens="${k}" aria-pressed="${k==='all'}" style="--c:${k==='all'?'#7A8296':byId(k).color}"><i></i>${v[0]}</button>`).join('')}</div>
      <div class="lens-stage">${heroSVG()}</div>
      <p class="lens-caption" aria-live="polite">${LENS.all[1]}</p>
    </div>
  </section>
  <h2 class="h-sec">이렇게 진행해요</h2>
  <ol class="path">
    ${[['start','시작 준비','계정, 설치, 메뉴 언어, 생성 크레딧까지 6단계로 준비해요.'],['apps','나에게 맞는 앱','만들고 싶은 것을 고르면 어떤 앱부터 배울지 알려 드려요.'],['app/ps','앱별 실습','앱마다 미션 5개, 연습장 1개, 퀴즈 3개. 체크하며 따라 해요.'],['claude','Claude와 함께','Adobe 커넥터로 반복 작업을 대화로 맡기는 법을 배워요.'],['recipes','실전 레시피','썸네일, 릴스, 포스터, 로고처럼 여러 앱을 엮는 프로젝트.'],['games','미니 게임 · 수료증','단축키 게임으로 복습하고 800 XP를 넘기면 수료증을 받아요.']].map((s,i)=>`<li><span class="n">${i+1}단계</span><h3>${s[1]}</h3><p>${s[2]}</p><a href="#/${s[0]}" aria-label="${s[1]}로 이동"></a></li>`).join('')}
  </ol>
  <h2 class="h-sec">9개 앱 한눈에 <small>카드를 눌러 실습을 시작하세요</small></h2>
  ${appGrid()}
  <div class="note blue" style="margin-top:26px"><b>이 사이트의 모든 메뉴 이름은 한국어판 기준</b>이고, 필요한 곳엔 영어판 이름을 괄호로 함께 적었어요. 오른쪽 위 <b>Win / Mac</b> 버튼으로 단축키 표시를 바꿀 수 있어요.</div>`;
}
function appGrid(){
  return `<div class="apps">${APPS.map(a=>{const p=appProgress(a); return `<a class="app-card" href="#/app/${a.id}" style="--c:${a.color}"><div class="row"><span class="glyph">${a.glyph}</span><div><h3>${a.name}</h3><span class="ko">${a.ko} · ${a.kind}</span></div></div><p>${a.one}</p><div class="meter"><span class="track"><i style="width:${p.pct}%"></i></span>${p.pct}%</div></a>`;}).join('')}</div>`;
}
function bindHome(){
  const svg=$('.scene'), cap=$('.lens-caption');
  $$('[data-lens]').forEach(b=>b.addEventListener('click',()=>{
    $$('[data-lens]').forEach(x=>x.setAttribute('aria-pressed',x===b));
    svg.setAttribute('class','scene '+(b.dataset.lens==='all'?'':b.dataset.lens));
    cap.innerHTML=LENS[b.dataset.lens][1];
  }));
}

/* ---------- 페이지: 시작 준비 ---------- */
function pageStart(){
  return `<h1 class="h-page">시작 준비</h1><p class="lede">앱을 열기 전에 6가지만 준비해요. 하나씩 읽고 체크하면 10 XP씩 받아요.</p>
  <div class="mission" data-open="true" style="--app:var(--accent)"><div class="m-body" style="display:block;padding:18px 18px 8px">
  <ul class="steps">${START.map((s,i)=>`<li class="${has('st:'+i)?'checked':''}"><input type="checkbox" id="st${i}" data-st="${i}" ${has('st:'+i)?'checked disabled':''}><label for="st${i}"><b>${i+1}. ${s.t}</b><br><span class="muted">${s.d}</span></label></li>`).join('')}</ul></div></div>
  <div class="note">무료로 먼저 체험하고 싶다면 <b>Adobe Express</b>와 <b>Firefly</b> 웹부터 시작해 보세요. 설치 없이 브라우저에서 바로 열려요.</div>
  <div class="pager"><a class="next" href="#/apps"><small>다음</small>나에게 맞는 앱 찾기</a></div>`;
}
function bindStart(){
  $$('[data-st]').forEach(c=>c.addEventListener('change',()=>{ if(c.checked){ award('st:'+c.dataset.st,10,'준비 단계 완료'); c.disabled=true; c.closest('li').classList.add('checked'); renderNav(['start']); } }));
}

/* ---------- 페이지: 앱 찾기 ---------- */
function pageApps(){
  return `<h1 class="h-page">나에게 맞는 앱 찾기</h1><p class="lede">무엇을 만들고 싶나요? 하나를 고르면 어떤 앱부터 배우면 좋을지 알려 드려요.</p>
  <div class="finder-opts" role="group" aria-label="만들고 싶은 것">${FINDER.map((f,i)=>`<button class="chip" data-f="${i}" aria-pressed="false" style="--app:var(--accent)">${f.k}</button>`).join('')}</div>
  <div class="finder-res" aria-live="polite"></div>
  <h2 class="h-sec">전체 앱 지도</h2>
  <p class="muted">크게 <b>사진</b>(Photoshop, Lightroom), <b>그래픽</b>(Illustrator, Express), <b>영상</b>(Premiere, After Effects), <b>문서</b>(InDesign, Acrobat), <b>AI 생성</b>(Firefly)으로 나뉘어요.</p>
  ${appGrid()}`;
}
function bindApps(){
  const res=$('.finder-res');
  $$('[data-f]').forEach(b=>b.addEventListener('click',()=>{
    $$('[data-f]').forEach(x=>x.setAttribute('aria-pressed',x===b));
    const f=FINDER[b.dataset.f];
    res.innerHTML=f.a.map((id,i)=>{const a=byId(id); return `<a class="res" href="#/app/${id}" style="--c:${a.color}"><span class="glyph">${a.glyph}</span><div><b>${i===0?'추천':'함께 쓰면 좋아요'} · ${a.name}</b><p>${f.why[id]}</p></div></a>`;}).join('');
  }));
}

/* ---------- 페이지: 앱 상세 ---------- */
function pageApp(id){
  const a=byId(id); if(!a) return pageNotFound();
  const i=APPS.indexOf(a), prev=APPS[i-1], next=APPS[i+1];
  const diff=`<span class="diff" aria-label="난이도 ${a.diff}/3">${[1,2,3].map(n=>`<i class="${n<=a.diff?'on':''}"></i>`).join('')}</span>`;
  const missions=a.missions.map((m,mi)=>{
    const done=has(`m:${id}:${mi}`); const cnt=m.steps.filter((_,si)=>has(`ms:${id}:${mi}:${si}`)).length;
    return `<div class="mission ${done?'done':''}" data-open="${mi===0&&!done?'true':'false'}" data-m="${mi}">
      <button aria-expanded="${mi===0&&!done}"><span class="m-num">${done?'✓':mi+1}</span><span><span class="m-title">${m.t}</span><span class="m-goal">${m.g}</span></span><span class="m-meta"><span class="m-count">${cnt}/${m.steps.length}</span>${chev}</span></button>
      <div class="m-body"><ul class="steps">${m.steps.map((s,si)=>{const c=has(`ms:${id}:${mi}:${si}`); return `<li class="${c?'checked':''}"><input type="checkbox" id="c${mi}_${si}" data-s="${si}" ${c?'checked':''}><label for="c${mi}_${si}">${s}</label></li>`;}).join('')}</ul>
      <div class="tip">${m.tip}</div></div></div>`;
  }).join('');
  const news=a.news.map(n=>`<li><b>${n[0]}${n[2]==='beta'?'<span class="badge beta">베타</span>':n[2]?`<span class="badge">${n[2]} 신기능</span>`:''}</b>${n[1]}</li>`).join('');
  const prompts=a.claude.map(p=>promptCard(p[0],p[1],a)).join('');
  const quiz=a.quiz.map((q,qi)=>{ const ans=ST.k[`q:${id}:${qi}`]; const answered=ans!=null; const picked=ST.k[`qa:${id}:${qi}`];
    return `<div class="quiz ${answered?'answered':''}" data-q="${qi}"><h4>Q${qi+1}. ${q.q}</h4><div class="opts">${q.o.map((o,oi)=>`<button class="opt ${answered&&oi===q.c?'right':''} ${answered&&oi===picked&&oi!==q.c?'wrong':''}" data-o="${oi}" ${answered?'disabled':''}>${o}</button>`).join('')}</div><p class="why">${q.why}</p></div>`; }).join('');
  return `<div style="--app:${a.color}">
  <header class="app-head" style="--c:${a.color}"><span class="glyph">${a.glyph}</span><div><h1>${a.name}</h1><p class="sub">${a.ko} — ${a.one}</p></div></header>
  <dl class="facts"><div class="fact"><dt>무엇을 하나요</dt><dd>${a.kind}</dd></div><div class="fact"><dt>어디서 쓰나요</dt><dd>${a.where}</dd></div><div class="fact"><dt>난이도</dt><dd>${diff} ${['','쉬움','보통','도전'][a.diff]}</dd></div></dl>
  <ul class="tags" aria-label="이런 걸 만들어요">${a.goodFor.map(g=>`<li>${g}</li>`).join('')}</ul>
  <nav class="jump" aria-label="이 페이지 안 바로가기"><a href="#m-sec" data-jump>미션 5개</a><a href="#s-sec" data-jump>연습장</a><a href="#k-sec" data-jump>단축키</a><a href="#n-sec" data-jump>새 기능</a><a href="#c-sec" data-jump>Claude에게 맡기기</a><a href="#q-sec" data-jump>확인 퀴즈</a></nav>
  <h2 class="h-sec" id="m-sec">따라 하기 미션 <small>단계를 모두 체크하면 미션당 20 XP</small></h2>
  ${missions}
  <h2 class="h-sec" id="s-sec">연습장 <small>앱이 없어도 여기서 먼저 손에 익혀요 · 클리어 40 XP</small></h2>
  <div id="simHost"></div>
  <h2 class="h-sec" id="k-sec">꼭 외울 단축키</h2>
  <div class="keys">${a.keys.map(k=>`<div><span>${k[0]}</span><span class="combo">${keycaps(k[1])}</span></div>`).join('')}</div>
  <p class="fine">Mac에서는 Ctrl 대신 ⌘ Cmd, Alt 대신 ⌥ Option을 눌러요. 오른쪽 위 Win/Mac 버튼으로 표시를 바꿀 수 있어요.</p>
  <h2 class="h-sec" id="n-sec">요즘 새로 생긴 기능 <small>메뉴 위치는 버전·플랜에 따라 달라요</small></h2>
  <ul class="news">${news}</ul>
  <h2 class="h-sec" id="c-sec">Claude에게 이렇게 맡겨 보세요 <small>Adobe 커넥터 연결 후</small></h2>
  <div class="prompts">${prompts}</div>
  <p class="fine">커넥터 연결 방법은 <a href="#/claude">Claude와 함께</a> 페이지에 있어요.</p>
  <h2 class="h-sec" id="q-sec">확인 퀴즈 <small>정답마다 10 XP</small></h2>
  ${quiz}
  <div class="pager">${prev?`<a href="#/app/${prev.id}"><small>이전 앱</small>${prev.name}</a>`:'<span></span>'}${next?`<a class="next" href="#/app/${next.id}"><small>다음 앱</small>${next.name}</a>`:`<a class="next" href="#/claude"><small>다음</small>Claude와 함께</a>`}</div>
  </div>`;
}
function promptCard(text,tool,a){
  return `<div class="prompt">${a?`<span class="app-pill" style="--c:${a.color};align-self:flex-start">${a.name}</span>`:''}<q>“${esc(text)}”</q><div class="foot"><span class="tool">${esc(tool)}</span><button class="copy" data-copy="${esc(text)}">복사</button></div></div>`;
}
function bindApp(id){
  const a=byId(id); if(!a) return;
  $$('.mission').forEach(m=>{
    const mi=+m.dataset.m;
    $('button',m).addEventListener('click',()=>{ const o=m.dataset.open!=='true'; m.dataset.open=o; $('button',m).setAttribute('aria-expanded',o); });
    $$('input',m).forEach(c=>c.addEventListener('change',()=>{
      const k=`ms:${id}:${mi}:${c.dataset.s}`; if(c.checked) ST.k[k]=1; else delete ST.k[k]; save();
      c.closest('li').classList.toggle('checked',c.checked);
      const all=$$('input',m).every(x=>x.checked); $('.m-count',m).textContent=`${$$('input',m).filter(x=>x.checked).length}/${a.missions[mi].steps.length}`;
      if(all && award(`m:${id}:${mi}`,20,`미션 “${a.missions[mi].t}” 완료`)){
        m.classList.add('done'); $('.m-num',m).textContent='✓';
        setTimeout(()=>{ m.dataset.open='false'; const nx=m.nextElementSibling; if(nx&&nx.classList.contains('mission')&&!nx.classList.contains('done')){ nx.dataset.open='true'; nx.scrollIntoView({behavior:'smooth',block:'nearest'}); } },600);
        renderNav(['app',id]);
      }
    }));
  });
  window.SIMS[a.sim]($('#simHost'),{cleared:has('s:'+id), toast, onClear:()=>{ award('s:'+id,40,'연습장 클리어'); renderNav(['app',id]); }});
  $$('.quiz').forEach(q=>{ const qi=+q.dataset.q;
    $$('.opt',q).forEach(b=>b.addEventListener('click',()=>{
      const oi=+b.dataset.o, ok=oi===a.quiz[qi].c;
      ST.k[`q:${id}:${qi}`]=ok?1:0; ST.k[`qa:${id}:${qi}`]=oi; save();
      $$('.opt',q).forEach((x,xi)=>{ x.disabled=true; if(xi===a.quiz[qi].c)x.classList.add('right'); });
      if(!ok) b.classList.add('wrong');
      q.classList.add('answered');
      if(ok) addXP(10,'정답!'); else toast('아쉬워요. 해설을 읽어 보세요');
      renderNav(['app',id]);
    }));
  });
}

/* ---------- 페이지: Claude와 함께 ---------- */
function pageClaude(){
  const all=[]; APPS.forEach(a=>a.claude.forEach(p=>all.push([p[0],p[1],a])));
  return `<h1 class="h-page">Claude와 함께 쓰기</h1>
  <p class="lede">Adobe 커넥터를 연결하면 Claude 대화창에서 말로 Adobe 도구를 부릴 수 있어요. 사진 수십 장 보정, PDF 합치기, 크기 바꾸기처럼 반복되는 일을 맡기고, 창의적인 마무리는 앱에서 직접 하는 방식이 가장 효율적이에요.</p>
  <h2 class="h-sec">연결하는 순서</h2>
  <ol class="flow">
    <li><span class="n">1</span><b>커넥터 찾기</b>Claude의 커넥터 목록에서 <b>Adobe</b>를 찾아요. Claude에게 “Adobe 연결해 줘”라고 말해도 연결 카드를 띄워 줘요.</li>
    <li><span class="n">2</span><b>로그인·허용</b>연결 버튼을 누르고 Adobe 계정으로 로그인한 뒤 권한을 허용해요.</li>
    <li><span class="n">3</span><b>파일 + 한 문장</b>파일을 첨부하고 하고 싶은 일을 평소 말투로 적어요.</li>
    <li><span class="n">4</span><b>이어서 다듬기</b>대화 안의 편집 화면으로 직접 고치거나, Express·Photoshop 등 앱에서 열어 마무리해요.</li>
  </ol>
  <div class="note">Adobe 계정이 필요하고, 일부 기능은 유료 플랜이나 생성 크레딧이 필요할 수 있어요. 커넥터는 Adobe의 클라우드 도구를 쓰는 방식이라 <b>내 컴퓨터에 설치된 Photoshop을 직접 조종하지는 않아요.</b> Adobe는 데스크톱 앱과 AI를 직접 잇는 연동을 2027년 초에 내놓겠다고 예고했어요.</div>
  <h2 class="h-sec">대화로 해 보기 <small>요청을 고르면 Claude가 어떤 도구를 차례로 쓰는지 보여 드려요</small></h2>
  <div class="pipe"><div class="pipe-req" role="group" aria-label="예시 요청">${PIPES.map((p,i)=>`<button data-p="${i}" aria-pressed="${i===0}">${p.k}</button>`).join('')}</div><div class="chat" aria-live="polite"></div></div>
  <h2 class="h-sec">Claude가 할 수 있는 일</h2>
  <table class="cap-table"><thead><tr><th>Adobe 영역</th><th>대화로 맡길 수 있는 작업</th></tr></thead><tbody>${CAPS.map(c=>`<tr><td>${c[0]}</td><td>${c[1]}</td></tr>`).join('')}</tbody></table>
  <p class="fine">2026년 11월 기준 커넥터에 들어 있는 도구를 정리했어요. 도구는 계속 늘어나요.</p>
  <h2 class="h-sec">잘 맡기는 요청 공식</h2>
  <div class="panel"><p style="margin-top:0"><b>무엇을</b>(파일) + <b>어떻게</b>(작업) + <b>어디에 쓸지</b>(크기·용도) + <b>결과 형식</b>(PNG, PDF…)</p>
  <div class="prompts" style="margin-top:0"><div class="prompt" style="border-color:var(--bad)"><span class="fine" style="color:var(--bad)">아쉬운 요청</span><q>“사진 예쁘게 해 줘.”</q></div><div class="prompt" style="border-color:var(--ok)"><span class="fine" style="color:var(--ok)">좋은 요청</span><q>“첨부한 단체 사진 5장을 자동 톤 보정하고 수평 맞춘 뒤, 인스타 세로 게시물(1080×1350) 크기로 잘라 JPG로 줘.”</q></div></div></div>
  <h2 class="h-sec">요청 모음 <small>복사해서 바로 써 보세요</small></h2>
  <div class="filter-row" role="group" aria-label="앱으로 거르기"><button class="chip" data-fl="all" aria-pressed="true" style="--app:var(--ink)">전체</button>${APPS.filter(a=>a.claude.length).map(a=>`<button class="chip" data-fl="${a.id}" aria-pressed="false" style="--app:${a.color}">${a.name}</button>`).join('')}</div>
  <div class="prompts" id="plist">${all.map(p=>`<div data-app="${p[2].id}">${promptCard(p[0],p[1],p[2])}</div>`).join('')}</div>
  <div class="pager"><a href="#/app/ff"><small>이전</small>Firefly</a><a class="next" href="#/recipes"><small>다음</small>실전 레시피</a></div>`;
}
let pipeTimers=[];
function runPipe(i){
  pipeTimers.forEach(clearTimeout); pipeTimers=[];
  const p=PIPES[i], chat=$('.chat');
  chat.innerHTML=`<div class="bubble me">${esc(p.me)}</div>${p.steps.map(s=>`<div class="tool-step"><span class="ck"></span>${s[0]} <code>${s[1]}</code></div>`).join('')}<div class="bubble ai" style="display:none">${esc(p.ai)}</div>`;
  const steps=$$('.tool-step',chat), reduce=matchMedia('(prefers-reduced-motion: reduce)').matches, gap=reduce?0:550;
  steps.forEach((s,j)=>{ pipeTimers.push(setTimeout(()=>s.classList.add('show'),gap*(j+1))); pipeTimers.push(setTimeout(()=>s.classList.add('ok'),gap*(j+1)+(reduce?0:380))); });
  pipeTimers.push(setTimeout(()=>{ $('.bubble.ai',chat).style.display='block'; },gap*(steps.length+1)+200));
}
function bindClaude(){
  $$('[data-p]').forEach(b=>b.addEventListener('click',()=>{ $$('[data-p]').forEach(x=>x.setAttribute('aria-pressed',x===b)); runPipe(+b.dataset.p); }));
  runPipe(0);
  $$('[data-fl]').forEach(b=>b.addEventListener('click',()=>{ $$('[data-fl]').forEach(x=>x.setAttribute('aria-pressed',x===b)); const f=b.dataset.fl; $$('#plist > div').forEach(d=>d.style.display=f==='all'||d.dataset.app===f?'':'none'); }));
}

/* ---------- 페이지: 레시피 ---------- */
function pageRecipes(){
  return `<h1 class="h-page">실전 레시피</h1><p class="lede">실제 작업은 앱 하나로 끝나지 않아요. 여러 앱을 엮어 결과물을 만드는 6가지 프로젝트를 따라 해 보세요. 단계마다 5 XP.</p>
  ${RECIPES.map((r,ri)=>`<article class="recipe"><div class="recipe-head"><h3>${r.t}</h3><span class="apps-used">${r.apps.map(id=>`<span class="app-pill" style="--c:${byId(id).color}">${byId(id).name}</span>`).join('')}<span class="fine">약 ${r.time}</span></span></div>
   <ol class="r-steps steps">${r.steps.map((s,si)=>{const c=has(`r:${ri}:${si}`); const a=byId(s[0]); return `<li class="${c?'checked':''}"><input type="checkbox" id="r${ri}_${si}" data-r="${ri}" data-s="${si}" ${c?'checked disabled':''}><label for="r${ri}_${si}"><span class="app-pill" style="--c:${a.color};margin-right:6px">${a.name}</span>${s[1]}${s[2]?`<span class="claude-line">Claude에게 맡기기: ${s[2]}</span>`:''}</label></li>`;}).join('')}</ol></article>`).join('')}
  <div class="pager"><a href="#/claude"><small>이전</small>Claude와 함께</a><a class="next" href="#/games"><small>다음</small>미니 게임</a></div>`;
}
function bindRecipes(){
  $$('[data-r]').forEach(c=>c.addEventListener('change',()=>{ if(!c.checked)return; award(`r:${c.dataset.r}:${c.dataset.s}`,5,'레시피 단계'); c.disabled=true; c.closest('li').classList.add('checked'); }));
}

/* ---------- 페이지: 게임 ---------- */
function pageGames(){
  return `<h1 class="h-page">미니 게임</h1><p class="lede">배운 걸 놀이로 복습해요. 단축키 게임은 최고 기록을 넘길 때마다 늘어난 점수만큼 XP를 받아요.</p>
  <section class="game"><h2 style="font-size:20px">단축키 챌린지 <small class="fine" style="font-weight:400">40초 동안 몇 개나?</small></h2>
   <p class="muted" style="margin:6px 0 0">도구 이름을 보고 키보드로 단축키를 누르거나, 아래 키캡을 눌러요.</p>
   <div class="filter-row" role="group" aria-label="앱 고르기">${Object.keys(KEYGAME).map((k,i)=>`<button class="chip" data-kg="${k}" aria-pressed="${i===0}" style="--app:${byId(k).color}">${byId(k).name}</button>`).join('')}</div>
   <div class="kq" aria-live="polite"><div class="task">준비됐나요?</div><div class="hint">시작을 누르면 40초가 흘러가요</div><div class="timer"><i></i></div><div class="choices"></div><div class="stat"><span>점수 <b class="sc">0</b></span><span>최고 <b class="best">0</b></span></div><button class="btn accent kstart">시작</button></div>
  </section>
  <section class="game"><h2 style="font-size:20px">이 작업엔 어떤 앱?</h2>
   <p class="muted" style="margin:6px 0 0">상황을 읽고 가장 알맞은 앱을 골라요. 처음 맞힌 문제마다 5 XP.</p>
   <div class="scen-wrap"></div>
  </section>
  <div class="pager"><a href="#/recipes"><small>이전</small>실전 레시피</a><a class="next" href="#/cert"><small>다음</small>수료증</a></div>`;
}
let kgState=null;
function bindGames(){
  let app='ps';
  const kq=$('.kq'), task=$('.task',kq), hint=$('.hint',kq), ch=$('.choices',kq), sc=$('.sc',kq), best=$('.best',kq), timer=$('.timer i',kq), startB=$('.kstart',kq);
  const showBest=()=>best.textContent=ST.k['kg:'+app]||0;
  showBest();
  $$('[data-kg]').forEach(b=>b.addEventListener('click',()=>{ if(kgState)return; app=b.dataset.kg; $$('[data-kg]').forEach(x=>x.setAttribute('aria-pressed',x===b)); showBest(); }));
  function next(){
    const list=KEYGAME[app]; const q=list[Math.floor(Math.random()*list.length)];
    kgState.q=q; task.textContent=q[0]; hint.textContent=`${byId(app).name}`;
    const keys=[...new Set(list.map(x=>x[1]))].filter(k=>k!==q[1]).sort(()=>Math.random()-.5).slice(0,3);
    ch.innerHTML=[q[1],...keys].sort(()=>Math.random()-.5).map(k=>`<button data-k="${k}">${k}</button>`).join('');
    applyOS(kq);
  }
  function answer(k){
    if(!kgState)return; const ok=k===kgState.q[1];
    kq.classList.remove('flash-ok','flash-bad'); void kq.offsetWidth; kq.classList.add(ok?'flash-ok':'flash-bad');
    if(ok){ kgState.score++; sc.textContent=kgState.score; next(); } else hint.textContent=`정답은 ${kgState.q[1]}`;
  }
  ch.addEventListener('click',e=>{ const b=e.target.closest('button'); if(b) answer(b.dataset.k); });
  function onKey(e){
    if(!kgState||e.ctrlKey||e.metaKey||e.altKey)return;
    if(['Shift','Control','Alt','Meta','Tab','Escape'].includes(e.key))return;
    if(e.key.length!==1)return;
    e.preventDefault();
    answer((e.shiftKey?'Shift+':'')+e.key.toUpperCase());
  }
  startB.addEventListener('click',()=>{
    kgState={score:0,q:null,end:performance.now()+40000}; sc.textContent=0; startB.style.display='none';
    document.addEventListener('keydown',onKey); next();
    const tick=()=>{ if(!kgState)return; const left=kgState.end-performance.now(); timer.style.width=Math.max(0,left/40000*100)+'%';
      if(left<=0){ const s=kgState.score, prev=ST.k['kg:'+app]||0; kgState=null; document.removeEventListener('keydown',onKey);
        task.textContent=`끝! ${s}개 성공`; ch.innerHTML=''; startB.style.display=''; startB.textContent='다시 하기';
        if(s>prev){ ST.k['kg:'+app]=s; save(); hint.textContent='새 최고 기록!'; addXP((s-prev)*3,'최고 기록 갱신'); } else hint.textContent=`최고 기록 ${prev}개에 도전해 보세요`;
        showBest(); return; }
      requestAnimationFrame(tick); }; requestAnimationFrame(tick);
  });
  // 시나리오 게임
  const wrap=$('.scen-wrap'); const order=SCENARIOS.map((_,i)=>i).sort(()=>Math.random()-.5); let pos=0;
  function scen(){
    if(pos>=order.length){ const n=SCENARIOS.filter((_,i)=>has('sc:'+i)).length; wrap.innerHTML=`<p class="scenario">${n}/${SCENARIOS.length}문제를 맞혔어요.</p><button class="btn ghost sm sc-re">다시 풀기</button>`; $('.sc-re',wrap).onclick=()=>{pos=0; order.sort(()=>Math.random()-.5); scen();}; return; }
    const i=order[pos], s=SCENARIOS[i];
    wrap.innerHTML=`<p class="fine" style="margin:14px 0 0">${pos+1} / ${SCENARIOS.length}</p><p class="scenario">${s[0]}</p><div class="scen-opts">${APPS.map(a=>`<button class="chip" data-a="${a.id}" style="--app:${a.color}">${a.name}</button>`).join('')}</div><p class="scen-fb fine" aria-live="polite" style="min-height:24px"></p>`;
    $$('[data-a]',wrap).forEach(b=>b.addEventListener('click',()=>{
      const ok=b.dataset.a===s[1]; $$('[data-a]',wrap).forEach(x=>x.disabled=true);
      b.setAttribute('aria-pressed','true'); if(!ok){ const r=$(`[data-a=${s[1]}]`,wrap); r.setAttribute('aria-pressed','true'); r.style.outline='2px solid var(--ok)'; b.style.background='var(--bad)'; b.style.borderColor='var(--bad)'; }
      $('.scen-fb',wrap).innerHTML = ok?`정답! ${byId(s[1]).name} — ${byId(s[1]).kind}`:`정답은 <b>${byId(s[1]).name}</b>이에요. ${byId(s[1]).one}`;
      if(ok) award('sc:'+i,5,'정답');
      setTimeout(()=>{pos++; scen();}, ok?1100:2600);
    }));
  }
  scen();
}

/* ---------- 페이지: 용어 사전 ---------- */
function pageGlossary(){
  return `<h1 class="h-page">용어 사전</h1><p class="lede">강좌를 보다가 모르는 말이 나오면 여기서 찾아보세요.</p>
  <input type="search" id="gq" placeholder="예: 레이어, 도련, 키프레임" aria-label="용어 검색" style="max-width:420px;height:44px;font-size:16px">
  <div class="filter-row" role="group" aria-label="앱으로 거르기"><button class="chip" data-g="all" aria-pressed="true" style="--app:var(--ink)">전체</button>${APPS.map(a=>`<button class="chip" data-g="${a.id}" aria-pressed="false" style="--app:${a.color}">${a.name}</button>`).join('')}</div>
  <div class="gloss">${GLOSSARY.map(g=>`<div class="term" data-app="${g[3]}" data-txt="${esc((g[0]+g[1]+g[2]).toLowerCase())}"><h3>${g[0]} <span>${g[1]}</span></h3><p>${g[2]}</p></div>`).join('')}</div>
  <p class="gl-empty muted" style="display:none">찾는 용어가 없어요. 다른 낱말로 검색해 보세요.</p>`;
}
function bindGlossary(){
  let f='all'; const q=$('#gq');
  const run=()=>{ const s=q.value.trim().toLowerCase(); let n=0; $$('.term').forEach(t=>{ const show=(f==='all'||t.dataset.app===f)&&(!s||t.dataset.txt.includes(s)); t.style.display=show?'':'none'; if(show)n++; }); $('.gl-empty').style.display=n?'none':''; };
  q.addEventListener('input',run);
  $$('[data-g]').forEach(b=>b.addEventListener('click',()=>{ f=b.dataset.g; $$('[data-g]').forEach(x=>x.setAttribute('aria-pressed',x===b)); run(); }));
}

/* ---------- 페이지: 수료증 ---------- */
const CERT_XP=800;
function pageCert(){
  const ok=ST.xp>=CERT_XP, doneApps=APPS.filter(a=>appProgress(a).pct===100);
  const today=new Date(); const d=`${today.getFullYear()}년 ${today.getMonth()+1}월 ${today.getDate()}일`;
  return `<h1 class="h-page">수료증</h1>
  <p class="lede no-print">${ok?'축하해요! 이름을 입력하고 인쇄하거나 PDF로 저장하세요.':`${CERT_XP} XP를 모으면 수료증이 열려요. 지금 ${ST.xp} XP, ${CERT_XP-ST.xp} XP 남았어요.`}</p>
  <div class="no-print" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;max-width:560px"><input type="text" id="cname" placeholder="수료증에 들어갈 이름" value="${esc(ST.name)}" aria-label="이름" style="flex:1;min-width:200px;height:44px;font-size:16px"><button class="btn" id="cprint" ${ok?'':'disabled'}>인쇄 / PDF로 저장</button></div>
  <div class="cert ${ok?'':'locked'}">
    <div class="stripe">${APPS.map(a=>`<i style="--c:${a.color}"></i>`).join('')}</div>
    <h2>Adobe 앱 첫걸음 수료증</h2>
    <div class="who">${esc(ST.name)||'이름'}</div>
    <p>위 사람은 Adobe 앱 9종의 기본 미션과 연습장, Claude와의 협업 과정을 성실히 익혔기에 이 증서를 드립니다.</p>
    <div class="meta"><span><b>${ST.xp}</b>획득 XP</span><span><b>${doneApps.length}/9</b>완주한 앱</span><span><b>${levelOf(ST.xp).L.name}</b>레벨</span></div>
    <p class="fine" style="margin-top:26px">${d} · Adobe 작업실</p>
  </div>
  <div class="panel no-print"><h3>앱별 진도</h3>${APPS.map(a=>{const p=appProgress(a); return `<div class="meter" style="--c:${a.color};margin:8px 0"><a href="#/app/${a.id}" style="width:120px;color:var(--ink);text-decoration:none">${a.name}</a><span class="track"><i style="width:${p.pct}%"></i></span>${p.pct}%</div>`;}).join('')}
  <p class="fine" style="margin-top:16px">진도는 이 브라우저에만 저장돼요. <button class="copy" id="reset">진도 모두 지우기</button></p></div>`;
}
function bindCert(){
  const n=$('#cname'); n.addEventListener('input',()=>{ ST.name=n.value.slice(0,24); save(); $('.who').textContent=ST.name||'이름'; });
  $('#cprint').addEventListener('click',()=>window.print());
  $('#reset').addEventListener('click',()=>{ if(confirmReset()){ ST={k:{},xp:0,name:'',os:ST.os}; save(); updateXP(); route(); } });
}
function confirmReset(){ const b=$('#reset'); if(b.dataset.armed){ return true; } b.dataset.armed='1'; b.textContent='한 번 더 누르면 지워져요'; setTimeout(()=>{ if(b.isConnected){ delete b.dataset.armed; b.textContent='진도 모두 지우기'; } },3000); return false; }

function pageNotFound(){ return `<h1 class="h-page">페이지를 찾을 수 없어요</h1><p class="lede">주소가 바뀌었을 수 있어요. 처음 화면에서 다시 시작해 보세요.</p><a class="btn" href="#/">처음 화면으로</a>`; }

/* ---------- 라우터 ---------- */
function route(){
  const parts=(location.hash.replace(/^#\/?/,'')||'').split('/').filter(Boolean);
  const [p,arg]=parts;
  const main=$('main .page');
  const pages={
    '':[pageHome,bindHome,'처음 화면'], start:[pageStart,bindStart,'시작 준비'], apps:[pageApps,bindApps,'나에게 맞는 앱'],
    claude:[pageClaude,bindClaude,'Claude와 함께'], recipes:[pageRecipes,bindRecipes,'실전 레시피'], games:[pageGames,bindGames,'미니 게임'],
    glossary:[pageGlossary,bindGlossary,'용어 사전'], cert:[pageCert,bindCert,'수료증']
  };
  if(kgState){ kgState=null; }
  pipeTimers.forEach(clearTimeout);
  const FOOT=`<footer class="foot">Adobe, Photoshop, Illustrator, Lightroom, Premiere, After Effects, InDesign, Acrobat, Adobe Express, Firefly는 Adobe Inc.의 상표입니다. 이 사이트는 Adobe와 관계없는 비공식 학습 자료이며, 메뉴 위치와 기능은 버전·플랜에 따라 다를 수 있어요. · 다인에듀 후안샘</footer>`;
  if(p==='app'){ main.innerHTML=pageApp(arg)+FOOT; bindApp(arg); document.title=`${byId(arg)?.name||''} 실습 | Adobe 작업실`; }
  else if(pages[p||'']){ const [r,b,t]=pages[p||'']; main.innerHTML=r()+FOOT; b(); document.title=`${t} | Adobe 작업실`; }
  else { main.innerHTML=pageNotFound()+FOOT; }
  renderNav(parts.length?parts:['']);
  applyOS(main);
  $$('[data-copy]',main).forEach(b=>b.addEventListener('click',()=>window.copyText(b.dataset.copy,b)));
  $$('[data-jump]',main).forEach(a=>a.addEventListener('click',e=>{ e.preventDefault(); const t=document.getElementById(a.getAttribute('href').slice(1)); if(t) t.scrollIntoView({behavior:'smooth'}); }));
  document.body.classList.remove('nav-open');
  window.scrollTo(0,0);
  document.getElementById('main').focus({preventScroll:true});
}

/* ---------- 시작 ---------- */
function init(){
  updateXP();
  $$('.os-toggle button').forEach(b=>{ b.setAttribute('aria-pressed',b.dataset.os===ST.os); b.addEventListener('click',()=>{ ST.os=b.dataset.os; save(); $$('.os-toggle button').forEach(x=>x.setAttribute('aria-pressed',x===b)); applyOS(); }); });
  $('.menu-btn').addEventListener('click',()=>{ const o=document.body.classList.toggle('nav-open'); $('.menu-btn').setAttribute('aria-expanded',o); });
  window.addEventListener('hashchange',route);
  route();
}
document.addEventListener('DOMContentLoaded',init);
})();
