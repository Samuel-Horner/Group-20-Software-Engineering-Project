import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { jest, describe, test, expect, beforeAll, afterAll } from "@jest/globals";

import { DBManager } from "./DBManager.js";

const TEST_DB_PATH = path.join(
    os.tmpdir(),
    `networking-${process.pid}-${Date.now()}.test.db`
);

const hobbyTableSchema = `
CREATE TABLE IF NOT EXISTS HobbyTable (
    HobbyID INTEGER PRIMARY KEY AUTOINCREMENT,
    HobbyName TEXT UNIQUE
);
`;

describe("Networking DB", () => {
    let manager;
    let networkingModule;

    beforeAll(async () => {
        for (let i = 0; i < 8; i++) {
            try {
                if (fs.existsSync(TEST_DB_PATH)) {
                    fs.unlinkSync(TEST_DB_PATH);
                }
                break;
            } catch (error) {
                if ((error?.code === "EBUSY" || error?.code === "EPERM") && i < 7) {
                    await new Promise((resolve) => setTimeout(resolve, 100));
                    continue;
                }
                throw error;
            }
        }

        manager = new DBManager(TEST_DB_PATH);
        await manager.establishConnection();
        await manager.dbExecute(hobbyTableSchema);

        jest.unstable_mockModule("./index.js", () => ({ manager }));
        networkingModule = await import("./networking.js");

        await networkingModule.initNetworkingStorage();
    });

    afterAll(async () => {
        if (manager) {
            await manager.dbClose();
        }

        if (fs.existsSync(TEST_DB_PATH)) {
            fs.rmSync(TEST_DB_PATH, { force: true });
        }
    });

    test("initNetworkingStorage seeds account data", async () => {
        const accountCount = await manager.dbGet("SELECT COUNT(*) AS total FROM NetworkAccount;");
        const linkCount = await manager.dbGet("SELECT COUNT(*) AS total FROM NetworkAccountHobby;");

        expect(accountCount[0].total).toBe(8);
        expect(linkCount[0].total).toBeGreaterThan(0);
    });

    test("getNetworkingHobbies returns a sorted hobby list", async () => {
        const hobbies = await networkingModule.getNetworkingHobbies();
        const sortedCopy = [...hobbies].sort((a, b) => a.localeCompare(b));

        expect(hobbies.length).toBeGreaterThan(0);
        expect(hobbies).toEqual(sortedCopy);
        expect(hobbies).toContain("Photography");
        expect(hobbies).toContain("Gaming");
    });

    test("searchNetworkingAccounts with no filters returns all accounts", async () => {
        const rows = await networkingModule.searchNetworkingAccounts();
        const usernames = rows.map((row) => row.username);

        expect(rows).toHaveLength(8);
        expect(usernames).toContain("sarah_chen");
        expect(usernames).toContain("alex_nguyen");
    });

    test("searchNetworkingAccounts supports case-insensitive text search", async () => {
        const rows = await networkingModule.searchNetworkingAccounts({ search: "SaRaH" });

        expect(rows).toHaveLength(1);
        expect(rows[0].username).toBe("sarah_chen");
    });

    test("searchNetworkingAccounts filters by hobbies (case-insensitive)", async () => {
        const rows = await networkingModule.searchNetworkingAccounts({ hobbies: ["gAmInG"] });
        const usernames = rows.map((row) => row.username);

        expect(usernames).toContain("marcus_johnson");
        expect(usernames).toContain("alex_nguyen");
        expect(usernames).toContain("owen_brown");
    });

    test("searchNetworkingAccounts works with non-array hobbies", async () => {
        const rows = await networkingModule.searchNetworkingAccounts({ hobbies: "gAmInG" });
        const usernames = rows.map((row) => row.username);

        expect(usernames).toContain("marcus_johnson");
        expect(usernames).toContain("alex_nguyen");
        expect(usernames).toContain("owen_brown");
    });

    test("searchNetworkingAccounts combines search and hobby filters", async () => {
        const rows = await networkingModule.searchNetworkingAccounts({
            search: "alex",
            hobbies: ["Gaming"]
        });

        expect(rows).toHaveLength(1);
        expect(rows[0].username).toBe("alex_nguyen");
        expect(rows[0].hobbies).toContain("Gaming");
    });
});
// To run it cd to backend and then run by (npm test --dbManagement/networking.test.js) //
