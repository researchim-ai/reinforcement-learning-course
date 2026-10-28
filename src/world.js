import * as THREE from 'three';
import {WALLS,TRAPS,GOAL} from './rl.js';
export function mountWorld(host,{type='station',agent,motion=true,policy=()=>true,onTick=()=>{}}={}){
 if(!host)return()=>{};
 let renderer;
 try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});}catch{host.classList.add('no-webgl');host.innerHTML='<div class="fallback-tower"></div>';return()=>{};}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0x121616,0);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;host.appendChild(renderer.domElement);
 const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(type==='grid'?0x171b1b:0x1d2525,type==='grid'?.025:.038);
 const camera=new THREE.PerspectiveCamera(type==='grid'?36:40,1,.1,160);
 const matte=(color)=>new THREE.MeshStandardMaterial({color,roughness:.97});
 const add=(geo,color,x,y,z)=>{const m=new THREE.Mesh(geo,matte(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;};
 const box=(w,h,d,c,x,y,z)=>add(new THREE.BoxGeometry(w,h,d),c,x,y,z);
 scene.add(new THREE.AmbientLight(0x9eaaa7,type==='grid'?1.5:.85));const light=new THREE.DirectionalLight(0xc4c9c0,type==='grid'?2.4:1.8);light.position.set(-10,20,6);light.castShadow=true;light.shadow.mapSize.set(1024,1024);scene.add(light);
 let robot,ring,arrows=[],lastState=0,group=new THREE.Group();scene.add(group);
 if(type==='grid'){
  camera.position.set(10,12,13);camera.lookAt(0,0,0);
  box(8,.25,8,0x343d3a,0,-.28,0);
  for(let s=0;s<49;s++){
   const x=s%7-3,z=Math.floor(s/7)-3,w=WALLS.includes(s),trap=TRAPS.includes(s);
   box(.93,w?.85:.12,.93,w?0x697770:trap?0x684438:s===GOAL?0x7a8968:0x424c47,x,w?.25:-.08,z);
   if(trap)add(new THREE.ConeGeometry(.21,.42,4),0xac644d,x,.2,z);
   if(!w&&!trap&&s!==GOAL){const a=new THREE.ArrowHelper(new THREE.Vector3(0,0,-1),new THREE.Vector3(x,.04,z),.27,0xb6b598,.11,.08);a.visible=false;scene.add(a);arrows[s]=a;}
  }
  robot=new THREE.Group();const body=new THREE.Mesh(new THREE.BoxGeometry(.48,.52,.48),matte(0xc6b38d));body.position.y=.32;body.castShadow=true;robot.add(body);
  const eye=new THREE.Mesh(new THREE.BoxGeometry(.31,.09,.02),new THREE.MeshBasicMaterial({color:0xc65e47}));eye.position.set(0,.4,.25);robot.add(eye);scene.add(robot);
  const pole=add(new THREE.CylinderGeometry(.018,.018,1.25),0xb3b798,3,.6,3);box(.4,.24,.04,0xb1644c,3.2,1.05,3);
  ring=add(new THREE.TorusGeometry(.34,.018,8,32),0xbcb798,3,.03,3);ring.rotation.x=-Math.PI/2;
 }else{
  camera.position.set(17,6.8,24);camera.lookAt(0,6,-3);
  box(110,.15,100,0x222a28,0,-.2,-10);
  // Original industrial architecture: a deserted relay station and lattice antenna.
  box(11,4.6,8,0x4f5751,1,2.1,-6);box(5,7,6,0x424a46,-8,3.3,-10);
  box(12,.3,9,0x65685d,1,4.5,-6);box(5.4,.25,6.4,0x5e655e,-8,6.9,-10);
  for(let i=0;i<7;i++){box(.8,1.3,.04,0x202b29,-3.3+i*1.4,2.8,-1.96);box(.8,1.3,.045,i===3?0x6e5947:0x25302d,-3.3+i*1.4,2.8,-1.93);}
  box(1.4,2.4,.06,0x222a28,1,.95,-1.91);box(.75,.2,.08,0x9e5a44,1,2.7,-1.83);
  for(let j=0;j<2;j++)for(let i=0;i<3;i++)box(.65,1.2,.04,0x202a29,-9.5+i*1.3,2+j*2.1,-6.96);
  for(let i=0;i<3;i++){const h=5+i*1.4;box(6,h,5,0x3b4542,-15-i*9,h/2,-20-i*7);}
  const beam=(from,to,r=.055,c=0x737b6e)=>{const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),dir=b.clone().sub(a);const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,dir.length(),6),matte(c));m.position.copy(a.add(b).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());scene.add(m);};
  const tx=4,tz=-7;
  for(let side=0;side<4;side++){const a=side*Math.PI/2,b=(side+1)*Math.PI/2;const x=Math.cos(a),z=Math.sin(a);beam([tx+x*1.6,4.7,tz+z*1.6],[tx+x*.45,20,tz+z*.45],.075);for(let k=0;k<6;k++){const y=5+k*2.4,r=1.6-(y-4.7)/15.3*1.15,rr=r-.18;beam([tx+x*r,y,tz+z*r],[tx+Math.cos(b)*rr,y+2.4,tz+Math.sin(b)*rr],.035);}}
  beam([tx,19,tz],[tx,24,tz],.055);beam([tx-1.5,21,tz],[tx+1.5,21,tz],.035);beam([tx-1,22.6,tz],[tx+1,22.6,tz],.03);
  const beacon=add(new THREE.SphereGeometry(.11,12,12),0xb74f39,tx,24,tz);beacon.material.emissive=new THREE.Color(0xb74f39);beacon.material.emissiveIntensity=1;
  const redLight=new THREE.PointLight(0xab4b33,5,7);redLight.position.set(1,2,-1);scene.add(redLight);
  for(let i=0;i<8;i++){const z=9-i*3;box(.08,2.1,.08,0x727b71,9,1,z);box(2.8,.03,.03,0x676f65,9,2,z);}
  const points=[];for(let i=0;i<220;i++)points.push((Math.sin(i*23.71)*.5+.5)*70-35,Math.cos(i*3.3)*5+6,-(i%45));const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));const dust=new THREE.Points(g,new THREE.PointsMaterial({color:0xa3b0a5,size:.035,transparent:true,opacity:.25}));scene.add(dust);
 }
 let raf,last=0;const resize=new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();});resize.observe(host);
 const dirs=[new THREE.Vector3(0,0,-1),new THREE.Vector3(1,0,0),new THREE.Vector3(0,0,1),new THREE.Vector3(-1,0,0)];
 function frame(time){raf=requestAnimationFrame(frame);if(time-last<(motion?32:180))return;last=time;onTick(time);
  if(robot&&agent){const s=agent.state;const target=new THREE.Vector3(s%7-3,.02,Math.floor(s/7)-3);if(motion)robot.position.lerp(target,.35);else robot.position.copy(target);if(s!==lastState){const diff=s-lastState;if(diff===1)robot.rotation.y=Math.PI/2;if(diff===-1)robot.rotation.y=-Math.PI/2;if(diff===7)robot.rotation.y=0;if(diff===-7)robot.rotation.y=Math.PI;lastState=s;}
   arrows.forEach((a,s)=>{if(!a)return;const q=agent.q[s],best=Math.max(...q);a.visible=policy()&&best!==0;if(a.visible)a.setDirection(dirs[q.indexOf(best)]);});
  }else if(motion){camera.position.x=17+Math.sin(time*.00007)*.6;camera.lookAt(0,6,-3);}
  renderer.render(scene,camera);
 }frame(0);
 return()=>{cancelAnimationFrame(raf);resize.disconnect();scene.traverse(o=>{o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();});renderer.dispose();host.replaceChildren();};
}
