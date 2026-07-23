import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { cnyOrders } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const orders = await db.select().from(cnyOrders).where(eq(cnyOrders.orderNumber, 'CNY450004'));
console.log(JSON.stringify(orders, null, 2));

await connection.end();
