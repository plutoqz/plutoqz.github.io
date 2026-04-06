const searchInput = document.getElementById("notes-search");
const categoryBar = document.getElementById("category-bar");
const notesGrid = document.getElementById("notes-grid");
const resultTitle = document.getElementById("notes-result-title");
const resultMeta = document.getElementById("notes-result-meta");
const totalNotes = document.getElementById("total-notes");
const totalCategories = document.getElementById("total-categories");
const params = new URLSearchParams(window.location.search);

let manifest = { notes: [], categories: [] };
let activeCategory = params.get("category") || "all";
let searchKeyword = "";

loadNotesPage();

async function loadNotesPage() {
    try {
        manifest = await window.notesUtils.loadNotesIndex();
        totalNotes.textContent = String(manifest.notes.length);
        totalCategories.textContent = String(manifest.categories.length);
        renderCategories();
        renderNotes();
    } catch (error) {
        notesGrid.innerHTML = `
            <article class="note-card note-card-empty">
                <p class="eyebrow">Unavailable</p>
                <h3>笔记清单读取失败</h3>
                <p>${window.notesUtils.escapeHtml(error.message)}</p>
            </article>
        `;
        resultMeta.textContent = "无法读取 notes-manifest.json";
    }
}

searchInput.addEventListener("input", (event) => {
    searchKeyword = event.target.value.trim().toLowerCase();
    renderNotes();
});

function renderCategories() {
    const categoryItems = [{ key: "all", label: "全部", count: manifest.notes.length }, ...manifest.categories];
    categoryBar.innerHTML = categoryItems
        .map(
            (category) => `
                <button
                    class="category-chip ${category.key === activeCategory ? "is-active" : ""}"
                    type="button"
                    data-category="${category.key}">
                    ${window.notesUtils.escapeHtml(category.label)}
                    <span>${category.count}</span>
                </button>
            `
        )
        .join("");

    categoryBar.querySelectorAll("[data-category]").forEach((button) => {
        button.addEventListener("click", () => {
            activeCategory = button.dataset.category;
            const nextUrl = new URL(window.location.href);
            if (activeCategory === "all") {
                nextUrl.searchParams.delete("category");
            } else {
                nextUrl.searchParams.set("category", activeCategory);
            }
            window.history.replaceState({}, "", `${nextUrl.pathname}${nextUrl.search}`);
            renderCategories();
            renderNotes();
        });
    });
}

function renderNotes() {
    const notes = manifest.notes.filter((note) => {
        const matchCategory = activeCategory === "all" || note.category === activeCategory;
        const haystack = [note.title, note.summary, ...(note.tags || [])].join(" ").toLowerCase();
        const matchSearch = !searchKeyword || haystack.includes(searchKeyword);
        return matchCategory && matchSearch;
    });

    resultTitle.textContent = activeCategory === "all"
        ? "全部笔记"
        : `${findCategoryLabel(activeCategory)} 分类`;
    resultMeta.textContent = `共 ${notes.length} 篇结果`;

    if (notes.length === 0) {
        notesGrid.innerHTML = `
                <article class="note-card note-card-empty">
                    <p class="eyebrow">No Result</p>
                    <h3>没有匹配的笔记</h3>
                    <p>试试切换分类，或者换一个关键词。</p>
                </article>
            `;
        return;
    }

    notesGrid.innerHTML = notes
        .map(
            (note) => `
                <article class="note-card">
                    <header>
                        <div>
                            <p class="eyebrow">${window.notesUtils.escapeHtml(note.categoryLabel)}</p>
                            <h3>${window.notesUtils.escapeHtml(note.title)}</h3>
                        </div>
                        <div class="note-meta">
                            <span>${window.notesUtils.formatDate(note.date)}</span>
                        </div>
                    </header>
                    <p>${window.notesUtils.escapeHtml(note.summary)}</p>
                    <div class="note-meta">
                        ${(note.tags || []).map((tag) => `<span>${window.notesUtils.escapeHtml(tag)}</span>`).join("")}
                    </div>
                    <a class="note-link" href="${note.url}">阅读笔记</a>
                </article>
            `
        )
        .join("");
}

function findCategoryLabel(key) {
    const category = manifest.categories.find((item) => item.key === key);
    return category ? category.label : key;
}
