# Fieldwork：可视化分析与仿真实验平台调研

调研日期：2026-09-08。目标是一个匿名、可复用、解决问题的平台。这里的优先级属于产品判断；官方产品、开源工具和标准证明相关工作流存在，不等于本平台已经验证市场规模、付费意愿或实现了所有能力。

## 1. 产品定位与竞争切口

长期愿景可以是“可视化一切”，近期产品定位应更明确：**把复杂系统的数据变成可回放、可诊断、可对比、可验证的工作空间。以自动驾驶、机器人、3D 仿真和 AI 数据为主线，向其他领域扩展。**

一个场景应有完整的工作单元：问题 → 数据与假设 → 可操作视图 → 诊断/对比 → 可导出的结果。首页应展示可打开的工具与场景，不展示个人履历、工作年限、任职企业、技能评分或“我的作品”。真实能力由可用工具、可复现案例和技术文档体现。

不建议用“所有行业的 3D 动画集合”作为近期产品定义：漂亮的动画很容易被替代，跨视图的一致时间、坐标、实体选择、可复算指标和证据链更难被替代。金融策略首先需要时间序列与归因，产业链首先需要可信关系与来源，只有空间任务才默认使用 3D。

| 对照对象 | 已有强项与来源 | 平台应做出的差异 |
|---|---|---|
| Foxglove | 多模态机器人日志、实时与录制数据、数据组织。[官方文档](https://docs.foxglove.dev/docs) | 用小而清楚的诊断模板缩短上手时间，贯通场景、假设和结果；不复刻其所有数据平台能力 |
| Rerun | 多速率、多模态数据工具链与可嵌入 Viewer。[产品介绍](https://rerun.io/docs/overview/what-is-rerun)、[嵌入文档](https://rerun.io/docs/howto/integrations/embed-web) | 在 Viewer 之上提供行业问题模板、A/B 对比、事件定位和实验报告 |
| CARLA / Gazebo / MuJoCo | 自驾、机器人与物理仿真。[CARLA](https://carla.org/)、[Gazebo](https://gazebosim.org/)、[MuJoCo](https://mujoco.org/) | 做浏览器入口、场景配置、仿真作业和结果诊断，不重新开发高保真求解器 |
| SuperSplat / model-viewer | 3DGS 编辑、分享，以及 glTF/GLB 展示。[SuperSplat](https://superspl.at/editor)、[model-viewer](https://modelviewer.dev/) | 叠加部件、尺度、缺陷、采集覆盖与业务任务，而非仅旋转模型 |
| Netron / Phoenix | 模型结构、AI 运行追踪与评估。[Netron](https://netron.app/)、[Phoenix](https://arize.com/docs/phoenix) | 将“结构、运行、输入样本、错误结果”关联起来；静态算子图不能解释运行时原因 |

竞争力假设：**开箱可试的场景模板 + 能上传自己数据的本地工具 + 统一的证据工作流**。这是待用户验证的切口，不是已证明的商业壁垒。

## 2. 技术分层：这些名词分别解决什么

| 层级 | 技术 | 职责与需要展示的能力 |
|---|---|---|
| 图形呈现 | Three.js、WebGL2、WebGPU、Babylon.js | 场景树、相机、PBR、实例化、拾取、剖切、LOD；负责画面，不负责自动保证物理正确 |
| 刚体/机器人仿真 | Rapier、MuJoCo、Gazebo、Isaac Sim | 接触、力、约束、时间步、传感器仿真；必须记录模型和求解器参数 |
| 自驾仿真 | CARLA、ScenarioRunner、SUMO、VI-WorldSim | 道路、交通参与者、传感器、场景和控制器；不同引擎保真度与运行环境不同 |
| 机器人中间件 | ROS 2、DDS、Topic、Service、Action、QoS、tf2 | 数据通信、调用、长任务、坐标变换；ROS 本身不是图形引擎或物理求解器。[ROS 文档](https://docs.ros.org/)、[tf2](https://docs.ros.org/en/foxy/Concepts/About-Tf2.html) |
| 机器人可视化 | RViz、Foxglove、Rerun、URDFLoader | 机器人姿态、传感器、轨迹、图像与时间轴；[RViz](https://github.com/ros2/rviz)、[URDF 动态演示](https://gkjohnson.github.io/urdf-loaders/javascript/example/bundle/) |
| 记录与传输 | MCAP、rosbag2、WebSocket、Protobuf、WebRTC、WebCodecs | 带时间戳的数据、seek、解码、实时状态与视频；MCAP 有可选索引和分块压缩，提供 TS SDK。[MCAP](https://mcap.dev/)、[规范](https://mcap.dev/spec) |
| 3D 资产 | glTF/GLB、OpenUSD、URDF、MJCF、SDF、3D Tiles | GLB 适合 Web 资产交付；USD 承载场景组合；机器人格式带关节/物理语义；地理大场景使用流式瓦片。[OpenUSD](https://openusd.org/)、[glTF](https://github.com/KhronosGroup/glTF)、[3D Tiles](https://cesium.com/why-cesium/3d-tiles/) |
| 自驾交换标准 | OpenDRIVE、OpenSCENARIO、OpenLABEL | 道路几何、动态交通行为与标注；标准版本需明确，不能把支持某种 JSON 当作完整兼容。[OpenDRIVE](https://www.asam.net/standards/detail/opendrive/)、[OpenSCENARIO](https://www.asam.net/standards/detail/openscenario-xml/)、[标准应用](https://www.asam.net/application-stories/detail/ai-powered-adas-scenario-generation-and-management/) |
| 分析与查询 | DuckDB-WASM、Arrow/Parquet、Sigma.js、图表引擎 | 本地分析、采样、关系图、曲线和过滤；避免将全部原始数据装入主线程。[DuckDB-WASM](https://duckdb.org/docs/lts/clients/wasm/overview.html)、[Sigma.js](https://www.sigmajs.org/) |
| AI 可观测性 | OpenTelemetry、Phoenix、Netron、UMAP | 运行追踪、算子结构、样本覆盖和失败定位；降维距离不是原始空间距离，注意力图不是因果解释。[Phoenix](https://arize.com/docs/phoenix)、[Netron](https://github.com/lutzroeder/netron)、[UMAP 交互讲解](https://pair-code.github.io/understanding-umap/) |

## 3. WorldSim 的准确区分

- **VI-WorldSim**：VI-grade 的车辆开发与驾驶模拟环境，基于 Unreal 图形能力，与其驾驶模拟系统结合，也有独立运行方式。官方页面提供 demo license/报价入口。本次没有取得授权或集成它；适合作为后续授权适配器，通过导出记录或受支持接口接入。[官方产品页](https://www.vi-grade.com/en/products/vi-worldsim/)
- **Waabi World**：Waabi 描述的闭环自动驾驶训练与测试环境。官网展示其能力，不代表提供可直接嵌入的公共 Web SDK。[官方介绍](https://waabi.ai/insights/waabi-world)
- **世界模型仿真**：例如 NVIDIA Cosmos，涉及条件生成与未来预测；Isaac Sim 提供机器人场景、仿真和合成数据。模型生成的视频“看起来合理”不等于通过物理与控制验证。[Cosmos](https://www.nvidia.com/en-us/ai/cosmos/)、[Isaac Sim](https://developer.nvidia.com/isaac/sim)
- **平台内的轻量实验**：明确声明解析运动学、运动学求解或 Rapier 物理实验，不使用以上产品名来包装自制动画。

## 4. 24 个场景与真实引擎映射

P0 = 首批核心方向；P1 = 复用基础设施后扩展；P2 = 需要额外数据、算力、授权或市场验证。P0 不等于已完成。准确实现状态见 [IMPLEMENTATION_STATUS](./IMPLEMENTATION_STATUS.md)；网站目录中的“引擎参考”不是集成完成。

| 场景 / 优先级 | 谁需要、解决什么 | 可视化交互与可检查结果 | 数据 / 真实引擎入口 |
|---|---|---|---|
| 1 制动距离 / P0 | 自驾/控制学习与参数比较；理解延迟与附着变化 | 双方案回放、时间滑杆、停止距离和碰撞速度，导出参数 | 本地合成参数；[Three.js](https://threejs.org/) + 明确解析模型；平台原生实验 |
| 2 多传感器回放 / P0 | 自驾与机器人开发；定位一次异常 | 图像、点云、TF、控制曲线共用时间轴；事件书签 | MCAP/ROS；[Rerun 嵌入](https://rerun.io/docs/howto/integrations/embed-web)、[MCAP SDK](https://mcap.dev/docs/typescript/) |
| 3 标定与时钟诊断 / P0 | 感知团队；区分外参与时间偏差 | 点云投影、误差热图、偏移参数对比 | 相机内外参、点云、时间戳；[Rerun](https://rerun.io/) + OpenCV/Three.js |
| 4 危险场景回归 / P1 | 自驾 QA；复现遮挡、切入、行人横穿 | A/B 策略、碰撞事件、TTC、轨迹差异 | 版本化场景与随机种子；[CARLA / ScenarioRunner](https://carla.org/) |
| 5 机械臂可达性 / P0 | 机器人开发与教学；检查目标可达 | 改关节角、求 IK、末端误差；之后接 URDF | 本地二连杆计算；[URDFLoader 动态演示](https://gkjohnson.github.io/urdf-loaders/javascript/example/bundle/) |
| 6 示教数据质量 / P0 | 具身数据团队；减少无效训练数据 | episode 回放、动作跳变、缺帧、重复片段标记 | LeRobot 数据；[LeRobot 官方流程](https://huggingface.co/docs/lerobot/main/en/getting_started_real_world_robot) + Rerun |
| 7 策略评估与 sim-to-real / P1 | 机器人学习团队；解释成功和失败 | 同 seed 对比、接触可视化、失败时间点分布 | MJCF、策略、实验配置；[MuJoCo Playground](https://playground.mujoco.org/) / Isaac Lab |
| 8 ROS 通信与 TF / P1 | ROS 开发；找链路断开和频率异常 | Topic 图、TF 树、QoS 与时间偏移检查 | 只读 bridge；[Foxglove ROS 2](https://docs.foxglove.dev/docs/getting-started/frameworks/ros2) |
| 9 碰撞与材料 / P0 | 仿真使用者；理解求解参数 | 改重力/恢复系数，观察高度与速度 | [Rapier WASM](https://rapier.rs/) + Three.js；平台原生实验 |
| 10 传感器与机器人场景 / P1 | 机器人集成；验证数据与位姿链路 | 传感器视野、虚拟场景、数据回放 | SDF/URDF；[Gazebo ROS 2 官方示例](https://gazebosim.org/docs/latest/ros2_integration/) |
| 11 世界模型未来分支 / P2 | 研究团队；比较条件控制与一致性 | 相同输入的多未来视频、事件对齐、异常标注 | 视频、动作、seed；[Cosmos 动态展示](https://www.nvidia.com/en-us/ai/cosmos/) + Isaac Sim |
| 12 驾驶模拟器工作台 / P2 | 车辆仿真团队；统一复盘 | 场景视频、控制信号、运行对比 | 授权结果；[VI-WorldSim 官方展示](https://www.vi-grade.com/en/products/vi-worldsim/) |
| 13 3D 资产检查 / P0 | 3D 工程师；判断资产可用性 | 结构树、动画、网格线、原始尺寸 | 自包含 GLB；[GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html)、[model-viewer 编辑器](https://modelviewer.dev/editor/)；平台原生实验 |
| 14 汽车结构/配置比较 / P1 | 购车用户、汽车工程与展示团队 | 部件高亮、尺寸、配置差异、空间与传感器视野 | 授权车型 GLB + 官方参数；[Babylon Viewer](https://www.babylonjs.com/viewer/) / model-viewer |
| 15 空间重建与巡检 / P1 | 建图/机器人/场地巡检 | 3DGS 场景漫游、空洞标注、采集覆盖 | PLY/SPZ、位姿；[Spark](https://sparkjs.dev/)、[SuperSplat 在线编辑器](https://superspl.at/editor) |
| 16 城市与交通孪生 / P1 | 园区、交通与规划 | 路网、车流、拥堵、信号方案对比 | 3D Tiles/GeoJSON、轨迹；[CesiumJS](https://cesium.com/platform/cesiumjs/) + [SUMO](https://sumo.dlr.de/docs/index.html) |
| 17 AI Agent 运行诊断 / P0 | AI 应用开发；解释慢和错 | trace 瀑布图、工具调用、检索证据、成本归因 | OTLP、evals；[Phoenix](https://arize.com/docs/phoenix) |
| 18 模型结构检查 / P1 | ML 工程；定位形状与转换问题 | 算子图、张量维度、权重属性 | ONNX/TFLite 等支持格式；[Netron 实际引擎](https://netron.app/) |
| 19 样本覆盖与离群 / P1 | 数据团队；找稀缺场景和重复数据 | embedding 选择回到原始图像/事件，版本覆盖对比 | embeddings、样本 ID；[UMAP 交互演示](https://pair-code.github.io/understanding-umap/) + WebGL scatter |
| 20 数据链路与影响面 / P2 | 数据/AI 平台；追溯变化 | 任务、数据版本、上游失败与影响路径 | [OpenLineage](https://openlineage.io/docs/) + [Sigma.js](https://www.sigmajs.org/) |
| 21 Crypto 策略与微观结构 / P1 | 策略研究；理解失效时段和成本 | 交易对齐、权益/回撤、成交与滑点、样本外对比 | OHLCV/成交/盘口/回测；[Lightweight Charts](https://tradingview.github.io/lightweight-charts/) + [DuckDB-WASM](https://duckdb.org/docs/lts/clients/wasm/overview.html) |
| 22 产业链证据与风险 / P1 | 产业研究；核对关系和传导假设 | 实体消歧、出处展开、时间过滤、假设冲击 | 实体、关系、证据、时间；[Sigma.js](https://www.sigmajs.org/) + Graphology |
| 23 人体与运动理解 / P1 | 教学、运动解释与沟通 | 部件隔离、关节运动、剖切；有授权时关联影像 | 人体资产；[Cornerstone3D 实际示例](https://cornerstonejs.org/docs/examples/) / [VTK.js](https://kitware.github.io/vtk-js/docs/) / Three.js |
| 24 工程热场与流场 / P2 | 电池/车辆/设备工程；理解工况差异 | 切片、等值面、流线、热点时间轴 | VTI/VTU/VTK 求解结果；[VTK.js](https://kitware.github.io/vtk-js/docs/) + [ParaView](https://www.paraview.org/) |

所有链接为已检索到的官方引擎、项目或演示入口；没有复制或重新发布第三方动画。引擎链接不保证可匿名使用、可嵌入、可商用或可在当前网络直接访问。没有真实数据时明确标注合成数据，不用无关粒子效果替代行业结果。

## 5. 更有创意、也更可能形成价值的扩展

这些是基于工作流的产品推断，尚未经过目标用户访谈。先做小范围验证，不一次全部开发。

| 创意 | 为什么值得测试 | 最小实验与衡量方法 | 引擎/入口 |
|---|---|---|---|
| “失败现场时间机” | 一个失败往往散落在视频、日志、点云和模型 trace 中 | 点击事件定位到跨视图同一时刻；比较找到根因的耗时 | Rerun + MCAP + [Phoenix](https://arize.com/docs/phoenix) |
| “只改一个变量”反事实比较 | 直观看到外参、延迟、策略或天气变化造成什么后果 | 固定其余参数与 seed；输出差异而不是虚构因果结论 | [CARLA](https://carla.org/) / [MuJoCo](https://mujoco.org/) + 统一对比器 |
| 传感器摆放与盲区设计 | 车、机器人和园区摄像头都需要覆盖分析 | 在模型上拖动传感器，显示遮挡和重叠覆盖；用标定数据核验 | [Three.js](https://threejs.org/) ray casting / [Gazebo](https://gazebosim.org/) |
| 数据预算与采集覆盖地图 | 多采数据不一定带来有效样本 | 场景×条件×失败类型覆盖矩阵，定位新增数据填补了哪个缺口 | LeRobot + [UMAP](https://pair-code.github.io/understanding-umap/) / [DuckDB-WASM](https://duckdb.org/docs/lts/clients/wasm/overview.html) |
| 仓库机器人拥堵与调度复盘 | 空间、任务和机器人状态天然需要联动 | 热点与等待时长、调度方案 A/B；人工复盘时间 | [Gazebo](https://gazebosim.org/) / MuJoCo + Cesium/Three.js |
| BIM 构件与机器人任务关联 | 将巡检结果关联到建筑部件，而不只是一个点 | IFC 构件选择、缺陷事件、任务覆盖；逐次检查遗漏 | [That Open Components / IfcLoader](https://docs.thatopen.com/Tutorials/Components/Core/IfcLoader) |
| 卫星/无人机观测覆盖 | 轨迹动画可升级为“何时能看到哪里” | 时间轴、地面覆盖、任务窗口；用已知轨迹验证 | [Orekit 轨道传播](https://www.orekit.org/site-orekit-13.1.5/architecture/propagation.html) + [CesiumJS](https://cesium.com/platform/cesiumjs/) |
| 数字孪生变更审查 | 单次看模型的价值有限，版本变化更贴近工作 | 两次扫描/资产版本的几何、部件与标注差异 | [Spark](https://sparkjs.dev/) / Three.js / [VTK.js](https://kitware.github.io/vtk-js/docs/) |

最值得优先投入的是前四项：可以同时复用时间轴、实体选择、事件、数据版本、比较与导出，比新开一个垂直行业更能累积平台能力。

## 6. 数据、算力与授权：直接影响能否做成产品

1. **真实记录优先、自建小数据包先行。** 第一批用自己有展示权的数据，或平台生成的合成实验。不把原有私有项目数据直接放进公开仓库。nuScenes 明确限制非商业使用；KITTI 页面声明 CC BY-NC-SA 3.0。它们不能被默认为商业平台的免费素材。[nuScenes 条款](https://www.nuscenes.org/terms-of-use)、[KITTI](https://www.cvlibs.net/datasets/kitti/index.php)
2. **车型资产单独核权。** 小米或 Tesla 官方配置器能展示，不代表模型可抓取、复制和再分发。没有许可就提供本地导入、官方页面链接或通用无品牌模型。Khronos 示例资产逐模型附许可证，应选择明确允许目标用途的样本。[glTF 示例资产](https://github.khronos.org/glTF-Assets/)
3. **浏览器渲染 ≠ 浏览器运行所有引擎。** Rapier WASM 可以在浏览器求解；CARLA、Gazebo、Isaac Sim、MuJoCo 的完整训练/仿真工作流放在独立计算服务，不放进普通 Next.js 请求或边缘函数。MuJoCo Playground 是 GPU 机器人学习框架，不应误称零安装 Web SDK。[Rapier](https://rapier.rs/docs/user_guides/javascript/getting_started_js/)、[Playground](https://playground.mujoco.org/)
4. **Foxglove SDK 与完整 Viewer 授权不同。** 数据记录 SDK 为 MIT；嵌入 Viewer 的页面标注 Pro/Enterprise/Academic，自托管嵌入需要定制 Enterprise 协议。优先评估可嵌入的 Rerun 或自研专用视图，若选 Foxglove 则单独确认商业条件。[SDK](https://docs.foxglove.dev/docs/sdk)、[嵌入](https://docs.foxglove.dev/docs/embed)、[自托管条款](https://docs.foxglove.dev/docs/embed/self-hosted)
5. **引擎与数据授权分开。** 开源渲染引擎不自动覆盖地图、机器人模型、金融行情与医学影像。Lightweight Charts 要求遵守 NOTICE 与 TradingView 署名/链接规则；不能把第三方引擎归为自主研发。[许可证与署名要求](https://github.com/tradingview/lightweight-charts)
6. **3DGS 不等于准确测量网格。** 视觉真实感不保证表面几何、尺度或碰撞模型正确；巡检标注和测量需要额外标定。[Spark 文档](https://sparkjs.dev/docs/overview/)
7. **人体场景不承诺定位疾病原因；金融场景不承诺收益。** 工具展示数据、结构与明确计算假设，价值在可检查的分析过程。

## 7. 怎样验证“真实价值”

先以两个具体用户群验证：机器人/自驾开发者，以及 AI 应用开发者。每个方向收集 5–8 个真实任务样本是研究计划，不是已完成访谈。用现有工具与平台做同一任务，记录成功率、完成时间、错误次数、重复使用、是否愿意导入第二份数据。

| 假设 | 验证任务 | 测量 | 没有验证前不宣称 |
|---|---|---|---|
| 统一回放能加速定位 | 找出故意加入的相机延迟或外参偏移 | 中位完成时间、定位正确率、复现率 | “提效 50%” |
| 数据质量工作台减少无效示教 | 在固定 episode 集合中找缺帧/动作异常 | 检出率、误报率、单片段审核时间 | “训练成功率显著提升” |
| 场景回归减少漏测 | 同一策略在固定场景集上 A/B | 实际覆盖、失败复现、重复结果一致性 | “保证自动驾驶安全” |
| AI 运行诊断帮助修复 | 找到慢 span、失败工具和缺失检索证据 | 修复前后时延与失败率 | “准确解释模型思考” |
| 资产工具有持续需求 | 用户导入第二个模型并完成检查 | 成功导入率、节点检查/导出率、复访 | “覆盖所有车型” |

调研停止条件：核心产品分层、全部 24 场景的真实引擎、重点授权限制和实施架构已有官方证据。未验证项包括商业规模、目标用户付费、私有数据权利、实际云 GPU 成本和目标设备性能，需后续独立实验。
