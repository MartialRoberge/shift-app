import { pool } from './connection';
import bcrypt from 'bcrypt';

/**
 * Script de seed pour créer des utilisateurs de test
 */
async function seed() {
  try {
    console.log('🌱 Seeding database...');

    // Créer un worker de test
    const workerPassword = await bcrypt.hash('password123', 10);
    const workerResult = await pool.query(
      `INSERT INTO users (name, email, role, password_hash, xrpl_address)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, name, email, role`,
      ['Alice Worker', 'alice@test.com', 'worker', workerPassword, 'rWorkerTest123...']
    );
    const worker = workerResult.rows[0];
    console.log(`✅ Created worker: ${worker.name} (${worker.id})`);

    // Créer un employeur de test
    const employerPassword = await bcrypt.hash('password123', 10);
    const employerResult = await pool.query(
      `INSERT INTO users (name, email, role, password_hash, xrpl_address)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, name, email, role`,
      ['Bob Employer', 'bob@test.com', 'employer', employerPassword, 'rEmployerTest456...']
    );
    const employer = employerResult.rows[0];
    console.log(`✅ Created employer: ${employer.name} (${employer.id})`);

    // Créer un admin de test
    const adminPassword = await bcrypt.hash('password123', 10);
    const adminResult = await pool.query(
      `INSERT INTO users (name, email, role, password_hash, xrpl_address)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, name, email, role`,
      ['Admin User', 'admin@test.com', 'admin', adminPassword, 'rAdminTest789...']
    );
    const admin = adminResult.rows[0];
    console.log(`✅ Created admin: ${admin.name} (${admin.id})`);

    console.log('\n📋 Test users created:');
    console.log('Worker: alice@test.com / password123');
    console.log('Employer: bob@test.com / password123');
    console.log('Admin: admin@test.com / password123');
    console.log('\n✅ Seeding completed!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();

