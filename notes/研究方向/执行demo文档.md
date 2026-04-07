```markdown
# GeoFusion Agent 最小可行 Demo 开发指导文档

> **文档用途**: 指导 LLM 编写一个最小可行 Demo 的全部代码
> **前置依赖**: 请同时参阅 `PROJECT_CONTEXT.md` 了解研究全貌
> **目标**: 跑通 "接收灾害信息 → KG指导流程规划 → LLM确定参数 → 执行融合 → 产出结果" 的端到端最小闭环

---

## 1. Demo 目标与边界

### 1.1 要做什么

一个 **单机运行的 Python 命令行/轻量 Web 程序**，实现以下流程：

```

用户发送一段灾害描述文本 (如: "杭州市余杭区发生洪水，请融合该区域建筑物数据") │ ▼ 系统接收消息，提取关键信息 (灾害类型、空间范围) │ ▼ 查询本地小型知识图谱，获取: · 该区域有哪些可用数据源 · 融合流程骨架 (需要哪些步骤) · 各数据源的坐标系等元信息 │ ▼ 将 KG 查询结果 + 用户消息 发送给 LLM，由 LLM 输出: · 具体执行计划 (是否需要坐标转换、用哪些数据源、融合参数等) │ ▼ 按照 LLM 输出的计划，自动执行: · [可选] 坐标系转换 · 调用预置的融合算法 · 保存融合结果 │ ▼ 输出融合后的 GeoJSON 文件 + 执行日志

```text

### 1.2 不做什么 (明确排除)

| 排除项 | 原因 |
|--------|------|
| 完整的 Neo4j 图数据库 | 最小 Demo 用 Python 内存中的图结构 (NetworkX 或纯字典) 即可 |
| 完整的四层本体模型 | 只实现数据层 + 算法层的最小子集 |
| 自修复 / 容错 / 重试机制 | 后续迭代再加 |
| Web 前端 / 地图可视化 | 命令行输出即可，或最简单的 Flask 接口 |
| 真实灾害预警 API 对接 | 用手动输入或 HTTP POST 模拟 |
| 大规模数据处理 | 每个数据源 100-500 条建筑物记录 |
| Celery / 异步任务队列 | 同步执行即可 |
| RAG 向量检索 | KG 规模极小，直接全量序列化为 LLM 上下文 |

---

## 2. 整体架构

```

geo\_fusion\_demo/ ├── data/ # 预置的测试数据 │ ├── buildings\_osm.geojson # 数据源A: 模拟OSM建筑数据 │ └── buildings\_ms.geojson # 数据源B: 模拟MS Buildings数据 │ ├── knowledge\_graph.py # 小型知识图谱 (内存构建+查询) ├── llm\_planner.py # LLM 交互模块 (调用API生成执行计划) ├── fusion\_engine.py # 融合算法 (预置，假设已有) ├── agent.py # 智能体主控 (串联全流程) ├── message\_handler.py # 消息接收入口 (Flask 或 CLI) │ ├── output/ # 融合结果输出目录 ├── config.py # 配置文件 (API Key, 路径等) ├── requirements.txt └── README.md

```text

各模块间的调用关系：

```

message\_handler.py │ (接收灾害消息文本) ▼ agent.py ←── 核心控制器 │ ├──→ knowledge\_graph.py (查询KG，获取数据源信息和流程骨架) │ ├──→ llm\_planner.py (将KG上下文+消息发给LLM，获取执行计划) │ ├──→ fusion\_engine.py (按计划执行数据加载→[转换]→融合→保存) │ └──→ output/fused\_result.geojson (最终产出)

```text

---

## 3. 测试数据准备

### 3.1 需要准备的数据

两份小规模建筑物矢量数据，模拟来自不同数据源、存在差异的情况。

#### 数据源 A：模拟 OSM 建筑物

| 要求项 | 规格 |
|--------|------|
| 文件名 | `buildings_osm.geojson` |
| 数据量 | 约 50-100 个建筑物 Polygon |
| 坐标系 | **EPSG:4326** (WGS84 经纬度) |
| 空间范围 | 杭州市余杭区某小片区 (自行编造即可，经度约120.0, 纬度约30.3) |
| 属性字段 | `osm_id` (string), `name` (string, 部分为空), `building_type` (string: "residential"/"commercial"/"industrial"), `source` (固定值 "OSM") |
| 特点 | 属性较丰富，几何形状可能不规则 |

#### 数据源 B：模拟 MS Buildings

| 要求项 | 规格 |
|--------|------|
| 文件名 | `buildings_ms.geojson` |
| 数据量 | 约 50-100 个建筑物 Polygon |
| 坐标系 | **EPSG:32650** (UTM 50N 投影坐标系，单位：米) —— **故意与A不同** |
| 空间范围 | 与数据源 A **大致相同区域**，但存在约 30-50% 重叠的建筑物 |
| 属性字段 | `ms_id` (string), `height` (float, 米), `confidence` (float, 0-1), `area_m2` (float), `source` (固定值 "MS_Buildings") |
| 特点 | 无名称，但有高度和置信度；坐标系不同（这是需要 LLM 通过 KG 判断并决定是否转换的关键测试点） |

#### 数据之间的关系设计

```

数据源A (OSM, EPSG:4326) 数据源B (MS, EPSG:32650) ┌─────────────────────┐ ┌─────────────────────┐ │ ████ ██ ████ │ │ ████ ██ ████ │ │ ████ ██ │ │ ████ ██ │ │ ██ ████ ██ │ │ ██ ████ ██ │ │ ██████ │ │ ██████ ██ │ │ ██ │ │ │ └─────────────────────┘ └─────────────────────┘ ~30-50% 空间重叠 属性字段完全不同 坐标系不同 (关键差异)

```text

### 3.2 数据生成方式

可以选择以下任一方式：
- **方式A (推荐)**：用 Python 脚本程序化生成。在指定 bbox 内随机生成矩形/L形 Polygon 作为建筑物，两个数据集在同一区域生成，自然产生部分重叠。
- **方式B**：从真实数据中裁剪小区域子集 (Overture / OSM 下载后裁剪)。

**用方式A时的注意事项**：
- 数据源B需要先在 EPSG:4326 下生成，然后转换为 EPSG:32650 保存，以确保两份数据确实覆盖同一区域
- 刻意让部分建筑物几乎完全重叠 (模拟同一建筑在两个数据源中都有)
- 属性字段按上表设计，两个数据源的字段完全不同

---

## 4. 知识图谱设计

### 4.1 设计原则

- 使用 **Python 内存数据结构** 实现 (NetworkX 有向图，或嵌套字典)
- 总规模：约 **8-12 个节点**，**10-15 条边**
- 必须能回答以下查询：
  1. "余杭区有哪些可用的建筑物数据源？"
  2. "这些数据源各自是什么坐标系？"
  3. "融合建筑物数据需要哪些步骤？"
  4. "如果坐标系不一致，应该怎么处理？"

### 4.2 节点定义

```

节点1: DataSource\_OSM type: DataSource properties: source\_id: "osm\_buildings" source\_name: "OpenStreetMap Buildings" format: "GeoJSON" crs: "EPSG:4326" theme: "building" coverage: "yuhang\_district" file\_path: "data/buildings\_osm.geojson" quality\_score: 0.8

节点2: DataSource\_MS type: DataSource properties: source\_id: "ms\_buildings" source\_name: "Microsoft Buildings" format: "GeoJSON" crs: "EPSG:32650" ← 与OSM不同，这是关键 theme: "building" coverage: "yuhang\_district" file\_path: "data/buildings\_ms.geojson" quality\_score: 0.9

节点3: DataType\_Building type: DataType properties: type\_id: "building\_polygon" label: "建筑物面数据" geom\_type: "Polygon"

节点4: Algorithm\_CRS\_Transform type: Algorithm properties: algo\_id: "crs\_transform" algo\_name: "坐标系转换" description: "将数据从一个坐标参考系转换到另一个" tool\_function: "fusion\_engine.transform\_crs" params: ["source\_crs", "target\_crs"]

节点5: Algorithm\_Fusion type: Algorithm properties: algo\_id: "building\_fusion" algo\_name: "建筑物数据融合" description: "基于空间位置合并多源建筑物数据，去除重复要素" tool\_function: "fusion\_engine.fuse\_buildings" precondition: "所有输入数据必须为相同坐标系" ← 关键约束 params: ["iou\_threshold", "target\_crs"]

节点6: Algorithm\_Quality\_Check type: Algorithm properties: algo\_id: "quality\_check" algo\_name: "数据质量检查" description: "检查几何有效性，修复无效几何" tool\_function: "fusion\_engine.quality\_check" params: []

节点7: WorkflowPattern\_BuildingFusion type: WorkflowPattern properties: pattern\_id: "building\_fusion\_workflow" pattern\_name: "多源建筑物数据融合工作流" applicable\_disaster: ["flood", "earthquake"] steps\_description: "质量检查 → [坐标系统一(如需)] → 空间融合"

节点8: Region\_Yuhang type: Region properties: region\_id: "yuhang\_district" region\_name: "杭州市余杭区" bbox: [119.9, 30.2, 120.1, 30.4] ← 大致范围

```text

### 4.3 边 (关系) 定义

```

边1: DataSource\_OSM --[provides]--> DataType\_Building 边2: DataSource\_MS --[provides]--> DataType\_Building 边3: DataSource\_OSM --[covers]--> Region\_Yuhang 边4: DataSource\_MS --[covers]--> Region\_Yuhang

边5: WorkflowPattern --[has\_step {order:1}]--> Algorithm\_Quality\_Check 边6: WorkflowPattern --[has\_step {order:2}]--> Algorithm\_CRS\_Transform 边7: WorkflowPattern --[has\_step {order:3}]--> Algorithm\_Fusion

边8: Algorithm\_CRS\_Transform --[transforms]--> DataType\_Building 边9: Algorithm\_Fusion --[requires\_input]--> DataType\_Building 边10: Algorithm\_Fusion --[produces\_output]--> DataType\_Building

边11: Region\_Yuhang --[may\_trigger {disaster\_type: "flood"}]--> WorkflowPattern

```text

### 4.4 知识图谱查询接口

`knowledge_graph.py` 需要提供以下查询函数：

```

函数1: get\_available\_sources(region: str, theme: str) -> list[dict] 描述: 给定区域和数据主题，返回可用的数据源列表及其元信息 示例输入: region="yuhang\_district", theme="building" 示例输出: [ {source\_id: "osm\_buildings", crs: "EPSG:4326", file\_path: "...", quality: 0.8}, {source\_id: "ms\_buildings", crs: "EPSG:32650", file\_path: "...", quality: 0.9} ]

函数2: get\_workflow\_pattern(disaster\_type: str) -> dict 描述: 给定灾害类型，返回推荐的工作流骨架 示例输入: disaster\_type="flood" 示例输出: { pattern\_id: "building\_fusion\_workflow", steps: [ {order: 1, algo\_id: "quality\_check", algo\_name: "...", description: "..."}, {order: 2, algo\_id: "crs\_transform", algo\_name: "...", description: "...", note: "仅当输入数据坐标系不一致时执行"}, {order: 3, algo\_id: "building\_fusion", algo\_name: "...", description: "...", precondition: "所有输入数据必须为相同坐标系"} ] }

函数3: get\_algorithm\_detail(algo\_id: str) -> dict 描述: 获取算法的详细信息 (参数、前置条件、可调用的函数名等) 示例输入: algo\_id="building\_fusion" 示例输出: { algo\_id: "building\_fusion", tool\_function: "fusion\_engine.fuse\_buildings", precondition: "所有输入数据必须为相同坐标系", params: [ {name: "iou\_threshold", type: "float", range: [0.1, 0.9], default: 0.5, description: "IoU阈值，大于此值的建筑物视为重复"}, {name: "target\_crs", type: "string", default: "EPSG:4326", description: "融合输出的目标坐标系"} ] }

函数4: check\_crs\_consistency(sources: list[dict]) -> dict 描述: 检查多个数据源的坐标系是否一致 示例输入: [{source\_id: "osm", crs: "EPSG:4326"}, {source\_id: "ms", crs: "EPSG:32650"}] 示例输出: { consistent: False, crs\_list: ["EPSG:4326", "EPSG:32650"], recommendation: "需要执行坐标系转换，建议统一到EPSG:4326" }

```text

---

## 5. 融合算法 (预置)

### 5.1 需要实现的函数

`fusion_engine.py` 需要包含以下函数，它们被视为"已有的融合算法"，Demo 中直接调用：

```

函数1: quality\_check(gdf: GeoDataFrame) -> GeoDataFrame 功能: 检查并修复无效几何 逻辑: - 检查 geometry.is\_valid - 无效几何用 buffer(0) 修复 - 移除空几何 - 返回修复后的 GeoDataFrame 日志: 打印修复了多少条记录

函数2: transform\_crs(gdf: GeoDataFrame, target\_crs: str) -> GeoDataFrame 功能: 坐标系转换 逻辑: - 读取当前 CRS - 若与 target\_crs 不同，执行 gdf.to\_crs(target\_crs) - 若已相同，直接返回 日志: 打印从什么CRS转到什么CRS

函数3: fuse\_buildings(gdf\_list: list[GeoDataFrame], iou\_threshold: float, target\_crs: str) -> GeoDataFrame 功能: 多源建筑物数据融合 (核心融合算法) 逻辑: - 确认所有输入都是同一坐标系 (否则报错) - 合并所有 GeoDataFrame (pd.concat) - 使用空间索引 (STRtree) 找到彼此 bbox 相交的建筑物对 - 计算相交对的 IoU (intersection.area / union.area) - IoU > iou\_threshold 的视为同一建筑物，保留属性更丰富/置信度更高的那条 - 返回去重后的融合结果 GeoDataFrame 日志: 打印合并前总数、匹配到的重复对数、融合后总数

函数4: save\_result(gdf: GeoDataFrame, output\_path: str) -> str 功能: 保存融合结果 逻辑: gdf.to\_file(output\_path, driver="GeoJSON") 返回: 输出文件路径

```text

### 5.2 重要说明

- 融合算法本身不是本研究的贡献点，此处只需 **功能正确、逻辑清晰** 即可
- 不需要复杂的语义匹配，简单的 IoU 空间重叠判断足够用于 Demo
- 函数签名必须与 KG 中注册的 `tool_function` 和 `params` 对应

---

## 6. LLM 规划模块

### 6.1 职责

`llm_planner.py` 负责：
1. 接收 agent 传来的 (用户消息 + KG 查询结果)
2. 构造 Prompt 发送给 LLM API
3. 解析 LLM 返回的 JSON 格式执行计划
4. 返回结构化的执行计划给 agent

### 6.2 Prompt 构造策略

Prompt 由以下部分拼接而成：

```

[System Prompt] 你是 GeoFusion Agent 的规划核心。你的任务是根据灾害信息和知识图谱提供的上下文， 输出一个 JSON 格式的执行计划。

规则:

1.  只能使用知识图谱中注册的算法 (algo\_id)
    
2.  必须检查数据源的坐标系是否一致，如果不一致，必须先安排坐标系转换步骤
    
3.  融合算法的前置条件是"所有输入数据必须为相同坐标系"，必须确保这一点
    
4.  为融合算法的 iou\_threshold 参数选择合适的值 (根据灾害类型和数据特征推理)
    
5.  严格按照指定的 JSON Schema 输出
    

[Knowledge Graph Context] ← 由 agent 从 KG 查询后填入

## 可用数据源:

{get\_available\_sources 的结果}

## 推荐工作流骨架:

{get\_workflow\_pattern 的结果}

## 坐标系一致性检查:

{check\_crs\_consistency 的结果}

## 算法详情:

{各算法的 get\_algorithm\_detail 结果}

[User Message] {用户输入的灾害描述文本}

[Output JSON Schema] {output\_schema} ← 见 6.3 节

````text

### 6.3 LLM 输出的 JSON Schema

```json
{
  "disaster_type": "string (识别出的灾害类型)",
  "region": "string (识别出的区域)",
  "reasoning": "string (LLM的推理过程，解释为什么这样安排步骤)",
  "execution_plan": [
    {
      "step": 1,
      "algo_id": "string (KG中注册的算法ID)",
      "description": "string (步骤描述)",
      "apply_to": ["string (对哪些数据源执行，用source_id)"],
      "parameters": {
        "key": "value (具体参数)"
      }
    }
  ],
  "output_config": {
    "target_crs": "string (最终输出坐标系)",
    "output_format": "GeoJSON",
    "output_filename": "string (建议的输出文件名)"
  }
}
````

### 6.4 一个预期的 LLM 输出示例

当输入消息为 "杭州市余杭区发生洪水，请融合该区域建筑物数据" 时，LLM 应该输出类似：

```json
{
  "disaster_type": "flood",
  "region": "yuhang_district",
  "reasoning": "用户需要融合余杭区的建筑物数据用于洪水灾害评估。根据知识图谱，该区域有两个可用数据源：OSM Buildings (EPSG:4326) 和 MS Buildings (EPSG:32650)。两者坐标系不一致，需要先将 MS Buildings 转换为 EPSG:4326。洪水场景下建筑物密集，IoU阈值建议设为0.5以平衡去重效果和保留率。",
  "execution_plan": [
    {
      "step": 1,
      "algo_id": "quality_check",
      "description": "对OSM建筑数据进行几何有效性检查",
      "apply_to": ["osm_buildings"],
      "parameters": {}
    },
    {
      "step": 2,
      "algo_id": "quality_check",
      "description": "对MS建筑数据进行几何有效性检查",
      "apply_to": ["ms_buildings"],
      "parameters": {}
    },
    {
      "step": 3,
      "algo_id": "crs_transform",
      "description": "将MS Buildings从EPSG:32650转换为EPSG:4326",
      "apply_to": ["ms_buildings"],
      "parameters": {
        "source_crs": "EPSG:32650",
        "target_crs": "EPSG:4326"
      }
    },
    {
      "step": 4,
      "algo_id": "building_fusion",
      "description": "融合两个数据源的建筑物数据，基于IoU去重",
      "apply_to": ["osm_buildings", "ms_buildings"],
      "parameters": {
        "iou_threshold": 0.5,
        "target_crs": "EPSG:4326"
      }
    }
  ],
  "output_config": {
    "target_crs": "EPSG:4326",
    "output_format": "GeoJSON",
    "output_filename": "fused_buildings_yuhang_flood.geojson"
  }
}
```

### 6.5 LLM API 调用要求

-   支持 OpenAI 兼容接口 (可切换 GPT-4 / deepseek / Qwen 等)
    
-   API base URL 和 key 从 `config.py` 读取
    
-   使用 `response_format={"type": "json_object"}` 强制 JSON 输出
    
-   设置 `temperature=0` 以保证输出稳定性
    
-   需要有基本的异常处理：API 调用失败时打印错误并退出
    

---

## 7\. Agent 主控模块

### 7.1 职责

`agent.py` 是整个 Demo 的核心控制器，串联所有模块。

### 7.2 主流程伪代码

```text
FUNCTION handle_disaster_message(message: str) -> str:

    PRINT "====== GeoFusion Agent 启动 ======"
    PRINT f"收到消息: {message}"

    // Step 1: 从消息中初步提取信息 (可以简单用LLM做一次提取，也可以硬编码为demo)
    // 至少需要: disaster_type, region
    // 为简化，可以让后续的规划LLM调用一次性完成提取+规划

    // Step 2: 查询知识图谱
    PRINT ">>> 正在查询知识图谱..."
    sources = KG.get_available_sources(region, theme="building")
    workflow = KG.get_workflow_pattern(disaster_type)
    crs_check = KG.check_crs_consistency(sources)
    algo_details = [KG.get_algorithm_detail(step.algo_id) FOR step IN workflow.steps]

    PRINT f"  找到 {len(sources)} 个数据源"
    PRINT f"  工作流骨架: {workflow.pattern_name}"
    PRINT f"  坐标系一致: {crs_check.consistent}"

    // Step 3: 调用LLM生成执行计划
    PRINT ">>> 正在调用LLM生成执行计划..."
    kg_context = format_kg_context(sources, workflow, crs_check, algo_details)
    plan = LLM_Planner.generate_plan(message, kg_context)

    PRINT f"  LLM推理: {plan.reasoning}"
    PRINT f"  执行计划共 {len(plan.execution_plan)} 步"

    // Step 4: 按计划执行
    PRINT ">>> 开始执行融合工作流..."

    // 加载数据
    datasets = {}
    FOR source IN sources:
        datasets[source.source_id] = gpd.read_file(source.file_path)
        PRINT f"  已加载 {source.source_id}: {len(datasets[source.source_id])} 条记录"

    // 逐步执行计划
    FOR step IN plan.execution_plan:
        PRINT f"  执行步骤 {step.step}: {step.description}"

        IF step.algo_id == "quality_check":
            FOR source_id IN step.apply_to:
                datasets[source_id] = fusion_engine.quality_check(datasets[source_id])

        ELIF step.algo_id == "crs_transform":
            FOR source_id IN step.apply_to:
                datasets[source_id] = fusion_engine.transform_crs(
                    datasets[source_id], step.parameters.target_crs)

        ELIF step.algo_id == "building_fusion":
            gdf_list = [datasets[sid] FOR sid IN step.apply_to]
            fused = fusion_engine.fuse_buildings(
                gdf_list,
                iou_threshold=step.parameters.iou_threshold,
                target_crs=step.parameters.target_crs)

    // Step 5: 保存结果
    output_path = f"output/{plan.output_config.output_filename}"
    fusion_engine.save_result(fused, output_path)
    PRINT f"====== 融合完成! 结果保存至: {output_path} ======"
    PRINT f"  融合前: 数据源A {n_a} 条 + 数据源B {n_b} 条"
    PRINT f"  融合后: {len(fused)} 条"

    RETURN output_path
```

### 7.3 执行计划的解释与调度逻辑

Agent 接收到 LLM 返回的 JSON 计划后，需要一个简单的 **步骤调度器**，将 `algo_id` 映射到实际的 Python 函数调用。映射关系表：

| plan 中的 algo\_id | 实际调用的函数 | 说明  |
| --- | --- | --- |
| `"quality_check"` | `fusion_engine.quality_check(gdf)` | 对 apply\_to 中每个数据源分别调用 |
| `"crs_transform"` | `fusion_engine.transform_crs(gdf, target_crs)` | 对 apply\_to 中每个数据源分别调用 |
| `"building_fusion"` | `fusion_engine.fuse_buildings(gdf_list, iou_threshold, target_crs)` | 将 apply\_to 中所有数据源一起传入 |

这个映射可以用一个简单的字典实现，不需要复杂的插件机制。

---

## 8\. 消息接收入口

### 8.1 两种实现方式 (任选其一)

#### 方式 A：命令行 (最简)

```text
运行方式: python message_handler.py --message "杭州市余杭区发生洪水，请融合该区域建筑物数据"
或交互式: python message_handler.py  (然后提示输入)
```

#### 方式 B：Flask HTTP 接口 (推荐，更接近真实场景)

```text
启动: python message_handler.py  (监听 localhost:5000)

触发: POST http://localhost:5000/api/trigger
Body: {
    "message": "杭州市余杭区发生洪水，请融合该区域建筑物数据"
}

响应: {
    "status": "success",
    "output_file": "output/fused_buildings_yuhang_flood.geojson",
    "statistics": {
        "input_source_count": 2,
        "total_input_features": 180,
        "fused_features": 130,
        "duplicates_removed": 50
    },
    "execution_log": ["..."]
}
```

### 8.2 实现要求

-   方式B: 只需一个路由 (`/api/trigger`)，最简 Flask 应用
    
-   接收到消息后调用 `agent.handle_disaster_message(message)`
    
-   返回执行结果摘要
    

---

## 9\. 配置文件

`config.py` 需要包含：

```text
# LLM API 配置
LLM_API_BASE_URL = "https://api.openai.com/v1"   # 或其他兼容接口
LLM_API_KEY = "sk-..."                             # 从环境变量读取更安全
LLM_MODEL = "gpt-4o"                               # 或 "deepseek-chat", "qwen-plus"

# 数据路径
DATA_DIR = "data/"
OUTPUT_DIR = "output/"

# 默认参数
DEFAULT_TARGET_CRS = "EPSG:4326"
DEFAULT_IOU_THRESHOLD = 0.5
```

---

## 10\. 任务清单 (Task List)

以下是按实施顺序排列的开发任务。每个任务独立可测试。

| 序号  | 任务  | 输入  | 产出  | 验收标准 |
| --- | --- | --- | --- | --- |
| **T1** | 编写测试数据生成脚本 | 无   | `data/buildings_osm.geojson` + `data/buildings_ms.geojson` | 两个文件可被 GeoPandas 正确读取；CRS 分别为 4326 和 32650；空间有重叠 |
| **T2** | 实现知识图谱模块 (`knowledge_graph.py`) | 无   | 可调用的 4 个查询函数 | 每个函数返回正确的结构化结果；可以独立 `python knowledge_graph.py` 运行测试 |
| **T3** | 实现融合算法模块 (`fusion_engine.py`) | T1的测试数据 | 4 个处理函数 | 各函数可独立测试：quality\_check 能修复无效几何；transform\_crs 能正确转换；fuse\_buildings 能去重合并 |
| **T4** | 实现 LLM 规划模块 (`llm_planner.py`) | T2的KG输出 + 测试消息 | 结构化执行计划 JSON | 给定KG上下文和灾害消息，能输出符合 6.3 Schema 的 JSON；能正确识别需要坐标转换 |
| **T5** | 实现 Agent 主控 (`agent.py`) | T2+T3+T4 | 端到端执行函数 | 调用 `handle_disaster_message("...")` 能完整走通并输出融合结果文件 |
| **T6** | 实现消息入口 (`message_handler.py`) | T5  | 可运行的 CLI 或 Flask 应用 | 命令行或 HTTP POST 能触发完整流程 |
| **T7** | 编写 `config.py` + `requirements.txt` + `README.md` | 全部  | 项目配置与文档 | 新环境 pip install + 配置 API Key 后能直接运行 |
| **T8** | 端到端测试 | 全部  | 测试日志 + 输出文件 | 输入灾害消息 → 自动完成融合 → 输出 GeoJSON，控制台有完整日志 |

### 任务依赖关系

```text
T1 (数据) ──────────────┐
T2 (知识图谱) ───────────┤
                         ├──→ T5 (Agent) ──→ T6 (消息入口) ──→ T8 (端到端测试)
T3 (融合算法) ──[依赖T1]─┤
T4 (LLM规划) ──[依赖T2]─┘
                T7 (配置文档) ──→ T8
```

**建议实施顺序**：T1 → T2 → T3 → T4 → T7(config部分) → T5 → T6 → T7(文档部分) → T8

---

## 11\. 关键测试用例

### 11.1 正常流程测试

```text
输入: "杭州市余杭区发生洪水，请融合该区域建筑物数据"
期望行为:
  1. KG查到2个数据源，CRS不一致
  2. LLM计划中包含坐标转换步骤
  3. 融合执行成功
  4. 输出GeoJSON记录数 < 两个数据源记录数之和 (说明去重生效)
  5. 输出GeoJSON的CRS为EPSG:4326
```

### 11.2 LLM 推理验证测试

```text
输入: "余杭区地震后需要评估建筑物损失"
期望行为:
  · LLM识别灾害类型为earthquake (而非flood)
  · 仍然能匹配到building_fusion_workflow (因为适用于flood和earthquake)
  · iou_threshold可能与洪水场景不同 (LLM自主决定，需在reasoning中解释)
```

### 11.3 日志输出格式参考

```text
====== GeoFusion Agent 启动 ======
收到消息: 杭州市余杭区发生洪水，请融合该区域建筑物数据

>>> 正在查询知识图谱...
  找到 2 个可用数据源: osm_buildings (EPSG:4326), ms_buildings (EPSG:32650)
  推荐工作流: 多源建筑物数据融合工作流 (3步)
  坐标系一致: ✗ (EPSG:4326, EPSG:32650)

>>> 正在调用LLM生成执行计划...
  LLM推理: 两个数据源坐标系不一致，需先将MS Buildings从EPSG:32650转换...
  生成执行计划: 4步

>>> 开始执行融合工作流...
  [Step 1/4] 质量检查 (osm_buildings): 80条 → 修复2条无效几何 → 80条
  [Step 2/4] 质量检查 (ms_buildings): 100条 → 修复0条 → 100条
  [Step 3/4] 坐标转换 (ms_buildings): EPSG:32650 → EPSG:4326
  [Step 4/4] 建筑物融合: 80+100=180条输入, IoU阈值=0.5
             找到 35 对重复建筑物
             融合后: 145条

====== 融合完成! ======
  输出文件: output/fused_buildings_yuhang_flood.geojson
  融合前: 180 条 (OSM: 80, MS: 100)
  融合后: 145 条 (去重: 35 对)
  耗时: 3.2 秒
```

---

## 12\. Python 依赖

```text
geopandas>=0.14
shapely>=2.0
pyproj>=3.6
pandas>=2.0
numpy>=1.24
networkx>=3.0        # 内存知识图谱
requests>=2.31       # LLM API调用 (或用openai库)
openai>=1.0          # OpenAI兼容API客户端
flask>=3.0           # 消息接收 (若选方式B)
```

---

## 13\. 给编码 LLM 的特别提示

1.  **每个模块独立可测试**：每个 `.py` 文件底部加 `if __name__ == "__main__":` 测试代码，可以单独运行验证。
    
2.  **日志要充分**：Demo 的价值在于展示流程，每个关键步骤都要打印清晰的中文日志。
    
3.  **KG 用 NetworkX**：不要引入 Neo4j。用 `networkx.DiGraph` 在内存中构建，通过遍历节点和边实现查询函数。
    
4.  **LLM 输出要可靠解析**：用 `json.loads()` 解析 LLM 返回；如果解析失败，打印原始输出并报错。
    
5.  **测试数据要确保有重叠**：数据生成脚本中，先生成一批公共建筑物，然后各自加入独有的建筑物，最后给B数据集转换坐标系。
    
6.  **不要过度设计**：这是最小 Demo，优先保证端到端跑通，代码简洁清晰优于架构完美。
    
7.  **API Key 处理**：从环境变量 `OPENAI_API_KEY` 读取，`config.py` 中提供默认值但注释说明应该用环境变量。
    

```text

---

以上即为完整的 Demo 开发指导文档。将它连同 `PROJECT_CONTEXT.md` 一起提供给编码 LLM，后者即可按 **T1→T8** 的任务顺序逐步实现全部代码。
```