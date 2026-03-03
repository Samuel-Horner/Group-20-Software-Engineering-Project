import fs from "fs";

import {DBManager} from './DBManager.js';

const schema = `
CREATE TABLE IF NOT EXISTS users (
    username TEXT,
    email TEXT,
    takenQuiz BOOLEAN
);
`;

describe('DBManager Tests', () => {
    afterAll(() => {
        fs.rmSync("./data/test.db");
    });

    // Database Initialization Test
    test('Initialization', async () => {
        // Test verbose manager
        const TestManager = new DBManager("./data/test.db", true);

        await expect(TestManager.establishConnection()).resolves.toBeUndefined();
        await expect(TestManager.dbExecute(schema)).resolves.toBeUndefined();

        TestManager.dbClose();

        // Try to open DB in non existant directory
        // Assumes the user does not have write permission to /usr/bin
        // Fail case taken from: https://github.com/TryGhost/node-sqlite3/blob/master/test/open_close.test.js
        const FailedOpen = new DBManager("/test/tmp/directory-does-not-exist/test.db");
        await expect(FailedOpen.establishConnection()).rejects.toThrow("SQLITE_CANTOPEN: unable to open database file");
    });

    test('Calling Before Initialization', async () => {
        const TestManager = new DBManager("./data/test.db");

        // Attempt to perform operations before initialisation
        await expect(TestManager.dbExecute(null)).rejects.toThrow(); 
        await expect(TestManager.dbGet(null)).rejects.toThrow();
        // Close should never error
        expect(TestManager.dbClose()).toBeUndefined();
    });

    // Database Manipulation Tests
    describe('Database Manipulation', () => {
        const TestManager = new DBManager("./data/test.db");
        
        beforeEach( async () => {
            await TestManager.establishConnection();
            await TestManager.dbExecute(schema);
        });

        afterAll( async () => {
            TestManager.dbClose();
        });

        afterEach( async () => {
            await TestManager.dbExecute("DROP TABLE users");
        });

        test('Manipulation', async () => {
            await expect(TestManager.dbExecute("INSERT INTO users VALUES (?,?,?)",["username1","username1@gmail.com",true])).resolves.toBeUndefined();
            await expect(TestManager.dbExecute("INSERT INTO users VALUES (?,?,?)",["f1rst","f1rst@outlook.com",false])).resolves.toBeUndefined();
            await expect(TestManager.dbExecute("INSERT INTO users VALUES (?,?,?)",["hobbies4fun","hobbies4fun@gmail.com",true])).resolves.toBeUndefined();
            await expect(TestManager.dbExecute("INSERT INTO ? VALUES (?,?,?)",["users","f1rst","f1rst@outlook.com",false])).rejects.toThrow("SQLITE_ERROR: near \"?\": syntax error");
            await expect(TestManager.dbExecute("UPDATE users SET username = ?, takenQuiz = ? WHERE username = ?",["s3c0nd",true,"f1rst"])).resolves.toBeUndefined();
            await expect(TestManager.dbExecute("DELETE FROM users WHERE username = ?",["username1"])).resolves.toBeUndefined();
        });

        test('Querying', async () => {
            // Set up database
            await expect(TestManager.dbExecute("INSERT INTO users VALUES (?,?,?)",["f1rst","f1rst@outlook.com",false])).resolves.toBeUndefined();
            await expect(TestManager.dbExecute("INSERT INTO users VALUES (?,?,?)",["hobbies4fun","hobbies4fun@gmail.com",true])).resolves.toBeUndefined();
            await expect(TestManager.dbExecute("INSERT INTO ? VALUES (?,?,?)",["users","f1rst","f1rst@outlook.com",false])).rejects.toThrow("SQLITE_ERROR: near \"?\": syntax error");
            await expect(TestManager.dbExecute("UPDATE users SET username = ?, takenQuiz = ? WHERE username = ?",["s3c0nd",true,"f1rst"])).resolves.toBeUndefined();

            await expect(TestManager.dbGet("SELECT * FROM users WHERE username = ?",["s3c0nd"])).resolves.toEqual([{"email": "f1rst@outlook.com", "takenQuiz": 1, "username": "s3c0nd"}]);
            await expect(TestManager.dbGet("SELECT * FROM users WHERE username = ?",["ilovefishing2002"])).resolves.toEqual([]);
            await expect(TestManager.dbGet("SELECT (username,email) FROM users WHE takenQuiz",[true])).rejects.toThrow("SQLITE_ERROR: near \"takenQuiz\": syntax error");
            // await expect(TestManager.dbGet("INSERT INTO users VALUES (?,?,?)",["null",null,null])).resolves.toBe("Error: Error: custom_ERROR: sqlCommand only accepts 'SELECT'");
        });
    });
});

/*
Test by running within the terminal (cd to folder first): npm test DBManagerTest.test.js
*/
