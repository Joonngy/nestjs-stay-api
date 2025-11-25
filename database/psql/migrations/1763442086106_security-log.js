const fs = require('fs');
const path = require('path');

exports.shorthands = undefined;

exports.up = (pgm) => {
    // Read the SQL schema file
    const sqlPath = path.join(__dirname, '../schemas/02_security_log.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL file
    pgm.sql(sql);
};

exports.down = (pgm) => {
    pgm.dropTable('security_logs', {ifExists: true, cascade: true});
};
