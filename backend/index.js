import { createHTTPServer, registerPOSTHandler } from "./server/server.js";
import config from "./config.js"

import { init as dbInit} from "./dbManagement/index.js"
import { initRecommendationProcess, quizAPIHandler } from "./api/recommendation.js";
import { quizGetHandler } from "./api/quiz.js";
import {UserLogin,RetrieveAccInfo,ChangeAccInfo,CreateAccount,DeleteAccount,RetAll} from "./dbManagement/accountSys.js"

const server = createHTTPServer(config.PUBLIC);

registerPOSTHandler("/acc_update", async (req,res,body) => {
    if (body.action == "change") {
        try {
            await ChangeAccInfo(body.body);
            res.writeHead(200).end();
        } catch (err) {res.writeHead(400).end();}
    }
    else if (body.action == "create") {
        try {
            const sessionKey = await CreateAccount(body.body);
            res.writeHead(200).end(JSON.stringify(sessionKey));
        } catch (err) {res.writeHead(400).end()}
    }
    else if (body.action == "delete") {
        try {
            await DeleteAccount(body.body);
            res.writeHead(200).end();
        } catch (err) {res.writeHead(400).end();}
    }
});

registerPOSTHandler("/acc_login", async (req,res,body) => {
    if (body.action == 'firstLogin') {
        try {
            const sessionKey = await UserLogin(body);
            if (sessionKey) {
                res.writeHead(200).end(JSON.stringify(sessionKey));
            } else {res.writeHead(400).end();}
        } catch (err) {res.writeHead(400).end(`${err.message}`);}
    }
    else if (body.action == 'persistLogin') {
        try {
            var accInfo = await RetrieveAccInfo(body);
            res.writeHead(200).end(JSON.stringify(accInfo));
        } catch (err) {
            res.writeHead(400).end();
        }
    }
    else if (body.action == 'loadAll') {
        try {
            var retall = await RetAll();
            res.writeHead(200).end(JSON.stringify(retall));
        } catch (err) {};
    }
});

// Initialise database
dbInit();

// Initialise recommender
initRecommendationProcess();

registerPOSTHandler("/getquiz", quizGetHandler);
registerPOSTHandler("/api/quiz", quizAPIHandler);

server.listen(config.PORT, config.URL, () => {
    console.log(`Server listenning at ${config.URL}:${config.PORT}.`);
});

// Close port cleanly only on Ctrl+C (i think, feel free to check cuz idk anymore; though it fixed a lot of issues for me)
process.on('SIGINT', () => {
    server.close(() => {
        console.log('Server stopped.');
        process.exit(0);
    });
});