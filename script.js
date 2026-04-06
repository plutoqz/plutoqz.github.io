const projects = [
    {
        name: "webgis-frontend",
        title: "WebGIS Frontend",
        description: "围绕地图交互与空间数据表达的前端实验，偏重 WebGIS 场景下的可视化与交互组织。",
        tags: ["Vue", "WebGIS", "Frontend"],
        meta: "2025",
        url: "https://github.com/plutoqz/webgis-frontend"
    },
    {
        name: "webgis-backend",
        title: "WebGIS Backend",
        description: "与前端配套的数据处理与服务能力部分，用来承接地图业务背后的后端逻辑。",
        tags: ["Python", "Backend", "Geo Data"],
        meta: "2025",
        url: "https://github.com/plutoqz/webgis-backend"
    },
    {
        name: "image",
        title: "Image Processing Toolkit",
        description: "基于 GDAL 与 Qt 的图像处理练习，包含线性拉伸、直方图匹配、SIFT 特征点和形态学操作。",
        tags: ["C++", "GDAL", "Qt"],
        meta: "2024",
        url: "https://github.com/plutoqz/image"
    },
    {
        name: "pluto_milkup",
        title: "Pluto Milkup",
        description: "一个桌面端 Markdown 编辑器项目，也说明这个主页未来完全可以继续扩展为作品总入口。",
        tags: ["Desktop", "Markdown", "Utility"],
        meta: "2025",
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
                            <p class="panel-kicker">${project.name}</p>
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
                    <a class="project-link" href="${project.url}" target="_blank" rel="noreferrer">Open Repository</a>
                </article>
            `
        )
        .join("");

    revealOnScroll();
}

async function loadLatestNotes() {
    try {
        const manifest = await window.notesUtils.loadNotesIndex();
        const notes = Array.isArray(manifest.notes) ? manifest.notes : [];
        const categories = Array.isArray(manifest.categories) ? manifest.categories : [];

        if (notesCount) {
            notesCount.textContent = `${notes.length} 篇笔记`;
        }

        if (notesCategories) {
            notesCategories.textContent = `${categories.length} 个分类`;
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
                    <p class="panel-kicker">No Notes Yet</p>
                    <h3>还没有公开笔记</h3>
                    <p>把 Markdown 文件放进 notes 目录后，这里会自动显示最新笔记预览。</p>
                </article>
            `;
            revealOnScroll();
            return;
        }

        latestNotes.innerHTML = notes
            .slice(0, 4)
            .map(
                (note) => `
                    <article class="note-preview-card reveal">
                        <header>
                            <div>
                                <p class="panel-kicker">${note.categoryLabel}</p>
                                <h3>${escapeHtml(note.title)}</h3>
                            </div>
                            <div class="note-meta">
                                <span>${formatDate(note.date)}</span>
                            </div>
                        </header>
                        <p>${escapeHtml(note.summary)}</p>
                        <div class="note-meta">
                            ${note.tags.slice(0, 3).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
                        </div>
                        <a class="note-link" href="${note.url}">阅读笔记</a>
                    </article>
                `
            )
            .join("");

        revealOnScroll();
    } catch (error) {
        if (latestNotes) {
            latestNotes.innerHTML = `
                <article class="note-preview-card note-preview-empty reveal">
                    <p class="panel-kicker">Notes Unavailable</p>
                    <h3>学习笔记预览暂时不可用</h3>
                    <p>${escapeHtml(error.message)}</p>
                </article>
            `;
            revealOnScroll();
        }
    }
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
        return "No date";
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
