import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

try {
  console.log('Starting status enum migration...');
  
  // Step 1: Add new enum values while keeping old ones
  console.log('Step 1: Adding new enum values...');
  await connection.query(`
    ALTER TABLE orders 
    MODIFY COLUMN status ENUM('pending', 'pending_confirmation', 'in_progress', 'completed', 'delivered') 
    NOT NULL DEFAULT 'pending_confirmation'
  `);
  
  await connection.query(`
    ALTER TABLE cnyOrders 
    MODIFY COLUMN status ENUM('pending', 'pending_confirmation', 'in_progress', 'completed', 'delivered') 
    NOT NULL DEFAULT 'pending_confirmation'
  `);
  
  // Step 2: Update existing data
  console.log('Step 2: Updating existing pending status to pending_confirmation...');
  await connection.query(`UPDATE orders SET status = 'pending_confirmation' WHERE status = 'pending'`);
  await connection.query(`UPDATE cnyOrders SET status = 'pending_confirmation' WHERE status = 'pending'`);
  
  console.log('Migration completed successfully!');
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
} finally {
  await connection.end();
}
