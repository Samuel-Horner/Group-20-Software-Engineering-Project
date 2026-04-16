import { createServer } from "http";
import { createReadStream } from "fs";
import { URL } from "url";
import path, { sep } from "path";

import config from "../config.js";

const qualified_url = `http://${config.URL}:${config.PORT}`;
const getEndpoints = {};
const postEndpoints = {};

export function getCookies(req) {
    if (!req.headers) return null;
    if (!req.headers.cookie) return null;

    let cookies = {};
    req.headers.cookie.split(";").forEach(cookie => {
        const seperator_index = cookie.indexOf("=");
        const name = decodeURIComponent(cookie.slice(0, seperator_index).trim());
        const value = decodeURIComponent(cookie.slice(seperator_index + 1).trim());

        cookies[name] = value;
    });
    return cookies;
}

export function setCookie(res, cookies) {
    res.setHeader("Set-Cookie", cookies.map(
        cookie => `${encodeURIComponent(cookie.name)}=${encodeURIComponent(cookie.value)}`
            + (cookie.expires != null ? `; Expires=${cookie.expires.toUTCString()}` : '')
            + (cookie.maxAge != null ? `; Max-Age=${cookie.maxAge}` : '')
            + (cookie.domain != null ? `; Domain=${cookie.domain}` : '')
            + (cookie.path != null ? `; Path=${cookie.path}` : '')
            + (cookie.secure ? '; Secure' : '')
            + (cookie.httpOnly ? '; HttpOnly' : '')
            + (cookie.sameSite != null ? `; SameSite=${cookie.sameSite}` : ''))
    );
}

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

export async function getHandler(public_directory, req, res, _URL = URL) {
    console.log(`Recieved GET request for resource ${req.url}.`);

    const url = new _URL(req.url, qualified_url);
    if (url.pathname in getEndpoints) {
        await getEndpoints[url.pathname](req, res, url).catch(async (err) => {
            console.error(err);
            await errorHandler(res, 500);
        });
        return;
    }

    if (url.pathname == "/") {
        url.pathname = config.DEFAULT_PAGE;
    }

    let file_path_str = path.resolve(path.join(public_directory, url.pathname));

    // UPDATE: Path traversal seems very hard to achieve, since RFC3986 strips all URI dot segments. It is however still possible via a manuall crafted request, hence to test this we need to create a mock request.
    // https://www.rfc-editor.org/rfc/rfc3986#page-33

    // Check for path traversal out of public directory.
    // This is probably not good enough to prevent path traversal.
    // TODO: Find a better mechanism for this.
    if (!file_path_str.startsWith(public_directory)) {
        console.error(`Error, invalid file path: ${file_path_str}`);
        await errorHandler(res, 404);
        return;
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
    const pathname = new URL(req.url, qualified_url).pathname;
    console.log(`Recieved POST request for resource ${pathname}.`);

    if (pathname in postEndpoints) {
        const body = await new Promise((resolve, reject) => {
            let raw = "";
            req.on('data', chunk => raw += chunk.toString());
            req.on('end', () => {
                try { return resolve(JSON.parse(raw)); }
                catch { return resolve({}); }
            });
            req.on('error', () => {
                return resolve(null);
            });
        });

        if (body == null) { 
            console.error("Empty body");
            return errorHandler(res, 400); 
        }

        await postEndpoints[pathname](req, res, body).catch(err => {
            console.error(err);
            return errorHandler(res, 500, err.message);
        });
    } else {
        console.error(`Error, no POST handler exists for resource ${pathname}.`);
        return errorHandler(res, 404);
    }
}

export function registerGETHandler(url, handler) {
    if (url in getEndpoints || url in postEndpoints) {
        throw new Error("Url already registered.");
    }
    getEndpoints[url] = handler;
}

export function registerPOSTHandler(url, handler) {
    if (url in postEndpoints || url in getEndpoints) {
        throw new Error("Url already registered.");
    }
    postEndpoints[url] = handler;
}

export function releasePOSTHandler(url) {
    if (!(url in postEndpoints)) {
        throw new Error("Url not registered.");
    }
    delete postEndpoints[url];
}

export async function errorHandler(res, code, message = undefined) {
    console.error(`HTTP Error ${code}`);
    res.writeHead(code).end(message);
    return code;
}

export function createHTTPServer(public_directory) {
    return createServer(async (req, res) => {
        res.setHeader("Access-Control-Allow-Origin", "*")

        switch (req.method) {
            case "GET":
                await getHandler(public_directory, req, res);
                break;
            case "POST":
                await postHandler(req, res);
                break;

            case "OPTIONS":
                res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
                res.setHeader("Access-Control-Allow-Headers", "Content-Type");
                res.writeHead(204);
                res.end();
                break;

            default:
                await errorHandler(res, 405);
                break;
        }
    });
}
