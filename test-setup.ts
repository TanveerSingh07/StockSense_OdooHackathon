import { PrismaClient } from './src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const warehouse = await prisma.warehouse.create({ data: { name: 'Main Test WH' } });
    const supplier = await prisma.supplier.create({ data: { name: 'Test Supplier LLC' } });
    
    console.log(`WH_ID=${warehouse.id}`);
    console.log(`SUP_ID=${supplier.id}`);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
