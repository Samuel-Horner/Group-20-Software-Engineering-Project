import csv from "csvtojson";

import { manager, addHobby } from "./index.js"

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
`;

/**
 * Loads the training set from a CSV file.
 * @param {string} path 
 * @returns A passed array, of the form [[["hobby1", "hobby2"], 1, 2, 3, ...], [...], [...], ...]
 */
async function loadTrainingSetFromCSV(path) {
    let data = await csv({
        output: "csv",
        trim:true
    }).fromFile(path);

    // Maps array of the form:
    // [ "item1, Item2  ", 1, 2, 3, ...]
    // To:
    // [ ["item1", "item2"], 1, 2, 3, ...]
    console.log(data);

    return data.map(row => row.splice(1))
                .map(row => [row.shift().split(",")
                .map(str => str.toLowerCase().trim().replace(".", ""))].concat(row));
}

/**
 * Initialises the training set, loading from a CSV file.
 */
export async function load(path) {
    const training_data = await loadTrainingSetFromCSV(path);

    training_data.forEach(row => {
        const hobbies = row.shift();
        hobbies.forEach(async hobby => {
            const id = await addHobby(hobby);
            await manager.dbExecute(`
                INSERT INTO TrainingSetTable (
                    HobbyID,
                    Question1,
                    Question2,
                    Question3,
                    Question4,
                    Question5,
                    Question6,
                    Question7,
                    Question8,
                    Question9,
                    Question10,
                    Question11,
                    Question12,
                    Question13,
                    Question14,
                    Question15
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            `, [id, ...row]);
        });
    });
}

/**
 * @returns All records from the training set  DB
 */
export async function get() {
    return await manager.dbGet(`
        SELECT 
            TrainingSetTable.HobbyID,
            HobbyTable.HobbyName,
            TrainingSetTable.Question1,
            TrainingSetTable.Question2,
            TrainingSetTable.Question3,
            TrainingSetTable.Question4,
            TrainingSetTable.Question5,
            TrainingSetTable.Question6,
            TrainingSetTable.Question7,
            TrainingSetTable.Question8,
            TrainingSetTable.Question9,
            TrainingSetTable.Question10,
            TrainingSetTable.Question11,
            TrainingSetTable.Question12,
            TrainingSetTable.Question13,
            TrainingSetTable.Question14,
            TrainingSetTable.Question15
        FROM TrainingSetTable
        JOIN HobbyTable;
    `);
}

/**
 * Initilaises the training set database, loading survey data from
 * ./backend/data/traning_set.csv
 * 
 * Relies on the HobbyDB being initiliased.
 */
export async function init() {
    await manager.dbExecute(training_set_table_schema);

    // Load training set from CSV
    const training_set_populated = (await manager.dbGet(`SELECT RecordID FROM TrainingSetTable;`)).length != 0;
    if (!training_set_populated) {
        await load("./backend/data/training_set.csv");
    }
}

export default {
    init,
    load,
    get
};