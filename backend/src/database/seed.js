// =============================================
// ParkEase - Seed Development Data
// =============================================
// Run with: npm run db:seed
// =============================================
const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

async function seedDatabase() {
  console.log('🌱 Seeding ParkEase database with sample data...\\n');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ── 1. Create sample users ──
    const user1Id = uuidv4();
    const user2Id = uuidv4();
    const user3Id = uuidv4();

    await client.query(`
      INSERT INTO users (id, firebase_uid, name, phone, email)
      VALUES 
        ($1, 'firebase_seed_user_001', 'Arjun Kumar', '+919876543210', 'arjun@example.com'),
        ($2, 'firebase_seed_user_002', 'Priya Sharma', '+919876543211', 'priya@example.com'),
        ($3, 'firebase_seed_user_003', 'Rahul Verma', '+919876543212', 'rahul@example.com')
      ON CONFLICT (firebase_uid) DO NOTHING
    `, [user1Id, user2Id, user3Id]);

    console.log('   ✅ Created 3 sample users');

    // ── 2. Create parking spaces ──
    const parking1Id = uuidv4();
    const parking2Id = uuidv4();
    const parking3Id = uuidv4();
    const parking4Id = uuidv4();

    await client.query(`
      INSERT INTO parking_spaces (id, owner_id, place_name, address, location, price_per_hour_car, price_per_hour_bike, price_per_hour_other, total_slots, description, is_active)
      VALUES
        ($1, $5, 'Anna Nagar Parking',
         '2nd Avenue, Anna Nagar, Chennai, Tamil Nadu 600040',
         ST_SetSRID(ST_MakePoint(80.2090, 13.0850), 4326)::geography,
         40.00, 20.00, 25.00, 5,
         'Spacious residential parking near Anna Nagar Tower. CCTV monitored. 24/7 access.', true),

        ($2, $5, 'T Nagar Market Parking',
         'Pondy Bazaar, T Nagar, Chennai, Tamil Nadu 600017',
         ST_SetSRID(ST_MakePoint(80.2339, 13.0418), 4326)::geography,
         60.00, 30.00, 40.00, 3,
         'Central market parking near Pondy Bazaar. Walking distance to shopping areas.', true),

        ($3, $6, 'Adyar Parking Hub',
         'Lattice Bridge Road, Adyar, Chennai, Tamil Nadu 600020',
         ST_SetSRID(ST_MakePoint(80.2565, 13.0067), 4326)::geography,
         35.00, 15.00, 20.00, 8,
         'Affordable parking near Adyar bus depot. Shaded parking available.', true),

        ($4, $6, 'Velachery Tech Park Parking',
         'Velachery Main Road, Velachery, Chennai, Tamil Nadu 600042',
         ST_SetSRID(ST_MakePoint(80.2181, 12.9815), 4326)::geography,
         50.00, 25.00, 35.00, 6,
         'Secure parking near IT corridor. Gated entry with security guard.', false)
    `, [parking1Id, parking2Id, parking3Id, parking4Id, user1Id, user2Id]);

    console.log('   ✅ Created 4 parking spaces (1 inactive for testing)');

    // ── 3. Create slots for each parking space ──
    const slotValues = [];
    const slotParams = [];
    let paramIdx = 1;

    const parkingSlots = [
      { parkingId: parking1Id, count: 5 },
      { parkingId: parking2Id, count: 3 },
      { parkingId: parking3Id, count: 8 },
      { parkingId: parking4Id, count: 6 },
    ];

    for (const ps of parkingSlots) {
      for (let i = 1; i <= ps.count; i++) {
        const slotId = uuidv4();
        slotValues.push(`($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2})`);
        slotParams.push(slotId, ps.parkingId, i);
        paramIdx += 3;
      }
    }

    await client.query(
      `INSERT INTO parking_slots (id, parking_id, slot_number) VALUES ${slotValues.join(', ')} ON CONFLICT DO NOTHING`,
      slotParams
    );

    console.log('   ✅ Created 22 parking slots across all spaces');

    await client.query('COMMIT');

    console.log('\\n🎉 Database seeded successfully!');
    console.log('   Users: arjun@example.com, priya@example.com, rahul@example.com');
    console.log('   Parking: Anna Nagar (5 slots), T Nagar (3 slots), Adyar (8 slots), Velachery (6 slots, inactive)');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\\n❌ Seeding failed:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

seedDatabase();
