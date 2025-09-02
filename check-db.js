import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function checkDatabase() {
  try {
    console.log('Checking database connection...');
    
    // Test connection
    const test = await sql`SELECT 1 as test`;
    console.log('Connection successful:', test);
    
    // List all tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('\nTables in database:');
    tables.forEach(table => console.log('-', table.table_name));
    
    if (tables.length === 0) {
      console.log('\n❌ No tables found in the database!');
      console.log('This appears to be an empty database.');
    }
    
  } catch (error) {
    console.error('Database error:', error);
  }
}

checkDatabase();