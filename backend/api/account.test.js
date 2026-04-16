import { afterAll, beforeAll, describe, test, jest } from "@jest/globals";

import path from "path";
import fs from "fs";

import { DBManager } from "../dbManagement/DBManager.js";
import account_system, { createAccount } from "../dbManagement/account_system.js";
import { createHTTPServer, registerPOSTHandler } from "../server/server";
import config from "../config";

import { loginHandler, createAccountHandler, logoutHandler, deleteAccountHandler, updateAccountHandler, getAccountInformationHandler, validateSessionHandler } from "./account.js";



async function mockHandler(handler, body, cookies, manager) {
    let req = {
        headers: {
            cookie: Object.entries(cookies).map(([name, value]) => `${name}=${encodeURIComponent(value)}`).join(";"),
        },

        body: JSON.stringify(body),
    };

    let res = {
        status: null,
        body: null,
        headers: {},

        setHeader(name, value) {
            this.headers[name] = value;
            return this;
        },

        writeHead(code) {
            this.status = code;
            return this;
        },

        end(body) {
            this.body = body;
            return this;
        },
    };

    await handler(req, res, body, manager);

    return res;
}


describe("Account API", () => {
    let server;
    let port;
    const manager = new DBManager("./data/account_api.test.db", false);

    async function postURL(url, body = {}, session = {}) {
        return fetch(`http://${config.URL}:${port}/${url}`,
            {
                method: "POST",
                body: JSON.stringify(body),
                credentials: "include",
            }
        ).then(async res => {
            if (!res.ok) { return res.status; }
            return await res.json();
        });
    }

    async function getSession(username, password) {
        return fetch(`http://${config.URL}:${port}/api/account/login`, {
            "method": "POST",
            "body": JSON.stringify({ "username": username, "password": password }),
            "credentials": "include"
        }).then(res => {
            const cookies = res.headers.getSetCookie().map(cookie => {
                cookie = cookie.split(";", 1)[0];
                const seperator_index = cookie.indexOf("=");
                const name = decodeURIComponent(cookie.slice(0, seperator_index));
                const value = decodeURIComponent(cookie.slice(seperator_index + 1));
                return { "name": name, "value": value };
            });

            return JSON.parse(cookies.find(cookie => cookie.name == "session").value);
        });
    }

    beforeAll(async () => {
        await manager.establishConnection();
        await manager.dbExecute(`PRAGMA foreign_keys = ON;`);

        await account_system.init(manager);

        await new Promise((resolve, reject) => {
            const public_directory = path.resolve("../public");

            server = createHTTPServer(public_directory);
            registerPOSTHandler("/api/account/login", (req, res, body) => loginHandler(req, res, body, manager));
            registerPOSTHandler("/api/account/create", (req, res, body) => createAccountHandler(req, res, body, manager));
            registerPOSTHandler("/api/account/logout", (req, res, body) => logoutHandler(req, res, body, manager));
            registerPOSTHandler("/api/account/get", (req, res, body) => getAccountInformationHandler(req, res, body, manager));

            server.listen(0, config.URL, () => {
                port = server.address().port;
                resolve();
            });
        });

        await account_system.createAccount("test_username", "test_password", manager);
    });

    test("Login Handler", async () => {
        await expect(postURL("api/account/login", {})).resolves.toBe(500);
        await expect(postURL("api/account/login", { "username": null, "password": null })).resolves.toBe(500);

        await expect(postURL("api/account/login", { "username": "test_username", "password": "test_password_1" })).resolves.toBe(500);

        await expect(postURL("api/account/login", { "username": "test_username", "password": "test_password" })).resolves.not.toBe(500);
    });

    test("Create Account Handler", async () => {
        await expect(postURL("api/account/create", {})).resolves.toBe(500);
        await expect(postURL("api/account/create", { "username": null, "password": null })).resolves.toBe(500);
        await expect(postURL("api/account/create", { "username": "", "password": "" })).resolves.toBe(500);

        await expect(postURL("api/account/create", { "username": "test_username_1", "password": "test_password" })).resolves.not.toBe(500);
        await expect(postURL("api/account/create", { "username": "test_username_1", "password": "test_password" })).resolves.toBe(500);
    });

    test("Validate Session Handler", async () => {
        const session = await getSession("test_username", "test_password");

        await expect(mockHandler(validateSessionHandler, {}, {}, manager)).rejects.toThrow("Invalid session");
        await expect(mockHandler(validateSessionHandler, {}, {
            "foo": "blah"
        }, manager)).rejects.toThrow("Invalid session");

        expect((await mockHandler(validateSessionHandler, {}, {
            "session": JSON.stringify({ "account_id": null, "session_key": null })
        }, manager)).status).toBe(401);

        expect((await mockHandler(validateSessionHandler, {}, {
            "session": JSON.stringify({ "account_id": session.account_id, "session_key": "foo" })
        }, manager)).status).toBe(401);

        expect((await mockHandler(validateSessionHandler, {}, {
            "session": JSON.stringify({ "account_id": 999, "session_key": session.session_key })
        }, manager)).status).toBe(401);

        expect((await mockHandler(validateSessionHandler, {}, {
            "session": JSON.stringify(session)
        }, manager)).status).toBe(200);
    });

    test("Logout Handler", async () => {
        const session = await getSession("test_username", "test_password");

        await expect(mockHandler(logoutHandler, {}, {}, manager)).rejects.toThrow("Invalid session");
        await expect(mockHandler(logoutHandler, {}, {
            "foo": "blah"
        }, manager)).rejects.toThrow("Invalid session");

        await expect(mockHandler(logoutHandler, {}, {
            "session": JSON.stringify({ "account_id": null, "session_key": null })
        }, manager)).rejects.toThrow("Invalid session");

        await expect(mockHandler(logoutHandler, {}, {
            "session": JSON.stringify({ "account_id": session.account_id, "session_key": "foo" })
        }, manager)).rejects.toThrow("Invalid session");

        await expect(mockHandler(logoutHandler, {}, {
            "session": JSON.stringify({ "account_id": 999, "session_key": session.session_key })
        }, manager)).rejects.toThrow("Invalid session");

        expect((await mockHandler(logoutHandler, {}, {
            "session": JSON.stringify(session)
        }, manager)).headers["Set-Cookie"][0]).toMatch(/session=%7B%22account_id%22%3Anull%2C%22session_key%22%3Anull%7D;/);

        expect((await manager.dbGet("SELECT * FROM UserAccounts WHERE AccountID = ?", [session.account_id]))[0]["SessionKey"]).toBe(null);
    });

    test("deleteAccountHandler", async () => {
        await postURL("api/account/create", { "username": "delete_me", "password": "test_password" });
        const session = await getSession("delete_me", "test_password");

        await expect(mockHandler(deleteAccountHandler, {}, {}, manager)).rejects.toThrow("Invalid session");
        await expect(mockHandler(deleteAccountHandler, {}, {
            "foo": "blah"
        }, manager)).rejects.toThrow("Invalid session");

        await expect(mockHandler(deleteAccountHandler, {
            "password": null
        }, {
            "session": JSON.stringify(session)
        }, manager)).rejects.toThrow("Invalid password");

        await expect(mockHandler(deleteAccountHandler, {
            "password": "foo"
        }, {
            "session": JSON.stringify(session)
        }, manager)).rejects.toThrow("Invalid password");

        await expect(mockHandler(deleteAccountHandler, {
            "password": "test_password"
        }, {
            "session": JSON.stringify({ "account_id": null, "session_key": null })
        }, manager)).rejects.toThrow("Invalid session");

        await expect(mockHandler(deleteAccountHandler, {
            "password": "test_password"
        }, {
            "session": JSON.stringify({ "account_id": session.account_id, "session_key": "foo" })
        }, manager)).rejects.toThrow("Invalid session");

        await expect(mockHandler(deleteAccountHandler, {
            "password": "test_password"
        }, {
            "session": JSON.stringify({ "account_id": 999, "session_key": session.session_key })
        }, manager)).rejects.toThrow("Invalid session");

        expect((await mockHandler(deleteAccountHandler, {
            "password": "test_password"
        }, {
            "session": JSON.stringify(session)
        }, manager)).headers["Set-Cookie"][0]).toMatch(/session=%7B%22account_id%22%3Anull%2C%22session_key%22%3Anull%7D;/);

        expect((await manager.dbGet("SELECT * FROM UserAccounts WHERE AccountID = ?", [session.account_id])).length).toBe(0);
    });

    test("updateAccountHandler", async () => {
        await postURL("api/account/create", { "username": "update_me", "password": "test_password" });
        const session = await getSession("update_me", "test_password");

        await expect(mockHandler(updateAccountHandler, {}, {}, manager)).rejects.toThrow("Invalid session");
        await expect(mockHandler(updateAccountHandler, {}, {
            "foo": "blah"
        }, manager)).rejects.toThrow("Invalid session");

        await expect(mockHandler(updateAccountHandler, {}, {
            "session": JSON.stringify({ "account_id": null, "session_key": null })
        }, manager)).rejects.toThrow("Invalid session");

        await expect(mockHandler(updateAccountHandler, {}, {
            "session": JSON.stringify({ "account_id": session.account_id, "session_key": "foo" })
        }, manager)).rejects.toThrow("Invalid session");

        await expect(mockHandler(updateAccountHandler, {}, {
            "session": JSON.stringify({ "account_id": 999, "session_key": session.session_key })
        }, manager)).rejects.toThrow("Invalid session");

        await expect(mockHandler(updateAccountHandler, {}, {
            "session": JSON.stringify(session)
        }, manager)).rejects.toThrow("Invalid changes");

        await expect(mockHandler(updateAccountHandler, {
            "foo": "blah"
        }, {
            "session": JSON.stringify(session)
        }, manager)).rejects.toThrow("Invalid changes");

        await expect(mockHandler(updateAccountHandler, {
            "Fullname": { "foo": "bar" },
        }, {
            "session": JSON.stringify(session)
        }, manager)).rejects.toThrow("Invalid changes");

        await expect(mockHandler(updateAccountHandler, {
            "Password": "foo",
        }, {
            "session": JSON.stringify(session)
        }, manager)).rejects.toThrow("Invalid changes");

        await mockHandler(updateAccountHandler, {
            "Fullname": "foo"
        }, {
            "session": JSON.stringify(session)
        }, manager);

        expect((await manager.dbGet("SELECT * FROM UserAccounts WHERE AccountID = ?", [session.account_id]))[0]["Fullname"]).toBe("foo");
    });

    test("getAccountInformationHandler", async () => {
        await expect(postURL("api/account/get", {})).resolves.toBe(500);
        await expect(postURL("api/account/get", { "username": null, "account_id": null })).resolves.toBe(500);

        await expect(postURL("api/account/get", { "username": 1 })).resolves.toBe(500);
        await expect(postURL("api/account/get", { "username": "foo" })).resolves.toBe(500);

        await expect(postURL("api/account/get", { "account_id": "foo" })).resolves.toBe(500);
        await expect(postURL("api/account/get", { "username": 999 })).resolves.toBe(500);

        const account = await postURL("api/account/get", { "username": "test_username" });

        await expect(postURL("api/account/get", { "username": account.Username })).resolves.not.toBe(500);
        await expect(postURL("api/account/get", { "account_id": account.AccountID })).resolves.not.toBe(500);
    });

    afterAll(async () => {
        await manager.dbClose();
        await new Promise((resolve) => {
            server.close(resolve);
        });

        fs.rmSync("./data/account_api.test.db");
        console.log("Finished cleanup");
    });
});