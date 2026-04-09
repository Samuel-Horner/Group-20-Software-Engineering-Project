import { createHTTPServer, registerPOSTHandler } from "./server/server.js";
import config from "./config.js"

import { init as dbInit} from "./dbManagement/index.js"
import { initRecommendationProcess, quizAPIHandler } from "./api/recommendation.js";
import { quizGetHandler } from "./api/quiz.js";
import fs from "fs";

const server = createHTTPServer(config.PUBLIC);

// Initialise database
dbInit();

// Initialise recommender
initRecommendationProcess();

registerPOSTHandler("/getquiz", quizGetHandler);
registerPOSTHandler("/api/quiz", quizAPIHandler);

let model = fs.readFileSync("./backend/recommendation/model.json", "utf8");    let jsonData = JSON.parse(model)
let hobbies = jsonData["classes"]
model= null; jsonData = null;

export function hobbyGetHandler(req, res, h=hobbies) {
    return new Promise( (resolve, reject) => {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(h)) 
        resolve();
    })
}
registerPOSTHandler("/gethobbies", hobbyGetHandler);

server.listen(config.PORT, config.URL, () => {
    console.log(`Server listenning at ${config.URL}:${config.PORT}.`);
});