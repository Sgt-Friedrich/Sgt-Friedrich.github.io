const ASSET_VERSION='20260715-8';
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
    const kindMap={home:'o',education:'card',internship:'cell',projects:'tab',awards:'podium'};
    let anchor=chapter.querySelector(selectorMap[chapter.id]);
    if(anchor&&!isVisibleRect(anchor.getBoundingClientRect()))anchor=null;
    if(!anchor){
      anchor=chapter.querySelector('.bottom-gate .gate-arrow')||chapter.querySelector('.chapter-title');
      return {anchor,kind:'fallback'};
    }
    return {anchor,kind:kindMap[chapter.id]||'fallback'};
  }

  function cloneComputedStyle(source,clone,rect,kind){
    const style=getComputedStyle(source);
    clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
    clone.classList.add('element-morph-clone',`morph-${kind}`);
    Object.assign(clone.style,{
      left:`${rect.left}px`,
      top:`${rect.top}px`,
      width:`${rect.width}px`,
      height:`${rect.height}px`,
      backgroundColor:style.backgroundColor,
      color:style.color,
      border:style.border,
      borderRadius:style.borderRadius,
      boxShadow:style.boxShadow,
      padding:style.padding,
      fontFamily:style.fontFamily,
      fontSize:style.fontSize,
      fontWeight:style.fontWeight,
      fontStyle:style.fontStyle,
      lineHeight:style.lineHeight,
      letterSpacing:style.letterSpacing,
      textAlign:style.textAlign,
      opacity:'1'
    });
    if(kind==='o'){
      clone.style.padding='0';
      clone.style.width=`${rect.width}px`;
      clone.style.height=`${rect.height}px`;
      clone.style.backgroundColor='transparent';
      clone.style.color=getComputedStyle(document.documentElement).getPropertyValue('--accent-deep').trim()||style.color;
    }
  }

  function insetClip(rect,radius='0px'){
    const top=Math.max(0,rect.top);
    const right=Math.max(0,window.innerWidth-rect.right);
    const bottom=Math.max(0,window.innerHeight-rect.bottom);
    const left=Math.max(0,rect.left);
    return `inset(${top}px ${right}px ${bottom}px ${left}px round ${radius})`;
  }

  function transitionFrames(kind,rect){
    const full='inset(0px 0px 0px 0px round 0px)';
    const start=insetClip(rect,Math.min(24,Math.max(0,parseFloat(getComputedStyle(document.documentElement).fontSize)))+'px');
    const horizontal=`inset(${Math.max(0,rect.top)}px 0px ${Math.max(0,window.innerHeight-rect.bottom)}px 0px round 0px)`;
    const vertical=`inset(0px ${Math.max(0,window.innerWidth-rect.right)}px 0px ${Math.max(0,rect.left)}px round 0px)`;
    if(kind==='card')return [{clipPath:start,offset:0},{clipPath:horizontal,offset:.32},{clipPath:full,offset:.72},{clipPath:full,offset:1}];
    if(kind==='cell')return [{clipPath:start,offset:0},{clipPath:horizontal,offset:.42},{clipPath:full,offset:.78},{clipPath:full,offset:1}];
    if(kind==='tab')return [{clipPath:start,offset:0},{clipPath:vertical,offset:.38},{clipPath:full,offset:.74},{clipPath:full,offset:1}];
    if(kind==='podium')return [{clipPath:start,offset:0},{clipPath:vertical,offset:.46},{clipPath:full,offset:.76},{clipPath:full,offset:1}];
    return [{clipPath:start,offset:0},{clipPath:full,offset:.72},{clipPath:full,offset:1}];
  }

  function waitAnimation(animation){
    return animation.finished.catch(()=>undefined);
  }

  async function runElementMorph(next){
    const fromChapter=chapters[major];
    const toChapter=chapters[next];
    const direction=next>major?'forward':'backward';
    const {anchor,kind}=transitionAnchor(fromChapter,direction);
    if(!anchor||!Element.prototype.animate||matchMedia('(prefers-reduced-motion: reduce)').matches){
      switchChapter(next);
      return;
    }

    const rect=anchor.getBoundingClientRect();
    const targetColor=getComputedStyle(toChapter).backgroundColor||getComputedStyle(document.body).backgroundColor;
    const layer=document.createElement('div');
    const surface=document.createElement('div');
    const clone=anchor.cloneNode(true);
    layer.className=`element-morph-layer from-${fromChapter.id} to-${toChapter.id} kind-${kind}`;
    surface.className='element-morph-surface';
    surface.style.backgroundColor=targetColor;
    cloneComputedStyle(anchor,clone,rect,kind);
    layer.append(surface,clone);
    document.body.append(layer);
    document.body.classList.add('is-major-transition');
    anchor.classList.add('morph-source-hidden');

    const duration=kind==='o'?980:900;
    let surfaceAnimation;
    let cloneAnimation;

    if(kind==='o'){
      const cx=rect.left+rect.width/2;
      const cy=rect.top+rect.height/2;
      const startRadius=Math.max(3,Math.min(rect.width,rect.height)*.12);
      const endRadius=Math.hypot(Math.max(cx,window.innerWidth-cx),Math.max(cy,window.innerHeight-cy))*1.18;
      surfaceAnimation=surface.animate([
        {clipPath:`circle(${startRadius}px at ${cx}px ${cy}px)`,offset:0},
        {clipPath:`circle(${Math.max(rect.width,rect.height)*.58}px at ${cx}px ${cy}px)`,offset:.26},
        {clipPath:`circle(${endRadius}px at ${cx}px ${cy}px)`,offset:.82},
        {clipPath:`circle(${endRadius}px at ${cx}px ${cy}px)`,offset:1}
      ],{duration,easing:'cubic-bezier(.72,0,.18,1)',fill:'forwards'});
      const scale=Math.min(34,Math.max(12,endRadius/Math.max(rect.width,1)));
      cloneAnimation=clone.animate([
        {transform:'scale(1)',opacity:1,offset:0},
        {transform:`scale(${scale*.42})`,opacity:.92,offset:.42},
        {transform:`scale(${scale})`,opacity:.08,offset:.86},
        {transform:`scale(${scale})`,opacity:0,offset:1}
      ],{duration,easing:'cubic-bezier(.72,0,.18,1)',fill:'forwards'});
    }else{
      surfaceAnimation=surface.animate(transitionFrames(kind,rect),{duration,easing:'cubic-bezier(.76,0,.24,1)',fill:'forwards'});
      const cloneFrames={
        card:[{transform:'scale(1)',opacity:1},{transform:'scale(1.025)',opacity:.88,offset:.42},{transform:'scale(1.04)',opacity:0,offset:.78},{opacity:0}],
        cell:[{transform:'scale(1)',opacity:1},{transform:'scaleX(1.08)',opacity:.9,offset:.36},{transform:'scaleX(1.18)',opacity:0,offset:.76},{opacity:0}],
        tab:[{transform:'translateY(0) scale(1)',opacity:1},{transform:'translateY(-8px) scale(1.025)',opacity:.92,offset:.36},{transform:'translateY(-18px) scale(1.06)',opacity:0,offset:.76},{opacity:0}],
        podium:[{transform:'translateY(0) scale(1)',opacity:1},{transform:'translateY(-12px) scaleY(1.08)',opacity:.9,offset:.42},{transform:'translateY(-30px) scaleY(1.18)',opacity:0,offset:.78},{opacity:0}],
        fallback:[{transform:'scale(1)',opacity:1},{transform:'scale(1.15)',opacity:0}]
      };
      cloneAnimation=clone.animate(cloneFrames[kind]||cloneFrames.fallback,{duration,easing:'cubic-bezier(.76,0,.24,1)',fill:'forwards'});
    }

    const switchDelay=kind==='o'?530:470;
    const switchTimer=setTimeout(()=>switchChapter(next),switchDelay);
    await Promise.all([waitAnimation(surfaceAnimation),waitAnimation(cloneAnimation)]);
    clearTimeout(switchTimer);
    if(major!==next)switchChapter(next);
    await waitAnimation(surface.animate([{opacity:1},{opacity:0}],{duration:210,easing:'ease-out',fill:'forwards'}));
    anchor.classList.remove('morph-source-hidden');
    layer.remove();
    document.body.classList.remove('is-major-transition');
  }

  async function goMajor(next){
    next=Math.max(0,Math.min(chapters.length-1,next));
    if(next===major||transitioning)return;
    transitioning=true;
    try{await runElementMorph(next)}finally{transitioning=false;document.body.classList.remove('is-major-transition')}
  }

  function activeScroller(){return chapters[major].querySelector('.chapter-scroll')}

  function initSubsystem(root){
    const buttons=[...root.querySelectorAll('.subnav button')];
    const panels=[...root.querySelectorAll('.subpanel')];
    root.dataset.current='0';
    buttons.forEach((button,index)=>{
      button.setAttribute('aria-selected',index===0?'true':'false');
      button.addEventListener('click',()=>setSub(root,index));
    });
    root._buttons=buttons;
    root._panels=panels;
  }

  function setSub(root,next){
    const buttons=root._buttons,panels=root._panels,current=Number(root.dataset.current||0);
    next=Math.max(0,Math.min(panels.length-1,next));
    if(next===current||root.dataset.animating==='true')return false;
    root.dataset.animating='true';
    const forward=next>current;
    const currentPanel=panels[current];
    const nextPanel=panels[next];
    const prepareClass=forward?'prepare-right':'prepare-left';
    const leaveClass=forward?'leave-left':'leave-right';

    buttons[current].classList.remove('active');
    buttons[current].setAttribute('aria-selected','false');
    buttons[next].classList.add('active');
    buttons[next].setAttribute('aria-selected','true');

    nextPanel.classList.remove('leave-left','leave-right','prepare-left','prepare-right');
    nextPanel.classList.add('active',prepareClass);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      nextPanel.classList.remove(prepareClass);
      currentPanel.classList.add(leaveClass);
    }));

    root.dataset.current=String(next);
    buttons[next].scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
    const guide=root.closest('.chapter').querySelector('.project-scroll-guide');
    if(guide){
      guide.querySelector('.project-progress').textContent=String(next+1).padStart(2,'0')+' / '+String(panels.length).padStart(2,'0');
      guide.style.setProperty('--progress',`${((next+1)/panels.length)*100}%`);
    }

    setTimeout(()=>{
      currentPanel.classList.remove('active','leave-left','leave-right','enter-left','enter-right');
      root.dataset.animating='false';
      fitChapter(root.closest('.chapter'));
    },480);
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
    if(direction>0){
      if(current<last)setSub(root,current+1);else goMajor(major+1);
    }else{
      if(current>0)setSub(root,current-1);else goMajor(major-1);
    }
    setTimeout(()=>subWheelLocked=false,520);
    return true;
  }

  majorButtons.forEach(button=>button.addEventListener('click',event=>{
    event.preventDefault();
    goMajor(Number(button.dataset.major));
  }));

  document.getElementById('lang').addEventListener('click',()=>setLang(lang==='zh'?'en':'zh'));
  document.querySelectorAll('[data-subsystem]').forEach(initSubsystem);

  window.addEventListener('wheel',event=>{
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    if(major===3&&window.innerWidth>600){handleProjectWheel(event);return;}

    const scroller=activeScroller();
    const atTop=scroller.scrollTop<=2;
    const atBottom=scroller.scrollTop+scroller.clientHeight>=scroller.scrollHeight-2;
    if((event.deltaY>0&&atBottom)||(event.deltaY<0&&atTop)){
      event.preventDefault();
      wheelSum+=event.deltaY;
      clearTimeout(wheelTimer);
      wheelTimer=setTimeout(()=>wheelSum=0,160);
      if(Math.abs(wheelSum)>36){
        goMajor(major+(wheelSum>0?1:-1));
        wheelSum=0;
      }
    }
  },{passive:false});

  window.addEventListener('keydown',event=>{
    if(event.key==='ArrowDown'||event.key==='PageDown'){
      event.preventDefault();
      if(major===3&&!changeActiveSub(1))goMajor(major+1);
      else if(major!==3)goMajor(major+1);
    }
    if(event.key==='ArrowUp'||event.key==='PageUp'){
      event.preventDefault();
      if(major===3&&!changeActiveSub(-1))goMajor(major-1);
      else if(major!==3)goMajor(major-1);
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
  if(hashIndex>0){
    chapters[0].classList.remove('active');
    major=hashIndex;
    chapters[major].classList.add('active');
  }
  setLang(lang);
  updateMajorUI();
  fitChapter(chapters[major]);
}

loadSite().catch(error=>{
  console.error(error);
  document.getElementById('stage').innerHTML='<div class="boot">LOAD ERROR / REFRESH</div>';
});
