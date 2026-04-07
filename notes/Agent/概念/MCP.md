# MCP

---

# 1）什么是 MCP？它解决了什么核心问题？

\*\*MCP（Model Context Protocol，模型上下文协议）\*\*是一个开放标准，用来把 AI 应用连接到外部系统。官方定义非常直接：它让 Claude、ChatGPT 这类 AI 应用能够标准化地连接数据源、工具和工作流，比如本地文件、数据库、搜索引擎、计算器、专用提示模板等。（官方介绍页：`modelcontextprotocol.io/introduction`）

你可以把它理解成：

-   **对 AI 来说的 USB-C 接口**
    
-   **对工具生态来说的统一插槽**
    
-   **对工程团队来说的标准集成层**
    

## 它解决的核心问题

MCP 主要解决的是 **AI 与外部世界集成的碎片化问题**：

### 没有 MCP 之前

如果你有：

-   3 个 AI 客户端：Claude、Cursor、自研 Copilot
    
-   20 个工具/系统：GitHub、Notion、数据库、搜索、CRM、文件系统……
    

那通常会变成：

-   每个客户端都要单独适配每个工具
    
-   每个工具都要为不同 AI 平台重写一遍接入逻辑
    
-   认证、参数格式、错误处理、权限控制都不统一
    

这就是典型的 **N×M 集成爆炸**。

### 有了 MCP 之后

目标变成：

-   工具侧实现一次 **MCP Server**
    
-   客户端侧实现一次 **MCP Client/Host**
    
-   双方按统一协议说话
    

于是从 **N×M** 变成 **N + M**。

## 它带来的本质变化

MCP 不是简单“让模型能调 API”，而是把下面这些能力统一起来：

-   能发现有哪些工具可用
    
-   能知道工具参数 schema 长什么样
    
-   能读资源（文件/文档/数据库结果）
    
-   能拿提示模板
    
-   能处理通知、进度、会话
    
-   在某些场景下还能让 server 反向请求 client 做模型采样
    

所以它是一个**完整的上下文交换协议**，不是单点功能。

---

# 2）MCP、Function Calling 和 Agent 有什么区别与联系？

这是最容易混淆的地方。

## 一句话区分

-   **Function Calling**：模型“如何决定调用一个函数”的能力
    
-   **MCP**：AI 应用“如何标准化连接外部工具/资源”的协议
    
-   **Agent**：一个带有目标、循环、规划、记忆和工具使用能力的系统
    

## 直观类比

-   **Function Calling** 像是：模型会说“我要调用这个函数”
    
-   **MCP** 像是：系统给模型准备了一套统一插座和工具目录
    
-   **Agent** 像是：一个会规划、会调用工具、会根据结果继续行动的“执行体”
    

## 三者关系表

| 概念  | 本质  | 关注点 | 是否依赖模型 | 典型作用 |
| --- | --- | --- | --- | --- |
| Function Calling | 模型能力/输出格式 | 模型怎么发起调用 | 是   | 让模型选择工具 |
| MCP | 协议  | 工具/资源如何标准化接入 | 否，模型无关 | 统一连接生态 |
| Agent | 应用架构/运行范式 | 如何完成复杂任务 | 通常依赖模型 | 规划、执行、迭代 |

## 它们怎么协同工作？

最常见链路是：

1.  **Host/客户端** 通过 MCP 连接多个 MCP Server
    
2.  Host 获取 server 暴露的工具、资源、提示
    
3.  Host 把其中的 **Tools** 转成模型可理解的 tool/function schema
    
4.  模型在推理时用 **Function Calling** 选择某个工具
    
5.  Host 接到调用后，真正通过 **MCP** 发请求到对应 server
    
6.  server 执行并返回结果
    
7.  Agent 再基于结果继续规划下一步
    

所以：

> **Function Calling 往往是 Agent 决策层的一部分，MCP 往往是 Agent 工具接入层的一部分。**

## 关键结论

-   **MCP 不是 Function Calling 的替代品**
    
-   **MCP 也不是 Agent**
    
-   但 **Agent 很可能内部同时用到 MCP + Function Calling**
    

---

# 3）MCP v1.0 的“四大核心能力”是什么？

这里要先做一个**严谨校正**：

> 中文社区常说的“四大核心能力”通常是<br>**Resources / Tools / Prompts / Sampling**

但如果你严格按官方文档看，分类其实更细：

## 官方更严格的说法

官方 architecture 页面明确写到：

### Server 侧三大核心 primitives

-   **Tools**
    
-   **Resources**
    
-   **Prompts**
    

### Client 侧 primitives

-   **Sampling**
    
-   **Elicitation**
    
-   **Logging**
    

也就是说：

-   把 **Sampling** 算作“第四大能力”是**工程上常见的归纳**
    
-   但它和前三者**不在同一侧、也不完全同一层级**
    

## 你可以这样理解这“四大能力”

### 1\. Resources：给模型“看”的上下文

这是**只读的上下文数据**。

典型例子：

-   文件内容
    
-   API 响应
    
-   数据库 schema
    
-   文档页面
    
-   历史记录
    

它们通常通过 URI 暴露，例如：

-   `file:///...`
    
-   `db://...`
    
-   `calendar://...`
    

**特点：**

-   偏被动
    
-   更像“给模型看资料”
    
-   一般没有副作用
    

---

### 2\. Tools：给模型“做事”的函数

这是模型可以主动调用的能力。

典型例子：

-   发邮件
    
-   查数据库
    
-   下单
    
-   调用搜索 API
    
-   修改文件
    
-   创建日历事件
    

**特点：**

-   可执行
    
-   可能有副作用
    
-   一般是模型控制，但通常要有人类审批或权限控制
    

---

### 3\. Prompts：给用户/模型“复用工作流模板”

Prompts 不是简单的 system prompt，而是**参数化、可复用的模板化工作流入口**。

典型例子：

-   “总结我的会议”
    
-   “计划一周旅行”
    
-   “分析当前代码质量”
    
-   “生成月报”
    

**特点：**

-   更像“高级快捷命令”
    
-   常由用户显式触发
    
-   可以把 Tools + Resources 组合起来
    

---

### 4\. Sampling：让 server 反向借用 host 的模型能力

这是最容易被忽略但很重要的一项。

它的意思是：

-   MCP Server 本身不绑定某个模型
    
-   当 server 执行任务时，如果需要模型推理
    
-   它可以**请求 client/host 替自己做一次模型采样/补全**
    

比如一个“机票推荐工具”：

-   它先调用多个航司 API 拿到 47 条航班数据
    
-   然后它不自己带一个 LLM SDK
    
-   而是通过 sampling 请求 host 的模型帮它做“综合推荐”
    

**特点：**

-   是 server → client 的反向请求
    
-   让 server 保持模型无关
    
-   也更利于权限和成本统一由 host 控制
    

---

# 4）MCP 的“四层分层架构”是如何运行的？

这里也需要先校正一下。

## 严格按官方说法

官方最明确的是两组结构：

### 参与者结构

-   **Host**
    
-   **Client**
    
-   **Server**
    

### 协议分层

-   **Data layer**
    
-   **Transport layer**
    

也就是说，**官方没有一个固定术语叫“标准四层架构”**。

---

## 但如果从工程视角把它压成“四层”，最常见、最好理解的是：

### 第 1 层：Host / 应用层

就是用户真正接触的 AI 应用：

-   Claude Desktop
    
-   Claude Web
    
-   Cursor
    
-   VS Code Copilot
    
-   自研 AI 助手
    

**职责：**

-   接收用户输入
    
-   聚合多个 MCP server 的能力
    
-   管理权限、审批、会话
    
-   决定把哪些 tools/resources 暴露给模型
    

---

### 第 2 层：MCP Client / 会话管理层

这是 host 内部的协议适配层。

官方说得很清楚：一个 host 通常会为每个 server 创建一个专属 client，每个 client 维护一条专用连接。

**职责：**

-   初始化连接
    
-   协议版本协商
    
-   capabilities 协商
    
-   发送请求 / 接收响应 / 处理通知
    
-   管理订阅、会话、断线重连等
    

---

### 第 3 层：协议与传输层

这一层可以再拆成两个子层：

#### 3.1 Data Layer

基于 **JSON-RPC 2.0** 定义消息结构和语义，包括：

-   `initialize`
    
-   `tools/list`
    
-   `tools/call`
    
-   `resources/read`
    
-   `prompts/get`
    
-   `notifications/...`
    

#### 3.2 Transport Layer

负责真正把 JSON-RPC 消息送出去：

-   stdio
    
-   Streamable HTTP
    
-   （可选）自定义 transport
    

---

### 第 4 层：MCP Server / 能力层

真正对接外部世界的那一层。

它可以连接：

-   本地文件系统
    
-   数据库
    
-   GitHub / GitLab
    
-   搜索引擎
    
-   企业 SaaS
    
-   CRM / ERP / 工单系统
    
-   浏览器自动化
    
-   任何 API
    

**职责：**

-   把外部能力封装成 Tools / Resources / Prompts
    
-   接受 client 请求
    
-   执行工具
    
-   返回结构化结果
    
-   必要时请求 sampling / elicitation
    

---

## 这四层是怎么跑起来的？

一个典型调用链如下：

### 阶段 1：初始化

1.  Host 启动/连接某个 MCP Server
    
2.  Client 发送 `initialize`
    
3.  双方协商：
    
    -   协议版本
        
    -   server 支持哪些能力（tools/resources/prompts）
        
    -   client 支持哪些能力（sampling/elicitation 等）
        
4.  client 发送 `initialized` 通知
    

### 阶段 2：能力发现

5.  Host 通过 client 请求：
    
    -   `tools/list`
        
    -   `resources/list`
        
    -   `prompts/list`
        
6.  server 返回元数据与 schema
    

### 阶段 3：模型做工具选择

7.  Host 把工具 schema 转给模型
    
8.  用户提问
    
9.  模型决定调用某个 tool（通常通过 function/tool calling 机制）
    

### 阶段 4：执行与反馈

10.  Host 让 MCP client 发起 `tools/call`
    
11.  server 执行真实操作
    
12.  结果返回给 host
    
13.  host 把结果再喂回模型
    
14.  模型继续回答，或继续下一轮工具调用
    

### 阶段 5：动态通知

15.  如果 server 工具列表变了、资源更新了、长任务有进度
    
16.  server 可以发 `notifications/...`
    
17.  client 更新本地能力视图或 UI
    

---

## 一个更准确的总结

所以你如果问“官方架构是什么”，答案是：

> **Host-Client-Server 架构 + Data/Transport 两层协议**

如果你问“工程上怎么分四层最好理解”，答案是：

> **Host 层 → Client 会话层 → 协议/传输层 → Server 能力层**

---

# 5）为什么 MCP 选择了 JSON-RPC 2.0，而不是 RESTful？

这个问题很关键。

## 先说结论

因为 MCP 的核心不是“资源 CRUD”，而是：

-   **会话化**
    
-   **双向通信**
    
-   **能力协商**
    
-   **方法调用**
    
-   **通知**
    
-   **流式结果**
    
-   **server 主动请求 client**
    

这些需求更像 **RPC 协议问题**，而不是 REST 的资源建模问题。

---

## REST 不擅长的地方

REST 更擅长：

-   资源定位：`/users/123`
    
-   标准动词：GET / POST / PUT / DELETE
    
-   无状态请求
    
-   面向 HTTP 语义
    
-   缓存、中间件、CDN 友好
    

但 MCP 需要的是：

-   `initialize`
    
-   `tools/call`
    
-   `resources/read`
    
-   `notifications/tools/list_changed`
    
-   server 在同一会话里向 client 发请求
    
-   一个请求要通过 `id` 精确关联响应
    
-   在 stdio 和 HTTP 上使用**完全同一套消息格式**
    

这些都更自然地映射到 **JSON-RPC 2.0**。

---

## JSON-RPC 2.0 适合 MCP 的 5 个核心原因

### 1\. 它天然适合“方法调用”

MCP 本质是很多命名方法：

-   `initialize`
    
-   `tools/list`
    
-   `tools/call`
    
-   `resources/read`
    

这比硬凑成 REST 端点更直接。

---

### 2\. 它天然支持请求 / 响应 / 通知三种消息

MCP 需要：

-   有返回值的 request
    
-   无返回值的 notification
    
-   用 `id` 对齐 request-response
    

JSON-RPC 原生就支持。

---

### 3\. 它适合双向、长会话模型

MCP 是**有状态协议**，初始化后双方会持续交互。

而 REST 倾向于：

-   每个请求独立
    
-   客户端请求，服务器响应
    
-   不强调会话协商和 server 主动消息
    

MCP 明显不是这种模式。

---

### 4\. 它具备传输无关性

MCP 官方明确强调：

-   同样的 JSON-RPC 消息
    
-   可以跑在 stdio 上
    
-   也可以跑在 Streamable HTTP 上
    

如果用 REST 作为应用层语义，那就会强绑定 HTTP，本地 stdio 场景会很别扭。

---

### 5\. 它更方便做能力协商

MCP 初始化阶段要协商：

-   版本
    
-   capabilities
    
-   支持的 primitives
    
-   是否支持 notifications / sampling 等
    

这更像“协议握手”，不像典型 REST 资源模型。

---

## 那 MCP 完全不用 HTTP 吗？

不是。

MCP 并不是“反 HTTP”，它只是**不把 REST 当应用层语义**。

它当前远程推荐方式就是：

-   **Streamable HTTP**
    
-   里面承载的是 **JSON-RPC 消息**
    

所以更准确的说法是：

> MCP 选择的是 **JSON-RPC 作为语义层**，<br>**HTTP/stdio 作为传输层**。

---

# 6）MCP 支持哪些传输方式？

按当前官方规范，**标准传输方式有两种**：

## 1\. stdio

适用于本地 server。

工作方式：

-   client 把 server 当子进程拉起
    
-   server 从 `stdin` 读 JSON-RPC
    
-   server 向 `stdout` 写 JSON-RPC
    
-   `stderr` 可用于日志
    

**优点：**

-   简单
    
-   本地延迟低
    
-   没有网络配置
    
-   开发调试方便
    

**缺点：**

-   只适合本地
    
-   子进程生命周期需要管理
    

---

## 2\. Streamable HTTP

适用于远程 server，是当前官方远程推荐方向。

工作方式：

-   统一 HTTP endpoint
    
-   client 用 POST 发 JSON-RPC
    
-   server 可返回：
    
    -   普通 `application/json`
        
    -   或 `text/event-stream`（SSE）流式返回
        
-   client 也可用 GET 打开 SSE 流，接收 server 主动消息
    

**优点：**

-   更适合远程
    
-   支持多客户端
    
-   支持有状态或无状态模式
    
-   与标准 HTTP 认证体系兼容
    

---

## 3\. 自定义传输（Custom Transport）

官方也允许：

-   WebSocket
    
-   IPC
    
-   特定企业内网协议
    
-   其他双向通信通道
    

但前提是：

-   必须保留 MCP 的 JSON-RPC 消息格式
    
-   必须遵守生命周期要求
    

---

## 4\. 旧的 HTTP+SSE

严格说这已经不是当前标准方案了。

-   它是 **2024-11-05** 时代的旧远程方案
    
-   **已被 Streamable HTTP 取代**
    
-   但出于兼容性，很多 server/client 还会保留支持
    

所以今天看：

-   **本地：stdio**
    
-   **远程：Streamable HTTP**
    
-   **兼容老客户端：可保留旧 SSE**
    
-   **特殊需求：自定义 transport**
    

---

# 7）生产环境下开发 MCP Server 的最佳实践有哪些？

下面这部分最重要。我按“生产环境必须知道”排序。

---

## A. 先把协议边界做对

### 1\. 明确 server 只暴露“窄而清晰”的能力

不要做一个“万能大工具”。

推荐：

-   一个 server 聚焦一类职责
    
-   一个 tool 只做一件事
    
-   参数 schema 明确
    
-   返回结果结构稳定
    

避免：

-   tool 一次做很多副作用操作
    
-   模糊参数
    
-   不可预测输出
    

---

### 2\. 严格做好 capability negotiation

初始化时把能力协商做完整：

-   工具是否支持 listChanged
    
-   是否支持 sampling
    
-   是否支持 notifications
    
-   协议版本是什么
    

不要默认对方“应该支持”。

---

### 3\. 工具 schema 要精确，不要靠提示词猜

Tool 定义尽量：

-   参数类型明确
    
-   required 字段完整
    
-   description 清楚
    
-   尽量避免“自由文本魔法参数”
    

这会直接降低模型误调用率。

---

## B. 传输层和日志处理要专业

### 4\. stdio server 绝对不要往 stdout 打日志

这是官方 build-server 指南专门强调的。

**对 stdio server 来说：**

-   `stdout` 只能写有效 JSON-RPC
    
-   日志写 `stderr`
    
-   或写文件/结构化日志系统
    

否则客户端会把日志当协议消息，直接把连接打坏。

---

### 5\. 远程优先用 Streamable HTTP

如果是新项目：

-   本地优先 stdio
    
-   远程优先 Streamable HTTP
    
-   只有兼容老生态时才额外保留旧 SSE
    

---

### 6\. 明确取消、重试、恢复语义

官方规范强调：

-   **断开连接 ≠ 客户端取消**
    
-   真取消应显式发 `CancelledNotification`
    
-   流式场景可以用 `Last-Event-ID` 做恢复
    

生产上你最好：

-   对长任务支持取消
    
-   对流式结果支持 resume
    
-   对 tool call 做幂等或半幂等设计
    

---

## C. 安全要按“默认不信任”来做

### 7\. 最小权限原则

server 不应该默认能看到：

-   整个文件系统
    
-   全部对话
    
-   所有外部系统
    
-   全部工具权限
    

要做：

-   scope 最小化
    
-   目录边界（roots）
    
-   角色权限
    
-   细粒度授权
    

---

### 8\. Roots 只是“协作边界”，不是安全边界

官方 client concepts 说得很清楚：

-   roots 用来告诉 server “你应该关注哪里”
    
-   但它本身**不构成真正安全隔离**
    
-   真安全要靠 OS 权限、沙箱、容器
    

所以不要以为“给了 roots 就安全了”。

---

### 9\. 远程 server 必须做认证和 Origin 校验

官方 transports 规范对 Streamable HTTP 给了非常明确的提醒：

-   校验 `Origin`，防 DNS rebinding
    
-   本地运行尽量只绑定 `127.0.0.1`
    
-   做 proper authentication
    
-   推荐 OAuth 体系
    

这在生产里是必选项，不是加分项。

---

### 10\. 对危险 tool 必须做审批

如：

-   删文件
    
-   发消息
    
-   下单
    
-   执行 shell
    
-   写数据库
    

要有：

-   approval dialog
    
-   权限配置
    
-   操作审计日志
    

不要让模型“无感知全自动”直接执行高风险动作。

---

## D. 会话和状态管理要靠谱

### 11\. 会话 ID 必须安全、唯一

如果你用 Streamable HTTP 做有状态服务：

-   `Mcp-Session-Id` 必须唯一
    
-   最好使用安全 UUID / JWT / 安全哈希
    
-   失效后对旧 session 返回 404
    
-   client 收到 404 后重建会话
    

---

### 12\. 显式清理不再需要的 session

官方规范建议 client 不再需要 session 时发 HTTP DELETE。

生产上你也应该：

-   设置过期时间
    
-   主动回收 zombie session
    
-   对 session 泄漏做指标监控
    

---

## E. 工程化和可运维性不能省

### 13\. 日志、指标、追踪要全

最少要有：

-   每次 tool call 的 request id / correlation id
    
-   tool 名称、耗时、成功失败
    
-   session 维度指标
    
-   token / cost（如果能统计）
    
-   远程调用下游 API 的 trace
    

否则出问题以后几乎没法排查。

---

### 14\. 做好速率限制和配额

MCP 很容易把“对话式随手调用”变成“高频 API 炸穿”。

建议：

-   per-user 限流
    
-   per-tool 配额
    
-   下游 API 熔断/退避
    
-   成本高的工具加缓存或异步队列
    

---

### 15\. 尽量让 server 保持“可组合”

MCP 官方设计原则里很强调 server 易构建、可组合、相互隔离。

工程上最好做到：

-   server 职责单一
    
-   工具小而稳
    
-   通过多个 server 组合能力
    
-   不让一个 server 包办所有外部世界
    

---

### 16\. 上线前一定用 Inspector / 调试工具测一遍

至少要测：

-   initialize / initialized
    
-   tools/list / resources/list / prompts/list
    
-   schema 是否正确
    
-   错误返回是否规范
    
-   断线 / 超时 / 取消 / session 失效
    
-   不同客户端兼容性
    

---

## 一个“生产级 MCP Server 检查清单”

如果你要上线，我建议最少过这一遍：

- [ ] tools 名称稳定、schema 清晰 <!-- div-format -->

- [ ] stdio 不污染 stdout <!-- div-format -->

- [ ] 远程支持认证与 Origin 校验 <!-- div-format -->

- [ ] 危险操作有人工确认 <!-- div-format -->

- [ ] 支持取消和恢复语义 <!-- div-format -->

- [ ] session 生命周期完整 <!-- div-format -->

- [ ] 结构化日志 + trace + metrics <!-- div-format -->

- [ ] 限流、配额、熔断已配置 <!-- div-format -->

- [ ] roots/沙箱/容器隔离已落实 <!-- div-format -->

- [ ] 已用 Inspector 与至少一个真实 client 验证 <!-- div-format -->

---

# 最后给一个最实用的理解框架

如果你只想记住最核心的：

## MCP 是什么？

**AI 应用和外部工具/数据之间的标准连接协议。**

## 它解决什么问题？

**把 AI 与工具集成从碎片化的一堆私有插件，变成统一标准。**

## 它和 Function Calling 的关系？

**Function Calling 是模型选工具，MCP 是系统接工具。**

## 它和 Agent 的关系？

**Agent 是“会规划和执行的系统”；MCP 是 Agent 接世界的标准接口之一。**

## 它最核心的能力是什么？

**Resources、Tools、Prompts，加上常被并称的 Sampling。**

## 它的标准架构是什么？

**Host / Client / Server + Data Layer / Transport Layer。**

## 它的标准传输是什么？

**stdio + Streamable HTTP。**

## 它为什么不是 REST？

**因为它需要的是会话化、双向、通知式、方法调用式协议，而不是资源 CRUD。**

---

[1] [MCP三种通信机制对比:Stdio、SSE、StreamableHTTP\_java\_桥 啊 a 啊-火山引擎 ADG 社区](https://adg.csdn.net/69523a555b9f5f31781b3d41.html)

[2] [MCP协议演进：从SSE到Streamable HTTP的技术革命-腾讯云开发者社区-腾讯云](https://cloud.tencent.com/developer/article/2556166)

[3] [深度解析 MCP 橋接器：mcp-stdio-to-streamable-http-adapter 全方位指南](https://skywork.ai/skypage/zh-hant/%E6%B7%B1%E5%BA%A6%E8%A7%A3%E6%9E%90-MCP-%E6%A9%8B%E6%8E%A5%E5%99%A8%EF%BC%9Amcp-stdio-to-streamable-http-adapter-%E5%85%A8%E6%96%B9%E4%BD%8D%E6%8C%87%E5%8D%97/1971050517005135872)

[4] [传输方式](https://mcp.fleeto.us/spec/basic/transports/)

[5] [一文读懂MCP协议三大传输模式 (Stdio/SSE/Streamable HTTP)](https://mcp.aibase.cn/server/doc/1919677583198978049)

[6] [SSE与Streamable HTTP：MCP 背后的传输技术](https://www.silenceboy.com/2025/08/27/SSE%E4%B8%8EStreamable-HTTP%EF%BC%9AMCP-%E8%83%8C%E5%90%8E%E7%9A%84%E4%BC%A0%E8%BE%93%E6%8A%80%E6%9C%AF/index.html)

[7] [MCP协议详解](https://xudj.top/archives/mcp-specification)

[8] [MCP协议Streamable HTTP](https://blog.csdn.net/weixin_41161293/article/details/148110015)

[9] [详解 MCP 传输机制](https://m.aitntnews.com/newDetail.html?newId=13081)

[1] [Architecture - Model Context Protocol](https://modelcontextprotocol.io/specification/2025-06-18/architecture)

[2] [MCP （Model Context Protocol）初体验：企业数据与大模型融合初探](https://www.cnblogs.com/CareySon/p/18805011/mcp_for_crm_demo#:~:text=%E7%AE%80%E4%BB%8B%20%E6%A8%A1%E5%9E%8B%E4%B8%8A%E4%B8%8B%E6%96%87%E5%8D%8F%E8%AE%AE%EF%BC%88Model%20Context%20Protocol%EF%BC%8C%E7%AE%80%E7%A7%B0MCP%EF%BC%89%E6%98%AF%E4%B8%80%E7%A7%8D%E5%88%9B%E6%96%B0%E7%9A%84%E5%BC%80%E6%94%BE%E6%A0%87%E5%87%86%E5%8D%8F%E8%AE%AE%EF%BC%8C%E6%97%A8%E5%9C%A8%E8%A7%A3%E5%86%B3%E5%A4%A7%E8%AF%AD%E8%A8%80%E6%A8%A1%E5%9E%8B%EF%BC%88LLM%EF%BC%89%E4%B8%8E%E5%A4%96%E9%83%A8%E6%95%B0%E6%8D%AE%E5%92%8C%E5%B7%A5%E5%85%B7%E4%B9%8B%E9%97%B4%E7%9A%84%E8%BF%9E%E6%8E%A5%E9%97%AE%E9%A2%98%E3%80%82%20%E5%AE%83%E4%B8%BAAI%E5%BA%94%E7%94%A8%E6%8F%90%E4%BE%9B%E4%BA%86%E4%B8%80%E7%A7%8D%E7%BB%9F%E4%B8%80%E3%80%81%E6%A0%87%E5%87%86%E5%8C%96%E7%9A%84%E6%96%B9%E5%BC%8F%E6%9D%A5%E8%AE%BF%E9%97%AE%E5%92%8C%E5%A4%84%E7%90%86%E5%AE%9E%E6%97%B6%E6%95%B0%E6%8D%AE%EF%BC%8C%E4%BD%BF%E6%A8%A1%E5%9E%8B%E4%B8%8D%E5%86%8D%E5%B1%80%E9%99%90%E4%BA%8E%E8%AE%AD%E7%BB%83%E6%97%B6%E8%8E%B7%E5%BE%97%E7%9A%84%E9%9D%99%E6%80%81%E7%9F%A5%E8%AF%86%E3%80%82%20MCP%E7%94%B1Anthropic%E9%A6%96%E6%AC%A1%E6%8F%90%E5%87%BA%E5%B9%B6%E5%BC%80%E6%BA%90%EF%BC%8C%E9%80%9A%E8%BF%87%E5%AE%9A%E4%B9%89%E6%A0%87%E5%87%86%E5%8C%96%E6%8E%A5%E5%8F%A3%EF%BC%8C%E5%85%81%E8%AE%B8%E5%A4%A7%E8%AF%AD%E8%A8%80%E6%A8%A1%E5%9E%8B%E4%BB%A5%E4%B8%80%E8%87%B4%E7%9A%84%E6%96%B9%E5%BC%8F%E4%B8%8E%E5%90%84%E7%B1%BB%E5%A4%96%E9%83%A8%E7%B3%BB%E7%BB%9F%E4%BA%92%E5%8A%A8%EF%BC%8C%E5%8C%85%E6%8B%AC%E6%95%B0%E6%8D%AE%E5%BA%93%E3%80%81API%E5%92%8C%E4%BC%81%E4%B8%9A%E5%86%85%E9%83%A8%E5%B7%A5%E5%85%B7%E7%AD%89%E3%80%82%20%E8%BF%99%E4%B8%80%E5%8D%8F%E8%AE%AE%E7%9A%84%E6%A0%B8%E5%BF%83%E4%BB%B7%E5%80%BC%E5%9C%A8%E4%BA%8E%E6%89%93%E7%A0%B4%E4%BA%86AI%E6%A8%A1%E5%9E%8B%E7%9A%84%22%E4%BF%A1%E6%81%AF%E5%AD%A4%E5%B2%9B%22%E9%99%90%E5%88%B6%EF%BC%8C%E6%9E%81%E5%A4%A7%E6%89%A9%E5%B1%95%E4%BA%86%E5%A4%A7%E6%A8%A1%E5%9E%8B%E7%9A%84%E5%BA%94%E7%94%A8%E5%9C%BA%E6%99%AF%E3%80%82%20%E8%BF%91%E6%97%A5%EF%BC%8COpenAI%E4%BA%8E2025%E5%B9%B43%E6%9C%8827%E6%97%A5%E5%AE%A3)

[3] [深入解读MCP（模型上下文协议）：AI时代的连接基石\_人工智能\_qq\_17153885-火山引擎 ADG 社区](https://adg.csdn.net/696f4fea437a6b403369fbe1.html)

[4] [与知识库对话 - 介绍MCP的文件有哪些 - WayToAGI](https://www.waytoagi.com/question/95854)

[1] [Understanding Model Context Protocol (MCP): Beyond the Hype](https://medium.com/@rajkundalia/understanding-model-context-protocol-mcp-beyond-the-hype-582ae84d459d)

[2] [Model Context Protocol (MCP)](https://medium.com/@aserdargun/model-context-protocol-mcp-e453b47cf254)

[3] [Model Context Protocol (MCP): A Standard for Connecting LLMs to Business Context](https://medium.com/@dperez_/model-context-protocol-mcp-a-standard-for-connecting-llms-to-business-contexts-df38274b5651)

[4] [Gen AI: Model Context Protocol Overview and internals](https://anjireddy-kata.medium.com/gen-ai-model-context-protocol-overview-and-internals-265f1df592b0)

[5] [MCP: What is the Model Context Protocol?](https://medium.com/@1kg/mcp-what-is-the-model-context-protocol-c90c6bcf4f46)

[1] [https://pretalx.coscup.org/coscup-2025/schedule/](https://pretalx.coscup.org/coscup-2025/schedule/)

[2] [GXMZU/llm-rag-agent-blogs · Datasets at Hugging Face](https://huggingface.co/datasets/GXMZU/llm-rag-agent-blogs/viewer/default/agent?p=2)

[3] [chenyukang.github.io/content.json at master · chenyukang/chenyukang.github.io](https://github.com/chenyukang/chenyukang.github.io/blob/master/content.json)

[4] [Andrew's Blog](https://seii-saintway.github.io/)

[5] [2020ASPENCORE全球双峰会-全球电子成就奖](https://doublesummits.eet-china.com/review/2020/electronic.html)

[6] [2019年6月24日 随笔档案 - paulwong - 语源科技BlogJava](http://www.blogjava.net/paulwong/archive/2019/06/24.html)

[1] [Semrush-MCP 服务器：面向 AI 工程师的深度解析](https://skywork.ai/skypage/zh/Semrush-MCP-%E6%9C%8D%E5%8A%A1%E5%99%A8%EF%BC%9A%E9%9D%A2%E5%90%91-AI-%E5%B7%A5%E7%A8%8B%E5%B8%88%E7%9A%84%E6%B7%B1%E5%BA%A6%E8%A7%A3%E6%9E%90/1971477242467184640)

[2] [ANP - Agent Network Protocol](https://agent-network-protocol.com/zh/blogs/posts/mcp-10-questions.html)