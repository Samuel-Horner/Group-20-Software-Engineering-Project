// Called directly from backend index
import { DBManager } from "./DBManager.js";
import { getTrainingSet, loadTrainingSet } from "./training_set.js";

const hobby_table_schema = `
CREATE TABLE IF NOT EXISTS HobbyTable (
    HobbyID INTEGER PRIMARY KEY,
    HobbyName TEXT UNIQUE
);
`

// Training set structure:
// Questions: (1-5, normalised to -1, 1)
// 1. Do you enjoy meeting new people?
// 2. Do you enjoy working in a team?
// 3. Do you enjoy exercising?
// 4. Do you enjoy creating things?
// 5. Do you enjoy challenging yourself?
// 6. Do you enjoy spending your free time with other people?
// 7. Do you enjoy learning new things?
// 8. Do you enjoy seeing yourself improve?
// 9. Do you enjoy being in nature?
// 10. Do you enjoy performing?
// 11. Do you enjoy competition?
// 12. Do you enjoy collecting things?
// 13. Do you enjoy speding time alone?
// 14. Do you enjoy expressing your abilities and skills?
// 15. Do you enjoy expressing your identity and interests?

const training_set_table_schema = `
CREATE TABLE IF NOT EXISTS TrainingSetTable (
    RecordID INTEGER PRIMARY KEY,
    HobbyID INTEGER,
    Question1 FLOAT,
    Question2 FLOAT,
    Question3 FLOAT,
    Question4 FLOAT,
    Question5 FLOAT,
    Question6 FLOAT,
    Question7 FLOAT,
    Question8 FLOAT,
    Question9 FLOAT,
    Question10 FLOAT,
    Question11 FLOAT,
    Question12 FLOAT,
    Question13 FLOAT,
    Question14 FLOAT,
    Question15 FLOAT,
    FOREIGN KEY (HobbyID) REFERENCES HobbyTable(HobbyID)
);
`

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
    await manager.dbExecute(training_set_table_schema);

    // Load training set from CSV
    if (!await manager.dbGet(`SELECT RecordID FROM TrainingSetTable;`)) {
        await loadTrainingSet();
    }

    console.log(await getTrainingSet());
}

export const initPromise = init();
