import { promises as fs } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const notesRoot = path.join(repoRoot, "notes");
const outputPath = path.join(repoRoot, "notes-manifest.json");

const notes = await collectNotes(notesRoot);
notes.sort((a, b) => String(b.date).localeCompare(String(a.date)));

const categoriesMap = new Map();
for (const note of notes) {
    const current = categoriesMap.get(note.category) ?? {
        key: note.category,
        label: note.categoryLabel,
        count: 0
    };
    current.count += 1;
    categoriesMap.set(note.category, current);
}

const manifest = {
    generatedAt: new Date().toISOString(),
    notes,
    categories: [...categoriesMap.values()].sort((a, b) => a.label.localeCompare(b.label, "zh-CN"))
};

await fs.writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

async function collectNotes(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const collected = [];

    for (const entry of entries) {
        const absolutePath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            collected.push(...await collectNotes(absolutePath));
            continue;
        }

        if (!entry.isFile() || !entry.name.endsWith(".md") || entry.name.toLowerCase() === "readme.md") {
            continue;
        }

        const relativePath = path.relative(repoRoot, absolutePath).replace(/\\/g, "/");
        const relativeInsideNotes = path.relative(notesRoot, absolutePath).replace(/\\/g, "/");
        const parts = relativeInsideNotes.split("/");
        const fileName = path.basename(entry.name, ".md");
        const raw = await fs.readFile(absolutePath, "utf8");
        const stats = await fs.stat(absolutePath);
        const parsed = parseFrontMatter(raw);
        const category = parts.length > 1 ? parts[0] : "general";
        const categoryLabel = String(parsed.attributes.categoryLabel || humanize(category));
        const headings = extractHeadings(parsed.body);
        const title = String(parsed.attributes.title || headings[0]?.text || humanize(fileName));
        const summary = String(parsed.attributes.summary || extractSummary(parsed.body));
        const tags = normalizeArray(parsed.attributes.tags);
        const date = String(parsed.attributes.date || stats.mtime.toISOString().slice(0, 10));

        collected.push({
            path: relativePath,
            url: `note.html?path=${encodeURIComponent(relativePath)}`,
            slug: fileName,
            category,
            categoryLabel,
            title,
            summary,
            date,
            tags
        });
    }

    return collected;
}

function parseFrontMatter(raw) {
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    if (!match) {
        return { attributes: {}, body: raw };
    }

    const attributes = {};
    let activeArrayKey = null;

    for (const line of match[1].split(/\r?\n/)) {
        const listItem = line.match(/^\s*-\s*(.+)$/);
        if (listItem && activeArrayKey) {
            attributes[activeArrayKey] ??= [];
            attributes[activeArrayKey].push(listItem[1].trim());
            continue;
        }

        const keyValue = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
        if (!keyValue) {
            activeArrayKey = null;
            continue;
        }

        const [, key, rawValue] = keyValue;
        const value = rawValue.trim();
        if (!value) {
            attributes[key] = [];
            activeArrayKey = key;
            continue;
        }

        activeArrayKey = null;
        attributes[key] = normalizeValue(key, value);
    }

    return {
        attributes,
        body: raw.slice(match[0].length)
    };
}

function normalizeValue(key, value) {
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
}

function normalizeArray(value) {
    if (!value) {
        return [];
    }

    return Array.isArray(value) ? value.map(String) : [String(value)];
}

function extractHeadings(body) {
    return body
        .split(/\r?\n/)
        .map((line) => line.match(/^(#{1,6})\s+(.+)$/))
        .filter(Boolean)
        .map((match) => ({
            depth: match[1].length,
            text: match[2].trim()
        }));
}

function extractSummary(body) {
    const cleaned = body
        .replace(/```[\s\S]*?```/g, " ")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find((line) => line && !line.startsWith("#"));

    if (!cleaned) {
        return "No summary available.";
    }

    return cleaned.length > 120 ? `${cleaned.slice(0, 117)}...` : cleaned;
}

function humanize(input) {
    if (!input) {
        return "General";
    }

    if (/[\u4e00-\u9fa5]/.test(input)) {
        return input;
    }

    return input
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}
