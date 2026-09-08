import type {
  ColliderDesc,
  RigidBodyDesc,
  World,
} from "@dimforge/rapier3d-compat";
export type DropConfig = {
  gravity: number;
  restitution: number;
  height: number;
};
type PhysicsFactory = {
  World: typeof World;
  ColliderDesc: typeof ColliderDesc;
  RigidBodyDesc: typeof RigidBodyDesc;
};
/** Shared by the browser integration and the actual WASM regression test. */
export function createDropWorld(engine: PhysicsFactory, config: DropConfig) {
  const world = new engine.World({ x: 0, y: -config.gravity, z: 0 });
  world.timestep = 1 / 60;
  world.createCollider(
    engine.ColliderDesc.cuboid(6, 0.1, 6)
      .setTranslation(0, -0.1, 0)
      .setRestitution(config.restitution),
  );
  const body = world.createRigidBody(
    engine.RigidBodyDesc.dynamic()
      .setTranslation(0, config.height, 0)
      .setCcdEnabled(true),
  );
  world.createCollider(
    engine.ColliderDesc.ball(0.35).setRestitution(config.restitution),
    body,
  );
  return { world, body };
}
