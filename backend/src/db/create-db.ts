/**
 * Script pour créer la base de données si elle n'existe pas
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function createDatabase() {
  // Se connecter à la base de données par défaut
  const defaultDbUrl = process.env.DATABASE_URL?.replace(/\/[^/]+$/, '/postgres') || 'postgresql://postgres:postgres@localhost:5432/postgres';
  
  console.log('🔍 Tentative de connexion à PostgreSQL...');
  
  const pool = new Pool({
    connectionString: defaultDbUrl,
  });

  try {
    // Tester la connexion
    await pool.query('SELECT 1');
    console.log('✅ Connexion à PostgreSQL réussie');

    // Extraire le nom de la base de données depuis DATABASE_URL
    const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/hackathon_xrp';
    const dbName = dbUrl.split('/').pop()?.split('?')[0] || 'hackathon_xrp';

    // Vérifier si la base existe
    const result = await pool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );

    if (result.rows.length === 0) {
      console.log(`📦 Création de la base de données "${dbName}"...`);
      await pool.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Base de données "${dbName}" créée avec succès !`);
    } else {
      console.log(`✅ La base de données "${dbName}" existe déjà`);
    }

    await pool.end();
    return true;
  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 PostgreSQL n\'est pas accessible.');
      console.error('   Solutions:');
      console.error('   1. Démarrer Docker Desktop et exécuter: docker-compose up -d postgres');
      console.error('   2. Installer PostgreSQL localement');
      console.error('   3. Utiliser une base de données cloud (Supabase, etc.)');
    } else if (error.code === '28000' || error.message.includes('role')) {
      console.error('\n💡 Problème d\'authentification PostgreSQL.');
      console.error('   Vérifiez votre DATABASE_URL dans .env');
      console.error('   Format attendu: postgresql://user:password@localhost:5432/dbname');
    }
    
    await pool.end();
    return false;
  }
}

createDatabase().then(success => {
  process.exit(success ? 0 : 1);
});

