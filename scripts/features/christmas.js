// A small, self-contained Christmas keepsake. All artwork is drawn locally.
export function initChristmas() {
  const root = document.querySelector('.christmas-scene');
  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const pause = root.querySelector('[data-christmas-pause]');
  const status = root.querySelector('[data-christmas-status]');
  const letter = root.querySelector('dialog');
  const openLetter = root.querySelector('[data-christmas-letter]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false, paused = reduced.matches, raf = 0, last = 0, time = 0;
  let width = 0, height = 0, center = 0, top = 0, treeHeight = 0, radius = 0;
  let wishStart = -100, wishIndex = 0;
  const wishes = ['愿 你的每一个心愿，都有回音。', '愿你眼里的光，永远明亮。', '愿所有美好，都如约来到你身旁。', '愿你被爱包围，快乐不止圣诞。'];
  const palette = ['#488dbf', '#6cadd4', '#95b8d7', '#4b9da6', '#d2a963'];
  // Pre-rendered soft light avoids thousands of expensive shadow-blur calls per frame.
  const lights = palette.map(color => {
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 48;
    const g = sprite.getContext('2d');
    const gradient = g.createRadialGradient(24,24,0,24,24,24);
    gradient.addColorStop(0,'#f3fbff'); gradient.addColorStop(.09,color);
    gradient.addColorStop(.25,color+'99'); gradient.addColorStop(1,color+'00');
    g.fillStyle = gradient; g.fillRect(0,0,48,48);
    return sprite;
  });
  let seed = 2512;
  const random = () => { seed = (Math.imul(seed,1664525)+1013904223) >>> 0; return seed / 4294967296; };
  const particles = Array.from({length:3400}, () => {
    const y = Math.pow(random(),.7);
    const branch = .78 + .22 * Math.pow((y * 8) % 1, .5);
    return {y, r:Math.sqrt(random())*y*branch, a:random()*Math.PI*2, size:.4+random()*1.15, phase:random()*6.28, color:Math.floor(random()*palette.length)};
  });
  const snow = Array.from({length:110}, () => ({x:random(),y:random(),size:.35+random()*1.5,speed:.012+random()*.025,phase:random()*6.28}));
  const sparks = Array.from({length:110}, () => ({a:random()*6.28,speed:30+random()*100,life:random(),size:2+random()*3}));
  function glow(x,y,size,color=0,alpha=1) {
    ctx.globalAlpha = Math.max(0,Math.min(1,alpha));
    ctx.drawImage(lights[color],x-size/2,y-size/2,size,size);
  }
  function project(y,r,a) {
    const z = Math.sin(a)*r;
    return {x:center+Math.cos(a)*r*radius, y:top+y*treeHeight+z*radius*.22, z};
  }
  function star(x,y,r) {
    glow(x,y,r*11,0,.45); glow(x,y,r*5,1,.7);
    ctx.globalAlpha=1; ctx.fillStyle='#ffe8b2'; ctx.beginPath();
    for(let i=0;i<10;i++) {
      const a=-Math.PI/2+i*Math.PI/5, d=i%2?r*.43:r;
      ctx.lineTo(x+Math.cos(a)*d,y+Math.sin(a)*d);
    }
    ctx.closePath();ctx.fill();
    ctx.strokeStyle='#fff5d9';ctx.lineWidth=.6;ctx.stroke();
    ctx.globalAlpha=.3;ctx.beginPath();ctx.moveTo(x-r*2,y);ctx.lineTo(x+r*2,y);ctx.moveTo(x,y-r*2);ctx.lineTo(x,y+r*2);ctx.stroke();
  }
  function gift(x,y,w,h,color) {
    ctx.globalAlpha=1;
    ctx.fillStyle=color;ctx.fillRect(x,y,w,h);
    ctx.fillStyle='#d0b27b';ctx.fillRect(x+w*.43,y,Math.max(3,w*.12),h);
    ctx.fillStyle='#ead09a';ctx.fillRect(x-2,y,w+4,4);
    ctx.strokeStyle='#d0b27b';ctx.lineWidth=1.4;
    ctx.beginPath();ctx.ellipse(x+w*.39,y-4,w*.15,5,.5,0,Math.PI*2);ctx.ellipse(x+w*.61,y-4,w*.15,5,-.5,0,Math.PI*2);ctx.stroke();
  }
  function draw() {
    if(!ctx || !width || !height)return;
    ctx.clearRect(0,0,width,height);
    const mobile=matchMedia('(max-width: 760px)').matches;
    const base=top+treeHeight;
    const halo=ctx.createRadialGradient(center,top+treeHeight*.52,0,center,top+treeHeight*.52,treeHeight*.68);
    halo.addColorStop(0,'#75b5e52a');halo.addColorStop(1,'#75b5e500');
    ctx.fillStyle=halo;ctx.fillRect(0,0,width,height);
    // Elliptical pools of reflected light ground the floating particles.
    ctx.save();ctx.translate(center,base+20);ctx.scale(1,.17);
    const floor=ctx.createRadialGradient(0,0,2,0,0,radius*1.5);
    floor.addColorStop(0,'#559acc35');floor.addColorStop(.55,'#78aad525');floor.addColorStop(1,'#78aad500');
    ctx.fillStyle=floor;ctx.fillRect(-radius*1.6,-radius*1.6,radius*3.2,radius*3.2);ctx.restore();
    ctx.strokeStyle='#589acb60';ctx.lineWidth=.7;ctx.beginPath();ctx.ellipse(center,base+20,radius*1.18,radius*.16,0,0,Math.PI*2);ctx.stroke();
    ctx.globalCompositeOperation='source-over';
    for(const flake of snow) {
      const x=(flake.x*width+Math.sin(time*.2+flake.phase)*16+width)%width;
      const y=((flake.y+time*flake.speed*.12)%1)*height;
      glow(x,y,flake.size*5,4,.2+flake.size*.12);
    }
    const rotation=time*.12;
    const burst=Math.max(0,1-(time-wishStart)/3);
    for(const p of particles) {
      const point=project(p.y,p.r,p.a+rotation);
      const twinkle=.62+.38*Math.sin(time*1.2+p.phase);
      const alpha=(.35+(point.z+1)*.25)*twinkle;
      glow(point.x,point.y,p.size*(mobile?4:5)+(burst*2),p.color,alpha);
    }
    // A continuous helix, with tiny pearl bulbs, winds around the tree.
    for(let i=0;i<760;i++) {
      const y=i/760, a=y*Math.PI*2*4.2+rotation;
      const point=project(y,y*1.02,a);
      const front=point.z>0;
      glow(point.x,point.y,i%11===0?10:3.5,1,front?.9:.3);
    }
    for(let i=0;i<60;i++) {
      const y=.15+(i/60)*.81, a=i*2.399+rotation;
      const point=project(y,y*.87,a);
      glow(point.x,point.y,9+Math.sin(time*1.7+i)*3,i%3===0?3:0,.8);
    }
    star(center,top-8, mobile?12:15);
    if(burst>0) for(const s of sparks) {
      const age=(1-burst)*3;
      glow(center+Math.cos(s.a)*s.speed*age,top-8+Math.sin(s.a)*s.speed*age+age*age*15,s.size*3,1,burst);
    }
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
    const unit=mobile?.8:1;
    gift(center-radius*.7,base+7,37*unit,31*unit,'#6e9fbb');
    gift(center-radius*.7+33*unit,base+19,27*unit,23*unit,'#b5cbdc');
    gift(center+radius*.4,base+9,44*unit,28*unit,'#7facc9');
    gift(center+radius*.4+35*unit,base+23,24*unit,20*unit,'#5685a5');
    ctx.globalAlpha=1;
  }
  function resize() {
    const rect=canvas.getBoundingClientRect();
    if(!rect.width || !rect.height)return;
    width=rect.width;height=rect.height;
    const dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    ctx?.setTransform(dpr,0,0,dpr,0,0);
    const mobile=matchMedia('(max-width: 760px)').matches;
    center=width*(mobile?.5:.72);
    top=mobile?535:height*.20;
    treeHeight=mobile?360:Math.min(height*.57,560);
    radius=Math.min(treeHeight*.39,width*(mobile?.34:.235));
    draw();
  }
  function frame(now) {
    time+=last?Math.min((now-last)/1000,.05):0;last=now;
    draw();raf=requestAnimationFrame(frame);
  }
  function sync() {
    cancelAnimationFrame(raf);raf=0;last=0;
    pause.textContent=paused?'继续动画':'暂停动画';
    pause.setAttribute('aria-pressed',String(paused));
    if(visible&&!document.hidden) {
      draw();if(!paused&&ctx)raf=requestAnimationFrame(frame);
    }
  }
  pause.addEventListener('click',()=>{paused=!paused;sync();});
  root.querySelector('[data-christmas-wish]').addEventListener('click',()=>{
    status.textContent=wishes[wishIndex++%wishes.length];
    wishStart=time;draw();
  });
  openLetter.addEventListener('click',()=>letter.showModal());
  letter.addEventListener('close',()=>openLetter.focus());
  document.addEventListener('visibilitychange',sync);
  reduced.addEventListener('change',()=>{paused=reduced.matches;sync();});
  new ResizeObserver(resize).observe(root);
  if(!ctx)status.textContent='亲爱的你，愿你圣诞快乐，心愿成真。';
  return {setVisible(value) {
    visible=value;
    if(!visible&&letter.open)letter.close();
    if(value)resize();
    sync();
  }};
}
