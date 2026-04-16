import sqlite3 from 'sqlite3';

export class DBManager {
    constructor(path, verbose = false) {
        this.path = path;
        this.connection = null;
        this.verbose = verbose;
    }

    async establishConnection() {
        return new Promise((resolve, reject) => {
            this.connection = new sqlite3.Database(this.path, (err) => {
                if (err) reject(err);

                if (this.verbose) this.connection.on("trace", str => { console.log(str) });
                resolve();
            });
        });
    }

    async dbExecute(cmd, params = []) {
        if (!this.connection) throw new Error(`Attempted database operation before establishing connection!`);

        return new Promise((resolve, reject) => {
            this.connection.run(cmd, params, (err) => {
                if (err) reject(err);
                resolve();
            });
        });
    }

    async dbGet(cmd, params = []) {
        if (!this.connection) throw new Error(`Attempted database operation before establishing connection!`);

        return new Promise((resolve, reject) => {
            this.connection.all(cmd, params, (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });
    }

    dbClose() {
        return new Promise((resolve, reject) => {
            if (this.connection) {
                this.connection.close((err) => {
                    if (err) { 
                        reject(err);
                    }
                    else {
                        this.connection = null;
                        resolve();
                    }
                });
            }
            else { resolve(); }
        })
    }
}

/*
Test (with additional code) by running within the terminal (cd to folder first): node DBManager.js
*/