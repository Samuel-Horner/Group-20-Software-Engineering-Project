import http from "http";
import fs from "fs";

import config from "./config.js";

const port = 8080;

function getMimeType(path) {
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
    if (relative_path == undefined || relative_path == "/") { relative_path = config.DEFAULT_PAGE; }
    if (relative_path[0] == "/") { relative_path = relative_path.slice(1); } // Removing leading / 
    const path = "./public/" + relative_path; // Injection vulnerable?

    res.setHeader("Content-Type", getMimeType(path)); // Set mime type

    // Pipe file to client
    const read_stream = fs.createReadStream(path);
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

    res.end();
}

async function errorHandler(res, code) {
    console.error(`HTTP Error ${code}`);
    res.writeHead(code).end();
}

const server = http.createServer(async (req, res) => {
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

server.listen(config.PORT, config.URL, () => {
    console.log(`Server running at ${config.URL}:${config.PORT}.`);
});