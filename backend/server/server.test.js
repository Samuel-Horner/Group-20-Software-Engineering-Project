import { jest } from '@jest/globals';

import fs from "fs";
import path from "path";

import { getMimeType, createHTTPServer, registerPOSTHandler, getHandler } from "./server";
import config from "../config";
import { IncomingMessage, OutgoingMessage } from "http";

const public_directory = path.resolve("../public/");

async function getURL(url) {
    return fetch(`http://${config.URL}:${config.PORT}/${url}`).then(async res => {
        if (!res.ok) { return res.status; }
        return await (await res.blob()).text();
    });
}

async function postURL(url, body = {}) {
    return fetch(`http://${config.URL}:${config.PORT}/${url}`, { method: "POST", body: JSON.stringify(body) }).then(async res => {
        if (!res.ok) { return res.status; }
        return await res.json();
    });
}

async function putURL(url, body = {}) {
    return fetch(`http://${config.URL}:${config.PORT}/${url}`, { method: "PUT", body: JSON.stringify(body) }).then(async res => {
        if (!res.ok) { return res.status; }
        return await res.json();
    });
}

function readFile(file_path) {
    file_path = path.join(public_directory, file_path);

    try {
        return fs.readFileSync(`${file_path}`).toString();
    } catch {
        throw new Error(`Failed to read file '${file_path}'.`);
    }
}

describe("Static server module", () => {
    test("Get mime type", () => {
        expect(getMimeType(".foo")).toBe("text/plain");

        expect(getMimeType(".html")).toBe("text/html");
        expect(getMimeType(".css")).toBe("text/css");
        expect(getMimeType(".js")).toBe("text/javascript");
        expect(getMimeType(".json")).toBe("application/json");
        expect(getMimeType(".jpg")).toBe("image/jpeg");
        expect(getMimeType(".png")).toBe("image/png");
        expect(getMimeType(".svg")).toBe("image/svg+xml");
    });
});

describe("Server module", () => {
    let server = null;

    beforeAll(() => {
        server = createHTTPServer(public_directory);
        server.listen(config.PORT, config.URL, () => { });
    });

    // Public Interface
    test("Get Request", async () => {
        await expect(getURL("")).resolves.toBe(readFile(config.DEFAULT_PAGE));
        await expect(getURL(config.DEFAULT_PAGE)).resolves.toBe(readFile(config.DEFAULT_PAGE));
        await expect(getURL("chat.html")).resolves.toBe(readFile("chat.html"));
        await expect(getURL("index.html?test=1")).resolves.toBe(readFile("index.html"));
        await expect(getURL("foo")).resolves.toBe(404);

        await expect(getURL(encodeURI("../README.md"))).resolves.toBe(404);
    });

    test("Post Request", async () => {
        registerPOSTHandler("/test", async (req, res) => {
            let body = "";

            req.on("data", (chunk) => {
                body += chunk;
            });

            req.on("end", async () => {
                res.writeHead(200).end(JSON.stringify(body));
            });
        });

        await expect(postURL("")).resolves.toBe(404);
        await expect(postURL("test")).resolves.toBe(`{}`);
        await expect(postURL("test", { "test": 123 })).resolves.toBe(`{"test":123}`);

        expect(() => { registerPOSTHandler("/test", (req, res) => { }); }).toThrow("Url already registered.");
    });

    test("Put Request", async () => {
        await expect(putURL("")).resolves.toBe(405);
    });

    afterAll(() => {
        server.close();
    });
});

