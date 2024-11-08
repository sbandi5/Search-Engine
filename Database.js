const mysql = require('mysql2');

// Using singleton pattern for a single database connection
class Database {
    static #instance = null;

    constructor() {
        if (Database.#instance) {
            throw new Error('Use Database.getInstance() instead of new.');
        }
        this.databaseDetails = null; // Initialize without a connection
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
        this.databaseDetails = mysql.createConnection({
            host: 'localhost',
            user: 'COSC631',
            password: 'COSC631',
            database: 'SearchEngine'
        });

        this.databaseDetails.connect(err => {
            if (err) {
                console.error('Database connection failed:', err);
                throw err;
            } else {
                console.log('Database connected');
            }
        });
    }

    // Method to disconnect from the database
    disconnect() {
        if (this.databaseDetails) {
            this.databaseDetails.end(err => {
                if (err) {
                    console.error('Error disconnecting from the database:', err);
                } else {
                    console.log('Database disconnected');
                }
            });
            this.databaseDetails = null;
        }
    }

    // Methods for roboturl table
    // Method to update robot URL table only if the URL is not already present
    updateRobot(weburl) {
        // Check if the URL already exists in the robotUrl table
        const queryCheck = 'SELECT COUNT(*) AS count FROM robotUrl WHERE url = ?';
        
        // Execute the check query
        this.databaseDetails.query(queryCheck, [weburl], (err, results) => {
            if (err) {
                console.error('Error checking for URL existence:', err);
                return;
            }
    
            // Proceed only if the URL does not already exist
            if (results[0].count === 0) {
                // Insert the URL into the robotUrl table
                const queryInsert = 'INSERT INTO robotUrl (url) VALUES (?)';
                this.databaseDetails.query(queryInsert, [weburl], (err) => {
                    if (err) {
                        console.error('Error updating the robotUrl table:', err);
                    }
                });
            }
        });
    }    


    // Method to get robot URLs from the database using Promises
    async getRobot(pos) {
        const query = 'SELECT url FROM robotUrl WHERE pos = ?';
        return new Promise((resolve, reject) => {
            this.databaseDetails.query(query, [pos], (err, results) => {
                if (err) {
                    return reject(err);
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
            }
        });
    }

    async SearchResultsQuery(){
    	return new Promise((resolve, reject) => {
        	this.databaseDetails.query('SELECT uk.url, ud.description, uk.rank FROM urlKeyword uk JOIN urlDescription ud ON uk.url = ud.url ORDER BY uk.rank DESC', (err, results) => {
                	if (err) {
                    		return reject(err);
                	}
                	resolve(results);
      		})
    	});
    }

    async checkpos() {
        return new Promise((resolve, reject) => {
            this.databaseDetails.query('SELECT MAX(pos) AS maxPos FROM robotUrl', (err, result) => {
                if (err) {
                    console.error('Error querying the max position:', err);
                    return reject(err);
                }
    
                // Extract the maxPos value from the result
                const maxPos = result[0].maxPos;
                // If maxPos is null (no rows), return 0 as the default value
                resolve(maxPos !== null ? maxPos : 0);
            });
        });
    }
    getUrlKeywordContents(){
	return new Promise((resolve, reject) => {
            this.databaseDetails.query('SELECT * from urlKeyword', (err, results) => {
                if (err) {
                    console.error('Error querying the max position:', err);
                    return reject(err);
                }
                resolve(results);
            });
        });
    }
     updateRank(url, rank) {
        const query = 'UPDATE urlKeyword SET `rank` = ? WHERE url = ?';
        this.databaseDetails.query(query, [rank, url], err => {
            if (err) {
                console.error('Error updating the Rank in urlKeyword:', err);
            }
        });
    }
    async makeRankZero() {
        const query = 'update into urlKeyword(rank) values (0) ';
        this.databaseDetails.query(query, err => {
            if (err) {
                console.error('Error updating the Rank in urlKeyword:', err);
            }
        });
    }
}

module.exports = Database;
