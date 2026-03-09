import path from "path";
import fs from "fs";

import { createHTTPServer, registerPOSTHandler } from "./server/server.js";
import {spawn} from 'child_process'
import config from "./config.js"

import { init as dbInit} from "./dbManagement/index.js"

const server = createHTTPServer(config.PUBLIC);


// Initialize python process
const args = ['backend/reccomendation/model_predictor.py'];
const process = spawn('python', args);
process.stdout.setEncoding('utf-8');

// This function ONLY WORKS IF YOU RUN IT FROM ROOT
// Example:   getHobbyReccomendation([1,4,1,2,4,2,3,3,1,2,4,5,5,4,2]);
// Returns: The probabilities of the inputs most likely classes in [probability, class] pairs 
//         -> Example: [ [0.5, "Football"], [0.2, "Games"], ... ] 
async function getHobbyReccomendation(answers) {
    process.stdin.write( JSON.stringify(answers) + "\n" );
    // Wait until the python script has resolved until we can return the prediction
    return new Promise( (resolve, reject) => {
        process.stdout.on('data', (msg) => {
            let obj = JSON.parse(msg);

            let classes = obj["classes"]; let predictions = obj["prediction"];
            // console.log(classes, predictions);
            let pairs = predictions.map( (p,idx) => [p, classes[idx]] ); // remember the original locations

            // Return the most likely class as the prediction, descending order of probability 
            const sorted = pairs.sort( (a,b) => {return b[0] - a[0] })
            // let bestClass = classes[sorted[0][1]];
            let bestClasses = sorted.slice(0,5)

            console.log("sorted:", sorted);
            console.log("best:", bestClasses);

            let result = JSON.stringify(bestClasses);
            resolve(result)
        });

        process.stderr.on('data', (err) => {
            console.error(`${err}`);
            reject(new Error(err));
        });
    });
}


registerPOSTHandler("/getquiz", async (req, res) => {
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

// Initialise database
dbInit();

server.listen(config.PORT, config.URL, () => {
    console.log(`Server listenning at ${config.URL}:${config.PORT}.`);
});