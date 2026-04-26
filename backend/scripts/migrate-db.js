/**
 * One-shot DB migration: copies all data from SOURCE_DATABASE_URL → TARGET_DATABASE_URL
 * preserving primary keys (IDs) and resetting auto-increment sequences afterwards.
 *
 * Use case: moving from Render free PostgreSQL → Supabase.
 *
 * Usage (PowerShell):
 *   $env:SOURCE_DATABASE_URL="postgres://...render.com/..."
 *   $env:TARGET_DATABASE_URL="postgres://postgres.xxx:pwd@...supabase.com:5432/postgres"
 *   node scripts/migrate-db.js
 *
 * Pre-req:
 *   - On TARGET DB, run `npx prisma db push` first so all tables exist
 *   - TARGET DB should be EMPTY (no rows) — script will warn if not
 *
 * Safe to re-run: target DB is wiped (truncated) before each run.
 */

const { PrismaClient } = require('@prisma/client');

const SRC = process.env.SOURCE_DATABASE_URL;
const DST = process.env.TARGET_DATABASE_URL;

if (!SRC || !DST) {
  console.error('❌ Missing env vars.');
  console.error('   Set SOURCE_DATABASE_URL  (current Render DB)');
  console.error('   Set TARGET_DATABASE_URL  (new Supabase DB)');
  process.exit(1);
}
if (SRC === DST) {
  console.error('❌ SOURCE and TARGET point to the same database. Refusing to run.');
  process.exit(1);
}

const src = new PrismaClient({ datasources: { db: { url: SRC } } });
const dst = new PrismaClient({ datasources: { db: { url: DST } } });

// Insertion order matters because of foreign keys.
// Classroom → User → Student → PickupRequest → PickupHistory → Notification
const TABLES = [
  { name: 'Classroom',      model: 'classroom' },
  { name: 'User',           model: 'user' },
  { name: 'Student',        model: 'student' },
  { name: 'PickupRequest',  model: 'pickupRequest' },
  { name: 'PickupHistory',  model: 'pickupHistory' },
  { name: 'Notification',   model: 'notification' },
];

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🗄️  DB MIGRATION');
  console.log(`   SOURCE: ${SRC.replace(/:\/\/[^@]*@/, '://***@')}`);
  console.log(`   TARGET: ${DST.replace(/:\/\/[^@]*@/, '://***@')}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // 1. Sanity check — count rows in source
  console.log('\n📊 Source row counts:');
  const srcCounts = {};
  for (const t of TABLES) {
    srcCounts[t.name] = await src[t.model].count();
    console.log(`   ${t.name.padEnd(18)} ${srcCounts[t.name]} rows`);
  }
  const total = Object.values(srcCounts).reduce((a, b) => a + b, 0);
  if (total === 0) {
    console.error('\n❌ Source database is empty — nothing to copy. Aborting.');
    process.exit(1);
  }

  // 2. Warn about target rows
  console.log('\n📊 Target row counts (BEFORE):');
  for (const t of TABLES) {
    const c = await dst[t.model].count();
    console.log(`   ${t.name.padEnd(18)} ${c} rows ${c > 0 ? '⚠️  will be wiped' : ''}`);
  }

  // 3. Wipe target — reverse order (respect FKs)
  console.log('\n🧹 Wiping target...');
  for (const t of [...TABLES].reverse()) {
    const r = await dst[t.model].deleteMany();
    console.log(`   ${t.name.padEnd(18)} deleted ${r.count}`);
  }

  // 4. Copy in dependency order
  console.log('\n📥 Copying data...');
  for (const t of TABLES) {
    const rows = await src[t.model].findMany();
    if (rows.length === 0) {
      console.log(`   ${t.name.padEnd(18)} skip (empty)`);
      continue;
    }
    // createMany preserves provided IDs. skipDuplicates handles partial reruns.
    const r = await dst[t.model].createMany({ data: rows, skipDuplicates: true });
    console.log(`   ${t.name.padEnd(18)} inserted ${r.count} / ${rows.length}`);
  }

  // 5. Reset auto-increment sequences so the next INSERT doesn't collide.
  // PostgreSQL: setval('"Table_id_seq"', max(id))
  console.log('\n🔢 Resetting sequences...');
  for (const t of TABLES) {
    const max = await dst[t.model].aggregate({ _max: { id: true } });
    const maxId = max._max?.id || 0;
    if (maxId > 0) {
      const seqName = `"${t.name}_id_seq"`;
      try {
        await dst.$executeRawUnsafe(`SELECT setval('${seqName}', ${maxId}, true);`);
        console.log(`   ${t.name.padEnd(18)} seq → ${maxId}`);
      } catch (e) {
        console.warn(`   ${t.name.padEnd(18)} seq reset failed: ${e.message}`);
      }
    }
  }

  // 6. Verify counts
  console.log('\n✅ Target row counts (AFTER):');
  let allMatch = true;
  for (const t of TABLES) {
    const c = await dst[t.model].count();
    const match = c === srcCounts[t.name];
    if (!match) allMatch = false;
    console.log(`   ${t.name.padEnd(18)} ${c} rows ${match ? '✓' : `✗ expected ${srcCounts[t.name]}`}`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (allMatch) {
    console.log('✅ MIGRATION SUCCESSFUL — all row counts match.');
    console.log('   Next steps:');
    console.log('   1. Update DATABASE_URL on Render → point to Supabase URL');
    console.log('   2. Render redeploys automatically');
    console.log('   3. Test login on the website');
    console.log('   4. Once verified, you can delete the old Render DB');
  } else {
    console.error('❌ MIGRATION FAILED — row counts do not match. Investigate before switching.');
    process.exit(2);
  }
}

main()
  .catch((e) => {
    console.error('\n💥 Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await src.$disconnect();
    await dst.$disconnect();
  });
