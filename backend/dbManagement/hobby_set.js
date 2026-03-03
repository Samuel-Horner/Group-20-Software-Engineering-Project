import sqlite from "sqlite3";

const hobby_table_schema = `
CREATE TABLE IF NOT EXISTS HobbyTable (
    HobbyID INTEGER PRIMARY KEY,
    HobbyName TEXT UNIQUE
);
`;

/**
 * Attempts to add a hobby to the hobby database.
 * If it already exists, does nothing and returns the HobbyID.
 *
 * @returns HobbyID
 * @param {String} name 
 * @param {DBManager} manager 
 */
export async function add(name, manager) {
    // Attempt to insert into table
    await manager.dbExecute(`INSERT OR IGNORE INTO HobbyTable (HobbyName) VALUES (?) `, [name]);
    return (await manager.dbGet(`SELECT HobbyID FROM HobbyTable WHERE HobbyName LIKE ?`, [name]))[0]["HobbyID"];

}

export async function init(manager) {
    await manager.dbExecute(hobby_table_schema);
}

export default {
    add,
    init
}