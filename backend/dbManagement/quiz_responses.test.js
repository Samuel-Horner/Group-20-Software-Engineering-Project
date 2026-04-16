import { afterAll, beforeAll, describe, test, expect, jest } from "@jest/globals"
import fs from "fs";

import { DBManager } from "./DBManager.js";
import { init, add, table_name } from "./quiz_responses.js";
import account_system from "./account_system.js";

describe("Quiz Response Database", () => {
    const manager = new DBManager("./data/quiz_response.test.db", false);

    beforeAll(async () => {
        await manager.establishConnection();
        await manager.dbExecute(`PRAGMA foreign_keys = ON;`);

        await account_system.init(manager);
        await account_system.createAccount("test", "test", manager);
    });

    test("Init", async () => {
        await expect(init("foo", manager)).rejects.toThrow(`ENOENT: no such file or directory, open 'foo'`);
        await expect(init("quiz.json", manager)).resolves.toBeUndefined();
    });

    test("Add", async () => {
        await init("quiz.json", manager);

        await expect(add(undefined, [], undefined, manager)).rejects.toThrow("Expected 15 answers, got 0.");
        await expect(add(undefined, [], [], manager)).rejects.toThrow("Expected 15 answers, got 0.");

        const sample1 = [5, 3, 5, 5, 4, 5, 5, 5, 5, 5, 3, 4, 4, 5, 4];
        await expect(add(undefined, sample1, [], manager)).resolves.toBeUndefined();
        await expect(add(1, sample1, [], manager)).resolves.toBeUndefined();

        await expect(manager.dbGet(`SELECT * FROM ${table_name}`)).resolves.toEqual([
            {
                ResponseID: 1,
                UserID: null,
                HobbyJSON: '[]',
                Question1: 5,
                Question2: 3,
                Question3: 5,
                Question4: 5,
                Question5: 4,
                Question6: 5,
                Question7: 5,
                Question8: 5,
                Question9: 5,
                Question10: 5,
                Question11: 3,
                Question12: 4,
                Question13: 4,
                Question14: 5,
                Question15: 4
            },
            {
                ResponseID: 2,
                UserID: 1,
                HobbyJSON: '[]',
                Question1: 5,
                Question2: 3,
                Question3: 5,
                Question4: 5,
                Question5: 4,
                Question6: 5,
                Question7: 5,
                Question8: 5,
                Question9: 5,
                Question10: 5,
                Question11: 3,
                Question12: 4,
                Question13: 4,
                Question14: 5,
                Question15: 4
            }
        ]);
    });

    afterAll(() => {
        manager.dbClose();
        fs.rmSync("./data/quiz_response.test.db");
    });
});