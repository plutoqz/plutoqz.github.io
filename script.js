const projects = [
    {
        name: "webgis-frontend",
        title: "WebGIS 前端实验",
        description: "围绕地图交互、空间数据表达与专题图层组织展开的前端实践，重点关注复杂 GIS 场景下的可视化与交互结构。",
        tags: ["Vue", "WebGIS", "前端"],
        meta: "2025 年",
        url: "https://github.com/plutoqz/webgis-frontend"
    },
    {
        name: "webgis-backend",
        title: "WebGIS 后端能力层",
        description: "为地图应用提供数据处理与服务支撑，承接空间数据组织、接口能力与业务逻辑协同的后端部分。",
        tags: ["Python", "后端", "空间数据"],
        meta: "2025 年",
        url: "https://github.com/plutoqz/webgis-backend"
    },
    {
        name: "image",
        title: "图像处理工具箱",
        description: "基于 GDAL 与 Qt 的图像处理练习，涵盖线性拉伸、直方图匹配、SIFT 特征点和形态学操作等典型能力。",
        tags: ["C++", "GDAL", "Qt"],
        meta: "2024 年",
        url: "https://github.com/plutoqz/image"
    },
    {
        name: "pluto_milkup",
        title: "Pluto Milkup 编辑器",
        description: "一个桌面端 Markdown 编辑器项目，也说明这个站点未来可以继续扩展成更完整的写作与作品入口。",
        tags: ["桌面应用", "Markdown", "工具"],
        meta: "2025 年",
        url: "https://github.com/plutoqz/pluto_milkup"
    }
];

const projectList = document.getElementById("project-list");
const latestNotes = document.getElementById("latest-notes");
const notesCount = document.getElementById("notes-count");
const notesCategories = document.getElementById("notes-categories");
const notesCategoryPreview = document.getElementById("notes-category-preview");
const year = document.getElementById("year");

renderProjects();
revealOnScroll();
loadLatestNotes();

if (year) {
    year.textContent = new Date().getFullYear();
}

function renderProjects() {
    if (!projectList) {
        return;
    }

    projectList.innerHTML = projects
        .map(
            (project) => `
                <article class="project-card reveal">
                    <header>
                        <div>
                            <p class="panel-kicker">项目记录 / ${project.name}</p>
                            <h3>${project.title}</h3>
                        </div>
                        <div class="project-meta">
                            <span>${project.meta}</span>
                        </div>
                    </header>
                    <p>${project.description}</p>
                    <div class="project-tags">
                        ${project.tags.map((tag) => `<span>${tag}</span>`).join("")}
                    </div>
                    <a class="project-link" href="${project.url}" target="_blank" rel="noreferrer">查看仓库</a>
                </article>
            `
        )
        .join("");

    revealOnScroll();
}

async function loadLatestNotes() {
    if (!window.notesUtils) {
        renderNotesUnavailable("笔记工具脚本未成功载入。");
        return;
    }

    try {
        const manifest = await window.notesUtils.loadNotesIndex();
        const notes = Array.isArray(manifest.notes) ? manifest.notes : [];
        const categories = Array.isArray(manifest.categories) ? manifest.categories : [];

        if (notesCount) {
            notesCount.textContent = `${notes.length} 篇笔记`;
        }

        if (notesCategories) {
            notesCategories.textContent = `${categories.length} 个专题`;
        }

        if (notesCategoryPreview) {
            notesCategoryPreview.innerHTML = categories
                .slice(0, 6)
                .map((category) => `<span class="notes-chip">${category.label} · ${category.count}</span>`)
                .join("");
        }

        if (!latestNotes) {
            return;
        }

        if (notes.length === 0) {
            latestNotes.innerHTML = `
                <article class="note-preview-card note-preview-empty reveal">
                    <p class="panel-kicker">暂无文章</p>
                    <h3>还没有公开的学习笔记</h3>
                    <p>把 Markdown 文件放进 notes 目录后，这里会自动出现最新的文章预览。</p>
                </article>
            `;
            revealOnScroll();
            return;
        }

        latestNotes.innerHTML = notes
            .slice(0, 3)
            .map(
                (note, index) => `
                    <article class="note-preview-card reveal">
                        <header>
                            <div>
                                <p class="panel-kicker">最新文章 ${index + 1} / ${note.categoryLabel}</p>
                                <h3>${escapeHtml(note.title)}</h3>
                            </div>
                            <div class="note-meta">
                                <span>${formatDate(note.date)}</span>
                            </div>
                        </header>
                        <p>${escapeHtml(note.summary)}</p>
                        <div class="note-meta">
                            ${(note.tags || []).slice(0, 3).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
                        </div>
                        <a class="note-link" href="${note.url}">阅读文章</a>
                    </article>
                `
            )
            .join("");

        revealOnScroll();
    } catch (error) {
        renderNotesUnavailable(error.message);
    }
}

function renderNotesUnavailable(message) {
    if (!latestNotes) {
        return;
    }

    latestNotes.innerHTML = `
        <article class="note-preview-card note-preview-empty reveal">
            <p class="panel-kicker">暂时不可用</p>
            <h3>文章预览未能载入</h3>
            <p>${escapeHtml(message)}</p>
        </article>
    `;
    revealOnScroll();
}

function revealOnScroll() {
    const targets = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.18
        }
    );

    targets.forEach((target) => {
        if (!target.classList.contains("is-visible")) {
            observer.observe(target);
        }
    });
}

function formatDate(value) {
    if (!value) {
        return "未标注日期";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    });
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
