# 淘天 Agent 面试问答 Sources

## 使用说明

-   访问日期统一记录为 `2026-03-25`。
    
-   本笔记以官方文档、官方 SDK 文档、协议文档为主，辅以模型知识做工程化组织与推断。
    
-   关于“淘天场景怎么选”“是否更适合 Milvus”等结论，属于基于公开能力说明和电商业务约束做的工程推断，不代表任何未公开的内部架构结论。
    

## 来源清单

| 章节  | 来源类型 | 标题/站点 | URL | 访问日期 | 备注  |
| --- | --- | --- | --- | --- | --- |
| 01, 04, 05, 06 | 官方指南 | OpenAI - A practical guide to building agents | https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/ | 2026-03-25 | 用于单/多 Agent、工具分类、工作流与 Agent 边界等 |
| 04, 06 | 官方文档 | OpenAI - Function calling | https://developers.openai.com/api/docs/guides/function-calling | 2026-03-25 | 用于结构化工具调用与函数接口能力 |
| 06  | 官方文档 | OpenAI - Safety in building agents | https://developers.openai.com/api/docs/guides/agent-builder-safety | 2026-03-25 | 用于 prompt injection、structured outputs、审批与工具安全 |
| 04, 06 | 官方文档 | OpenAI - Agent evals | https://developers.openai.com/api/docs/guides/agent-evals | 2026-03-25 | 用于评测、trace grading、回放治理思路 |
| 06  | 官方 SDK 文档 | OpenAI Agents SDK - Tracing | https://openai.github.io/openai-agents-python/tracing/ | 2026-03-25 | 用于 trace、span、group\_id、内建观测能力 |
| 06  | 官方文档 | OpenTelemetry - Signals | https://opentelemetry.io/docs/concepts/signals/ | 2026-03-25 | 用于 trace / metrics / logs 的统一观测概念 |
| 06  | 官方文档 | OpenTelemetry - Traces | https://opentelemetry.io/docs/concepts/signals/traces/ | 2026-03-25 | 用于 span、context propagation、distributed tracing |
| 03  | 官方文档 | Milvus - What is Milvus | https://milvus.io/docs/overview.md | 2026-03-25 | 用于分布式、部署模式、混合检索、多租户和安全能力 |
| 03  | 官方文档 | Pinecone - Overview | https://docs.pinecone.io/guides/get-started/overview | 2026-03-25 | 用于托管式能力、namespace、多租户、集成 embedding/rerank |
| 03  | 官方文档 | Pinecone - Search overview | https://docs.pinecone.io/guides/search/search-overview | 2026-03-25 | 用于 semantic / lexical / hybrid、metadata filter、eventual consistency |
| 03  | 官方文档 | Pinecone - Filter by metadata | https://docs.pinecone.io/guides/search/filter-by-metadata | 2026-03-25 | 用于 metadata filtering 策略 |
| 03  | 官方文档 | Chroma - Introduction | https://docs.trychroma.com/ | 2026-03-25 | 用于 dense/sparse/hybrid、metadata filter、local/self-host/cloud 形态 |
| 03  | 官方文档 | Chroma - Architecture Overview | https://docs.trychroma.com/reference/architecture/overview | 2026-03-25 | 用于 Chroma 的架构与持久化设计 |

## 说明

-   chunk 策略、缓存策略、限流、伸缩、审批、补偿、灰度、回滚等答案，主要是基于以上文档能力边界与通用分布式系统实践做的工程总结。
    
-   如果后续你要把这套问答升级成“框架实战版”，建议继续补：
    
    -   OpenAI Agents SDK 的 sessions / guardrails 文档
        
    -   LangGraph 的 durable execution / memory 文档
        
    -   你目标岗位常用向量库和检索框架的最新 release notes