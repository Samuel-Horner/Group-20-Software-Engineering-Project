import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";

import { DBManager } from "./DBManager.js";
import hobby_set from "./hobby_set.js";
import networking from "./networking.js";

const TEST_DB_PATH = path.join(
    os.tmpdir(),
    `networking-${process.pid}-${Date.now()}.test.db`
);

describe("Networking DB", () => {
    let manager;

    beforeAll(async () => {
        if (fs.existsSync(TEST_DB_PATH)) {
            fs.unlinkSync(TEST_DB_PATH);
        }

        manager = new DBManager(TEST_DB_PATH, false);
        await manager.establishConnection();
        await manager.dbExecute("PRAGMA foreign_keys = ON;");
        await hobby_set.init(manager);
        await networking.init(manager);
    });

    afterAll(async () => {
        if (manager) {
            await manager.dbClose();
        }

        if (fs.existsSync(TEST_DB_PATH)) {
            fs.rmSync(TEST_DB_PATH, { force: true });
        }
    });

    describe("init", () => {
        test("creates NetworkAccount and NetworkAccountHobby tables", async () => {
            const tables = await manager.dbGet(
                "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('NetworkAccount','NetworkAccountHobby') ORDER BY name;"
            );
            expect(tables.map((t) => t.name)).toEqual(["NetworkAccount", "NetworkAccountHobby"]);
        });

        test("creates indexes", async () => {
            const indexes = await manager.dbGet(
                "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_network%' ORDER BY name;"
            );
            expect(indexes).toHaveLength(3);
        });

        test("calling init twice does not error", async () => {
            await expect(networking.init(manager)).resolves.toBeUndefined();
        });
    });

    describe("seed", () => {
        test("seeds account data", async () => {
            await networking.seed(manager);

            const accountCount = await manager.dbGet("SELECT COUNT(*) AS total FROM NetworkAccount;");
            const linkCount = await manager.dbGet("SELECT COUNT(*) AS total FROM NetworkAccountHobby;");

            expect(accountCount[0].total).toBe(8);
            expect(linkCount[0].total).toBeGreaterThan(0);
        });

        test("seeding twice does not duplicate data (INSERT OR IGNORE)", async () => {
            await networking.seed(manager);

            const accountCount = await manager.dbGet("SELECT COUNT(*) AS total FROM NetworkAccount;");
            expect(accountCount[0].total).toBe(8);
        });
    });

    describe("getHobbies", () => {
        test("returns a sorted hobby list", async () => {
            const hobbies = await networking.getHobbies(manager);
            const sortedCopy = [...hobbies].sort((a, b) => a.localeCompare(b));

            expect(hobbies.length).toBeGreaterThan(0);
            expect(hobbies).toEqual(sortedCopy);
            expect(hobbies).toContain("Photography");
            expect(hobbies).toContain("Gaming");
        });

        test("returns empty array when no accounts have hobbies", async () => {
            const emptyManager = new DBManager(path.join(os.tmpdir(), `net-empty-${Date.now()}.db`), false);
            await emptyManager.establishConnection();
            await emptyManager.dbExecute("PRAGMA foreign_keys = ON;");
            await hobby_set.init(emptyManager);
            await networking.init(emptyManager);

            const hobbies = await networking.getHobbies(emptyManager);
            expect(hobbies).toEqual([]);

            emptyManager.dbClose();
        });
    });

    describe("searchAccounts", () => {
        test("with no filters returns all accounts", async () => {
            const rows = await networking.searchAccounts({}, manager);
            const usernames = rows.map((row) => row.username);

            expect(rows).toHaveLength(8);
            expect(usernames).toContain("sarah_chen");
            expect(usernames).toContain("alex_nguyen");
        });

        test("with no arguments returns all accounts", async () => {
            const rows = await networking.searchAccounts(undefined, manager);
            expect(rows).toHaveLength(8);
        });

        test("supports case-insensitive text search by username", async () => {
            const rows = await networking.searchAccounts({ search: "SaRaH" }, manager);

            expect(rows).toHaveLength(1);
            expect(rows[0].username).toBe("sarah_chen");
        });

        test("supports text search matching hobby names", async () => {
            const rows = await networking.searchAccounts({ search: "photo" }, manager);
            const usernames = rows.map((r) => r.username);

            expect(usernames).toContain("sarah_chen");
            expect(usernames).toContain("david_kim");
            expect(usernames).toContain("owen_brown");
        });

        test("filters by hobbies (case-insensitive)", async () => {
            const rows = await networking.searchAccounts({ hobbies: ["gAmInG"] }, manager);
            const usernames = rows.map((row) => row.username);

            expect(usernames).toContain("marcus_johnson");
            expect(usernames).toContain("alex_nguyen");
            expect(usernames).toContain("owen_brown");
        });

        test("combines search and hobby filters", async () => {
            const rows = await networking.searchAccounts({
                search: "alex",
                hobbies: ["Gaming"]
            }, manager);

            expect(rows).toHaveLength(1);
            expect(rows[0].username).toBe("alex_nguyen");
            expect(rows[0].hobbies).toContain("Gaming");
        });

        test("handles hobbies as a single string instead of array", async () => {
            const rows = await networking.searchAccounts({ hobbies: "Gaming" }, manager);
            const usernames = rows.map((row) => row.username);

            expect(usernames).toContain("marcus_johnson");
            expect(usernames).toContain("alex_nguyen");
        });

        test("ignores empty and whitespace-only hobby filters", async () => {
            const rows = await networking.searchAccounts({ hobbies: ["", "  ", "Gaming"] }, manager);
            const usernames = rows.map((row) => row.username);

            expect(usernames).toContain("marcus_johnson");
        });

        test("deduplicates hobby filters", async () => {
            const rows = await networking.searchAccounts({ hobbies: ["Gaming", "gaming", "GAMING"] }, manager);
            const usernames = rows.map((row) => row.username);

            expect(usernames).toContain("marcus_johnson");
            expect(usernames).toContain("alex_nguyen");
        });

        test("returns empty array when search matches nothing", async () => {
            const rows = await networking.searchAccounts({ search: "nonexistentuser12345" }, manager);
            expect(rows).toEqual([]);
        });

        test("returns empty array when hobby filter matches nothing", async () => {
            const rows = await networking.searchAccounts({ hobbies: ["UnknownHobby999"] }, manager);
            expect(rows).toEqual([]);
        });

        test("each account has username, description, and sorted hobbies array", async () => {
            const rows = await networking.searchAccounts({ search: "sarah_chen" }, manager);

            expect(rows).toHaveLength(1);
            expect(rows[0]).toHaveProperty("username", "sarah_chen");
            expect(rows[0]).toHaveProperty("description");
            expect(Array.isArray(rows[0].hobbies)).toBe(true);
            expect(rows[0].hobbies.length).toBeGreaterThan(0);

            const sorted = [...rows[0].hobbies].sort((a, b) => a.localeCompare(b));
            expect(rows[0].hobbies).toEqual(sorted);
        });

        test("accounts with no hobbies return empty hobbies array", async () => {
            await manager.dbExecute(
                "INSERT OR IGNORE INTO NetworkAccount (Username, Description) VALUES (?, ?);",
                ["lonely_user", "Has no hobbies"]
            );

            const rows = await networking.searchAccounts({ search: "lonely_user" }, manager);
            expect(rows).toHaveLength(1);
            expect(rows[0].hobbies).toEqual([]);

            await manager.dbExecute("DELETE FROM NetworkAccount WHERE Username = ?;", ["lonely_user"]);
        });

        test("whitespace-only search is treated as no search", async () => {
            const rows = await networking.searchAccounts({ search: "   " }, manager);
            expect(rows).toHaveLength(8);
        });
    });
});
