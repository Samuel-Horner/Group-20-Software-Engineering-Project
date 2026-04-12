import { createHTTPServer, registerPOSTHandler } from "./server/server.js";
import config from "./config.js"

import { init as dbInit} from "./dbManagement/index.js"
import { initRecommendationProcess, quizAPIHandler } from "./api/recommendation.js";
import { quizGetHandler } from "./api/quiz.js";
import { loginGetHandler, updateGetHandler } from "./api/accountSystem.js"

const server = createHTTPServer(config.PUBLIC);

// Initialise database
dbInit();

// Initialise recommender
initRecommendationProcess();

registerPOSTHandler("/getquiz", quizGetHandler);
registerPOSTHandler("/api/quiz", quizAPIHandler);
registerPOSTHandler("/acc_login", loginGetHandler);
registerPOSTHandler("/acc_update", updateGetHandler);

server.listen(config.PORT, config.URL, () => {
    console.log(`Server listenning at ${config.URL}:${config.PORT}.`);
});

process.on('SIGINT', () => {
    server.close(() => {
        console.log('Server stopped.');
        process.exit(0);
    });
});