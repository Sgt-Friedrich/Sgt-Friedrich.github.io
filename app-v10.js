const ASSET_VERSION='20260716-10';
const sectionIds=['home','education','internship','projects','awards'];
let lang;
try{lang=localStorage.getItem('portfolio-language')}catch(e){}
lang=lang||(navigator.language.toLowerCase().startsWith('zh')?'zh':'en');

async function loadSite(){
  const stage=document.getElementById('stage');
  const sections=await Promise.all(sectionIds.map(async id=>{
    const response=await fetch(`sections/${id}.html?v=${ASSET_VERSION}`,{cache:'no-store'});
    if(!response.ok)throw new Error(`Failed to load ${id}: ${response.status}`);
    return response.text();
  }));
  stage.innerHTML=sections.join('');
  initSite();
}

function initSite(){
  const chapters=[...document.querySelectorAll('.chapter')];
  const majorButtons=[...document.querySelectorAll('[data-major]')];
  const dots=[...document.querySelectorAll('.major-dot')];
  const chapterLabels={
    education:{zh:'01 / 教育',en:'01 / EDUCATION'},
    internship:{zh:'02 / 实习',en:'02 / INTERNSHIP'},
    projects:{zh:'03 / 项目',en:'03 / PROJECTS'},
    awards:{zh:'04 / 奖项',en:'04 / AWARDS'}
  };
  Object.entries(chapterLabels).forEach(([id,copy])=>{
    const label=document.querySelector(`#${id} .chapter-label`);
    if(label){label.dataset.zh=copy.zh;label.dataset.en=copy.en;}
  });

  let major=0;
  let transitioning=false;
  let wheelSum=0;
  let wheelTimer;
  let touchStart=null;
  let subWheelLocked=false;
  let subWheelSum=0;
  let subWheelTimer;
  let resizeTimer;

  function setLang(next){
    lang=next;
    document.documentElement.lang=lang==='zh'?'zh-CN':'en';
    document.title=lang==='zh'?'曾逸帆 — Silicon to Intelligence':'Yifan Zeng — Silicon to Intelligence';
    document.querySelectorAll('[data-zh]').forEach(el=>el.textContent=el.dataset[lang]);
    document.querySelectorAll('[data-zh-html]').forEach(el=>el.innerHTML=el.dataset[lang+'Html']);
    const button=document.getElementById('lang');
    button.textContent=lang==='zh'?'EN':'中文';
    button.setAttribute('aria-label',lang==='zh'?'Switch to English':'切换到中文');
    try{localStorage.setItem('portfolio-language',lang)}catch(e){}
    requestAnimationFrame(()=>fitChapter(chapters[major]));
  }

  function updateMajorUI(){
    dots.forEach((dot,index)=>dot.classList.toggle('active',index===major));
    document.querySelectorAll('.primary-nav [data-major]').forEach(button=>button.classList.toggle('active',Number(button.dataset.major)===major));
    history.replaceState(null,'','#'+chapters[major].id);
  }

  function fitChapter(chapter){
    if(!chapter)return;
    const scroller=chapter.querySelector('.chapter-scroll');
    const inner=chapter.querySelector('.chapter-inner');
    chapter.classList.remove('compact-height','fit-height');
    scroller.style.overflowY='';
    if(window.innerWidth<=900)return;
    requestAnimationFrame(()=>{
      let excess=inner.scrollHeight-scroller.clientHeight;
      if(excess>0&&excess<260)chapter.classList.add('compact-height');
      requestAnimationFrame(()=>{
        excess=inner.scrollHeight-scroller.clientHeight;
        if(excess<=4)chapter.classList.add('fit-height');
      });
    });
  }

  function switchChapter(next){
    chapters[major].classList.remove('active');
    major=next;
    chapters[major].classList.add('active');
    chapters[major].querySelector('.chapter-scroll').scrollTop=0;
    updateMajorUI();
    fitChapter(chapters[major]);
  }

  function isVisibleRect(rect){
    return rect.width>1&&rect.height>1&&rect.bottom>0&&rect.right>0&&rect.top<window.innerHeight&&rect.left<window.innerWidth;
  }

  function transitionAnchor(chapter,direction){
    const forward=direction==='forward';
    const selectorMap={
      home:'.to-o',
      education:forward?'.edu-block:nth-child(2)':'.edu-block:first-child',
      internship:forward?'.pipeline div:last-child':'.pipeline div:first-child',
      projects:'.subnav button.active',
      awards:'.podium:nth-child(2)'
    };
    const kindMap={home:'circle',education:'card',internship:'cell',projects:'tab',awards:'podium'};
    let anchor=chapter.querySelector(selectorMap[chapter.id]);
    if(anchor&&!isVisibleRect(anchor.getBoundingClientRect()))anchor=null;
    if(!anchor){
      anchor=chapter.querySelector('.bottom-gate .gate-arrow')||chapter.querySelector('.chapter-title');
      return {anchor,kind:'fallback'};
    }
    return {anchor,kind:kindMap[chapter.id]||'fallback'};
  }

  function transparent(color){
    return !color||color==='transparent'||/rgba\([^)]*,\s*0(?:\.0+)?\)$/.test(color);
  }

  function transitionColor(chapter,anchor,kind){
    const style=getComputedStyle(anchor);
    const accent=getComputedStyle(document.documentElement).getPropertyValue('--accent-block').trim()||getComputedStyle(document.documentElement).getPropertyValue('--red').trim()||'#b8562f';
    if(kind==='circle'||kind==='podium')return accent;
    if(!transparent(style.backgroundColor))return style.backgroundColor;
    if(kind==='cell')return getComputedStyle(chapter).backgroundColor;
    return accent;
  }

  function rectClip(rect,round=0){
    return `inset(${Math.max(0,rect.top)}px ${Math.max(0,window.innerWidth-rect.right)}px ${Math.max(0,window.innerHeight-rect.bottom)}px ${Math.max(0,rect.left)}px round ${round}px)`;
  }

  function phaseClips(kind,rect){
    const full='inset(0px 0px 0px 0px round 0px)';
    const start=rectClip(rect,0);
    const horizontal=`inset(${Math.max(0,rect.top)}px 0px ${Math.max(0,window.innerHeight-rect.bottom)}px 0px round 0px)`;
    const vertical=`inset(0px ${Math.max(0,window.innerWidth-rect.right)}px 0px ${Math.max(0,rect.left)}px round 0px)`;
    if(kind==='card')return {enter:[{clipPath:start},{clipPath:horizontal,offset:.38},{clipPath:full}],exit:[{clipPath:full},{clipPath:'inset(0 0 100% 0 round 0px)'}]};
    if(kind==='cell')return {enter:[{clipPath:start},{clipPath:horizontal,offset:.52},{clipPath:full}],exit:[{clipPath:full},{clipPath:horizontal,offset:.56},{clipPath:`inset(${Math.max(0,rect.top)}px 100% ${Math.max(0,window.innerHeight-rect.bottom)}px 0 round 0px)`}]};
    if(kind==='tab')return {enter:[{clipPath:start},{clipPath:vertical,offset:.46},{clipPath:full}],exit:[{clipPath:full},{clipPath:vertical,offset:.54},{clipPath:`inset(100% ${Math.max(0,window.innerWidth-rect.right)}px 0 ${Math.max(0,rect.left)}px round 0px)`}]};
    if(kind==='podium')return {enter:[{clipPath:start},{clipPath:vertical,offset:.5},{clipPath:full}],exit:[{clipPath:full},{clipPath:vertical,offset:.52},{clipPath:`inset(0 ${Math.max(0,window.innerWidth-rect.right)}px 100% ${Math.max(0,rect.left)}px round 0px)`}]};
    return {enter:[{clipPath:start},{clipPath:full}],exit:[{clipPath:full},{clipPath:'inset(0 0 100% 0)'}]};
  }

  function waitAnimation(animation){return animation.finished.catch(()=>undefined)}

  function animateChapterEntry(chapter){
    const inner=chapter.querySelector('.chapter-inner');
    const from={home:'scale(1.01)',education:'translateY(16px)',internship:'translateX(18px)',projects:'scale(.988)',awards:'translateY(20px)'}[chapter.id]||'translateY(14px)';
    return inner.animate([{transform:from},{transform:'none'}],{duration:300,easing:'cubic-bezier(.2,.72,.2,1)',fill:'both'});
  }

  async function runElementTransition(next){
    const fromChapter=chapters[major];
    const direction=next>major?'forward':'backward';
    const {anchor,kind}=transitionAnchor(fromChapter,direction);
    if(!anchor||!Element.prototype.animate||matchMedia('(prefers-reduced-motion: reduce)').matches){switchChapter(next);return}

    const rect=anchor.getBoundingClientRect();
    const color=transitionColor(fromChapter,anchor,kind);
    const layer=document.createElement('div');
    const surface=document.createElement('div');
    layer.className=`element-transition-layer kind-${kind}`;
    surface.className='element-transition-surface';
    surface.style.backgroundColor=color;
    layer.append(surface);

    let seed=null;
    if(kind==='circle'){
      seed=document.createElement('div');
      seed.className='element-transition-seed';
      Object.assign(seed.style,{left:`${rect.left}px`,top:`${rect.top}px`,width:`${rect.width}px`,height:`${rect.height}px`,border:`max(3px,.055em) solid ${color}`,borderRadius:'50%'});
      layer.append(seed);
    }

    document.body.append(layer);
    document.body.classList.add('is-major-transition');
    anchor.classList.add('transition-source-hidden');

    const enterEase='cubic-bezier(.68,0,.16,1)';
    const exitEase='cubic-bezier(.34,0,.18,1)';

    if(kind==='circle'){
      const cx=rect.left+rect.width/2;
      const cy=rect.top+rect.height/2;
      const start=Math.max(3,Math.min(rect.width,rect.height)*.18);
      const end=Math.hypot(Math.max(cx,window.innerWidth-cx),Math.max(cy,window.innerHeight-cy))*1.05;
      const enterAnimation=surface.animate([
        {clipPath:`circle(${start}px at ${cx}px ${cy}px)`,offset:0},
        {clipPath:`circle(${Math.max(rect.width,rect.height)*1.15}px at ${cx}px ${cy}px)`,offset:.42},
        {clipPath:`circle(${end*.48}px at ${cx}px ${cy}px)`,offset:.74},
        {clipPath:`circle(${end}px at ${cx}px ${cy}px)`,offset:1}
      ],{duration:520,easing:'linear',fill:'forwards'});
      if(seed)seed.animate([{transform:'scale(1)'},{transform:'scale(1.42)'}],{duration:190,easing:enterEase,fill:'forwards'}).finished.finally(()=>seed.remove());
      await waitAnimation(enterAnimation);
      switchChapter(next);
      const entryAnimation=animateChapterEntry(chapters[major]);
      const exitAnimation=surface.animate([
        {clipPath:`circle(${end}px at ${cx}px ${cy}px)`,offset:0},
        {clipPath:`circle(${end*.42}px at ${cx}px ${cy}px)`,offset:.58},
        {clipPath:`circle(0px at ${cx}px ${cy}px)`,offset:1}
      ],{duration:280,easing:'linear',fill:'forwards'});
      await Promise.all([waitAnimation(exitAnimation),waitAnimation(entryAnimation)]);
    }else{
      const phases=phaseClips(kind,rect);
      const enterAnimation=surface.animate(phases.enter,{duration:420,easing:enterEase,fill:'forwards'});
      await waitAnimation(enterAnimation);
      switchChapter(next);
      const entryAnimation=animateChapterEntry(chapters[major]);
      const exitAnimation=surface.animate(phases.exit,{duration:270,easing:exitEase,fill:'forwards'});
      await Promise.all([waitAnimation(exitAnimation),waitAnimation(entryAnimation)]);
    }

    layer.remove();
    anchor.classList.remove('transition-source-hidden');
    document.body.classList.remove('is-major-transition');
  }

  async function goMajor(next){
    next=Math.max(0,Math.min(chapters.length-1,next));
    if(next===major||transitioning)return;
    transitioning=true;
    try{await runElementTransition(next)}finally{
      transitioning=false;
      document.body.classList.remove('is-major-transition');
      document.querySelectorAll('.element-transition-layer').forEach(layer=>layer.remove());
    }
  }

  function activeScroller(){return chapters[major].querySelector('.chapter-scroll')}

  function initSubsystem(root){
    const buttons=[...root.querySelectorAll('.subnav button')];
    const panels=[...root.querySelectorAll('.subpanel')];
    root.dataset.current='0';
    root.dataset.animating='false';
    buttons.forEach((button,index)=>{
      button.setAttribute('aria-selected',index===0?'true':'false');
      button.addEventListener('click',()=>setSub(root,index));
    });
    root._buttons=buttons;
    root._panels=panels;
  }

  function setSub(root,next){
    const buttons=root._buttons;
    const panels=root._panels;
    const current=Number(root.dataset.current||0);
    next=Math.max(0,Math.min(panels.length-1,next));
    if(next===current||root.dataset.animating==='true')return false;

    root.dataset.animating='true';
    root.dataset.current=String(next);
    const incoming=panels[next];
    const outgoing=panels[current];
    const forward=next>current;
    buttons[current].classList.remove('active');
    buttons[current].setAttribute('aria-selected','false');
    buttons[next].classList.add('active');
    buttons[next].setAttribute('aria-selected','true');
    incoming.classList.add('active','subpanel-incoming');

    const fromClip=forward?'inset(0 0 0 100%)':'inset(0 100% 0 0)';
    const offset=forward?26:-26;
    const animation=incoming.animate([
      {clipPath:fromClip,transform:`translate3d(${offset}px,0,0)`},
      {clipPath:'inset(0)',transform:'translate3d(0,0,0)'}
    ],{duration:410,easing:'cubic-bezier(.62,0,.2,1)',fill:'forwards'});

    buttons[next].scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
    const guide=root.closest('.chapter').querySelector('.project-scroll-guide');
    if(guide){
      guide.querySelector('.project-progress').textContent=String(next+1).padStart(2,'0')+' / '+String(panels.length).padStart(2,'0');
      guide.style.setProperty('--progress',`${((next+1)/panels.length)*100}%`);
    }

    animation.finished.catch(()=>undefined).finally(()=>{
      outgoing.classList.remove('active');
      incoming.classList.remove('subpanel-incoming');
      incoming.getAnimations().forEach(item=>item.cancel());
      root.dataset.animating='false';
      fitChapter(root.closest('.chapter'));
    });
    return true;
  }

  function changeActiveSub(delta){
    const root=chapters[major].querySelector('[data-subsystem]');
    if(!root)return false;
    return setSub(root,Number(root.dataset.current||0)+delta);
  }

  function handleProjectWheel(event){
    const root=chapters[major].querySelector('[data-subsystem]');
    if(!root)return false;
    event.preventDefault();
    if(transitioning||subWheelLocked)return true;
    subWheelSum+=event.deltaY;
    clearTimeout(subWheelTimer);
    subWheelTimer=setTimeout(()=>subWheelSum=0,140);
    if(Math.abs(subWheelSum)<24)return true;
    subWheelLocked=true;
    const direction=subWheelSum>0?1:-1;
    subWheelSum=0;
    const current=Number(root.dataset.current||0);
    const last=root._panels.length-1;
    if(direction>0){if(current<last)setSub(root,current+1);else goMajor(major+1)}
    else{if(current>0)setSub(root,current-1);else goMajor(major-1)}
    setTimeout(()=>subWheelLocked=false,500);
    return true;
  }

  majorButtons.forEach(button=>button.addEventListener('click',event=>{event.preventDefault();goMajor(Number(button.dataset.major))}));
  document.getElementById('lang').addEventListener('click',()=>setLang(lang==='zh'?'en':'zh'));
  document.querySelectorAll('[data-subsystem]').forEach(initSubsystem);

  window.addEventListener('wheel',event=>{
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    if(major===3&&window.innerWidth>600){handleProjectWheel(event);return}
    const scroller=activeScroller();
    const atTop=scroller.scrollTop<=2;
    const atBottom=scroller.scrollTop+scroller.clientHeight>=scroller.scrollHeight-2;
    if((event.deltaY>0&&atBottom)||(event.deltaY<0&&atTop)){
      event.preventDefault();
      wheelSum+=event.deltaY;
      clearTimeout(wheelTimer);
      wheelTimer=setTimeout(()=>wheelSum=0,160);
      if(Math.abs(wheelSum)>36){goMajor(major+(wheelSum>0?1:-1));wheelSum=0}
    }
  },{passive:false});

  window.addEventListener('keydown',event=>{
    if(event.key==='ArrowDown'||event.key==='PageDown'){
      event.preventDefault();
      if(major===3&&!changeActiveSub(1))goMajor(major+1);else if(major!==3)goMajor(major+1);
    }
    if(event.key==='ArrowUp'||event.key==='PageUp'){
      event.preventDefault();
      if(major===3&&!changeActiveSub(-1))goMajor(major-1);else if(major!==3)goMajor(major-1);
    }
    if(event.key==='ArrowRight')changeActiveSub(1);
    if(event.key==='ArrowLeft')changeActiveSub(-1);
  });

  window.addEventListener('touchstart',event=>{
    const touch=event.touches[0];
    touchStart={x:touch.clientX,y:touch.clientY};
  },{passive:true});

  window.addEventListener('touchend',event=>{
    if(!touchStart)return;
    const touch=event.changedTouches[0];
    const dx=touch.clientX-touchStart.x;
    const dy=touch.clientY-touchStart.y;
    if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy))changeActiveSub(dx<0?1:-1);
    else if(Math.abs(dy)>70)goMajor(major+(dy<0?1:-1));
    touchStart=null;
  },{passive:true});

  window.addEventListener('resize',()=>{
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(()=>fitChapter(chapters[major]),100);
  });

  const hashIndex=chapters.findIndex(chapter=>'#'+chapter.id===location.hash);
  if(hashIndex>0){chapters[0].classList.remove('active');major=hashIndex;chapters[major].classList.add('active')}
  setLang(lang);
  updateMajorUI();
  fitChapter(chapters[major]);
}

loadSite().catch(error=>{
  console.error(error);
  document.getElementById('stage').innerHTML='<div class="boot">LOAD ERROR / REFRESH</div>';
});