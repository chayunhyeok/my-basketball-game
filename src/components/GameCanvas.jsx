// src/components/GameCanvas.jsx
import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, Line } from "@react-three/drei";
import * as THREE from "three";

function GameCanvas({ onScore }) {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas onPointerDown={(e) => e.stopPropagation()}>
        <PerspectiveCamera makeDefault position={[2.5, 3.5, 8]} fov={50} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} />
        <Basketball onScore={onScore} />
        <Hoop />
        <Ground />
      </Canvas>
    </div>
  );
}

function Basketball({ onScore }) {
  const ballRef = useRef();
  const { camera, size } = useThree();
  const [velocity, setVelocity] = useState([0, 0, 0]);
  const [isMoving, setIsMoving] = useState(false);
  const [trajectoryPoints, setTrajectoryPoints] = useState([]);

  const initialPosition = [5.5, 3, 2.0];
  const hoopPosition = new THREE.Vector3(-2.82, 7.83, -5);
  const hoopRadius = 1.0;


  // 🟡 공이 날아가는 포물선 미리 계산 (마우스 움직일 때)
  useEffect(() => {

    const handleMouseMove = (e) => {
      if (!ballRef.current || isMoving) return;

      const x = (e.clientX / size.width) * 2 - 1;
      const y = -(e.clientY / size.height) * 2 + 1;
      const vector = new THREE.Vector3(x, y, 0.5).unproject(camera);
      const dir = vector.sub(camera.position).normalize();
      const distance = (ballRef.current.position.z - camera.position.z) / dir.z;
      const destination = camera.position.clone().add(dir.multiplyScalar(distance));

      const start = ballRef.current.position.clone();
      const dx = destination.x - start.x;
      const dz = destination.z - start.z;
      const dy = destination.y - start.y;

      const peak = Math.max(start.y, destination.y) + 0.7;
      const t_up = Math.sqrt(2 * (peak - start.y) / 9.8);
      const t_down = Math.sqrt(2 * (peak - destination.y) / 9.8);
      const t_total = (t_up + t_down) * 0.85;

      const vx = dx / t_total;
      const vz = dz / t_total;
      const vy = Math.sqrt(2 * 9.8 * (peak - start.y));

      const points = [];
      for (let t = 0; t <= t_total; t += 0.05) {
        const px = start.x + vx * t;
        const py = start.y + vy * t - 0.5 * 9.8 * t * t;
        const pz = start.z + vz * t;
        points.push(new THREE.Vector3(px, py, pz));
      }

      setTrajectoryPoints(points);

    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [camera, size, isMoving]);

  // 🟠 마우스 클릭 시 실제 발사
  useEffect(() => {
    const handleClick = (e) => {
      if (!ballRef.current || isMoving) return;

      const x = (e.clientX / size.width) * 2 - 1;
      const y = -(e.clientY / size.height) * 2 + 1;
      const vector = new THREE.Vector3(x, y, 0.5).unproject(camera);
      const dir = vector.sub(camera.position).normalize();
      const distance = (ballRef.current.position.z - camera.position.z) / dir.z;
      const destination = camera.position.clone().add(dir.multiplyScalar(distance));

      const start = ballRef.current.position.clone();
      const dx = destination.x - start.x;
      const dz = destination.z - start.z;
      const dy = destination.y - start.y;

      const peak = Math.max(start.y, destination.y) + 0.7;
      const t_up = Math.sqrt(2 * (peak - start.y) / 9.8);
      const t_down = Math.sqrt(2 * (peak - destination.y) / 9.8);
      const t_total = (t_up + t_down) * 0.85;

      const vx = dx / t_total;
      const vz = dz / t_total;
      const vy = Math.sqrt(2 * 9.8 * (peak - start.y));

      setTrajectoryPoints([]);
      setVelocity([vx, vy, vz]);
      setIsMoving(true);
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [camera, size, isMoving]);

  // 🔵 실제 공의 이동 처리
  useFrame((_, delta) => {
    if (!ballRef.current || !isMoving) return;

    const ball = ballRef.current.position;
    const [vx, vy, vz] = velocity;

    ball.x += vx * delta;
    ball.y += vy * delta;
    ball.z += vz * delta;

    setVelocity(([vx, vy, vz]) => [vx, vy - 9.8 * delta, vz]);

    const distanceToHoop = ball.distanceTo(hoopPosition);
    if (distanceToHoop < hoopRadius && ball.y < hoopPosition.y) {
      console.log("득점!");
      onScore?.();
      setIsMoving(false);
      ballRef.current.position.set(...initialPosition);
      setVelocity([0, 0, 0]);
      setTrajectoryPoints([]);
      return;
    }

    if (ball.y <= 0.3) {
      setIsMoving(false);
      ballRef.current.position.set(...initialPosition);
      setVelocity([0, 0, 0]);
      setTrajectoryPoints([]);
    }
  });

  return (
    <>
      {/* 공 */}
      <mesh ref={ballRef} position={initialPosition}>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshStandardMaterial color="orange" />
      </mesh>
      {trajectoryPoints.map((point, idx) => (
        <mesh key={idx} position={point}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="black" />
        </mesh>
      ))}


      {/* 포물선 점선 */}
      {trajectoryPoints.length > 0 && (
        <points>
          <bufferGeometry attach="geometry" setFromPoints={trajectoryPoints} />
          <pointsMaterial
            attach="material"
            color="yellow"
            size={0.5}            // 점 크기 키움
            sizeAttenuation
          />
        </points>
      )}
    </>
  );
}


function Hoop() {
  return (
    <mesh position={[-2.82, 7.83, -5]} rotation={[Math.PI / 1.64, 0, 0]}>
      <torusGeometry args={[1, 0.065, 16, 100]} />
      <meshStandardMaterial color="red" />
    </mesh>
  );
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[30, 30]} />
      <meshStandardMaterial transparent opacity={0} />
    </mesh>
  );
}

export default GameCanvas;






