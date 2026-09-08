import Link from "next/link";
export const metadata = { title: "方法与边界" };
export default function Methodology() {
  return (
    <main className="platform-shell method-page">
      <Link href="/" className="back">
        ← 返回平台
      </Link>
      <p className="eyebrow">METHOD / PROVENANCE / LIMITS</p>
      <h1>可视化的意义，在于帮助判断。</h1>
      <section>
        <h2>四种能力，分别标明</h2>
        <ul>
          <li>
            <strong>渲染：</strong>Three.js
            将几何与状态绘制出来，不自动提供物理真实性。
          </li>
          <li>
            <strong>计算：</strong>
            运动学、统计指标与可达性来自明确公式，可以复算。
          </li>
          <li>
            <strong>仿真：</strong>Rapier
            等求解器按模型与时间步更新状态；真实结果取决于参数、模型和校准。
          </li>
          <li>
            <strong>回放：</strong>
            展示采集或仿真记录，不等于正在运行真实设备或模型。
          </li>
        </ul>
      </section>
      <section>
        <h2>当前本地实验室</h2>
        <p>
          制动实验采用直线、水平路面、恒定减速度模型，不包含完整车辆动力学或传感器决策。机械臂采用无碰撞、无动力学的平面二连杆模型，不代表任何真实机械臂。碰撞实验使用
          Rapier 刚体求解。模型检查器读取本地自包含 GLB，尺寸按 glTF
          米制解释，但仍需确认资产作者的尺度。
        </p>
        <p>
          这些实验用于理解与比较，不构成自动驾驶安全认证、真实机器人的控制指令或工程验收依据。
        </p>
      </section>
      <section>
        <h2>数据与引擎的可追溯性</h2>
        <p>
          场景库给出数据输入、期望输出与官方引擎链接。“引擎参考”表示尚未集成，外部演示不是平台自主实现。世界模型生成的视频需要独立检查时空与物理一致性。
        </p>
        <p>
          本地实验不上传文件，不包含账户、个人履历或个人联系方式。外部引擎入口是第三方网站；真实车辆模型、地图、影像、机器人示教与金融数据需要逐项核实使用及展示权利。
        </p>
      </section>
      <section>
        <h2>用结果衡量价值</h2>
        <p>
          优先衡量定位异常需要多久、复现成功率、样本审核效率、模型版本差异和方案比较结果。性能数字与改善比例只有在注明设备、数据规模、实验方法后才展示。
        </p>
      </section>
    </main>
  );
}
