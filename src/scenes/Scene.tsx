import { useMemo, useRef, memo, useEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useCyberpunkStore, selectCorePulse } from '../store/useCyberpunkStore';
import { sound } from '../lib/sound';

/** Custom holographic shader for the core */
const hologramVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const hologramFragment = /* glsl */ `
  uniform float uTime;
  uniform float uPulse;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
    float scan = sin(vPosition.y * 12.0 + uTime * 3.0) * 0.5 + 0.5;
    float glitch = step(0.98, sin(uTime * 20.0 + vPosition.x * 50.0)) * 0.15;
    vec3 col = mix(vec3(0.05, 0.7, 0.9), vec3(0.6, 0.2, 1.0), fresnel);
    col += scan * 0.15;
    col += glitch;
    col *= 0.85 + uPulse * 0.25;
    float alpha = 0.75 + fresnel * 0.25;
    gl_FragColor = vec4(col, alpha);
  }
`;

const Scene = () => {
  const coreRef = useRef<THREE.Mesh>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);
  const ring2Ref = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  const corePulse = useCyberpunkStore(selectCorePulse);
  const pulseCore = useCyberpunkStore((s) => s.pulseCore);

  const boxGeo = useMemo(() => new THREE.BoxGeometry(1.2, 1.2, 1.2), []);
  const ringGeo = useMemo(() => new THREE.TorusGeometry(5.2, 0.08, 12, 128), []);
  const ringGeo2 = useMemo(() => new THREE.TorusGeometry(6.8, 0.05, 10, 96), []);
  const pyramidGeo = useMemo(() => new THREE.ConeGeometry(1.6, 3.2, 4), []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPulse: { value: 0 },
    }),
    []
  );

  useEffect(() => {
    if (matRef.current) {
      matRef.current.uniforms.uPulse.value = Math.min(1, corePulse * 0.15);
    }
  }, [corePulse]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    uniforms.uTime.value = t;
    coreRef.current.rotation.y = t * 0.35;
    coreRef.current.rotation.x = t * 0.18;
    const s = 1 + Math.sin(t * 2.1) * 0.035 + corePulse * 0.02;
    coreRef.current.scale.setScalar(Math.min(s, 1.4));
    ringRef.current.rotation.z = t * 0.12;
    ringRef.current.rotation.x = Math.sin(t * 0.08) * 0.15;
    ring2Ref.current.rotation.z = -t * 0.08;
    ring2Ref.current.rotation.y = t * 0.05;
  });

  const onCoreClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    sound.notify();
    pulseCore();
  };

  return (
    <>
      <color attach="background" args={['#030308']} />
      <ambientLight intensity={0.12} />
      <pointLight position={[10, 12, 10]} intensity={2.2} color="#22d3ee" distance={35} />
      <pointLight position={[-8, -6, -8]} intensity={1.4} color="#c084fc" distance={30} />
      <pointLight position={[0, 14, -4]} intensity={0.9} color="#f472b6" distance={28} />

      {/* Interactive holographic core */}
      <mesh ref={coreRef} geometry={boxGeo} onClick={onCoreClick} onPointerOver={() => { document.body.style.cursor = 'pointer'; }} onPointerOut={() => { document.body.style.cursor = 'default'; }}>
        <shaderMaterial
          ref={matRef}
          vertexShader={hologramVertex}
          fragmentShader={hologramFragment}
          uniforms={uniforms}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh ref={ringRef} geometry={ringGeo} rotation={[Math.PI / 2.1, 0, 0]}>
        <meshStandardMaterial color="#a5b4fc" emissive="#6366f1" emissiveIntensity={1.6} wireframe toneMapped={false} />
      </mesh>
      <mesh ref={ring2Ref} geometry={ringGeo2} rotation={[Math.PI / 1.7, 0.25, 0]}>
        <meshStandardMaterial color="#f0abfc" emissive="#d946ef" emissiveIntensity={1.3} wireframe toneMapped={false} />
      </mesh>

      <mesh geometry={pyramidGeo} position={[7, 3.2, -5]} rotation={[0.4, 1.1, 0.2]}
        onClick={(e) => { e.stopPropagation(); sound.click(); useCyberpunkStore.getState().addLog('Pyramid node pinged.', 'info'); useCyberpunkStore.getState().addToast('Node signal acquired', 'info'); }}>
        <meshStandardMaterial color="#f472b6" emissive="#db2777" emissiveIntensity={1.0} toneMapped={false} />
      </mesh>
      <mesh geometry={pyramidGeo} position={[-7.2, -2.4, 3.8]} rotation={[1.0, 0.6, 0.3]}
        onClick={(e) => { e.stopPropagation(); sound.click(); useCyberpunkStore.getState().addLog('Secondary node pinged.', 'info'); }}>
        <meshStandardMaterial color="#60a5fa" emissive="#3b82f6" emissiveIntensity={1.0} toneMapped={false} />
      </mesh>

      <Stars radius={350} depth={50} count={6000} factor={4.5} saturation={0} fade speed={0.25} />

      <OrbitControls enablePan={false} enableDamping dampingFactor={0.05} minDistance={7} maxDistance={20} autoRotate autoRotateSpeed={0.15} />

      <EffectComposer multisampling={0}>
        <Bloom intensity={1.25} luminanceThreshold={0.25} luminanceSmoothing={0.9} mipmapBlur />
        <Vignette offset={0.2} darkness={0.7} />
      </EffectComposer>
    </>
  );
};

export default memo(Scene);
