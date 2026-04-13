import { afterAll, beforeAll, describe, jest } from "@jest/globals"
import path from "path"

import { loginGetHandler,updateGetHandler } from "./accountSystem.js";
import { createHTTPServer, registerPOSTHandler } from "../server/server";
import config from "../config";
import { DBManager } from "../dbManagement/DBManager.js";
import { seedAccountsData } from "../dbManagement/accountSys.js";
import fs from "fs";

async function postURL(url, body = {}) {
    return fetch(`http://${config.URL}:${config.PORT}/${url}`, { method: "POST", body: JSON.stringify({...body, dbLink: "./data/test.db"}) }).then(async res => {
        if (!res.ok) { return res.status; }
        return await res.json();
    });
}

describe("Account Login Actions", () => {
    let server;

    beforeAll(async () => {
        await seedAccountsData(new DBManager("./data/test.db",false));

        const public_directory = path.resolve("../public");

        server = createHTTPServer(public_directory);
        registerPOSTHandler("/acc_login", loginGetHandler);
        registerPOSTHandler("/acc_update", updateGetHandler);

        await new Promise((resolve) => {
            server.listen(config.PORT, config.URL, () => resolve());
        });
    });

    afterAll(async () => {
        server.close();
        fs.rmSync("./data/test.db");
    });

    test("loginGetHandler", async () => {
        await expect(postURL('acc_login',{action:'firstLogin', login: {user: 'sarah_chen', pass: 'photos4Days'}})).resolves.not.toBe(400);
        await expect(postURL('acc_login',{action:'firstLogin', login: {user: 'test', pass: 'test'}})).resolves.toBe(400);
        await expect(postURL('acc_login',{action:'firstLogin', login: {user: ['test'], pass: ['test']}})).resolves.toBe(400);

        var sessionKey = await postURL('acc_login',{action:'firstLogin', login: {user: 'sarah_chen', pass: 'photos4Days'}});
        await expect(postURL('acc_login',{action:'persistLogin', sessionKey: sessionKey})).resolves.not.toBe({});
        await expect(postURL('acc_login',{action:'persistLogin', sessionKey: {user: 'test', key: 123456789}})).resolves.toEqual({});
        await expect(postURL('acc_login',{action:'persistLogin', sessionKey: {user: ['test'], key: [123456789]}})).resolves.toBe(400);

        var sessionKey = await postURL('acc_login',{action:'firstLogin', login: {user: 'sarah_chen', pass: 'photos4Days'}});
        await expect(postURL('acc_login',{action:'logout', sessionKey: sessionKey})).resolves.toBe(null);
        await expect(postURL('acc_login',{action:'logout', sessionKey: {user: 'test', key: 123456789}})).resolves.toBe(null);
        await expect(postURL('acc_login',{action:'logout', sessionKey: {user: ['test'], key: [123456789]}})).resolves.toBe(400);

        await expect(postURL('acc_login',{action:'invalidAction'})).resolves.toBe(400);
    });

    test("updateGetHandler", async () => {
        var sessionKey = await postURL('acc_update',{action:'create', changes: {user:"test",pass:"test",desc:"test"}});
        expect(sessionKey.user).not.toBeUndefined();
        expect(sessionKey.key).not.toBeUndefined();
        await expect(postURL('acc_update',{action:'create', changes: ["test","test","test"]})).resolves.toBe(400);

        await expect(postURL('acc_update',{action:'change', sessionKey: sessionKey, changes: {desc:"working"}})).resolves.toBe(null);
        var testInfo = await postURL('acc_login',{action:'persistLogin', sessionKey: sessionKey});
        expect(testInfo.Description).toBe("working");
        await expect(postURL('acc_update',{action:'change', sessionKey: sessionKey, changes: {this:"that"}})).resolves.toBe(400);

        await expect(postURL('acc_update',{action:'delete', sessionKey: sessionKey})).resolves.toBe(null);
        await expect(postURL('acc_update',{action:'delete', sessionKey: sessionKey})).resolves.toBe(null);
        await expect(postURL('acc_update',{action:'delete', sessionKey: {user: "this", key: "that"}})).resolves.toBe(400);

        await expect(postURL('acc_update',{action:'invalidAction'})).resolves.toBe(400);
    });

    // Keep commented unless the Main Database "./data/dev.db" exists on your device. This achieves full coverage of Statements, Branches and Lines for [accountSystem.js]
    /* test("On Main Database", async () => {
        async function mainURL(url, body = {}) {
            return fetch(`http://${config.URL}:${config.PORT}/${url}`, { method: "POST", body: JSON.stringify(body) }).then(async res => {
                if (!res.ok) { return res.status; }
                return await res.json();
            });
        }
        await seedAccountsData(new DBManager("./data/test.db",false));

        var sessionKey = await mainURL('acc_update',{action:'create', changes: {user:"test",pass:"test",desc:"test"}});
        await expect(mainURL('acc_login',{action:'persistLogin', sessionKey: sessionKey})).resolves.not.toBe({});
        await expect(postURL('acc_login',{action:'persistLogin', sessionKey: sessionKey})).resolves.toEqual({});

        await expect(mainURL('acc_update',{action:'change', sessionKey: sessionKey, changes: {desc:"working"}})).resolves.toBe(null);
        var testInfo = await mainURL('acc_login',{action:'persistLogin', sessionKey: sessionKey});
        expect(testInfo.Description).toBe("working");
        await expect(mainURL('acc_update',{action:'delete', sessionKey: sessionKey})).resolves.toBe(null);
    }) */
});
