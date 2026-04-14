import { createHTTPServer, registerGETHandler, registerPOSTHandler } from "./server/server.js";
import config from "./config.js";

import { init as dbInit } from "./dbManagement/index.js";
import { networkAccountsHandler, networkHobbiesHandler } from "./api/networking.js";
import { initRecommendationProcess, quizAPIHandler } from "./api/recommendation.js";
import { quizGetHandler } from "./api/quiz.js";

const server = createHTTPServer(config.PUBLIC);

// Initialise database
dbInit();

// Initialise recommender
initRecommendationProcess();

registerGETHandler("/api/network/accounts", networkAccountsHandler);
registerGETHandler("/api/network/hobbies", networkHobbiesHandler);

registerPOSTHandler("/getquiz", quizGetHandler);
registerPOSTHandler("/api/quiz", quizAPIHandler);

server.listen(config.PORT, config.URL, () => {
    console.log(`Server listenning at ${config.URL}:${config.PORT}.`);
});
