import { createHTTPServer, registerGETHandler, registerPOSTHandler } from "./server/server.js";
import config from "./config.js";

import { init as dbInit, manager } from "./dbManagement/index.js";
import { networkAccountsHandler, networkHobbiesHandler } from "./api/networking.js";
import { initRecommendationProcess, quizAPIHandler } from "./api/recommendation.js";
import { quizGetHandler } from "./api/quiz.js";
import fs from "fs";
import { createAccountHandler, loginHandler, validateSessionHandler, logoutHandler, getAccountInformationHandler, updateAccountHandler } from "./api/account.js"

const server = createHTTPServer(config.PUBLIC);

// Initialise database
dbInit();

// Initialise recommender
initRecommendationProcess("./backend/quiz.json");

registerGETHandler("/api/network/accounts", (req, res, url) => networkAccountsHandler(req, res, url, manager));
registerGETHandler("/api/network/hobbies", (req, res, url) => networkHobbiesHandler(req, res, url, manager));

registerPOSTHandler("/getquiz", quizGetHandler);
registerPOSTHandler("/api/quiz", (req, res) => quizAPIHandler(req, res, manager));

let model = fs.readFileSync("./backend/recommendation/model.json", "utf8"); 
let jsonData = JSON.parse(model)
let hobbies = jsonData["classes"];

export function hobbyGetHandler(req, res, body, h = hobbies) {
    return new Promise((resolve, reject) => {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(h))
        resolve();
    })
}

registerPOSTHandler("/gethobbies", hobbyGetHandler);
registerPOSTHandler("/api/account/login", (req, res, body) => loginHandler(req, res, body, manager));
registerPOSTHandler("/api/account/create", (req, res, body) => createAccountHandler(req, res, body, manager));
registerPOSTHandler("/api/account/validate", (req, res, body) => validateSessionHandler(req, res, body, manager));
registerPOSTHandler("/api/account/logout", (req, res, body) => logoutHandler(req, res, body, manager));
registerPOSTHandler("/api/account/get", (req, res, body) => getAccountInformationHandler(req, res, body, manager));
registerPOSTHandler("/api/account/update", (req, res, body) => updateAccountHandler(req, res, body, manager));

server.listen(config.PORT, config.URL, () => {
    console.log(`Server listenning at ${config.URL}:${config.PORT}.`);
});

process.on('SIGINT', () => {
    server.close(() => {
        console.log('Server stopped.');
        process.exit(0);
    });
});
