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
const STORAGE_KEY = "watchLaterMovies";

const collapseSpaces = (text) => text.trim().replace(/\s+/g, " ");

const extractUrlToken = (rawUrl) => {
    try {
        const normalizedUrl = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
        const parsedUrl = new URL(normalizedUrl);
        const host = parsedUrl.hostname.replace(/^www\./i, "").toLowerCase();

        if (host === "nhentai.net") {
            const galleryMatch = parsedUrl.pathname.match(/^\/g\/(\d+)(?:\/|$)/i);
            if (galleryMatch) return galleryMatch[1];
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
    movies: [],
};

const persistState = () => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.movies));
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
            state.movies = parsed
                .filter((item) => typeof item === "string")
                .map((item) => toTitleCase(item));
            sortMovies();
        }
    } catch (error) {
        console.error("Không thể đọc dữ liệu từ localStorage", error);
    }
};

const normalizeTitle = (title) => sanitizeInput(title).toLocaleLowerCase("vi-VN");

const sortMovies = () => {
    state.movies.sort((a, b) => a.localeCompare(b, "vi", { sensitivity: "base" }));
};

const renderList = () => {
    listEl.innerHTML = "";

    if (state.movies.length === 0) {
        emptyStateEl.hidden = false;
        countEl.textContent = "0";
        return;
    }

    emptyStateEl.hidden = true;
    countEl.textContent = state.movies.length.toString();

    state.movies.forEach((title, idx) => {
        const clone = template.content.firstElementChild.cloneNode(true);
        clone.querySelector(".index").textContent = idx + 1;
        clone.querySelector(".title").textContent = title;
        const deleteBtn = clone.querySelector(".delete");
        deleteBtn.dataset.title = title;
        listEl.appendChild(clone);
    });
};

const addMovie = (title, { silent = false } = {}) => {
    const cleaned = sanitizeInput(title);
    if (!cleaned) {
        if (!silent) setFeedback("Vui lòng nhập tên phim.", "error");
        return { status: "empty" };
    }

    const normalized = normalizeTitle(cleaned);
    const exists = state.movies.some((movie) => normalizeTitle(movie) === normalized);

    if (exists) {
        if (!silent) setFeedback("Phim đã có trong danh sách.", "error");
        return { status: "duplicate" };
    }

    const formatted = toTitleCase(cleaned);
    state.movies.push(formatted);
    sortMovies();
    renderList();
    persistState();

    if (!silent) setFeedback("Đã thêm thành công!", "success");
    return { status: "added" };
};

const setBulkFeedback = (message, type) => {
    bulkFeedback.textContent = message;
    bulkFeedback.className = type ? type : "";
};

const removeMovie = (title) => {
    const index = state.movies.findIndex((movie) => movie === title);
    if (index === -1) return;
    state.movies.splice(index, 1);
    renderList();
    persistState();
};

const setFeedback = (message, type) => {
    singleFeedback.textContent = message;
    singleFeedback.className = type ? type : "";
};

singleForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addMovie(singleInput.value);
    singleInput.value = "";
});

bulkForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const raw = bulkInput.value;
    if (!raw.trim()) {
        bulkInput.value = "";
        setBulkFeedback("Vui lòng nhập ít nhất một tên phim.", "error");
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
        const result = addMovie(entry, { silent: true });
        if (result.status === "added") addedCount += 1;
        if (result.status === "duplicate") duplicateCount += 1;
        if (result.status === "empty") emptyCount += 1;
    });

    bulkInput.value = "";

    if (addedCount === 0 && duplicateCount > 0) {
        setBulkFeedback(`Không thêm phim mới nào. ${duplicateCount} mục đã có sẵn.`, "error");
        return;
    }

    const parts = [];
    if (addedCount > 0) parts.push(`Đã thêm ${addedCount} phim`);
    if (duplicateCount > 0) parts.push(`${duplicateCount} mục trùng đã bỏ qua`);
    if (emptyCount > 0) parts.push(`${emptyCount} mục rỗng đã bỏ qua`);

    setBulkFeedback(parts.join(". ") + ".", addedCount > 0 ? "success" : "error");
});

listEl.addEventListener("click", (event) => {
    if (event.target.closest("button.delete")) {
        const btn = event.target.closest("button.delete");
        removeMovie(btn.dataset.title);
    }
});

hydrateState();
renderList();
