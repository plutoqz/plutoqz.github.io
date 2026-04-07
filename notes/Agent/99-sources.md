# Agent Sources

## 使用说明

-   访问日期统一记录为 `2026-03-25`。
    
-   本笔记优先采用官方文档、官方 SDK 文档、协议文档和论文摘要。
    
-   章节内容中凡涉及版本敏感能力、具体产品功能、官方建议的地方，均以这些来源为准。
    
-   “实用定义”“经验法则”“章节组织方式”等内容，部分是基于来源做的作者归纳与推理，不等同于原文逐句表述。
    

## 来源清单

| 章节  | 来源类型 | 标题/站点 | URL | 访问日期 | 备注  |
| --- | --- | --- | --- | --- | --- |
| 01, 03, 04, 06, 07 | 官方指南 | OpenAI - A practical guide to building agents | https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/ | 2026-03-25 | 用于定义 Agent、单/多 Agent 模式、工具分类、守护建议、从单 Agent 起步等 |
| 06, 07 | 官方文档 | OpenAI - Agent Builder | https://developers.openai.com/api/docs/guides/agent-builder | 2026-03-25 | 用于 workflow、node、typed edge、预览和评测入口说明 |
| 02, 03, 05, 06 | 官方 SDK 文档 | OpenAI Agents SDK | https://openai.github.io/openai-agents-python/ | 2026-03-25 | 用于 primitives、agent loop、sessions、tracing、MCP integration 等 |
| 05  | 官方 SDK 文档 | OpenAI Agents SDK - Sessions | https://openai.github.io/openai-agents-python/sessions/ | 2026-03-25 | 用于 session memory、history merge、compaction、resume run |
| 05  | 官方 SDK 文档 | OpenAI Agents SDK - Encrypted sessions | https://openai.github.io/openai-agents-python/sessions/encrypted\_session/ | 2026-03-25 | 用于 memory 的加密、TTL、会话级数据安全设计 |
| 07  | 官方指南 | OpenAI - Safety in building agents | https://developers.openai.com/api/docs/guides/agent-builder-safety | 2026-03-25 | 用于 prompt injection、structured outputs、tool approvals、guardrails 组合 |
| 07  | 官方指南 | OpenAI - Agent evals | https://developers.openai.com/api/docs/guides/agent-evals | 2026-03-25 | 用于 evals 和 trace grading 的评测思路 |
| 05, 06 | 官方文档 | LangGraph overview | https://docs.langchain.com/oss/python/langgraph/overview | 2026-03-25 | 用于 durable execution、human-in-the-loop、memory、stateful workflow |
| 06  | 官方文档 | LangGraph - Durable execution | https://docs.langchain.com/oss/python/langgraph/durable-execution | 2026-03-25 | 用于 checkpoint、deterministic replay、idempotent side effects |
| 02, 05, 06 | 官方协议文档 | Model Context Protocol - What is MCP? | https://modelcontextprotocol.io/docs/getting-started/intro | 2026-03-25 | 用于 MCP 的定位：连接 AI 应用与外部系统的开放标准 |
| 04  | 论文  | ReAct: Synergizing Reasoning and Acting in Language Models | https://arxiv.org/abs/2210.03629 | 2026-03-25 | 用于 ReAct 模式、reasoning + acting 交替 loop |
| 04  | 论文  | Toolformer: Language Models Can Teach Themselves to Use Tools | https://arxiv.org/abs/2302.04761 | 2026-03-25 | 用于工具使用能力、何时调用工具、如何融合结果 |
| 04, 06 | 维护方资源 | Anthropic - Building Effective AI Agents | https://resources.anthropic.com/building-effective-ai-agents | 2026-03-25 | 用于 sequential、parallel、evaluator-optimizer、single vs multi-agent 的工程模式参考 |

## 后续刷新建议

-   若你要把这套笔记升级成“框架实战版”，优先补 OpenAI Agents SDK、LangChain/LangGraph 的最新 quickstart 与 migration 文档。
    
-   若你要把这套笔记升级成“面试八股版”，可以在每章尾部再压一层 3 分钟口述答案。
    
-   若你要把这套笔记升级成“代码实践版”，建议新增一章：`09-最小可运行 Agent 示例`，配一套可直接跑的 Python demo。