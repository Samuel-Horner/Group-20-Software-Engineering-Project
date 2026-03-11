import hobby_set from "./hobby_set.js";
import { manager } from "./index.js";

const network_account_schema = `
CREATE TABLE IF NOT EXISTS NetworkAccount (
    AccountID INTEGER PRIMARY KEY AUTOINCREMENT,
    Username TEXT NOT NULL UNIQUE,
    Description TEXT NOT NULL
);
`;

const network_account_hobby_schema = `
CREATE TABLE IF NOT EXISTS NetworkAccountHobby (
    AccountID INTEGER NOT NULL,
    HobbyID INTEGER NOT NULL,
    PRIMARY KEY (AccountID, HobbyID),
    FOREIGN KEY (AccountID) REFERENCES NetworkAccount(AccountID) ON DELETE CASCADE,
    FOREIGN KEY (HobbyID) REFERENCES HobbyTable(HobbyID) ON DELETE CASCADE
);
`;

const network_indexes = [
    "CREATE INDEX IF NOT EXISTS idx_network_account_username ON NetworkAccount(Username);",
    "CREATE INDEX IF NOT EXISTS idx_network_account_hobby_account ON NetworkAccountHobby(AccountID);",
    "CREATE INDEX IF NOT EXISTS idx_network_account_hobby_hobby ON NetworkAccountHobby(HobbyID);"
];

const network_seed_data = {
    accounts: [
        {
            username: "sarah_chen",
            description: "Creative hobby explorer who enjoys weekend projects."
        },
        {
            username: "marcus_johnson",
            description: "Tech-minded builder who likes active and maker hobbies."
        },
        {
            username: "emily_rodriguez",
            description: "Loves trying new hobbies and sharing progress online."
        },
        {
            username: "david_kim",
            description: "Music and photo enthusiast who likes outdoor rides."
        },
        {
            username: "nina_patel",
            description: "Enjoys calm creative hobbies and community events."
        },
        {
            username: "alex_nguyen",
            description: "Hands-on tinkerer focused on electronics and gaming."
        },
        {
            username: "hannah_lee",
            description: "Cooking fan with an interest in home and garden crafts."
        },
        {
            username: "owen_brown",
            description: "Outdoor-first hobbyist who also likes digital creativity."
        }
    ],
    accountHobbies: {
        sarah_chen: ["Photography", "Cooking", "Gardening"],
        marcus_johnson: ["Woodworking", "3D Printing", "Gaming"],
        emily_rodriguez: ["Baking", "Photography", "Coffee Roasting"],
        david_kim: ["Guitar", "Cycling", "Photography"],
        nina_patel: ["Baking", "Gardening", "Cooking"],
        alex_nguyen: ["Electronics", "Gaming", "3D Printing"],
        hannah_lee: ["Cooking", "Baking", "Gardening"],    // await manager.dbExecute("INSERT OR IGNORE INTO HobbyTable (HobbyName) VALUES (?);", [hobbyName]);
    // const rows = await manager.dbGet(
    //     "SELECT HobbyID FROM HobbyTable WHERE LOWER(HobbyName) = LOWER(?) LIMIT 1;",
    //     [hobbyName]
    // );
        owen_brown: ["Cycling", "Photography", "Gaming"]
    }
};

async function ensureHobbyId(hobbyName) {
    // await manager.dbExecute("INSERT OR IGNORE INTO HobbyTable (HobbyName) VALUES (?);", [hobbyName]);
    // const rows = await manager.dbGet(
    //     "SELECT HobbyID FROM HobbyTable WHERE LOWER(HobbyName) = LOWER(?) LIMIT 1;",
    //     [hobbyName]
    // );
    
    // return rows.length > 0 ? rows[0].HobbyID : null;
    return hobby_set.add(hobbyName, manager);
}

async function seedNetworkingData() {
    for (const account of network_seed_data.accounts) {
        await manager.dbExecute(
            "INSERT OR IGNORE INTO NetworkAccount (Username, Description) VALUES (?, ?);",
            [account.username, account.description]
        );
    }

    const accountRows = await manager.dbGet("SELECT AccountID, Username FROM NetworkAccount;");
    const accountMap = new Map(accountRows.map((row) => [row.Username, row.AccountID]));

    for (const [username, hobbies] of Object.entries(network_seed_data.accountHobbies)) {
        const accountId = accountMap.get(username);
        if (!accountId) { continue; }

        for (const hobbyName of hobbies) {
            const hobbyId = await ensureHobbyId(hobbyName);
            if (!hobbyId) { continue; }
            await manager.dbExecute(
                "INSERT OR IGNORE INTO NetworkAccountHobby (AccountID, HobbyID) VALUES (?, ?);",
                [accountId, hobbyId]
            );
        }
    }
}

export async function initNetworkingStorage() {
    await manager.dbExecute("PRAGMA foreign_keys = ON;");
    await manager.dbExecute(network_account_schema);
    await manager.dbExecute(network_account_hobby_schema);

    for (const indexStatement of network_indexes) {
        await manager.dbExecute(indexStatement);
    }

    await seedNetworkingData();
}

export async function getNetworkingHobbies() {
    const rows = await manager.dbGet(`
        SELECT DISTINCT h.HobbyName
        FROM NetworkAccountHobby nah
        JOIN HobbyTable h ON h.HobbyID = nah.HobbyID
        ORDER BY h.HobbyName COLLATE NOCASE ASC;
    `);
    return rows.map((row) => row.HobbyName);
}

export async function searchNetworkingAccounts({ search = "", hobbies = [] } = {}) {
    const params = [];
    const filters = [];

    const cleanSearch = String(search).trim().toLowerCase();
    const hobbyList = Array.isArray(hobbies) ? hobbies : [hobbies];
    const cleanHobbies = [...new Set(
        hobbyList
            .map((hobby) => String(hobby).trim().toLowerCase())
            .filter((hobby) => hobby.length > 0)
    )];

    if (cleanSearch.length > 0) {
        const searchTerm = `%${cleanSearch}%`;
        filters.push(`(
            LOWER(a.Username) LIKE ?
            OR EXISTS (
                SELECT 1
                FROM NetworkAccountHobby sah
                JOIN HobbyTable sh ON sh.HobbyID = sah.HobbyID
                WHERE sah.AccountID = a.AccountID
                AND LOWER(sh.HobbyName) LIKE ?
            )
        )`);
        params.push(searchTerm, searchTerm);
    }

    if (cleanHobbies.length > 0) {
        const placeholders = cleanHobbies.map(() => "?").join(", ");
        filters.push(`EXISTS (
            SELECT 1
            FROM NetworkAccountHobby fah
            JOIN HobbyTable fh ON fh.HobbyID = fah.HobbyID
            WHERE fah.AccountID = a.AccountID
            AND LOWER(fh.HobbyName) IN (${placeholders})
        )`);
        params.push(...cleanHobbies);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";
    const rows = await manager.dbGet(`
        SELECT
            a.AccountID,
            a.Username,
            a.Description,
            GROUP_CONCAT(DISTINCT h.HobbyName) AS hobbies
        FROM NetworkAccount a
        LEFT JOIN NetworkAccountHobby ah ON ah.AccountID = a.AccountID
        LEFT JOIN HobbyTable h ON h.HobbyID = ah.HobbyID
        ${whereClause}
        GROUP BY a.AccountID, a.Username, a.Description
        ORDER BY a.Username COLLATE NOCASE ASC;
    `, params);

    return rows.map((row) => ({
        username: row.Username,
        description: row.Description,
        hobbies: row.hobbies
            ? row.hobbies
                .split(",")
                .map((hobby) => hobby.trim())
                .filter((hobby) => hobby.length > 0)
                .sort((left, right) => left.localeCompare(right))
            : []
    }));
}
