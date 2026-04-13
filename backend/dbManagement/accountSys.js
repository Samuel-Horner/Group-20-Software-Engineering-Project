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
            Username: "console_log_null",
            Password: "nullthing001",
            Description: "",
            Location: "Somewhere in the ...",
            HobbyTags: ["Electronics", "Electronics", "Electronics"],
            HobbyExperience: ["Beginner", "Intermediate", "Advanced"],
            QuizResults: [],
            SessionKey: null,
        },
];

export async function init(manager) {
    await seedAccountsData(manager);
}
export default {init};

// For the purposes of resetting and returning the UserAccoount table. Leave uncommented during testing, so the actual table isnt affected, by the testing lines
export async function seedAccountsData(manager) {
    return new Promise(async (resolve,_) => {
        await manager.establishConnection();
        await executeOrThrow(manager,`DROP TABLE IF EXISTS UserAccounts;`);
        await executeOrThrow(manager,accountSchema);
        for (const account of seedAccountSchema) {
            await executeOrThrow(
                manager,
                `INSERT OR IGNORE INTO UserAccounts (Fullname,Username,Password,Description,Location,HobbyTags,HobbyExperience,QuizResults,SessionKey)
                VALUES (?,?,?,?,?,?,?,?,?);`,
                [account.Fullname,account.Username,account.Password,account.Description,account.Location,JSON.stringify(account.HobbyTags),JSON.stringify(account.HobbyExperience),JSON.stringify(account.QuizResults),account.SessionKey]
            );
        }
        await manager.dbClose();
        resolve();
    });
}

export async function retAll (manager) {
    return new Promise(async (resolve,_) => {
        await manager.establishConnection();
        let retall = await selectOrThrow(manager,`SELECT * FROM UserAccounts`);
        await manager.dbClose();
        console.log(retall);
        resolve(retall);
    });
}

// Keep this line always commented, unless you planned to reset the UserAccounts table
// It will allow for the SessionKey feature to still work even after server restarts
// (I spent so long trying to figure out why it happened, and getting confused, and now im only half-upset after learning the reason)
//console.log(manager); seedAccountsData(); // node ./dbManagement/accountSys.js





export async function executeOrThrow(manager, sql, params = []) {
    return new Promise(async (resolve,_) => {
        await manager.dbExecute(sql, params);
        resolve();
    });
}

export async function selectOrThrow(manager, sql, params = []) {
    return new Promise(async (resolve,reject) => {
        var result = await manager.dbGet(sql, params);
        resolve(result);
    });
}

export async function userLogin (manager, body) {
    return new Promise(async (resolve,reject) => {
        try {
            var login = body.login;
            if ((typeof(login.user) == "string") && (typeof(login.pass) == "string")) {
                var user = (login.user).replace(/=/g,"");
                var pass = (login.pass).replace(/=/g,"");
                await manager.establishConnection();
                let userID = await selectOrThrow(manager,`SELECT UserID FROM UserAccounts WHERE Username = ? AND Password = ?`,[user,pass]);
                await manager.dbClose();
                if (userID.length == 1) {resolve(await createSession(manager,user));}
                else {resolve();}
            } else {throw new Error();}
        }
        catch (err) {reject();}
    });
}

export async function retrieveAccInfo (manager, body) {
    return new Promise(async (resolve,reject) => {
        try {
            var sessionKey = body.sessionKey;
            if ((typeof(sessionKey.user) == "string") && (typeof(sessionKey.key) == "number")) {
                await manager.establishConnection();
                let content = (await selectOrThrow(manager,`SELECT * FROM UserAccounts WHERE Username = ? AND SessionKey = ?`,[sessionKey.user,sessionKey.key]));
                await manager.dbClose();
                if (!(content.length > 0)) {resolve({});}
                else {
                    content = content[0];
                    content.QuizResults = JSON.parse(content.QuizResults);
                    content.HobbyTags = JSON.parse(content.HobbyTags);
                    content.HobbyExperience = JSON.parse(content.HobbyExperience);
                    resolve(content);
                }
            } else {throw new Error();}
        } catch (err) {reject();}
    });
}

export async function createSession (manager, username) {
    return new Promise(async (resolve,reject) => {
        try {
            if (typeof(username) == "string") {
                let session_key = Math.floor(Math.random()*100000000000);
                let content = {user: username,key: session_key};

                await manager.establishConnection();
                await executeOrThrow(manager,`UPDATE UserAccounts SET SessionKey = ? WHERE Username = ?`,[session_key,username]);
                await manager.dbClose();

                resolve(content);
            } else {throw new Error();}
        } catch (err) {reject();}
    });
}

export async function userLogout (manager, body) {
    return new Promise(async (resolve,reject) => {
        try {
            var sessionKey = body.sessionKey;
            if ((typeof(sessionKey.user) == "string") && (typeof(sessionKey.key) == "number")) {
                await manager.establishConnection();
                await executeOrThrow(manager,`UPDATE UserAccounts SET SessionKey = NULL WHERE Username = ? AND SessionKey = ?`,[sessionKey.user,sessionKey.key]);
                await manager.dbClose();
                resolve();
            } else {throw new Error();}
        } catch (err) {reject();}
    });
}

export async function changeAccInfo (manager, body) {
    return new Promise(async (resolve,reject) => {
        try {
            var changes = body.changes;
            var sessionKey = body.sessionKey;
            changes = [changes.user, changes.pass, changes.full, changes.desc, changes.loca, changes.tags, changes.diff];

            if (changes.filter((value) => (value)).length > 0) {
                var sets = ["Username = ?","Password = ?","Fullname = ?","Description = ?","Location = ?","HobbyTags = ?","HobbyExperience = ?"].filter((_,index) => (changes[index]));
                changes = changes.filter((value,_) => (value));
                const cmd = `UPDATE UserAccounts SET `+sets.join(",")+` WHERE Username = ? AND SessionKey = ?`;
                const params = changes.concat([sessionKey.user,sessionKey.key]);
                await manager.establishConnection();
                await executeOrThrow(manager,cmd,params);
                await manager.dbClose();
                resolve();
            } else {throw new Error();}
        } catch (err) {reject();}
    });
}

export async function createAccount (manager, body) {
    return new Promise(async (resolve,reject) => {
        try {
            var changes = body.changes;
            var newbody = {user: changes.user, pass: changes.pass};
            changes = [changes.user, changes.pass, changes.full, changes.desc, changes.loca, changes.tags, changes.diff];
            if (typeof(newbody.user) == "string" && typeof(newbody.pass) == "string" && newbody.user && newbody.pass) {
                var sets = ["Username","Password","Fullname","Description","Location","HobbyTags","HobbyExperience"].filter((_,index) => (changes[index]));
                const cmd = `INSERT OR IGNORE INTO UserAccounts (`+sets.join(",")+`) VALUES (`+Array(sets.length).fill("?").join(",")+`)`;
                const params = changes.filter((value,_) => (value));
                await manager.establishConnection();
                await executeOrThrow(manager,cmd,params);
                await manager.dbClose();
                resolve(await userLogin(manager,{login: newbody}));
            } else {throw new Error();}
        }
        catch (err) {reject();}
    });
}

export async function deleteAccount (manager, body) {
    return new Promise(async (resolve,reject) => {
        try {
            var sessionKey = body.sessionKey;
            if (typeof(sessionKey.user) == "string" && typeof(sessionKey.key) == "number" && sessionKey.user && (sessionKey.key > 0)) {
                await manager.establishConnection();
                await executeOrThrow(manager,`DELETE FROM UserAccounts WHERE Username = ? OR SessionKey = ?`,[sessionKey.user,sessionKey.key]);
                await manager.dbClose();
                resolve();
            } else {throw new Error();}
        }
        catch (err) {reject();}
    });
}
