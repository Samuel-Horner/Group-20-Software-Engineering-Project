import path from "path";
import fs from "fs";

import { createHTTPServer, registerPOSTHandler } from "./server/server.js";
import config from "./config.js"

const public_directory = path.resolve("./public/");
const server = createHTTPServer(public_directory);

// Register POST handler to stream the quiz JSON
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

server.listen(config.PORT, config.URL, () => {
    console.log(`Server listenning at ${config.URL}:${config.PORT}.`);
});