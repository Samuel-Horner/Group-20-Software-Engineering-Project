import { spawn } from 'child_process';
import fs from "fs";

import { errorHandler, getCookies } from "../server/server.js";
import quiz_responses from "../dbManagement/quiz_responses.js";
import account_system from '../dbManagement/account_system.js';

// Initialize python process
let process;
let pythonReady = true;

export function initRecommendationProcess(options = {}) {
    process = spawn('python', ['backend/recommendation/model_predictor.py'], options);
    process.stdout.setEncoding('utf-8');
}

export function killRecommendationProcess() {
    process.kill();
}



async function waitForPythonReady() {
    while (!pythonReady) {
        // Wait for 10 ms
        await new Promise((resolve) => setTimeout(() => resolve(), 10))
    }
}

// This function ONLY WORKS IF YOU RUN IT FROM ROOT
// Example:   getHobbyRecommendation([1,4,1,2,4,2,3,3,1,2,4,5,5,4,2]);
// Returns: The probabilities of the inputs most likely classes in [probability, class] pairs 
//         -> Example: [ [0.5, "Football"], [0.2, "Games"], ... ] 
export async function getHobbyRecommendation(answers, maskedHobbies) {
    // process.stdin.write(JSON.stringify(answers) + "\n");

    // If other processes currently running, block until other processes are finished
    await waitForPythonReady();
    pythonReady = false;
    process.stdin.write(JSON.stringify({ "answers": answers, "mask": maskedHobbies }) + "\n");

    // Wait until the python script has resolved until we can return the prediction
    return new Promise((resolve, reject) => {
        // We need to do this weird wrapping to ensure handlers are only called once

        const dataHandler = (msg) => {
            let obj = JSON.parse(msg);

            let classes = obj["classes"]; let predictions = obj["prediction"]; let mask = obj["mask"]
            // console.log(classes, predictions);
            let pairs = predictions.map((p, idx) => [p, classes[idx]]); // remember the original locations

            // Return the most likely class as the prediction, descending order of probability 
            const sorted = pairs.sort((a, b) => { return b[0] - a[0] })
            // let bestClass = classes[sorted[0][1]];
            let bestClasses = sorted.slice(0, 5)

            console.log(bestClasses);

            pythonReady = true;
            let result = JSON.stringify(bestClasses);
            resolve(result);
            process.stderr.removeListener("data", errorHandler);
        };

        const errorHandler = (err) => {
            console.error(`${err}`);
            pythonReady = true;
            reject(new Error(err));
            process.stdout.removeListener("data", dataHandler);
        }

        process.stdout.once('data', dataHandler);
        process.stderr.once('data', errorHandler);
    });
}

export function quizAPIHandler(req, res, body, manager, recommendation = getHobbyRecommendation) {
    return new Promise(async (resolve, reject) => {
        const payload = body ? body : {};
        const maskedHobbies = payload["maskedHobbies"];

        if (!maskedHobbies) {
            errorHandler(res, 400);
            return resolve();
        }

        const rawAnswers = Array.isArray(payload.answers) ? payload.answers : [];
        const answers = rawAnswers.map((value) => Number.parseInt(String(value), 10));

        if (!answers.length || answers.some((value) => Number.isNaN(value))) {
            errorHandler(res, 400);
            return resolve();
        }

        let user_id = null;
        const cookies = getCookies(req);
        try {
            const session = JSON.parse(cookies.session);
            if (await account_system.validateSession(session, manager)) {
                user_id = session.account_id;
            }
        } catch (err) {
            if (cookies != null) {
                console.error(err);
            }
        }

        await recommendation(answers, maskedHobbies).then(async hobby => {
            await quiz_responses.add(user_id, answers, maskedHobbies, manager);

            res.setHeader("Content-Type", "application/json");
            res.writeHead(200).end(JSON.stringify({ hobby }));
            return resolve();
        }).catch(err => {
            return reject(err);
        });
    });
}