// Called directly from backend index
import { DBManager } from "./DBManager.js";
import training_set from "./training_set.js";
import hobby_set from "./hobby_set.js";
import config from "../config.js";

export const manager = new DBManager(config.DATABASE_PATH);

export async function init() {
    await manager.establishConnection();
    await manager.dbExecute(`PRAGMA foreign_keys = ON;`);

    await hobby_set.init(manager);
    await training_set.init("./backend/data/training_set.csv", manager);
}
