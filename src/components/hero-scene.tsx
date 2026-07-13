"use client";
import Image from "next/image";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

function Rings(){
 const group=useRef<THREE.Group>(null),pointer=useRef({x:0,y:0}),rings=useMemo(()=>Array.from({length:7},(_,i)=>1.15+i*.52),[]),{size}=useThree();
 useEffect(()=>{const move=(event:PointerEvent)=>{pointer.current.x=event.clientX/window.innerWidth*2-1;pointer.current.y=-(event.clientY/window.innerHeight*2-1)};window.addEventListener("pointermove",move,{passive:true});return()=>window.removeEventListener("pointermove",move)},[]);
 useFrame((state,delta)=>{if(!group.current)return;const mobile=size.width<=800;group.current.position.x=THREE.MathUtils.lerp(group.current.position.x,mobile?0:2.65,.05);group.current.position.y=THREE.MathUtils.lerp(group.current.position.y,mobile?-2.05:0,.05);group.current.rotation.x=THREE.MathUtils.lerp(group.current.rotation.x,pointer.current.y*.22,.04);group.current.rotation.y=THREE.MathUtils.lerp(group.current.rotation.y,pointer.current.x*.35,.04);group.current.rotation.z+=delta*.055;group.current.scale.setScalar(1+Math.sin(state.clock.elapsedTime*1.2)*.018)});
 return <group ref={group}>{rings.map((radius,i)=><mesh key={radius} rotation={[Math.PI/2+i*.035,i*.08,0]}><torusGeometry args={[radius,i===3?.025:.012,12,160]}/><meshBasicMaterial color={i===3?"#cb6ce7":"#737373"} transparent opacity={i===3?.9:.34-i*.025}/></mesh>)}</group>
}
function FlowField(){
 const points=useRef<THREE.Points>(null),positions=useMemo(()=>{const data=new Float32Array(570);for(let i=0;i<190;i++){const angle=i*2.399,radius=1.5+(i/190)*7;data[i*3]=Math.cos(angle)*radius;data[i*3+1]=Math.sin(angle)*radius;data[i*3+2]=-1.8-((i*37)%101)/101*2}return data},[]);
 useFrame(state=>{if(points.current){points.current.rotation.z=state.clock.elapsedTime*-.025;points.current.rotation.x=Math.sin(state.clock.elapsedTime*.18)*.08}});
 return <points ref={points}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions,3]}/></bufferGeometry><pointsMaterial color="#cb6ce7" size={.025} transparent opacity={.42} sizeAttenuation/></points>
}
export function HeroScene(){return <div className="hero-scene" aria-hidden="true"><Canvas camera={{position:[0,0,8.7],fov:48}} dpr={[1,1.35]} gl={{antialias:true,alpha:true,powerPreference:"high-performance"}}><FlowField/><Sparkles count={36} scale={[9,7,3]} size={1.25} speed={.28} opacity={.24} color="#fff"/><Float speed={1.15} rotationIntensity={.12} floatIntensity={.32}><Rings/></Float></Canvas><div className="hero-scene-label"><span>EST. 2024</span><Image src="/brand/fits-logo-white.png" alt="" width={557} height={296} priority/><small>FOR LIFE</small></div><div className="hero-scene-scan"/></div>}
