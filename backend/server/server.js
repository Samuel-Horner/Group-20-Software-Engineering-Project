import { createServer } from "http";
import { createReadStream } from "fs";

import config from "../config.js";

const HOBBY_OPTIONS = [
    "Gaming",
    "Photography",
    "Cooking",
    "Gardening",
    "Cycling",
    "Painting",
    "Music",
    "Woodworking"
];
//stub for recommendation logic here(for Ben)
export function getHobbyReccomendation(answers) {
    const total = answers.reduce((sum, value) => sum + value, 0);
    const index = Math.abs(total) % HOBBY_OPTIONS.length;
    return HOBBY_OPTIONS[index];
}

export function getMimeType(path) {
    // https://stackoverflow.com/questions/680929/how-to-extract-extension-from-filename-string-in-javascript
    const extention_regex = /(?:\.([^.]+))?$/;
    const ext = extention_regex.exec(path)[1];

    switch (ext) {
        case "html":
            return "text/html"
        case "css":
            return "text/css"
        case "js":
            return "text/javascript"
        case "json":
            return "application/json"
        case "png":
            return "image/png"
        case "jpg":
        case "jpeg":
            return "image/jpeg"
        case "svg":
            return "image/svg+xml"
        default:
            return "text/plain"
    }
}

async function getHandler(req, res) {
    console.log(`Recieved GET request for resource ${req.url}.`)

    // Get Resource Path
    let relative_path = req.url; // Path traversal vulnerable?
    if (relative_path && relative_path.includes("?")) {
        relative_path = relative_path.split("?")[0];
    }
    if (relative_path == undefined || relative_path == "/") { relative_path = config.DEFAULT_PAGE; }
    if (relative_path[0] == "/") { relative_path = relative_path.slice(1); } // Removing leading / 
    const path = "public/" + relative_path; // Injection vulnerable?

    res.setHeader("Content-Type", getMimeType(path)); // Set mime type

    // Pipe file to client
    const read_stream = createReadStream(path);
    read_stream.on("open", () => {
        console.log(`Piping file ${path}.`);
        read_stream.pipe(res);
    });
    read_stream.on("end", () => {
        res.end();
    });
    read_stream.on("error", (err) => {
        console.error(`Error reading file ${path}: ${err.message}`);
        errorHandler(res, 404);
    });
}

async function postHandler(req, res) {
    console.log(`Recieved POST request.`);
    if (req.url === "/api/quiz") {
        await quizHandler(req, res);
        return;
    }

    await errorHandler(res, 404);
}

async function errorHandler(res, code) {
    console.error(`HTTP Error ${code}`);
    res.writeHead(code).end();
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let data = "";
        req.on("data", (chunk) => {
            data += chunk;
        });
        req.on("end", () => resolve(data));
        req.on("error", reject);
    });
}

async function quizHandler(req, res) {
    try {
        const raw = await readBody(req);
        const payload = raw ? JSON.parse(raw) : {};
        const answers = Array.isArray(payload.answers) ? payload.answers : [];

        if (answers.length === 0) {
            res.writeHead(400, { "Content-Type": "text/plain" });
            res.end("Invalid quiz payload: answers must be a non-empty array.");
            return;
        }

        const parsedAnswers = answers.map((value) => Number.parseInt(value, 10));
        if (parsedAnswers.some((value) => Number.isNaN(value))) {
            res.writeHead(400, { "Content-Type": "text/plain" });
            res.end("Invalid quiz payload: answers must be integers.");
            return;
        }

        const hobby = getHobbyReccomendation(parsedAnswers);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ hobby }));
    } catch (err) {
        console.error("Quiz API error:", err);
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Quiz API error");
    }
}

export function createHTTPServer() {
    return createServer(async (req, res) => {
        res.setHeader("Access-Control-Allow-Origin", "*")

        switch (req.method) {
            case "GET":
                await getHandler(req, res);
                break;
            case "POST":
                await postHandler(req, res);
                break;
            default:
                await errorHandler(req, res, 405);
                break;
        }
    });
}
