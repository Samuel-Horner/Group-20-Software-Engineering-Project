import { afterAll, beforeAll, describe, test, jest } from "@jest/globals";

import fs from "fs";

import { DBManager } from "./DBManager.js";
import account_system from "./account_system.js";

describe("Account System Database", () => {
    afterAll(() => {
        fs.rmSync("./data/account_system.test.db");
    });

    describe("DB Operations", () => {
        const manager = new DBManager("./data/account_system.test.db");

        beforeAll(async () => {
            await manager.establishConnection();
            await manager.dbExecute(`PRAGMA foreign_keys = ON;`);
        });

        afterEach(async () => {
            await manager.dbExecute(`DROP TABLE UserAccounts;`);
        });

        afterAll(async () => {
            await manager.dbClose();
        });

        test("Create Account", async () => {
            await account_system.init(manager);

            await expect(account_system.createAccount(null, null, manager)).rejects.toThrow("Invalid username / password");

            await account_system.createAccount("test_username", "test_password", manager);

            await expect(account_system.createAccount("test_username", "foo", manager)).rejects.toThrow("Account already exists");
        });

        test("Login", async () => {
            await account_system.init(manager);
            await account_system.createAccount("test_username", "test_password", manager);

            await expect(account_system.login(null, null, manager)).rejects.toThrow("Invalid username / password");
            await expect(account_system.login("foo", "foo", manager)).rejects.toThrow("Account does not exist");
            await expect(account_system.login("test_username", "foo", manager)).rejects.toThrow("Invalid password");

            await account_system.login("test_username", "test_password", manager);
        });

        test("Logout", async () => {
            await account_system.init(manager);
            await account_system.createAccount("test_username", "test_password", manager);
            const session = await account_system.login("test_username", "test_password", manager);

            await expect(account_system.logout(null, manager)).rejects.toThrow("Invalid session");
            await expect(account_system.logout({ account_id: session.account_id, session_key: null }, manager)).rejects.toThrow("Invalid session");
            await expect(account_system.logout({ account_id: null, session_key: session.session_key }, manager)).rejects.toThrow("Invalid session");

            await account_system.logout(session, manager);

            await expect(account_system.logout(session, manager)).rejects.toThrow("Invalid session");
            await expect(account_system.logout({ account_id: 2, session_key: session.session_key }, manager)).rejects.toThrow("Invalid session");

            await manager.dbExecute(
                `UPDATE UserAccounts SET SessionKey = "abc", SessionExpiry = NULL WHERE AccountID = ?`,
                [session.account_id]
            );

            await expect(account_system.logout({ account_id: session.account_id, session_key: "abc" }, manager)).rejects.toThrow("Invalid session");
        });

        test("Delete Account", async () => {
            await account_system.init(manager);
            await account_system.createAccount("test_username", "test_password", manager);
            const session = await account_system.login("test_username", "test_password", manager);

            await expect(account_system.deleteAccount(null, null, manager)).rejects.toThrow("Invalid session / password");
            await expect(account_system.deleteAccount({ account_id: 2, session_key: session.session_key }, "foo", manager)).rejects.toThrow("Invalid session");
            await expect(account_system.deleteAccount({ account_id: session.account_id, session_key: "foo" }, "foo", manager)).rejects.toThrow("Invalid session");
            await expect(account_system.deleteAccount(session, "foo", manager)).rejects.toThrow("Invalid password");

            await account_system.deleteAccount(session, "test_password", manager);

            await expect(account_system.deleteAccount(session, "test_password", manager)).rejects.toThrow("Invalid session");
        });

        test("Update Account", async () => {
            await account_system.init(manager);
            await account_system.createAccount("test_username", "test_password", manager);
            const session = await account_system.login("test_username", "test_password", manager);

            await expect(account_system.updateAccount(null, null, manager)).rejects.toThrow("Invalid session / data");
            await expect(account_system.updateAccount(session, null, manager)).rejects.toThrow("Invalid session / data");
            await expect(account_system.updateAccount({ account_id: session.account_id, session_key: "foo" }, {"foo": 1}, manager)).rejects.toThrow("Invalid session");
            await expect(account_system.updateAccount(session, { "foo": 1 }, manager)).rejects.toThrow("Invalid changes");
            await expect(account_system.updateAccount(session, { "foo": 1, "Fullname": "Test Fullname" }, manager)).rejects.toThrow("Invalid changes");

            await account_system.updateAccount(session, { "Fullname": "Test Fullname" }, manager);
        });

        test("Get Account", async () => {
            await account_system.init(manager);
            await account_system.createAccount("test_username", "test_password", manager);
            const session = await account_system.login("test_username", "test_password", manager);

            await expect(account_system.getAccountInformation("foo", manager)).rejects.toThrow("Account does not exist");
            expect((await account_system.getAccountInformation("test_username", manager)).Username).toBe("test_username");

            await expect(account_system.getAccountInformationByID(2, manager)).rejects.toThrow("Account does not exist");
            expect((await account_system.getAccountInformationByID(session.account_id, manager)).Username).toBe("test_username");
        });
    });
});