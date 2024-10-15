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
                throw err;
            } else {
                console.log('Database connected');
            }
        });
    }
    updateRobot(weburl){
       let qu = 'Insert into robotUrl values (?)';

       for(let i=0; i< weburl.length;i++){
        this.databaseDetails.query(qu,[weburl[i]],err=>{
            if(err) throw err;
            else console.log('Database updated');
           });
       }
    }

    // Method to get robot URLs from the database using Promises
    getRobot() {
        return new Promise((resolve, reject) => {
            this.databaseDetails.query('SELECT url FROM robotUrl', (err, results) => {
                if (err) {
                    reject(err); // Reject the promise if there's an error
                } else {
                    if (!results || results.length === 0) {
                        resolve([]); // Resolve with an empty array if no results
                    } else {
                        const urls = results.map(row => row.url); // Extract URLs
                        resolve(urls); // Resolve with the URLs
                    }
                }
            });
        });
    }
}

module.exports = Database;