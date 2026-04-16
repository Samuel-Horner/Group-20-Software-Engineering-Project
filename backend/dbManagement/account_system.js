import crypto from "crypto";

const account_table_schema = `
CREATE TABLE IF NOT EXISTS UserAccounts (
    AccountID INTEGER PRIMARY KEY,
    Username TEXT NOT NULL UNIQUE,
    Fullname TEXT,
    Password TEXT NOT NULL,
    Salt TEXT NOT NULL,
    SessionKey TEXT,
    SessionExpiry INTEGER,
    CreationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Description TEXT,
    Location TEXT,
    HobbyTags TEXT,
    HobbyExperience TEXT
);
`;

const SALT_LENGTH = 128
function generateSalt(length = SALT_LENGTH) {
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

function hashPassword(plaintext, salt) {
    let hash = crypto.createHmac('sha512', salt);
    hash.update(plaintext);
    return hash.digest('hex');
}

function validatePassword(password, desired_hashed, salt) {
    const hashed = hashPassword(password, salt);
    return hashed == desired_hashed;
}

async function getAccount(username, manager) {
    const matches = await manager.dbGet(
        `SELECT * FROM UserAccounts WHERE Username = ?`,
        [username]
    );
    return matches.length == 1 ? matches[0] : null;
}

async function getAccountByID(account_id, manager) {
    const matches = await manager.dbGet(
        `SELECT * FROM UserAccounts WHERE AccountID = ?`,
        [account_id]
    );
    return matches.length == 1 ? matches[0] : null;
}


const KEY_LIFETIME = 24 * 60 * 60; // 1 day
async function createSessionKey(account_id, manager) {
    function genKey() {
        return crypto.randomUUID();
    }

    const key = genKey();
    await manager.dbExecute(
        `UPDATE UserAccounts SET SessionKey = ?, SessionExpiry = ? WHERE AccountID = ?`,
        [key, Math.floor(Date.now() / 1000) + KEY_LIFETIME, account_id]
    );
    return key;
}

export async function createAccount(username, password, manager) {
    if (username == null || password == null) throw new Error("Invalid username / password")

    if (await getAccount(username, manager) != null) throw new Error("Account already exists");

    const salt = generateSalt();
    const hashed = hashPassword(password, salt);

    await manager.dbExecute(
        `INSERT INTO UserAccounts (Username, Password, Salt) VALUES (?, ?, ?)`, [username, hashed, salt]
    );

    const account = await getAccount(username, manager);

    return {
        account_id: account["AccountID"],
        session_key: await createSessionKey(account["AccountID"], manager)
    };
}

export async function login(username, password, manager) {
    if (username == null || password == null) throw new Error("Invalid username / password");

    const account = await getAccount(username, manager);
    if (account == null) throw new Error("Account does not exist");

    if (validatePassword(password, account["Password"], account["Salt"])) {
        return {
            account_id: account["AccountID"],
            session_key: await createSessionKey(account["AccountID"], manager)
        };
    } else {
        throw new Error("Invalid password");
    }
}

export async function validateSession(session, manager) {
    if (session.account_id == null || session.session_key == null) return false;

    const account = await getAccountByID(session.account_id, manager);
    if (account == null) return false;

    if (account["SessionKey"] == null) return false;
    if (account["SessionExpiry"] == null) return false;

    return session.session_key == account["SessionKey"] && account["SessionExpiry"] > Math.floor(Date.now() / 1000);
}

export async function logout(session, manager) {
    if (session == null) throw new Error("Invalid session");

    if (await validateSession(session, manager)) {
        await manager.dbExecute(
            `UPDATE UserAccounts SET SessionKey = NULL, SessionExpiry = NULL WHERE AccountID = ?`,
            [session.account_id]
        );
    } else {
        throw new Error("Invalid session");
    }
}

export async function deleteAccount(session, password, manager) {
    // Deleting account requires password
    if (session == null || password == null) throw new Error("Invalid session / password");

    if (!await validateSession(session, manager)) throw new Error("Invalid session");

    const account = await getAccountByID(session.account_id, manager);
    if (validatePassword(password, account["Password"], account["Salt"])) {
        await manager.dbExecute(
            `DELETE FROM UserAccounts WHERE AccountID = ?`,
            [session.account_id]
        );
    } else {
        throw new Error("Invalid password");
    }
}

const editableFields = ["Fullname", "Description", "Location", "HobbyTags", "HobbyExperience"];
export async function updateAccount(session, data, manager) {
    if (session == null || data == null) throw new Error("Invalid session / data");

    if (await validateSession(session, manager)) {
        const fields = editableFields.filter(x => x in data);
        if (fields.length == 0) throw new Error("Invalid changes");
        if (fields.length != Object.keys(data).length) throw new Error("Invalid changes");

        const values = fields.map(x => data[x]);
        values.forEach(value => {
            if (typeof value !== "string") throw new Error("Invalid changes");
        })

        await manager.dbExecute(
            `UPDATE UserAccounts SET ${fields.map(x => `${x} = ?`).join(", ")} WHERE AccountID = ?`,
            [...values, session.account_id]
        );
    } else {
        throw new Error("Invalid session");
    }
}

export async function getAccountInformation(username, manager) {
    const matches = await manager.dbGet(
        `SELECT AccountID, Username, Fullname, CreationDate, Description, Location, HobbyTags, HobbyExperience FROM UserAccounts WHERE Username = ?`,
        [username]
    );
    
    if (matches.length != 1) throw new Error("Account does not exist");
    return matches[0];
}

export async function getAccountInformationByID(account_id, manager) {
    const matches = await manager.dbGet(
        `SELECT AccountID, Username, Fullname, CreationDate, Description, Location, HobbyTags, HobbyExperience FROM UserAccounts WHERE AccountID = ?`,
        [account_id]
    );

    if (matches.length != 1) throw new Error("Account does not exist");
    return matches[0];
}

export async function init(manager) {
    await manager.dbExecute(account_table_schema);
}

export default {
    init,
    createAccount,
    login,
    validateSession,
    logout,
    deleteAccount,
    updateAccount,
    getAccountInformation,
    getAccountInformationByID,
}