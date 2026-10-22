(function(){
  // v6.0.39 — mantém o zoom nativo acessível. A navegação de componentes
  // interativos continua sob responsabilidade do respectivo plugin, não do documento.
  const CTA_SELECTOR = [
    '[data-design-role="cta"]',
    '.button-primary','.btn-primary','.opp-cta','.svp-hero-button','.formsenderCSS_button','.spp-cta','.pit-glass-cta','.pp-flip-cta','.btn-flip','.btn-flipFake',
    '.fsp-result a[data-fsp-cta]',
    'a[class*="__cta"]','button[class*="__cta"]','a[class*="-cta"]','button[class*="-cta"]','a[class*="_cta"]','button[class*="_cta"]',
    'a[class*="call-to-action"]','button[class*="call-to-action"]'
  ].join(',');
  function buttonEffect(){return cssVar(document.documentElement,'--action-button-effect','depth')||'depth'}
  function buttonClickEffect(){return cssVar(document.documentElement,'--action-button-click-effect','press')||'press'}
  function decorateCTA(el){
    if(!(el instanceof Element))return;
    el.classList.add('imobify-design-cta');
    el.dataset.imobifyEffect=buttonEffect();
  }
  function parseColor(value){
    const raw=String(value||'').trim();
    let m=raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if(m){let hex=m[1];if(hex.length===3)hex=hex.split('').map(c=>c+c).join('');return {r:parseInt(hex.slice(0,2),16),g:parseInt(hex.slice(2,4),16),b:parseInt(hex.slice(4,6),16)}}
    m=raw.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
    if(m)return {r:+m[1],g:+m[2],b:+m[3]};
    return null;
  }
  function hex(rgb){const h=v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0');return '#'+h(rgb.r)+h(rgb.g)+h(rgb.b)}
  function lum(value){const rgb=parseColor(value);if(!rgb)return null;const c=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return c(rgb.r)*.2126+c(rgb.g)*.7152+c(rgb.b)*.0722}
  function ratio(a,b){const x=lum(a),y=lum(b);if(x==null||y==null)return 1;return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
  function mix(a,b,t){const x=parseColor(a),y=parseColor(b);if(!x||!y)return a;t=Math.max(0,Math.min(1,Number(t)||0));return hex({r:x.r+(y.r-x.r)*t,g:x.g+(y.g-x.g)*t,b:x.b+(y.b-x.b)*t})}
  function safest(background){return ratio('#ffffff',background)>=ratio('#000000',background)?'#ffffff':'#000000'}
  function ensureContrast(preferred,background,minimum){
    minimum=Number(minimum)||4.5;
    if(!parseColor(preferred)||!parseColor(background)||ratio(preferred,background)>=minimum)return preferred;
    const target=safest(background);
    for(let step=1;step<=20;step++){const candidate=mix(preferred,target,step/20);if(ratio(candidate,background)>=minimum)return candidate}
    return target;
  }
  function cssVar(el,name,fallback=''){return (getComputedStyle(el).getPropertyValue(name)||fallback).trim()}
  function contrastEnabled(){return cssVar(document.documentElement,'--contrast-enabled','1')!=='0'}
  function contrastMinimum(){return Number(cssVar(document.documentElement,'--contrast-min','4.5'))||4.5}
  function setSafe(el,name,preferred,background){if(!el||!contrastEnabled())return;el.style.setProperty(name,ensureContrast(preferred,background,contrastMinimum()))}
  function applyDesignSemantics(root){
    const scope=root&&root.querySelectorAll?root:document;
    const pluginRoots=[];
    if(scope instanceof Element){
      const owner=scope.closest('[data-plugin]');
      if(owner)pluginRoots.push(owner);
    }
    if(scope.querySelectorAll)scope.querySelectorAll('[data-plugin]').forEach(el=>pluginRoots.push(el));
    if(scope instanceof Element && scope.matches(CTA_SELECTOR))decorateCTA(scope);
    [...new Set(pluginRoots)].forEach(function(plugin){
      plugin.querySelectorAll('h1,h2,h3,h4,h5,h6,[data-design-role=\"title\"]').forEach(function(el){
        el.classList.add('imobify-design-title');
      });
      plugin.querySelectorAll('.hero-copy,.svp-hero-subtitle,[class$=\"__subtitle\"],[class$=\"-subtitle\"],[class$=\"_subtitle\"],[class$=\"__subheading\"],[class$=\"-subheading\"],[class$=\"_subheading\"],[data-design-role=\"subtitle\"]').forEach(function(el){
        el.classList.add('imobify-design-subtitle');
      });
      plugin.querySelectorAll('h1,h2').forEach(function(heading){
        const next=heading.nextElementSibling;
        if(next&&next.matches('p:not(.eyebrow):not(.legal)'))next.classList.add('imobify-design-subtitle');
      });
      plugin.querySelectorAll(CTA_SELECTOR).forEach(decorateCTA);
      plugin.querySelectorAll('.bbp[data-project-profile=\"true\"] .bbp__cta').forEach(decorateCTA);
    });
    scope.querySelectorAll(CTA_SELECTOR).forEach(decorateCTA);
  }

  function applyContrastGuards(root){
    if(!contrastEnabled())return;
    const scope=root&&root.querySelectorAll?root:document;
    const include=(selector)=>{const out=[];if(scope instanceof Element&&scope.matches(selector))out.push(scope);scope.querySelectorAll(selector).forEach(el=>out.push(el));return out};

    include('.pit-section').forEach(el=>{
      const accent=cssVar(el,'--pit-accent',cssVar(document.documentElement,'--primary','#16a34a'));
      const surface=cssVar(document.documentElement,'--surface','#ffffff');
      setSafe(el,'--pit-accent-on-surface',accent,surface);
      setSafe(el,'--pit-accent-contrast',safest(accent),accent);
    });

    include('.iwfp-widget').forEach(el=>{
      const bg=cssVar(el,'--iwfp-bg','#25d366');
      setSafe(el,'--iwfp-icon-safe',cssVar(el,'--iwfp-icon','#ffffff'),bg);
      setSafe(el,'--iwfp-text-safe',cssVar(el,'--iwfp-text','#ffffff'),bg);
    });

    include('.imobify-menu-pro').forEach(el=>{
      const text=cssVar(el,'--imp-text','#ffffff'),accent=cssVar(el,'--imp-accent','#d4af37');
      const bg=cssVar(el,'--imp-bg','#0a1628'),scroll=cssVar(el,'--imp-bg-scroll',bg),mobile=cssVar(el,'--imp-mobile-bg',bg);
      setSafe(el,'--imp-text-safe',text,bg);setSafe(el,'--imp-text-scroll-safe',text,scroll);setSafe(el,'--imp-text-mobile-safe',text,mobile);
      setSafe(el,'--imp-accent-safe',accent,bg);setSafe(el,'--imp-accent-scroll-safe',accent,scroll);setSafe(el,'--imp-accent-mobile-safe',accent,mobile);
      setSafe(el,'--imp-accent-contrast',safest(accent),accent);
    });
  }

  function clearButtonMotion(el){if(!el)return;el.style.removeProperty('--imobify-button-x');el.style.removeProperty('--imobify-button-y')}
  const cursorEffects=new Set(['magnetic','magnet-orbit','tilt-3d','cursor-halo','liquid-follow','prism-shimmer','orbit-ring','neon-trace']);
  function motionAllowed(){return matchMedia('(pointer:fine)').matches&&!matchMedia('(prefers-reduced-motion: reduce)').matches}
  document.addEventListener('pointermove',function(event){
    const el=event.target.closest?.('.imobify-design-cta');
    const fx=buttonEffect();
    if(!el||!cursorEffects.has(fx)||!motionAllowed())return;
    const r=el.getBoundingClientRect();if(!r.width||!r.height)return;
    const nx=Math.max(-1,Math.min(1,2*(event.clientX-r.left)/r.width-1));
    const ny=Math.max(-1,Math.min(1,2*(event.clientY-r.top)/r.height-1));
    const strength=fx==='magnet-orbit'?23:fx==='magnetic'?5:0;
    el.style.setProperty('--imobify-button-x',(nx*strength).toFixed(2)+'px');
    el.style.setProperty('--imobify-button-y',(ny*strength*.76).toFixed(2)+'px');
    el.style.setProperty('--imobify-cursor-x',((nx+1)*50).toFixed(1)+'%');
    el.style.setProperty('--imobify-cursor-y',((ny+1)*50).toFixed(1)+'%');
    el.style.setProperty('--imobify-tilt-x',(-ny*12).toFixed(2)+'deg');
    el.style.setProperty('--imobify-tilt-y',(nx*12).toFixed(2)+'deg');
  },{passive:true});
  document.addEventListener('pointerout',function(event){
    const el=event.target.closest?.('.imobify-design-cta');
    if(el&&!el.contains(event.relatedTarget)){
      clearButtonMotion(el);
      ['--imobify-cursor-x','--imobify-cursor-y','--imobify-tilt-x','--imobify-tilt-y'].forEach(k=>el.style.removeProperty(k));
    }
  },{passive:true});
  document.addEventListener('click',function(event){
    const el=event.target.closest?.('.imobify-design-cta, [data-design-role="cta"]');
    if(!el||el.matches('[disabled],[aria-disabled="true"]'))return;
    const mode=buttonClickEffect();
    if(mode==='press'){
      el.classList.remove('imobify-click-press'); void el.offsetWidth;
      el.classList.add('imobify-click-press');
      setTimeout(()=>el.classList.remove('imobify-click-press'),380);
    }
    if(mode==='ripple'){
      const rect=el.getBoundingClientRect();
      const ripple=document.createElement('span');
      ripple.className='imobify-button-ripple';
      const restorePosition=getComputedStyle(el).position==='static';
      if(restorePosition)el.style.position='relative';
      el.classList.add('imobify-ripple-active');
      const cx=Number.isFinite(event.clientX)&&event.clientX!==0?event.clientX-rect.left:rect.width/2;
      const cy=Number.isFinite(event.clientY)&&event.clientY!==0?event.clientY-rect.top:rect.height/2;
      ripple.style.left=cx+'px'; ripple.style.top=cy+'px';
      el.appendChild(ripple);setTimeout(()=>{ripple.remove();el.classList.remove('imobify-ripple-active');if(restorePosition)el.style.removeProperty('position')},650);
    }else if(['shockwave','confetti','sparks','rings','stamp','jelly','spin','flip','success','glow-burst','pixel-burst','shake'].includes(mode)){
      if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
      const rect=el.getBoundingClientRect();
      const cx=Number.isFinite(event.clientX)&&event.clientX!==0?event.clientX-rect.left:rect.width/2;
      const cy=Number.isFinite(event.clientY)&&event.clientY!==0?event.clientY-rect.top:rect.height/2;
      const particleModes=['confetti','sparks','pixel-burst'];
      const ringModes=['shockwave','rings','glow-burst'];
      const active=['stamp','jelly','spin','flip','shake'].includes(mode)?mode:null;
      if(active){
        const cls='imobify-click-'+active;
        el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);
        setTimeout(()=>el.classList.remove(cls),620);
      }
      if(mode==='success'){
        const mark=document.createElement('span');mark.className='imobify-click-success';mark.textContent='✓';mark.setAttribute('aria-hidden','true');
        el.appendChild(mark);setTimeout(()=>mark.remove(),700);
      }
      if(particleModes.includes(mode)||ringModes.includes(mode)){
        const count=particleModes.includes(mode)?(mode==='confetti'?12:9):(mode==='rings'?3:2);
        const restorePosition=getComputedStyle(el).position==='static';if(restorePosition)el.style.position='relative';
        for(let i=0;i<count;i++){
          const part=document.createElement('span');part.setAttribute('aria-hidden','true');
          part.className='imobify-click-particle '+(particleModes.includes(mode)?'imobify-click-particle-'+mode:'imobify-click-ring '+ 'imobify-click-ring-'+mode);
          part.style.left=cx+'px';part.style.top=cy+'px';
          part.style.setProperty('--i',String(i));part.style.setProperty('--count',String(count));
          part.style.setProperty('--angle',(i*360/count)+'deg');part.style.setProperty('--delay',(i*65)+'ms');
          el.appendChild(part);setTimeout(()=>part.remove(),900);
        }
        if(restorePosition)setTimeout(()=>el.style.removeProperty('position'),920);
      }
    }else if(mode==='bounce'||mode==='flash'){
      const cls=mode==='bounce'?'imobify-button-click-bounce':'imobify-button-click-flash';
      el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);setTimeout(()=>el.classList.remove(cls),430);
    }
  },true);

  document.addEventListener('click',function(event){
    if(event.__imobifyFloatingHandled)return;
    const link=event.target.closest?.('[href^="#"]');
    if(!link)return;
    const href=String(link.getAttribute('href')||'').trim();
    if(!href||href==='#')return;
    const floating=window.ImobifyFloating?.get?.(href);
    if(floating){
      event.preventDefault();
      window.ImobifyFloating.open(href,link);
      return;
    }
    let target=null;
    try{target=document.querySelector(href)}catch(_error){return}
    if(target){event.preventDefault();target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
  });
  window.Imobify={
    track:function(name,data){
      window.dataLayer=window.dataLayer||[];
      window.dataLayer.push({event:name,...(data||{})});
    },
    contrastRatio:ratio,
    ensureContrast:ensureContrast,
    applyContrastGuards:applyContrastGuards,
    applyDesignSemantics:applyDesignSemantics,
    registerCTA:function(el){decorateCTA(el);return el},
    refreshDesign:function(root){applyDesignSemantics(root||document);applyContrastGuards(root||document)}
  };
  const scan=()=>{applyDesignSemantics(document);applyContrastGuards(document)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan);else scan();
  new MutationObserver(function(mutations){
    mutations.forEach(function(mutation){mutation.addedNodes.forEach(function(node){if(node instanceof Element){applyDesignSemantics(node);applyContrastGuards(node)}})});
  }).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-design-role']});
})();


/* ImobStudio 6.0.61 — element animation, synchronized with the existing section reveal. */
(function(){
 'use strict';
 const SELECTOR='h1,h2,h3,h4,h5,h6,p,img,button,a,[data-design-role="title"],[data-design-role="subtitle"],[data-design-role="cta"]';
 const reduced=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const clamp=(v,a,b,f)=>Number.isFinite(parseFloat(v))?Math.min(b,Math.max(a,parseFloat(v))):f;
 const processed=new WeakSet();
 function targets(root){return [...root.querySelectorAll(SELECTOR)].filter(el=>el.closest('[data-section-id]')===root)}
 function play(el,cfg,delay,scrollDriven=false){
   if(!el||reduced()||!el.animate||cfg?.preset==='none')return;
   const preset=cfg?.preset||'none';if(preset==='none')return;
   const duration=clamp(cfg.durationMs,200,2000,750), intensity=cfg.intensity==='balanced'?1:0.62;
   const y=24*intensity,x=25*intensity,blur=7*intensity;
   const frame={opacity:0,transform:`translate3d(0,${y}px,0)`};
   if(preset==='orthogonal-assemble'){frame.transform=`translate3d(${-x}px,${y}px,0) rotate(-3deg) scale(.985)`;frame.clipPath='inset(0 0 75% 0)'}
   else if(preset==='line-reveal'){frame.transform=`translateY(${y}px)`;frame.clipPath='inset(100% 0 0 0)'}
   else if(preset==='soft-focus'){frame.filter=`blur(${blur}px)`;frame.transform=`translateY(${y/2}px)`}
   else if(preset==='float-in'){frame.transform=`translate3d(0,${y}px,0)`}
   else if(preset==='layer-assemble'){frame.transform=`translate3d(${x}px,${-y}px,0) scale(.98)`}
   else if(preset==='mask-unveil'){frame.opacity=1;frame.transform='none';frame.clipPath='inset(0 100% 0 0)'}
   else if(preset==='subtle-scale'){frame.transform='scale(.963)'}

   else if(preset==='orbit-settle'){frame.transform=`translate3d(${-x*2}px,${y*1.4}px,0) rotate(-9deg) scale(.92)`;}
   else if(preset==='elastic-dock'){frame.transform=`translate3d(${x*2.4}px,0,0) scale(.92)`;}
   else if(preset==='diagonal-sweep'){frame.transform=`translate3d(${-x*1.8}px,${y*1.8}px,0)`;frame.clipPath='inset(0 70% 70% 0)';}
   else if(preset==='flip-reveal'){frame.transform='perspective(700px) rotateX(-48deg) translateY(16px)';}
   else if(preset==='arc-rise'){frame.transform=`translate3d(${x*1.5}px,${y*2}px,0) rotate(7deg)`;}
   else if(preset==='depth-arrival'){frame.transform='perspective(700px) translateZ(-180px) scale(.86)';frame.filter=`blur(${blur*.65}px)`;}
   else if(preset==='split-shift'){frame.transform=`translate3d(${-x*2}px,${-y*.5}px,0) skewX(-8deg)`;}
   else if(preset==='tilt-unfold'){frame.opacity=1;frame.transform='perspective(650px) rotateY(-35deg) scale(.94)';frame.clipPath='inset(0 85% 0 0)';}
   else if(preset==='bounce-fade'){frame.transform=`translate3d(0,${y*2}px,0) scale(.9)`;}
   else if(preset==='wave-glide'){frame.transform=`translate3d(${x*1.6}px,${y*.8}px,0) rotate(4deg)`;}
   else if(preset==='curtain-diagonal'){frame.opacity=1;frame.transform=`translate3d(0,${y*.5}px,0)`;frame.clipPath='polygon(0 0,0 0,0 100%,0 100%)';}
   else if(preset==='magnetic-snap'){frame.transform=`translate3d(${-x*1.7}px,${y*.5}px,0) scale(.94) rotate(-4deg)`;}
   else if(preset==='architectural-curtain'){frame.opacity=1;frame.clipPath='inset(0 100% 0 0)';frame.transform=`scale(1.06) translateX(${x}px)`;}
   else if(preset==='kinetic-shear'){frame.transform=`translate3d(${-x*2}px,${y}px,0) skewX(13deg)`;frame.clipPath='inset(0 35% 0 0)';}
   else if(preset==='depth-parallax'){frame.transform=`perspective(900px) translate3d(0,${y*2}px,-120px) rotateX(9deg) scale(.88)`;}
   else if(preset==='light-sweep'){frame.filter=`brightness(1.8) blur(${blur}px)`;frame.transform=`translateX(${-x}px) scale(1.04)`;}
   else if(preset==='prism-unfold'){frame.opacity=1;frame.clipPath='polygon(0 0,0 0,0 100%,0 100%)';frame.transform='perspective(950px) rotateY(-24deg)';}
   else if(preset==='liquid-mask'){frame.opacity=1;frame.clipPath='ellipse(0% 10% at 50% 50%)';frame.filter=`blur(${blur*.65}px)`;}
   else if(preset==='cinema-focus'){frame.filter=`blur(${blur*1.7}px) brightness(.7)`;frame.transform='scale(1.115)';}
   else if(preset==='stereo-drift'){frame.transform=`perspective(900px) translate3d(${x*2}px,${-y}px,-90px) rotateY(16deg)`;}
   else return;
   const end={opacity:1,transform:'none',filter:'none',clipPath:'inset(0 0 0 0)'};

   const overshoot={opacity:1,transform:'none',filter:'none',clipPath:'inset(0 0 0 0)'};
   let frames=[frame,end],easing='cubic-bezier(.22,1,.36,1)';
   if(preset==='elastic-dock'||preset==='magnetic-snap'||preset==='bounce-fade'){
     const offset=preset==='bounce-fade'?`translateY(${-y*.28}px) scale(1.035)`:`translateX(${-x*.25}px) scale(1.025)`;
     frames=[{...frame,offset:0},{...overshoot,transform:offset,offset:.72},{...end,offset:1}];easing='ease-out';
   }else if(preset==='orbit-settle'||preset==='arc-rise'||preset==='wave-glide'){
     frames=[{...frame,offset:0},{...overshoot,transform:`translate3d(${x*.35}px,${-y*.28}px,0) rotate(-2deg)`,offset:.68},{...end,offset:1}];
   }else if(preset==='curtain-diagonal'){
     frames=[{...frame,offset:0},{...overshoot,clipPath:'polygon(0 0,75% 0,100% 100%,0 100%)',offset:.62},{...end,clipPath:'polygon(0 0,100% 0,100% 100%,0 100%)',offset:1}];
   }
   try{el.getAnimations().filter(a=>a.id==='imobify-element-motion').forEach(a=>a.cancel());const a=el.animate(frames,{duration,delay:scrollDriven?0:Math.max(0,delay||0),fill:scrollDriven?'both':'backwards',easing:scrollDriven?'linear':easing});a.id='imobify-element-motion';if(scrollDriven){a.pause();a.currentTime=0;return a;}a.finished.then(()=>a.cancel()).catch(()=>{});}catch(_){}
 }
 const scrollSections=new Map();
 let scrollTick=false;
 function updateScroll(){scrollTick=false;if(reduced())return;const vh=window.innerHeight||800;scrollSections.forEach((animations,section)=>{if(!section.isConnected){animations.forEach(a=>a.cancel());scrollSections.delete(section);return;}const rect=section.getBoundingClientRect();const total=Math.max(1,vh+rect.height);const progress=Math.max(0,Math.min(1,(vh-rect.top)/total));animations.forEach(({a,start,end})=>{try{a.currentTime=Math.max(0,Math.min(1,(progress-start)/Math.max(.001,end-start)))*a.effect.getTiming().duration;}catch(_){}});});}
 function requestScroll(){if(!scrollTick){scrollTick=true;requestAnimationFrame(updateScroll);}}
 window.addEventListener('scroll',requestScroll,{passive:true});window.addEventListener('resize',requestScroll,{passive:true});
 function run(section){
   if(!section||reduced())return;
   const cfg=section._imobifyElementMotion||{};
   const items=cfg.items||{};
   const list=targets(section).map((el,index)=>({el,index,c:items[String(index)]})).filter(o=>o.c&&o.c.preset&&o.c.preset!=='none');
   list.sort((a,b)=>clamp(a.c.order,0,99,a.index)-clamp(b.c.order,0,99,b.index)||a.index-b.index);
   const sectionDelay=section.getAttribute('data-section-transition')==='none'?0:clamp(getComputedStyle(section).getPropertyValue('--imobify-duration'),200,4000,800)+clamp(getComputedStyle(section).getPropertyValue('--imobify-delay'),0,2500,0);
   const base=clamp(cfg.baseDelayMs,0,2500,150),stagger=clamp(cfg.staggerMs,0,1000,100);
   if(cfg.scrollMode==='scrub'){if(scrollSections.has(section))return;const length=Math.max(1,list.length);const animations=list.map(({el,c},i)=>({a:play(el,c,0,true),start:.14+i*.32/length,end:.60+i*.32/length})).filter(x=>x.a);scrollSections.set(section,animations);requestScroll();return;}
   list.forEach(({el,c},i)=>play(el,c,sectionDelay+base+i*stagger+clamp(c.delayMs,0,2000,120)));
 }
 function prepare(section){
   if(processed.has(section))return;
   processed.add(section);
   try{section._imobifyElementMotion=JSON.parse(decodeURIComponent(section.getAttribute('data-element-motion')||'%7B%7D'));}catch(_){section._imobifyElementMotion={};}
   section.addEventListener('imobify:section-visible',()=>run(section));
   if(section._imobifyElementMotion?.scrollMode==='scrub')run(section);else if(section.dataset.motionTriggered==='true'||section.classList.contains('is-visible'))run(section);
 }
 function scan(root){if(root.matches?.('[data-element-motion]'))prepare(root);root.querySelectorAll?.('[data-element-motion]').forEach(prepare)}
 function init(){scan(document);new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(n=>{if(n.nodeType===1)scan(n)}))).observe(document.body,{childList:true,subtree:true});}
 window.ImobifyElementMotion={play,targets};
 window.addEventListener('message',e=>{
   if(e.data?.type!=='imobify-element-motion-preview-all')return;
   const root=document.querySelector(`[data-section-id="${String(e.data.sectionId||'').replace(/[^a-zA-Z0-9_-]/g,'')}"]`);
   if(!root)return;
   const cfg=e.data.config||{};const entries=targets(root).map((el,index)=>({el,index,c:cfg.items?.[String(index)]})).filter(o=>o.c?.preset&&o.c.preset!=='none');
   entries.sort((a,b)=>clamp(a.c.order,0,99,a.index)-clamp(b.c.order,0,99,b.index)||a.index-b.index);
   entries.forEach(({el,c},i)=>play(el,c,clamp(cfg.baseDelayMs,0,2500,0)+i*clamp(cfg.staggerMs,0,1000,100)+clamp(c.delayMs,0,2000,0)));
 });
 window.addEventListener('message',e=>{if(e.data?.type!=='imobify-element-motion-test')return;const root=document.querySelector(`[data-section-id="${String(e.data.sectionId||'').replace(/[^a-zA-Z0-9_-]/g,'')}"]`);if(root){const el=targets(root)[Number(e.data.index)];play(el,e.data.config||{},0);}});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();


/** Hero360Tour v1.2.4 - panorama full viewport, WebGL native, no third-party runtime. */
(function () {
 'use strict';
 const ID = 'hero360-tour';
 const instances = new WeakMap();
 const clamp = (v, a, b) => Math.min(b, Math.max(a, Number(v) || 0));
 const rad = v => v * Math.PI / 180;
 const deg = v => v * 180 / Math.PI;
 const wrap = v => ((v + 180) % 360 + 360) % 360 - 180;
 const safeUrl = v => {try { const url = new URL(v,document.baseURI);return ['https:','http:','mailto:','tel:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }};
 function parse(el) { try { return JSON.parse(el.querySelector('.ims360-config')?.value || '{}') || {}; } catch {return {};}}
 function glyph(type) {
   if(type==='info')return '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="27" class="hs-disc"/><circle cx="32" cy="21" r="3.5" class="hs-fill"/><path d="M32 29v18" class="hs-stroke"/></svg>';
   if(type==='external')return '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="27" class="hs-disc"/><path d="M25 39 42 22M31 22h11v11" class="hs-stroke"/></svg>';
   return '<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="50" rx="18" ry="6" class="hs-shadow"/><path d="M32 8 49 33H39v18H25V33H15Z" class="hs-arrow"/><path d="M32 11 45 31H36v17h-8V31h-9Z" class="hs-highlight"/></svg>';
 }
 const VS = `attribute vec2 a;varying vec2 uv;void main(){uv=a;gl_Position=vec4(a,0.0,1.0);}`;
 const FS = `precision highp float;
 varying vec2 uv;uniform sampler2D pano;uniform vec2 resolution;uniform float yaw;uniform float pitch;uniform float tanHalf;
 const float PI=3.141592653589793;
 void main(){
  float aspect=resolution.x/resolution.y;
  vec3 d=normalize(vec3(uv.x*tanHalf,uv.y*tanHalf/aspect,1.0));
  float cp=cos(pitch),sp=sin(pitch),cy=cos(yaw),sy=sin(yaw);
  vec3 p=vec3(d.x,cp*d.y+sp*d.z,cp*d.z-sp*d.y);
  vec3 world=vec3(cy*p.x+sy*p.z,p.y,cy*p.z-sy*p.x);
  float longitude=atan(world.x,world.z);
  float latitude=asin(clamp(world.y,-1.0,1.0));
  vec2 tex=vec2(fract(0.5+longitude/(2.0*PI)),clamp(0.5+latitude/PI,0.0,1.0));
  gl_FragColor=texture2D(pano,tex);
 }`;
 function createGL(canvas) {
   const gl = canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:false, powerPreference:'high-performance'}) || canvas.getContext('experimental-webgl');
   if(!gl)return null;
   function compile(type,src){const shader=gl.createShader(type);gl.shaderSource(shader,src);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error('Shader 360: '+gl.getShaderInfoLog(shader));return shader;}
   const program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,VS));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,FS));gl.linkProgram(program);
   if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('WebGL 360: '+gl.getProgramInfoLog(program));
   gl.useProgram(program);
   const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
   const a=gl.getAttribLocation(program,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
   const uniforms={resolution:gl.getUniformLocation(program,'resolution'),yaw:gl.getUniformLocation(program,'yaw'),pitch:gl.getUniformLocation(program,'pitch'),tanHalf:gl.getUniformLocation(program,'tanHalf'),pano:gl.getUniformLocation(program,'pano')};
   const tex=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);// The longitude mapping already wraps using fract(). WebGL1 requires CLAMP_TO_EDGE for NPOT images.
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
   gl.uniform1i(uniforms.pano,0);
   return {gl,program,buffer,tex,uniforms,textureReady:false,maxTexture:gl.getParameter(gl.MAX_TEXTURE_SIZE),destroy(){gl.deleteTexture(tex);gl.deleteBuffer(buffer);gl.deleteProgram(program)}};
 }

 function createCPU(canvas){
   const ctx=canvas.getContext('2d',{alpha:false,willReadFrequently:true});if(!ctx)return null;
   return {gl:null,ctx,textureReady:false,src:null,sw:0,sh:0,maxTexture:2048,destroy(){this.src=null},lastDraw:0};
 }
 function drawCPU(canvas,engine,yaw,pitch,hfov){
   if(!engine.src)return;
   const ctx=engine.ctx,W=canvas.width,H=canvas.height,src=engine.src,sw=engine.sw,sh=engine.sh;
   const output=ctx.createImageData(W,H),pixels=output.data,aspect=W/H,tan=Math.tan(hfov*Math.PI/360);
   const ya=yaw*Math.PI/180,pa=pitch*Math.PI/180,cp=Math.cos(pa),sp=Math.sin(pa),cy=Math.cos(ya),sy=Math.sin(ya);
   let j=0;
   for(let row=0;row<H;row++){
     const v=(1-2*(row+.5)/H)*tan/aspect;
     for(let col=0;col<W;col++){
       const u=(2*(col+.5)/W-1)*tan;
       const inv=1/Math.sqrt(1+u*u+v*v),dx=u*inv,dy=v*inv,dz=inv;
       const yy=cp*dy+sp*dz,zz=cp*dz-sp*dy;
       const wx=cy*dx+sy*zz,wz=cy*zz-sy*dx;
       const lon=Math.atan2(wx,wz),lat=Math.asin(Math.max(-1,Math.min(1,yy)));
       const sx=((Math.floor((.5+lon/(2*Math.PI))*sw)%sw)+sw)%sw;
       const syy=Math.max(0,Math.min(sh-1,Math.floor((.5-lat/Math.PI)*sh)));
       const k=(syy*sw+sx)*4;
       pixels[j++]=src[k];pixels[j++]=src[k+1];pixels[j++]=src[k+2];pixels[j++]=255;
     }
   }
   ctx.putImageData(output,0,0);
 }
 function initialize(root) {
  if(instances.has(root))return;
  const cfg=parse(root),scenes=cfg.scenes||{};
  const order=(Array.isArray(cfg.sceneOrder)?cfg.sceneOrder:Object.keys(scenes)).filter(id=>scenes[id]?.panorama);
  const stage=root.querySelector('.ims360-frame'),view=root.querySelector('.ims360-viewer'),poster=root.querySelector('.ims360-poster'),err=root.querySelector('.ims360-error'),label=root.querySelector('.ims360-scene-name');
  if(!stage||!view)return;
  const hero={eyebrow:root.querySelector('.ims360-eyebrow'),headline:root.querySelector('.ims360-headline'),body:root.querySelector('.ims360-subheadline'),cta:root.querySelector('[data-hero-cta]')};
  const defaults={eyebrow:hero.eyebrow?.textContent||'',headline:hero.headline?.textContent||'',body:hero.body?.textContent||''};
  root.style.setProperty('--ims360-opacity',String(clamp(parseFloat(root.style.getPropertyValue('--ims360-overlay')),0,75)/100));
  if(hero.cta){const href=safeUrl(hero.cta.getAttribute('href'));hero.cta.hidden=!href;if(href)hero.cta.href=href;}
  if(!order.length){const empty=root.querySelector('.ims360-empty');if(empty)empty.hidden=false;root.dataset.ims360Loaded='empty';return;}
  let canvas=document.createElement('canvas');canvas.className='ims360-gl';canvas.setAttribute('aria-label','Panorama 360 interativo');
  view.replaceChildren(canvas);
  const hotspotLayer=document.createElement('div');hotspotLayer.className='ims360-hotspot-layer';view.appendChild(hotspotLayer);
  let engine;
  try{engine=createGL(canvas)}catch(e){console.warn('[Hero360Tour] WebGL indisponível:',e)}
  if(!engine){
    // Um contexto WebGL parcialmente inicializado não permite reabrir o MESMO canvas em 2D.
    // Substituir o elemento garante o fallback quando a compilação do shader falhar no preview.
    const fallback=document.createElement('canvas');fallback.className=canvas.className;
    fallback.setAttribute('aria-label',canvas.getAttribute('aria-label'));
    canvas.replaceWith(fallback);canvas=fallback;
    engine=createCPU(canvas);
    root.dataset.ims360Renderer='canvas2d';
  }else root.dataset.ims360Renderer='webgl';
  if(!engine){if(err){err.textContent='Canvas indisponível; mostrando imagem estática.';err.hidden=false;}if(poster){poster.hidden=false;poster.src=scenes[order[0]].panorama;}root.dataset.ims360Loaded='error';return;}
  let gl=engine.gl;
  let disposed=false,sceneId=cfg.settings?.firstSceneId&&scenes[cfg.settings.firstSceneId]?.panorama?cfg.settings.firstSceneId:order[0];
  let yaw=0,pitch=0,hfov=clamp(root.dataset.heroHfov||118,60,140);
  let frame=0,resizeObserver=null,visible=true,dirty=true,transition=null,sequence=0,interactionAt=performance.now(),idleAnchor=null,pointer=null,hotspots=[],lastLoadedImage=null,firstFramePending=false;
  const idleMs=clamp(root.dataset.idle||10,5,60)*1000, swayYaw=clamp(root.dataset.swayYaw||7,0,16),swayPitch=clamp(root.dataset.swayPitch||.8,0,3),cycleMs=clamp(root.dataset.swayCycle||19,8,35)*1000;
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  // Immersive Motion — use browser device orientation (gyroscope + accelerometer fusion).
  // DeviceOrientationEvent.requestPermission() must be invoked directly from a user gesture.
  const motionBox=root.querySelector('.ims360-motion');
  const motionButton=motionBox?.querySelector('.ims360-motion-toggle');
  const motionReset=motionBox?.querySelector('.ims360-motion-recenter');
  const motionStatus=motionBox?.querySelector('.ims360-motion-status');
  const motionAllowed=root.dataset.motionEnabled==='true';
  const motionTouchEnabled=root.dataset.motionTouch!=='false';
  const motionSensitivity=clamp(root.dataset.motionSensitivity||50,10,100)/50;
  const motionSmoothing=clamp(root.dataset.motionSmoothing??65,0,100);
  const motionAuto=root.dataset.motionActivation==='auto';
  const coarse=window.matchMedia?.('(pointer: coarse)')?.matches||/Android|iPad|iPhone|Mobile/i.test(navigator.userAgent||'');
  // Use DeviceOrientation on Safari and Chrome; Chromium Generic Sensor API is the
  // fallback when orientation events are absent or return unusable readings.
  const sensorCapable=typeof window.DeviceOrientationEvent!=='undefined'||typeof window.DeviceMotionEvent!=='undefined'||typeof window.RelativeOrientationSensor==='function'||typeof window.AbsoluteOrientationSensor==='function';
  const motion={active:false,pending:false,hasReading:false,hasMovement:false,sample:null,anchor:null,base:null,target:null,sceneView:{yaw:0,pitch:0},lastTick:performance.now(),watchdog:null,fallbackTimer:null,generic:null,source:'',readings:0,relativeSeen:false,sources:Object.create(null),rateView:{yaw:0,pitch:0},rateAt:0,startedAt:0};
  const disposers=[];
  // Surface the actual raw sensor stream on physical phones. This readout is
  // deliberately opt-in and local: no telemetry or sensor data is transmitted.
  let rawOrientation={alpha:null,beta:null,gamma:null},rawRates={alpha:null,beta:null,gamma:null};
  let rawOrientationCount=0,rawMotionCount=0,rawOrientationInvalid=0;
  let lastRawReadingAt=0;
  const debugToggle=motionBox?.querySelector('.ims360-motion-debug-toggle');
  const debugOutput=motionBox?.querySelector('.ims360-motion-debug-output');
  let debugOpened=false;
  function motionDebug(){
    if(!debugOutput||!debugOpened)return;
    const policy=document.permissionsPolicy||document.featurePolicy;
    let policyStatus='desconhecida';
    try{if(policy?.allowsFeature)policyStatus=['accelerometer','gyroscope'].map(k=>k+': '+String(policy.allowsFeature(k))).join(', ')}catch(_){ }
    debugOutput.textContent=[
      'HTTPS: '+String(window.isSecureContext)+' | incorporado: '+String(window.top!==window),
      'Permissões: '+policyStatus,
      'Orientação (eventos): '+rawOrientationCount+' | incompletos: '+rawOrientationInvalid,
      'α '+String(rawOrientation.alpha)+' | β '+String(rawOrientation.beta)+' | γ '+String(rawOrientation.gamma),
      'Rotação (eventos): '+rawMotionCount,
      'α '+String(rawRates.alpha)+' | β '+String(rawRates.beta)+' | γ '+String(rawRates.gamma),
      'Fonte ativa: '+(motion.source||'nenhuma')+' | situação: '+(root.dataset.motionState||'desligado'),
      'Câmera yaw: '+yaw.toFixed(1)+'° | pitch: '+pitch.toFixed(1)+'°',
      'Amostras válidas: '+motion.readings+' | mudança: '+String(motion.hasMovement),
      'Último evento: '+(lastRawReadingAt?(Math.round((performance.now()-lastRawReadingAt)/100)/10+'s atrás'):'nenhum')
    ].join('\n');
  }
  if(debugToggle&&debugOutput){debugToggle.addEventListener('click',()=>{debugOpened=!debugOpened;debugOutput.hidden=!debugOpened;debugToggle.setAttribute('aria-expanded',String(debugOpened));motionDebug()});}

  function motionMessage(value){if(motionStatus)motionStatus.textContent=value||'';}
  function motionState(state,message){root.dataset.motionState=state;if(message!==undefined)motionMessage(message);}
  function motionSync(){
    if(motionButton){motionButton.setAttribute('aria-pressed',String(motion.active));
      const title=motionButton.querySelector('span');if(title)title.textContent=motion.active?'Desativar movimento':'Explorar em 360°';
      motionButton.disabled=motion.pending;}
    if(motionReset)motionReset.hidden=!motion.active||root.dataset.motionRecenter==='false';
  }
  function multiplyQuat(a,b){return {x:a.w*b.x+a.x*b.w+a.y*b.z-a.z*b.y,y:a.w*b.y-a.x*b.z+a.y*b.w+a.z*b.x,z:a.w*b.z+a.x*b.y-a.y*b.x+a.z*b.w,w:a.w*b.w-a.x*b.x-a.y*b.y-a.z*b.z};}
  function quaternionView(q){
    // W3C DeviceOrientation -> WebGL camera frame, including screen portrait/landscape.
    q=multiplyQuat(q,{x:Math.sin(-Math.PI/4),y:0,z:0,w:Math.cos(-Math.PI/4)});
    const angle=rad(-(window.screen?.orientation?.angle??window.orientation??0));
    q=multiplyQuat(q,{x:0,y:0,z:Math.sin(angle/2),w:Math.cos(angle/2)});
    const fx=-2*(q.x*q.z+q.w*q.y),fy=-2*(q.y*q.z-q.w*q.x),fz=-(1-2*(q.x*q.x+q.y*q.y));
    return {yaw:wrap(deg(Math.atan2(-fx,-fz))),pitch:clamp(deg(Math.asin(clamp(fy,-1,1))),-89,89)};
  }
  function deviceAngles(alpha,beta,gamma){
    const x=rad(beta),y=rad(alpha),z=rad(-gamma),c1=Math.cos(x/2),c2=Math.cos(y/2),c3=Math.cos(z/2),s1=Math.sin(x/2),s2=Math.sin(y/2),s3=Math.sin(z/2);
    return quaternionView({x:s1*c2*c3+c1*s2*s3,y:c1*s2*c3-s1*c2*s3,z:c1*c2*s3-s1*s2*c3,w:c1*c2*c3+s1*s2*s3});
  }
  function motionAnchor(baseYaw=yaw,basePitch=pitch){
    if(!motion.sample)return;
    motion.anchor={...motion.sample};motion.base={yaw:baseYaw,pitch:basePitch};motion.target={yaw:baseYaw,pitch:basePitch};
  }
  // Keep evidence from EACH sensor source. Android can emit frozen DeviceOrientation
  // values while Generic Sensor or DeviceMotion continues producing real readings.
  function motionSample(sample,source){
    if(!motion.active||document.hidden||!sample||![sample.yaw,sample.pitch].every(Number.isFinite))return;
    const now=performance.now();
    const entry=motion.sources[source]||(motion.sources[source]={sample:null,lastChanged:0,lastSeen:0,changes:0,readings:0});
    const prev=entry.sample;
    const deviation=prev?Math.max(Math.abs(wrap(sample.yaw-prev.yaw)),Math.abs(sample.pitch-prev.pitch)):0;
    const moving=!!prev&&deviation>.22;
    entry.sample={...sample};entry.lastSeen=now;entry.readings++;
    if(moving){entry.lastChanged=now;entry.changes++;}
    const chosen=motion.sources[motion.source];
    const chosenStale=!chosen||(!chosen.changes&&now-motion.startedAt>1300)||(chosen.lastChanged&&now-chosen.lastChanged>1800);
    const sourceRank={'deviceorientation':4,'deviceorientationabsolute':3,generic:2,rotationRate:1};
    // Only switch if the new source is demonstrably moving, or if nothing is active.
    // Prefer browser orientation fusion to raw angular velocity when both are alive.
    const use=!motion.source||source===motion.source||(moving&&(chosenStale||(sourceRank[source]>sourceRank[motion.source]&&now-(chosen.lastChanged||0)>400)));
    if(!use)return;
    if(motion.source!==source){
      motion.source=source;motion.anchor=null;motion.base=null;motion.target=null;
      root.dataset.motionSource=source;
    }
    motion.hasReading=true;motion.readings++;motion.sample={...sample};
    if(moving)motion.hasMovement=true;
    root.dataset.motionReadings=String(motion.readings);
    root.dataset.motionChanges=String(entry.changes);
    if(!motion.anchor)motionAnchor(yaw,pitch);
    // Only real movement cancels the fallback and no-motion diagnostics.
    if(moving){
      if(motion.watchdog){clearTimeout(motion.watchdog);motion.watchdog=null;}
      if(motion.fallbackTimer){clearTimeout(motion.fallbackTimer);motion.fallbackTimer=null;}
      if(root.dataset.motionState!=='connected')motionState('connected','Movimento detectado ('+source+').');
      // Report real sensor movement, not mere arrival of constant values.
    }else if(!motion.hasMovement && root.dataset.motionState!=='waiting'){
      motionState('waiting','Leitura recebida. Gire o aparelho para testar o movimento.');
    }
    if(pointer)return;
    const a=motion.anchor,b=motion.base;
    motion.target={yaw:wrap(b.yaw+wrap(sample.yaw-a.yaw)*motionSensitivity),pitch:clamp(b.pitch+(sample.pitch-a.pitch)*motionSensitivity,-80,80)};
  }
  function motionRead(event){
    // Do not throw away Android readings with a null axis. Browsers may send
    // alpha but omit a tilt axis; preserve last known values, then calibrate.
    rawOrientationCount++;lastRawReadingAt=performance.now();
    rawOrientation={alpha:event.alpha,beta:event.beta,gamma:event.gamma};
    const a=Number.isFinite(event.alpha)?event.alpha:null;
    const b=Number.isFinite(event.beta)?event.beta:null;
    const g=Number.isFinite(event.gamma)?event.gamma:null;
    if(a===null&&b===null&&g===null){rawOrientationInvalid++;motionDebug();return;}
    if(b===null||g===null)rawOrientationInvalid++;
    const cached=motion.lastAngles||{};
    const values={alpha:a??cached.alpha??0,beta:b??cached.beta??(Math.abs(window.screen?.orientation?.angle||0)%180===90?0:90),gamma:g??cached.gamma??0};
    motion.lastAngles=values;
    motionSample(deviceAngles(values.alpha,values.beta,values.gamma),event.type==='deviceorientationabsolute'?'deviceorientationabsolute':'deviceorientation');
    motionDebug();
  }
  function motionRateRead(event){
    if(!motion.active||!visible||document.hidden)return;
    const rate=event.rotationRate;
    rawMotionCount++;lastRawReadingAt=performance.now();
    if(rate)rawRates={alpha:rate.alpha,beta:rate.beta,gamma:rate.gamma};
    if(!rate){motionDebug();return;}
    const horizontal=Number(rate.gamma),vertical=Number(rate.beta);
    if(!Number.isFinite(horizontal)&&!Number.isFinite(vertical))return;
    const now=performance.now(),duration=motion.rateAt?Math.min(.08,Math.max(0,(now-motion.rateAt)/1000)):0;
    motion.rateAt=now;
    // RotationRate is an emergency fallback, not a compass. Device axes in
    // portrait correspond approximately to yaw around Y and pitch around X.
    // Integration drifts, so prefer a moving fused orientation when available.
    const screenAngle=Number(window.screen?.orientation?.angle??window.orientation??0);
    const landscape=Math.abs(screenAngle)%180===90;
    // Fallback when a rotation axis is absent: the third available axis can
    // still provide angular velocity, calibrated relative to the scene.
    const yawRate=landscape?(Number(rate.beta)||Number(rate.alpha)||0):(Number(rate.gamma)||Number(rate.alpha)||0);
    const pitchRate=landscape?(Number(rate.gamma)||0):(Number(rate.beta)||0);
    if(duration){
      motion.rateView.yaw=wrap(motion.rateView.yaw-yawRate*duration);
      motion.rateView.pitch=clamp(motion.rateView.pitch+pitchRate*duration,-80,80);
    }
    // Do not take over based on noise around 0 degrees/second.
    if(Math.max(Math.abs(yawRate),Math.abs(pitchRate))>1.2){
      motionSample(motion.rateView,'rotationRate');
    }
    motionDebug();
  }
  function motionGenericStop(){
    if(motion.generic){try{motion.generic.stop()}catch(_){ }motion.generic=null;}
  }
  function motionGenericStart(){
    if(!motion.active||motion.generic)return;
    const Sensor=typeof window.RelativeOrientationSensor==='function'?window.RelativeOrientationSensor:window.AbsoluteOrientationSensor;
    if(typeof Sensor!=='function')return;
    try{
      const sensor=new Sensor({frequency:30});motion.generic=sensor;
      sensor.addEventListener('reading',()=>{
        if(!sensor.quaternion||sensor.quaternion.length!==4)return;
        const [x,y,z,w]=sensor.quaternion;
        if(![x,y,z,w].every(Number.isFinite))return;
        motionSample(quaternionView({x,y,z,w}),'generic');
      });
      sensor.addEventListener('error',event=>{
        const name=event.error?.name||'Erro';console.warn('[Hero360Tour] Sensor API:',name);
        motionGenericStop();
        if(!motion.hasReading)motionState('waiting','Sensor alternativo indisponível. Aguardando orientação do navegador…');
      });
      sensor.start();
    }catch(error){console.warn('[Hero360Tour] Sensor alternativo:',error);motionGenericStop();}
  }
  function motionStop(message='',state='off'){
    motion.active=false;motion.pending=false;motion.anchor=null;motion.base=null;motion.target=null;motion.hasReading=false;motion.hasMovement=false;motion.sample=null;motion.relativeSeen=false;motion.source='';motion.sources=Object.create(null);motion.rateAt=0;
    if(motion.watchdog){clearTimeout(motion.watchdog);motion.watchdog=null;}
    if(motion.fallbackTimer){clearTimeout(motion.fallbackTimer);motion.fallbackTimer=null;}
    window.removeEventListener('deviceorientation',motionRead);
    window.removeEventListener('deviceorientationabsolute',motionRead);
    window.removeEventListener('devicemotion',motionRateRead);
    motionGenericStop();motionSync();motionState(state,message);stopIdle();
  }
  function motionPolicyBlocked(){
    const policy=document.permissionsPolicy||document.featurePolicy;
    if(!policy||typeof policy.allowsFeature!=='function')return false;
    try{return ['accelerometer','gyroscope'].some(feature=>policy.allowsFeature(feature)===false)}catch(_){return false}
  }
  async function motionStart(){
    if(!motionAllowed||!coarse)return;
    if(!window.isSecureContext){motionState('insecure','Sensores exigem HTTPS. Abra a página publicada em HTTPS.');return;}
    if(motionPolicyBlocked()){motionState('blocked','Sensores bloqueados pelo iframe ou pela política do site. Abra o tour na página pública.');return;}
    if(!sensorCapable){motionState('unsupported','Este navegador não disponibiliza sensores de orientação. Use o toque.');return;}
    motion.pending=true;motionSync();motionState('permission','Solicitando acesso aos sensores…');
    try{
      // Both permission requests are started INSIDE the original click gesture.
      // iOS may require separate permissions for DeviceOrientation and DeviceMotion.
      const requests=[];
      const orientationAPI=window.DeviceOrientationEvent;
      const motionAPI=window.DeviceMotionEvent;
      // Do not schedule permission requests through callbacks or timers.
      if(orientationAPI&&typeof orientationAPI.requestPermission==='function')requests.push(Promise.resolve(orientationAPI.requestPermission()));
      if(motionAPI&&typeof motionAPI.requestPermission==='function')requests.push(Promise.resolve(motionAPI.requestPermission()));
      if(requests.length){
        const results=await Promise.allSettled(requests);
        if(results.every(result=>result.status!=='fulfilled'||result.value!=='granted'))throw Error('Permissões de movimento negadas');
      }
      motion.active=true;motion.hasReading=false;motion.hasMovement=false;motion.relativeSeen=false;
      motion.anchor=null;motion.target=null;motion.sample=null;motion.readings=0;
      motion.source='';motion.sources=Object.create(null);motion.lastAngles=null;motion.startedAt=performance.now();motion.rateAt=0;motion.rateView={yaw:0,pitch:0};motion.pending=false;
      root.dataset.motionSource='';root.dataset.motionReadings='0';root.dataset.motionChanges='0';
      window.addEventListener('deviceorientation',motionRead,{passive:true});
      window.addEventListener('deviceorientationabsolute',motionRead,{passive:true});
      window.addEventListener('devicemotion',motionRateRead,{passive:true});
      motionSync();motionState('waiting','Mova o aparelho para verificar se o sensor responde.');
      // A fixed DeviceOrientation stream must NOT prevent Generic Sensor from
      // starting; this was the source starvation bug affecting some Androids.
      motion.fallbackTimer=setTimeout(()=>{if(motion.active&&!motion.hasMovement)motionGenericStart();},1500);
      motion.watchdog=setTimeout(()=>{
        if(!motion.active)return;
        if(!motion.hasReading)motionState('no-data','Nenhum dado recebido. Confira HTTPS, permissões e políticas de sensores do site.');
        else if(!motion.hasMovement)motionState('no-motion','Leituras sem mudança. Gire o aparelho; tente abrir fora do preview.');
      },7000);
    }catch(error){console.warn('[Hero360Tour] Acesso a movimento:',error);motionStop('Permissão de movimento não concedida. Verifique as permissões do navegador.','denied');}
  }
  function motionRecalibrate(){
    if(!motion.active)return;
    const base=motion.sceneView;
    yaw=base.yaw;pitch=base.pitch;transition=null;motionAnchor(base.yaw,base.pitch);dirty=true;stopIdle();
    motionMessage('Visão recentralizada.');
  }
  if(motionBox){
    motionBox.hidden=!(motionAllowed&&coarse);
    if(motionAllowed&&coarse&&!window.isSecureContext)motionState('insecure','Abra a página em HTTPS para usar movimento.');
    else if(motionAllowed&&coarse&&motionPolicyBlocked())motionState('blocked','Preview com sensores bloqueados. Teste a página publicada em HTTPS.');
    else if(motionAllowed&&coarse&&!sensorCapable)motionState('unsupported','Sensor de orientação indisponível neste navegador.');
  }
  if(motionButton)motionButton.addEventListener('click',()=>{if(motion.active)motionStop();else motionStart();});
  if(motionReset)motionReset.addEventListener('click',motionRecalibrate);
  function handleScreenRotation(){if(motion.active){motion.anchor=null;motion.target=null;motion.rateView={yaw:0,pitch:0};motion.rateAt=0;dirty=true;motionMessage('Orientação alterada. Recalibrando…');}}
  on(window,'orientationchange',handleScreenRotation);
  if(window.screen?.orientation?.addEventListener)on(window.screen.orientation,'change',handleScreenRotation);
  motionSync();
  if(motionAllowed&&coarse&&sensorCapable&&motionAuto&&typeof window.DeviceOrientationEvent?.requestPermission!=='function')motionStart();

  function on(t,e,f,opt){t.addEventListener(e,f,opt);disposers.push(()=>t.removeEventListener(e,f,opt));}
  function resetHero(){if(hero.eyebrow)hero.eyebrow.textContent=defaults.eyebrow;if(hero.headline)hero.headline.textContent=defaults.headline;if(hero.body)hero.body.textContent=defaults.body;stage.classList.remove('ims360-spot-selected')}
  function setHero(h,s){if(hero.eyebrow)hero.eyebrow.textContent=h.bannerEyebrow||h.heroEyebrow||h.text||s.title||'';if(hero.headline)hero.headline.textContent=h.bannerHeadline||h.heroHeadline||h.text||s.title||'';if(hero.body)hero.body.textContent=h.bannerBody||h.heroSubheadline||h.info||'';stage.classList.add('ims360-spot-selected')}
  function stopIdle(){interactionAt=performance.now();idleAnchor=null}
  function animateTo(y,p,h=null){const start=performance.now();const orig={yaw,pitch,hfov};transition={start,from:orig,to:{yaw:yaw+wrap(y-yaw),pitch:clamp(p,-80,80),hfov:h||hfov},duration:reduced?.matches?0:750};stopIdle();dirty=true}
  function useCanvas2D(reason){
    if(!gl)return;
    console.warn('[Hero360Tour] Recuperação em Canvas 2D:',reason);
    try{engine.destroy()}catch(_){}
    const replacement=document.createElement('canvas');
    replacement.className=canvas.className;
    replacement.setAttribute('aria-label',canvas.getAttribute('aria-label')||'Panorama 360 interativo');
    canvas.replaceWith(replacement);canvas=replacement;
    engine=createCPU(canvas);gl=null;
    if(!engine)throw Error('O navegador não disponibilizou Canvas 2D');
    root.dataset.ims360Renderer='canvas2d';bindCanvasEvents();resize();
  }
  function revealFirstFrame(){
    if(!firstFramePending)return;
    firstFramePending=false;
    root.dataset.ims360Loaded='true';
    if(poster){
      // Keep the photograph displayed until the interactive panorama has actually painted.
      poster.classList.add('ims360-ready');
      window.setTimeout(()=>{if(!firstFramePending)poster.hidden=true;},360);
    }
    if(err)err.hidden=true;
  }
  function uploadImage(img){
    lastLoadedImage=img;
    const w=img.naturalWidth,h=img.naturalHeight;
    if(!w||!h)throw Error('Imagem sem dimensões');
    const max=Math.min(engine.maxTexture,gl?4096:2048);const outWidth=Math.max(256,Math.min(w,max));const outHeight=Math.max(128,Math.round(outWidth/2));
    const off=document.createElement('canvas');off.width=outWidth;off.height=outHeight;
    const ctx=off.getContext('2d',{alpha:false});if(!ctx)throw Error('Canvas de panorama indisponível');
    ctx.drawImage(img,0,0,outWidth,outHeight);
    if(gl){
      try {
        gl.bindTexture(gl.TEXTURE_2D,engine.tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,off);
        const glError=gl.getError();
        if(glError!==gl.NO_ERROR)throw new Error('Falha na textura WebGL: '+glError);
      } catch(error) {
        useCanvas2D(error);
      }
    }
    if(!gl){
      const raw=ctx.getImageData(0,0,outWidth,outHeight);
      engine.src=raw.data;engine.sw=outWidth;engine.sh=outHeight;
    }
    engine.textureReady=true;dirty=true;firstFramePending=true;
    root.dataset.ims360Loaded='rendering';
  }
  function loadScene(id,targetView){
    if(!scenes[id]?.panorama)return;
    const serial=++sequence;
    const s=scenes[id];sceneId=id;label.textContent=s.title||id;
    resetHero();stopIdle();transition=null;
    const v=targetView||s.initialView||{};yaw=Number.isFinite(Number(v.yaw))?wrap(Number(v.yaw)):0;pitch=clamp(v.pitch??0,-80,80);hfov=clamp(v.hfov??root.dataset.heroHfov??118,50,140);
    motion.sceneView={yaw,pitch};motion.anchor=null;motion.target=null;
    hotspots=[];hotspotLayer.replaceChildren();
    for(const spot of s.hotspots||[]){
      const el=document.createElement('div');el.className='ims360-hotspot-shell';el.dataset.hotspotId=spot.id||'';el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label',spot.text||'Ponto de interesse');
      const scale=document.createElement('div');scale.className='hotspot-scale';const perspective=document.createElement('div');perspective.className='hotspot-perspective';const pulse=document.createElement('span');pulse.className='hotspot-pulse';perspective.appendChild(pulse);
      const rotate=document.createElement('div');rotate.className='hotspot-rotate';rotate.style.transform=`rotate(${Number(spot.rotation)||0}deg)`;
      const icon=document.createElement('div');icon.className='hotspot-icon';icon.innerHTML=glyph(spot.type);rotate.appendChild(icon);perspective.appendChild(rotate);scale.appendChild(perspective);el.appendChild(scale);
      const strength=clamp(spot.perspectiveStrength??1,0,2),floor=clamp(-Number(spot.pitch||0)/48,0,1),tilt=spot.perspective===false?0:(6+floor*70)*strength,depth=spot.perspective===false?1:1-floor*.18*strength,vertical=spot.perspective===false?1:1-floor*.22*strength,ss=clamp(spot.scale??1,.5,2)*depth;
      perspective.style.transform=`perspective(220px) rotateX(${tilt}deg) scale(${ss},${ss*vertical})`;
      if(spot.text){const name=document.createElement('span');name.className='ims360-hotspot-tooltip';name.textContent=spot.text;el.append(name)}
      function activate(e){e.preventDefault();e.stopPropagation();stopIdle();if(spot.type==='navigation'&&scenes[spot.targetSceneId]?.panorama){loadScene(spot.targetSceneId,spot.targetView);return;}if(spot.type==='info'){animateTo(Number(spot.yaw)||0,Number(spot.pitch)||0);setHero(spot,s);return;}if(spot.type==='external'){const url=safeUrl(spot.url);if(url)window.open(url,'_blank','noopener,noreferrer');}}
      el.addEventListener('click',activate);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')activate(e)});
      hotspotLayer.appendChild(el);hotspots.push({spot,el});
    }
    root.dataset.ims360Loaded='false';
    firstFramePending=false;lastLoadedImage=null;engine.textureReady=false;
    if(poster){poster.classList.remove('ims360-ready');poster.hidden=false;poster.src=s.panorama;}
    const image=new Image();image.decoding='async';
    if(/^https?:\/\//i.test(String(s.panorama)))image.crossOrigin='anonymous';
    image.onload=()=>{if(disposed||serial!==sequence)return;try{uploadImage(image);}catch(error){showError(error)}};
    image.onerror=()=>{if(!disposed&&serial===sequence)showError(new Error('Falha ao carregar panorama: '+s.panorama))};
    image.src=s.panorama;
    dirty=true;
  }
  function showError(error){
    console.warn('[Hero360Tour]',error);
    firstFramePending=false;
    root.dataset.ims360Loaded='error';
    if(poster){poster.classList.remove('ims360-ready');poster.hidden=false;}
    if(err){err.textContent='Não foi possível abrir o panorama interativo. Verifique a imagem 360 ou a permissão de acesso; a imagem original permanece visível.';err.hidden=false;}
  }
  function resize(){const w=Math.max(1,Math.floor(view.clientWidth)),h=Math.max(1,Math.floor(view.clientHeight));const dpr=Math.min(window.devicePixelRatio||1,1.5);const scale=gl?dpr:Math.min(1,560/w);const tw=Math.max(1,Math.round(w*scale)),th=Math.max(1,Math.round(h*scale));if(canvas.width!==tw||canvas.height!==th){canvas.width=tw;canvas.height=th;canvas.style.width=w+'px';canvas.style.height=h+'px';if(gl)gl.viewport(0,0,tw,th);dirty=true;} }
  function projectSpots(){
    const w=view.clientWidth,h=view.clientHeight;if(!w||!h)return;
    const aspect=w/h,tanHalf=Math.tan(rad(hfov)/2),cy=Math.cos(rad(yaw)),sy=Math.sin(rad(yaw)),cp=Math.cos(rad(pitch)),sp=Math.sin(rad(pitch));
    for(const {spot,el} of hotspots){const a=rad(Number(spot.yaw)||0),b=rad(Number(spot.pitch)||0),worldX=Math.sin(a)*Math.cos(b),worldY=Math.sin(b),worldZ=Math.cos(a)*Math.cos(b);
      const x=cy*worldX-sy*worldZ,z0=sy*worldX+cy*worldZ,y=cp*worldY-sp*z0,z=sp*worldY+cp*z0;
      if(z<=.01){el.hidden=true;continue;}
      const u=(x/z)/tanHalf,v=(y/z)*aspect/tanHalf;
      el.hidden=Math.abs(u)>1.09||Math.abs(v)>1.09;
      if(!el.hidden){el.style.left=((u+1)*w/2)+'px';el.style.top=((1-v)*h/2)+'px';}
    }
  }
  function render(){
    if(!engine.textureReady)return;
    resize();
    if(gl){gl.useProgram(engine.program);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,engine.tex);
    gl.uniform2f(engine.uniforms.resolution,canvas.width,canvas.height);
    gl.uniform1f(engine.uniforms.yaw,rad(yaw));gl.uniform1f(engine.uniforms.pitch,rad(pitch));gl.uniform1f(engine.uniforms.tanHalf,Math.tan(rad(hfov)/2));
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    const error=gl.getError();
    if(error!==gl.NO_ERROR){
      try{useCanvas2D('Erro WebGL ao desenhar: '+error);if(lastLoadedImage)uploadImage(lastLoadedImage);}catch(e){showError(e)}
      return;
    }
    // An incomplete texture can return NO_ERROR and still paint a completely black frame.
    // Inspect four small samples only on the first frame. Avoid showing a black preview.
    if(firstFramePending){
      try{
        const pixel=new Uint8Array(4);
        let hasVisibleColor=false;
        for(const [x,y] of [[.25,.25],[.75,.25],[.25,.75],[.75,.75],[.5,.5]]){
          gl.readPixels(Math.min(canvas.width-1,Math.floor(canvas.width*x)),Math.min(canvas.height-1,Math.floor(canvas.height*y)),1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
          if(pixel[0]>7||pixel[1]>7||pixel[2]>7){hasVisibleColor=true;break;}
        }
        if(!hasVisibleColor || gl.getError()!==gl.NO_ERROR){
          useCanvas2D('O primeiro quadro WebGL permaneceu preto');
          if(lastLoadedImage)uploadImage(lastLoadedImage);
          return;
        }
      }catch(error){
        try{useCanvas2D(error);if(lastLoadedImage)uploadImage(lastLoadedImage);}catch(fallbackError){showError(fallbackError)}
        return;
      }
    }}
    else {drawCPU(canvas,engine,yaw,pitch,hfov);engine.lastDraw=performance.now();}
    revealFirstFrame();projectSpots();dirty=false;
  }
  function tick(t){if(disposed)return;
    const sensorTickTime=t;
    if(transition){const e=transition.duration?clamp((t-transition.start)/transition.duration,0,1):1,sm=e*e*(3-2*e);yaw=wrap(transition.from.yaw+(transition.to.yaw-transition.from.yaw)*sm);pitch=transition.from.pitch+(transition.to.pitch-transition.from.pitch)*sm;hfov=transition.from.hfov+(transition.to.hfov-transition.from.hfov)*sm;dirty=true;if(e>=1){transition=null;if(motion.active)motionAnchor(yaw,pitch);}}
    else if(motion.active&&motion.target&&visible&&!document.hidden&&!pointer){const dt=Math.min(80,Math.max(1,t-motion.lastTick));const tau=motionSmoothing===0?0:12+motionSmoothing*3.0;const k=tau===0?1:1-Math.exp(-dt/tau);yaw=wrap(yaw+wrap(motion.target.yaw-yaw)*k);pitch=clamp(pitch+(motion.target.pitch-pitch)*k,-80,80);dirty=true;}
    else if(!motion.active&&!reduced?.matches&&visible&&t-interactionAt>=idleMs){if(!idleAnchor)idleAnchor={t,yaw,pitch};const dt=(t-idleAnchor.t)/cycleMs*Math.PI*2;yaw=wrap(idleAnchor.yaw+Math.sin(dt)*swayYaw);pitch=clamp(idleAnchor.pitch+Math.sin(dt*.63)*swayPitch,-80,80);dirty=true;}
    motion.lastTick=sensorTickTime;
    if(motion.active){root.dataset.motionViewYaw=yaw.toFixed(2);root.dataset.motionViewPitch=pitch.toFixed(2);if(debugOpened&&Math.round(t/400)!==Math.round((t-16)/400))motionDebug();}
    if(visible&&dirty&&(gl||t-engine.lastDraw>115))render();frame=requestAnimationFrame(tick);
  }
  // Gesture arbitration: page scrolling always wins over vertical touch gestures.
  // The camera uses at most 100px of vertical mouse drag; horizontal rotation remains unrestricted.
  const VERTICAL_DRAG_LIMIT=100;
  function pdown(e){
    if(e.button!==0 || (e.pointerType==='touch' && e.isPrimary===false))return;
    if(motion.active&&!motionTouchEnabled)return;
    const touch=e.pointerType==='touch';
    pointer={id:e.pointerId,x:e.clientX,y:e.clientY,yaw,pitch,touch,axis:touch?'pending':'drag'};
    transition=null;stopIdle();
    // Do not capture touch until a horizontal gesture is identified, so the browser can pan vertically.
    if(!touch)try{canvas.setPointerCapture?.(e.pointerId)}catch(_){}
  }
  function pmove(e){
    if(!pointer||pointer.id!==e.pointerId)return;
    const deltaX=e.clientX-pointer.x,deltaY=e.clientY-pointer.y;
    if(pointer.touch && pointer.axis==='pending'){
      if(Math.max(Math.abs(deltaX),Math.abs(deltaY))<8)return;
      if(Math.abs(deltaY)>Math.abs(deltaX)){
        // touch-action:pan-y gives the vertical gesture directly to native document scrolling.
        pointer=null;return;
      }
      pointer.axis='horizontal';
      try{canvas.setPointerCapture?.(e.pointerId)}catch(_){}
    }
    const gain=hfov/Math.max(200,view.clientWidth);
    yaw=wrap(pointer.yaw-deltaX*gain);
    // Never consume more than 100px on the vertical axis while dragging the panorama.
    pitch=clamp(pointer.pitch+clamp(deltaY,-VERTICAL_DRAG_LIMIT,VERTICAL_DRAG_LIMIT)*gain,-80,80);
    dirty=true;stopIdle();
  }
  function pup(e){
    if(pointer?.id!==e.pointerId)return;
    pointer=null;stopIdle();
    if(motion.active){motionAnchor(yaw,pitch);}
    try{if(canvas.hasPointerCapture?.(e.pointerId))canvas.releasePointerCapture(e.pointerId)}catch(_){}
  }
  function zoom(delta){hfov=clamp(hfov+delta,50,140);dirty=true;stopIdle();}
  function bindCanvasEvents(){on(canvas,'pointerdown',pdown);on(canvas,'pointermove',pmove);on(canvas,'pointerup',pup);on(canvas,'pointercancel',pup);on(canvas,'keydown',keyControl);canvas.tabIndex=0;}
  // No wheel handler: wheel / trackpad scroll the landing page, not the panorama.
  const navigationPanelEnabled=root.dataset.navigationPanel==='true';
  function keyControl(e){let handled=true;if(e.key==='ArrowLeft')yaw=wrap(yaw-5);else if(e.key==='ArrowRight')yaw=wrap(yaw+5);else if(e.key==='ArrowUp')pitch=clamp(pitch+5,-80,80);else if(e.key==='ArrowDown')pitch=clamp(pitch-5,-80,80);else if(navigationPanelEnabled&&(e.key==='+'||e.key==='='))zoom(-5);else if(navigationPanelEnabled&&e.key==='-')zoom(5);else handled=false;if(handled){e.preventDefault();stopIdle();dirty=true;if(motion.active)motionAnchor(yaw,pitch)}}
  bindCanvasEvents();
  on(canvas,'webglcontextlost',e=>{
    e.preventDefault();
    try{
      useCanvas2D('Contexto gráfico perdido');
      if(lastLoadedImage)uploadImage(lastLoadedImage);
    }catch(error){showError(error)}
  });
  // Navigation toolbar is opt-in. Legacy sections without this prop stay uncluttered.
  if(navigationPanelEnabled){
    const controls=document.createElement('div');
    controls.className='ims360-controls';
    controls.setAttribute('role','group');
    controls.setAttribute('aria-label','Painel de navegação do panorama');
    controls.innerHTML='<button type="button" data-action="zoom-in" aria-label="Aproximar">+</button><button type="button" data-action="zoom-out" aria-label="Afastar">−</button><button type="button" data-action="fullscreen" aria-label="Tela cheia">⛶</button>';
    view.appendChild(controls);
    controls.querySelector('[data-action="zoom-in"]').addEventListener('click',()=>zoom(-7));
    controls.querySelector('[data-action="zoom-out"]').addEventListener('click',()=>zoom(7));
    controls.querySelector('[data-action="fullscreen"]').addEventListener('click',()=>{if(document.fullscreenElement)document.exitFullscreen?.();else stage.requestFullscreen?.()});
  }
  const toggle=root.querySelector('.ims360-scene-toggle'),menu=root.querySelector('.ims360-scene-list');
  if(toggle&&menu){const enabled=root.dataset.scenesMenu==='true';toggle.hidden=!enabled;menu.hidden=true;if(enabled){const id='ims360-scene-menu-'+Math.random().toString(36).slice(2);menu.id=id;toggle.setAttribute('aria-controls',id);toggle.addEventListener('click',()=>{menu.hidden=!menu.hidden;toggle.setAttribute('aria-expanded',String(!menu.hidden))});for(const id of order){const btn=document.createElement('button');btn.type='button';btn.textContent=scenes[id].title||id;btn.addEventListener('click',()=>{loadScene(id);menu.hidden=true;toggle.setAttribute('aria-expanded','false')});menu.append(btn)}}}
  const oldNav=root.querySelector('.ims360-navigation');if(oldNav)oldNav.hidden=true;
  if('ResizeObserver' in window){resizeObserver=new ResizeObserver(()=>{resize();dirty=true});resizeObserver.observe(stage);resizeObserver.observe(view);}
  on(window,'resize',()=>{resize();dirty=true});
  if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{visible=!!entries[0]?.isIntersecting;if(visible)dirty=true},{threshold:.01});observer.observe(stage);disposers.push(()=>observer.disconnect())}
  const removal=new MutationObserver(()=>{if(!root.isConnected){disposed=true;cancelAnimationFrame(frame);resizeObserver?.disconnect();motionStop();for(const f of disposers)f();engine.destroy();removal.disconnect();instances.delete(root)}});removal.observe(document.documentElement,{childList:true,subtree:true});
  instances.set(root,{getView:()=>({yaw,pitch,hfov}),loadScene,gl:engine.gl});
  loadScene(sceneId);resize();frame=requestAnimationFrame(tick);
 }
 function scan(){document.querySelectorAll(`[data-plugin="${ID}"] .ims360`).forEach(initialize)}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan,{once:true});else scan();
 new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
})();


(function(){})();


(function(){})();


(function(){function setup(root){if(root.dataset.bsInitialized==='1')return;root.dataset.bsInitialized='1';root.querySelectorAll('.bs-filter').forEach(button=>{button.addEventListener('click',()=>{const filter=button.dataset.bsFilter;root.querySelectorAll('.bs-filter').forEach(b=>{const active=b===button;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active))});root.querySelectorAll('.bs-card').forEach(c=>{c.hidden=filter!=='*'&&c.dataset.bsCategory!==filter})})});if(root.dataset.bsMotion==='none'||matchMedia('(prefers-reduced-motion: reduce)').matches||!('IntersectionObserver'in window))return;const cards=[...root.querySelectorAll('.bs-card')];root.classList.add('bs-motion-ready');const obs=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('bs-visible');obs.unobserve(entry.target)}})},{threshold:.12,rootMargin:'0px 0px -20px 0px'});cards.forEach(c=>obs.observe(c));}function init(){document.querySelectorAll('[data-plugin="benefits-showcase"]').forEach(setup)}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();window.ImobifyBenefitsShowcaseInit=init;})();

(function(){
  function init(){
    document.querySelectorAll('[data-plugin="gallery-big-four"]:not([data-ready])').forEach(function(root){
      root.dataset.ready='true';
      var items=root.querySelectorAll('.pp-big-four-item');
      items.forEach(function(item,index){
        item.setAttribute('role','button');
        item.setAttribute('aria-label',item.querySelector('strong')?.textContent||('Imagem '+(index+1)));
        function activate(){items.forEach(function(other){if(other!==item)other.classList.remove('is-active')});item.classList.toggle('is-active');}
        item.addEventListener('click',activate);
        item.addEventListener('keydown',function(event){if(event.key==='Enter'||event.key===' '){event.preventDefault();activate();}});
      });
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();


(function(){
  'use strict';

  function decodeHtml(value){
    return String(value || '').replace(/&amp;/gi, '&').trim();
  }

  function extractIframeSrc(value){
    var text = decodeHtml(value);
    var match = text.match(/<iframe[\s\S]*?\bsrc\s*=\s*["']([^"']+)["']/i);
    return match && match[1] ? decodeHtml(match[1]) : text;
  }

  function safeUrl(value){
    var text = extractIframeSrc(value);
    if (!/^https?:\/\//i.test(text)) return '';
    try { return new URL(text); } catch (e) { return ''; }
  }

  function embedFromUrl(value, address){
    var parsed = safeUrl(value);
    var fallback = String(address || '').trim();

    if (parsed) {
      var host = parsed.hostname.toLowerCase();
      var isGoogle = host === 'google.com' || host.endsWith('.google.com') || host === 'maps.google.com' || host === 'maps.app.goo.gl';

      if (isGoogle) {
        if (/\/maps\/embed/i.test(parsed.pathname) || parsed.searchParams.get('output') === 'embed') {
          return parsed.href;
        }

        var q = parsed.searchParams.get('q') || parsed.searchParams.get('query') || parsed.searchParams.get('ll');
        if (q) {
          return 'https://www.google.com/maps?q=' + encodeURIComponent(q) + '&output=embed';
        }

        var coords = parsed.href.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
        if (coords) {
          return 'https://www.google.com/maps?q=' + encodeURIComponent(coords[1] + ',' + coords[2]) + '&output=embed';
        }
      }
    }

    if (fallback) {
      return 'https://www.google.com/maps?q=' + encodeURIComponent(fallback) + '&output=embed';
    }

    return '';
  }

  function renderMap(section){
    if (!section) return;

    var map = section.querySelector('.location-map');
    if (!map) return;

    var link = map.querySelector('a');
    var addressNode = section.querySelector('.location-layout .address');
    var address = addressNode ? addressNode.textContent.trim() : '';
    var source = link ? (link.getAttribute('href') || '') : '';
    var src = embedFromUrl(source, address);
    if (!src) return;

    var frame = map.querySelector('iframe.location-map-frame');
    if (!frame) {
      frame = document.createElement('iframe');
      frame.className = 'location-map-frame';
      frame.setAttribute('title', 'Localização no Google Maps');
      frame.setAttribute('loading', 'lazy');
      frame.setAttribute('allowfullscreen', '');
      frame.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
      map.insertBefore(frame, map.firstChild);
    }

    if (frame.getAttribute('src') !== src) frame.setAttribute('src', src);
    if (window.__IMOBIFY_EDITOR__) frame.style.pointerEvents = 'none';
    map.classList.add('has-google-map');
  }

  function enhancePlaces(section){
    section.querySelectorAll('.location-places li').forEach(function(item){
      if (item.querySelector('strong')) return;
      var raw = (item.textContent || '').trim();
      var separator = raw.indexOf('|');
      if (separator < 0) return;
      var time = raw.slice(0, separator).trim();
      var place = raw.slice(separator + 1).trim();
      item.textContent = '';
      var strong = document.createElement('strong');
      var span = document.createElement('span');
      strong.textContent = time;
      span.textContent = place;
      item.append(strong, span);
    });
  }

  function boot(scope){
    var root = scope && scope.querySelectorAll ? scope : document;
    root.querySelectorAll('.location-section').forEach(function(section){
      enhancePlaces(section);
      renderMap(section);
    });
  }

  function start(){
    boot(document);
    if (!document.documentElement) return;
    new MutationObserver(function(mutations){
      var needsRender = mutations.some(function(mutation){ return mutation.addedNodes && mutation.addedNodes.length; });
      if (needsRender) boot(document);
    }).observe(document.documentElement, {childList:true, subtree:true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();


(function(){})();


(function(){document.querySelectorAll('[data-plugin="faq"] details').forEach(item=>item.addEventListener('toggle',()=>{if(item.open)window.Imobify&&Imobify.track('faq_open',{question:item.querySelector('summary').textContent.replace('+','').trim()});}));})();


/* Agendamento Sender 1.3.0 — FormSender v4 POST contract */
(function(){
  'use strict';
  var ROOT='[data-plugin="agendamento-sender"] [data-ags-mount]';
  var WEEK=['DOMINGO','SEGUNDA','TERÇA','QUARTA','QUINTA','SEXTA','SÁBADO'];
  var MONTH=['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
  function bool(value){return value===true||value==='true'||value==='1'||value==='on';}
  function num(value,min,max,fallback){var n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.round(n))):fallback;}
  function safe(value){return String(value == null?'':value).trim();}
  // Calendário civil no fuso do empreendimento; UTC-only internamente para não sofrer desvios do navegador.
  function iso(date){return date.getUTCFullYear()+'-'+String(date.getUTCMonth()+1).padStart(2,'0')+'-'+String(date.getUTCDate()).padStart(2,'0');}
  function civilDate(y,m,d){return new Date(Date.UTC(y,m-1,d,12,0,0));}
  function addDays(date,days){var clone=new Date(date.getTime());clone.setUTCDate(clone.getUTCDate()+days);return clone;}
  function format(date){return String(date.getUTCDate()).padStart(2,'0')+'/'+String(date.getUTCMonth()+1).padStart(2,'0')+'/'+date.getUTCFullYear();}
  function label(date){return WEEK[date.getUTCDay()].toLowerCase()+', '+format(date);}
  function validTimeZone(tz){try{new Intl.DateTimeFormat('pt-BR',{timeZone:tz}).format(new Date());return tz;}catch(_){return 'America/Sao_Paulo';}}
  function todayAtTimeZone(tz){
    var fields=new Intl.DateTimeFormat('en-US',{timeZone:tz,year:'numeric',month:'numeric',day:'numeric'}).formatToParts(new Date());
    var o={};fields.forEach(function(item){if(item.type!=='literal')o[item.type]=+item.value;});
    return civilDate(o.year,o.month,o.day);
  }
  function stampAtTimeZone(tz){return new Intl.DateTimeFormat('pt-BR',{timeZone:tz,dateStyle:'short',timeStyle:'medium'}).format(new Date())+' ('+tz+')';}
  function escapeHtml(value){return String(value).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});}
  function eligibleDate(date,config){
    if(config.blocked.has(iso(date)))return {available:false,reason:'Data bloqueada para visitas'};
    if(!config.weekdays[date.getUTCDay()])return {available:false,reason:'Dia da semana não atendido'};
    if(!config.turnsByDay[date.getUTCDay()].length)return {available:false,reason:'Sem turnos disponíveis neste dia'};
    return {available:true,reason:''};
  }
  function makeDates(config){
    var today=todayAtTimeZone(config.timeZone), dates=[];
    for(var offset=config.leadDays;offset<=config.horizonDays;offset++){
      var d=addDays(today,offset), availability=eligibleDate(d,config);
      dates.push({date:d,available:availability.available,reason:availability.reason});
    }
    return dates;
  }
  // Feedback visual do FormSender V4: usa notify_Send_notification quando disponível.
  // Fallback autônomo para landing pages que usam apenas Agendamento Sender.
  var noticeGlyphs={
    success:'<path d="m5 12 4 4L19 6"/>',
    error:'<path d="m6 6 12 12M18 6 6 18"/>',
    warning:'<path d="M12 8v5m0 3h.01"/><path d="m10.3 3.9-8.5 14.7A2 2 0 0 0 3.5 21h17a2 2 0 0 0 1.7-2.4L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
    info:'<path d="M12 11v6m0-10h.01"/><circle cx="12" cy="12" r="10"/>'
  };
  function notify(mount,type,message,title){
    var external=window.notify_Send_notification;
    if(typeof external==='function'){
      try{external(type,message,title);return;}catch(err){console.warn('[Agendamento Sender] Notificação externa indisponível:',err);}
    }
    var stack=document.getElementById('ags-notification-container');
    if(!stack){
      stack=document.createElement('div');stack.id='ags-notification-container';
      stack.className='ags-notification-container';stack.setAttribute('aria-live','polite');
      stack.setAttribute('aria-relevant','additions');document.body.appendChild(stack);
    }
    var notice=document.createElement('div');notice.className='ags-notification '+(noticeGlyphs[type]?type:'info');
    notice.setAttribute('role',type==='error'?'alert':'status');
    var avatar=document.createElement('span');avatar.className='ags-notification-avatar';avatar.setAttribute('aria-hidden','true');
    avatar.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">'+noticeGlyphs[type||'info']+'</svg>';
    var content=document.createElement('span');content.className='ags-notification-content';
    var heading=document.createElement('strong');heading.className='ags-notification-title';heading.textContent=title||'Agendamento';
    var detail=document.createElement('span');detail.className='ags-notification-message';detail.textContent=message;
    content.appendChild(heading);content.appendChild(detail);
    var close=document.createElement('button');close.type='button';close.className='ags-notification-close';close.setAttribute('aria-label','Fechar notificação');close.textContent='×';
    var bar=document.createElement('span');bar.className='ags-notification-progress';bar.setAttribute('aria-hidden','true');
    notice.appendChild(avatar);notice.appendChild(content);notice.appendChild(close);notice.appendChild(bar);
    Array.from(stack.children).forEach(function(previous){previous.remove();});
    stack.appendChild(notice);
    var timer=0;
    function dismiss(){window.clearTimeout(timer);notice.classList.remove('show');notice.classList.add('hide');window.setTimeout(function(){notice.remove();},300);}
    close.addEventListener('click',dismiss);
    window.requestAnimationFrame(function(){notice.classList.add('show');bar.classList.add('running');});
    timer=window.setTimeout(dismiss,type==='error'?7500:5500);
  }
  function init(mount){
    if(mount.dataset.agsReady==='true')return;
    mount.dataset.agsReady='true';
    var settings=mount.dataset;
    var allTurns=safe(settings.turns).split('|').map(safe).filter(Boolean);if(!allTurns.length)allTurns=['Manhã','Tarde','Noite'];
    var timeZone=validTimeZone(safe(settings.timeZone)||'America/Sao_Paulo');
    function resolveTurns(key){var v=safe(settings[key]||'all').toLowerCase();if(v==='none')return [];if(v==='all')return allTurns.slice();return v.split(',').map(function(v){return Number(v.trim())-1;}).filter(function(i){return Number.isInteger(i)&&i>=0&&i<allTurns.length;}).map(function(i){return allTurns[i];});}
    var config={leadDays:num(settings.leadDays,0,30,1),horizonDays:num(settings.horizonDays,7,180,60),
      visibleDays:num(settings.visibleDays,3,8,6),
      weekdays:['allowSunday','allowMonday','allowTuesday','allowWednesday','allowThursday','allowFriday','allowSaturday'].map(function(key){return bool(settings[key]);}),
      timeZone:timeZone,turnsByDay:['sundayTurns','mondayTurns','tuesdayTurns','wednesdayTurns','thursdayTurns','fridayTurns','saturdayTurns'].map(resolveTurns),
      blocked:new Set(safe(settings.blockedDates).split(/[\s,;|]+/).filter(function(s){return /^\d{4}-\d{2}-\d{2}$/.test(s);}))};
    config.horizonDays=Math.max(config.leadDays,config.horizonDays);
    var dates=makeDates(config),dayWrap=mount.querySelector('.ags-day-list'),prev=mount.querySelector('.ags-prev'),next=mount.querySelector('.ags-next'),
      form=mount.querySelector('.ags-form'),status=mount.querySelector('.ags-status'),submit=mount.querySelector('.ags-submit'),
      email=form.querySelector('[name=email]'),turn=form.querySelector('[name=turnoPreferido]'),phone=form.querySelector('[name=telefone]');
    if(!dayWrap||!form||!prev||!next)return;
    var firstAvailable=dates.findIndex(function(d){return d.available;});
    var selected=firstAvailable>=0?iso(dates[firstAvailable].date):'',page=0,busy=false;
    // Start with the first actual available day instead of a page containing only disabled dates.
    if(firstAvailable>=0)page=Math.floor(firstAvailable/config.visibleDays)*config.visibleDays;
    var section=mount.closest('.ags-section');
    if(section){
      var preset=safe(section.dataset.agsPreset)||'auto',profile=safe(section.dataset.agsProjectProfile).toLowerCase();
      if(preset==='auto')preset=/popular|firsthome|patio|urgency|mcmv|familia/.test(profile)?'popular':/luxury|exclusive|premium|sophisticat|alto-padrao/.test(profile)?'editorial':/invest|nautic|resort/.test(profile)?'immersive':'contemporary';
      if(!/^(popular|contemporary|sophisticated|minimal|spotlight|immersive|editorial)$/.test(preset))preset='contemporary';
      section.dataset.agsEffectivePreset=preset;
    }
    var shifts=function(){return window.matchMedia&&window.matchMedia('(max-width: 570px)').matches?3:config.visibleDays;};
    function statusShow(text,kind){status.textContent=text;status.className='ags-status'+(kind?' is-'+kind:'');}
    function feedback(text,kind,title){statusShow(text,kind);notify(mount,kind==='error'?'error':kind==='success'?'success':kind==='warning'?'warning':'info',text,title);}
    function dateTurns(){var item=dates.find(function(item){return item.available&&iso(item.date)===selected;});return item?config.turnsByDay[item.date.getUTCDay()]:[];}
    function syncTurns(){
      var options=dateTurns(),prior=turn.value||safe(settings.defaultTurn);
      turn.innerHTML='';options.forEach(function(value){var opt=document.createElement('option');opt.value=value;opt.textContent=value;turn.appendChild(opt);});
      if(options.includes(prior))turn.value=prior;else if(options.includes(settings.defaultTurn))turn.value=settings.defaultTurn;
      turn.disabled=!options.length;
    }
    var zoneLabel=mount.querySelector('.ags-time-zone-label');if(zoneLabel)zoneLabel.textContent='Datas e turnos no fuso: '+timeZone.replace(/_/g,' ');
    var conversion=mount.querySelector('[data-ags-conversion]');
    var showPanel=bool(settings.showConversionPanel)&&section&&section.dataset.agsConversionLayout!=='compact';
    if(section){section.classList.toggle('ags-has-conversion',!!showPanel);section.classList.toggle('ags-no-conversion',!showPanel);}
    // Um unico CTA visivel: painel ativo envia o formulario; caso contrario, apenas aviaozinho.
    var panelSubmit=conversion?conversion.querySelector('[data-ags-send]'):null;
    submit.hidden=!!showPanel;
    submit.setAttribute('aria-hidden',showPanel?'true':'false');
    if(conversion){
      conversion.hidden=!showPanel;
      if(panelSubmit){
        panelSubmit.hidden=!showPanel;
        panelSubmit.addEventListener('click',function(){
          if(busy||panelSubmit.disabled)return;
          // Delegar ao mesmo evento submit preserva toda a validacao e contrato FormSender.
          if(typeof form.requestSubmit==='function')form.requestSubmit(submit);
          else submit.click();
        });
      }
    }
    syncTurns();
    var showEmail=bool(settings.showEmail), requireEmail=bool(settings.requireEmail);
    email.hidden=!showEmail;email.required=showEmail&&requireEmail;
    if(!showEmail){email.disabled=true;form.classList.add('ags-no-email');}
    function draw(){
      var visible=shifts(),slice=dates.slice(page,page+visible);
      dayWrap.style.setProperty('--ags-visible',String(visible));
      dayWrap.innerHTML=slice.map(function(item){
        var d=item.date,value=iso(d),active=item.available&&value===selected;
        var unavailable=!item.available,reason=unavailable?' — Indisponível: '+item.reason:'';
        return '<button type="button" class="ags-day'+(active?' is-active':'')+(unavailable?' is-disabled':'')+'" aria-label="'+escapeHtml(label(d)+reason)+'" aria-pressed="'+active+'"'+(unavailable?' disabled aria-disabled="true" title="'+escapeHtml(item.reason)+'"':'')+' data-ags-date="'+value+'"><span class="ags-day-week">'+WEEK[d.getUTCDay()]+'</span><span class="ags-day-num">'+String(d.getUTCDate()).padStart(2,'0')+'</span><span class="ags-day-month">'+MONTH[d.getUTCMonth()]+'</span></button>';
      }).join('');
      prev.disabled=page===0;next.disabled=page+visible>=dates.length;syncTurns();
    }
    if(firstAvailable<0){feedback('Nenhuma data disponível neste período. Solicite à equipe uma nova janela de atendimento.','warning','Sem datas disponíveis');submit.disabled=true;if(panelSubmit)panelSubmit.disabled=true;prev.disabled=true;next.disabled=true;}
    prev.addEventListener('click',function(){page=Math.max(0,page-shifts());draw();});
    next.addEventListener('click',function(){page=Math.min(Math.max(0,dates.length-shifts()),page+shifts());draw();});
    dayWrap.addEventListener('click',function(e){var node=e.target.closest('[data-ags-date]');if(!node||!dayWrap.contains(node)||node.disabled||!dates.some(function(item){return item.available&&iso(item.date)===node.dataset.agsDate;}))return;selected=node.dataset.agsDate;draw();statusShow('','');});
    window.addEventListener('resize',function(){if(!mount.isConnected)return;var total=shifts();if(page+total>dates.length)page=Math.max(0,dates.length-total);draw();},{passive:true});
    form.addEventListener('submit',function(e){
      e.preventDefault();if(busy)return;
      if(!selected){feedback('Selecione uma data para a visita.','error','Selecione uma data');return;}
      // Verifique novamente a data no momento do envio (a página pode estar aberta há dias).
      var eligible=makeDates(config).some(function(item){return item.available&&iso(item.date)===selected;});
      if(!dateTurns().includes(turn.value)){feedback('O turno escolhido não está disponível nesse dia.','error','Turno indisponível');return;}
      if(!eligible){feedback('Esta data não está mais disponível. Atualize a página e selecione outra.','error','Data indisponível');return;}
      var phoneDigits=safe(phone.value).replace(/\D/g,'');
      if(!form.checkValidity()||phoneDigits.length<10||phoneDigits.length>13){
        feedback('Informe nome, telefone válido'+(email.required?' e e-mail válido':'')+'.','error','Confira seus dados');
        if(!form.checkValidity())form.reportValidity();else phone.focus();
        return;
      }
      var endpoint=safe(settings.endpoint);
      if(!/^https:\/\//i.test(endpoint)){feedback('Configure um endpoint HTTPS do FormSender antes de enviar.','error','Configuração necessária');return;}
      if(window.__IMOBIFY_EDITOR__){feedback('Prévia do editor: envio de agendamento desativado.','info','Modo de edição');return;}
      busy=true;submit.disabled=true;submit.classList.add('is-sending');submit.setAttribute('aria-busy','true');if(panelSubmit){panelSubmit.disabled=true;panelSubmit.classList.add('is-sending');panelSubmit.setAttribute('aria-busy','true');}statusShow('Enviando solicitação...','');
      var bookingItem=dates.find(function(item){return item.available&&iso(item.date)===selected;});
      if(!bookingItem){feedback('A data selecionada não está mais disponível.','error','Data indisponível');busy=false;submit.disabled=false;submit.classList.remove('is-sending');if(panelSubmit){panelSubmit.disabled=false;panelSubmit.classList.remove('is-sending');panelSubmit.removeAttribute('aria-busy');}return;}
      var bookingDate=bookingItem.date;
      var chosenTurn=turn.value;
      var product=safe(settings.product),summary=['Solicitação de agendamento de visita','Empreendimento: '+product,'Data solicitada: '+format(bookingDate),'Turno preferido: '+turn.value,'Fuso horário do empreendimento: '+timeZone,'Status: aguardando confirmação da equipe'].join('\n');
      var payload=new FormData();
      payload.append('produto',product);payload.append('nome',safe(form.elements.nome.value));
      payload.append('email',showEmail?safe(email.value):'');payload.append('telefone',safe(phone.value));
      payload.append('dataHora',stampAtTimeZone(timeZone));
      payload.append('msg',summary);payload.append('origem','Agendamento Sender');payload.append('assunto','Solicitação de agendamento');
      payload.append('agendamento',format(bookingDate)+' — '+turn.value);
      payload.append('agendamentoData',format(bookingDate));payload.append('agendamentoDataISO',selected);
      payload.append('agendamentoTurno',turn.value);payload.append('agendamentoFuso',timeZone);payload.append('agendamentoStatus','Pendente de confirmação');
      fetch(endpoint,{method:'POST',body:payload}).then(function(response){
        if(!response.ok)throw new Error('Servidor respondeu '+response.status);
        return response.text();
      }).then(function(body){
        var data;try{data=JSON.parse(body);}catch(_){data=null;}
        if(data&&(data.success===false||data.ok===false||data.status==='error'))throw new Error(data.message||'O servidor rejeitou a solicitação.');
        if(/^\s*(erro|error|falha)\b/i.test(body))throw new Error('O servidor retornou erro.');
        form.reset();syncTurns();
        feedback(safe(settings.successMessage)||'Solicitação recebida. Aguarde nossa confirmação.','success','Solicitação enviada!');
        mount.dispatchEvent(new CustomEvent('agendamento-sender:success',{bubbles:true,detail:{data:selected,turno:chosenTurn,produto:product,timeZone:timeZone}}));
      }).catch(function(error){console.warn('[Agendamento Sender]',error);feedback('Não foi possível enviar sua solicitação. Verifique a conexão e tente novamente.','error','Falha no envio');})
      .finally(function(){busy=false;submit.disabled=false;submit.classList.remove('is-sending');submit.removeAttribute('aria-busy');if(panelSubmit){panelSubmit.disabled=false;panelSubmit.classList.remove('is-sending');panelSubmit.removeAttribute('aria-busy');}});
    });
    draw();
  }
  function boot(){document.querySelectorAll(ROOT).forEach(init);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();


(function(){
  'use strict';
  function installFallback(image){
    if(image.dataset.footerIconFallback==='true')return;
    image.dataset.footerIconFallback='true';
    image.addEventListener('error',()=>{
      const fallback=document.createElement('i');
      fallback.className='fa-solid fa-link';
      fallback.setAttribute('aria-hidden','true');
      image.replaceWith(fallback);
    },{once:true});
  }
  function init(scope=document){
    scope.querySelectorAll('[data-plugin="footer"] .footer-social-icon img').forEach(installFallback);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>init(),{once:true});
  else init();
})();


/* Imobify 6.0.4 — gatilho único de visibilidade para todos os efeitos. */
(function(){
  'use strict';
  var SELECTOR='[data-section-transition]';
  var reduced=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var items=new Set(), scheduled=false, observer=null;
  function thresholdOf(el){
    var raw=el.getAttribute('data-motion-threshold');
    if(raw===null||raw==='')return .20;
    var value=Number(raw);
    return Number.isFinite(value)?Math.max(0,Math.min(1,value)):.20;
  }
  function excluded(el){return el.matches('[data-plugin="parallax"], [data-plugin="scrollytelling-video-pro"]')||el.getAttribute('data-section-transition')==='none';}
  function clamp(value){return Math.min(1,Math.max(0,value));}
  function measure(el){
    var r=el.getBoundingClientRect();
    var vh=window.innerHeight||document.documentElement.clientHeight||0;
    var vw=window.innerWidth||document.documentElement.clientWidth||0;
    var w=Math.max(0,Math.min(r.right,vw)-Math.max(0,r.left));
    var h=Math.max(0,Math.min(r.bottom,vh)-Math.max(0,r.top));
    var area=Math.max(1,r.width*r.height);
    return {ratio:clamp(w*h/area),visible:w>0&&h>0,rect:r,vh:vh};
  }
  function update(){
    scheduled=false;
    items.forEach(function(el){
      if(!el.isConnected){items.delete(el);return;}
      if(reduced||excluded(el)){el.classList.add('is-visible');return;}
      var m=measure(el), threshold=thresholdOf(el);
      var reached=m.visible&&(threshold===0||m.ratio+0.000001>=threshold);
      var started=el.dataset.motionTriggered==='true';
      var replay=el.dataset.motionReplay==='true';
      var type=el.getAttribute('data-section-transition');
      if(!reached){
        if(replay||!started){el.classList.remove('is-visible');}
        if(replay){el.dataset.motionTriggered='false';}
        if(type==='curtain-reveal'&&!started)el.style.setProperty('--imobify-curtain-side','50%');
        return;
      }
      if(!started){el.dataset.motionTriggered='true';el.classList.add('is-visible');el.dispatchEvent(new CustomEvent('imobify:section-visible',{bubbles:false}));}
      if(type==='curtain-reveal'){
        // Curtain begins only once the configured section visibility is reached.
        // Its completion is driven by additional travel through the viewport.
        var available=Math.max(1,m.vh*(1-threshold));
        var travel=Math.max(0,m.vh-m.rect.top-threshold*m.rect.height);
        var progress=clamp(travel/available);
        el.style.setProperty('--imobify-curtain-side',(50*(1-progress)).toFixed(3)+'%');
      }
    });
  }
  function schedule(){if(scheduled)return;scheduled=true;if(window.requestAnimationFrame)window.requestAnimationFrame(update);else update();}
  function register(root){
    if(root.matches&&root.matches(SELECTOR))items.add(root);
    if(root.querySelectorAll)root.querySelectorAll(SELECTOR).forEach(function(el){items.add(el);});
    schedule();
  }
  function init(){
    if(document.documentElement.dataset.imobifyMotionInit)return;
    document.documentElement.dataset.imobifyMotionInit='1';
    // Initial state is installed before the first visibility calculation.
    document.documentElement.classList.add('imobify-motion-ready');
    register(document);
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',schedule,{passive:true});
    window.addEventListener('load',schedule);
    if('ResizeObserver' in window){observer=new ResizeObserver(schedule);items.forEach(function(el){observer.observe(el);});}
    if('MutationObserver' in window){
      new MutationObserver(function(changes){
        changes.forEach(function(change){
          change.addedNodes.forEach(function(node){if(node.nodeType!==1)return;register(node);if(observer){if(node.matches&&node.matches(SELECTOR))observer.observe(node);if(node.querySelectorAll)node.querySelectorAll(SELECTOR).forEach(function(el){observer.observe(el);});}});
          if(change.type==='attributes'){if(change.target.matches&&change.target.matches(SELECTOR))items.add(change.target);schedule();}
        });
      }).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-motion-threshold','data-motion-replay','data-section-transition']});
    }
    schedule();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();


(function(){const triggers=document.querySelectorAll('[data-lightbox-src]');if(!triggers.length)return;const box=document.createElement('div');box.className='imobify-lightbox';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.innerHTML='<button aria-label="Fechar">×</button><img alt="Imagem ampliada">';document.body.append(box);const close=()=>{box.classList.remove('is-open');document.body.classList.remove('no-scroll');};triggers.forEach(trigger=>trigger.addEventListener('click',()=>{box.querySelector('img').src=trigger.dataset.lightboxSrc;box.classList.add('is-open');document.body.classList.add('no-scroll');box.querySelector('button').focus();}));box.addEventListener('click',event=>{if(event.target===box||event.target.tagName==='BUTTON')close();});addEventListener('keydown',event=>{if(event.key==='Escape')close();});})();
