import { createHTTPServer, registerPOSTHandler } from "./server/server.js";
import config from "./config.js"

import { init as dbInit, manager } from "./dbManagement/index.js"
import { initRecommendationProcess, quizAPIHandler } from "./api/recommendation.js";
import { quizGetHandler } from "./api/quiz.js";

const server = createHTTPServer(config.PUBLIC);

// Initialise database
dbInit();

// Initialise recommender
initRecommendationProcess("./backend/quiz.json");

registerPOSTHandler("/getquiz", quizGetHandler);
registerPOSTHandler("/api/quiz", (req, res) => quizAPIHandler(req, res, manager));

server.listen(config.PORT, config.URL, () => {
    console.log(`Server listenning at ${config.URL}:${config.PORT}.`);
});