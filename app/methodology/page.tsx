import Footer from "../components/Footer";
import Nav from "../components/Nav";

export const metadata = { title: "Method and boundaries" };

const kinds = [
  ["Visualization", "Rendering data that already exists. Nothing is computed about the world; a view can still mislead through scale, color or omission."],
  ["Computation", "Closed-form or numerical results from stated equations: stopping distance, inverse kinematics, softmax. Correct within the model, silent about what the model leaves out."],
  ["Simulation", "Stepping a system forward in time: rigid bodies, a lattice planner replanning every 250 ms, an order book under random arrivals. Sensitive to step size and initial conditions."],
  ["Recorded playback", "Replaying logged data with its original timestamps. Faithful to what happened, not to what would happen under a change."],
];

export default function Methodology() {
  return (
    <main className="shell doc-page">
      <Nav current="/methodology" />
      <header className="doc-head">
        <h1>Method and boundaries</h1>
        <p>
          A visualization is evidence only if you can see what went in, what was assumed and what came out. These
          are the rules every scene on this platform follows.
        </p>
      </header>
      <section className="rules">
        <h2>Four kinds of scene, four kinds of trust</h2>
        <dl>
          {kinds.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="rules">
        <h2>Rules</h2>
        <ol>
          <li>Every lab states its assumptions next to its controls, in plain language.</li>
          <li>Synthetic data is labeled synthetic. Recorded data will carry a source and a license.</li>
          <li>Rendering is not a claim of physical fidelity, safety validation, clinical accuracy or financial return.</li>
          <li>A link to an engine's documentation credits that engine. It does not claim the engine as this platform's work, and integration status is shown on every catalog entry.</li>
          <li>Runs are exportable as JSON with parameters, telemetry and assumptions, so a result can be checked or reproduced.</li>
          <li>Files opened in the model viewer stay on the device. Nothing is uploaded or persisted.</li>
          <li>The platform carries no personal profile, employer attribution or contact details. It is judged on the scenes.</li>
        </ol>
      </section>
      <section className="rules">
        <h2>Known limits of the native labs</h2>
        <ul>
          <li>LiDAR: ray casting against boxes and a flat plane; no beam divergence, reflectivity or multi-return.</li>
          <li>Planner: straight road, constant-velocity prediction, no vehicle dynamics beyond speed blending.</li>
          <li>Braking: no slope, load transfer, tyre temperature or ABS behavior.</li>
          <li>Arm: planar, kinematic, no joint limits beyond the two elbow branches.</li>
          <li>Gait: joint templates, not measured motion capture; no ground reaction forces.</li>
          <li>Swarm: point agents with a repulsive obstacle field; no aerodynamics or communication latency.</li>
          <li>Physics: real Rapier solver, but simplified colliders and uncalibrated materials.</li>
          <li>Attention: a deterministic toy, not a trained model; it explains the mechanism, not language.</li>
          <li>Order book: zero-intelligence agents; impact and recovery are qualitative.</li>
        </ul>
      </section>
      <Footer />
    </main>
  );
}
