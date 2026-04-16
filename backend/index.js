import { createHTTPServer, registerPOSTHandler } from "./server/server.js";
import config from "./config.js"

import { init as dbInit, manager } from "./dbManagement/index.js"
import { initRecommendationProcess, quizAPIHandler } from "./api/recommendation.js";
import { quizGetHandler } from "./api/quiz.js";
import { createAccountHandler, loginHandler, validateSessionHandler, logoutHandler, getAccountInformationHandler, updateAccountHandler } from "./api/account.js"

const server = createHTTPServer(config.PUBLIC);

// Initialise database
dbInit();

// Initialise recommender
initRecommendationProcess();

registerPOSTHandler("/getquiz", quizGetHandler);
registerPOSTHandler("/api/quiz", quizAPIHandler);

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