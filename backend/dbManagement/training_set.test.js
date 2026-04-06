import fs from "fs";

import { DBManager } from "./DBManager.js";
import hobby_set from "./hobby_set.js";
import { loadTrainingSetFromCSV, init, load, get } from "./training_set.js";

describe("Training Set Database", () => {
    afterAll(() => {
        fs.rmSync("./data/training_set.test.db"); 
    });

    test("Load CSV", async () => {
        await expect(loadTrainingSetFromCSV("./data/training_set.test.csv")).resolves.toStrictEqual([[["video games", "running"], 5, 3, 5, 5, 4, 5, 1, 2, 5, 5, 3, 4, 4, 5, 4]]);

        await expect(loadTrainingSetFromCSV("foo")).rejects.toThrow("File does not exist at foo. Check to make sure the file path to your csv is correct.");
    });
    
    describe("DB Operations", () => {
        const manager = new DBManager("./data/training_set.test.db");

        beforeAll(async () => {
            await manager.establishConnection();
            await manager.dbExecute(`PRAGMA foreign_keys = ON;`);
        
            await hobby_set.init(manager);
        });

        afterEach(async () => {
            await manager.dbExecute(`DROP TABLE TrainingSetTable;`);
        });

        afterAll(async () => {
            await manager.dbClose();
        });

        test("Init", async () => {
            await expect(init("foo", manager)).rejects.toThrow(`No file at "foo" exists.`);
            await expect(init("./data/training_set.test.csv", manager)).resolves.toBeUndefined();
            // Try initing an already initted table.
            await expect(init("./data/training_set.test.csv", manager)).resolves.toBeUndefined();
        });

        test("Load", async () => {
            await init("./data/training_set.test.csv", manager);

            await expect(load("foo", manager)).rejects.toThrow("File does not exist at foo. Check to make sure the file path to your csv is correct.");
            await expect(load("./data/training_set.test.csv", manager)).resolves.toBeUndefined();
        });

        test("Get", async () => {
            await init("./data/training_set.test.csv", manager);

            await expect(get(manager)).resolves.toEqual([{"HobbyID":1,"HobbyName":"video games","Question1":5,"Question2":3,"Question3":5,"Question4":5,"Question5":4,"Question6":5,"Question7":1,"Question8":2,"Question9":5,"Question10":5,"Question11":3,"Question12":4,"Question13":4,"Question14":5,"Question15":4},{"HobbyID":2,"HobbyName":"running","Question1":5,"Question2":3,"Question3":5,"Question4":5,"Question5":4,"Question6":5,"Question7":1,"Question8":2,"Question9":5,"Question10":5,"Question11":3,"Question12":4,"Question13":4,"Question14":5,"Question15":4}]);
        });
    });
});