// Script to create admin user SQL query with hashed password
const bcrypt = require('../ptak-expo-backend/node_modules/bcryptjs');

const email = 'mariusz@oryginalni.studio';
const password = 'MySuPExpo2025!';
const firstName = 'Mariusz';
const lastName = 'Admin';
const role = 'admin';

// Hash password
bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
    return;
  }

  console.log('\n=== SQL Query to create admin user ===\n');
  console.log(`INSERT INTO users (first_name, last_name, email, password, role, created_at, updated_at)`);
  console.log(`VALUES ('${firstName}', '${lastName}', '${email}', '${hash}', '${role}', NOW(), NOW())`);
  console.log(`ON CONFLICT (email) DO UPDATE`);
  console.log(`SET password = '${hash}', role = '${role}', updated_at = NOW();`);
  console.log('\n=== End of SQL Query ===\n');
  console.log('Instructions:');
  console.log('1. Go to Railway dashboard');
  console.log('2. Open PostgreSQL database');
  console.log('3. Go to "Query" tab');
  console.log('4. Paste the SQL query above');
  console.log('5. Execute the query');
  console.log('\nUser credentials:');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Role: ${role}`);
});

