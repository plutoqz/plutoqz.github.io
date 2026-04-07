# LangChain4j、Spring AI 与 MCP 实战

## 本章目标

- 用官方文档口径回答 LangChain4j、Spring AI、MCP 相关高频工程题。
- 给出最小可照抄的 Java / Spring Boot 代码骨架。

## 关键问题

- LangChain4j 如何做结构化输出、工具调用和 prompt template？
- Spring AI 和 LangChain4j 到底偏向什么场景？
- MCP 现在的 transport 应该怎么理解？

| 维度 | LangChain4j | Spring AI |
| --- | --- | --- |
| 主要定位 | Java 原生 LLM / Agent 开发库 | Spring 生态下的 AI 应用框架 |
| 典型风格 | `AiServices`、注解、模型抽象 | `ChatClient`、Advisor、Boot 自动装配 |
| 结构化输出 | POJO 返回、JSON Schema、prompting fallback | `entity()`、`StructuredOutputConverter` |
| 工具调用 | `@Tool`、`ToolSpecification`、`ToolProvider` | `ToolCallback`、`ToolCallingManager` |
| Memory | `ChatMemory` 抽象 | `ChatMemory` + repository |
| Spring 集成 | 有 Spring Boot starter | 原生就是 Spring 体系 |
| 适合人群 | 想要轻量 Java 原生抽象的人 | 已经深度使用 Spring Boot / Spring Cloud 的团队 |

## Q5：LangChain4j 如何返回结构化 JSON？

### 一句话回答

LangChain4j 返回结构化 JSON 最稳的方式是用 `JSON Schema` 或直接让 AI Service 返回 POJO；如果模型不支持，再退回 prompting。

### 详细展开

截至 `2026-03-29`，LangChain4j 的 Structured Outputs 文档明确给出了三种方式，可靠性从高到低是：

1. `JSON Schema`
2. `Prompting + JSON Mode`
3. `Prompting`

官方文档还说明：

- AI Service 返回类型可以直接是 POJO。
- 当模型支持 JSON Schema 且显式启用时，LangChain4j 会优先使用更可靠的结构化输出能力。
- 若模型不支持或类型不支持，会回退到 prompting。

一个常见写法：

```java
record Person(String name, int age) {}

interface PersonExtractor {
    Person extractPersonFrom(String text);
}
```

如果需要更底层控制，可以显式构造 `ResponseFormat` 和 `JsonSchema`。

### 落地要点

- 能用 JSON Schema 就优先用 JSON Schema，不要只靠“请输出 JSON”。
- 复杂对象要关注递归、枚举、集合和多态限制。
- 官方文档指出 JSON Schema 在某些模型的 streaming 模式下仍有限制，设计接口时要区分“结构化同步”和“流式文本”。

### 高频追问

- 直接让模型输出字符串 JSON 行不行？
  - 可以，但可靠性最低，尤其在字段必填和复杂嵌套时容易出错。

## Q9：LangChain4j 如何实现 Tool 调用？

### 一句话回答

LangChain4j 的 Tool 调用既可以用高层 `@Tool` 注解，也可以用低层 `ToolSpecification + ToolExecutor` 编程式定义。

### 详细展开

官方 Tools 文档里，高层写法最常见：

```java
class Calculator {

    @Tool("Add two numbers")
    double add(int a, int b) {
        return a + b;
    }
}

interface Assistant {
    String chat(String userMessage);
}

Assistant assistant = AiServices.builder(Assistant.class)
        .chatModel(model)
        .tools(new Calculator())
        .build();
```

当场景更复杂时，可以走低层 API：

- `ToolSpecification`：声明名称、描述、参数 schema。
- `ToolProvider`：按上下文动态暴露工具。
- `Tool Search Strategy`：当工具很多时做语义或关键词搜索。

截至 `2026-03-29`，LangChain4j 文档还提供了：

- `SimpleToolSearchStrategy`
- `VectorToolSearchStrategy`
- `ALWAYS_VISIBLE` 工具可见性控制

### 落地要点

- 工具描述要写清楚何时用、参数含义、边界条件。
- 工具多时不要一次性全暴露给模型，token 浪费和误调用风险都会增加。
- 对有副作用的工具增加权限和幂等保护。

### 高频追问

- tool description 重要吗？
  - 非常重要，它本质上是给模型看的接口文档。

## Q32：Spring AI 和 LangChain4j 有什么区别？

### 一句话回答

两者都能做 Java AI 应用，但 LangChain4j 更像“Java 原生 LLM 开发库”，Spring AI 更像“Spring 生态的 AI 应用框架”。

### 详细展开

如果你想快速用 Java 接 LLM，并且喜欢注解式 `AiServices`、POJO 返回和轻量抽象，LangChain4j 会很顺手。

如果你的项目本来就在 Spring Boot / Spring Cloud 体系中，希望和：

- 自动装配
- 配置体系
- 依赖注入
- 可观测性
- Advisor / RAG / MCP Starter

深度整合，那么 Spring AI 通常更自然。

截至 `2026-03-29` 的 Spring AI 文档中，`ChatClient` 已明确支持同步和 streaming 编程模型，并提供：

- `entity()`
- `responseEntity()`
- `StructuredOutputConverter`
- `Tool Calling`
- `Chat Memory`
- `MCP`

一个最小 Spring AI 示例：

```java
record ActorFilms(String actor, List<String> movies) {}

ActorFilms result = ChatClient.create(chatModel).prompt()
        .user("Generate the filmography for a random actor")
        .call()
        .entity(ActorFilms.class);
```

如果需要流式输出：

```java
Flux<String> stream = ChatClient.create(chatModel).prompt()
        .user("Tell me a joke")
        .stream()
        .content();
```

### 落地要点

- 单纯比较“谁更强”意义不大，应该看团队技术栈和抽象偏好。
- 在 Spring 项目里，Spring AI 的整合优势很明显；想更贴近纯 Java LLM 编排，LangChain4j 更轻。

### 高频追问

- 两者能一起用吗？
  - 可以，但要控制抽象层重叠，不然会出现双重封装。

## Q38：LangChain4j 如何实现 prompt template？

### 一句话回答

LangChain4j 最常见的 prompt template 方式是通过 `@SystemMessage`、`@UserMessage` 和 `@V` 变量注入实现，也支持从资源文件加载模板。

### 详细展开

AI Services 文档展示了两种最常见写法：

```java
interface Translator {

    @SystemMessage("You are a professional translator into {{language}}")
    @UserMessage("Translate the following text: {{text}}")
    String translate(@V("text") String text, @V("language") String language);
}
```

也可以从资源文件加载：

```java
@SystemMessage(fromResource = "/prompts/system.txt")
@UserMessage(fromResource = "/prompts/user.txt")
```

LangChain4j 文档还说明：

- `@V` 用于变量绑定。
- 在 Spring Boot 或 Quarkus 下，很多情况下不显式写 `@V` 也能工作，因为参数名可直接参与模板变量解析。

### 落地要点

- 把稳定规则放 `@SystemMessage`，把用户变量放 `@UserMessage`。
- 复杂模板建议放资源文件，避免注解里塞太长字符串。
- Prompt 变量名要和业务语义一致，减少维护成本。

### 高频追问

- LangChain4j 有运行时改写 prompt 的能力吗？
  - 有，AI Services 支持基于请求或 memory 的动态 system message / request transformation。

## Q46：MCP（Model Context Protocol）是什么？

### 一句话回答

MCP 是一种让模型客户端以统一协议访问外部资源、工具和提示的开放协议，本质上是在“模型”和“外部能力”之间定义标准接口。

### 详细展开

MCP 的价值在于标准化三类能力暴露方式：

- `Tools`
- `Resources`
- `Prompts`

截至 `2026-03-29`，MCP 官方 `2025-06-18` 版 transport 规范明确写到：

- 当前标准 transport 是 `stdio` 和 `Streamable HTTP`
- `Streamable HTTP` 取代了旧版 `HTTP+SSE transport`
- 但在新的 Streamable HTTP 中，服务器仍可以使用 SSE 来流式发送多个服务端消息

这意味着两个层次要区分：

1. `协议标准层`
  - 新标准是 `stdio + Streamable HTTP`
2. `框架实现层`
  - Spring AI 仍提供 `SSE`、`Streamable-HTTP`、`Stateless Streamable-HTTP` 等 starter 选项，兼顾兼容性和工程易用性

在 Java 生态里，MCP 的典型落地方向有两个：

- 把你的应用作为 `MCP client`，去消费外部工具、资源和 prompts。
- 把你的内部能力封装成 `MCP server`，供 IDE、Agent 平台或其他客户端统一接入。

### 落地要点

- 不要把 MCP 简单理解成“工具调用协议”；它还包括资源和提示。
- 做 Java 落地时要区分：
  - 你是在写 MCP client
  - 还是在把你的服务暴露成 MCP server
- transport 相关回答要带日期和版本意识，否则很容易说成过时结论。

### 高频追问

- MCP 和普通 REST API 的区别是什么？
  - REST API 是业务服务接口，MCP 是面向模型上下文接入的统一协议层，关注的是 tools/resources/prompts 和会话交互语义。
