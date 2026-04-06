# Notes Directory

这个目录存放个人学习笔记。站点会把这里的 Markdown 文件组织成可浏览、可分类、带目录的笔记页。

推荐结构：

```text
notes/
  engineering/
    your-note.md
  webgis/
    another-note.md
```

推荐在每篇笔记顶部加上简单的 front matter：

```md
---
title: 你的笔记标题
date: 2026-04-06
summary: 用一两句话说明这篇笔记写了什么
tags:
  - GitHub Pages
  - Markdown
  - Notes
---
```

说明：

- 分类默认取 `notes/` 下面的第一级目录名
- 单篇笔记页会根据正文里的 `##`、`###`、`####` 标题自动生成目录
- 线上站点会直接读取仓库中的 Markdown 内容
- 如果你想在本地用 manifest 方式预览，可以运行 `node scripts/build-notes-index.mjs`
