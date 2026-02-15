import path from "path";
import fs from "fs";

import { createHTTPServer, registerGETHandler, registerPOSTHandler } from "./server/server.js";
import config from "./config.js"

import { initPromise as trainingInitPromise } from "./dbManagement/index.js"
import {
    getNetworkingHobbies,
    initNetworkingStorage,
    searchNetworkingAccounts
} from "./dbManagement/networking.js";

const public_directory = path.resolve("./public/");
const server = createHTTPServer(public_directory);

async function getHobbyReccomendation(answers) {
    throw new Error("Recommendation engine not implemented");
}

function parseHobbyFilters(searchParams) {
    const repeatedValues = searchParams.getAll("hobbies");
    const splitValues = repeatedValues.flatMap((value) =>
        String(value).split(",")
    );

    return [...new Set(
        splitValues
            .map((value) => value.trim())
            .filter((value) => value.length > 0)
    )];
}

registerGETHandler("/api/network/accounts", async (_, res, url) => {
    try {
        const search = (url.searchParams.get("search") || "").trim();
        const hobbies = parseHobbyFilters(url.searchParams);
        const accounts = await searchNetworkingAccounts({search, hobbies});

        res.setHeader("Content-Type", "application/json");
        res.writeHead(200).end(JSON.stringify({
            accounts,
            count: accounts.length,
            appliedFilters: {search, hobbies}
        }));
    } catch (err) {
        console.error(`Network accounts handler error: ${err.message}`);
        res.writeHead(500).end("Failed to query networking accounts");
    }
});

registerGETHandler("/api/network/hobbies", async (_, res) => {
    try {
        const hobbies = await getNetworkingHobbies();
        res.setHeader("Content-Type", "application/json");
        res.writeHead(200).end(JSON.stringify({hobbies}));
    } catch (err) {
        console.error(`Hobby list handler error: ${err.message}`);
        res.writeHead(500).end("Failed to query hobbies");
    }
});

registerPOSTHandler("/getQuiz", async (req, res) => {
    try {
        const quizPath = path.resolve("./backend/quiz.json");
        res.setHeader("Content-Type", "application/json");

        const readStream = fs.createReadStream(quizPath);
        readStream.on("open", () => {
            readStream.pipe(res);
        });
        readStream.on("error", (err) => {
            console.error(`Error reading quiz file: ${err.message}`);
            res.writeHead(500).end();
        });
    } catch (err) {
        console.error(`Handler error: ${err.message}`);
        res.writeHead(500).end();
    }
});

registerPOSTHandler("/api/quiz", (req, res) => {
    let body = "";

    req.on("data", (chunk) => {
        body += chunk;
    });

    req.on("end", async () => {
        try {
            const payload = body ? JSON.parse(body) : {};
            const rawAnswers = Array.isArray(payload.answers) ? payload.answers : [];
            const answers = rawAnswers.map((value) => Number.parseInt(String(value), 10));

            if (!answers.length || answers.some((value) => Number.isNaN(value))) {
                res.writeHead(400).end("Invalid quiz payload");
                return;
            }

            const hobby = await getHobbyReccomendation(answers);
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200).end(JSON.stringify({ hobby }));
        } catch (err) {
            if (err.message === "Recommendation engine not implemented") {
                res.writeHead(501).end("Recommendation engine not implemented");
                return;
            }
            console.error(`Invalid quiz payload: ${err.message}`);
            res.writeHead(400).end("Invalid quiz payload");
        }
    });

    req.on("error", (err) => {
        console.error(`Error reading request body: ${err.message}`);
        res.writeHead(500).end();
    });
});

async function startServer() {
    try {
        await trainingInitPromise;
        await initNetworkingStorage();
        server.listen(config.PORT, config.URL, () => {
            console.log(`Server listenning at ${config.URL}:${config.PORT}.`);
        });
    } catch (err) {
        console.error(`Failed to start server: ${err.message}`);
        process.exit(1);
    }
}

startServer();
