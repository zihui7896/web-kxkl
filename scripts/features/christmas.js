// Local Canvas particle world: perspective, spring morphs and pointer interaction.
export function initChristmas() {
  const root=document.querySelector('.christmas-scene'), canvas=root.querySelector('canvas');
  const ctx=canvas.getContext('2d'), status=root.querySelector('[data-christmas-status]');
  const pause=root.querySelector('[data-christmas-pause]'), letter=root.querySelector('dialog');
  const opener=root.querySelector('[data-christmas-letter]'), reveal=root.querySelector('[data-christmas-reveal]');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let visible=false, paused=reduced.matches, raf=0, last=0, time=0, width=0, height=0;
  let cx=0, cy=0, scale=1, yaw=0, tilt=0, velocity=0, zoom=1, targetZoom=1;
  let shape='tree', night=false, snowUntil=0, sequence=null, returnFocus=opener;
  let pointer={x:-9999,y:-9999}, drag=null, rings=[], trail=[];
  let seed=251225;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const colors=['#4093c8','#73b7e4','#a8d9ef','#6ca8d9','#edc78a'];
  const sprites=colors.map(color=>{
    const c=document.createElement('canvas');c.width=c.height=32;
    const g=c.getContext('2d'), gradient=g.createRadialGradient(16,16,0,16,16,16);
    gradient.addColorStop(0,'#ffffff');gradient.addColorStop(.13,color);gradient.addColorStop(.36,color+'a0');gradient.addColorStop(1,color+'00');
    g.fillStyle=gradient;g.fillRect(0,0,32,32);return c;
  });
  const particles=Array.from({length:4200},(_,i)=>{
    const y=Math.pow(random(),.7), a=random()*Math.PI*2;
    const radius=y*(.75+.25*((y*9)%1))*(.65+.35*Math.sqrt(random()));
    const tree={x:Math.cos(a)*radius*.53,y:(y-.5)*1.55,z:Math.sin(a)*radius*.53};
    const distance=.04+Math.sqrt(random())*.77, angle=distance*6+i%3*Math.PI*2/3+(random()-.5)*.65;
    const galaxy={x:Math.cos(angle)*distance,y:(random()-.5)*.13,z:Math.sin(angle)*distance};
    let hx,hy;
    do {hx=(random()-.5)*2.3;hy=(random()-.5)*2.5;} while(Math.pow(hx*hx+hy*hy-1,3)-hx*hx*hy*hy*hy>0);
    const heart={x:hx*.62,y:-hy*.62,z:(random()-.5)*.24};
    return {tree,galaxy,heart,...tree,size:.6+random()*1.4,phase:random()*6.28,color:i%11===0?4:i%4,dx:0,dy:0};
  });
  const snow=Array.from({length:180},()=>({x:random(),y:random(),speed:.025+random()*.05,size:1+random()*2,phase:random()*6.28}));
  function glow(x,y,size,color=0,alpha=1){ctx.globalAlpha=clamp(alpha,0,1);ctx.drawImage(sprites[color],x-size/2,y-size/2,size,size);}
  function project(x,y,z){
    const rx=x*Math.cos(yaw)+z*Math.sin(yaw), rz=z*Math.cos(yaw)-x*Math.sin(yaw);
    const ry=y*Math.cos(tilt)-rz*Math.sin(tilt), depth=rz*Math.cos(tilt)+y*Math.sin(tilt);
    const perspective=3.3/(3.3+depth);
    return {x:cx+rx*scale*zoom*perspective,y:cy+ry*scale*zoom*perspective,z:depth,k:perspective};
  }
  function burst(x=cx,y=cy,color=1){rings.push({x,y,born:time,color});rings=rings.slice(-8);}
  function updateControls(){
    root.dataset.shape=shape;
    root.querySelectorAll('[data-christmas-shape]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.christmasShape===shape)));
    pause.textContent=paused?'继续动画':'暂停动画';pause.setAttribute('aria-pressed',String(paused));
  }
  function setShape(next){
    shape=next;yaw=0;tilt=shape==='galaxy'?-.55:0;velocity=0;updateControls();
    if(reduced.matches||paused)particles.forEach(p=>Object.assign(p,p[shape]));
    status.textContent={tree:'星光正在聚成树。拖动它，看看另一面的光。',galaxy:'整棵树散成了星河。拖动旋转，滚轮靠近。',heart:'把所有的小心愿，放进这一颗心里。'}[shape];
    draw(0);
  }
  function cancelSequence(){sequence=null;root.classList.remove('is-revealing');opener.disabled=false;reveal.textContent='';}
  function showLetter(){cancelSequence();if(visible&&!letter.open)letter.showModal();}
  function surprise(button=opener){
    if(sequence)return;
    returnFocus=button;
    if(paused||reduced.matches||!ctx){setShape('heart');showLetter();return;}
    sequence={start:time,phase:0};opener.disabled=true;
    root.classList.add('is-revealing');reveal.textContent='把这一整片星海，送给你。';
    setShape('galaxy');burst();
  }
  function draw(dt){
    if(!ctx||!width)return;
    if(sequence){
      const elapsed=time-sequence.start;
      if(elapsed>2.5&&sequence.phase===0){sequence.phase=1;setShape('heart');reveal.textContent='所有星光，都在说：圣诞快乐。';}
      if(sequence&&elapsed>5.6)showLetter();
    }
    const mobile=matchMedia('(max-width:760px)').matches;
    const ease=1-Math.exp(-dt*4);
    if(dt){yaw+=drag?0:velocity+(shape==='heart'?0:.12*dt);velocity*=Math.exp(-dt*5);zoom+=(targetZoom-zoom)*ease;}
    ctx.clearRect(0,0,width,height);
    const halo=ctx.createRadialGradient(cx,cy,0,cx,cy,scale*1.2);
    halo.addColorStop(0,night?'#467cc736':'#6bafe329');halo.addColorStop(1,'#6598d000');ctx.fillStyle=halo;ctx.fillRect(0,0,width,height);
    ctx.globalCompositeOperation=night?'lighter':'source-over';
    const blizzard=time<snowUntil;
    snow.forEach((p,i)=>{
      if(!blizzard&&i>75)return;
      const x=(p.x*width+Math.sin(time*.6+p.phase)*(blizzard?60:12)+width)%width;
      const y=((p.y+time*p.speed*(blizzard?1:.3))%1)*height;
      glow(x,y,p.size*(night?3:2.4),i%9===0?4:2,.55);
    });
    // Perspective orbit behind the tree gives a visible sense of depth.
    ctx.globalAlpha=night?.3:.22;ctx.strokeStyle=night?'#b7deff':'#4a92c8';ctx.lineWidth=.8;
    for(let ring=0;ring<3;ring++){
      ctx.beginPath();for(let i=0;i<=100;i++){
        const a=i/100*Math.PI*2, r=.65+ring*.08, p=project(Math.cos(a)*r,.84,Math.sin(a)*r);
        if(!i)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);
      }ctx.stroke();
    }
    for(const p of particles){
      const target=p[shape];
      if(dt){p.x+=(target.x-p.x)*ease;p.y+=(target.y-p.y)*ease;p.z+=(target.z-p.z)*ease;}
      const pos=project(p.x,p.y+Math.sin(time*1.3+p.phase)*.005,p.z);
      const dx=pos.x-pointer.x,dy=pos.y-pointer.y,d=Math.hypot(dx,dy),force=Math.max(0,1-d/90);
      if(dt){p.dx+=((d?dx/d*force*45:0)-p.dx)*ease;p.dy+=((d?dy/d*force*45:0)-p.dy)*ease;}
      const twinkle=.75+.25*Math.sin(time*2+p.phase);
      glow(pos.x+p.dx,pos.y+p.dy,p.size*(night?5:4)*pos.k,p.color,(.55+pos.k*.25)*twinkle);
    }
    if(shape==='tree'){
      for(let i=0;i<560;i++){
        const y=i/560,a=y*Math.PI*9+time*.25,r=y*.55;
        const pos=project(Math.cos(a)*r,(y-.5)*1.55,Math.sin(a)*r);
        glow(pos.x,pos.y,i%16===0?11:3.8,4,.7);
      }
      const star=project(0,-.83,0);
      glow(star.x,star.y,85+Math.sin(time*2)*14,4,.75);
      ctx.globalAlpha=1;ctx.fillStyle='#ffe6a1';ctx.strokeStyle='#c7a05d';ctx.lineWidth=.7;ctx.beginPath();
      for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?6:16;ctx.lineTo(star.x+Math.cos(a)*r,star.y+Math.sin(a)*r);}ctx.closePath();ctx.fill();ctx.stroke();
    }
    for(const ring of rings){
      const age=time-ring.born;if(age>2.5)continue;
      for(let i=0;i<45;i++){const a=i/45*Math.PI*2+age*.4,r=age*(65+(i%5)*8);glow(ring.x+Math.cos(a)*r,ring.y+Math.sin(a)*r+age*age*12,7,ring.color,1-age/2.5);}
    }
    rings=rings.filter(r=>time-r.born<2.5);
    trail.forEach(p=>glow(p.x,p.y,12,1,Math.max(0,1-(time-p.born)*2)));
    trail=trail.filter(p=>time-p.born<.5);
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
    root.dataset.rotation=yaw.toFixed(3);
    root.dataset.zoom=zoom.toFixed(2);
    if(mobile)root.classList.add('is-mobile');else root.classList.remove('is-mobile');
  }
  function resize(){
    const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
    width=rect.width;height=rect.height;
    const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx?.setTransform(dpr,0,0,dpr,0,0);
    const mobile=matchMedia('(max-width:760px)').matches;
    cx=width*(mobile?.5:.69);cy=mobile?710:height*.48;
    scale=mobile?Math.min(width*.66,245):Math.min(height*.36,width*.36);
    draw(0);
  }
  function frame(now){const dt=last?Math.min((now-last)/1000,.05):0;last=now;time+=dt;draw(dt);raf=requestAnimationFrame(frame);}
  function sync(){cancelAnimationFrame(raf);raf=0;last=0;updateControls();if(visible&&!document.hidden){draw(0);if(!paused&&ctx)raf=requestAnimationFrame(frame);}}
  function point(event){const r=canvas.getBoundingClientRect();return{x:event.clientX-r.left,y:event.clientY-r.top};}
  function release(){if(drag&&canvas.hasPointerCapture(drag.id))canvas.releasePointerCapture(drag.id);drag=null;canvas.classList.remove('dragging');}
  canvas.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    pointer=point(event);drag={id:event.pointerId,x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,moved:false};
    canvas.setPointerCapture(event.pointerId);canvas.classList.add('dragging');canvas.focus({preventScroll:true});
  });
  canvas.addEventListener('pointermove',event=>{
    pointer=point(event);
    if(drag&&drag.id===event.pointerId){
      const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
      yaw+=dx*.008;tilt=clamp(tilt+dy*.004,-.65,.65);velocity=clamp(dx*.001,-.03,.03);
      drag.moved ||= Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)>6;
      drag.x=event.clientX;drag.y=event.clientY;
    }
    if(!reduced.matches)trail.push({...pointer,born:time});trail=trail.slice(-24);draw(0);
  });
  canvas.addEventListener('pointerup',event=>{if(drag?.id===event.pointerId&&!drag.moved){burst(pointer.x,pointer.y);status.textContent='收到一颗星光。愿你的心愿，都有回音。';}release();draw(0);});
  canvas.addEventListener('pointercancel',release);
  canvas.addEventListener('lostpointercapture',()=>{drag=null;canvas.classList.remove('dragging');});
  canvas.addEventListener('pointerleave',()=>{pointer={x:-9999,y:-9999};});
  canvas.addEventListener('wheel',event=>{event.preventDefault();targetZoom=clamp(targetZoom-event.deltaY*.001, .65,1.45);if(paused)zoom=targetZoom;draw(0);},{passive:false});
  canvas.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','+','=','-'].includes(event.key))return;
    event.preventDefault();
    if(event.key==='ArrowLeft')yaw-=.15;if(event.key==='ArrowRight')yaw+=.15;
    if(event.key==='ArrowUp')tilt=clamp(tilt-.1,-.65,.65);if(event.key==='ArrowDown')tilt=clamp(tilt+.1,-.65,.65);
    if(event.key===' ')burst();if(['+','=','-'].includes(event.key)){targetZoom=clamp(targetZoom+(event.key==='-'?-.1:.1),.65,1.45);if(paused)zoom=targetZoom;}draw(0);
  });
  root.querySelectorAll('[data-christmas-shape]').forEach(button=>button.addEventListener('click',()=>{cancelSequence();setShape(button.dataset.christmasShape);}));
  root.querySelector('[data-christmas-night]').addEventListener('click',event=>{night=!night;root.classList.toggle('is-night',night);event.currentTarget.setAttribute('aria-pressed',String(night));event.currentTarget.textContent=night?'☀ 冰蓝晴夜':'☾ 深蓝星空';draw(0);});
  root.querySelector('[data-christmas-reset]').addEventListener('click',()=>{cancelSequence();release();yaw=tilt=velocity=0;zoom=targetZoom=1;pointer={x:-9999,y:-9999};setShape('tree');});
  root.querySelectorAll('[data-christmas-gift]').forEach(button=>button.addEventListener('click',()=>{
    button.classList.add('is-open');const gift=button.dataset.christmasGift;
    if(gift==='letter'){surprise(button);return;}
    cancelSequence();
    if(gift==='snow'){snowUntil=time+10;burst();status.textContent='送你一场十秒的初雪，愿你的冬天有暖意。';}
    if(gift==='heart'){setShape('heart');burst();}draw(0);
  }));
  root.querySelector('[data-christmas-wish]').addEventListener('click',()=>{cancelSequence();setShape('heart');burst();});
  pause.addEventListener('click',()=>{paused=!paused;if(paused&&sequence)showLetter();sync();});
  opener.addEventListener('click',()=>surprise(opener));
  letter.addEventListener('close',()=>{returnFocus.focus({preventScroll:true});});
  reduced.addEventListener('change',()=>{paused=reduced.matches;if(paused&&sequence)showLetter();sync();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)release();sync();});
  new ResizeObserver(resize).observe(root);
  return {setVisible(value){visible=value;if(!value){release();cancelSequence();if(letter.open)letter.close();}else resize();sync();}};
}
