const titleElement = document.getElementById("note-title");
const categoryElement = document.getElementById("note-category");
const summaryElement = document.getElementById("note-summary");
const metaElement = document.getElementById("note-meta");
const articleElement = document.getElementById("note-article");
const tocList = document.getElementById("toc-list");
const relatedList = document.getElementById("related-list");
const pathParams = new URLSearchParams(window.location.search);

loadNote();

async function loadNote() {
    const notePath = pathParams.get("path");
    if (!notePath) {
        renderMissing("缺少笔记路径参数。");
        return;
    }

    try {
        const { manifest, note, parsed } = await window.notesUtils.loadNoteDocument(notePath);

        document.title = `${note.title} | Pluto QZ 技术博客`;
        categoryElement.textContent = note.categoryLabel;
        titleElement.textContent = note.title;
        summaryElement.textContent = note.summary;
        metaElement.innerHTML = `
            <span>${window.notesUtils.formatDate(note.date)}</span>
            <span>${window.notesUtils.escapeHtml(note.categoryLabel)}</span>
            ${(note.tags || []).map((tag) => `<span>${window.notesUtils.escapeHtml(tag)}</span>`).join("")}
        `;

        articleElement.innerHTML = marked.parse(parsed.body);
        buildToc();
        renderRelated(manifest.notes, note);
    } catch (error) {
        renderMissing(error.message);
    }
}

function buildToc() {
    const headings = [...articleElement.querySelectorAll("h2, h3, h4")];
    if (headings.length === 0) {
        tocList.innerHTML = "<p>这篇笔记目前没有二级及以下标题。</p>";
        return;
    }

    const usedIds = new Set();
    const items = headings.map((heading) => {
        const baseId = window.notesUtils.slugify(heading.textContent) || "section";
        let uniqueId = baseId;
        let counter = 1;

        while (usedIds.has(uniqueId)) {
            counter += 1;
            uniqueId = `${baseId}-${counter}`;
        }

        usedIds.add(uniqueId);
        heading.id = uniqueId;

        return `
            <a class="toc-item depth-${heading.tagName.toLowerCase()}" href="#${uniqueId}">
                ${window.notesUtils.escapeHtml(heading.textContent)}
            </a>
        `;
    });

    tocList.innerHTML = items.join("");
}

function renderRelated(notes, current) {
    const related = notes
        .filter((note) => note.path !== current.path)
        .filter((note) => note.category === current.category)
        .slice(0, 4);

    if (related.length === 0) {
        relatedList.innerHTML = `
            <a class="related-link" href="${window.notesUtils.appendSourceParam(`notes.html?category=${encodeURIComponent(current.category)}`)}">
                返回“${window.notesUtils.escapeHtml(current.categoryLabel)}”专题
            </a>
        `;
        return;
    }

    relatedList.innerHTML = related
        .map(
            (note) => `
                <a class="related-link" href="${note.url}">
                    <strong>${window.notesUtils.escapeHtml(note.title)}</strong>
                    <span>${window.notesUtils.formatDate(note.date)}</span>
                </a>
            `
        )
        .join("");
}

function renderMissing(message) {
    document.title = "文章暂时不可用 | Pluto QZ";
    categoryElement.textContent = "暂时不可用";
    titleElement.textContent = "文章暂时无法打开";
    summaryElement.textContent = message;
    articleElement.innerHTML = `
        <p>请返回 <a href="${window.notesUtils.appendSourceParam("notes.html")}">文章目录页</a> 重新选择文章，或者检查对应 Markdown 文件是否已经推送到仓库。</p>
    `;
    tocList.innerHTML = "<p>暂无目录。</p>";
    relatedList.innerHTML = `<a class="related-link" href="${window.notesUtils.appendSourceParam("notes.html")}">返回全部文章</a>`;
}
