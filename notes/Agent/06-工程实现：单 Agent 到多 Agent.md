# 工程实现：单 Agent 到多 Agent

## 本章目标

-   给出一条从最小可行 Agent 到生产系统的实现路径。
    
-   理解 OpenAI Agents SDK、LangGraph、MCP 各自解决什么问题。
    
-   明确何时应该从单 Agent 演进到多 Agent。
    

## 核心问题

-   最小可用 Agent 应该怎么搭？
    
-   从 demo 到生产，最容易缺什么？
    
-   多 Agent 拆分的标准到底是什么？
    

## 正文

### 1\. 一个最小可行 Agent 的组成

如果你从零实现一个任务型 Agent，建议至少先具备这 8 个模块：

1.  `agent definition`：模型、instructions、tools、output schema
    
2.  `runner`：负责 loop、退出条件、错误处理
    
3.  `tool registry`：注册工具及参数 schema
    
4.  `state store`：保存显式状态和会话历史
    
5.  `guardrails`：输入输出校验、审批、权限控制
    
6.  `observability`：日志、trace、usage、tool 调用记录
    
7.  `eval harness`：固定样本、回放、评分
    
8.  `recovery`：中断恢复、重试、幂等
    

如果缺少后四个，大概率还停留在 demo 阶段。

### 2\. 先用单 Agent 打通“完整闭环”

所谓完整闭环，是指系统不只是能输出答案，而是能完成以下过程：

-   接收任务
    
-   判断是否要调用工具
    
-   调工具并消费结果
    
-   维护状态
    
-   满足退出条件
    
-   记录 trace 和指标
    

OpenAI 的公开指南明确建议“先把单 Agent 做强，再拆多 Agent”。原因很简单：你连单 Agent 的评测和恢复都没跑通，多 Agent 只会把问题成倍放大。

### 3\. 一个单 Agent 的实现骨架

```python
from agents import Agent, Runner, function_tool

@function_tool
def search_docs(query: str) -> str:
    ...

@function_tool
def create_ticket(title: str, body: str) -> str:
    ...

support_agent = Agent(
    name="SupportAgent",
    instructions="""
    你负责处理支持请求。
    先判断是否需要查资料。
    若问题超出权限，不要直接执行高风险动作。
    需要创建工单时，先确认信息完整。
    """,
    tools=[search_docs, create_ticket],
)

result = Runner.run_sync(support_agent, "客户反馈支付失败，请帮我定位问题并给出处理建议。")
print(result.final_output)
```

这个例子离生产还很远，但已经具备：

-   工具
    
-   指令
    
-   运行器
    
-   明确任务目标
    

### 4\. OpenAI Agents SDK 解决什么问题

截至 2026-03-25 可访问的文档，OpenAI Agents SDK 的关键原语非常少：

-   Agents
    
-   Agents as tools / Handoffs
    
-   Guardrails
    

此外还提供：

-   内建 agent loop
    
-   sessions 持久记忆
    
-   tracing
    
-   MCP server tool calling
    
-   human in the loop
    

它比较适合：

-   希望快速搭建 Python-first Agent
    
-   不想自己实现底层 loop、session、tracing
    
-   单 Agent 到中等复杂多 Agent 编排
    

### 5\. LangGraph 解决什么问题

LangGraph 更偏底层 orchestration runtime。官方文档强调的关键词是：

-   durable execution
    
-   stateful workflow
    
-   human-in-the-loop
    
-   comprehensive memory
    
-   production-ready deployment
    

如果你的系统更像：

-   长时运行任务
    
-   明确图结构
    
-   需要 checkpoint 和恢复
    
-   需要中断审批后继续
    

那么 LangGraph 这类 runtime 的价值会很高。

### 6\. MCP 解决什么问题

MCP 的定位不是“又一个 Agent 框架”，而是标准化工具和上下文接入。官方介绍把它定义为连接 AI 应用与外部系统的开放标准，能连接数据源、工具和工作流。

它给工程落地带来的价值主要有三点：

-   降低接工具的重复开发成本
    
-   让工具、资源、提示以标准协议暴露
    
-   让 Agent 平台和外部系统之间形成更统一的接口层
    

所以：

-   Agent SDK / LangGraph 更像运行时或编排层
    
-   MCP 更像能力接入层
    

### 7\. 从单 Agent 到多 Agent 的拆分标准

建议用下面四个问题判断：

#### 7.1 任务边界是否天然分域？

例如：

-   路由 Agent
    
-   检索/研究 Agent
    
-   执行 Agent
    
-   评审 Agent
    

如果天然职责不同，拆分有价值。

#### 7.2 单 Agent 是否已出现 prompt 过载？

典型症状：

-   instructions 过长
    
-   条件分支太多
    
-   频繁选错工具
    
-   小改一条规则就引发整体回归
    

#### 7.3 子任务是否需要不同权限和风险级别？

例如：

-   研究 Agent 只读
    
-   操作 Agent 可写
    
-   审批 Agent 仅负责确认
    

这种情况下，拆分不仅是可维护性问题，也是安全边界问题。

#### 7.4 子任务是否能独立评测？

如果你拆出来的 Agent 无法单独测，说明边界可能还不清。

### 8\. 多 Agent 三种常见落地方式

#### 8.1 Triage + Specialist

先路由，再由专业 Agent 接手。

适合：

-   客服
    
-   IT 支持
    
-   多业务域问答
    

#### 8.2 Manager + Workers

manager 负责拆任务、汇总结果，worker 负责局部执行。

适合：

-   报告生成
    
-   多来源研究
    
-   多模块代码修改
    

#### 8.3 Executor + Reviewer

一个产出，另一个审查。

适合：

-   代码修复
    
-   合同分析
    
-   高质量内容生成
    

### 9\. 生产化清单

真正上线前，建议至少完成这份检查：

| 维度  | 需要回答的问题 |
| --- | --- |
| 状态  | 如何恢复中断 run？ |
| 工具  | 哪些工具只读，哪些可写，哪些必须审批？ |
| 幂等  | 重试会不会重复创建副作用？ |
| 观测  | 能不能看见每一步 trace、工具参数、耗时和成本？ |
| 评测  | 有没有固定样本和回归集？ |
| 安全  | prompt injection、越权调用、敏感数据泄漏怎么防？ |
| 成本  | 最大轮数、最大工具调用次数、预算上限是多少？ |

### 10\. Durable execution 的工程要点

LangGraph 文档明确提醒：如果要做可恢复执行，要把非确定性操作和有副作用的操作包装在任务或节点里，并尽量做到幂等。这个原则非常重要，因为 Agent 一旦恢复执行，可能会“从某个检查点重放”，不是简单从中断行继续。

这意味着：

-   写数据库、发消息、下工单最好有 idempotency key
    
-   多个副作用不要混在一个不可分割的大步骤里
    
-   状态保存要早于高风险写操作，或至少有清晰补偿逻辑
    

## 工程细节与取舍

### 1\. 先追求闭环，再追求自治

如果系统还没有稳定的 trace、state、retry、eval，就不要急着扩大 Agent 自主空间。

### 2\. 多 Agent 主要解决复杂度，不保证智能度线性提升

它更像软件工程里的模块化，而不是“多个人脑一起更聪明”的自然比喻。

### 3\. 工具和 Agent 都应该可单测

理想状态是：

-   工具可脱离模型单测
    
-   Agent 可通过固定输入回放测
    
-   多 Agent 流程可做集成测试
    

## 常见误区

### 误区 1：框架选对了就能上线

不对。框架能帮你解决编排问题，但解决不了业务边界、权限设计、样本评测、回滚策略。

### 误区 2：demo 成功率高，就说明系统稳定

不对。demo 往往缺少长尾输入、脏数据、超时、权限拒绝、工具异常、人工审批这些真实噪声。

### 误区 3：MCP 能代替运行时

不对。MCP 解决的是标准接入，不是完整 loop、状态管理和评测。

## 面试与实战问答

### 问：如何从零实现一个最小 Agent？

短答： 先做单 Agent，提供清晰 instructions、少量高质量 tools、显式 state、退出条件和基本 trace。

深答： 最小可行不等于只写 prompt。至少要有工具 schema、运行循环、错误处理和观测，否则只是演示用脚本。

### 问：什么时候该拆多 Agent？

短答： 单 Agent 出现 prompt 过载、工具过载、权限边界冲突、天然分域时。

深答： 拆分的目标是职责隔离和治理清晰，而不是为了追赶概念。

### 问：为什么 durable execution 很重要？

短答： 因为 Agent 任务经常是长时、多步、有副作用的，失败后必须能恢复。

深答： 一旦系统涉及外部 API、人工审批和长时等待，就需要 checkpoint、幂等和重放设计。