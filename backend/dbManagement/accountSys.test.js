import { afterAll, beforeAll, describe, afterEach, beforeEach, jest } from "@jest/globals";
import { init,userLogin,userLogout,retrieveAccInfo,changeAccInfo,createAccount,deleteAccount,createSession,seedAccountsData,retAll } from "../dbManagement/accountSys.js";
import { DBManager } from "./DBManager.js";
import fs from "fs";

describe ("Account System Functions", () => {
    const testManager = new DBManager("./data/test.db", false);
    beforeAll(async () => {
        await init(testManager);
    });

    // Comment to view actual changes to the UserAccount table after tests
    afterAll(async () => {
        var before = JSON.stringify(await retAll(testManager));
        await expect(seedAccountsData(testManager)).resolves.toBe();
        var after = await retAll(testManager);
        expect(after.length).toBe(3);
        expect(JSON.stringify(after)).not.toBe(before);
        fs.rmSync("./data/test.db");
    });

    test("userLogin", async () => {
        await expect(userLogin(testManager,{login: {user: "", pass: ""}})).resolves.toBe();
        await expect(userLogin(testManager,{login: {user: "testUser", pass: "testPass"}})).resolves.toBe();
        await expect(userLogin(testManager,{login: {user: "sarah_chen", pass: "photos4Days"}})).resolves.toBeInstanceOf(Object);
        await expect(userLogin(testManager,{login: ["testUser", "testPass"]})).rejects.toBe();
    });
    test("userLogout", async () => {
        var sessionKey = await userLogin(testManager,{login: {user: "sarah_chen", pass: "photos4Days"}});
        await expect(userLogout(testManager,{sessionKey: sessionKey})).resolves.toBe();
        await expect(userLogout(testManager,{sessionKey: ["sarah_chen",123456789]})).rejects.toBe();
    });

    test("retrieveAccInfo", async () => {
        var sessionKey = await userLogin(testManager,{login: {user: "sarah_chen", pass: "photos4Days"}});
        await expect(retrieveAccInfo(testManager,{sessionKey: sessionKey})).resolves.not.toBe({});
        await expect(retrieveAccInfo(testManager,{sessionKey: {user:"sarah_chen",key:123456789}})).resolves.toStrictEqual({});
        await expect(retrieveAccInfo(testManager,{sessionKey: ["sarah_chen",123456789]})).rejects.toBe();
    });
    test("changeAccInfo", async () => {
        var sessionKey = await userLogin(testManager,{login: {user: "sarah_chen", pass: "photos4Days"}});
        await expect(changeAccInfo(testManager,{sessionKey: sessionKey, changes: {}})).rejects.toBe();
        await expect(changeAccInfo(testManager,{sessionKey: sessionKey, changes: {desc: "new",}})).resolves.toBe();
        expect((await retrieveAccInfo(testManager,{sessionKey: sessionKey})).Description).toBe("new");
        await expect(changeAccInfo(testManager,{sessionKey: sessionKey, changes: {desc: "",}})).rejects.toBe();
    });

    test("createAccount", async () => {
        var sessionKey = await createAccount(testManager,{changes: {user:"test",pass:"test",desc:"test"}});
        expect(sessionKey).toBeInstanceOf(Object);
        expect(JSON.stringify(await retrieveAccInfo(testManager,{sessionKey: sessionKey}))).not.toBe("{}");
        await expect(createAccount(testManager,{})).rejects.toBe();
        await expect(createAccount(testManager,{changes: {}})).rejects.toBe();
    });
    test("deleteAccount", async () => {
        var sessionKey = await userLogin(testManager,{login: {user: "test", pass: "test"}});
        await expect(deleteAccount(testManager,{sessionKey: {}})).rejects.toBe();
        await expect(deleteAccount(testManager,{sessionKey: sessionKey})).resolves.toBe();
        expect(JSON.stringify(await retrieveAccInfo(testManager,{sessionKey: sessionKey}))).toBe("{}");
    });

    test("createSession", async () => {
        await expect(createSession(testManager,"sarah_chen")).resolves.toBeInstanceOf(Object);
        await expect(createSession(testManager,123456789)).rejects.toBe();
    });
});