// Called directly from backend index
import { DBManager } from "./DBManager.js";
import training_set from "./training_set.js";

const hobby_table_schema = `
CREATE TABLE IF NOT EXISTS HobbyTable (
    HobbyID INTEGER PRIMARY KEY,
    HobbyName TEXT UNIQUE
);
`;

export const manager = new DBManager("./backend/data/dev.db");

/**
 * Attempts to add a hobby to the hobby database.
 * If it already exists, does nothing and returns the HobbyID.
 *
 *  Returns HobbyID.
 * @param {String} name 
 */
export async function addHobby(name) {
    await manager.dbExecute(`INSERT INTO HobbyTable (HobbyName) VALUES (?) `, [name]);
    return (await manager.dbGet(`SELECT HobbyID FROM HobbyTable WHERE HobbyName LIKE ?`, [name]))[0]["HobbyID"];
}

async function init() {
    await manager.establishConnection();
    await manager.dbExecute(`PRAGMA foreign_keys = ON;`);

    await manager.dbExecute(hobby_table_schema);

    await training_set.init();
}

init();