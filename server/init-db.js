const fs = require('fs');
const path = require('path');
const { pool } = require('./config/database');

async function initializeDatabase() {
  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .filter(statement => statement.trim())
      .map(statement => statement + ';');

    // Execute each statement
    for (const statement of statements) {
      try {
        await pool.query(statement);
        console.log('Executed:', statement.split('\n')[0] + '...');
      } catch (err) {
        // If the error is about table already existing, we can ignore it
        if (!err.message.includes('already exists')) {
          throw err;
        }
        console.log('Table already exists, skipping...');
      }
    }

    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the initialization
initializeDatabase(); 