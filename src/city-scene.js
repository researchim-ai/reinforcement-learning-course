import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {cityObjects,chapters} from './narrative.js';

// Original, procedural city. No external models, textures or game assets.
export function mountCity(host,{interactive=false,motion=true,en=false,chapter=0,restored=0,fog=1.15,onInspect=()=>{},onPosition=()=>{}}={}){
 let renderer;try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});}catch{host.classList.add('city-fallback');host.textContent=en?'3D is unavailable. Use the object list to explore.':'3D недоступен. Исследуйте город через список объектов.';return {dispose(){host.replaceChildren();},walkTo(id){onInspect(id);},setFlashlight(){},setFog(){},move(){},reset(){}};}
 const low=matchMedia('(max-width:650px)').matches;renderer.setPixelRatio(Math.min(devicePixelRatio,low?1.25:1.6));renderer.setClearColor(0x626d68);renderer.outputColorSpace=THREE.SRGBColorSpace;host.appendChild(renderer.domElement);
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x626d68);scene.fog=new THREE.FogExp2(0x77837a,(interactive?.047:.032)*fog);
 const camera=new THREE.PerspectiveCamera(interactive?64:45,1,.1,190);camera.position.set(interactive?0:2,interactive?1.75:3.1,interactive?19:24);
 let yaw=interactive?0:-.04,lookY=0,target=null,arrival=null,raf,last=0,elapsed=0,pointer=null;
 const keys=new Set(),materials=[],textures=[],fogPlanes=[],labels=[];const vector=new THREE.Vector3();
 const material=(color,options={})=>{const m=new THREE.MeshStandardMaterial({color,roughness:.88,...options});materials.push(m);return m;};
 const add=(geometry,mat,x,y,z)=>{const mesh=new THREE.Mesh(geometry,mat);mesh.position.set(x,y,z);scene.add(mesh);return mesh;};
 const box=(w,h,d,mat,x,y,z)=>add(new THREE.BoxGeometry(w,h,d),mat,x,y,z);
 const concrete=material(0x505951),dark=material(0x303b36),stone=material(0x616a60),trim=material(0x6d7367),rust=material(0x7b5846),metal=material(0x45504a),lightMat=material(0xb7a882,{emissive:0x9e7b49,emissiveIntensity:.65}),glass=material(0x293a32,{roughness:.3});
 scene.add(new THREE.HemisphereLight(0xc4d0c4,0x343d36,2.2));const sun=new THREE.DirectionalLight(0xe4e7d6,1.8);sun.position.set(-22,40,20);scene.add(sun);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d');ctx.fillStyle='#303a35';ctx.fillRect(0,0,256,256);let seed=19+chapter*1239;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};for(let k=0;k<5500;k++){const v=Math.floor(35+random()*45);ctx.fillStyle=`rgba(${v},${v+6},${v},.24)`;ctx.fillRect(random()*256,random()*256,1+random()*4,1+random()*2);}const groundMap=new THREE.CanvasTexture(canvas);groundMap.wrapS=groundMap.wrapT=THREE.RepeatWrapping;groundMap.repeat.set(8,75);textures.push(groundMap);
 const road=add(new THREE.PlaneGeometry(14,200),material(0x58625a,{map:groundMap,roughness:.42,metalness:.13}),0,-.03,-60);road.rotation.x=-Math.PI/2;
 for(const side of [-1,1]){
  box(3,.2,200,stone,side*8.5,-.02,-60);box(.2,.22,200,trim,side*7,.05,-60);
  // Receding residential facades with separate cornices, pillars, balconies and shutters.
  for(let j=0;j<11;j++){
   const z=8-j*14.4,w=7.5+random()*3,h=11+Math.floor(random()*6)*2.1,x=side*(11.8+random()*.8);
   box(8.6,h,w,j%3===0?stone:concrete,x,h/2-.05,z);box(8.9,.38,w+.3,trim,x,h,z);box(9,.22,w+.4,dark,x,h-1.25,z);
   const wallX=x-side*4.32;
   for(let floor=0;floor<Math.floor(h/2.5);floor++){
    box(.16,.12,w+.1,trim,wallX,1.1+floor*2.5,z);
    for(let k=0;k<3;k++){
     const wz=z-w*.32+k*w*.32;const lit=(j===0&&k===1)||(restored>j&&floor===1&&k===0);
     box(.055,1.2,.85,lit?lightMat:glass,wallX-side*.03,2+floor*2.5,wz);
     box(.17,.11,1.02,trim,wallX-side*.09,1.32+floor*2.5,wz);
     if(floor===0){box(.18,1.6,.07,dark,wallX-side*.04,2,wz-.48);box(.18,1.6,.07,dark,wallX-side*.04,2,wz+.48);}
    }
   }
   box(.24,2.6,1.4,dark,wallX-side*.08,1.25,z+w*.34);if(j%2===0){const pipe=add(new THREE.CylinderGeometry(.065,.065,h,6),metal,wallX-side*.15,h/2,z-w*.43);}
  }
 }
 for(let j=0;j<29;j++){box(.14,.018,1.8,trim,0,0,16-j*5.5);}
 for(const x of [-1.55,1.55])box(.055,.025,180,metal,x,.01,-55);
 // Cross street, abandoned tram and building silhouettes behind it.
 const crossing=box(55,.03,8,material(0x3e4a42),0,0,-38);
 for(let j=0;j<7;j++)box(.7,.025,4,trim,-3.9+j*1.3,.03,-33.5);
 for(let j=0;j<7;j++){const h=17+random()*19;box(9,h,9,concrete,(j-3)*12,h/2,-95-random()*15);}
 const tram=box(2.7,2.8,8.5,material(0x565e50),-2.8,1.5,-56);box(2.8,.2,8.6,trim,-2.8,3,-56);box(2.75,1.1,8.1,glass,-2.8,2,-56);
 const wires=new THREE.LineBasicMaterial({color:0x394b40});materials.push(wires);for(const x of [-2,2]){const pts=[];for(let j=0;j<80;j++)pts.push(new THREE.Vector3(x,8.6-Math.sin(j/79*Math.PI)*.8,22-j*1.6));const geo=new THREE.BufferGeometry().setFromPoints(pts);scene.add(new THREE.Line(geo,wires));}
 for(let j=0;j<8;j++)for(const side of [-1,1]){
  const x=side*6.2,z=13-j*16;add(new THREE.CylinderGeometry(.06,.11,6.9,7),metal,x,3.45,z);box(1,.08,.13,metal,x-side*.43,6.8,z);
  box(.8,.13,.48,lightMat,x-side*.8,6.75,z);const lamp=new THREE.PointLight(0xd1af70,j<2||restored>=j?9:3,10,1.5);lamp.position.set(x-side*.8,6.5,z);scene.add(lamp);
  if(j<3){const cone=add(new THREE.ConeGeometry(1.3,5.4,20,1,true),new THREE.MeshBasicMaterial({color:0xcfbb85,transparent:true,opacity:.035,depthWrite:false,side:THREE.DoubleSide}),x-side*.8,4,z);materials.push(cone.material);}
 }
 function sign(text,w,h,x,y,z,rotation=0){const c=document.createElement('canvas');c.width=1024;c.height=256;const cc=c.getContext('2d');cc.fillStyle='#323d35';cc.fillRect(0,0,1024,256);cc.strokeStyle='#a3a78e';cc.lineWidth=5;cc.strokeRect(12,12,1000,232);cc.fillStyle='#c5c9af';cc.font='42px monospace';cc.textAlign='center';cc.textBaseline='middle';cc.fillText(text,512,128,960);const texture=new THREE.CanvasTexture(c);textures.push(texture);const m=new THREE.MeshBasicMaterial({map:texture});materials.push(m);const p=add(new THREE.PlaneGeometry(w,h),m,x,y,z);p.rotation.y=rotation;return p;}
 sign(chapters[chapter].place[en?1:0].toUpperCase(),5,.9,0,7.6,-33);sign(en?'NO. 9 — LAST SERVICE':'№ 9 — ПОСЛЕДНИЙ РЕЙС',3.8,.8,-5.8,2.7,9,Math.PI/7);
 sign(en?'DO NOT FOLLOW THE LIGHTS':'НЕ ИДИТЕ ЗА ОГНЯМИ',3.2,.55,-6.8,1.4,-4,Math.PI/2);
 // Phone booth, noticeboard, suitcase with tape recorder, terminal, and locked gate.
 box(1.6,2.8,1.3,metal,-4.6,1.4,7.9);box(1.44,2.45,.05,glass,-4.6,1.45,8.58);box(1.7,.23,1.4,rust,-4.6,2.85,7.9);sign(en?'TELEPHONE':'ТЕЛЕФОН',1.4,.28,-4.6,2.55,8.62);
 box(.5,.8,.15,lightMat,-4.6,1.5,8.64);box(.1,.32,.15,dark,-4.46,1.55,8.75);
 box(1.6,2.7,.16,metal,4.8,1.35,1);sign(en?'DISTRICT MAP':'СХЕМА РАЙОНА',1.5,.4,4.8,2.25,1.1);box(1.3,1.4,.03,material(0xb1ae92),4.8,1.3,1.1);
 for(let j=0;j<5;j++)box(1.1,.012,.015,metal,4.8,.8+j*.2,1.13);for(let j=0;j<4;j++)box(.012,1.1,.015,metal,4.4+j*.27,1.3,1.14);
 box(1.3,.45,.9,rust,-4.5,.5,-11);box(.65,.16,.5,dark,-4.5,.82,-11);add(new THREE.TorusGeometry(.13,.025,6,20),trim,-4.65,.92,-10.73);
 box(1.1,1.8,.8,metal,4.5,.9,-22);box(.85,.56,.035,lightMat,4.5,1.35,-21.57);sign(en?'ACCESS':'ДОПУСК',1,.27,4.5,2,-21.57);
 const gateMat=material(restored>chapter?0x72806a:0x866354);for(const x of [-5.8,5.8])box(.4,4,.4,metal,x,2,-35);const barrier=box(11.3,.22,.25,gateMat,0,1.8,-35);if(restored>chapter){barrier.rotation.z=Math.PI*.38;barrier.position.x=-3.7;barrier.position.y=4.4;}
 // Batch static facades by material: the city should not cost a draw call per window.
 scene.updateMatrixWorld(true);
 const batches=new Map();
 scene.traverse(o=>{if(o.isMesh&&!Array.isArray(o.material)){const key=o.material.uuid;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(o);}});
 for(const group of batches.values()){
  if(group.length<3)continue;
  const parts=group.map(m=>m.geometry.clone().applyMatrix4(m.matrixWorld));
  const merged=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());
  if(merged){const mesh=new THREE.Mesh(merged,group[0].material);group.forEach(m=>{scene.remove(m);m.geometry.dispose();});scene.add(mesh);}
 }
 // Real depth fog plus several drifting, noise-shaped fog curtains.
 const fogVertex=`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
 const fogFragment=`precision mediump float;varying vec2 vUv;uniform float uTime;uniform float uOpacity;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}void main(){vec2 p=vUv*vec2(4.,2.);p.x+=uTime*.028;float v=n(p)*.6+n(p*2.1+uTime*.012)*.3+n(p*4.2)*.1;float edge=smoothstep(0.,.12,vUv.x)*smoothstep(0.,.12,1.-vUv.x);float fade=smoothstep(0.,.16,vUv.y)*smoothstep(0.,.3,1.-vUv.y);gl_FragColor=vec4(.67,.72,.68,(.28+v*.7)*uOpacity*edge*fade);}`;
 const curtainCount=low?5:8;for(let j=0;j<curtainCount;j++){const mat=new THREE.ShaderMaterial({vertexShader:fogVertex,fragmentShader:fogFragment,uniforms:{uTime:{value:j*4},uOpacity:{value:(interactive?.34:.38)*fog}},transparent:true,depthWrite:false,side:THREE.DoubleSide});materials.push(mat);const plane=add(new THREE.PlaneGeometry(44,11+j*1.5),mat,Math.sin(j*7)*2,3.5,-2-j*12);fogPlanes.push(plane);}
 const flash=new THREE.SpotLight(0xf0e4bd,interactive?22:0,26,.4,.7,1);camera.add(flash);flash.position.set(.15,-.2,.05);flash.target.position.set(0,-.3,-10);camera.add(flash.target);scene.add(camera);
 const point=new THREE.PointLight(0xd2d2aa,2,7,2);camera.add(point);
 const overlay=document.createElement('div');overlay.className='city-hotspots';if(interactive)host.appendChild(overlay);
 cityObjects.forEach(obj=>{const button=document.createElement('button');button.type='button';button.className='city-hotspot';button.dataset.worldObject=obj.id;button.innerHTML='<span class="hotspot-pin">+</span><span class="hotspot-name"></span>';button.lastChild.textContent=obj.name[en?1:0];button.addEventListener('click',e=>{e.stopPropagation();walkTo(obj.id);});if(interactive)overlay.appendChild(button);labels.push({obj,button});});
 host.tabIndex=interactive?0:-1;
 function walkTo(id){const o=cityObjects.find(o=>o.id===id);if(!o)return;target=new THREE.Vector3(Math.max(-4,Math.min(4,o.position[0])),1.75,Math.min(20,o.position[2]+2.6));arrival=id;if(!motion){camera.position.copy(target);target=null;arrival=null;onInspect(id);}}
 function nearest(){return cityObjects.map(o=>({o,d:Math.hypot(camera.position.x-o.position[0],camera.position.z-o.position[2])})).sort((a,b)=>a.d-b.d)[0];}
 function inspectNearest(){const item=nearest();if(item.d<5)onInspect(item.o.id);}
 const keyDown=e=>{if(!interactive||e.ctrlKey||e.metaKey||e.altKey||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)||document.querySelector('dialog[open]'))return;const k=e.key.toLowerCase();if(['w','a','s','d','ц','ф','ы','в','arrowup','arrowdown','arrowleft','arrowright','e','у'].includes(k)){e.preventDefault();keys.add(k);target=null;arrival=null;if(k==='e'||k==='у')inspectNearest();}};
 const keyUp=e=>keys.delete(e.key.toLowerCase());const blur=()=>keys.clear();
 const down=e=>{if(!interactive||e.target.closest('button'))return;host.focus({preventScroll:true});pointer={x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture?.(e.pointerId);};
 const move=e=>{if(!pointer)return;yaw-= (e.clientX-pointer.x)*.003;lookY=Math.max(-.25,Math.min(.25,lookY+(e.clientY-pointer.y)*.002));pointer={x:e.clientX,y:e.clientY};};const up=()=>pointer=null;
 if(interactive){window.addEventListener('keydown',keyDown);window.addEventListener('keyup',keyUp);window.addEventListener('blur',blur);renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('pointercancel',up);}
 const resize=new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();});resize.observe(host);
 const motionStep=(forward,strafe,dt)=>{target=null;arrival=null;camera.position.x+=(-Math.sin(yaw)*forward+Math.cos(yaw)*strafe)*dt*4;camera.position.z+=(-Math.cos(yaw)*forward-Math.sin(yaw)*strafe)*dt*4;camera.position.x=Math.max(-5.3,Math.min(5.3,camera.position.x));camera.position.z=Math.max(-33,Math.min(20,camera.position.z));};
 let report=0;function frame(time){raf=requestAnimationFrame(frame);if(time-last<(motion?32:110))return;const dt=Math.min((time-last)/1000,.08);last=time;elapsed+=dt;
  if(interactive){
   const forward=Number(keys.has('w')||keys.has('ц')||keys.has('arrowup'))-Number(keys.has('s')||keys.has('ы')||keys.has('arrowdown'));const strafe=Number(keys.has('d')||keys.has('в')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('ф')||keys.has('arrowleft'));if(forward||strafe)motionStep(forward,strafe,dt);
   if(target){const diff=target.clone().sub(camera.position);if(diff.length()<.12){camera.position.copy(target);target=null;const id=arrival;arrival=null;if(id)onInspect(id);}else camera.position.add(diff.normalize().multiplyScalar(Math.min(diff.length(),dt*5.2)));}
   camera.lookAt(camera.position.x-Math.sin(yaw)*12,camera.position.y+lookY*10,camera.position.z-Math.cos(yaw)*12);
   if(time-report>250){report=time;const n=nearest();onPosition({x:camera.position.x,z:camera.position.z,nearest:n.o.id,distance:n.d});}
   labels.forEach(({obj,button})=>{vector.set(...obj.position);const d=vector.distanceTo(camera.position);vector.project(camera);const visible=vector.z<1&&vector.z>-1&&Math.abs(vector.x)<1&&Math.abs(vector.y)<.94&&d<39;button.hidden=!visible;if(visible){button.style.left=`${(vector.x*.5+.5)*100}%`;button.style.top=`${(-vector.y*.5+.5)*100}%`;button.classList.toggle('near',d<6);}});
  }else{camera.position.x=2+(motion?Math.sin(elapsed*.065)*1.2:0);camera.lookAt(-2,3.8,-42);}
  if(motion)fogPlanes.forEach((p,j)=>p.material.uniforms.uTime.value=elapsed+j*4);renderer.render(scene,camera);
 }frame(0);
 return {walkTo,setFog(value){scene.fog.density=(interactive?.047:.032)*value;fogPlanes.forEach(p=>p.material.uniforms.uOpacity.value=(interactive?.34:.38)*value);},setFlashlight(value){flash.intensity=value?22:0;},move(forward,strafe){motionStep(forward,strafe,.5);},reset(){camera.position.set(0,1.75,19);yaw=0;lookY=0;target=null;arrival=null;},dispose(){cancelAnimationFrame(raf);resize.disconnect();window.removeEventListener('keydown',keyDown);window.removeEventListener('keyup',keyUp);window.removeEventListener('blur',blur);renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointermove',move);renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('pointercancel',up);scene.traverse(o=>o.geometry?.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();renderer.forceContextLoss();host.replaceChildren();}};
}
