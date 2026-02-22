import path from "path";
import fs from "fs";

import { createHTTPServer, registerPOSTHandler } from "./server/server.js";
import config from "./config.js"

const public_directory = path.resolve("../public/");
const server = createHTTPServer(public_directory);

async function getHobbyReccomendation(answers) {
    return "Gaming";
}


registerPOSTHandler("/getQuiz", async (req, res) => {
    try {
        const quizPath = path.resolve("./quiz.json");
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

server.listen(config.PORT, config.URL, () => {
    console.log(`Server listenning at ${config.URL}:${config.PORT}.`);
});