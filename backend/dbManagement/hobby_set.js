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
    await manager.dbExecute(`INSERT INTO HobbyTable (HobbyName) VALUES (?) `, [name]);
    return (await manager.dbGet(`SELECT HobbyID FROM HobbyTable WHERE HobbyName LIKE ?`, [name]))[0]["HobbyID"];
}

export async function init(manager) {
    await manager.dbExecute(hobby_table_schema);
}

export default {
    add,
    init
}