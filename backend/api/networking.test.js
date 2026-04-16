import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";

import { DBManager } from "../dbManagement/DBManager.js";
import hobby_set from "../dbManagement/hobby_set.js";
import networking from "../dbManagement/networking.js";
import { parseHobbyFilters, networkAccountsHandler, networkHobbiesHandler } from "./networking.js";

const TEST_DB_PATH = path.join(
    os.tmpdir(),
    `net-api-${process.pid}-${Date.now()}.test.db`
);

function mockRes() {
    const res = {
        code: null,
        body: null,
        headers: {},
        setHeader(key, val) { res.headers[key] = val; return res; },
        writeHead(code) { res.code = code; return res; },
        end(body) { res.body = body; return res; }
    };
    return res;
}

describe("parseHobbyFilters", () => {
    function mockSearchParams(entries) {
        const map = new Map();
        for (const [key, val] of entries) {
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(val);
        }
        return {
            getAll(key) { return map.get(key) || []; }
        };
    }

    test("returns empty array when no hobbies param", () => {
        const result = parseHobbyFilters(mockSearchParams([]));
        expect(result).toEqual([]);
    });

    test("splits comma-separated values", () => {
        const result = parseHobbyFilters(mockSearchParams([["hobbies", "Gaming,Photography"]]));
        expect(result).toEqual(["Gaming", "Photography"]);
    });

    test("handles repeated params", () => {
        const result = parseHobbyFilters(mockSearchParams([
            ["hobbies", "Gaming"],
            ["hobbies", "Photography"]
        ]));
        expect(result).toEqual(["Gaming", "Photography"]);
    });

    test("deduplicates values", () => {
        const result = parseHobbyFilters(mockSearchParams([
            ["hobbies", "Gaming,Gaming"],
            ["hobbies", "Gaming"]
        ]));
        expect(result).toEqual(["Gaming"]);
    });

    test("trims whitespace and filters empty strings", () => {
        const result = parseHobbyFilters(mockSearchParams([["hobbies", " Gaming , , Photography "]]));
        expect(result).toEqual(["Gaming", "Photography"]);
    });
});

describe("Network API Handlers", () => {
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
        await networking.seed(manager);
    });

    afterAll(async () => {
        if (manager) {
            await manager.dbClose();
        }

        if (fs.existsSync(TEST_DB_PATH)) {
            fs.rmSync(TEST_DB_PATH, { force: true });
        }
    });

    describe("networkAccountsHandler", () => {
        function mockUrl(search = "", hobbies = []) {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            for (const h of hobbies) params.append("hobbies", h);
            return { searchParams: params };
        }

        test("returns all accounts with no filters", async () => {
            const res = mockRes();
            await networkAccountsHandler(null, res, mockUrl(), manager);

            expect(res.code).toBe(200);
            const body = JSON.parse(res.body);
            expect(body.count).toBe(8);
            expect(body.accounts).toHaveLength(8);
            expect(body.appliedFilters).toEqual({ search: "", hobbies: [] });
        });

        test("filters by search term", async () => {
            const res = mockRes();
            await networkAccountsHandler(null, res, mockUrl("sarah"), manager);

            expect(res.code).toBe(200);
            const body = JSON.parse(res.body);
            expect(body.count).toBe(1);
            expect(body.accounts[0].username).toBe("sarah_chen");
        });

        test("filters by hobbies", async () => {
            const res = mockRes();
            await networkAccountsHandler(null, res, mockUrl("", ["Gaming"]), manager);

            expect(res.code).toBe(200);
            const body = JSON.parse(res.body);
            expect(body.count).toBe(3);
            expect(body.appliedFilters.hobbies).toEqual(["Gaming"]);
        });

        test("returns 500 on database error", async () => {
            const brokenManager = {
                dbGet() { throw new Error("DB failure"); }
            };
            const res = mockRes();
            await networkAccountsHandler(null, res, mockUrl(), brokenManager);

            expect(res.code).toBe(500);
            expect(res.body).toBe("Failed to query networking accounts");
        });

        test("sets Content-Type to application/json on success", async () => {
            const res = mockRes();
            await networkAccountsHandler(null, res, mockUrl(), manager);

            expect(res.headers["Content-Type"]).toBe("application/json");
        });
    });

    describe("networkHobbiesHandler", () => {
        test("returns hobby list", async () => {
            const res = mockRes();
            await networkHobbiesHandler(null, res, null, manager);

            expect(res.code).toBe(200);
            const body = JSON.parse(res.body);
            expect(body.hobbies).toContain("Photography");
            expect(body.hobbies).toContain("Gaming");
        });

        test("returns 500 on database error", async () => {
            const brokenManager = {
                dbGet() { throw new Error("DB failure"); }
            };
            const res = mockRes();
            await networkHobbiesHandler(null, res, null, brokenManager);

            expect(res.code).toBe(500);
            expect(res.body).toBe("Failed to query hobbies");
        });

        test("sets Content-Type to application/json on success", async () => {
            const res = mockRes();
            await networkHobbiesHandler(null, res, null, manager);

            expect(res.headers["Content-Type"]).toBe("application/json");
        });
    });
});
