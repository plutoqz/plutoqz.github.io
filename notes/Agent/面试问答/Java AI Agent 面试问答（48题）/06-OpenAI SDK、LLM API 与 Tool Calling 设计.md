# OpenAI SDK、LLM API 与 Tool Calling 设计

## 本章目标

- 从 SDK 设计、接口抽象和 Tool Calling 三个层面，讲清楚 Java 调用 LLM API 的工程方法。
- 回答“直接调官方 SDK 就够了吗”“平台层 API 应该长什么样”。

## 关键问题

- Java 调 OpenAI API 时，SDK 应该封装到什么程度？
- LLM API 为什么不能只暴露一个 `chat(String prompt)`？
- Tool Calling 和普通函数调用的边界在哪里？

## Q14：Java 调用 OpenAI API 如何设计 SDK？

### 一句话回答

设计 Java OpenAI SDK 时，应该把“供应商协议细节”封装在底层，把“业务可用的同步、流式、结构化、工具、重试和观测能力”暴露在上层。

### 详细展开

一个比较稳的 SDK 分层通常是：

1. `Provider Client`：直接对接 OpenAI 官方 SDK 或 HTTP API。
2. `Domain Abstraction`：统一请求、响应、错误、流事件、工具定义。
3. `Facade / Service`：给业务方提供易用接口。

推荐抽象：

```java
public interface LlmClient {
    ChatResult chat(ChatRequest request);
    void stream(ChatRequest request, StreamObserver observer);
    EmbeddingResult embed(EmbeddingRequest request);
}
```

如果你只是做最小可运行封装，官方 Java SDK 的起点通常长这样：

```java
OpenAIClient client = OpenAIOkHttpClient.builder()
        .fromEnv()
        .build();
```

`ChatRequest` 至少应包含：

- model
- messages
- temperature
- maxTokens
- responseFormat
- tools
- metadata
- timeout

官方 `openai-java` README 显示，截至 `2026-03-29`：

- 可通过 `OpenAIOkHttpClient.builder().fromEnv()` 构建 client
- 支持 `withOptions()` 派生临时配置，同时复用原连接池和线程池
- 支持 streaming helper、timeout、retry、connection pooling

### 落地要点

- SDK 层不要把业务 prompt、业务路由、业务租户逻辑写死。
- 统一错误模型，例如：
  - provider error
  - timeout
  - retryable
  - rate limited
  - invalid request
- 流式接口要暴露标准事件，不要把第三方 SDK 类型直接漏给业务层。
- 最好同时提供：
  - 同步调用
  - 流式调用
  - 结构化输出调用
  - embedding 调用
  - 统一 usage / token 统计

### 高频追问

- 直接用官方 SDK 不行吗？
  - 可以起步，但平台型系统仍需要自己的统一抽象层，否则后续切模型、加观测、做多供应商会很痛。

## Q28：LLM API 如何设计接口？

### 一句话回答

LLM API 设计的重点是把“不确定生成”约束成“稳定接口”，通常要显式区分同步、流式、结构化输出、工具调用和任务型接口。

### 详细展开

一个平台级 LLM API 不建议只提供单一 `/chat` 接口，至少可分为：

- `/chat`：同步文本回答
- `/chat/stream`：流式回答
- `/chat/structured`：结构化 JSON / schema 输出
- `/embeddings`：向量化
- `/responses` 或 `/agent/run`：复杂多模态或事件流

一个更贴近内部平台的响应体示例：

```json
{
  "requestId": "req_123",
  "traceId": "trace_456",
  "model": "gpt-4.1",
  "outputText": "结论如下",
  "toolCalls": [],
  "usage": {
    "inputTokens": 820,
    "outputTokens": 132
  },
  "finishReason": "stop"
}
```

接口设计原则：

- `幂等性`：尤其是重试和异步任务。
- `可观测性`：trace_id、request_id、model、token 用量。
- `版本化`：prompt 版本、schema 版本、tool set 版本。
- `可扩展性`：后续能接入多模型、多工具、多供应商。

### 落地要点

- 把文本输出和结构化输出分开，不要让调用方猜返回值。
- 工具调用要有统一事件格式和回调协议。
- 对异步大任务提供任务 ID、状态查询和取消接口。

### 高频追问

- 为什么不统一成一个万能接口？
  - 因为不同调用模式的语义差别很大，强行统一会让协议越来越难用。

## Q33：什么是 Tool Calling？

### 一句话回答

Tool Calling 是让模型先输出“要调用哪个工具、带什么参数”，再由系统执行工具并把结果回送给模型或直接回给用户的机制。

### 详细展开

它和普通函数调用的区别在于：

- 普通函数调用由代码直接决定。
- Tool Calling 由模型在运行时选择是否调用、调用哪个工具、怎么填参数。

一个典型流程是：

1. 应用向模型声明可用工具 schema。
2. 模型返回某个工具调用意图和参数。
3. 服务端校验参数、权限、预算。
4. 执行工具。
5. 将工具结果喂回模型，或直接作为最终结果返回。

一个抽象后的工具声明示例：

```json
{
  "name": "searchOrders",
  "description": "Search recent orders for the current tenant",
  "input_schema": {
    "type": "object",
    "properties": {
      "userId": {"type": "string"},
      "days": {"type": "integer"}
    },
    "required": ["userId"]
  }
}
```

OpenAI 官方文档中，function calling 和 structured outputs 有明显交集：你不仅要定义工具名，还要定义参数 schema；高风险场景下还要启用更严格的结构化约束。

### 落地要点

- 工具输入和输出都要做 schema 校验。
- 高风险工具必须二次确认或审批。
- 对不可重入操作要做幂等键，避免模型重试造成副作用重复执行。

### 高频追问

- Tool Calling 是不是 Agent 的必要条件？
  - 不是，但它是 Agent 获得“现实世界动作能力”的最常见方式之一。
