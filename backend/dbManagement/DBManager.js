import sqlite3 from 'sqlite3';

export class DBManager {
    constructor (dbpathNew="./defaultDB.sqlite") {
        this.dbpath = dbpathNew;
        this.dbConnect = null;
    }

    async establishConnection () {
        let dbConnect = new sqlite3.Database(this.dbpath);
        if (dbConnect) {
            this.dbConnect = dbConnect;
            this.dbConnect.on("trace", str => console.log(`DB: ${str}`)); 
            return "establishConnection: Success";
    }
        else {return "establishConnection: Failed";}
    }

    async dbpathChange (dbpathNew) {
        this.dbpath = dbpathNew;
    }

    async dbExecute (sqlCommand,params=[]) {
        if (!this.dbConnect) {this.dbConnect = this.establishConnection();}
        return new Promise ((resolve,_) => {
            this.dbConnect.run(sqlCommand,params,(err) => {
                if (!err) {resolve("dbExecute: Success");}
                else {resolve("dbExecute: "+err.message);}
            });
        });
    }

    async dbGet (sqlCommand,params=[]) {
        if (!this.dbConnect) {this.dbConnect = this.establishConnection();}
        return new Promise ((resolve,_) => {
            let leadCommand = sqlCommand.trim().split(/\s+/)[0];
            if (!(leadCommand == "SELECT")) {resolve("dbExecute: custom_ERROR: sqlCommand only accepts 'SELECT'");}
            else {
                this.dbConnect.all(sqlCommand,params,(err,result) => {
                    if (!err) {resolve(result);}
                    else {resolve("dbGet: "+err.message);}
                })
            }});
    }

    async dbClose () {
        await this.dbConnect.close();
    }
}

/*
Test (with additional code) by running within the terminal (cd to folder first): node DBManager.js
*/
