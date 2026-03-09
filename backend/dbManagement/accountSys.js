import { manager } from "./index.js";

const accountSchema = `
CREATE TABLE IF NOT EXISTS UserAccounts (
    UserID INTEGER PRIMARY KEY AUTOINCREMENT,
    NetworkingID INTEGER,
    Username TEXT NOT NULL UNIQUE,
    Password TEXT NOT NULL,
    CreationDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    QuizResults TEXT,
    HobbyTags TEXT,
    SessionKey INTEGER UNIQUE,
    FOREIGN KEY (NetorkingID) REFERENCES NetworkAccount (AccountID) 
);
`;

const seedAccountSchema = [
        {
            Username: "sarah_chen",
            Password: "sarahchen1",
            HobbyTags: ["Photography", "Cooking", "Gardening"],
        },
        {
            Username: "marcus_johnson",
            Password: "marcusjohnson1",
            HobbyTags: ["Woodworking", "3D Printing", "Gaming"],
        },
        {
            Username: "emily_rodriguez",
            Password: "emilyrodriguez1",
            HobbyTags: ["Baking", "Photography", "Coffee Roasting"],
        },
        {
            Username: "david_kim",
            Password: "davidkim1",
            HobbyTags: ["Guitar", "Cycling", "Photography"],
        },
        {
            Username: "nina_patel",
            Password: "ninapatel1",
            HobbyTags: ["Baking", "Gardening", "Cooking"],
        },
        {
            Username: "alex_nguyen",
            Password: "alexnguyen1",
            HobbyTags: ["Electronics", "Gaming", "3D Printing"],
        },
        {
            Username: "hannah_lee",
            Password: "hannahlee1",
            HobbyTags: ["Cooking", "Baking", "Gardening"],
        },
        {
            Username: "owen_brown",
            Password: "owenbrown1",
            HobbyTags: ["Cycling", "Photography", "Gaming"],
        }
];

async function seedAccountsData() {
    for (const account of seedAccountSchema) {
        await executeOrThrow(
            "INSERT OR IGNORE INTO UserAccounts (Username,Password,HobbyTags) VALUES (?,?,?);",
            [account.Username,account.Password,JSON.stringify(account.HobbyTags)]
        );
    }
}

async function executeOrThrow(sql, params = []) {
    const result = await manager.dbExecute(sql, params);
    if (result !== "dbExecute: Success") {
        throw new Error(result);
    }
}

async function selectOrThrow(sql, params = []) {
    const result = await manager.dbGet(sql, params);
    if (typeof result === "string") {
        throw new Error(result);
    }
    return result;
}

async function StringtoArray(str) {
    return JSON.parse(str);
}

export async function UserLogin (username=null,password=null) {
    try {
        // (Site-Wide) Login from Session Key
        try {
            let content = JSON.parse(localStorage.getItem("user-keys"));
            let userID = await selectOrThrow(`SELECT UserID FROM UserAccounts WHERE SessionKey = ? AND Username = ?`,[content.Session_Key,content.Username]);
            if (!userID) {return userID;}               // Returns User's Account ID
        } catch (err) {}

        // (Initial) Login from Username and Password
        if (username && password) {
            username = username.replace(/=/g,"");
            password = password.replace(/=/g,"");
            let userID = await selectOrThrow(`SELECT UserID FROM UserAccounts WHERE Username = ? AND Password = ?`,[username,password]);
            if (userID) {CreateSession(username); return userID;}
        }

        return null;
    }
    catch (err) {return null;}                      // Returns null (for No Account ID)
}

export async function UserLogout (username) {
    DeleteSession(username);
    return null;
}

export async function CreateSession (username) {
    try {
        let session_key = Math.floor(Math.random()*100000000000);
        let content = {"Username": username,"Session_Key": session_key};
        localStorage.setItem("user-keys",JSON.stringify(content));

        await manager.establishConnection();
        await executeOrThrow(`UPDATE UserAccounts SET SessionKey = ? WHERE Username = ?`,[session_key,username]);
        await manager.dbClose();
    } catch (err) {
        console.error(err);
    }
}

export async function DeleteSession (username) {
    try {
        let content = [{"Username": username,"Session_Key": null}];
        localStorage.removeItem("user-keys")

        await manager.establishConnection();
        await executeOrThrow(`UPDATE UserAccounts SET SessionKey = NULL WHERE Username = ?`,[username]);
        await manager.dbClose();
    } catch (err) {
        console.error(err);
    }
}

export async function RetrieveAccInfo (userID) {
    let content =  (await selectOrThrow(`SELECT * FROM UserAccounts WHERE UserID = ?`,[userID]))[0];
    content.QuizResults = JSON.parse(content.QuizResults);
    content.HobbyTags = JSON.parse(content.HobbyTags);
    return content;
}

export async function ChangeAccInfo () {
    
}

export async function CreateAccount (username,password) {
    try {
        await manager.establishConnection();
        await executeOrThrow(`INSERT OR IGNORE INTO UserAccounts (Username,Password) VALUES (?,?)`,[username,password]);
        await manager.dbClose();
    }
    catch (err) {return null;}
}

export async function DeleteAccount (username=null,userID=null) {
    try {
        await manager.establishConnection();
        await executeOrThrow(`DELETE FROM UserAccounts WHERE Username = ? OR UserID = ?`,[username,userID]);
        await manager.dbClose();
    }
    catch (err) {return null;}
}

export async function initAccountStore () {
    await manager.establishConnection();
    await executeOrThrow(accountSchema);
    await seedAccountsData();
    await manager.dbClose();
}

//initAccountStore();
//let content;
/* content = await UserLogin("sarah_chen","sarahchen1");
console.log(content);
content = await UserLogout("sarah_chen");
console.log(content);
content = await RetrieveAccInfo(1);
console.log(content.HobbyTags);
console.log(content.HobbyTags[0]); */
