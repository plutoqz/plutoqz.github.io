# Pluto QZ Personal Site

这是 `plutoqz.github.io` 的源码仓库，对外发布为个人主页与学习笔记站点。

快速入口：

- [个人主页](https://plutoqz.github.io/)
- [学习笔记](https://plutoqz.github.io/notes.html)
- [笔记目录说明](./notes/README.md)

## 站点结构

- `index.html`：主页，展示项目入口和笔记入口
- `notes.html`：学习笔记目录页，支持分类和搜索
- `note.html`：单篇笔记页，支持文章目录和相关推荐
- `notes/`：存放 Markdown 笔记
- `assets/lib/marked.min.js`：Markdown 渲染依赖

## 如何新增笔记

把 Markdown 文件放进 `notes/分类名/文件名.md`，例如：

```text
notes/
  engineering/
    my-first-note.md
  webgis/
    map-rendering-basics.md
```

推荐在笔记顶部写上 front matter：

```md
---
title: 你的笔记标题
date: 2026-04-06
summary: 用一两句话概括这篇笔记的重点
tags:
  - GitHub Pages
  - Notes
---
```

说明：

- 分类默认取 `notes/` 下面的第一级目录名
- 单篇笔记页会根据 `##`、`###`、`####` 标题自动生成目录
- 线上站点会直接读取仓库里的 Markdown，所以推送后笔记入口会自动看到新增内容
- 如果你想在本地用 manifest 方式预览，可以运行 `node scripts/build-notes-index.mjs`
