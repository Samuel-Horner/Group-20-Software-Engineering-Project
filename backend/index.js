import path from "path";

import { createHTTPServer } from "./server/server.js";
import config from "./config.js"

const public_directory = path.resolve("./public/");
const server = createHTTPServer(public_directory);

server.listen(config.PORT, config.URL, () => {
    console.log(`Server listenning at ${config.URL}:${config.PORT}.`);
});