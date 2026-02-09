import {DBManager} from './DBManager.js';

describe('DBManager Tests', () => {
    const TestManager = new DBManager();

    // Database Initialization Test
    test('Initialization', async () => {
        await expect(TestManager.establishConnection()).resolves.toBe("establishConnection: Success");
        await expect(TestManager.initialiseSchema()).resolves.toBe("initialiseSchema: Success");
    });

    // Database Manipulation Tests
    describe('Database Manipulation', () => {
        const TestManager = new DBManager();
        
        beforeEach( async () => {
            await TestManager.establishConnection();
            await TestManager.initialiseSchema();
        });

        test('Schema Dropping', async () => {
            await expect(TestManager.dropSchema()).resolves.toBe("dropSchema: Success");
        });

        test('Manipulation', async () => {
            await expect(TestManager.dbExecute("INSERT INTO users VALUES (?,?,?)",["username1","username1@gmail.com",true])).resolves.toBe("dbExecute: Success");
            await expect(TestManager.dbExecute("INSERT INTO users VALUES (?,?,?)",["f1rst","f1rst@outlook.com",false])).resolves.toBe("dbExecute: Success");
            await expect(TestManager.dbExecute("INSERT INTO users VALUES (?,?,?)",["hobbies4fun","hobbies4fun@gmail.com",true])).resolves.toBe("dbExecute: Success");
            await expect(TestManager.dbExecute("INSERT INTO ? VALUES (?,?,?)",["users","f1rst","f1rst@outlook.com",false])).resolves.toBe("dbExecute: SQLITE_ERROR: near \"?\": syntax error");
            await expect(TestManager.dbExecute("DROP TABLE users",[])).resolves.toBe("dbExecute: custom_ERROR: Use 'dropSchema' to drop the table");

            await expect(TestManager.dbExecute("UPDATE users SET username = ?, takenQuiz = ? WHERE username = ?",["s3c0nd",true,"f1rst"])).resolves.toBe("dbExecute: Success");
            await expect(TestManager.dbExecute("DELETE FROM users WHERE username = ?",["username1"])).resolves.toBe("dbExecute: Success");
        });

        test('Querying', async () => {
            await expect(TestManager.dbGet("SELECT * FROM users WHERE username = ?",["s3c0nd"])).resolves.toEqual([{"email": "f1rst@outlook.com", "takenQuiz": 1, "username": "s3c0nd"}]);
            await expect(TestManager.dbGet("SELECT * FROM users WHERE username = ?",["ilovefishing2002"])).resolves.toEqual([]);
            await expect(TestManager.dbGet("SELECT (username,email) FROM users WHE takenQuiz",[true])).resolves.toBe("dbGet: SQLITE_ERROR: near \"takenQuiz\": syntax error");
            await expect(TestManager.dbGet("INSERT INTO users VALUES (?,?,?)",["null",null,null])).resolves.toBe("dbExecute: custom_ERROR: sqlCommand only accepts 'SELECT'");
        });
    });
});

/*
Test by running within the terminal (cd to folder first): npm test DBManagerTest.test.js
*/
