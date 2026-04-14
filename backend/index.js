import { createHTTPServer, registerGETHandler, registerPOSTHandler } from "./server/server.js";
import config from "./config.js";

import { init as dbInit, manager } from "./dbManagement/index.js";
import { networkAccountsHandler, networkHobbiesHandler } from "./api/networking.js";
import { initRecommendationProcess, quizAPIHandler } from "./api/recommendation.js";
import { quizGetHandler } from "./api/quiz.js";

const server = createHTTPServer(config.PUBLIC);

// Initialise database
dbInit();

// Initialise recommender
initRecommendationProcess();

registerGETHandler("/api/network/accounts", (req, res, url) => networkAccountsHandler(req, res, url, manager));
registerGETHandler("/api/network/hobbies", (req, res, url) => networkHobbiesHandler(req, res, url, manager));

registerPOSTHandler("/getquiz", quizGetHandler);
registerPOSTHandler("/api/quiz", quizAPIHandler);

server.listen(config.PORT, config.URL, () => {
    console.log(`Server listenning at ${config.URL}:${config.PORT}.`);
});
