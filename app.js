const singleForm = document.getElementById("single-form");
const singleInput = document.getElementById("single-input");
const singleFeedback = document.getElementById("single-feedback");
const bulkForm = document.getElementById("bulk-form");
const bulkInput = document.getElementById("bulk-input");
const bulkFeedback = document.getElementById("bulk-feedback");
const exportButton = document.getElementById("export-button");
const importButton = document.getElementById("import-button");
const importInput = document.getElementById("import-file");
const transferFeedback = document.getElementById("transfer-feedback");
const listEl = document.getElementById("movie-list");
const emptyStateEl = document.getElementById("empty-state");
const countEl = document.getElementById("movie-count");
const template = document.getElementById("movie-row-template");
const labelDialog = document.getElementById("label-dialog");
const labelOptionsEl = document.getElementById("label-options");
const labelOptionButtons = [...labelOptionsEl.querySelectorAll(".label-option")];
const pendingItemTitleEl = document.getElementById("pending-item-title");
const labelDialogCancel = document.getElementById("label-dialog-cancel");
const STORAGE_KEY = "watchLaterMovies";
const TAG_OPTIONS = [
    { value: "game", label: "Game" },
    { value: "movie", label: "Movie" },
    { value: "app", label: "App" },
    { value: "comic", label: "Comic" },
];
const DEFAULT_TAG = "movie";
const TAG_ORDER = {
    game: 0,
    movie: 1,
    app: 2,
    comic: 3,
};

const collapseSpaces = (text) => text.trim().replace(/\s+/g, " ");

const normalizeTag = (tag) => {
    const value = typeof tag === "string" ? tag.toLowerCase() : "";
    return TAG_OPTIONS.some((option) => option.value === value) ? value : DEFAULT_TAG;
};

const formatTag = (tag) => {
    const normalized = normalizeTag(tag);
    const option = TAG_OPTIONS.find((item) => item.value === normalized);
    return option ? option.label : "Movie";
};

const slugToText = (slug) =>
    collapseSpaces(
        decodeURIComponent(slug)
            .replace(/[-_]+/g, " ")
            .replace(/\.+/g, " ")
    );

const extractUrlToken = (rawUrl) => {
    try {
        const normalizedUrl = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
        const parsedUrl = new URL(normalizedUrl);
        const host = parsedUrl.hostname.replace(/^www\./i, "").toLowerCase();

        if (host === "nhentai.net") {
            const galleryMatch = parsedUrl.pathname.match(/^\/g\/(\d+)(?:\/|$)/i);
            if (galleryMatch) return galleryMatch[1];
        }

        if (host === "vlogtruyen.net") {
            const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
            if (pathParts.length > 0) {
                return slugToText(pathParts[0]);
            }
        }
    } catch (error) {
        return "";
    }

    return "";
};

const stripUrls = (text) =>
    text
        .replace(/(?:https?:\/\/|www\.)\S+/gi, (match) => {
            const token = extractUrlToken(match);
            return token ? ` ${token} ` : " ";
        })
        .replace(/\s*[-–—:]\s*$/, "");

const sanitizeInput = (text) => collapseSpaces(stripUrls(text));

const toTitleCase = (text) =>
    sanitizeInput(text)
        .split(" ")
        .map((word) =>
            word
                ? word.slice(0, 1).toLocaleUpperCase("vi-VN") + word.slice(1).toLocaleLowerCase("vi-VN")
                : ""
        )
        .join(" ");

const state = {
    items: [],
};

let pendingSingleTitle = "";
let selectedLabelIndex = TAG_OPTIONS.findIndex((option) => option.value === DEFAULT_TAG);

const normalizeStoredItem = (item) => {
    if (typeof item === "string") {
        const title = toTitleCase(item);
        return title ? { title, tag: DEFAULT_TAG } : null;
    }

    if (!item || typeof item !== "object") return null;

    const title = typeof item.title === "string" ? toTitleCase(item.title) : "";
    if (!title) return null;

    return {
        title,
        tag: normalizeTag(item.tag),
    };
};

const persistState = () => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch (error) {
        console.error("Không thể lưu dữ liệu vào localStorage", error);
    }
};

const hydrateState = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            state.items = parsed.map(normalizeStoredItem).filter(Boolean);
            sortItems();
        }
    } catch (error) {
        console.error("Không thể đọc dữ liệu từ localStorage", error);
    }
};

const normalizeTitle = (title) => sanitizeInput(title).toLocaleLowerCase("vi-VN");

const sortItems = () => {
    state.items.sort((a, b) => {
        const titleResult = a.title.localeCompare(b.title, "vi", { sensitivity: "base" });
        if (titleResult !== 0) return titleResult;
        return TAG_ORDER[a.tag] - TAG_ORDER[b.tag];
    });
};

const renderList = () => {
    listEl.innerHTML = "";

    if (state.items.length === 0) {
        emptyStateEl.hidden = false;
        countEl.textContent = "0";
        return;
    }

    emptyStateEl.hidden = true;
    countEl.textContent = state.items.length.toString();

    state.items.forEach((item, idx) => {
        const clone = template.content.firstElementChild.cloneNode(true);
        clone.querySelector(".index").textContent = idx + 1;
        clone.querySelector(".title").textContent = item.title;
        const tagEl = clone.querySelector(".tag");
        tagEl.textContent = formatTag(item.tag);
        tagEl.classList.add(`tag--${normalizeTag(item.tag)}`);
        const deleteBtn = clone.querySelector(".delete");
        deleteBtn.dataset.title = item.title;
        deleteBtn.dataset.tag = normalizeTag(item.tag);
        deleteBtn.setAttribute("aria-label", `Xóa ${formatTag(item.tag).toLowerCase()} ${item.title}`);
        listEl.appendChild(clone);
    });
};

const addItem = (title, tag, { silent = false } = {}) => {
    const cleaned = sanitizeInput(title);
    if (!cleaned) {
        if (!silent) setFeedback("Vui lòng nhập tên mục.", "error");
        return { status: "empty" };
    }

    const normalizedTag = normalizeTag(tag);
    const normalized = normalizeTitle(cleaned);
    const exists = state.items.some(
        (item) => normalizeTitle(item.title) === normalized && normalizeTag(item.tag) === normalizedTag
    );

    if (exists) {
        if (!silent) setFeedback("Mục này đã có trong danh sách.", "error");
        return { status: "duplicate" };
    }

    const formatted = toTitleCase(cleaned);
    state.items.push({ title: formatted, tag: normalizedTag });
    sortItems();
    renderList();
    persistState();

    if (!silent) setFeedback("Đã thêm thành công!", "success");
    return { status: "added" };
};

const createExportPayload = () => ({
    version: 1,
    exportedAt: new Date().toISOString(),
    items: state.items.map((item) => ({
        title: item.title,
        tag: normalizeTag(item.tag),
    })),
});

const downloadJsonFile = (filename, data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
};

const importItems = (items) => {
    const incoming = Array.isArray(items) ? items.map(normalizeStoredItem).filter(Boolean) : [];
    if (incoming.length === 0) {
        return { addedCount: 0, duplicateCount: 0, invalidCount: 0 };
    }

    const existingKeys = new Set(
        state.items.map((item) => `${normalizeTitle(item.title)}|${normalizeTag(item.tag)}`)
    );
    let addedCount = 0;
    let duplicateCount = 0;

    incoming.forEach((item) => {
        const key = `${normalizeTitle(item.title)}|${normalizeTag(item.tag)}`;
        if (existingKeys.has(key)) {
            duplicateCount += 1;
            return;
        }

        existingKeys.add(key);
        state.items.push({ title: item.title, tag: normalizeTag(item.tag) });
        addedCount += 1;
    });

    sortItems();
    renderList();
    persistState();

    return { addedCount, duplicateCount, invalidCount: 0 };
};

const setTransferFeedback = (message, type) => {
    transferFeedback.textContent = message;
    transferFeedback.className = type ? type : "";
};

const setBulkFeedback = (message, type) => {
    bulkFeedback.textContent = message;
    bulkFeedback.className = type ? type : "";
};

const removeItem = (title, tag) => {
    const index = state.items.findIndex(
        (item) => item.title === title && normalizeTag(item.tag) === normalizeTag(tag)
    );
    if (index === -1) return;
    state.items.splice(index, 1);
    renderList();
    persistState();
};

const getSelectedTag = (selectId) => normalizeTag(document.getElementById(selectId).value);

const setFeedback = (message, type) => {
    singleFeedback.textContent = message;
    singleFeedback.className = type ? type : "";
};

const updateLabelSelection = (nextIndex, { focus = true } = {}) => {
    selectedLabelIndex = (nextIndex + labelOptionButtons.length) % labelOptionButtons.length;
    labelOptionButtons.forEach((button, index) => {
        const selected = index === selectedLabelIndex;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-selected", selected.toString());
        button.tabIndex = selected ? 0 : -1;
    });

    if (focus) labelOptionButtons[selectedLabelIndex].focus();
};

const closeLabelDialog = () => {
    pendingSingleTitle = "";
    labelDialog.close();
    singleInput.focus();
};

const choosePendingLabel = (tag) => {
    if (!pendingSingleTitle) return;
    const title = pendingSingleTitle;
    pendingSingleTitle = "";
    labelDialog.close();
    const result = addItem(title, tag);
    if (result.status === "added") singleInput.value = "";
    singleInput.focus();
};

const openLabelDialog = (title) => {
    pendingSingleTitle = title;
    pendingItemTitleEl.textContent = toTitleCase(title);
    setFeedback("", "");
    labelDialog.showModal();
    updateLabelSelection(TAG_OPTIONS.findIndex((option) => option.value === DEFAULT_TAG));
};

exportButton.addEventListener("click", () => {
    const exportData = createExportPayload();
    const stamp = new Date().toISOString().slice(0, 10);
    downloadJsonFile(`watch-later-${stamp}.json`, exportData);
    setTransferFeedback("Đã xuất dữ liệu JSON.", "success");
});

importButton.addEventListener("click", () => {
    importInput.click();
});

importInput.addEventListener("change", async () => {
    const [file] = importInput.files || [];
    importInput.value = "";

    if (!file) return;

    try {
        const raw = await file.text();
        const parsed = JSON.parse(raw);
        const payloadItems = Array.isArray(parsed)
            ? parsed
            : Array.isArray(parsed?.items)
                ? parsed.items
                : null;

        if (!payloadItems) {
            setTransferFeedback("Tệp JSON không đúng định dạng.", "error");
            return;
        }

        const result = importItems(payloadItems);
        if (result.addedCount === 0 && result.duplicateCount > 0) {
            setTransferFeedback("Không có mục mới nào để nhập.", "error");
            return;
        }

        setTransferFeedback(
            `Đã nhập ${result.addedCount} mục${result.duplicateCount > 0 ? `, bỏ qua ${result.duplicateCount} mục trùng` : ""}.`,
            result.addedCount > 0 ? "success" : "error"
        );
    } catch (error) {
        console.error("Không thể nhập dữ liệu từ tệp JSON", error);
        setTransferFeedback("Không thể đọc tệp JSON.", "error");
    }
});

singleForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const cleaned = sanitizeInput(singleInput.value);
    if (!cleaned) {
        setFeedback("Vui lòng nhập tên mục.", "error");
        return;
    }
    openLabelDialog(cleaned);
});

labelOptionsEl.addEventListener("click", (event) => {
    const option = event.target.closest(".label-option");
    if (option) choosePendingLabel(option.dataset.tag);
});

labelOptionsEl.addEventListener("mousemove", (event) => {
    const option = event.target.closest(".label-option");
    if (!option) return;
    updateLabelSelection(labelOptionButtons.indexOf(option), { focus: false });
});

labelDialog.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (event.target === labelDialogCancel && key === "enter") return;

    if (key === "arrowdown" || key === "s") {
        event.preventDefault();
        updateLabelSelection(selectedLabelIndex + 1);
    } else if (key === "arrowup" || key === "w") {
        event.preventDefault();
        updateLabelSelection(selectedLabelIndex - 1);
    } else if (key === "enter") {
        event.preventDefault();
        choosePendingLabel(labelOptionButtons[selectedLabelIndex].dataset.tag);
    }
});

labelDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeLabelDialog();
});

labelDialogCancel.addEventListener("click", closeLabelDialog);

bulkForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const bulkTag = getSelectedTag("bulk-tag");
    const raw = bulkInput.value;
    if (!raw.trim()) {
        bulkInput.value = "";
        setBulkFeedback("Vui lòng nhập ít nhất một tên mục.", "error");
        return;
    }

    const entries = raw
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean);

    if (entries.length === 0) {
        bulkInput.value = "";
        setBulkFeedback("Không có mục hợp lệ để thêm.", "error");
        return;
    }

    let addedCount = 0;
    let duplicateCount = 0;
    let emptyCount = 0;

    entries.forEach((entry) => {
        const result = addItem(entry, bulkTag, { silent: true });
        if (result.status === "added") addedCount += 1;
        if (result.status === "duplicate") duplicateCount += 1;
        if (result.status === "empty") emptyCount += 1;
    });

    bulkInput.value = "";

    if (addedCount === 0 && duplicateCount > 0) {
        setBulkFeedback(`Không thêm mục mới nào. ${duplicateCount} mục đã có sẵn.`, "error");
        return;
    }

    const parts = [];
    if (addedCount > 0) parts.push(`Đã thêm ${addedCount} mục`);
    if (duplicateCount > 0) parts.push(`${duplicateCount} mục trùng đã bỏ qua`);
    if (emptyCount > 0) parts.push(`${emptyCount} mục rỗng đã bỏ qua`);

    setBulkFeedback(parts.join(". ") + ".", addedCount > 0 ? "success" : "error");
});

listEl.addEventListener("click", (event) => {
    if (event.target.closest("button.delete")) {
        const btn = event.target.closest("button.delete");
        removeItem(btn.dataset.title, btn.dataset.tag);
    }
});

hydrateState();
renderList();
