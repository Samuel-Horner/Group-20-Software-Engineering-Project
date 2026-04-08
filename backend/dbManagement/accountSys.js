import { manager } from "./index.js";

const accountSchema = `
CREATE TABLE IF NOT EXISTS UserAccounts (
    UserID INTEGER PRIMARY KEY AUTOINCREMENT,
    SessionKey INTEGER UNIQUE,
    Fullname TEXT,
    Username TEXT NOT NULL UNIQUE,
    Password TEXT NOT NULL,
    CreationDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    Description TEXT,
    Location TEXT,
    HobbyTags TEXT,
    HobbyExperience TEXT,
    QuizResults TEXT
);`;

const seedAccountSchema = [
        {
            Fullname: "Sarah Chen",
            Username: "sarah_chen",
            Password: "photos4Days",
            Description: "",
            Location: "Somewhere in the UK...",
            HobbyTags: ["Photography", "Cooking", "Gardening"],
            HobbyExperience: ["Advanced", "Intermediate", "Beginner"],
            QuizResults: [],
            SessionKey: null,
        },
        {
            Fullname: "Marcus Johnson",
            Username: "marcus_johnson",
            Password: "MJohn2000",
            Description: "",
            Location: "Somewhere in the US...",
            HobbyTags: ["Woodworking", "3D Printing", "Gaming"],
            HobbyExperience: ["Intermediate", "Advanced", "Advanced"],
            QuizResults: [],
            SessionKey: null,
        },
        {
            Fullname: "Null Null Null Null",
            Username: "console.log(null)",
            Password: "nullthing001",
            Description: "",
            Location: "Somewhere in the ...",
            HobbyTags: ["Electronics", "Electronics", "Electronics"],
            HobbyExperience: ["Beginner", "Intermediate", "Advanced"],
            QuizResults: [],
            SessionKey: null,
        },
];

async function seedAccountsData() {
    await manager.establishConnection();
    await executeOrThrow(`DROP TABLE UserAccounts;`);
    await executeOrThrow(accountSchema);
    for (const account of seedAccountSchema) {
        await executeOrThrow(
            `INSERT OR IGNORE INTO UserAccounts (Fullname,Username,Password,Description,Location,HobbyTags,HobbyExperience,QuizResults,SessionKey)
            VALUES (?,?,?,?,?,?,?,?,?);`,
            [account.Fullname,account.Username,account.Password,account.Description,account.Location,JSON.stringify(account.HobbyTags),JSON.stringify(account.HobbyExperience),JSON.stringify(account.QuizResults),account.SessionKey]
        );
    }
    await manager.dbClose();
}

// Keep this line always commented, unless you planned to reset the UserAccounts table
// It will allow for the SessionKey feature to still work even after server restarts
// (I spent so long trying to figure out why it happened, and getting confused, and now im only half-upset after learning the reason)
//seedAccountsData(); // node ./backend/dbManagement/accountSys.js

async function executeOrThrow(sql, params = []) {
    const result = await manager.dbExecute(sql, params);
    if (result) {
        throw new Error(result);
    }
}

async function selectOrThrow(sql, params = []) {
    const result = await manager.dbGet(sql, params);
    if (!result) {
        throw new Error(result);
    }
    return result;
}

export async function UserLogin (body) {
    try {
        var user = body.user;
        var pass = body.pass;

        if (user && pass) {
            user = user.replace(/=/g,"");
            pass = pass.replace(/=/g,"");
            await manager.establishConnection();
            let userID = await selectOrThrow(`SELECT UserID FROM UserAccounts WHERE Username = ? AND Password = ?`,[user,pass]);
            await manager.dbClose();
            if (userID) {return CreateSession(user);}
        } else {return null;}
    }
    catch (err) {return null;}
}

export async function RetrieveAccInfo (body) {
    try {
        await manager.establishConnection();
        let content = (await selectOrThrow(`SELECT * FROM UserAccounts WHERE Username = ? AND SessionKey = ?`,[body.user,body.key]))[0];
        let keyy = (await selectOrThrow(`SELECT SessionKey FROM UserAccounts WHERE Username = ?`,[body.user]));
        await manager.dbClose();
        content.QuizResults = JSON.parse(content.QuizResults);
        content.HobbyTags = JSON.parse(content.HobbyTags);
        content.HobbyExperience = JSON.parse(content.HobbyExperience);
        return content;
    }
    catch (err) {return [];}
}

export async function CreateSession (username) {
    try {
        let session_key = Math.floor(Math.random()*100000000000);
        let content = {user: username,key: session_key};

        await manager.establishConnection();
        await executeOrThrow(`UPDATE UserAccounts SET SessionKey = ? WHERE Username = ?`,[session_key,username]);
        await manager.dbClose();

        return content
    } catch (err) {return null}
}

export async function UserLogout (body) {
    DeleteSession(body.user);
    return null;
}

export async function DeleteSession (body) {
    try {
        await manager.establishConnection();
        await executeOrThrow(`UPDATE UserAccounts SET SessionKey = NULL WHERE Username = ?`,[username]);
        await manager.dbClose();
    } catch (err) {
        console.error(err);
    }
}

export async function ChangeAccInfo (body) {
    try {
        var changes = body.changes;
        var sessionKey = body.sessionKey;
        await manager.establishConnection();
        await executeOrThrow(`UPDATE UserAccounts SET
            Username = ?,
            Password = ?,
            Fullname = ?,
            Description = ?,
            Location = ?,
            HobbyTags = ?,
            HobbyExperience = ?
            WHERE Username = ? AND SessionKey = ?
            `,[changes.user, changes.pass, changes.full, changes.desc, changes.loca, changes.tags, changes.diff, sessionKey.user, sessionKey.key]);
        await manager.dbClose();
    } catch (err) {console.log(`error`)}
}

export async function CreateAccount (body) {
    try {
        var changes = JSON.parse(JSON.stringify(body.changes));
        await manager.establishConnection();
        await executeOrThrow(
            `INSERT OR IGNORE INTO UserAccounts (Username,Password,Fullname,Description,Location,HobbyTags,HobbyExperience)
            VALUES (?,?,?,?,?,?,?);`,
            [changes.user, changes.pass, changes.full, changes.desc, changes.loca, changes.tags, changes.diff]
        );
        var newbody = {user: changes.user, pass: changes.pass}
        return await UserLogin(newbody);
    }
    catch (err) {console.log(`error`)}
}

export async function DeleteAccount (body) {
    try {
        var user = body.user;
        var key = body.key;

        await manager.establishConnection();
        await executeOrThrow(`DELETE FROM UserAccounts WHERE Username = ? OR UserID = ?`,[user,key]);
        await manager.dbClose();
    }
    catch (err) {console.log(`error`)}
}

export async function RetAll () {
    await manager.establishConnection();
    let retall = await selectOrThrow(`SELECT * FROM UserAccounts`);
    await manager.dbClose();
    console.log(retall);
    return retall;
}

