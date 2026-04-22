import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

function generateInitialData(count: number) {
  const anchors = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const colorInside = new THREE.Color('#ff6030'); // fiery orange
  const colorOutside = new THREE.Color('#1b3984'); // deep space blue

  for (let i = 0; i < count; i++) {
    const radius = Math.random() * 6;
    const spinAngle = radius * 4;
    const branchAngle = ((i % 4) * Math.PI * 2) / 4;

    const randomX = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.5 * radius;
    const randomY = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.5 * radius;
    const randomZ = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.5 * radius;

    anchors[i * 3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
    anchors[i * 3 + 1] = randomY;
    anchors[i * 3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

    const mixedColor = colorInside.clone().lerp(colorOutside, radius / 6);
    colors[i * 3] = mixedColor.r;
    colors[i * 3 + 1] = mixedColor.g;
    colors[i * 3 + 2] = mixedColor.b;
  }
  
  return { anchors, colors };
}

const vertexShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uIsGenerating;

  attribute vec3 color;
  varying vec3 vColor;

  void main() {
    vColor = color;
    
    float influenceRadius = mix(4.0, 8.0, uIsGenerating);
    float strengthMultiplier = mix(1.5, 2.5, uIsGenerating);
    float swirlFactor = mix(3.0, 6.0, uIsGenerating);
    float timeMultiplier = mix(2.0, 5.0, uIsGenerating);
    
    vec3 targetPos = vec3(uMouse.x * 8.0, uMouse.y * 8.0, 0.0);
    vec3 d = targetPos - position;
    float dist = length(d) + 0.01;

    vec3 finalPos = position;

    if (dist < influenceRadius) {
        float pushStrength = (influenceRadius - dist) * strengthMultiplier;
        float swirlStrength = swirlFactor / dist;

        finalPos.x = position.x - (d.x / dist) * pushStrength - d.y * swirlStrength;
        finalPos.y = position.y - (d.y / dist) * pushStrength + d.x * swirlStrength;
        finalPos.z = position.z - (d.z / dist) * pushStrength + sin(uTime * timeMultiplier + position.x) * 2.0;
    }

    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Scale point size based on depth
    gl_PointSize = 30.0 * (1.0 / -mvPosition.z);
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  void main() {
    // Make particles circular with a soft edge
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;
    
    float alpha = smoothstep(0.5, 0.2, dist);
    gl_FragColor = vec4(vColor, alpha);
  }
`;

interface ParticleForgeProps {
  isGenerating?: boolean;
}

export default function ParticleForge({ isGenerating = false }: ParticleForgeProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { mouse } = useThree();

  const count = 10000;
  
  const { anchors, colors } = useMemo(() => generateInitialData(count), [count]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2() },
    uIsGenerating: { value: isGenerating ? 1.0 : 0.0 }
  }), [isGenerating]);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      const rotationSpeed = isGenerating ? 0.5 : 0.05;
      pointsRef.current.rotation.y += delta * rotationSpeed;
    }
    
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      const targetGenerating = isGenerating ? 1.0 : 0.0;
      materialRef.current.uniforms.uIsGenerating.value += (targetGenerating - materialRef.current.uniforms.uIsGenerating.value) * delta * 5.0;
      materialRef.current.uniforms.uMouse.value.lerp(mouse, 0.1);
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={anchors} itemSize={3} args={[anchors, 3]} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} args={[colors, 3]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}