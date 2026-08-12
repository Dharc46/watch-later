const singleForm = document.getElementById("single-form");
const singleInput = document.getElementById("single-input");
const singleFeedback = document.getElementById("single-feedback");
const bulkForm = document.getElementById("bulk-form");
const bulkInput = document.getElementById("bulk-input");
const bulkFeedback = document.getElementById("bulk-feedback");
const listEl = document.getElementById("movie-list");
const emptyStateEl = document.getElementById("empty-state");
const countEl = document.getElementById("movie-count");
const template = document.getElementById("movie-row-template");
const labelDialog = document.getElementById("label-dialog");
const labelDialogTitleEl = document.getElementById("label-dialog-title");
const labelOptionsEl = document.getElementById("label-options");
const labelOptionButtons = [...labelOptionsEl.querySelectorAll(".label-option")];
const pendingItemTitleEl = document.getElementById("pending-item-title");
const labelDialogCancel = document.getElementById("label-dialog-cancel");
const ITEMS_API_URL = "/api/items";
const LAST_TAG_STORAGE_KEY = "watchLaterLastTag";
const TAG_OPTIONS = [
    { value: "game", label: "Game" },
    { value: "movie", label: "Movie" },
    { value: "app", label: "App" },
    { value: "comic", label: "Comic" },
    { value: "anime", label: "Anime" },
    { value: "cartoon", label: "Cartoon" },
    { value: "person", label: "Person" },
];
const DEFAULT_TAG = "movie";
const TAG_ORDER = {
    game: 0,
    movie: 1,
    app: 2,
    comic: 3,
    anime: 4,
    cartoon: 5,
    person: 6,
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
let pendingEditItem = null;
let lastSelectedTag = DEFAULT_TAG;

const findLabelOptionIndex = (tag) => {
    const index = labelOptionButtons.findIndex((button) => button.dataset.tag === tag);
    return index === -1 ? 0 : index;
};

let selectedLabelIndex = findLabelOptionIndex(DEFAULT_TAG);

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
    fetch(ITEMS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state.items),
    }).catch((error) => {
        console.error("Không thể lưu dữ liệu vào file database trên server", error);
    });
};

const persistLastSelectedTag = (tag) => {
    lastSelectedTag = normalizeTag(tag);
    try {
        localStorage.setItem(LAST_TAG_STORAGE_KEY, lastSelectedTag);
    } catch (error) {
        console.error("KhÃ´ng thá»ƒ lÆ°u tag Ä‘Ã£ chá»n vÃ o localStorage", error);
    }
};

const hydrateState = async () => {
    try {
        const storedTag = localStorage.getItem(LAST_TAG_STORAGE_KEY);
        if (storedTag) lastSelectedTag = normalizeTag(storedTag);
    } catch (error) {
        console.error("Không thể đọc tag đã chọn từ localStorage", error);
    }

    try {
        const response = await fetch(ITEMS_API_URL);
        if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
        const parsed = await response.json();
        if (Array.isArray(parsed)) {
            state.items = parsed.map(normalizeStoredItem).filter(Boolean);
            sortItems();
        }
    } catch (error) {
        console.error("Không thể đọc dữ liệu từ file database trên server", error);
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
        tagEl.dataset.title = item.title;
        tagEl.dataset.tag = normalizeTag(item.tag);
        tagEl.setAttribute("role", "button");
        tagEl.tabIndex = 0;
        tagEl.setAttribute("aria-label", `Sửa nhãn của ${item.title}`);
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
    pendingEditItem = null;
    labelDialog.close();
    singleInput.focus();
};

const choosePendingLabel = (tag) => {
    if (pendingEditItem) {
        const item = pendingEditItem;
        const normalizedTag = normalizeTag(tag);
        const duplicate = state.items.some(
            (entry) =>
                entry !== item &&
                normalizeTitle(entry.title) === normalizeTitle(item.title) &&
                normalizeTag(entry.tag) === normalizedTag
        );
        pendingEditItem = null;
        labelDialog.close();
        if (duplicate) {
            setFeedback("Mục này đã có trong danh sách với nhãn đó.", "error");
            return;
        }
        item.tag = normalizedTag;
        sortItems();
        renderList();
        persistState();
        return;
    }

    if (!pendingSingleTitle) return;
    const title = pendingSingleTitle;
    persistLastSelectedTag(tag);
    pendingSingleTitle = "";
    labelDialog.close();
    const result = addItem(title, lastSelectedTag);
    if (result.status === "added" || result.status === "duplicate") {
        singleInput.value = "";
    }
    singleInput.focus();
};

const openLabelDialog = (title) => {
    pendingSingleTitle = title;
    labelDialogTitleEl.textContent = "Mục này thuộc loại nào?";
    pendingItemTitleEl.textContent = toTitleCase(title);
    setFeedback("", "");
    labelDialog.showModal();
    updateLabelSelection(findLabelOptionIndex(lastSelectedTag));
};

const openEditLabelDialog = (item) => {
    pendingEditItem = item;
    labelDialogTitleEl.textContent = "Đổi nhãn cho mục này?";
    pendingItemTitleEl.textContent = toTitleCase(item.title);
    labelDialog.showModal();
    updateLabelSelection(findLabelOptionIndex(normalizeTag(item.tag)));
};

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

    if (key === "arrowdown" || key === "arrowright" || key === "s" || key === "d") {
        event.preventDefault();
        updateLabelSelection(selectedLabelIndex + 1);
    } else if (key === "arrowup" || key === "arrowleft" || key === "w" || key === "a") {
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

const findItemByTagEl = (tagTarget) =>
    state.items.find(
        (entry) => entry.title === tagTarget.dataset.title && normalizeTag(entry.tag) === tagTarget.dataset.tag
    );

listEl.addEventListener("click", (event) => {
    if (event.target.closest("button.delete")) {
        const btn = event.target.closest("button.delete");
        removeItem(btn.dataset.title, btn.dataset.tag);
        return;
    }

    const tagTarget = event.target.closest(".tag");
    if (tagTarget) {
        const item = findItemByTagEl(tagTarget);
        if (item) openEditLabelDialog(item);
    }
});

listEl.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (key !== "enter" && key !== " ") return;
    const tagTarget = event.target.closest(".tag");
    if (!tagTarget) return;
    event.preventDefault();
    const item = findItemByTagEl(tagTarget);
    if (item) openEditLabelDialog(item);
});

const init = async () => {
    await hydrateState();
    renderList();
};

init();
