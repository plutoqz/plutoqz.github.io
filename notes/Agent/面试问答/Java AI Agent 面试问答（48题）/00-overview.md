# Java AI Agent 面试问答（48题）

## 学习目标

-   用一套偏 Java / Spring Boot / AI 应用工程的问答体系，系统回答 Agent、RAG、Streaming、SSE、Tool Calling、LangChain4j、Spring AI、MCP、缓存、监控和评估问题。
    
-   不只背定义，而是把每个问题讲成 `概念 -> 机制 -> 架构 -> 工程实现 -> 追问` 的完整链路。
    
-   让你既能 30 秒短答，也能把关键题展开成 3 到 5 分钟的有层次回答。
    

## 适用人群

-   准备 Java 后端、Spring Boot、AI 应用平台、智能问答、Agent 工程方向面试的人。
    
-   已经做过 LLM Demo，但还没有把答案升级成“生产级工程语言”的人。
    
-   想把 AI 面试题整理成长期可复习的章节化笔记，而不是一次性 FAQ 的人。
    

## 范围边界

-   重点覆盖软件侧 AI Agent、RAG、Java LLM 服务、流式输出、工具调用、Prompt、Memory、监控与评估。
    
-   默认站在 Java / Spring Boot 语境回答，但会保留通用架构和语言无关原理。
    
-   版本敏感内容以 `2026-03-29` 访问到的官方文档为准；涉及框架行为时会优先采用官方文档结论，涉及架构选型时会明确标注工程推断。
    

## 使用方式

每道题统一按四层来写：

1.  `一句话回答`：适合先给面试官一个结论。
    
2.  `详细展开`：适合 2 到 5 分钟解释原理和架构。
    
3.  `落地要点`：适合回答“那你在生产里怎么做？”。
    
4.  `高频追问`：适合继续深挖。
    

建议练习时也按这四层说。先给结论，再展开机制，最后落在实现和取舍上。

## 章节地图

-   `01` AI Agent 基础、ChatBot 差异与执行模式
    
-   `02` 多 Agent、Memory 与上下文窗口
    
-   `03` RAG 原理、检索链路与知识工程
    
-   `04` Transformer、Prompt 与幻觉治理
    
-   `05` Java LLM 服务工程：Streaming、SSE、缓存与性能
    
-   `06` OpenAI SDK、LLM API 与 Tool Calling 设计
    
-   `07` LangChain4j、Spring AI 与 MCP 实战
    
-   `08` AI 问答系统架构、监控与评估
    
-   `99` Sources
    

## 48 题总索引

### 01 AI Agent 基础、ChatBot 差异与执行模式

-   Q10 什么是 AI Agent？
    
-   Q12 Agent 和普通 ChatBot 有什么区别？
    
-   Q31 什么是 ReAct Agent？
    
-   Q42 Agent 如何做任务规划（planning）？
    
-   Q47 Agent workflow 和普通 workflow 有什么区别？
    

### 02 多 Agent、Memory 与上下文窗口

-   Q1 如何实现多 Agent 协作系统？
    
-   Q21 什么是 ChatMemory？
    
-   Q24 Agent memory 有哪些类型？
    
-   Q25 如何实现对话历史 memory？
    
-   Q48 大模型上下文窗口是什么？如何突破长度限制？
    

### 03 RAG 原理、检索链路与知识工程

-   Q2 什么是 RAG（Retrieval Augmented Generation）？
    
-   Q13 RAG latency 怎么优化？
    
-   Q15 RAG pipeline 的完整流程是什么？
    
-   Q16 RAG 系统主要组件有哪些？
    
-   Q18 RAG 如何做 rerank？
    
-   Q20 embedding 和向量相似度搜索是什么？
    
-   Q23 如何评估 RAG 系统效果？
    
-   Q29 chunk size 为什么很重要？如何选择？
    
-   Q30 如何实现 hybrid search（向量 + keyword）？
    
-   Q34 embedding 模型如何选择？
    
-   Q36 文档切分有哪些策略？
    

### 04 Transformer、Prompt 与幻觉治理

-   Q4 什么是 hallucination（幻觉）？为什么会发生？
    
-   Q11 什么是 Prompt Engineering？
    
-   Q26 Transformer 架构核心原理是什么？
    
-   Q27 如何减少大模型 hallucination？
    
-   Q39 ChatGPT 的 system / user / assistant role 有什么作用？
    
-   Q40 LLM 为什么推理成本高？
    
-   Q44 如何设计 Prompt 管理系统？
    

### 05 Java LLM 服务工程：Streaming、SSE、缓存与性能

-   Q3 Java 如何实现 streaming response？
    
-   Q6 如何实现 SSE 推送？
    
-   Q8 LLM 服务如何做缓存？
    
-   Q22 Java LLM 服务如何做连接池管理？
    
-   Q37 LLM 服务如何做限流？
    
-   Q43 LLM latency 如何优化？
    
-   Q45 streaming response 如何实现？
    

### 06 OpenAI SDK、LLM API 与 Tool Calling 设计

-   Q14 Java 调用 OpenAI API 如何设计 SDK？
    
-   Q28 LLM API 如何设计接口？
    
-   Q33 什么是 Tool Calling？
    

### 07 LangChain4j、Spring AI 与 MCP 实战

-   Q5 LangChain4j 如何返回结构化 JSON？
    
-   Q9 LangChain4j 如何实现 Tool 调用？
    
-   Q32 Spring AI 和 LangChain4j 有什么区别？
    
-   Q38 LangChain4j 如何实现 prompt template？
    
-   Q46 MCP（Model Context Protocol）是什么？
    

### 08 AI 问答系统架构、监控与评估

-   Q7 如何评估 Agent 的执行效果？
    
-   Q17 如何设计一个 AI 问答系统架构？
    
-   Q19 AI 系统如何做监控？
    
-   Q35 AI Chat 系统的整体架构是什么？
    
-   Q41 AI 系统如何记录 Prompt 和 Response？
    

## 重复题说明

-   Q3、Q6、Q45 都和“流式输出”有关：
    
    -   Q3 强调 Java 服务端如何把上游 token 流转成下游响应流。
        
    -   Q6 强调 SSE 协议和推送机制。
        
    -   Q45 强调从上游模型到前端 UI 的端到端落地。
        
-   Q17、Q35 都和“架构”有关：
    
    -   Q17 强调如何设计一个 AI 问答系统。
        
    -   Q35 强调 AI Chat 系统的整体分层与核心组件。
        
-   Q7、Q23 都和“评估”有关：
    
    -   Q7 面向 Agent 执行链路。
        
    -   Q23 面向 RAG 检索与回答质量。
        

## 建议阅读顺序

1.  先读 `01` 和 `02`，把 Agent、Memory、多 Agent 和上下文窗口讲顺。
    
2.  再读 `03` 和 `04`，把 RAG、Transformer、Prompt 和 hallucination 讲透。
    
3.  然后读 `05`、`06`、`07`，把 Java 服务工程、SDK、LangChain4j、Spring AI、MCP 讲实。
    
4.  最后读 `08`，把架构、监控、评估和日志治理整合成一套完整答案。
    

## 学完后的达标标准

如果你能做到下面这些事，说明这套问答已经内化了：

-   不看资料也能口头回答 Q1、Q2、Q3、Q5、Q7、Q14、Q17、Q23、Q32、Q46。
    
-   面对“为什么不用更复杂的多 Agent”“为什么不用纯向量检索”“为什么不用 WebSocket 而用 SSE”“为什么不直接写死工具路由”这类追问，能给出取舍。
    
-   能画出一套 AI 问答系统的数据流，并指出 Prompt、Memory、RAG、工具、缓存、限流、监控、评测分别放在哪里。
    
-   能把“看起来很聪明”的 Demo 方案，修正成“生产可控”的工程方案。