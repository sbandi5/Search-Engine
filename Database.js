const mysql = require('mysql2');

// Using singleton pattern for a single database connection
class Database {
    static #instance = null;

    constructor() {
        if (Database.#instance) {
            throw new Error('Use Database.getInstance() instead of new.');
        }

        this.databaseDetails = mysql.createConnection({
            host: 'localhost',
            user: 'COSC631',
            password: 'COSC631',
            database: 'SearchEngine'
        });
    }

    // Static method to get the singleton instance
    static getInstance() {
        if (!Database.#instance) {
            Database.#instance = new Database();
        }
        return Database.#instance;
    }

    // Method to connect to the database
    connect() {
        this.databaseDetails.connect(err => {
            if (err) {
                console.error('Database connection failed:', err);
                throw err;
            } else {
                console.log('Database connected');
            }
        });
    }

    // Methods for roboturl table
    // Method to update robot URL table only if the URL is not already present
    updateRobot(weburl) {
        // First, check if the URL already exists in the table
        const queryCheck = 'SELECT COUNT(*) AS count FROM robotUrl WHERE url = ?';
        this.databaseDetails.query(queryCheck, [weburl], (err, results) => {
            if (err) {
                console.log('Error checking for URL existence:', err);
            } else {
                if (results[0].count === 0) {
                    // If the URL is not found, insert it into the table
                    const queryInsert = 'INSERT INTO robotUrl (url) VALUES (?)';
                    this.databaseDetails.query(queryInsert, [weburl], (err) => {
                        if (err) {
                            console.log('Error updating the robotUrl:', err);
                        } else {
                            console.log('Database updated with new URL.');
                        }
                    });
                } else {
                    console.log('URL already exists in the database.');
                }
            }
        });
    }


    // Method to get robot URLs from the database using Promises
    async getRobot(pos) {
        const query = 'SELECT url FROM robotUrl WHERE pos = ?';
        return new Promise((resolve, reject) => {
            this.databaseDetails.query(query, [pos], (error, results) => {
                if (error) {
                    return reject(error);
                }
                // Resolve with the URL or null if not found
                const url = results.length > 0 ? results[0].url : null;
                resolve(url);
            });
        });
    }

    // Methods for urlKeyword table
    updateUrlKeyword(url, keyword, rank) {
        const query = 'INSERT INTO urlKeyword VALUES (?,?,?)';
        this.databaseDetails.query(query, [url, keyword, rank], err => {
            if (err) {
                console.error('Error updating the urlKeyword:', err);
            } else {
                console.log('Successfully updated the urlKeyword');
            }
        });
    }
    emptyRobot() {
        this.databaseDetails.query('TRUNCATE robotUrl', err => {
            if (err) {
                console.error('Error emptying robotUrl table:', err);
                throw err;
            } else {
                console.log('Successfully cleared the robotUrl table');
            }
        });
    }

    emptyUrlKeyword() {
        this.databaseDetails.query('TRUNCATE urlKeyword', err => {
            if (err) {
                console.error('Error emptying urlKeyword table:', err);
                throw err;
            } else {
                console.log('Successfully cleared the urlKeyword table');
            }
        });
    }

    // Methods for the urlDescription table
    emptyUrlDescription() {
        this.databaseDetails.query('TRUNCATE urlDescription', err => {
            if (err) {
                console.error('Error emptying urlDescription table:', err);
                throw err;
            } else {
                console.log('Successfully cleared the urlDescription table');
            }
        });
    }

    updateUrlDescription(url, description) {
        const query = 'INSERT INTO urlDescription VALUES (?,?)';
        this.databaseDetails.query(query, [url, description], err => {
            if (err) {
                console.error('Error updating the urlDescription:', err);
            } else {
                console.log('Successfully updated the urlDescription');
            }
        });
    }
}

module.exports = Database;
