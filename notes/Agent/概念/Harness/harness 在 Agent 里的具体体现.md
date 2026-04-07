# **harness 在 Agent 里的具体体现**

> **在实际产品/框架里，harness 很少以一个单独模块显式出现，更常以“工具封装 + 运行时控制 + 观测调试 + 评测回放 + 安全治理”的组合形态存在。**<br>框架越偏研究/原型，harness 越轻；产品越偏生产落地，harness 越重。

---

# 一、先建立一个统一分析框架：怎么看“某个 Agent 产品里的 harness”

判断一个系统是否具备成熟 harness，通常看 6 个维度：

## 1\. Tool Harness

是否有统一工具接口、参数约束、错误处理、权限边界。

## 2\. Runtime Harness

是否能控制执行循环、步数、预算、超时、重试、中断、恢复。

## 3\. Observability Harness

是否能看到 trace、prompt、工具调用、状态变化、失败原因、成本延迟。

## 4\. Eval Harness

是否支持回放、基准测试、版本比较、自动评分、回归测试。

## 5\. Safety/Governance Harness

是否有审批、沙箱、ACL、内容安全、动作拦截、审计日志。

## 6\. Environment Harness

是否能把 Agent 放进一个“可操作世界”中，比如代码仓库、浏览器、数据库、企业系统。

你可以把任何 Agent 框架/产品，都用这 6 个维度去拆。

---

# 二、LangChain / LangGraph：harness 体现为“可编排的运行支架 + 观测/回放生态”

LangChain 早期给人的印象主要是“链式调用框架”，但如果从 Agent 角度看，它的重要意义之一就是：<br>**它在 Python/JS 应用层提供了一个很强的 harness 雏形。**

---

## 1\. 在 LangChain 里，harness 最先体现在哪里

### （1）工具标准化

LangChain 很早就强调 tools 抽象：

-   每个工具有名字、描述、输入 schema
    
-   Agent 通过统一方式决定是否调用工具
    
-   工具返回 observation，再进入下一轮推理
    

这本质上就是一种 **tool harness**。<br>它解决的不是“模型会不会思考”，而是“模型如何以统一格式接入外部能力”。

### （2）Prompt + Memory + Tool + Output Parser 的组合

LangChain 把 Agent 不再看成单次 LLM 调用，而是多个可组合部件。<br>这种模块化，本身就是 harness 的前提，因为你只有把系统拆成组件，才能做：

-   插桩
    
-   替换
    
-   调试
    
-   对比试验
    
-   回归测试
    

---

## 2\. LangGraph 更像显式的 Agent harness

LangGraph 把很多原本“隐式循环”的 Agent 过程，变成图式状态机：

-   节点：模型调用、工具调用、判定逻辑
    
-   边：状态流转
    
-   状态：共享上下文、步骤结果、中间变量
    

这非常接近一个真正的 harness/runtime。

### 它体现 harness 的核心点：

#### （1）显式状态管理

传统 Agent 最难的是“跑到第几步了，现在上下文是什么”。<br>LangGraph 的 state graph 直接把这一层工程化了。

#### （2）可中断、可恢复

这对于长任务、多步任务、人类审批节点很关键。<br>一旦支持 checkpoint/resume，系统就明显进入 harness 范畴，而不只是“prompt chaining”。

#### （3）更适合加入人类节点

比如：

-   模型先规划
    
-   人工审核规划
    
-   再继续执行
    

这类 HITL（human-in-the-loop）机制，本质是 harness 功能，不是 Agent 智能本体。

---

## 3\. LangSmith：LangChain 生态里最像“harness 平台”的部分

如果说 LangChain/LangGraph 偏代码执行层，**LangSmith 更接近完整 harness 平台**。

它的价值主要在：

-   trace 可视化
    
-   prompt/version 管理
    
-   数据集管理
    
-   在线/离线评估
    
-   对比实验
    
-   回放分析
    
-   失败样本分析
    

这基本上就是 **observability harness + eval harness**。

### 一个典型使用方式

团队做客服 Agent，改了检索策略后，想知道效果有没有提升。<br>在 LangSmith 里可以：

-   看单条 trace
    
-   对比两个版本输出
    
-   在固定数据集上批量回放
    
-   统计成功率变化
    
-   看失败是不是集中在某类问题
    

这就是 harness 的核心价值：<br>**把 Agent 调优从“感觉”变成“证据驱动”。**

---

## 4\. LangChain/LangGraph 的局限

虽然它很接近 harness，但它不是完整企业级 harness，原因在于：

-   安全治理通常要你自己补
    
-   企业权限与审计要外接
    
-   真正高风险动作的审批机制不算内建完整
    
-   对复杂多租户生产治理支持有限
    
-   它更像“可开发 Agent harness 的框架”，不是“开箱即用的全栈治理平台”
    

### 结论

**LangChain/LangGraph 的 harness 体现最强在：可编排、可追踪、可测试。**<br>它特别适合研发团队搭建自己的 Agent 工程底座。

---

# 三、OpenAI Agents / Responses API / Tools：harness 体现为“模型原生工具调用 + 受控运行循环”

OpenAI 这一类产品/接口的特点是：<br>**把一部分 harness 能力下沉到模型接口层。**

这和 LangChain 这类应用框架的思路不完全一样。

---

## 1\. 最核心的 harness 体现：工具调用协议标准化

OpenAI 的 function calling / tool calling，本质上是给 Agent 运行建立统一协议：

-   模型决定调用哪个工具
    
-   按 schema 生成参数
    
-   外部执行工具
    
-   把结果返回给模型继续推理
    

这是非常强的 **tool harness 标准层**。

它的重要性在于：

-   降低“让模型稳定调用工具”的工程成本
    
-   强化参数结构化
    
-   减少 prompt-based tool use 的脆弱性
    
-   让工具执行更可控、更易验证
    

### 本质变化

以前很多 Agent 是靠 prompt 让模型“输出某种工具调用格式”；<br>现在是 API 层把这一能力做成原生协议。<br>这其实是在把 harness 的一部分“平台化”。

---

## 2\. Responses/Agents 风格接口体现了轻量 runtime harness

这类接口通常不只是返回文本，而是围绕“任务执行过程”组织交互。<br>其 harness 价值体现在：

-   多轮工具调用更自然
    
-   中间过程可结构化表示
    
-   容易记录 action / observation
    
-   易于插入控制逻辑
    

也就是说，它让开发者不必从零写一个 Agent loop。<br>这不是完整 orchestration，但确实是一种“下沉式 runtime harness”。

---

## 3\. OpenAI 生态里的 harness 优势

### （1）协议统一

工具调用、结构化输出、模型能力整合得比较紧。

### （2）开发复杂度低

你不用自己做太多中间 glue code，就能搭出可工作的工具型 Agent。

### （3）更适合构建“受控 Agent”

因为模型和工具交互的格式更规范，便于做：

-   参数校验
    
-   安全审查
    
-   结果记录
    
-   失败恢复
    

---

## 4\. OpenAI 方案里的 harness 不足

### （1）生产治理并不自动完整

虽然协议统一，但下面这些还得你自己做：

-   审批流
    
-   企业权限控制
    
-   复杂回放评测
    
-   多 Agent 协作治理
    
-   全面的动作审计
    

### （2）observability 依赖外围系统

真正可用于企业优化的 trace、eval、版本治理，通常还得依赖你自己的平台或第三方。

### （3）复杂业务逻辑仍需外层 harness

一旦涉及：

-   多系统联动
    
-   长流程中断恢复
    
-   人工审批
    
-   预算调度
    
-   SLA 控制
    

还是要在 API 外层搭建自己的 harness。

### 结论

**OpenAI Agents/Tools 更像“把 harness 的底层协议层标准化了”，而不是替你完成整个 harness。**<br>它对行业最大的影响是：降低了 Agent harness 的入口门槛。

---

# 四、AutoGen：harness 体现为“多 Agent 会话操作台”

AutoGen 的代表性很强，因为它把“多 Agent 对话协作”做成了主范式。<br>如果说 LangChain 强在编排，OpenAI 强在协议，那么 **AutoGen 强在多 Agent interaction harness**。

---

## 1\. AutoGen 的核心思想本身就偏 harness

AutoGen 不是单纯定义一个 Agent，而是定义：

-   不同角色的 agent
    
-   他们如何互相发消息
    
-   什么时候调用工具/代码
    
-   什么时候终止任务
    

这意味着它天然就带有 harness 属性，因为多 Agent 系统如果没有 harness，几乎不可控。

---

## 2\. AutoGen 中 harness 的几种体现

### （1）角色化封装

常见角色：

-   user proxy
    
-   assistant
    
-   planner
    
-   coder
    
-   critic
    
-   executor
    

这种角色划分，其实是在做“行为约束”。<br>它不是直接让一个万能 Agent 自由发挥，而是把复杂任务拆到多个受控角色中。<br>这是一种 **结构化 harness 思路**。

### （2）会话循环控制

AutoGen 的很多能力都建立在：

-   谁先说
    
-   谁回应谁
    
-   对话何时停止
    
-   工具在哪个节点调用
    

这些规则上。<br>这其实就是 runtime harness，只不过表现成了“多智能体对话管理”。

### （3）代码执行/工具调用封装

AutoGen 常和代码执行环境联动。<br>这就形成了 environment harness：

-   模型提代码
    
-   执行器跑代码
    
-   返回 stdout/stderr
    
-   Agent 再修复
    

这在 coding/data-analysis 任务里非常典型。

---

## 3\. AutoGen 的优势

### （1）特别适合研究和原型验证

因为多角色协作非常容易表达复杂流程：

-   planner 先分解任务
    
-   researcher 查资料
    
-   coder 写脚本
    
-   reviewer 挑错
    
-   executor 执行
    

### （2）非常适合展示“过程”

对于 Agent 研究者来说，多 Agent 交互本身就是一种可解释中间层。

### （3）有利于引入自反思/批评机制

比如 critic agent、judge agent，本质上就是把 eval harness 的一部分内嵌到执行过程中。

---

## 4\. AutoGen 的问题：容易“会话化过度”

这是很多多 Agent 框架的共性问题。

### 问题 1：多 Agent 不等于生产 harness

很多事情表面上用了多个 agent，但实质上：

-   成本更高
    
-   延迟更大
    
-   调试更复杂
    
-   失败路径更长
    

### 问题 2：对话流不等于严谨控制流

如果系统核心仍然只是“大家互发消息”，那在生产场景中会遇到：

-   边界条件难控
    
-   终止条件不稳
    
-   状态漂移
    
-   责任归因困难
    

### 问题 3：治理能力不足

企业真正关心的：

-   ACL
    
-   审批流
    
-   审计
    
-   回放测试
    
-   多租户隔离
    

往往并不是 AutoGen 的强项。

### 结论

**AutoGen 把 harness 强烈体现为“多 Agent 会话控制与任务分工结构”，非常适合复杂协作原型，但离强生产级治理型 harness 还需要外层系统补全。**

---

# 五、Cursor / Coding Agent：harness 最成熟的商业体现之一

如果你想看“harness 在真实高价值场景里的最典型落地”，**Coding Agent 产品其实是非常好的观察对象**。<br>Cursor、Copilot Workspace 类、以及各种 autonomous coding agent，很多成功恰恰不只靠模型，而靠 harness。

---

## 1\. 为什么 Coding Agent 特别依赖 harness

因为写代码不是“回答一段文本”就结束了，它通常要：

-   理解代码库
    
-   检索文件
    
-   编辑多个文件
    
-   运行测试
    
-   读取报错
    
-   修复问题
    
-   生成 diff
    
-   让用户确认
    
-   提交版本控制
    

你会发现，这就是一个完整的受控环境任务。<br>所以 coding agent 的竞争力，很大程度上取决于 harness 质量。

---

## 2\. Cursor 类产品里的 harness 具体体现

## （1）代码库环境接入：Environment Harness

Cursor 的真正壁垒之一不是“它能对话”，而是它深度接入了代码环境：

-   项目文件树
    
-   当前打开文件
    
-   选中代码片段
    
-   搜索索引
    
-   代码语义理解
    
-   Git 状态
    

这使 Agent 不再面对抽象文本，而是面对可操作的“工程世界”。

### 这意味着什么？

Agent 的上下文不是靠用户粘贴，而是 harness 自动组织的。<br>这大幅提高了有效性。

---

## （2）编辑控制：Action Harness

Coding Agent 不只是生成代码，还要“改代码”。<br>因此必须有动作层 harness：

-   哪些文件可修改
    
-   改了哪些行
    
-   以 diff 呈现
    
-   用户是否确认接受
    
-   如何撤销
    
-   是否分步应用
    

这其实是一种非常成熟的高风险动作治理模型。<br>相比“直接让 Agent 输出整段代码”，这种 harness 更适合真实开发。

---

## （3）测试与执行循环：Execution Harness

好的 coding agent 不只是写，还会：

-   运行单测
    
-   运行 lint
    
-   读取编译错误
    
-   根据报错继续修复
    

这个循环特别像“受控自治”：

1.  Agent 提出修改
    
2.  系统执行
    
3.  收集反馈
    
4.  Agent 再决策
    

这里的关键不是模型会写代码，而是 harness 能把**代码、测试器、终端、错误信息**连接成闭环。

---

## （4）可视化与可审核：Observability Harness

Cursor 类产品通常强调：

-   改了哪些文件
    
-   为什么这样改
    
-   当前任务进度
    
-   上下文来源
    
-   终端执行了什么
    

这就是 observability，只是面向开发者体验做了产品化包装。

---

## （5）安全边界：Governance Harness

在 coding agent 中，安全问题非常真实：

-   不能随便执行危险命令
    
-   不能在未确认时大规模改文件
    
-   不能无约束访问系统资源
    
-   不能无审计地提交代码
    

所以很多 coding agent 会加入：

-   命令确认
    
-   沙箱执行
    
-   patch review
    
-   restricted terminal
    
-   scoped permissions
    

### 本质上

这就是企业 Agent 治理在开发场景里的一个高度成功实例。

---

## 3\. 为什么说 Coding Agent 的 harness 最成熟

因为代码任务天然有“可验证反馈”：

-   能否编译
    
-   测试是否通过
    
-   diff 是否合理
    
-   语法是否正确
    

所以 coding 场景比很多开放任务更容易构建高质量 harness。<br>这也是为什么 coding agent 往往是 Agent 产品化最快的一类。

### 结论

**Cursor/Coding Agent 的核心竞争力，往往是 harness 优于纯模型能力：更好的仓库感知、更好的编辑控制、更好的执行反馈闭环、更好的审计与回滚。**

---

# 六、Browser Agent：harness 体现为“可感知、可回放、可纠错的网页操作环境”

Browser Agent 是另一个非常能体现 harness 价值的方向。<br>比如自动操作网页、填表、检索、点击、导航、下单、抓取信息等。

这类 Agent 的难点不只是“理解网页”，而是**在动态 UI 环境里可靠行动**。<br>所以 harness 比模型本身更关键。

---

## 1\. Browser Agent 的环境天然需要 harness

网页是高度动态的环境：

-   DOM 会变化
    
-   按钮位置会变
    
-   元素可能加载失败
    
-   登录状态会过期
    
-   页面跳转不可预测
    
-   同一步操作在不同页面结果不同
    

所以 Browser Agent 如果没有强 harness，基本不可能稳定。

---

## 2\. Browser Agent 的 harness 体现在哪里

## （1）页面状态抽象：Perception Harness

模型本身不能直接可靠理解整个浏览器状态，所以 harness 需要把页面转成适合推理的中间表示，比如：

-   DOM 树摘要
    
-   可交互元素列表
    
-   屏幕截图
    
-   accessibility tree
    
-   当前 URL / 标题 / 表单状态
    

这是非常典型的环境适配 harness。<br>它决定了 Agent“看见什么世界”。

---

## （2）动作执行层：Action Harness

Browser Agent 常见动作：

-   click
    
-   type
    
-   scroll
    
-   select
    
-   go\_back
    
-   wait
    
-   extract
    

这些动作必须被包装成标准原语。<br>否则模型只能输出自然语言，根本无法稳定操作浏览器。

### 这层 harness 负责：

-   参数校验
    
-   元素定位
    
-   执行确认
    
-   失败重试
    
-   超时控制
    
-   页面变化检测
    

---

## （3）错误恢复与重试：Runtime Harness

网页操作极容易失败。<br>好的 browser harness 必须支持：

-   点击后没响应怎么办
    
-   元素不存在怎么办
    
-   登录失效怎么办
    
-   页面加载慢怎么办
    
-   弹窗遮挡怎么办
    

这部分本质上是在替 Agent 提供“抗脆弱操作系统”。

---

## （4）回放与审计：Observability Harness

Browser Agent 的一个关键需求是“可回放”。<br>因为用户需要知道：

-   它点了哪里
    
-   什么时候填了什么
    
-   为什么失败
    
-   哪一步偏航了
    

所以很多浏览器 Agent 系统会特别强调：

-   step trace
    
-   screenshot sequence
    
-   action log
    
-   DOM snapshot
    
-   video replay
    

这类观测能力，其实是 harness 的核心卖点。

---

## （5）安全控制：Governance Harness

Browser Agent 常涉及高风险操作：

-   提交表单
    
-   付款
    
-   发送消息
    
-   修改设置
    
-   访问私人数据
    

所以必须加入：

-   高风险动作确认
    
-   凭证隔离
    
-   操作白名单
    
-   只读模式
    
-   隐私脱敏
    
-   人工接管
    

### 结论

**Browser Agent 是否可商用，核心取决于它的 harness 是否足够强，尤其是状态抽象、动作原语、错误恢复、回放审计和安全确认。**

---

# 七、把这几类放在一起比较：harness 是怎么“以不同方式出现”的

下面是一个更本质的归纳。

## 1\. LangChain / LangGraph

### harness 重点：

-   编排
    
-   状态流
    
-   trace
    
-   eval 接入
    

### 本质定位：

**开发框架型 harness**

适合你自己搭系统，灵活，但很多企业治理要自己补。

---

## 2\. OpenAI Agents / Tools

### harness 重点：

-   工具调用协议标准化
    
-   模型原生结构化交互
    
-   轻量执行循环
    

### 本质定位：

**协议下沉型 harness**

降低入门门槛，但完整生产级能力仍需外围平台。

---

## 3\. AutoGen

### harness 重点：

-   多 Agent 角色交互
    
-   会话驱动协作
    
-   代码/工具反馈循环
    

### 本质定位：

**多智能体交互型 harness**

适合研究和复杂协作原型，但生产治理不算强项。

---

## 4\. Cursor / Coding Agent

### harness 重点：

-   代码环境接入
    
-   文件编辑控制
    
-   测试闭环
    
-   diff 审核
    
-   命令约束
    

### 本质定位：

**高价值垂直任务型 harness**

这是目前最接近“可持续商用 Agent harness”成功范式的方向之一。

---

## 5\. Browser Agent

### harness 重点：

-   页面状态建模
    
-   UI 动作原语
    
-   错误恢复
    
-   回放审计
    
-   高风险动作确认
    

### 本质定位：

**动态环境操作型 harness**

是否能规模化落地，几乎完全看 harness 强度。

---

# 八、从行业发展看：harness 正在从“附属工程”变成“主战场”

这是最重要的行业判断。

过去很多人觉得 Agent 的核心竞争力主要在：

-   更强模型
    
-   更好 prompt
    
-   更多工具
    

但实践越来越表明，真正拉开差距的往往是 harness：

-   谁能更好理解环境
    
-   谁能更好控制动作
    
-   谁能更好记录过程
    
-   谁能更好回放失败
    
-   谁能更好接入人类审核
    
-   谁能更好建立优化闭环
    

换句话说：

> **模型能力决定上限，harness 能力决定可用性、稳定性和商业化深度。**

---

# 九、一个更现实的行业分层：谁在做“轻 harness”，谁在做“重 harness”

## 1\. 轻 harness 玩家

特点：

-   快速原型
    
-   通用 Agent demo
    
-   偏研究和实验
    
-   工具接入有限
    
-   治理较弱
    

代表倾向：

-   早期多 Agent demo
    
-   简化版开源 Agent 框架
    
-   一些只强调 prompt/tool calling 的方案
    

---

## 2\. 重 harness 玩家

特点：

-   深度环境接入
    
-   高观测能力
    
-   审核/回滚/权限控制
    
-   评测闭环
    
-   任务结果可验证
    

代表倾向：

-   Coding agent
    
-   企业 workflow agent
    
-   Browser automation agent
    
-   垂直业务 agent 平台
    

### 行业趋势

**越接近真实业务执行，harness 越重。**

---

# 十、如果你要判断一个 Agent 产品“有没有未来”，重点看哪些 harness 信号

这是很实用的判断框架。

## 看点 1：是不是只会聊天，还是能在受控环境里稳定行动

如果只是对话增强，壁垒往往有限。<br>如果能在代码库、浏览器、CRM、数据库中稳定行动，说明 harness 更扎实。

## 看点 2：有没有可视化 trace 和失败诊断能力

没有 trace 的 Agent 产品，很难持续优化。

## 看点 3：有没有明确的权限和审核机制

没有治理层的 Agent 很难进入企业核心流程。

## 看点 4：有没有回放、评测、版本比较

这决定它能不能真正工程化迭代。

## 看点 5：环境建模是否足够深

好的 harness 不是“给模型更多文本”，而是“给模型一个可操作且抽象得当的世界”。

---

# 十一、一个本质结论：这些产品/框架到底在争什么

如果把 LangChain、OpenAI Agents、AutoGen、Cursor、Browser Agent 放在一张图里看，你会发现他们并不只是在争“谁的 Agent 更聪明”，更是在争：

-   **谁定义工具调用标准**
    
-   **谁掌控 Agent 运行时**
    
-   **谁掌握 trace / eval / replay**
    
-   **谁最深地接入真实环境**
    
-   **谁建立起动作安全与治理层**
    
-   **谁沉淀最多真实交互数据**
    

这些，基本都属于 harness 的范畴。

所以从行业视角看，**harness 不是边角料，而是 Agent 平台竞争的核心基础设施层**。

---

# 十二、最后给一个高度浓缩的总结

## 一句话总结

在 LangChain、OpenAI Agents、AutoGen、Cursor/Coding Agent、Browser Agent 这些实践里，**harness 不是单独叫这个名字的功能，而是以“工具协议、执行控制、环境接入、过程观测、评测回放、安全治理”的组合方式存在**。

## 更进一步的判断

-   **LangChain/LangGraph**：偏开发与编排型 harness
    
-   **OpenAI Agents**：偏协议标准化型 harness
    
-   **AutoGen**：偏多 Agent 交互型 harness
    
-   **Cursor/Coding Agent**：偏垂直生产级执行 harness
    
-   **Browser Agent**：偏动态环境操作 harness
    

## 最关键的行业结论

**未来 Agent 的竞争，不只是模型竞争，更是 harness 竞争。**<br>谁先把 harness 做深，谁就更有机会把 Agent 从“能演示”变成“能交付业务价值”。

---

如果你愿意，我下一步可以继续往两个方向深入其中一个：

1.  **技术架构视角**：我给你画一个“生产级 Agent Harness 参考架构”，把工具层、runtime、memory、observability、eval、safety 怎么拼起来讲清楚
    
2.  **投资/产品视角**：我从商业竞争和产品壁垒角度分析，为什么 Cursor、Devin、Browser Use、企业 Agent 平台的护城河本质都在 harness 上