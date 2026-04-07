# Java AI Agent 面试问答（48题） Sources

## 使用说明

- 访问日期统一记录为 `2026-03-29`。
- 对框架、协议、SDK、transport 等版本敏感问题，优先使用官方文档。
- 对架构设计、选型取舍、落地建议等内容，若超出文档的直接陈述范围，会在备注中标注为“工程推断”。

## 来源清单

| 章节 | 来源类型 | 标题 / 站点 | URL | 访问日期 | 备注 |
| --- | --- | --- | --- | --- | --- |
| 01 | 论文 | ReAct: Synergizing Reasoning and Acting in Language Models | https://arxiv.org/abs/2210.03629 | 2026-03-29 | 用于 ReAct、reasoning-acting 闭环 |
| 02, 07 | 官方文档 | LangChain4j - Chat Memory | https://docs.langchain4j.dev/tutorials/chat-memory/ | 2026-03-29 | 直接支持 memory vs history、ChatMemory 概念 |
| 03 | 论文 | Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks | https://arxiv.org/abs/2005.11401 | 2026-03-29 | 用于 RAG 基本定义 |
| 04 | 论文 | Attention Is All You Need | https://arxiv.org/abs/1706.03762 | 2026-03-29 | 用于 Transformer 核心原理 |
| 04, 06 | 官方文档 | OpenAI - Function calling | https://platform.openai.com/docs/guides/function-calling | 2026-03-29 | 用于 Tool Calling、参数 schema、结构化调用约束 |
| 04 | 官方文档 | OpenAI - Prompt engineering | https://platform.openai.com/docs/guides/prompt-engineering | 2026-03-29 | 用于 prompt 工程与角色消息说明 |
| 04, 06, 07 | 官方文档 | OpenAI - Structured Outputs | https://platform.openai.com/docs/guides/structured-outputs | 2026-03-29 | 用于结构化输出和 schema 约束 |
| 05 | 官方文档 | Spring Framework - Asynchronous Requests | https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-async.html | 2026-03-29 | 直接支持 `ResponseBodyEmitter`、`SseEmitter` |
| 05 | 官方文档 | Spring Framework - Return Values (WebFlux) | https://docs.spring.io/spring-framework/reference/web/webflux/controller/ann-methods/return-types.html | 2026-03-29 | 直接支持 `Flux<ServerSentEvent<?>>` |
| 05 | 官方标准 | WHATWG HTML Standard - Server-sent events | https://html.spec.whatwg.org/multipage/server-sent-events.html | 2026-03-29 | 直接支持 SSE 协议字段、EventSource 行为 |
| 05, 06 | 官方 SDK 文档 | openai/openai-java README | https://github.com/openai/openai-java | 2026-03-29 | 直接支持 Java SDK 构建、streaming helpers、timeouts、connection pooling、`withOptions()` |
| 07 | 官方文档 | LangChain4j - Structured Outputs | https://docs.langchain4j.dev/tutorials/structured-outputs/ | 2026-03-29 | 直接支持 JSON Schema、Prompting fallback、streaming 限制 |
| 07 | 官方文档 | LangChain4j - Tools (Function Calling) | https://docs.langchain4j.dev/tutorials/tools/ | 2026-03-29 | 直接支持 `@Tool`、`ToolSpecification`、tool search |
| 07 | 官方文档 | LangChain4j - AI Services | https://docs.langchain4j.dev/tutorials/ai-services/ | 2026-03-29 | 直接支持 `@SystemMessage`、`@UserMessage`、`@V`、模板变量 |
| 07 | 官方文档 | LangChain4j - Response Streaming | https://docs.langchain4j.dev/tutorials/response-streaming/ | 2026-03-29 | 直接支持 `StreamingChatModel`、partial callbacks、cancel |
| 07 | 官方文档 | Spring AI - Chat Client API | https://docs.spring.io/spring-ai/reference/api/chatclient.html | 2026-03-29 | 直接支持 `ChatClient`、`entity()`、streaming、模板渲染 |
| 07 | 官方文档 | Spring AI - Tool Calling | https://docs.spring.io/spring-ai/reference/api/tools.html | 2026-03-29 | 直接支持 `ToolCallback`、`ToolCallingManager` |
| 07 | 官方文档 | Spring AI - Chat Memory | https://docs.spring.io/spring-ai/reference/api/chat-memory.html | 2026-03-29 | 直接支持 `MessageWindowChatMemory` 和 repository |
| 07 | 官方文档 | Spring AI - Model Context Protocol (MCP) | https://docs.spring.io/spring-ai/reference/api/mcp/mcp-overview.html | 2026-03-29 | 直接支持 Spring AI 对 SSE / Streamable-HTTP / STDIO 的实现能力 |
| 07 | 官方规范 | Model Context Protocol - Introduction | https://modelcontextprotocol.io/introduction | 2026-03-29 | 用于 MCP 总体概念 |
| 07 | 官方规范 | Model Context Protocol - Transports (2025-06-18) | https://modelcontextprotocol.io/specification/2025-06-18/basic/transports | 2026-03-29 | 直接支持“当前标准 transport 是 stdio + Streamable HTTP”以及 HTTP+SSE 已被替换 |
| 08 | 官方文档 | Spring AI - Model Evaluation | https://docs.spring.io/spring-ai/reference/api/evaluation.html | 2026-03-29 | 用于评测思路补充 |
| 08 | 官方文档 | Spring AI - Observability | https://docs.spring.io/spring-ai/reference/api/observability.html | 2026-03-29 | 用于监控与可观测性思路 |

## 说明

- 章节中的 Java 架构图、缓存层次、Agent 拆分策略、RAG 选型建议、Prompt 管理系统设计、日志字段设计等内容，主要基于以上官方文档能力边界与通用后端工程实践做的工程化组织与推断。
- 关于 `Spring AI vs LangChain4j` 的比较，不是官方结论，而是基于两者文档暴露的抽象层、API 形式和生态整合方式做出的工程推断。
- 关于 `MCP` 的回答，正文中特别区分了“官方规范层”和“Spring AI 工程实现层”，避免把“规范上的当前推荐 transport”和“框架中仍支持的兼容 transport”混为一谈。
