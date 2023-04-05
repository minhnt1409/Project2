import mysql from 'mysql2';

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'api',
});

connection.connect(error => {
    if (error) {
        console.log('Cannot connect to database:', error);
        return;
    }
    console.log('Connected to database.');
});

export default connection;