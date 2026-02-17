const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function inspect() {
  console.log('Using config:', {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    db: process.env.DB_NAME
  });

  try {
    await client.connect();
    console.log(`\n✅ Connected to database: ${process.env.DB_NAME}`);

    // List tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log(`\nFound ${res.rows.length} tables.`);

    if (res.rows.length === 0) {
      console.log('No tables found.');
    }

    for (const row of res.rows) {
      const tableName = row.table_name;
      console.log(`\n---------------------------------------------------`);
      console.log(`📌 TABLE: ${tableName}`);
      
      try {
        // Get Row Count
        const countRes = await client.query(`SELECT COUNT(*) FROM "${tableName}"`);
        const count = parseInt(countRes.rows[0].count, 10);
        console.log(`   Rows: ${count}`);

        if (count > 0) {
          // Get Sample Data (up to 5 rows)
          const dataRes = await client.query(`SELECT * FROM "${tableName}" ORDER BY 1 DESC LIMIT 5`);
          console.table(dataRes.rows);
        } else {
          console.log('   (Empty)');
        }
      } catch (tableErr) {
        console.error(`   Error reading table ${tableName}:`, tableErr.message);
      }
    }
    console.log(`\n---------------------------------------------------`);

  } catch (err) {
    console.error('❌ Error inspecting database:', err);
  } finally {
    await client.end();
  }
}

inspect();
