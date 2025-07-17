#!/usr/bin/env node

/**
 * Railway Database Sync Script
 * 
 * This script automatically synchronizes database changes from local to Railway.
 * Run this script after making any database schema changes locally.
 * 
 * Usage: node sync-railway-db.js
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 RAILWAY DATABASE SYNC SCRIPT');
console.log('================================');

async function getRailwayDatabaseUrl() {
  return new Promise((resolve, reject) => {
    const process = spawn('railway', ['run', '--service', 'Backend', 'env'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let error = '';

    process.stdout.on('data', (data) => {
      output += data.toString();
    });

    process.stderr.on('data', (data) => {
      error += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        const match = output.match(/DATABASE_PUBLIC_URL=([^\s]+)/);
        if (match) {
          resolve(match[1]);
        } else {
          reject(new Error('DATABASE_PUBLIC_URL not found in Railway environment'));
        }
      } else {
        reject(new Error(`Railway command failed: ${error}`));
      }
    });
  });
}

async function syncDatabase() {
  try {
    console.log('🔍 Step 1: Getting Railway database URL...');
    const railwayDbUrl = await getRailwayDatabaseUrl();
    console.log('✅ Railway database URL obtained');

    console.log('🔍 Step 2: Connecting to Railway database...');
    
    // Set environment variables for Railway database
    process.env.DATABASE_URL = railwayDbUrl;
    process.env.NODE_ENV = 'development'; // Use development mode to avoid SSL issues
    
    // Import and run database initialization
    const { initializeDatabase } = require('./src/config/database');
    
    console.log('🔍 Step 3: Initializing Railway database...');
    await initializeDatabase();
    
    console.log('✅ SUCCESS: Railway database synchronized!');
    console.log('📊 All tables and data have been updated on Railway');
    
  } catch (error) {
    console.error('❌ SYNC FAILED:', error.message);
    console.error('💡 Try running the script again or check Railway connection');
    process.exit(1);
  }
}

// Run the sync
syncDatabase(); 