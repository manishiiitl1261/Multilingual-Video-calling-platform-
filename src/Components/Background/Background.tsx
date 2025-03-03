// "use client";

// import { Canvas, useFrame } from "@react-three/fiber";
// import { useRef } from "react";
// import * as THREE from "three";
// import { Mesh } from "three";

// function WavyBackground() {
//   const mesh = useRef<Mesh>(null);
//   const mouse = useRef({ x: 0, y: 0 });

//   // Track mouse movement
//   const handleMouseMove = (event: MouseEvent) => {
//     mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
//     mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
//   };

//   useFrame(() => {
//     if (mesh.current) {
//       mesh.current.rotation.x += (mouse.current.y - mesh.current.rotation.x) * 0.02;
//       mesh.current.rotation.y += (mouse.current.x - mesh.current.rotation.y) * 0.02;
//     }
//   });

//   // Attach event listener
//   if (typeof window !== "undefined") {
//     window.addEventListener("mousemove", handleMouseMove);
//   }

//   return (
//     <mesh ref={mesh}>
//       {/* Create a plane geometry with a wavy effect */}
//       <planeGeometry args={[5, 5, 50, 50]} />
//       <meshStandardMaterial
//         wireframe
//         color="#38bdf8"
//         emissive="#0ea5e9"
//         emissiveIntensity={0.5}
//       />
//     </mesh>
//   );
// }

// export default function Background() {
//   return (
//     <Canvas
//       camera={{ position: [0, 0, 3], fov: 75 }}
//       className="absolute inset-0 z-[-1]"
//     >
//       <ambientLight intensity={0.5} />
//       <WavyBackground />
//     </Canvas>
//   );
// }
