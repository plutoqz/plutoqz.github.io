const NOTES_REPO = {
    owner: "plutoqz",
    repo: "plutoqz.github.io",
    branch: "main",
    notesRoot: "notes/"
};

const sourceParams = new URLSearchParams(window.location.search);
const forcedSource = sourceParams.get("source");

window.notesUtils = {
    _notesPromise: null,

    async loadNotesIndex() {
        if (!this._notesPromise) {
            this._notesPromise = this.resolveNotesIndex();
        }

        return this._notesPromise;
    },

    async resolveNotesIndex() {
        const strategies = [];
        const preferredSource = this.getPreferredSource();

        if (preferredSource === "github") {
            strategies.push({ name: "github", run: () => this.loadFromGitHub() });
            strategies.push({ name: "manifest", run: () => this.loadFromManifest() });
        } else if (preferredSource === "manifest") {
            strategies.push({ name: "manifest", run: () => this.loadFromManifest() });
            strategies.push({ name: "github", run: () => this.loadFromGitHub() });
        } else {
            if (!this.isLocalPreview()) {
                strategies.push({ name: "github", run: () => this.loadFromGitHub() });
            }

            strategies.push({ name: "manifest", run: () => this.loadFromManifest() });

            if (this.isLocalPreview()) {
                strategies.push({ name: "github", run: () => this.loadFromGitHub() });
            }
        }

        let lastError = null;

        for (const strategy of strategies) {
            try {
                const result = await strategy.run();
                if (strategy.name === "github" && (!Array.isArray(result.notes) || result.notes.length === 0)) {
                    continue;
                }

                return result;
            } catch (error) {
                lastError = error;
            }
        }

        throw lastError ?? new Error("No notes source available.");
    },

    getPreferredSource() {
        if (forcedSource === "github" || forcedSource === "manifest") {
            return forcedSource;
        }

        return this.isLocalPreview() ? "manifest" : "github";
    },

    isLocalPreview() {
        return location.protocol === "file:" || ["localhost", "127.0.0.1"].includes(location.hostname);
    },

    async loadFromManifest() {
        const response = await fetch("notes-manifest.json", { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`Manifest request failed: ${response.status}`);
        }

        const manifest = await response.json();
        return this.normalizeManifest(manifest, "manifest");
    },

    async loadFromGitHub() {
        const treeUrl = `https://api.github.com/repos/${NOTES_REPO.owner}/${NOTES_REPO.repo}/git/trees/${NOTES_REPO.branch}?recursive=1`;
        const treeResponse = await this.fetchJson(treeUrl);
        const noteEntries = (treeResponse.tree || []).filter((entry) => (
            entry.type === "blob"
            && entry.path.startsWith(NOTES_REPO.notesRoot)
            && entry.path.endsWith(".md")
            && !/README\.md$/i.test(entry.path)
        ));

        const notes = await Promise.all(
            noteEntries.map((entry) => this.buildNoteFromGitHubBlob(entry))
        );

        notes.sort((left, right) => {
            const dateOrder = String(right.date || "").localeCompare(String(left.date || ""));
            if (dateOrder !== 0) {
                return dateOrder;
            }

            return left.title.localeCompare(right.title, "zh-CN");
        });

        const categoriesMap = new Map();
        notes.forEach((note) => {
            const existing = categoriesMap.get(note.category) ?? {
                key: note.category,
                label: note.categoryLabel,
                count: 0
            };
            existing.count += 1;
            categoriesMap.set(note.category, existing);
        });

        return {
            generatedAt: new Date().toISOString(),
            source: "github",
            notes,
            categories: [...categoriesMap.values()].sort((left, right) => left.label.localeCompare(right.label, "zh-CN"))
        };
    },

    async buildNoteFromGitHubBlob(entry) {
        const blob = await this.fetchJson(entry.url);
        const raw = this.decodeBase64(blob.content || "");
        const parsed = this.parseFrontMatter(raw);
        const relativeInsideNotes = entry.path.slice(NOTES_REPO.notesRoot.length);
        const parts = relativeInsideNotes.split("/");
        const fileName = parts[parts.length - 1].replace(/\.md$/i, "");
        const category = parts.length > 1 ? parts[0] : "general";
        const headings = this.extractHeadings(parsed.body);
        const title = String(parsed.attributes.title || headings[0]?.text || this.humanize(fileName));
        const summary = String(parsed.attributes.summary || this.extractSummary(parsed.body));
        const tags = this.normalizeArray(parsed.attributes.tags);
        const date = String(parsed.attributes.date || "");
        const categoryLabel = String(parsed.attributes.categoryLabel || this.humanize(category));

        return {
            path: entry.path,
            url: this.buildNoteUrl(entry.path),
            slug: fileName,
            category,
            categoryLabel,
            title,
            summary,
            date,
            tags,
            body: parsed.body
        };
    },

    normalizeManifest(manifest, source) {
        const notes = Array.isArray(manifest.notes) ? manifest.notes.map((note) => ({
            ...note,
            url: this.buildNoteUrl(note.path)
        })) : [];

        const categories = Array.isArray(manifest.categories) ? manifest.categories : [];

        return {
            generatedAt: manifest.generatedAt || "",
            source,
            notes,
            categories
        };
    },

    async loadNoteDocument(notePath) {
        const manifest = await this.loadNotesIndex();
        const note = manifest.notes.find((item) => item.path === notePath);

        if (!note) {
            throw new Error("没有找到对应的笔记记录。");
        }

        if (note.body) {
            return {
                manifest,
                note,
                parsed: {
                    attributes: {},
                    body: note.body
                }
            };
        }

        const response = await fetch(notePath, { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`Note request failed: ${response.status}`);
        }

        const raw = await response.text();
        return {
            manifest,
            note,
            parsed: this.parseFrontMatter(raw)
        };
    },

    async fetchJson(url) {
        const response = await fetch(url, {
            cache: "no-store",
            headers: {
                Accept: "application/vnd.github+json"
            }
        });

        if (!response.ok) {
            throw new Error(`GitHub API request failed: ${response.status}`);
        }

        return response.json();
    },

    decodeBase64(value) {
        const binary = atob(String(value).replace(/\n/g, ""));
        const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
        return new TextDecoder("utf-8").decode(bytes);
    },

    buildNoteUrl(notePath) {
        const url = new URL("note.html", window.location.href);
        url.searchParams.set("path", notePath);

        if (forcedSource === "github" || forcedSource === "manifest") {
            url.searchParams.set("source", forcedSource);
        }

        return `${url.pathname.split("/").pop()}${url.search}`;
    },

    appendSourceParam(url) {
        if (forcedSource !== "github" && forcedSource !== "manifest") {
            return url;
        }

        const target = new URL(url, window.location.href);
        target.searchParams.set("source", forcedSource);
        return `${target.pathname.split("/").pop()}${target.search}`;
    },

    parseFrontMatter(raw) {
        const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
        if (!match) {
            return { attributes: {}, body: raw };
        }

        const attributes = {};
        let activeArrayKey = null;

        match[1].split(/\r?\n/).forEach((line) => {
            const itemMatch = line.match(/^\s*-\s*(.+)$/);
            if (itemMatch && activeArrayKey) {
                if (!Array.isArray(attributes[activeArrayKey])) {
                    attributes[activeArrayKey] = [];
                }
                attributes[activeArrayKey].push(itemMatch[1].trim());
                return;
            }

            const keyValueMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
            if (!keyValueMatch) {
                activeArrayKey = null;
                return;
            }

            const [, key, rawValue] = keyValueMatch;
            const value = rawValue.trim();

            if (!value) {
                attributes[key] = [];
                activeArrayKey = key;
                return;
            }

            activeArrayKey = null;
            attributes[key] = this.normalizeValue(key, value);
        });

        return {
            attributes,
            body: raw.slice(match[0].length)
        };
    },

    normalizeValue(key, value) {
        if (key === "tags" && value.startsWith("[") && value.endsWith("]")) {
            return value
                .slice(1, -1)
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean);
        }

        if (key === "tags" && value.includes(",") && !value.includes("://")) {
            return value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean);
        }

        return value;
    },

    normalizeArray(value) {
        if (!value) {
            return [];
        }

        return Array.isArray(value) ? value.map(String) : [String(value)];
    },

    extractHeadings(body) {
        return body
            .split(/\r?\n/)
            .map((line) => line.match(/^(#{1,6})\s+(.+)$/))
            .filter(Boolean)
            .map((match) => ({
                depth: match[1].length,
                text: match[2].trim()
            }));
    },

    extractSummary(body) {
        const cleaned = body
            .replace(/```[\s\S]*?```/g, " ")
            .split(/\r?\n/)
            .map((line) => line.trim())
            .find((line) => line && !line.startsWith("#"));

        if (!cleaned) {
            return "No summary available.";
        }

        return cleaned.length > 120 ? `${cleaned.slice(0, 117)}...` : cleaned;
    },

    humanize(input) {
        if (!input) {
            return "General";
        }

        if (/[\u4e00-\u9fa5]/.test(input)) {
            return input;
        }

        return input
            .replace(/[-_]+/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase());
    },

    slugify(text) {
        return String(text)
            .trim()
            .toLowerCase()
            .replace(/[`~!@#$%^&*()+={}[\]|\\:;"'<>,.?/]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");
    },

    formatDate(value) {
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
    },

    escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }
};
