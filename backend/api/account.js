import account_system from "../dbManagement/account_system.js";
import { getCookies, setCookie } from "../server/server.js";
import config from "../config.js";

function setSessionCookie(res, session) {
    setCookie(res, [{
        "name": "session",
        "value": JSON.stringify(session),
        "sameSite": "Strict",
        "path": "/api/account",
        "httpOnly": true,
        "expires": new Date(Date.now() + 24 * 60 * 60 * 1000),
    }]);
}

export function createAccountHandler(req, res, body, manager) {
    return new Promise(async (resolve, reject) => {
        if (body.username == null || body.password == null) return reject(new Error("Invalid username / password"));
        if (body.username == "" || body.password == "") return reject(new Error("Invalid username / password"));

        await account_system.createAccount(body.username, body.password, manager).then(session => {
            res.setHeader("Content-Type", "application/json");
            setSessionCookie(res, session);
            res.writeHead(200).end(JSON.stringify({}));
            resolve();
        }).catch(err => {
            reject(err);
        });
    });
}

export function loginHandler(req, res, body, manager) {
    return new Promise(async (resolve, reject) => {
        if (body.username == null || body.password == null) return reject(new Error("Invalid username / password"));
        if (body.username == "" || body.password == "") return reject(new Error("Invalid username / password"));

        await account_system.login(body.username, body.password, manager).then(session => {
            res.setHeader("Content-Type", "application/json");
            setSessionCookie(res, session);
            res.writeHead(200).end(JSON.stringify({}));
            resolve();
        }).catch(err => {
            reject(err);
        });
    });
}

export function validateSessionHandler(req, res, body, manager) {
    return new Promise(async (resolve, reject) => {
        const cookies = getCookies(req);
        if (cookies == null) return reject(new Error("Invalid session"));
        if (cookies.session == null) return reject(new Error("Invalid session"));

        let session;
        try {
            session = JSON.parse(cookies.session);
        } catch (err) {
            return reject(new Error("Invalid session"));
        }

        if (await account_system.validateSession(session, manager)) {
            res.writeHead(200).end();
            resolve();
        } else {
            res.writeHead(401).end();
            resolve();
        }
    });
}

export function logoutHandler(req, res, body, manager) {
    return new Promise(async (resolve, reject) => {
        const cookies = getCookies(req);
        if (cookies == null) return reject(new Error("Invalid session"));
        if (cookies.session == null) return reject(new Error("Invalid session"));

        let session;
        try {
            session = JSON.parse(cookies.session);
        } catch (err) {
            return reject(new Error("Invalid session"));
        }

        await account_system.logout(session, manager).then(() => {
            setSessionCookie(res, { "account_id": null, "session_key": null });
            res.writeHead(200).end();
            resolve();
        }).catch(err => {
            reject(err);
        });
    });
}

export function deleteAccountHandler(req, res, body, manager) {
    return new Promise(async (resolve, reject) => {
        const cookies = getCookies(req);
        if (cookies == null) return reject(new Error("Invalid session"));
        if (cookies.session == null) return reject(new Error("Invalid session"));
        if (body.password == null) return reject(new Error("Invalid password"));

        let session;
        try {
            session = JSON.parse(cookies.session);
        } catch (err) {
            return reject(new Error("Invalid session"));
        }

        await account_system.deleteAccount(session, body.password, manager).then(() => {
            setSessionCookie(res, { "account_id": null, "session_key": null });
            res.writeHead(200).end();
            resolve();
        }).catch(err => {
            reject(err);
        });
    });
}

export function updateAccountHandler(req, res, body, manager) {
    return new Promise(async (resolve, reject) => {
        const cookies = getCookies(req);
        if (cookies == null) return reject(new Error("Invalid session"));
        if (cookies.session == null) return reject(new Error("Invalid session"));

        let session;
        try {
            session = JSON.parse(cookies.session);
        } catch (err) {
            return reject(new Error("Invalid session"));
        }
        await account_system.updateAccount(session, body, manager).then(() => {
            res.writeHead(200).end();
            resolve();
        }).catch(err => {
            reject(err);
        });
    });
}

export function getAccountInformationHandler(req, res, body, manager) {
    return new Promise(async (resolve, reject) => {
        if (body.account_id != null) {
            await account_system.getAccountInformationByID(body.account_id, manager).then(account => {
                res.setHeader("Content-Type", "application/json");
                res.writeHead(200).end(JSON.stringify(account));
                resolve();
            }).catch(err => {
                reject(err);
            });
        } else if (body.username != null) {
            await account_system.getAccountInformation(body.username, manager).then(account => {
                res.setHeader("Content-Type", "application/json");
                res.writeHead(200).end(JSON.stringify(account));
                resolve();
            }).catch(err => {
                reject(err);
            });
        } else {
            const cookies = getCookies(req);
            if (cookies == null) return reject(new Error("Invalid query"));
            if (cookies.session == null) return reject(new Error("Invalid query"));

            let session;
            try {
                session = JSON.parse(cookies.session);
            } catch (err) {
                return reject(new Error("Invalid session"));
            }

            await account_system.getAccountInformationByID(session.account_id, manager).then(account => {
                res.setHeader("Content-Type", "application/json");
                res.writeHead(200).end(JSON.stringify(account));
                resolve();
            }).catch(err => {
                reject(err);
            });
        }
    });
}