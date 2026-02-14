import csv from "csvtojson";

import { manager, addHobby } from "./index.js"

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
    return data.map(row => row.splice(1))
                .map(row => [row.shift().split(",")
                .map(str => str.toLowerCase().trim())].concat(row));
}

/**
 * Initialises the training set, loading from a CSV file.
 */
export async function loadTrainingSet() {
    const training_data = await loadTrainingSetFromCSV("./backend/dbManagement/training_set.csv");

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

export async function getTrainingSet() {
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