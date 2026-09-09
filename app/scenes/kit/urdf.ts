import * as THREE from "three";
import URDFLoader from "urdf-loader";
import type { URDFRobot, URDFJoint } from "urdf-loader";

// A 6-DoF arm described with URDF primitives (no mesh files needed), parsed by urdf-loader.
export const ARM_URDF = `<?xml version="1.0"?>
<robot name="xvis_arm">
  <material name="blue"><color rgba="0.35 0.62 0.85 1"/></material>
  <material name="dark"><color rgba="0.16 0.2 0.27 1"/></material>
  <material name="amber"><color rgba="1 0.7 0.33 1"/></material>
  <link name="base_link"><visual><geometry><cylinder radius="0.12" length="0.06"/></geometry><material name="dark"/></visual><collision><geometry><cylinder radius="0.12" length="0.06"/></geometry></collision></link>
  <link name="shoulder_link"><visual><origin xyz="0 0 0.05"/><geometry><cylinder radius="0.08" length="0.1"/></geometry><material name="blue"/></visual><collision><origin xyz="0 0 0.05"/><geometry><cylinder radius="0.08" length="0.1"/></geometry></collision></link>
  <link name="upper_arm_link"><visual><origin xyz="0 0 0.2"/><geometry><box size="0.09 0.09 0.4"/></geometry><material name="blue"/></visual><collision><origin xyz="0 0 0.2"/><geometry><box size="0.09 0.09 0.4"/></geometry></collision></link>
  <link name="forearm_link"><visual><origin xyz="0 0 0.17"/><geometry><box size="0.07 0.07 0.34"/></geometry><material name="blue"/></visual><collision><origin xyz="0 0 0.17"/><geometry><box size="0.07 0.07 0.34"/></geometry></collision></link>
  <link name="wrist_1_link"><visual><geometry><cylinder radius="0.05" length="0.08"/></geometry><material name="dark"/></visual><collision><geometry><cylinder radius="0.05" length="0.08"/></geometry></collision></link>
  <link name="wrist_2_link"><visual><origin xyz="0 0 0.04"/><geometry><cylinder radius="0.045" length="0.08"/></geometry><material name="dark"/></visual><collision><origin xyz="0 0 0.04"/><geometry><cylinder radius="0.045" length="0.08"/></geometry></collision></link>
  <link name="tool_link"><visual><origin xyz="0 0 0.05"/><geometry><box size="0.04 0.1 0.1"/></geometry><material name="amber"/></visual><collision><origin xyz="0 0 0.05"/><geometry><box size="0.04 0.1 0.1"/></geometry></collision></link>
  <link name="tcp"/>
  <joint name="shoulder_pan" type="revolute"><parent link="base_link"/><child link="shoulder_link"/><origin xyz="0 0 0.03"/><axis xyz="0 0 1"/><limit lower="-3.14" upper="3.14" effort="150" velocity="3.2"/></joint>
  <joint name="shoulder_lift" type="revolute"><parent link="shoulder_link"/><child link="upper_arm_link"/><origin xyz="0 0 0.1"/><axis xyz="0 1 0"/><limit lower="-2.3" upper="2.3" effort="150" velocity="3.2"/></joint>
  <joint name="elbow" type="revolute"><parent link="upper_arm_link"/><child link="forearm_link"/><origin xyz="0 0 0.4"/><axis xyz="0 1 0"/><limit lower="-2.6" upper="2.6" effort="90" velocity="3.2"/></joint>
  <joint name="wrist_1" type="revolute"><parent link="forearm_link"/><child link="wrist_1_link"/><origin xyz="0 0 0.34" rpy="0 1.5708 0"/><axis xyz="0 0 1"/><limit lower="-3.14" upper="3.14" effort="28" velocity="3.2"/></joint>
  <joint name="wrist_2" type="revolute"><parent link="wrist_1_link"/><child link="wrist_2_link"/><origin xyz="0 0 0.04" rpy="-1.5708 0 0"/><axis xyz="0 0 1"/><limit lower="-3.14" upper="3.14" effort="28" velocity="3.2"/></joint>
  <joint name="wrist_3" type="revolute"><parent link="wrist_2_link"/><child link="tool_link"/><origin xyz="0 0 0.08"/><axis xyz="0 0 1"/><limit lower="-3.14" upper="3.14" effort="28" velocity="3.2"/></joint>
  <joint name="tcp_fixed" type="fixed"><parent link="tool_link"/><child link="tcp"/><origin xyz="0 0 0.1"/></joint>
</robot>`;

export const JOINTS = ["shoulder_pan", "shoulder_lift", "elbow", "wrist_1", "wrist_2", "wrist_3"];

export function loadArm(scene: THREE.Scene, source = ARM_URDF): URDFRobot {
  const loader = new URDFLoader();
  const robot = loader.parse(source);
  robot.rotation.x = -Math.PI / 2; // URDF z-up → three y-up
  robot.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { const mat = m.material as THREE.MeshPhongMaterial; const std = new THREE.MeshStandardMaterial({ color: mat.color ?? new THREE.Color(0x8fb3d9), roughness: 0.5, metalness: 0.2 }); m.material = std; m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 25), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 }))); } });
  scene.add(robot);
  return robot;
}

export function jointList(robot: URDFRobot): URDFJoint[] { return Object.values(robot.joints).filter((j) => j.jointType !== "fixed"); }
