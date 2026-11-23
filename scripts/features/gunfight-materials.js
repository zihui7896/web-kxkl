import * as THREE from '../vendor/three.module.js';

// Procedural surface maps share a fixed seed so every load looks the same.
export function industrialTexture(base,kind='plate') {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const c=canvas.getContext('2d');
  let seed=472;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  c.fillStyle=base;c.fillRect(0,0,512,512);
  for(let i=0;i<18000;i++){c.fillStyle=`rgba(${random()>.48?'255,255,245':'15,27,35'},${random()*.075})`;c.fillRect(random()*512,random()*512,1+random()*2,1);}
  if(kind==='hazard'){
    c.fillStyle='#d8b951';c.fillRect(0,0,512,512);c.fillStyle='#202d32';
    for(let n=-512;n<1024;n+=128){c.beginPath();c.moveTo(n,0);c.lineTo(n+64,0);c.lineTo(n+576,512);c.lineTo(n+512,512);c.fill();}
  }else if(kind==='wood'){
    for(let i=0;i<250;i++){c.strokeStyle=`rgba(37,16,5,${random()*.15})`;c.beginPath();const y=random()*512;c.moveTo(0,y);c.bezierCurveTo(160,y+random()*16,300,y-random()*12,512,y+4);c.stroke();}
  }else{
    for(let x=0;x<512;x+=128){c.fillStyle='#10253550';c.fillRect(x,0,3,512);c.fillStyle='#ffffff55';c.fillRect(x+3,0,2,512);
      for(let y=12;y<512;y+=122){c.fillStyle='#4b5559';c.beginPath();c.arc(x+12,y,2.5,0,Math.PI*2);c.fill();c.fillStyle='#ffffff80';c.fillRect(x+11,y-2,2,1);
        c.fillStyle='#8a593b13';c.fillRect(x+10,y+3,4,15+random()*40);}}
    c.fillStyle='#18232a35';c.fillRect(0,254,512,2);c.fillStyle='#ffffff38';c.fillRect(0,256,512,2);
    for(let i=0;i<45;i++){const x=random()*512,y=random()*512,r=random()*8+2,g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'#74452930');g.addColorStop(1,'#74452900');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
  }
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.anisotropy=8;return tex;
}

export function bevelBox(w,h,d,r=.015){
  r=Math.min(r,w*.2,h*.2,d*.2);const x=-w/2+r,y=-h/2+r,a=w-2*r,b=h-2*r,s=new THREE.Shape();
  s.moveTo(x,y);s.lineTo(x+a,y);s.lineTo(x+a,y+b);s.lineTo(x,y+b);s.closePath();
  const geo=new THREE.ExtrudeGeometry(s,{depth:d-2*r,bevelEnabled:true,bevelThickness:r,bevelSize:r,bevelSegments:3,steps:1,curveSegments:1});geo.translate(0,0,-d/2+r);geo.computeVertexNormals();return geo;
}

export function oceanMaterial(){
  return new THREE.ShaderMaterial({uniforms:{time:{value:0}},vertexShader:`varying vec3 wp; uniform float time;
    void main(){vec3 p=position;p.y+=sin(p.x*.12+time)*.14+cos(p.z*.19+time*.8)*.1;wp=(modelMatrix*vec4(p,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.);}`,
    fragmentShader:`varying vec3 wp;uniform float time;
    float waves(vec2 p){return sin(p.x*2.1+sin(p.y*1.3+time)*1.5+time*1.2)*.045+sin(p.y*4.2+p.x*.7-time*1.6)*.023+sin(p.x*7.1+p.y*5.3+time*2.)*.009;}
    void main(){vec2 p=wp.xz;float h=waves(p);float dx=(waves(p+vec2(.03,0.))-h)/.03;float dz=(waves(p+vec2(0.,.03))-h)/.03;vec3 n=normalize(vec3(-dx,1.,-dz));vec3 v=normalize(cameraPosition-wp);vec3 l=normalize(vec3(-.4,.75,-.5));float fres=pow(1.-max(dot(n,v),0.),3.);float spec=pow(max(dot(reflect(-l,n),v),0.),110.);vec3 col=mix(vec3(.035,.19,.24),vec3(.4,.58,.65),fres);col+=vec3(.9,.85,.67)*spec*1.4;col+=h*.5;float fog=1.-exp(-length(cameraPosition-wp)*.003);col=mix(col,vec3(.65,.76,.8),fog);gl_FragColor=vec4(col,1.);}`});
}

// Circle against an oriented cargo footprint (also used by navigation and landing).
export function overlapsFootprint(box,x,z,r){
  if(box.angle){const dx=x-box.cx,dz=z-box.cz,c=Math.cos(box.angle),s=Math.sin(box.angle);x=box.cx+dx*c-dz*s;z=box.cz+dx*s+dz*c;}
  return x+r>box.minX&&x-r<box.maxX&&z+r>box.minZ&&z-r<box.maxZ;
}
