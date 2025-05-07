const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const logger = require('../logger');
const { exec } = require('child_process');
const fs = require('fs');

const backupDir = 'C:\\xampp\\htdocs\\UocBus\\database\\Backups';
const mysqldumpPath = 'C:\\xampp\\mysql\\bin\\mysqldump.exe';
const username = 'root';
const password = 'uocbts@2025';
const database = 'bus_ticketing';


logger.info('Starting database backup...');

// Ensure the backup directory exists
if (!fs.existsSync(backupDir)) {
fs.mkdirSync(backupDir, { recursive: true });
}

// Format today's date as YYYYMMDD
const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const backupFile = `${backupDir}\\backup_${date}.sql`;

// Execute MySQL dump command without shell redirection
exec(`"${mysqldumpPath}" -u ${username} -p${password} ${database}`, (error, stdout, stderr) => {
if (error) {
    logger.error(`Backup error: ${error.message}`);
    return;
}
// Only write file if there was no error
fs.writeFile(backupFile, stdout, (err) => {
    if (err) {
    logger.error(`Error writing backup file: ${err.message}`);
    } else {
    logger.info(`Backup created: ${backupFile}`);
    }
});

// Delete backups older than 7 days
fs.readdir(backupDir, (err, files) => {
    if (err) {
    logger.error(`Error reading backup directory: ${err.message}`);
    return;
    }
    files.forEach(file => {
    const filePath = `${backupDir}\\${file}`;
    fs.stat(filePath, (err, stats) => {
        if (err) {
        logger.error(`Error reading file stats: ${err.message}`);
        return;
        }
        const now = Date.now();
        const fileAge = now - new Date(stats.mtime).getTime();
        const sevenDays = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        if (fileAge > sevenDays) {
        fs.unlink(filePath, err => {
            if (err) {
            logger.error(`Error deleting old backup: ${err.message}`);
            } else {
            logger.info(`Deleted old backup: ${file}`);
            }
        });
        }
    });
    });
});
});