import { createHTTPServer } from "./server/server.js";
import config from "./config.js"

const server = createHTTPServer();

server.listen(config.PORT, config.URL, () => {
    console.log(`Server listenning at ${config.URL}:${config.PORT}.`);
});