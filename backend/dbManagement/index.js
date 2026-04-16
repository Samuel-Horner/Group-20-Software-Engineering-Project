// Called directly from backend index
import { DBManager } from "./DBManager.js";
import training_set from "./training_set.js";
import hobby_set from "./hobby_set.js";
import quiz_responses from "./quiz_responses.js";
import account_system from "./account_system.js"
import networking from "./networking.js";

import config from "../config.js";

export const manager = new DBManager(config.DATABASE_PATH);

export async function init() {
    await manager.establishConnection();
    await manager.dbExecute(`PRAGMA foreign_keys = ON;`);

    await hobby_set.init(manager);
    await training_set.init("./backend/data/training_set.csv", manager);

    await account_system.init(manager);

    await quiz_responses.init("./backend/quiz.json", manager);

    await networking.init(manager);
    await networking.seed(manager);
}
