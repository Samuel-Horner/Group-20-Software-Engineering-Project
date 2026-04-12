import {userLogin,userLogout,retrieveAccInfo,changeAccInfo,createAccount,deleteAccount,retAll} from "../dbManagement/accountSys.js"

export async function loginGetHandler (req,res,body) {
    if (body.action == 'firstLogin') {
        try {
            const sessionKey = await userLogin(body);
            if (sessionKey) {
                res.writeHead(200).end(JSON.stringify(sessionKey));
            } else {res.writeHead(400).end();}
        } catch (err) {res.writeHead(400).end();}
    }
    else if (body.action == 'persistLogin') {
        try {
            var accInfo = await retrieveAccInfo(body);
            res.writeHead(200).end(JSON.stringify(accInfo));
        } catch (err) {res.writeHead(400).end();}
    }
    else if (body.action == 'logout') {
        try {
            await userLogout(body);
            res.writeHead(200).end(JSON.stringify(null));
        } catch (err) {res.writeHead(400).end();}
    }
    /* else if (body.action == 'loadAll') {
        try {
            var retall = await retAll();
            res.writeHead(200).end(JSON.stringify(retall));
        } catch (err) {res.writeHead(400).end();}
    } */
};

export async function updateGetHandler (req,res,body) {
    if (body.action == "change") {
        try {
            await changeAccInfo(body);
            res.writeHead(200).end(JSON.stringify(null));
        } catch (err) {res.writeHead(400).end();}
    }
    else if (body.action == "create") {
        try {
            const sessionKey = await createAccount(body);
            res.writeHead(200).end(JSON.stringify(sessionKey));
        } catch (err) {res.writeHead(400).end()}
    }
    else if (body.action == "delete") {
        try {
            await deleteAccount(body);
            res.writeHead(200).end(JSON.stringify(null));
        } catch (err) {res.writeHead(400).end();}
    }
};