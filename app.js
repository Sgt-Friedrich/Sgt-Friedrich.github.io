const sectionIds=['home','education','internship','projects','awards'];
let lang;
try{lang=localStorage.getItem('portfolio-language')}catch(e){}
lang=lang||(navigator.language.toLowerCase().startsWith('zh')?'zh':'en');

async function loadSite(){
  const stage=document.getElementById('stage');
  const sections=await Promise.all(sectionIds.map(async id=>{
    const response=await fetch(`sections/${id}.html`);
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
  const wipe=document.querySelector('.wipe');
  let major=0,transitioning=false,wheelSum=0,wheelTimer,touchStart=null,subWheelLocked=false,subWheelSum=0,subWheelTimer,resizeTimer;

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

  function goMajor(next){
    next=Math.max(0,Math.min(chapters.length-1,next));
    if(next===major||transitioning)return;
    transitioning=true;
    const direction=next>major?'forward':'backward';
    wipe.className='wipe run '+direction;
    setTimeout(()=>{
      chapters[major].classList.remove('active');
      major=next;
      chapters[major].classList.add('active');
      chapters[major].querySelector('.chapter-scroll').scrollTop=0;
      updateMajorUI();
      fitChapter(chapters[major]);
    },430);
    setTimeout(()=>{
      wipe.className='wipe';
      transitioning=false;
    },970);
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
    if(next===current)return false;
    buttons[current].classList.remove('active');
    buttons[current].setAttribute('aria-selected','false');
    panels[current].classList.remove('active','enter-left','enter-right');
    buttons[next].classList.add('active');
    buttons[next].setAttribute('aria-selected','true');
    panels[next].classList.add('active',next>current?'enter-right':'enter-left');
    root.dataset.current=String(next);
    buttons[next].scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
    const guide=root.closest('.chapter').querySelector('.project-scroll-guide');
    if(guide){
      guide.querySelector('.project-progress').textContent=String(next+1).padStart(2,'0')+' / '+String(panels.length).padStart(2,'0');
      guide.style.setProperty('--progress',`${((next+1)/panels.length)*100}%`);
    }
    requestAnimationFrame(()=>fitChapter(root.closest('.chapter')));
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
    setTimeout(()=>subWheelLocked=false,460);
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

    if(major===3&&window.innerWidth>600){
      handleProjectWheel(event);
      return;
    }

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
