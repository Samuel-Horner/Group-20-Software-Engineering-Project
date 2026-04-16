import { afterAll, beforeAll, describe, jest } from "@jest/globals";

import fs from "fs";
import path from "path";

import { quizGetHandler } from "./quiz";
import { createHTTPServer, registerPOSTHandler } from "../server/server";
import config from "../config";
import { PassThrough } from "stream";

async function postURL(url, body = {}) {
    return fetch(`http://${config.URL}:${config.PORT}/${url}`, { method: "POST", body: JSON.stringify(body) }).then(async res => {
        if (!res.ok) { return res.status; }
        return await res.json();
    });
}

function readFile(file_path) {
    try {
        return fs.readFileSync(`${file_path}`).toString();
    } catch {
        throw new Error(`Failed to read file '${file_path}'.`);
    }
}

describe("Get Quiz Endpoint", () => {
    let server;

    beforeAll((done) => {
        const public_directory = path.resolve("../public");

        server = createHTTPServer(public_directory);
        registerPOSTHandler("/getquiz", async (req, res, body) => { return quizGetHandler(req, res, body, quizPath = path.resolve("./quiz.json"))});

        server.listen(config.PORT, config.URL, () => { done(); });
    });

    test("Real POST requests", async () => {
        await expect(postURL("getquiz")).resolves.toEqual(JSON.parse(readFile("./quiz.json")));
    });

    test("Get Quiz Handler", async () => {
        async function mockGetQuizHandler(quizPath = path.resolve("./quiz.json")) {
            const url = "/getquiz";

            let req = {
                url: url
            };

            class Res extends PassThrough {
                constructor() {
                    super();

                    this.code = null;
                    this.body = null;
                }

                writeHead(code) { 
                    this.code = code; 
                    return this; 
                }

                setHeader(key, val) { 
                    return this; 
                }

                end(body) { 
                    this.body = body; 
                    return this; 
                }
            }

            let res = new Res();

            if (quizPath != "default") {
                await quizGetHandler(req, res, null, quizPath);
            } else {
                await quizGetHandler(req, res, null);
            }

            res.writeHead(200).end();

            return res.body != null ? res.body : res.code; 
        }

        await expect(mockGetQuizHandler("abc")).rejects.toThrow("ENOENT: no such file or directory, open 'abc'");
        await expect(mockGetQuizHandler()).resolves.toBe(200);
        await expect(mockGetQuizHandler(null)).rejects.toThrow("The \"path\" argument must be of type string or an instance of Buffer or URL. Received null");
        await expect(mockGetQuizHandler("default")).rejects.toThrow(`ENOENT: no such file or directory, open '${path.resolve("./backend/quiz.json")}'`);
    });

    afterAll((done) => {
        server.close(() => { done(); });
    });
})