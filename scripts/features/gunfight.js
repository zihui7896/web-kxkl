import * as THREE from '../vendor/three.module.js';
import {buildShip,makeSoldier,makeWeapon} from './gunfight-world.js';
import {overlapsFootprint} from './gunfight-materials.js';

const WEAPONS=[
  {name:'M4A1',type:'突击步枪',mag:30,reserve:120,damage:27,interval:.095,reload:2.2,spread:.009,recoil:.016},
  {name:'AK-47',type:'突击步枪',mag:30,reserve:120,damage:36,interval:.12,reload:2.5,spread:.013,recoil:.025},
  {name:'AWM',type:'狙击步枪',mag:10,reserve:40,damage:105,interval:1.3,reload:2.9,spread:.035,recoil:.045},
  {name:'DESERT EAGLE',type:'半自动手枪',mag:7,reserve:42,damage:48,interval:.28,reload:1.6,spread:.011,recoil:.028}
];
export function initGunfight(){
  const root=document.querySelector('[data-gun-root]');
  root.innerHTML=`
    <header class="gun-header"><div><span class="gun-eyebrow">TACTICAL PLAYGROUND / 09</span><h1>枪战 <span>运输船</span></h1></div><div class="gun-header-right"><i></i> 本地机器人对战 <span>4 vs 4</span></div></header>
    <div class="gun-stage" tabindex="0" aria-label="运输船第一人称射击游戏">
      <canvas class="gun-canvas" aria-label="3D 运输船战场"></canvas>
      <div class="gun-vignette"></div><div class="gun-damage"></div>
      <div class="gun-hud">
        <div class="gun-radar"><canvas width="180" height="180" aria-label="战术小地图"></canvas><span>运输船 / CARGO DECK</span></div>
        <div class="gun-score"><div class="blue"><small>保卫者</small><b data-blue>00</b></div><div class="gun-clock"><span>TEAM DEATHMATCH</span><b data-time>05:00</b><small>目标 40 击杀</small></div><div class="orange"><small>潜伏者</small><b data-red>00</b></div></div>
        <div class="gun-feed" aria-live="polite"></div>
        <div class="gun-crosshair"><i></i><i></i><i></i><i></i></div><div class="gun-hit">×</div>
        <div class="gun-scope"><div></div></div>
        <div class="gun-notice" role="status"></div>
        <div class="gun-health"><small>GLOBAL RISK / 你</small><div><span>＋</span><b data-health>100</b><em>HP</em></div><progress max="100" value="100"></progress><small data-kd>击杀 0 · 阵亡 0</small></div>
        <div class="gun-ammo"><small data-weapon>M4A1</small><div><b data-ammo>30</b><span>/ <i data-reserve>120</i></span></div><em data-reload>5.56 × 45 MM</em></div>
        <div class="gun-hotbar">1 M4A1 <span>2 AK-47</span><span>3 AWM</span><span>4 沙鹰</span></div>
      </div>
      <div class="gun-menu">
        <div class="gun-menu-copy"><span class="gun-eyebrow">NORTH ATLANTIC · 06:40 AM</span><p class="gun-operation">OPERATION</p><h2>TRANSPORT<br><span>SHIP.</span></h2><p class="gun-menu-sub">运输船 / 团队竞技</p><div class="gun-menu-line"></div><p class="gun-menu-description">海风掠过甲板，交火即将开始。<br>穿过集装箱与侧翼通道，夺取这艘船。</p><div class="gun-tags"><span>4 对 4</span><span>5 分钟</span><span>40 击杀</span></div><button class="gun-start" type="button">进入战场 <span>↗</span></button><p class="gun-menu-hint">点击后锁定鼠标 · Esc 暂停并释放</p></div>
        <div class="gun-settings"><span>MISSION BRIEF / 作战配置</span><label>机器人难度<select data-difficulty><option value="easy">新兵 · 熟悉战场</option><option value="normal" selected>老兵 · 标准交火</option><option value="hard">精英 · 高压对抗</option></select></label><label>鼠标灵敏度<input data-sensitivity type="range" min="0.5" max="2.5" value="1" step="0.1"></label><label>画面质量<select data-quality><option value="high">高 · 动态阴影</option><option value="low">流畅 · 降低分辨率</option></select></label><button data-new-round type="button">重新开始本局</button><small>独立制作的运输船致敬场景<br>程序化模型与材质 · 单机 AI 对战</small></div>
      </div>
      <div class="gun-touch"><div class="gun-stick"><i></i></div><div class="gun-look"></div><button data-touch="fire">开火</button><button data-touch="aim">瞄准</button><button data-touch="jump">跳跃</button><button data-touch="reload">换弹</button><button data-touch="weapon">切枪</button></div>
      <button class="gun-pause" type="button" aria-label="暂停游戏">Ⅱ</button>
    </div>
    <div class="gun-toolbar"><p><kbd>W A S D</kbd> 移动 <kbd>鼠标</kbd> 瞄准 <kbd>左键</kbd> 射击 <kbd>右键</kbd> 开镜 <kbd>R</kbd> 换弹 <kbd>Space</kbd> 跳跃 <kbd>C</kbd> 蹲下 <kbd>Shift</kbd> 疾跑</p><div><button data-sound aria-pressed="true">音效 开</button><button data-fullscreen>全屏 ↗</button></div></div>
    <p class="gun-footnote">侧翼包抄 · 木箱垫脚登上集装箱 · 阵亡 3 秒后复活 · 1–4 切换武器 · Tab 查看战况</p>`;
  const $=s=>root.querySelector(s),stage=$('.gun-stage'),canvas=$('.gun-canvas'),menu=$('.gun-menu');
  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}catch(error){root.innerHTML='<p data-gun-loading>无法启动 WebGL。请开启浏览器硬件加速后刷新页面。</p>';return{setVisible(){}};}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  const scene=new THREE.Scene();scene.fog=new THREE.Fog('#b3c6ca',65,240);
  scene.add(new THREE.HemisphereLight('#c7e4ff','#6d6658',2.1));
  const sun=new THREE.DirectionalLight('#fff0d3',3.2);sun.position.set(-30,55,-40);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-38,right:38,top:43,bottom:-43,near:1,far:150});sun.shadow.bias=-.0004;sun.shadow.normalBias=.025;scene.add(sun);
  const world=buildShip(scene),camera=new THREE.PerspectiveCamera(76,1,.05,900);camera.rotation.order='YXZ';scene.add(camera);
  const weaponScene=new THREE.Scene(),weaponCamera=new THREE.PerspectiveCamera(60,1,.01,10);weaponScene.add(new THREE.HemisphereLight('#e2efff','#666150',2.6));const wl=new THREE.DirectionalLight('#fff2df',3);wl.position.set(-3,4,1);weaponScene.add(wl);
  const guns=WEAPONS.map((_,i)=>{const g=makeWeapon(i);g.scale.setScalar(.82);weaponScene.add(g);return g;});
  const flash=new THREE.Mesh(new THREE.ConeGeometry(.08,.28,7),new THREE.MeshBasicMaterial({color:'#ffe2a2',transparent:true,opacity:.9}));flash.rotation.x=-Math.PI/2;weaponScene.add(flash);flash.visible=false;
  const environment=new THREE.Scene();environment.background=new THREE.Color('#91b1c5');
  for(const [x,y,z,color] of [[-3,5,-4,'#fff1d4'],[4,2,2,'#b9dbef'],[0,-4,0,'#34434c']]){const panel=new THREE.Mesh(new THREE.PlaneGeometry(9,9),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide}));panel.position.set(x,y,z);panel.lookAt(0,0,0);environment.add(panel);}
  const pmrem=new THREE.PMREMGenerator(renderer);const envMap=pmrem.fromScene(environment,.08).texture;weaponScene.environment=envMap;scene.environment=envMap;pmrem.dispose();environment.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
  const ray=new THREE.Raycaster(),keys=new Set(),bots=[],fx=[],feed=[];
  let visible=false,frame=0,last=0,active=false,started=false,ended=false,elapsed=0,scores=[0,0],kills=0,deaths=0,weapon=0,ammo=WEAPONS.map(w=>w.mag),reserve=WEAPONS.map(w=>w.reserve),reload=0,cooldown=0,recoil=0,flashTime=0,hitTime=0,hurt=0,fire=false,aim=false,yaw=0,pitch=0,vy=0,grounded=true,dead=0,protect=2,noticeTime=0,stepTime=0,simTime=0,noise,context,muted=false;
  const player={pos:new THREE.Vector3(7,0,26),hp:100,team:0,alive:true};let touchMove={x:0,y:0};const touch=matchMedia('(pointer: coarse)').matches;
  stage.classList.toggle('touch-device',touch);
  function resize(){const r=stage.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=weaponCamera.aspect=r.width/r.height;camera.updateProjectionMatrix();weaponCamera.updateProjectionMatrix();}
  new ResizeObserver(resize).observe(stage);
  // The same hull/container boxes drive player collision, AI navigation and bullet occlusion.
  function blocked(x,z,y=0,height=1.8,r=.34){return Math.abs(x)>14.4||Math.abs(z)>30.4||world.colliders.some(b=>b.maxY>y+.12&&b.minY<y+height&&overlapsFootprint(b,x,z,r));}
  function move(pos,dx,dz,height=1.8){if(!blocked(pos.x+dx,pos.z,pos.y,height))pos.x+=dx;if(!blocked(pos.x,pos.z+dz,pos.y,height))pos.z+=dz;}
  // A small walkability grid enables flanking without walking through cargo.
  const NX=29,NZ=61,walk=[];for(let z=0;z<NZ;z++)for(let x=0;x<NX;x++)walk[z*NX+x]=!blocked(x-14,z-30,0,1.8,.4);
  function cell(pos){return Math.max(0,Math.min(NZ-1,Math.round(pos.z+30)))*NX+Math.max(0,Math.min(NX-1,Math.round(pos.x+14)));}
  function pathTo(from,to){
    const start=cell(from),goal=cell(to),queue=[start],prev=new Int32Array(NX*NZ).fill(-1);prev[start]=start;let best=start,dist=Infinity;
    for(let q=0;q<queue.length;q++){const n=queue[q],x=n%NX,z=Math.floor(n/NX),d=Math.abs(x-goal%NX)+Math.abs(z-Math.floor(goal/NX));if(d<dist){best=n;dist=d;}if(n===goal)break;
      for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,zz=z+dz,k=zz*NX+xx;if(xx>=0&&xx<NX&&zz>=0&&zz<NZ&&walk[k]&&prev[k]===-1){prev[k]=n;queue.push(k);}}}
    const result=[];while(best!==start&&prev[best]!==-1){result.push({x:best%NX-14,z:Math.floor(best/NX)-30});best=prev[best];}return result.reverse();
  }
  function spawnBot(b){b.pos.set([-8,-5,9,5][b.slot]+(Math.random()-.5)*.4,0,b.team===0?28:-28);b.hp=100;b.alive=true;b.timer=0;b.protect=1.4;b.path=[];b.repath=0;b.model.group.visible=true;}
  for(let i=0;i<7;i++){const team=i<3?0:1,model=makeSoldier(team),b={team,slot:team===0?i:i-3,name:team===0?['猎隼','回声','幽灵'][i]:['蝮蛇','灰狼','夜枭','渡鸦'][i-3],model,pos:new THREE.Vector3(),shot:Math.random(),path:[],repath:0};model.parts.forEach(p=>p.userData.bot=b);scene.add(model.group);bots.push(b);spawnBot(b);}
  function sound(type){if(muted)return;try{context??=new (window.AudioContext||window.webkitAudioContext)();if(context.state==='suspended')context.resume();const t=context.currentTime,g=context.createGain();g.connect(context.destination);
    if(type==='shot'||type==='enemy'||type==='step'){if(!noise){noise=context.createBuffer(1,context.sampleRate*.22,context.sampleRate);const a=noise.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;}const source=context.createBufferSource();source.buffer=noise;const f=context.createBiquadFilter();f.type='lowpass';f.frequency.value=type==='step'?220:weapon===2?950:1800;source.connect(f);f.connect(g);g.gain.setValueAtTime(type==='shot'?.21:type==='enemy'?.025:.035,t);g.gain.exponentialRampToValueAtTime(.001,t+.18);source.start();source.stop(t+.2);source.onended=()=>{source.disconnect();f.disconnect();g.disconnect();};}
    else{const o=context.createOscillator();o.type='triangle';o.frequency.setValueAtTime(type==='hit'?980:250,t);o.frequency.exponentialRampToValueAtTime(100,t+.1);o.connect(g);g.gain.setValueAtTime(.065,t);g.gain.exponentialRampToValueAtTime(.001,t+.12);o.start();o.stop(t+.13);o.onended=()=>{o.disconnect();g.disconnect();};}}catch{}}
  function message(text,t=1.6){$('.gun-notice').textContent=text;noticeTime=t;}
  function addFeed(a,b,head=false){feed.unshift({text:`${a}  ${head?'⌖':'▸'}  ${b}`,time:6});feed.splice(4);}
  function tracer(a,b,color='#ffe3a1'){const geo=new THREE.BufferGeometry().setFromPoints([a,b]),line=new THREE.Line(geo,new THREE.LineBasicMaterial({color,transparent:true,opacity:.8}));scene.add(line);fx.push({mesh:line,life:.065,max:.065});}
  function damage(target,amount,source,head=false){if(!target.alive||target.protect>0)return;target.hp=Math.max(0,target.hp-amount);
    if(target===player){hurt=.8;if(target.hp===0){player.alive=false;dead=3;deaths++;scores[1]++;fire=aim=false;message('阵亡 · 3 秒后重返战场',3);addFeed(source.name,'你');}}
    else if(target.hp===0){target.alive=false;target.model.group.visible=false;target.timer=3;scores[source.team]++;addFeed(source===player?'你':source.name,target.name,head);if(source===player){kills++;message(head?'精准爆头 +1':'确认击杀 +1');sound('hit');}}
  }
  function reloadGun(){if(!active||!player.alive||reload||ammo[weapon]===WEAPONS[weapon].mag||reserve[weapon]===0)return;reload=WEAPONS[weapon].reload;aim=false;sound('reload');}
  function switchGun(index){weapon=(index+4)%4;reload=0;cooldown=.25;aim=false;recoil=0;}
  function shoot(){if(cooldown>0||reload||!player.alive)return;if(!ammo[weapon]){reloadGun();return;}const w=WEAPONS[weapon];ammo[weapon]--;cooldown=w.interval;recoil+=w.recoil;flashTime=.05;sound('shot');
    const spread=w.spread*(aim?(weapon===2?.025:.25):1)*(keys.has('ShiftLeft')?2:1);ray.setFromCamera(new THREE.Vector2((Math.random()-.5)*spread,(Math.random()-.5)*spread),camera);
    const targets=bots.filter(b=>b.alive).flatMap(b=>b.model.parts);const hit=ray.intersectObjects([...world.surfaces,...targets],false)[0];const end=hit?hit.point:ray.ray.at(90,new THREE.Vector3());tracer(camera.position.clone().add(new THREE.Vector3(.1,-.15,0)),end);
    if(hit?.object.userData.bot){const b=hit.object.userData.bot;if(b.team!==0){damage(b,w.damage*(hit.object.userData.head?3:1),player,hit.object.userData.head);hitTime=.15;sound('hit');}}
    else if(hit){const m=new THREE.Mesh(new THREE.SphereGeometry(.035,5,4),new THREE.MeshBasicMaterial({color:'#f6d79d'}));m.position.copy(hit.point);scene.add(m);fx.push({mesh:m,life:.25,max:.25});}
    pitch=Math.min(1.45,pitch+w.recoil*.35);if(weapon===3)fire=false;
  }
  function sees(a,b){const start=a.pos.clone().add(new THREE.Vector3(0,1.55,0)),end=b.pos.clone().add(new THREE.Vector3(0,b===player?(keys.has('KeyC')?1:1.55):1.4,0)),dir=end.clone().sub(start),distance=dir.length();ray.set(start,dir.normalize());const hit=ray.intersectObjects(world.surfaces,false)[0];return !hit||hit.distance>distance;}
  function updateBots(dt){const difficulty=$('[data-difficulty]').value;for(const b of bots){if(!b.alive){b.timer-=dt;if(b.timer<=0)spawnBot(b);continue;}b.protect=Math.max(0,b.protect-dt);b.shot-=dt;b.repath-=dt;
    const enemies=[...bots,player].filter(t=>t.team!==b.team&&t.alive);enemies.sort((a,c)=>b.pos.distanceToSquared(a.pos)-b.pos.distanceToSquared(c.pos));const target=enemies[0];if(!target)continue;
    const distance=b.pos.distanceTo(target.pos),visibleTarget=distance<43&&sees(b,target);
    if(visibleTarget){b.model.group.rotation.y=Math.atan2(b.pos.x-target.pos.x,b.pos.z-target.pos.z);
      if(b.shot<=0){b.shot=difficulty==='hard'?.24:difficulty==='easy'?.65:.42;const from=b.pos.clone().add(new THREE.Vector3(0,1.35,0)),to=target.pos.clone().add(new THREE.Vector3(0,1.25,0));tracer(from,to,b.team===0?'#93d3ff':'#ffd29b');sound('enemy');const chance=(difficulty==='hard'?.73:difficulty==='easy'?.25:.46)*Math.max(.25,1-distance/65);if(Math.random()<chance)damage(target,difficulty==='hard'?18:13,b);}
    }
    if(!visibleTarget||distance>11){if(b.repath<=0||!b.path.length){b.path=pathTo(b.pos,target.pos);b.repath=1.1+Math.random()*.7;}const next=b.path[0];if(next){const dx=next.x-b.pos.x,dz=next.z-b.pos.z,len=Math.hypot(dx,dz);if(len<.18)b.path.shift();else {const step=Math.min(len,dt*3.3);move(b.pos,dx/len*step,dz/len*step);if(!visibleTarget)b.model.group.rotation.y=Math.atan2(-dx,-dz);b.model.legs[0].rotation.x=Math.sin(simTime*11)*.35;b.model.legs[1].rotation.x=-Math.sin(simTime*11)*.35;}}}
    b.model.group.position.copy(b.pos);
  }}
  function respawn(){player.pos.set(Math.random()>.5?7:-7,0,26);player.hp=100;player.alive=true;protect=2;player.protect=2;ammo=WEAPONS.map(w=>w.mag);reserve=WEAPONS.map(w=>w.reserve);reload=0;vy=0;yaw=pitch=0;message('已复活 · 2 秒出生保护');}
  function reset(){elapsed=0;scores=[0,0];kills=deaths=0;ended=false;feed.length=0;bots.forEach(spawnBot);respawn();started=false;$('.gun-start').innerHTML='进入战场 <span>↗</span>';$('.gun-menu-sub').textContent='运输船 / 团队竞技';$('.gun-menu-description').innerHTML='海风掠过甲板，交火即将开始。<br>穿过集装箱与侧翼通道，夺取这艘船。';}
  function pause(){if(!started||ended)return;active=false;fire=aim=false;keys.clear();touchMove={x:0,y:0};menu.hidden=false;stage.classList.remove('playing');$('.gun-start').innerHTML='继续战斗 <span>↗</span>';if(document.pointerLockElement===canvas)document.exitPointerLock();}
  async function start(){if(ended)reset();started=true;active=true;menu.hidden=true;stage.classList.add('playing');stage.focus();last=performance.now();if(!touch){try{await canvas.requestPointerLock();}catch{pause();message('鼠标锁定未成功，请再次点击继续战斗',5);}}if(!muted)sound('reload');}
  function finish(){ended=true;active=false;fire=false;aim=false;menu.hidden=false;stage.classList.remove('playing');if(document.pointerLockElement===canvas)document.exitPointerLock();$('.gun-menu-sub').textContent=`${scores[0]===scores[1]?'平局':scores[0]>scores[1]?'任务完成 · 保卫者胜利':'本局结束 · 潜伏者胜利'} / ${scores[0]} : ${scores[1]}`;$('.gun-menu-description').textContent=`你的战绩：${kills} 击杀 / ${deaths} 阵亡。重新集结，下一次交火见。`;$('.gun-start').innerHTML='再战一局 <span>↗</span>';}
  function updatePlayer(dt){if(!player.alive){dead-=dt;if(dead<=0)respawn();return;}protect=Math.max(0,protect-dt);player.protect=protect;const crouch=keys.has('KeyC'),height=crouch?1.05:1.75;
    let dx=Number(keys.has('KeyD'))-Number(keys.has('KeyA'))+touchMove.x,dz=Number(keys.has('KeyW'))-Number(keys.has('KeyS'))-touchMove.y,len=Math.hypot(dx,dz);if(len>1){dx/=len;dz/=len;}const speed=crouch?2.1:aim?2.8:keys.has('ShiftLeft')?7:4.5;
    move(player.pos,(dx*Math.cos(yaw)-dz*Math.sin(yaw))*speed*dt,(-dx*Math.sin(yaw)-dz*Math.cos(yaw))*speed*dt,height);
    const oldY=player.pos.y;vy-=18*dt;let nextY=oldY+vy*dt;grounded=false;
    for(const b of world.colliders){if(overlapsFootprint(b,player.pos.x,player.pos.z,.29)){if(vy<=0&&oldY>=b.maxY-.05&&nextY<=b.maxY){nextY=b.maxY;vy=0;grounded=true;}else if(vy>0&&oldY+height<=b.minY&&nextY+height>=b.minY){nextY=b.minY-height;vy=0;}}}player.pos.y=Math.max(0,nextY);if(player.pos.y===0)grounded=true;
    if(len>.1&&grounded){stepTime-=dt;if(stepTime<=0){sound('step');stepTime=keys.has('ShiftLeft')?.27:.4;}}
    camera.position.copy(player.pos);camera.position.y+=(crouch?1:1.65)+(len>.1&&grounded?Math.sin(simTime*12)*.035:0);camera.rotation.set(pitch,yaw,0);camera.fov=THREE.MathUtils.lerp(camera.fov,aim?(weapon===2?24:54):76,Math.min(1,dt*12));camera.updateProjectionMatrix();camera.updateMatrixWorld();
    if(reload>0){reload-=dt;if(reload<=0){const amount=Math.min(WEAPONS[weapon].mag-ammo[weapon],reserve[weapon]);ammo[weapon]+=amount;reserve[weapon]-=amount;reload=0;}}
    if(fire)shoot();
  }
  function hud(){ $('[data-blue]').textContent=String(scores[0]).padStart(2,'0');$('[data-red]').textContent=String(scores[1]).padStart(2,'0');const t=Math.max(0,Math.ceil(300-elapsed));$('[data-time]').textContent=`${Math.floor(t/60).toString().padStart(2,'0')}:${(t%60).toString().padStart(2,'0')}`;
    $('[data-health]').textContent=player.hp;$('.gun-health progress').value=player.hp;$('[data-kd]').textContent=`击杀 ${kills} · 阵亡 ${deaths}`;$('[data-weapon]').textContent=WEAPONS[weapon].name;$('[data-ammo]').textContent=ammo[weapon];$('[data-reserve]').textContent=reserve[weapon];$('[data-reload]').textContent=reload>0?`更换弹匣 ${reload.toFixed(1)}s`:WEAPONS[weapon].type;
    $('.gun-feed').replaceChildren(...feed.map(f=>{const d=document.createElement('div');d.textContent=f.text;return d;}));$('.gun-hit').style.opacity=hitTime>0?1:0;$('.gun-damage').style.opacity=hurt;$('.gun-scope').classList.toggle('on',aim&&weapon===2);$('.gun-crosshair').style.display=aim&&weapon===2?'none':'';$('.gun-crosshair').style.transform=`translate(-50%,-50%) scale(${1+recoil*9})`;$('.gun-notice').style.opacity=noticeTime>0?1:0;
    const ctx=$('.gun-radar canvas').getContext('2d');ctx.clearRect(0,0,180,180);ctx.fillStyle='#10212bbd';ctx.fillRect(0,0,180,180);ctx.strokeStyle='#6a828b';ctx.strokeRect(49,6,82,168);
    for(const c of world.containers){ctx.save();ctx.translate(90+c.x*2.7,90+c.z*2.7);ctx.rotate(-c.angle);ctx.fillStyle=c.color;ctx.fillRect(-c.w/2*2.7,-c.d/2*2.7,c.w*2.7,c.d*2.7);ctx.restore();}
    for(const b of bots.filter(b=>b.alive&&b.team===0)){ctx.fillStyle='#70ccf2';ctx.beginPath();ctx.arc(90+b.pos.x*2.7,90+b.pos.z*2.7,2.5,0,Math.PI*2);ctx.fill();}
    ctx.save();ctx.translate(90+player.pos.x*2.7,90+player.pos.z*2.7);ctx.rotate(-yaw);ctx.fillStyle='#f4edbc';ctx.beginPath();ctx.moveTo(0,-6);ctx.lineTo(-4,4);ctx.lineTo(4,4);ctx.fill();ctx.restore();
  }
  function tick(now){if(!visible)return;frame=requestAnimationFrame(tick);const dt=Math.min(.04,(now-last)/1000||.016);last=now;
    if(active){elapsed+=dt;simTime+=dt;cooldown=Math.max(0,cooldown-dt);flashTime=Math.max(0,flashTime-dt);hitTime=Math.max(0,hitTime-dt);hurt=Math.max(0,hurt-dt*1.4);noticeTime-=dt;recoil*=Math.exp(-dt*10);updatePlayer(dt);updateBots(dt);for(let i=feed.length-1;i>=0;i--){feed[i].time-=dt;if(feed[i].time<=0)feed.splice(i,1);}if(elapsed>=300||Math.max(...scores)>=40)finish();}
    else if(!started){const t=now*.00004;camera.position.set(22*Math.sin(t)*.15+11,13,25);camera.lookAt(-1,1,-4);}
    for(let i=fx.length-1;i>=0;i--){fx[i].life-=dt;if(fx[i].life<=0){scene.remove(fx[i].mesh);fx[i].mesh.geometry.dispose();fx[i].mesh.material.dispose();fx.splice(i,1);}}
    world.sea.material.uniforms.time.value=now*.001;
    renderer.autoClear=true;renderer.render(scene,camera);
    if(started&&player.alive&&!(aim&&weapon===2)){guns.forEach((g,i)=>g.visible=i===weapon);const g=guns[weapon];g.position.set(aim?.02:.25,-.22-(reload>0?.17:0)+Math.sin(simTime*9)*.003,-.64+recoil*1.7);g.rotation.set(reload>0?-.4:recoil,aim?0:.12,reload>0?-.45:0);flash.visible=flashTime>0;flash.position.set(g.position.x,g.position.y+.01,g.position.z-(weapon===3?.5:weapon===2?1.3:1.1)*.82);renderer.autoClear=false;renderer.clearDepth();renderer.render(weaponScene,weaponCamera);}
    hud();
  }
  $('.gun-start').addEventListener('click',start);$('[data-new-round]').addEventListener('click',()=>{pause();reset();start();});$('.gun-pause').addEventListener('click',pause);
  document.addEventListener('pointerlockchange',()=>{if(document.pointerLockElement!==canvas&&active&&!touch)pause();});
  document.addEventListener('mousemove',e=>{if(active&&document.pointerLockElement===canvas){const speed=.002*Number($('[data-sensitivity]').value)*(aim?.55:1);yaw-=e.movementX*speed;pitch=THREE.MathUtils.clamp(pitch-e.movementY*speed,-1.45,1.45);}});
  canvas.addEventListener('mousedown',e=>{if(!active)return;if(e.button===0)fire=true;if(e.button===2)aim=true;});document.addEventListener('mouseup',e=>{if(e.button===0)fire=false;if(e.button===2)aim=false;});stage.addEventListener('contextmenu',e=>e.preventDefault());
  window.addEventListener('keydown',e=>{if(!visible||!active)return;if(['KeyW','KeyA','KeyS','KeyD','Space','Tab','KeyC','ShiftLeft'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.code==='KeyR')reloadGun();if(/^Digit[1-4]$/.test(e.code))switchGun(Number(e.code.slice(-1))-1);if(e.code==='Space'&&grounded&&player.alive){vy=6.7;grounded=false;}if(e.code==='Escape')pause();if(e.code==='Tab')message(`保卫者 ${scores[0]} : ${scores[1]} 潜伏者 · 你 ${kills} 击杀 / ${deaths} 阵亡`,4);});
  window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  canvas.addEventListener('wheel',e=>{if(active){e.preventDefault();switchGun(weapon+(e.deltaY>0?1:-1));}},{passive:false});
  $('[data-sound]').addEventListener('click',()=>{muted=!muted;$('[data-sound]').textContent=`音效 ${muted?'关':'开'}`;$('[data-sound]').setAttribute('aria-pressed',String(!muted));});
  $('[data-fullscreen]').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await stage.requestFullscreen();}catch{message('浏览器暂不支持全屏',3);}});
  $('[data-quality]').addEventListener('change',e=>{const high=e.target.value==='high';renderer.setPixelRatio(high?Math.min(devicePixelRatio,1.6):1);renderer.shadowMap.enabled=high;scene.traverse(o=>{if(o.material)o.material.needsUpdate=true;});resize();});
  const stick=$('.gun-stick');let stickId=null,stickOrigin;stick.addEventListener('pointerdown',e=>{stickId=e.pointerId;stickOrigin={x:e.clientX,y:e.clientY};stick.setPointerCapture(e.pointerId);});stick.addEventListener('pointermove',e=>{if(e.pointerId!==stickId)return;const dx=e.clientX-stickOrigin.x,dy=e.clientY-stickOrigin.y,len=Math.max(36,Math.hypot(dx,dy));touchMove={x:dx/len,y:dy/len};stick.firstElementChild.style.transform=`translate(${touchMove.x*28}px,${touchMove.y*28}px)`;});for(const event of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(event,()=>{stickId=null;touchMove={x:0,y:0};stick.firstElementChild.style.transform='';});
  const look=$('.gun-look');let lookPos;look.addEventListener('pointerdown',e=>{lookPos={x:e.clientX,y:e.clientY};look.setPointerCapture(e.pointerId);});look.addEventListener('pointermove',e=>{if(!lookPos||!active)return;yaw-=(e.clientX-lookPos.x)*.004;pitch=THREE.MathUtils.clamp(pitch-(e.clientY-lookPos.y)*.004,-1.45,1.45);lookPos={x:e.clientX,y:e.clientY};});for(const event of ['pointerup','pointercancel'])look.addEventListener(event,()=>lookPos=null);
  root.querySelectorAll('[data-touch]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);const a=b.dataset.touch;if(a==='fire')fire=true;if(a==='aim')aim=!aim;if(a==='jump'&&grounded){vy=6.7;grounded=false;}if(a==='reload')reloadGun();if(a==='weapon')switchGun(weapon+1);});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>{if(b.dataset.touch==='fire')fire=false;});});
  return{setVisible(value){visible=value;if(!value){pause();cancelAnimationFrame(frame);}else{resize();last=performance.now();cancelAnimationFrame(frame);frame=requestAnimationFrame(tick);}}};
}
