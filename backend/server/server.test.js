import fs from "fs";
import path from "path";

import { getMimeType, createHTTPServer } from "./server";
import config from "../config";

const public_directory = path.resolve("../public/");

async function getURL(url) {
    return fetch(`http://${config.URL}:${config.PORT}/${url}`).then(async res => {
        if (!res.ok) { return res.status; }
        return await (await res.blob()).text();
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
        server.listen(config.PORT, config.URL, () => {});
    });

    test("Get Request", async () => {
        await expect(getURL("")).resolves.toBe(readFile("index.html"));
        await expect(getURL("index.html")).resolves.toBe(readFile("index.html"));
        await expect(getURL("chat.html")).resolves.toBe(readFile("chat.html"));
        await expect(getURL("index.html?test=1")).resolves.toBe(readFile("index.html"));
        await expect(getURL("foo")).resolves.toBe(404);
    });

    afterAll(() => {
        server.close();
    });
});

