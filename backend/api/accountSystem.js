import { userLogin, userLogout, retrieveAccInfo, changeAccInfo, createAccount, deleteAccount, retAll } from "../dbManagement/accountSys.js"
import { DBManager } from "../dbManagement/DBManager.js";
import { manager } from "../dbManagement/index.js"
manager.DATABASE_PATH = "../backend/data/dev.db";
manager.path = "../backend/data/dev.db";

export async function loginGetHandler (req,res,body) {
    if (body.dbLink) {
        var mng = new DBManager(body.dbLink);
    } else {var mng = manager;}

    if (body.action == 'firstLogin') {
        try {
            const sessionKey = await userLogin(mng,body);
            if (sessionKey) {
                res.writeHead(200).end(JSON.stringify(sessionKey));
            } else {res.writeHead(400).end();}
        } catch (err) {res.writeHead(400).end();}
    }
    else if (body.action == 'persistLogin') {
        try {
            var accInfo = await retrieveAccInfo(mng,body);
            res.writeHead(200).end(JSON.stringify(accInfo));
        } catch (err) {res.writeHead(400).end();}
    }
    else if (body.action == 'logout') {
        try {
            await userLogout(mng,body);
            res.writeHead(200).end(JSON.stringify(null));
        } catch (err) {res.writeHead(400).end();}
    }
    /* else if (body.action == 'loadAll') {
        try {
            var retall = await retAll(mng);
            res.writeHead(200).end(JSON.stringify(retall));
        } catch (err) {res.writeHead(400).end();}
    } */
   else {res.writeHead(400).end();}
};

export async function updateGetHandler (req,res,body) {
    if (body.dbLink) {
        var mng = new DBManager(body.dbLink);
    } else {var mng = manager;}

    if (body.action == "change") {
        try {
            await changeAccInfo(mng,body);
            res.writeHead(200).end(JSON.stringify(null));
        } catch (err) {res.writeHead(400).end();}
    }
    else if (body.action == "create") {
        try {
            const sessionKey = await createAccount(mng,body);
            res.writeHead(200).end(JSON.stringify(sessionKey));
        } catch (err) {res.writeHead(400).end()}
    }
    else if (body.action == "delete") {
        try {
            await deleteAccount(mng,body);
            res.writeHead(200).end(JSON.stringify(null));
        } catch (err) {res.writeHead(400).end();}
    }
   else {res.writeHead(400).end();}
};