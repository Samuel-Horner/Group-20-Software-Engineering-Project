import { spawn } from 'child_process'
import { errorHandler } from "../server/server.js"
import { Recoverable } from 'repl';

// Initialize python process
let process;

export function initRecommendationProcess(options = {}) {
    process = spawn('python', ['backend/recommendation/model_predictor.py'], options);
    process.stdout.setEncoding('utf-8');
}

export function killRecommendationProcess() {
    process.kill();
}

// This function ONLY WORKS IF YOU RUN IT FROM ROOT
// Example:   getHobbyRecommendation([1,4,1,2,4,2,3,3,1,2,4,5,5,4,2]);
// Returns: The probabilities of the inputs most likely classes in [probability, class] pairs 
//         -> Example: [ [0.5, "Football"], [0.2, "Games"], ... ] 
export async function getHobbyRecommendation(answers) {
    process.stdin.write(JSON.stringify(answers) + "\n");
    // Wait until the python script has resolved until we can return the prediction
    return new Promise((resolve, reject) => {
        // We need to do this weird wrapping to ensure handlers are only called once

        const dataHandler = (msg) => {
            let obj = JSON.parse(msg);

            let classes = obj["classes"]; let predictions = obj["prediction"];
            // console.log(classes, predictions);
            let pairs = predictions.map((p, idx) => [p, classes[idx]]); // remember the original locations

            // Return the most likely class as the prediction, descending order of probability 
            const sorted = pairs.sort((a, b) => { return b[0] - a[0] })
            // let bestClass = classes[sorted[0][1]];
            let bestClasses = sorted.slice(0, 5)

            console.log("sorted:", sorted);
            console.log("best:", bestClasses);

            let result = JSON.stringify(bestClasses);
            resolve(result);
            process.stderr.removeListener("data", errorHandler);
        };

        const errorHandler = (err) => {
            console.error(`${err}`);
            reject(new Error(err));
            process.stdout.removeListener("data", dataHandler);
        }

        process.stdout.once('data', dataHandler);
        process.stderr.once('data', errorHandler);
    });
}

export function quizAPIHandler(req, res, recommendation = getHobbyRecommendation) {
    return new Promise((resolve, reject) => {
        let body = "";

        req.on("data", (chunk) => {
            body += chunk;
        });

        req.on("end", async () => {
            const payload = body ? JSON.parse(body) : {};

            const rawAnswers = Array.isArray(payload.answers) ? payload.answers : [];
            const answers = rawAnswers.map((value) => Number.parseInt(String(value), 10));

            if (!answers.length || answers.some((value) => Number.isNaN(value))) { 
                errorHandler(res, 400);
                return resolve(); 
            }

            // const hobby = await recommendation(answers);

            // res.setHeader("Content-Type", "application/json");
            // res.writeHead(200).end(JSON.stringify({ hobby }));

            await recommendation(answers).then(hobby => {
                res.setHeader("Content-Type", "application/json");
                res.writeHead(200).end(JSON.stringify({ hobby }));

                resolve();
            }).catch(err => {
                reject(err);
            });
        });

        req.on("error", async (err) => {
            console.error(`Error reading request body: ${err.message}`);
            reject(err);
        });
    });
}