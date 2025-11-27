const singleForm = document.getElementById("single-form");
const singleInput = document.getElementById("single-input");
const singleFeedback = document.getElementById("single-feedback");
const bulkForm = document.getElementById("bulk-form");
const bulkInput = document.getElementById("bulk-input");
const listEl = document.getElementById("movie-list");
const emptyStateEl = document.getElementById("empty-state");
const countEl = document.getElementById("movie-count");
const template = document.getElementById("movie-row-template");
const STORAGE_KEY = "watchLaterMovies";

const collapseSpaces = (text) => text.trim().replace(/\s+/g, " ");

const toTitleCase = (text) =>
    collapseSpaces(text)
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

const normalizeTitle = (title) => collapseSpaces(title).toLocaleLowerCase("vi-VN");

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
    const cleaned = collapseSpaces(title);
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
        return;
    }

    const entries = raw
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean);

    entries.forEach((entry) => addMovie(entry, { silent: true }));
    bulkInput.value = "";
});

listEl.addEventListener("click", (event) => {
    if (event.target.closest("button.delete")) {
        const btn = event.target.closest("button.delete");
        removeMovie(btn.dataset.title);
    }
});

hydrateState();
renderList();
