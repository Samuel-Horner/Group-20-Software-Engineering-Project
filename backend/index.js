import { createHTTPServer, registerGETHandler, registerPOSTHandler } from "./server/server.js";
import config from "./config.js";

import { init as dbInit } from "./dbManagement/index.js";
import {
    getNetworkingHobbies,
    initNetworkingStorage,
    searchNetworkingAccounts
} from "./dbManagement/networking.js";
import { initReccomendationProcess, quizAPIHandler } from "./api/recommendation.js";
import { quizGetHandler } from "./api/quiz.js";

const server = createHTTPServer(config.PUBLIC);

function parseHobbyFilters(searchParams) {
    const repeatedValues = searchParams.getAll("hobbies");
    const splitValues = repeatedValues.flatMap((value) =>
        String(value).split(",")
    );

    return [...new Set(
        splitValues
            .map((value) => value.trim())
            .filter((value) => value.length > 0)
    )];
}

registerGETHandler("/api/network/accounts", async (_, res, url) => {
    try {
        const search = (url.searchParams.get("search") || "").trim();
        const hobbies = parseHobbyFilters(url.searchParams);
        const accounts = await searchNetworkingAccounts({ search, hobbies });

        res.setHeader("Content-Type", "application/json");
        res.writeHead(200).end(JSON.stringify({
            accounts,
            count: accounts.length,
            appliedFilters: { search, hobbies }
        }));
    } catch (err) {
        console.error(`Network accounts handler error: ${err.message}`);
        res.writeHead(500).end("Failed to query networking accounts");
    }
});

registerGETHandler("/api/network/hobbies", async (_, res) => {
    try {
        const hobbies = await getNetworkingHobbies();
        res.setHeader("Content-Type", "application/json");
        res.writeHead(200).end(JSON.stringify({ hobbies }));
    } catch (err) {
        console.error(`Hobby list handler error: ${err.message}`);
        res.writeHead(500).end("Failed to query hobbies");
    }
});

registerPOSTHandler("/getquiz", quizGetHandler);
registerPOSTHandler("/getQuiz", quizGetHandler);
registerPOSTHandler("/api/quiz", quizAPIHandler);

async function startServer() {
    try {
        await dbInit();
        await initNetworkingStorage();
        initReccomendationProcess();

        server.listen(config.PORT, config.URL, () => {
            console.log(`Server listenning at ${config.URL}:${config.PORT}.`);
        });
    } catch (err) {
        console.error(`Failed to start server: ${err.message}`);
        process.exit(1);
    }
}

startServer();
