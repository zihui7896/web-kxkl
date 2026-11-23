/* Transport Ship — self-contained procedural environment. Units are metres. */
import * as THREE from '../vendor/three.module.js';
import {industrialTexture,bevelBox,oceanMaterial} from './gunfight-materials.js';
export function buildShip(scene) {
  const colliders=[], surfaces=[], containers=[];
  const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color:extra.map?'#ffffff':color,roughness:.83,...extra});
  const wallTexture=industrialTexture('#b9c5c9');const steel=mat('#59666a'), dark=mat('#26353b'), ivory=mat('#c5c6b7',{map:wallTexture,bumpMap:wallTexture,bumpScale:.035,metalness:.18,roughness:.6}), yellow=mat('#d5ac52');
  function texture(color,kind='metal') {
    const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');
    x.fillStyle=color;x.fillRect(0,0,256,256);
    let seed=81;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<7500;i++){x.fillStyle=`rgba(${rand()>.5?'255,243,217':'21,27,29'},${rand()*.15})`;x.fillRect(rand()*256,rand()*256,rand()*3+1,rand()*3+1);}
    if(kind==='metal')for(let i=0;i<256;i+=16){x.fillStyle='#00000035';x.fillRect(i,0,4,256);x.fillStyle='#ffffff19';x.fillRect(i+4,0,2,256);}
    else for(let i=0;i<256;i+=64){x.strokeStyle='#202b2b66';x.strokeRect(i,0,64,256);for(let j=8;j<256;j+=60){x.fillStyle='#222b2b';x.fillRect(i+5,j,3,3);}}
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;
  }
  function box(w,h,d,x,y,z,m=steel,solid=true,parent=scene) {
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);
    if(solid){colliders.push({minX:x-w/2,maxX:x+w/2,minY:y-h/2,maxY:y+h/2,minZ:z-d/2,maxZ:z+d/2});surfaces.push(mesh);}return mesh;
  }
  function label(text,x,y,z,w=3,h=.7,color='#ece6c8',ry=0){
    const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.font='bold 55px monospace';ctx.textAlign='center';ctx.fillText(text,256,83);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,side:THREE.DoubleSide}));mesh.position.set(x,y,z);mesh.rotation.y=ry;scene.add(mesh);return mesh;
  }
  const deckmat=mat('#82908c',{map:texture('#82908c','deck')});deckmat.map.repeat.set(12,20);
  box(30,1,62,0,-.5,0,deckmat);box(31,3,63,0,-2,0,mat('#243b43'),false);
  // Low hull walls keep the sea visible; covered flank corridors flank the cargo.
  for(const side of [-1,1]){
    box(.5,2.8,62,side*15,1.4,0,ivory);
    for(let z=-28;z<=28;z+=4){box(.12,.9,.12,side*14.7,3.25,z,dark,false);}
    box(.1,.1,60,side*14.7,3.65,0,dark,false);
    box(2.7,.22,32,side*13.3,3.05,0,steel);
    for(let z=-16;z<=16;z+=8)box(.15,3,.18,side*11.95,1.5,z,ivory);
    for(let z=-25;z<26;z+=5){const line=box(.13,.014,2,side*11,.012,z,yellow,false);}
  }
  function container(x,z,color,id,y=1.55,w=4,d=9,angle=0){
    const first=scene.children.length,firstCollider=colliders.length;
    const tex=texture(color);tex.repeat.set(2,1);const m=mat(color,{map:tex,bumpMap:tex,bumpScale:.055});box(w,3.1,d,x,y,z,m);containers.push({x,z,w,d,y,color,angle});
    for(const sx of [-1,1])for(const sz of [-1,1])box(.12,3.18,.12,x+sx*(w/2-.05),y,z+sz*(d/2-.04),dark,false);
    for(const sz of [-1,1]){
      box(w,.1,.1,x,y+1.47,z+sz*d/2,steel,false);box(w,.1,.1,x,y-1.47,z+sz*d/2,steel,false);
      for(const dx of [-w*.27,w*.27])box(.055,2.65,.07,x+dx,y,z+sz*(d/2+.02),ivory,false);
      label('CARGO '+id,x,y+.4,z+sz*(d/2+.07),w*.83,.5,'#d9ddce',sz===-1?Math.PI:0);
      label('MAX. GROSS 30 480 KG',x,y-.65,z+sz*(d/2+.08),w*.7,.25,'#d9ddce',sz===-1?Math.PI:0);
    }
    label('SEAWAY',x+w/2+.025,y,z,4,.8,'#e3debf',Math.PI/2);
    label('SEAWAY',x-w/2-.025,y,z,4,.8,'#e3debf',-Math.PI/2);
    // Physical corrugations catch sunlight at grazing angles.
    const ribGeo=new THREE.BoxGeometry(.055,2.82,.06),ribCount=Math.floor(d/.26)*2;
    const ribs=new THREE.InstancedMesh(ribGeo,m,ribCount);const transform=new THREE.Object3D();let ri=0;
    for(const side of [-1,1])for(let i=0;i<Math.floor(d/.26);i++){transform.position.set(x+side*(w/2+.02),y,z-d/2+.12+i*.26);transform.updateMatrix();ribs.setMatrixAt(ri++,transform.matrix);}ribs.receiveShadow=true;scene.add(ribs);
    if(angle){const pivot=new THREE.Group();scene.add(pivot);const children=scene.children.slice(first,-1);for(const child of children)pivot.attach(child);pivot.position.set(x,0,z);for(const child of pivot.children)child.position.sub(new THREE.Vector3(x,0,z));pivot.rotation.y=angle;
      for(let i=firstCollider;i<colliders.length;i++)Object.assign(colliders[i],{angle,cx:x,cz:z});
    }
  }
  container(-7,-12,'#64756c','021');container(7,12,'#637c88','037');
  container(-7,0,'#7e4334','108');container(7,0,'#536c77','052');
  container(-2.5,-4.8,'#9a7046','218',1.55,3.8,7,-.36);container(2.5,4.8,'#527d72','306',1.55,3.8,7,-.36);
  container(-7,-12,'#647e87','011',4.65);container(7,12,'#876547','019',4.65);
  // Wooden crates provide a jump route onto the lower containers.
  const wood=mat('#9b815d',{map:texture('#9b815d','deck')});
  for(const [x,z,h] of [[-9.7,8,1],[9.7,-8,1],[-9.7,6,2],[9.7,-6,2],[-3,15,1.3],[3,-15,1.3],[-5,17,1.8],[5,-17,1.8]]){
    box(1.7,h,1.7,x,h/2,z,wood);for(const dz of [-.86,.86]){box(1.72,.11,.05,x,.12,z+dz,dark,false);box(1.72,.11,.05,x,h-.12,z+dz,dark,false);}
  }
  for(const side of [-1,1]){
    const z=side*26;
    box(30,7,.6,0,3.5,side*31,ivory);box(30,.3,10,0,6.9,z,ivory);
    const caution=industrialTexture('#d8b951','hazard');caution.repeat.set(4,1);const cautionMat=mat('#ffffff',{map:caution,roughness:.7});
    for(const xx of [-7.3,7.3]){
      box(7.5,.25,.72,xx,5.35,side*21,cautionMat,false);
      for(const edge of [-3.7,3.7])box(.15,5.2,.72,xx+edge,2.6,side*21,cautionMat,false);
      const lamp=new THREE.Mesh(new THREE.SphereGeometry(.14,10,8),new THREE.MeshStandardMaterial({color:'#fff6d6',emissive:'#fff0bd',emissiveIntensity:2}));lamp.position.set(xx,5.75,side*20.55);scene.add(lamp);
    }
    label('CARGO HOLD / No. 3',-8,4.3,side*20.6,3.2,.42,'#283e4c',side===1?Math.PI:0);
    // Two wide doors and a central wall give protected spawn cabins.
    box(7,5.5,.6,0,2.75,side*21,ivory);box(3.8,5.5,.6,-13,2.75,side*21,ivory);box(3.8,5.5,.6,13,2.75,side*21,ivory);
    box(30,1.3,.7,0,6.1,side*21,ivory);
    label(side===1?'GLOBAL RISK':'BLACK LIST',0,4.4,side*20.62,6,.8,side===1?'#7aaec3':'#d39c76',side===1?Math.PI:0);
    box(17,3.2,5,0,8.6,side*28,ivory,false);
    for(let x=-6;x<=6;x+=2)box(1.5,1.1,.1,x,8.8,side*25.45,mat('#28414b',{metalness:.5,roughness:.2}),false);
    box(3,5,3,-9,9,side*28,dark,false);box(3.3,.7,3.3,-9,11.5,side*28,mat('#934a39'),false);
    box(.17,10,.17,8,11,side*28,steel,false);box(5,.12,.12,8,14,side*28,steel,false);
    for(let x=-10;x<11;x+=4){box(1.2,.03,.5,x,.03,side*20,yellow,false);}
  }
  // Deck fittings, bollards and weathered supply drums.
  const drumMat=mat('#9a6c40',{map:texture('#9a6c40')});
  for(const [x,z] of [[-10,19],[10,-19],[-10,-21],[10,21]]){
    const drum=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,1.1,18),drumMat);drum.position.set(x,.55,z);drum.castShadow=true;drum.receiveShadow=true;scene.add(drum);surfaces.push(drum);colliders.push({minX:x-.42,maxX:x+.42,minZ:z-.42,maxZ:z+.42,minY:0,maxY:1.1});
    for(const y of [.15,.9]){const ring=new THREE.Mesh(new THREE.TorusGeometry(.425,.025,5,18),steel);ring.rotation.x=Math.PI/2;ring.position.set(x,y,z);scene.add(ring);}
  }
  for(const x of [-14,14])for(const z of [-24,-8,8,24]){box(.6,.15,.7,x,.08,z,dark,false);box(.18,.55,.18,x,.35,z,dark,false);box(.6,.15,.18,x,.6,z,dark,false);}
  // Open ocean with animated vertex ripples, distant port and sky dome.
  const seaGeo=new THREE.PlaneGeometry(1500,1500,75,75);seaGeo.rotateX(-Math.PI/2);
  const sea=new THREE.Mesh(seaGeo,oceanMaterial());sea.position.y=-3.1;scene.add(sea);
  const sky=new THREE.Mesh(new THREE.SphereGeometry(700,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{},vertexShader:'varying vec3 v; void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 v; void main(){float h=normalize(v).y;vec3 c=mix(vec3(.77,.83,.83),vec3(.26,.49,.66),smoothstep(0.,.65,h));gl_FragColor=vec4(c,1.);}'}));scene.add(sky);
  const sun=new THREE.Mesh(new THREE.SphereGeometry(12,16,12),new THREE.MeshBasicMaterial({color:'#fff4d7'}));sun.position.set(-210,240,-380);scene.add(sun);
  for(let i=0;i<17;i++)box(12+i%3*9,6+i%5*4,12,-180+i*23,2,-180-(i%3)*15,mat('#789096'),false);
  for(let i=0;i<4;i++){const x=-120+i*65;box(2,52,2,x,23,-160,steel,false);box(44,2,2,x+15,48,-160,steel,false);box(.2,29,.2,x+32,33,-160,dark,false);}
  return {colliders,surfaces,containers,sea,box,mat,label};
}

export function makeSoldier(team){
  const group=new THREE.Group(),parts=[];const suit=new THREE.MeshStandardMaterial({color:team===0?'#344d5a':'#715747',roughness:.9}),vest=new THREE.MeshStandardMaterial({color:'#263034'}),skin=new THREE.MeshStandardMaterial({color:'#b69476'});
  const add=(w,h,d,x,y,z,m)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;group.add(o);parts.push(o);return o;};
  add(.58,.7,.32,0,1.12,0,suit);add(.61,.44,.37,0,1.2,-.02,vest);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.21,10,8),skin);head.position.y=1.73;head.scale.y=1.15;group.add(head);parts.push(head);head.userData.head=true;
  add(.43,.16,.43,0,1.9,0,suit);add(.34,.11,.05,0,1.76,-.2,vest);
  const legs=[add(.23,.76,.26,-.17,.4,0,suit),add(.23,.76,.26,.17,.4,0,suit)];
  add(.23,.55,.23,-.39,1.15,-.12,suit).rotation.x=-.8;add(.23,.55,.23,.39,1.15,-.12,suit).rotation.x=-.8;
  add(.13,.16,.85,.18,1.28,-.5,vest);add(.07,.07,.4,.18,1.3,-1.02,vest);
  for(const xx of [-.2,0,.2])add(.15,.22,.08,xx,1.12,-.24,vest);
  add(.48,.42,.17,0,1.18,.23,vest);
  for(const xx of [-.18,.18]){add(.24,.17,.31,xx,.46,-.04,vest);add(.25,.15,.38,xx,.1,-.05,vest);}
  const badge=add(.16,.13,.015,0,1.36,-.215,new THREE.MeshBasicMaterial({color:team===0?'#6fd5ff':'#f8ae72'}));
  return {group,parts,legs,head};
}

export function makeWeapon(kind){
  const grain=industrialTexture('#a46c42','wood');const g=new THREE.Group();const black=new THREE.MeshStandardMaterial({color:'#18222b',metalness:.78,roughness:.24,envMapIntensity:.4}),steel=new THREE.MeshStandardMaterial({color:'#384752',metalness:.85,roughness:.24,envMapIntensity:.5}),wood=new THREE.MeshStandardMaterial({color:kind===1?'#ae764d':'#37414a',map:kind===1?grain:null,roughness:.48});
  function b(w,h,d,x,y,z,m=black){const o=new THREE.Mesh(bevelBox(w,h,d,.012),m);o.position.set(x,y,z);g.add(o);return o;}
  function cylinder(r,len,x,y,z,m=black){const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,12),m);o.rotation.x=Math.PI/2;o.position.set(x,y,z);g.add(o);return o;}
  const pistol=kind===3,sniper=kind===2;
  b(.12,.14,pistol?.3:.53,0,0,-.2,steel);b(.1,.22,.13,0,-.13,pistol?-.14:-.03,black).rotation.x=-.25;
  if(!pistol){b(.12,.14,.32,0,-.015,.18,wood);b(.09,.25,.16,0,-.19,-.25,black).rotation.x=kind===1?-.25:.08;b(.14,.13,.34,0,0,-.59,wood);for(let i=0;i<7;i++)b(.15,.025,.019,0,.08,-.4-i*.044,black);}
  cylinder(pistol?.026:.023,pistol?.17:sniper?.65:.38,0,.012,pistol?-.4:sniper?-.98:-.87,steel);
  cylinder(.034,.075,0,.012,pistol?-.49:sniper?-1.3:-1.08);
  if(sniper){cylinder(.065,.35,0,.15,-.3);cylinder(.077,.045,0,.15,-.1,steel);}else {b(.018,.085,.018,0,.1,pistol?-.35:-.94);b(.09,.04,.06,0,.1,-.05);}
  if(!pistol){
    b(.13,.065,.45,0,.085,-.23,black);
    const port=b(.012,.035,.14,.067,.02,-.15,black);b(.045,.018,.025,.085,.015,-.12,steel);
    for(const x of [-.067,.067])for(const z of [-.06,-.3]){const pin=new THREE.Mesh(new THREE.SphereGeometry(.009,8,6),steel);pin.scale.x=.25;pin.position.set(x,-.005,z);g.add(pin);}
    if(kind===1){for(let i=0;i<4;i++)b(.093,.012,.16,0,-.12-i*.047,-.25-i*.008,steel);cylinder(.016,.32,0,.07,-.84,steel);}
    const trigger=new THREE.Mesh(new THREE.TorusGeometry(.047,.007,6,14,Math.PI*1.55),black);trigger.position.set(0,-.14,-.09);trigger.rotation.y=Math.PI/2;g.add(trigger);
  }
  const glove=new THREE.MeshStandardMaterial({color:'#3b403b',roughness:.95});b(.15,.16,.21,.04,-.22,.04,glove);if(!pistol)b(.14,.14,.25,-.07,-.13,-.56,glove);
  const sleeve=new THREE.MeshStandardMaterial({color:'#596975',roughness:.9});
  const arm=new THREE.Mesh(new THREE.CylinderGeometry(.075,.105,.48,12),sleeve);arm.rotation.x=Math.PI/2-.2;arm.position.set(.08,-.24,.28);g.add(arm);
  if(!pistol){const support=new THREE.Mesh(new THREE.CylinderGeometry(.068,.095,.43,12),sleeve);support.rotation.set(1.15,0,-.4);support.position.set(-.12,-.28,-.35);g.add(support);}

  return g;
}
