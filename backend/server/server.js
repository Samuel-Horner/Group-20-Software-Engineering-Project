import { createServer } from "http";
import { createReadStream } from "fs";
import { URL } from "url";
import path from "path";

import config from "../config.js";

const qualified_url = `http://${config.URL}:${config.PORT}`;
const public_directory = path.resolve("./public/");

export function getMimeType(ext) {
    switch (ext) {
        case ".html":
            return "text/html"
        case ".css":
            return "text/css"
        case ".js":
            return "text/javascript"
        case ".json":
            return "application/json"
        case ".png":
            return "image/png"
        case ".jpg":
        case ".jpeg":
            return "image/jpeg"
        case ".svg":
            return "image/svg+xml"
        default:
            return "text/plain"
    }
}

async function getHandler(req, res) {
    console.log(`Recieved GET request for resource ${req.url}.`)

    const url = new URL(req.url, qualified_url);

    if (url.pathname == "/") {
        url.pathname = config.DEFAULT_PAGE;
    }

    let file_path_str = path.resolve(path.join(public_directory, url.pathname));

    // Check for path traversal out of public directory.
    // This is probably not good enough to prevent path traversal.
    // TODO: Find a better mechanism for this.
    if (!file_path_str.startsWith(public_directory)) {
        console.error(`Invalid file path: ${file_path}`);
        errorHandler(res, 404);
    }

    let file_path = path.parse(file_path_str);
    res.setHeader("Content-Type", getMimeType(file_path.ext)); // Set mime type

    // Pipe file to client
    const read_stream = createReadStream(file_path_str);
    read_stream.on("open", () => {
        console.log(`Piping file ${file_path_str}.`);
        read_stream.pipe(res);
    });
    read_stream.on("end", () => {
        res.end();
    });
    read_stream.on("error", (err) => {
        console.error(`Error reading file ${file_path_str}: ${err.message}`);
        errorHandler(res, 404);
    });
}

async function postHandler(req, res) {
    console.log(`Recieved POST request.`);

    res.end();
}

async function errorHandler(res, code) {
    console.error(`HTTP Error ${code}`);
    res.writeHead(code).end();
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
