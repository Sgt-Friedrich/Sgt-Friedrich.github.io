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
  let major=0,transitioning=false,wheelSum=0,wheelTimer,touchStart=null;

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
  }

  function updateMajorUI(){
    dots.forEach((dot,index)=>dot.classList.toggle('active',index===major));
    document.querySelectorAll('.primary-nav [data-major]').forEach(button=>button.classList.toggle('active',Number(button.dataset.major)===major));
    history.replaceState(null,'','#'+chapters[major].id);
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
    buttons.forEach((button,index)=>button.addEventListener('click',()=>setSub(root,index)));
    root._buttons=buttons;
    root._panels=panels;
  }

  function setSub(root,next){
    const buttons=root._buttons,panels=root._panels,current=Number(root.dataset.current||0);
    next=Math.max(0,Math.min(panels.length-1,next));
    if(next===current)return;
    buttons[current].classList.remove('active');
    panels[current].classList.remove('active','enter-left','enter-right');
    buttons[next].classList.add('active');
    panels[next].classList.add('active',next>current?'enter-right':'enter-left');
    root.dataset.current=String(next);
    buttons[next].scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
  }

  function changeActiveSub(delta){
    const root=chapters[major].querySelector('[data-subsystem]');
    if(!root)return;
    setSub(root,Number(root.dataset.current||0)+delta);
  }

  majorButtons.forEach(button=>button.addEventListener('click',event=>{
    event.preventDefault();
    goMajor(Number(button.dataset.major));
  }));

  document.getElementById('lang').addEventListener('click',()=>setLang(lang==='zh'?'en':'zh'));
  document.querySelectorAll('[data-subsystem]').forEach(initSubsystem);

  window.addEventListener('wheel',event=>{
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const scroller=activeScroller();
    const atTop=scroller.scrollTop<=2;
    const atBottom=scroller.scrollTop+scroller.clientHeight>=scroller.scrollHeight-2;
    if((event.deltaY>0&&atBottom)||(event.deltaY<0&&atTop)){
      event.preventDefault();
      wheelSum+=event.deltaY;
      clearTimeout(wheelTimer);
      wheelTimer=setTimeout(()=>wheelSum=0,180);
      if(Math.abs(wheelSum)>75){
        goMajor(major+(wheelSum>0?1:-1));
        wheelSum=0;
      }
    }
  },{passive:false});

  window.addEventListener('keydown',event=>{
    if(event.key==='ArrowDown'||event.key==='PageDown'){
      event.preventDefault();
      goMajor(major+1);
    }
    if(event.key==='ArrowUp'||event.key==='PageUp'){
      event.preventDefault();
      goMajor(major-1);
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
    if(Math.abs(dy)>70&&Math.abs(dy)>Math.abs(dx))goMajor(major+(dy<0?1:-1));
    else if(Math.abs(dx)>55)changeActiveSub(dx<0?1:-1);
    touchStart=null;
  },{passive:true});

  const hashIndex=chapters.findIndex(chapter=>'#'+chapter.id===location.hash);
  if(hashIndex>0){
    chapters[0].classList.remove('active');
    major=hashIndex;
    chapters[major].classList.add('active');
  }
  setLang(lang);
  updateMajorUI();
}

loadSite().catch(error=>{
  console.error(error);
  document.getElementById('stage').innerHTML='<div class="boot">LOAD ERROR / REFRESH</div>';
});
