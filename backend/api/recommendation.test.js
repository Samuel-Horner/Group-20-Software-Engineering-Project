import { afterAll, beforeAll, describe, jest } from "@jest/globals"

import { spawn } from 'child_process'
import path from "path"

import { initRecommendationProcess, quizAPIHandler, getHobbyRecommendation, killRecommendationProcess } from "./recommendation";
import { createHTTPServer, registerPOSTHandler } from "../server/server";
import config from "../config"

async function postURL(url, body = {}) {
    return fetch(`http://${config.URL}:${config.PORT}/${url}`, { method: "POST", body: JSON.stringify(body) }).then(async res => {
        if (!res.ok) { return res.status; }
        return await res.json();
    });
}

// Directly call the recommendation engine (using a new instance)
async function getRecommendation(answers) {
    const args = ['backend/recommendation/model_predictor.py'];
    const process = spawn('python', args, { cwd: "../" });
    process.stdout.setEncoding('utf-8');
    process.stdin.write(JSON.stringify(answers) + "\n");

    return new Promise((resolve, reject) => {
        const dataHandler = (msg) => {
            let obj = JSON.parse(msg);

            let pairs = obj["prediction"].map((probability, i) => [probability, obj["classes"][i]]);

            const sorted = pairs.sort((a, b) => b[0] - a[0]);
            let bestClasses = sorted.slice(0, 5);

            let result = JSON.stringify(bestClasses);
            resolve(result);
            process.stderr.removeListener("data", errorHandler);
            process.kill();
        };

        const errorHandler = (err) => {
            console.error(`${err}`);
            reject(new Error(err));
            process.stdout.removeListener("data", dataHandler);
            process.kill();
        }

        process.stdout.once('data', dataHandler);
        process.stderr.once('data', errorHandler);
    });
}

describe("Init Reccomendaton Process", () => {
    test("Init / Kill", () => {
        // Try without any arguments
        expect(initRecommendationProcess()).toBeUndefiend;
        expect(killRecommendationProcess()).toBeUndefiend;
    });
})

describe("Recommendation API", () => {
    // Needed to run tests
    beforeAll(() => {
        initRecommendationProcess(options = { "cwd": "../" });
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

        beforeAll((done) => {
            const public_directory = path.resolve("../public");

            server = createHTTPServer(public_directory);
            registerPOSTHandler("/api/quiz", quizAPIHandler);

            server.listen(config.PORT, config.URL, () => { done(); });
        });

        test("Real Post Request", async () => {
            await expect(postURL("api/quiz", {})).resolves.toBe(400);
            await expect(postURL("api/quiz", { answers: [] })).resolves.toBe(400);
            await expect(postURL("api/quiz", { answers: ["test"] })).resolves.toBe(400);
            await expect(postURL("api/quiz", { answers: [1] })).resolves.toBe(500);

            const sample1 = [5, 3, 5, 5, 4, 5, 5, 5, 5, 5, 3, 4, 4, 5, 4];
            await expect(postURL("api/quiz", { answers: [5, 3, 5, 5, 4, 5, 5, 5, 5, 5, 3, 4, 4, 5, 4] })).resolves.toEqual({ "hobby": await getRecommendation(sample1) });
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

                await quizAPIHandler(req, res, body, recommendation);

                return res.body != null ? res.body : res.code; 
            }

            await expect(mockQuizAPIHandler(null)).resolves.toBe(400);
            await expect(mockQuizAPIHandler({})).resolves.toBe(400);
            await expect(mockQuizAPIHandler({"answers": []})).resolves.toBe(400);
            await expect(mockQuizAPIHandler({"answers": ["test"]})).resolves.toBe(400);
            await expect(mockQuizAPIHandler({"answers": [1]})).rejects.toThrow("Input to hobby recommendation has length 1, when length 15 is needed");

            const sample1 = [5, 3, 5, 5, 4, 5, 5, 5, 5, 5, 3, 4, 4, 5, 4];
            await expect(mockQuizAPIHandler({"answers": sample1})).resolves.toEqual(JSON.stringify({ "hobby": await getRecommendation(sample1) }));

            await expect(mockQuizAPIHandler({"answers": sample1}, async (answers) => {
                throw new Error("Recommendation engine not implemented"); 
            })).rejects.toThrow("Recommendation engine not implemented");

        });

        afterAll(async () => {
            server.close();
        });
    });

    afterAll(() => {
        killRecommendationProcess();
    });
});