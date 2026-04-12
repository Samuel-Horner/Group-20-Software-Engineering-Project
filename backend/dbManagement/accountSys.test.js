import { afterAll, beforeAll, describe, jest } from "@jest/globals"
import path from "path"

import { userLogin,userLogout,retrieveAccInfo,changeAccInfo,createAccount,deleteAccount,createSession,seedAccountsData,retAll } from "../dbManagement/accountSys.js";
import { createHTTPServer, registerPOSTHandler } from "../server/server";
import config from "../config"

async function postURL(url, body = {}) {
    return fetch(`http://${config.URL}:${config.PORT}/${url}`, { method: "POST", body: JSON.stringify(body) }).then(async res => {
        if (!res.ok) { return res.status; }
        return await res.json();
    });
}

describe ("Account System Functions", () => {
    test("userLogin", async () => {
        await expect(userLogin({user: "", pass: ""})).resolves.toBe();
        await expect(userLogin({user: "testUser", pass: "testPass"})).resolves.toBe();
        await expect(userLogin({user: "sarah_chen", pass: "photos4Days"})).resolves.toBeInstanceOf(Object);
        await expect(userLogin(["testUser", "testPass"])).rejects.toBe();
    });
    test("userLogout", async () => {
        var sessionKey = await userLogin({user: "sarah_chen", pass: "photos4Days"});
        await expect(userLogout(sessionKey)).resolves.toBe();
        await expect(userLogout(["sarah_chen",123456789])).rejects.toBe();
    });

    test("retrieveAccInfo", async () => {
        var sessionKey = await userLogin({user: "sarah_chen", pass: "photos4Days"});
        await expect(retrieveAccInfo(sessionKey)).resolves.not.toBe({});
        await expect(retrieveAccInfo({user:"sarah_chen",key:123456789})).resolves.toStrictEqual({});
        await expect(retrieveAccInfo(["sarah_chen",123456789])).rejects.toBe();
    });
    test("changeAccInfo", async () => {
        var sessionKey = await userLogin({user: "sarah_chen", pass: "photos4Days"});
        await expect(changeAccInfo({sessionKey: sessionKey, changes: {}})).rejects.toBe();
        await expect(changeAccInfo({sessionKey: sessionKey, changes: {desc: "new",}})).resolves.toBe();
        expect((await retrieveAccInfo(sessionKey)).Description).toBe("new");
        await expect(changeAccInfo({sessionKey: sessionKey, changes: {desc: "",}})).rejects.toBe();
    });

    test("createAccount", async () => {
        var sessionKey = await createAccount({changes: {user:"test",pass:"test",desc:"test"}});
        expect(sessionKey).toBeInstanceOf(Object);
        expect(JSON.stringify(await retrieveAccInfo(sessionKey))).not.toBe("{}");
        await expect(createAccount({})).rejects.toBe();
        await expect(createAccount({changes: {}})).rejects.toBe();
    });
    test("deleteAccount", async () => {
        var sessionKey = await userLogin({user: "test", pass: "test"});
        await expect(deleteAccount({})).rejects.toBe();
        await expect(deleteAccount(sessionKey)).resolves.toBe();
        expect(JSON.stringify(await retrieveAccInfo(sessionKey))).toBe("{}");
    });

    test("createSession", async () => {
        await expect(createSession("sarah_chen")).resolves.toBeInstanceOf(Object);
        await expect(createSession(123456789)).rejects.toBe();
    });

    // Comment to view actual changes to the UserAccount table after tests
    afterAll(async () => {
        var before = JSON.stringify(await retAll());
        await expect(seedAccountsData()).resolves.toBe();
        var after = await retAll();
        expect(after.length).toBe(3);
        expect(JSON.stringify(after)).not.toBe(before);
    });
});