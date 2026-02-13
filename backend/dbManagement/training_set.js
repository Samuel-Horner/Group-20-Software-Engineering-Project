import { DBManager } from "./DBManager.js"

const schema = [
    "TrainingSet",
    "test BOOLEAN"
]

const manager = new DBManager(schema, "./backend/data/training_set.sqlite");

export async function init() {
    await manager.establishConnection();
    await manager.initialiseSchema();

    console.log(`Initialised training set database.`);
}

export default {
    init
};