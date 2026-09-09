// Simplified humanoid MJCF (capsule body, hinge joints, position actuators) written for this platform.
export const HUMANOID_XML = `<mujoco model="xvis-humanoid">
  <option timestep="0.005" gravity="0 0 -9.81"/>
  <default>
    <joint limited="true" damping="1" armature="0.02"/>
    <geom condim="3" friction="1 0.1 0.1" density="1000"/>
    <position kp="80"/>
  </default>
  <worldbody>
    <light pos="0 0 3"/>
    <geom name="floor" type="plane" size="6 6 0.1" rgba="0.1 0.15 0.22 1"/>
    <body name="torso" pos="0 0 1.3">
      <freejoint name="root"/>
      <geom name="torso" type="capsule" fromto="0 -0.07 0 0 0.07 0" size="0.09"/>
      <geom name="chest" type="capsule" fromto="-0.03 0 0.12 0.03 0 0.12" size="0.075"/>
      <body name="head" pos="0 0 0.24"><geom type="sphere" size="0.085"/></body>
      <body name="pelvis" pos="0 0 -0.16">
        <geom type="capsule" fromto="0 -0.07 0 0 0.07 0" size="0.075"/>
        <body name="thigh_r" pos="0 -0.1 -0.04">
          <joint name="hip_r" axis="0 1 0" range="-100 40"/>
          <geom type="capsule" fromto="0 0 0 0 0 -0.34" size="0.055"/>
          <body name="shin_r" pos="0 0 -0.36">
            <joint name="knee_r" axis="0 1 0" range="0 150"/>
            <geom type="capsule" fromto="0 0 0 0 0 -0.32" size="0.045"/>
            <body name="foot_r" pos="0 0 -0.35"><joint name="ankle_r" axis="0 1 0" range="-45 45"/><geom type="box" size="0.11 0.05 0.02" pos="0.04 0 0"/></body>
          </body>
        </body>
        <body name="thigh_l" pos="0 0.1 -0.04">
          <joint name="hip_l" axis="0 1 0" range="-100 40"/>
          <geom type="capsule" fromto="0 0 0 0 0 -0.34" size="0.055"/>
          <body name="shin_l" pos="0 0 -0.36">
            <joint name="knee_l" axis="0 1 0" range="0 150"/>
            <geom type="capsule" fromto="0 0 0 0 0 -0.32" size="0.045"/>
            <body name="foot_l" pos="0 0 -0.35"><joint name="ankle_l" axis="0 1 0" range="-45 45"/><geom type="box" size="0.11 0.05 0.02" pos="0.04 0 0"/></body>
          </body>
        </body>
      </body>
      <body name="upper_arm_r" pos="0 -0.17 0.14">
        <joint name="shoulder_r" axis="0 1 0" range="-150 60"/>
        <geom type="capsule" fromto="0 0 0 0 0 -0.26" size="0.04"/>
        <body name="lower_arm_r" pos="0 0 -0.28"><joint name="elbow_r" axis="0 1 0" range="-140 0"/><geom type="capsule" fromto="0 0 0 0 0 -0.24" size="0.035"/></body>
      </body>
      <body name="upper_arm_l" pos="0 0.17 0.14">
        <joint name="shoulder_l" axis="0 1 0" range="-150 60"/>
        <geom type="capsule" fromto="0 0 0 0 0 -0.26" size="0.04"/>
        <body name="lower_arm_l" pos="0 0 -0.28"><joint name="elbow_l" axis="0 1 0" range="-140 0"/><geom type="capsule" fromto="0 0 0 0 0 -0.24" size="0.035"/></body>
      </body>
    </body>
  </worldbody>
  <actuator>
    <position joint="hip_r"/><position joint="knee_r"/><position joint="ankle_r"/>
    <position joint="hip_l"/><position joint="knee_l"/><position joint="ankle_l"/>
    <position joint="shoulder_r"/><position joint="elbow_r"/><position joint="shoulder_l"/><position joint="elbow_l"/>
  </actuator>
</mujoco>`;

export const ARM_XML = `<mujoco model="xvis-arm">
  <option timestep="0.002" gravity="0 0 -9.81"/>
  <default><joint limited="true" damping="2" armature="0.05"/><geom condim="4" friction="1.2 0.05 0.01"/></default>
  <worldbody>
    <light pos="0 0 3"/>
    <geom name="floor" type="plane" size="3 3 0.1" rgba="0.1 0.15 0.22 1"/>
    <geom name="table" type="box" pos="0.6 0 0.2" size="0.4 0.5 0.2" rgba="0.2 0.25 0.32 1"/>
    <body name="base" pos="0 0 0.02"><geom type="cylinder" size="0.12 0.02"/>
      <body name="link1" pos="0 0 0.06"><joint name="j1" axis="0 0 1" range="-170 170"/><geom type="cylinder" size="0.07 0.05"/>
        <body name="link2" pos="0 0 0.08"><joint name="j2" axis="0 1 0" range="-100 100"/><geom type="capsule" fromto="0 0 0 0 0 0.35" size="0.045"/>
          <body name="link3" pos="0 0 0.36"><joint name="j3" axis="0 1 0" range="-150 150"/><geom type="capsule" fromto="0 0 0 0.32 0 0" size="0.04"/>
            <body name="link4" pos="0.33 0 0"><joint name="j4" axis="0 1 0" range="-120 120"/><geom type="capsule" fromto="0 0 0 0.12 0 0" size="0.03"/>
              <body name="gripper" pos="0.13 0 0"><joint name="j5" axis="1 0 0" range="-180 180"/><geom type="box" size="0.02 0.05 0.02"/>
                <body name="finger_l" pos="0.04 0.035 0"><joint name="fl" type="slide" axis="0 1 0" range="-0.03 0"/><geom type="box" size="0.035 0.008 0.015"/></body>
                <body name="finger_r" pos="0.04 -0.035 0"><joint name="fr" type="slide" axis="0 1 0" range="0 0.03"/><geom type="box" size="0.035 0.008 0.015"/></body>
              </body>
            </body>
          </body>
        </body>
      </body>
    </body>
    <body name="cube" pos="0.55 0.05 0.43"><freejoint/><geom type="box" size="0.025 0.025 0.025" rgba="1 0.7 0.33 1" mass="0.1"/></body>
    <body name="cube2" pos="0.7 -0.15 0.43"><freejoint/><geom type="box" size="0.03 0.03 0.03" rgba="0.37 0.9 1 1" mass="0.15"/></body>
  </worldbody>
  <actuator>
    <position joint="j1" kp="60"/><position joint="j2" kp="80"/><position joint="j3" kp="60"/><position joint="j4" kp="30"/><position joint="j5" kp="10"/>
    <position joint="fl" kp="200"/><position joint="fr" kp="200"/>
  </actuator>
</mujoco>`;

export const DROP_XML = (friction: number, mass: number, restitution: number) => `<mujoco model="xvis-random">
  <option timestep="0.002" gravity="0 0 -9.81"/>
  <default><geom condim="3" friction="${friction} 0.05 0.01" solref="0.01 ${1 + (1 - restitution) * 2}"/></default>
  <worldbody>
    <light pos="0 0 3"/>
    <geom type="plane" size="3 3 0.1" rgba="0.1 0.15 0.22 1"/>
    <geom type="box" pos="0 0 0.3" size="0.6 0.05 0.3" euler="0 20 0" rgba="0.2 0.25 0.32 1"/>
    <body pos="-0.4 0 1.0"><freejoint/><geom type="box" size="0.06 0.06 0.06" mass="${mass}" rgba="0.37 0.9 1 1"/></body>
    <body pos="-0.3 0.25 1.3"><freejoint/><geom type="sphere" size="0.06" mass="${mass * 0.8}" rgba="1 0.7 0.33 1"/></body>
    <body pos="-0.5 -0.25 1.5"><freejoint/><geom type="capsule" fromto="0 0 0 0.15 0 0" size="0.04" mass="${mass * 1.2}" rgba="0.73 0.61 1 1"/></body>
  </worldbody>
</mujoco>`;
