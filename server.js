const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3001;
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, "data");
const DATA_FILE = path.join(DATA_DIR, "watchlist.json");

const MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
};

const ensureDataFile = () => {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]", "utf-8");
};

const readItems = () => {
    ensureDataFile();
    try {
        const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
};

const writeItems = (items) => {
    ensureDataFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 4), "utf-8");
};

const sendJson = (res, statusCode, data) => {
    res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(data));
};

const serveStatic = (req, res) => {
    const urlPath = req.url === "/" ? "/index.html" : req.url.split("?")[0];
    const filePath = path.join(ROOT_DIR, decodeURIComponent(urlPath));

    if (!filePath.startsWith(ROOT_DIR)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            res.writeHead(404);
            res.end("Not found");
            return;
        }
        res.writeHead(200, { "Content-Type": MIME_TYPES[path.extname(filePath)] || "application/octet-stream" });
        res.end(content);
    });
};

const server = http.createServer((req, res) => {
    if (req.url === "/api/items" && req.method === "GET") {
        sendJson(res, 200, readItems());
        return;
    }

    if (req.url === "/api/items" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => {
            body += chunk;
        });
        req.on("end", () => {
            try {
                const parsed = JSON.parse(body || "[]");
                if (!Array.isArray(parsed)) throw new Error("Payload must be an array");
                writeItems(parsed);
                sendJson(res, 200, { status: "ok" });
            } catch (error) {
                sendJson(res, 400, { status: "error", message: "Dữ liệu không hợp lệ" });
            }
        });
        return;
    }

    serveStatic(req, res);
});

server.listen(PORT, () => {
    console.log(`Watch later đang chạy tại http://localhost:${PORT}`);
});
