import path from "path";
import fs from "fs";

import { errorHandler } from "../server/server.js"

export function quizGetHandler(req, res, _, quizPath = path.resolve("./backend/quiz.json")) {
    return new Promise((resolve, reject) => {
        res.setHeader("Content-Type", "application/json");

        const readStream = fs.createReadStream(quizPath);
        readStream.on("open", () => {
            readStream.pipe(res);
        });
        readStream.on("end", () => {
            resolve();
        });
        
        readStream.on("error", (err) => {
            console.error(`Error reading quiz file: ${err.message}`);
            reject(err);
        });
    });
}