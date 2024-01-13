const Database = require('better-sqlite3');
const fs = require('fs');

module.exports = class DB {

    // DB Constructor
    // ----------------------------------------------------------
    //  Parameters: 
    //    - databasePath: Path of the database to be connected to
    //  Returns: 
    //    - connection: Database connection object
    //  Description:
    //    This is the constructor of the DB class, which takes a database path and creates a connection to the specified database.
    // constructor: This is the constructor of the DB class, which takes a database path and creates a connection to the specified database.
    // Returns a new instance of the DB class.
    constructor(dbPath) {
        this.db =  new Database(`${dbPath}.db`);

    }

    // insertOne: This method accepts a tablename string and a data object then inserts a single row into the specified table and returns id of the inserted row.
    // Returns the id of the inserted row.
    insertOne(tableName, data) {
        const columns = Object.keys(data).join(',');
        const placeholders = Object.keys(data).map(col => {
            return "@" + col
        }).join(',');

        const stmt = this.db.prepare(`INSERT INTO ${tableName} (${columns}) VALUES ( ${placeholders})`);
        return stmt.run(data).lastInsertRowid;
    }

    // insertMany: This method accepts a tablename string and a data object then inserts multiple rows into the specified table and returns the number of rows inserted.
    // Returns the number of rows inserted.
    insertMany(tableName, data) {
        let allChanges = 0;
        const columns = Object.keys(data[0]).join(',');
        const placeholders = Object.keys(data[0]).map(col => {
            return "@" + col
        }).join(',');

        const insert = this.db.prepare(`INSERT INTO ${tableName}  (${columns}) VALUES ( ${placeholders})`);

        const insertMany = this.db.transaction((arr) => {
            for (const a of arr) {
                const res = insert.run(a).changes;
                allChanges += res;
            }
        });
        insertMany(data);
        return allChanges;
    }

    upsertOne(tableName, data) {
        const columns = Object.keys(data).join(',');
        const placeholders = Object.keys(data).map(col => {
            return "@" + col
        }).join(',');

        const stmt = this.db.prepare(`INSERT OR REPLACE INTO ${tableName} (${columns}) VALUES ( ${placeholders})`);
        return stmt.run(data).lastInsertRowid;
    }

    upsertMany(tableName, data) {
        let allChanges = 0;
        const columns = Object.keys(data[0]).join(',');
        const placeholders = Object.keys(data[0]).map(col => {
            return "@" + col
        }).join(',');

        const insert = this.db.prepare(`INSERT OR REPLACE INTO ${tableName}  (${columns}) VALUES ( ${placeholders})`);

        const insertMany = this.db.transaction((arr) => {
            for (const a of arr) {
                const res = insert.run(a).changes;
                allChanges += res;
            }
        });
        insertMany(data);
        return allChanges;
    }



    insertIgnoreOne(tableName, data) {
        const columns = Object.keys(data).join(',');
        const placeholders = Object.keys(data).map(col => {
            return "@" + col
        }).join(',');

        const stmt = this.db.prepare(`INSERT OR IGNORE INTO ${tableName} (${columns}) VALUES ( ${placeholders})`);
        return stmt.run(data).lastInsertRowid;
    }

    insertIgnoreMany(tableName, data) {
        let allChanges = 0;
        const columns = Object.keys(data[0]).join(',');
        const placeholders = Object.keys(data[0]).map(col => {
            return "@" + col
        }).join(',');

        const insert = this.db.prepare(`INSERT OR IGNORE INTO ${tableName}  (${columns}) VALUES ( ${placeholders})`);

        const insertMany = this.db.transaction((arr) => {
            for (const a of arr) {
                const res = insert.run(a).changes;
                allChanges += res;
            }
        });
        insertMany(data);
        return allChanges;
    }




    // updateOne: This method accepts a tablename string, a data object and a condition object then updates a single row in the specified table and returns the number of rows updated.
    // Returns the number of rows updated.
    updateOne(tableName, data, condition) {
        const set = Object.keys(data).map(col => {
            return col + " = @" + col
        }).join(', ');
        const allData = { ...data }
        const where = Object.keys(condition).map(col => {
            allData["w_" + col] = condition[col];
            return col + " = @w_" + col
        }).join(' AND ');
        // Create a query to update one row in the table
        const stmt = this.db.prepare(`UPDATE ${tableName} SET ${set} WHERE ${where} LIMIT 1`);
        return stmt.run(allData).changes;
    }

    // updateMany: This method accepts a tablename string, a data object and a condition object then updates multiple rows in the specified table and returns the number of rows updated.
    // Returns the number of rows updated.
    updateMany(tableName, data, condition) {
        const set = Object.keys(data).map(col => {
            return col + " = @" + col
        }).join(', ');
        const allData = { ...data }
        const conditionKeys = Object.keys(condition);
        const where = conditionKeys.map(col => {
            allData["w_" + col] = condition[col];
            return col + " = @w_" + col
        }).join(' AND ');
        // Create a query to update one row in the table
        let stmt;
        if(conditionKeys.length > 0) {
            stmt = this.db.prepare(`UPDATE ${tableName} SET ${set} WHERE ${where}`);
        } else {
            stmt = this.db.prepare(`UPDATE ${tableName} SET ${set}`);
        } 
        return stmt.run(allData).changes;
    }

    // deleteOne: This method accepts a tablename string and a condition object then deletes a single row from the specified table and returns the number of rows deleted.
    // Returns the number of rows deleted.
    deleteOne(tableName, condition) {
        const where = Object.keys(condition).map(col => {
            return col + " = @" + col
        }).join(' AND ');
        const stmt = this.db.prepare(`DELETE FROM ${tableName} WHERE ${where} LIMIT 1`);
        return stmt.run(condition).changes;
    }

    // deleteMany: This method accepts a tablename string and a condition object then deletes multiple rows from the specified table and returns the number of rows deleted.
    // Returns the number of rows deleted.
    deleteMany(tableName, condition) {
        if (Object.keys(condition).length > 0) {
            const where = Object.keys(condition).map(col => {
                return col + " = @" + col
            }).join(' AND ');
            const stmt = this.db.prepare(`DELETE FROM ${tableName} WHERE ${where}`);
            return stmt.run(condition).changes;
        } else {
            const stmt = this.db.prepare(`DELETE FROM ${tableName}`);
            return stmt.run().changes;
        }
    }

    // findOne: This method accepts a tablename string and a condition object then retrieves a single row from the specified table.
    // Returns a single row from the specified table.
    findOne(tableName, condition) {
        const placeholders = Object.keys(condition).map(col => {
            return col + " = @" + col
        }).join(' AND ');
        // Create a query to select one row from the table
        const stmt = this.db.prepare(`SELECT * FROM ${tableName} WHERE ${placeholders} LIMIT 1`);
        return stmt.get(condition);
    }

    // findMany: This method accepts a tablename string and a condition object then retrieves multiple rows from the specified table.
    // Returns an array of rows from the specified table.
    findMany(tableName, condition) {
        let stmt;
        if (Object.keys(condition).length > 0) {
            const placeholders = Object.keys(condition).map(col => {
                return col + " = @" + col;
            }).join(' AND ');
            // Create a query to select one row from the table
            stmt = this.db.prepare(`SELECT * FROM ${tableName} WHERE ${placeholders}`);
        } else stmt = this.db.prepare(`SELECT * FROM ${tableName}`);
        return stmt.all(condition);
    }


    // findDirect: This method accepts a query string and parameters and retrieves rows from the specified table.
    // Returns an array of rows from the specified table.
    // let results = findDirect('SELECT * FROM users WHERE age > :minAge AND age < :maxAge', {minAge: 20, maxAge: 30});
    findDirect(query, params) {
        const stmt = this.db.prepare(query);
        if(params) return stmt.all(params);
        else return stmt.all();
    }

    // updateDirect: This method accepts a query string and parameters and updates multiple rows in the specified table and returns the number of rows updated.
    // Returns the number of rows updated.
    // let numRowsUpdated = updateDirect('UPDATE users SET name = :name WHERE age = :age', {name: 'John', age: 25});
    updateDirect(query, params) {
        const stmt = this.db.prepare(query);
        return stmt.run(params).changes;
    }

    // deleteDirect: This method accepts a query string and parameters and deletes multiple rows from the specified table and returns the number of rows deleted.
    // Returns the number of rows deleted.
    // let numRowsDeleted = deleteDirect('DELETE FROM users WHERE age < :age', {age: 20});
    deleteDirect(query, params) {
        const stmt = this.db.prepare(query);
        return stmt.run(params).changes;
    }

    executeDirect(query) {
        this.db.prepare(query).run();
    }

    
    // transaction: This method starts a new transaction.
    // Returns nothing.
    transaction() {
        this.db.prepare('BEGIN TRANSACTION').run();
    }

    // commit: This method commits the current transaction.
    // Returns nothing.
    commit() {
        this.db.prepare('COMMIT TRANSACTION').run();
    }

    // rollback: This method rolls back the current transaction.
    // Returns nothing.
    rollback() {
        this.db.prepare('ROLLBACK TRANSACTION').run();
    }

    // close: This method closes the database connection.
    // Returns nothing.
    close() {
        this.db.close();
    }
    // listAllTableNames: This method lists all table names from the specified database.
    // Returns an array of table names.
    listAllTableNames() {
        return this.db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all();
    }

    // deleteDB: This method closes the database connection and deletes the associated SQLite file.
    // Returns nothing.
    deleteDB() {
        this.db.close();
        fs.unlinkSync(this.path);
    }

}