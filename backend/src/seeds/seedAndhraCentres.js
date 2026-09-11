import { supabase } from '../config/supabase.js';

export const ANDHRA_PRADESH_CENTRES = [
  {
    centre_code: 'AP-GNT-01',
    name: 'Guntur APMC Agricultural Procurement Hub',
    address_line: 'APMC Market Yard, Collectorate Road, Guntur',
    district: 'Guntur',
    state: 'Andhra Pradesh',
    pincode: '522004',
    total_counters: 4,
    daily_capacity_quintals: 2500,
    status: 'OPEN',
    congestion_level: 'LOW'
  },
  {
    centre_code: 'AP-GNT-02',
    name: 'Tenali Grain & Paddy Procurement Yard',
    address_line: 'Station Road Market Yard, Tenali',
    district: 'Guntur',
    state: 'Andhra Pradesh',
    pincode: '522201',
    total_counters: 3,
    daily_capacity_quintals: 1500,
    status: 'OPEN',
    congestion_level: 'LOW'
  },
  {
    centre_code: 'AP-KRS-01',
    name: 'Vijayawada Rythu Procurement Centre',
    address_line: 'Bhavanipuram Commercial Market Yard, Vijayawada',
    district: 'Krishna',
    state: 'Andhra Pradesh',
    pincode: '520012',
    total_counters: 4,
    daily_capacity_quintals: 3000,
    status: 'OPEN',
    congestion_level: 'LOW'
  },
  {
    centre_code: 'AP-KRN-01',
    name: 'Adoni Cotton & Grain Procurement Yard',
    address_line: 'Industrial Estate Road, Adoni',
    district: 'Kurnool',
    state: 'Andhra Pradesh',
    pincode: '518301',
    total_counters: 3,
    daily_capacity_quintals: 2000,
    status: 'OPEN',
    congestion_level: 'LOW'
  },
  {
    centre_code: 'AP-WGD-01',
    name: 'Eluru Paddy Procurement Hub',
    address_line: 'NR Peta Main Market Yard, Eluru',
    district: 'West Godavari',
    state: 'Andhra Pradesh',
    pincode: '534006',
    total_counters: 3,
    daily_capacity_quintals: 1800,
    status: 'OPEN',
    congestion_level: 'LOW'
  },
  {
    centre_code: 'AP-PRK-01',
    name: 'Ongole Commercial Crops Yard',
    address_line: 'Kurnool Road Market Yard, Ongole',
    district: 'Prakasam',
    state: 'Andhra Pradesh',
    pincode: '523002',
    total_counters: 2,
    daily_capacity_quintals: 1200,
    status: 'OPEN',
    congestion_level: 'LOW'
  }
];

export async function seedAndhraCentres() {
  console.log('--- Starting Andhra Pradesh Procurement Centres Seeding ---');
  let insertedOrUpdatedCount = 0;

  for (const centreData of ANDHRA_PRADESH_CENTRES) {
    const { data: upsertedCentre, error: cErr } = await supabase
      .from('procurement_centres')
      .upsert(centreData, { onConflict: 'centre_code' })
      .select()
      .single();

    if (cErr) {
      console.error(`Failed to upsert centre ${centreData.centre_code}:`, cErr.message);
      continue;
    }

    insertedOrUpdatedCount++;
    console.log(`[SUCCESS] Centre ${upsertedCentre.centre_code} (${upsertedCentre.name}) upserted. ID: ${upsertedCentre.id}`);

    // Create counters for centre detail page compatibility
    const countersCount = upsertedCentre.total_counters || 2;
    for (let i = 1; i <= countersCount; i++) {
      const counterPayload = {
        centre_id: upsertedCentre.id,
        counter_number: i,
        counter_name: `Counter ${i} - Inspection & Weighbridge`,
        is_active: true
      };

      const { error: cntrErr } = await supabase
        .from('centre_counters')
        .upsert(counterPayload, { onConflict: 'centre_id,counter_number' });

      if (cntrErr) {
        console.warn(`Counter ${i} for centre ${upsertedCentre.centre_code} error:`, cntrErr.message);
      }
    }
  }

  console.log(`--- Completed Seeding: ${insertedOrUpdatedCount}/${ANDHRA_PRADESH_CENTRES.length} Andhra Pradesh Centres Upserted Successfully ---`);
  return insertedOrUpdatedCount;
}

// Allow direct execution from Node CLI
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('seedAndhraCentres.js')) {
  seedAndhraCentres()
    .then((count) => {
      console.log(`Done! ${count} AP centres seeded.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal seed error:', err);
      process.exit(1);
    });
}
