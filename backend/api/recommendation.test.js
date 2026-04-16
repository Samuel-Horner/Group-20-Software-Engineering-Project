import { afterAll, beforeAll, describe, jest } from "@jest/globals"

import { spawn } from 'child_process';
import path from "path";
import fs from "fs";

import { initRecommendationProcess, quizAPIHandler, getHobbyRecommendation, killRecommendationProcess } from "./recommendation";
import { createHTTPServer, registerPOSTHandler } from "../server/server";
import { DBManager } from "../dbManagement/DBManager";
import quiz_responses from "../dbManagement/quiz_responses";
import config from "../config";
import account_system from "../dbManagement/account_system";

describe("Init Reccomendaton Process", () => {
    test("Init / Kill", () => {
        // Try without any arguments
        expect(initRecommendationProcess()).toBeUndefiend;
        expect(killRecommendationProcess()).toBeUndefiend;
    });
});

describe("Recommendation API", () => {
    // Needed to run tests
    beforeAll(() => {
        initRecommendationProcess({ "cwd": "../" });
    });

    // test("Hobby Recommendation", async () => {
    //     await expect(getHobbyRecommendation([])).rejects.toThrow("Input to hobby recommendation has length 0, when length 15 is needed");
    //     await expect(getHobbyRecommendation(["test"])).rejects.toThrow("Input to hobby recommendation has length 1, when length 15 is needed");
    //     await expect(getHobbyRecommendation([1])).rejects.toThrow("Input to hobby recommendation has length 1, when length 15 is needed");

    //     await expect(getHobbyRecommendation([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14])).rejects.toThrow("Input to hobby recommendation has length 14, when length 15 is needed");
    //     await expect(getHobbyRecommendation([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])).rejects.toThrow("Recieved answers out of range.");
    //     await expect(getHobbyRecommendation([0, -1, -2, -3, -4, -5, -6, -7, -8, -9, -10, -11, -12, -13, -14])).rejects.toThrow("Recieved answers out of range.");

    //     const sample1 = [5, 3, 5, 5, 4, 5, 5, 5, 5, 5, 3, 4, 4, 5, 4];
    //     await expect(getHobbyRecommendation(sample1)).resolves.toEqual(await getRecommendation(sample1));

    //     const sample2 = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    //     await expect(getHobbyRecommendation(sample2)).resolves.toEqual(await getRecommendation(sample2));
    // });

    describe("Quiz API", () => {
        let server;
        const manager = new DBManager("./data/recommendation_api.test.db", false);
        let port;

        async function postURL(url, body = {}) {
            return fetch(`http://${config.URL}:${port}/${url}`, { method: "POST", body: JSON.stringify(body) }).then(async res => {
                if (!res.ok) { return res.status; }
                return await res.json();
            });
        }

        beforeAll((done) => {
            const public_directory = path.resolve("../public");

            manager.establishConnection().then(async () => {
                await manager.dbExecute(`PRAGMA foreign_keys = ON;`);

                await account_system.init(manager);
                await quiz_responses.init("quiz.json", manager);
            }).then(() => {
                server = createHTTPServer(public_directory);
                registerPOSTHandler("/api/quiz", (req, res, body) => quizAPIHandler(req, res, body, manager));

                server.listen(0, config.URL, () => {
                    port = server.address().port;
                    done();
                });
            });
        });

        test("Real Post Request", async () => {
            await expect(postURL("api/quiz", {})).resolves.toBe(400);
            await expect(postURL("api/quiz", { answers: [] })).resolves.toBe(400);
            await expect(postURL("api/quiz", { answers: ["test"] })).resolves.toBe(400);
            await expect(postURL("api/quiz", { answers: [1] })).resolves.toBe(400);
            await expect(postURL("api/quiz", { answers: [1], maskedHobbies: null })).resolves.toBe(400);
            await expect(postURL("api/quiz", { answers: [1], maskedHobbies: [] })).resolves.toBe(500);

            const sample1 = [5, 3, 5, 5, 4, 5, 5, 5, 5, 5, 3, 4, 4, 5, 4];
            const answer1 = await postURL("api/quiz", { answers: sample1, maskedHobbies: [] });
            expect(answer1).not.toBe(400);
            expect(answer1).not.toBe(500);

            const answer2 = await postURL("api/quiz", { answers: sample1, maskedHobbies: ["running"] });
            expect(answer2).not.toBe(400);
            expect(answer2).not.toBe(500);
        });

        test("Handler", async () => {
            async function mockQuizAPIHandler(body, recommendation = getHobbyRecommendation) {
                const url = "/api/quiz";

                let req = {
                    url: url,
                    body: JSON.stringify(body),
                };

                let res = {
                    code: null,
                    body: null,
                    writeHead(code) { this.code = code; return this; },
                    setHeader(key, val) { return this; },
                    end(body) { this.body = body; return this; }
                }

                await quizAPIHandler(req, res, body, manager, recommendation).catch(err => {
                    // reject(err);
                    throw err;
                });

                return res.body != null ? res.body : res.code;
            }

            await expect(mockQuizAPIHandler(null)).resolves.toBe(400);
            await expect(mockQuizAPIHandler({})).resolves.toBe(400);
            await expect(mockQuizAPIHandler({ "answers": [] })).resolves.toBe(400);
            await expect(mockQuizAPIHandler({ "answers": ["test"] })).resolves.toBe(400);
            await expect(mockQuizAPIHandler({ "answers": [1] })).resolves.toBe(400);
            await expect(mockQuizAPIHandler({ "answers": [1], "maskedHobbies": {} })).rejects.toThrow("Input to hobby recommendation has length 1, when length 15 is needed");

            const sample1 = [5, 3, 5, 5, 4, 5, 5, 5, 5, 5, 3, 4, 4, 5, 4];
            await expect(mockQuizAPIHandler({ "answers": sample1, "maskedHobbies": {} })).resolves.not.toBe(400);

            await expect(mockQuizAPIHandler({ "answers": sample1, "maskedHobbies": {} }, async (answers, maskedHobbies) => {
                throw new Error("Recommendation engine not implemented");
            })).rejects.toThrow("Recommendation engine not implemented");

        });

        afterAll(async () => {
            await manager.dbClose();
            fs.rmSync("data/recommendation_api.test.db");
            await new Promise((resolve) => {
                server.close(resolve);
            });
        });
    });

    afterAll(() => {
        killRecommendationProcess();
    });
});