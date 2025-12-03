
const sqlite3 = require('sqlite3').verbose();
const schema = require('./schema');

class DBManager {
    constructor (dbpathNew=`./defaultDB.sqlite`) {
        this.dbpath = dbpathNew;
        this.tableName,this.columns = schema.returnSchema();
        this.dbConnect = null;
    }

    establishConnection () {
        const dbConnect = new sqlite3.Database(this.dbpath, (err) => {
            if (err) {
                console.error("Connection Failed:",err.message);
                process.exit(1);
            } console.log("Connection Established")
        })
        this.dbConnect = dbConnect
    }

    dbpathChange (dbpathNew) {
        this.dbpath = dbpathNew;
    }

    initialiseSchema () {
        if (!this.dbConnect) {this.dbConnect = this.establishConnection();}
        db.run(`CREATE TABLE IF NOT EXISTS ${this.tableName} (${this.columns})`,[],(err) => {
            if (err) {console.error("Failed to Initialise Schema:",err); process.exit(1);}
            console.log("Schema Initialised");
        });
        return true;
    }

    dropSchema () {
        if (!this.dbConnect) {this.dbConnect = this.establishConnection();}
        db.run(`DROP TABLE ${this.tableName}`,[],(err) => {
            if (err) {console.error("Failed to Drop Schema:",err.message); process.exit(1);}
            console.log("Schema Dropped");
        });
        return true;
    }

    dbExecute (sqlCommand,params=[]) {
        if (!this.dbConnect) {this.dbConnect = this.establishConnection();}
        this.dbConnect.run(sqlCommand,params,(err) => {
            if (err) {console.error("Failed to run SQL Execute:",err.message); process.exit(1);}
            console.log("SQL Execute Succeeded");
        })
        return true
    }

    dbGet (sqlCommand,params=[]) {
        if (!this.dbConnect) {this.dbConnect = this.establishConnection();}
        this.dbConnect.run(sqlCommand,params,(err,row) => {
            if (err) {console.error("Failed to run SQL Get:",err.message); process.exit(1);}
            console.log("SQL Get Succeeded");
        })
        return row
    }
}

module.exports = DBManager;