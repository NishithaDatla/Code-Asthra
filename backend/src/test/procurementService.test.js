import { supabase } from '../config/supabase.js';
import app from '../app.js';

let server;
const PORT = 5098;
const BASE_URL = `http://localhost:${PORT}`;

async function runProcurementTests() {
  console.log('Starting Phase 6A Procurement Workflow Test Suite...');

  server = app.listen(PORT);

  const timestamp = Date.now();
  const farmerA = {
    email: `p6a_farmer_a_${timestamp}@test.com`,
    password: 'Password123!',
    full_name: 'Phase 6A Farmer A',
    phone_number: `91${timestamp.toString().slice(-8)}`,
    district: 'Guntur',
    state: 'Andhra Pradesh'
  };

  const farmerB = {
    email: `p6a_farmer_b_${timestamp}@test.com`,
    password: 'Password123!',
    full_name: 'Phase 6A Farmer B',
    phone_number: `81${timestamp.toString().slice(-8)}`,
    district: 'Krishna',
    state: 'Andhra Pradesh'
  };

  const staffEmail = `p6a_staff_${timestamp}@test.com`;

  let tokenA, tokenB, staffToken;
  let authUserA, authUserB, staffAuth;
  let regDataA, regDataB, staffDbUser;
  let centreId, cropId, slotId, prIdA, bookingIdA, queueEntryIdA, procurementRecordIdA;

  try {
    // -------------------------------------------------------------
    // SETUP TEST ACCOUNTS & DATA
    // -------------------------------------------------------------
    console.log('\n--- 1. Setting up Test Accounts & Centres ---');

    // Register Farmer A
    const regResA = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(farmerA)
    });
    regDataA = await regResA.json();
    if (regResA.status !== 201) throw new Error(`Farmer A reg failed: ${JSON.stringify(regDataA)}`);

    // Register Farmer B
    const regResB = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(farmerB)
    });
    regDataB = await regResB.json();
    if (regResB.status !== 201) throw new Error(`Farmer B reg failed: ${JSON.stringify(regDataB)}`);

    // Login Farmer A
    const loginResA = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: farmerA.email, password: farmerA.password })
    });
    const loginDataA = await loginResA.json();
    tokenA = loginDataA.data.session.access_token;
    authUserA = loginDataA.data.user;

    // Login Farmer B
    const loginResB = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: farmerB.email, password: farmerB.password })
    });
    const loginDataB = await loginResB.json();
    tokenB = loginDataB.data.session.access_token;
    authUserB = loginDataB.data.user;

    const { data: crops } = await supabase.from('crops').select('id').eq('is_active', true).limit(1);
    if (!crops || crops.length === 0) throw new Error('No active crop found!');
    cropId = crops[0].id;

    // Find slot with available capacity
    const { data: slots } = await supabase
      .from('slots')
      .select('*')
      .eq('is_active', true);
      
    const availableSlot = (slots || []).find(
      (s) => Number(s.max_capacity_quintals) - Number(s.booked_capacity_quintals) >= 10.0 &&
             Number(s.max_farmers) - Number(s.booked_farmers) >= 1
    );

    if (!availableSlot) throw new Error('No active slot with available capacity found!');
    slotId = availableSlot.id;
    centreId = availableSlot.centre_id;

    // Create Centre Staff user in Auth & DB
    const { data: sAuth } = await supabase.auth.admin.createUser({
      email: staffEmail,
      password: 'Password123!',
      email_confirm: true
    });
    staffAuth = sAuth;

    const { data: sUser } = await supabase
      .from('users')
      .insert({
        auth_id: staffAuth.user.id,
        full_name: 'P6A Centre Staff',
        phone_number: `71${timestamp.toString().slice(-8)}`,
        email: staffEmail,
        role: 'CENTRE_STAFF'
      })
      .select()
      .single();
    staffDbUser = sUser;

    // Map Staff to Centre
    await supabase.from('centre_staff').insert({
      user_id: staffDbUser.id,
      centre_id: centreId,
      staff_role: 'OFFICER',
      is_active: true
    });

    // Login Staff
    const staffLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: staffEmail, password: 'Password123!' })
    });
    const staffLoginData = await staffLoginRes.json();
    staffToken = staffLoginData.data.session.access_token;

    // -------------------------------------------------------------
    // CREATE PROCUREMENT REQUEST & BOOKING FOR FARMER A
    // -------------------------------------------------------------
    console.log('\n--- 2. Creating Procurement Request & Booking ---');
    const prRes = await fetch(`${BASE_URL}/api/procurement-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        crop_id: cropId,
        estimated_quantity_quintals: 5.0
      })
    });
    const prData = await prRes.json();
    if (prRes.status !== 201) throw new Error(`PR creation failed: ${JSON.stringify(prData)}`);
    prIdA = prData.data.id;

    const bookingRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        procurement_request_id: prIdA,
        slot_id: slotId
      })
    });
    const bookingData = await bookingRes.json();
    if (bookingRes.status !== 201) throw new Error(`Booking creation failed: ${JSON.stringify(bookingData)}`);
    bookingIdA = bookingData.data.id;

    // -------------------------------------------------------------
    // CHECK-IN & ATOMIC PROCUREMENT RECORD CREATION TEST
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Atomic Check-In & Procurement Record Creation ---');
    const checkInRes = await fetch(`${BASE_URL}/api/queue/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({ bookingId: bookingIdA })
    });
    const checkInData = await checkInRes.json();
    console.log('Check-in status:', checkInRes.status, 'Token:', checkInData.data?.token_number);
    if (checkInRes.status !== 201) throw new Error(`Check-in failed: ${JSON.stringify(checkInData)}`);
    queueEntryIdA = checkInData.data.id;

    // Verify procurement_records record was created atomically during check-in
    const { data: pRec } = await supabase
      .from('procurement_records')
      .select('*')
      .eq('booking_id', bookingIdA)
      .single();

    console.log('Created Procurement Record ID:', pRec?.id, 'Status:', pRec?.status);
    if (!pRec || pRec.status !== 'CHECKED_IN') {
      throw new Error('Procurement record was not created atomically during check-in!');
    }
    procurementRecordIdA = pRec.id;

    // -------------------------------------------------------------
    // GET /api/procurement/:id TESTS & IDOR PROTECTION
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Procurement Lookup & IDOR Protection ---');
    // Farmer A lookup (Allowed)
    const getResA = await fetch(`${BASE_URL}/api/procurement/${procurementRecordIdA}`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const getDataA = await getResA.json();
    console.log('Farmer A GET Procurement status:', getResA.status);
    if (getResA.status !== 200 || getDataA.data?.id !== procurementRecordIdA) {
      throw new Error('Farmer A failed to retrieve procurement record!');
    }

    // Farmer B lookup on Farmer A record (IDOR Shield -> 404)
    const getResB = await fetch(`${BASE_URL}/api/procurement/${procurementRecordIdA}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    console.log('Farmer B GET Farmer A Procurement status:', getResB.status);
    if (getResB.status !== 404) throw new Error('Expected 404 when Farmer B tries to access Farmer A record!');

    // Staff lookup on Centre record (Allowed)
    const getResStaff = await fetch(`${BASE_URL}/api/procurement/${procurementRecordIdA}`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    console.log('Staff GET Procurement status:', getResStaff.status);
    if (getResStaff.status !== 200) throw new Error('Staff failed to retrieve centre procurement record!');

    // -------------------------------------------------------------
    // AUTHORIZATION & VALIDATION TESTS FOR MUTATIONS
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Mutation Authorization & Validation Shields ---');
    // Farmer attempting quality check (403 Forbidden)
    const farmerQualityRes = await fetch(`${BASE_URL}/api/procurement/${procurementRecordIdA}/quality`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        moisture_content_pct: 12.0,
        foreign_matter_pct: 1.0,
        damaged_grains_pct: 2.0
      })
    });
    console.log('Farmer quality check mutation status:', farmerQualityRes.status);
    if (farmerQualityRes.status !== 403) throw new Error('Expected 403 when Farmer attempts quality mutation!');

    // Invalid percentages validation test (> 100%)
    const invalidQualityRes = await fetch(`${BASE_URL}/api/procurement/${procurementRecordIdA}/quality`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({
        moisture_content_pct: 105.0,
        foreign_matter_pct: 1.0,
        damaged_grains_pct: 2.0
      })
    });
    console.log('Invalid percentage quality check status:', invalidQualityRes.status);
    if (invalidQualityRes.status !== 400) throw new Error('Expected 400 for invalid percentage value!');

    // -------------------------------------------------------------
    // QUALITY CHECK SUBMISSION (PASSED)
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing Quality Check Submission (PASSED) ---');
    const qualityPassRes = await fetch(`${BASE_URL}/api/procurement/${procurementRecordIdA}/quality`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({
        moisture_content_pct: 12.5,
        foreign_matter_pct: 1.5,
        damaged_grains_pct: 2.5,
        remarks: 'Sample meets MSP quality standards'
      })
    });
    const qualityPassData = await qualityPassRes.json();
    console.log('Quality Check PASS status:', qualityPassRes.status, 'Record Status:', qualityPassData.data?.procurement_record?.status);
    if (qualityPassRes.status !== 201 || qualityPassData.data?.procurement_record?.status !== 'WEIGHING') {
      throw new Error(`Quality check submission failed: ${JSON.stringify(qualityPassData)}`);
    }

    // -------------------------------------------------------------
    // WEIGHING SUBMISSION & CALCULATIONS
    // -------------------------------------------------------------
    console.log('\n--- 7. Testing Weighing Submission & Calculations ---');
    // Gross <= Tare rejection test
    const invalidWeighRes = await fetch(`${BASE_URL}/api/procurement/${procurementRecordIdA}/weigh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({
        gross_weight_quintals: 5.0,
        tare_weight_quintals: 10.0
      })
    });
    console.log('Invalid gross <= tare status:', invalidWeighRes.status);
    if (invalidWeighRes.status !== 400) throw new Error('Expected 400 for gross <= tare weight!');

    // Valid weighing submission: Gross 6.50, Tare 1.50 -> Net 5.00
    const weighRes = await fetch(`${BASE_URL}/api/procurement/${procurementRecordIdA}/weigh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({
        gross_weight_quintals: 6.50,
        tare_weight_quintals: 1.50
      })
    });
    const weighData = await weighRes.json();
    console.log('Weighing status:', weighRes.status, 'Net Weight:', weighData.data?.net_weight_quintals, 'Total Amount:', weighData.data?.total_amount);
    if (weighRes.status !== 200 || weighData.data?.status !== 'ACCEPTED' || Number(weighData.data?.net_weight_quintals) !== 5.0) {
      throw new Error(`Weighing submission failed: ${JSON.stringify(weighData)}`);
    }

    // -------------------------------------------------------------
    // ATOMIC PROCUREMENT COMPLETION & PAYMENT INITIALIZATION
    // -------------------------------------------------------------
    console.log('\n--- 8. Testing Atomic Procurement Completion & Payment Creation ---');
    const completeRes = await fetch(`${BASE_URL}/api/procurement/${procurementRecordIdA}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({ notes: 'Batch complete and verified.' })
    });
    const completeData = await completeRes.json();
    console.log('Complete Procurement status:', completeRes.status, 'Payment Ref:', completeData.data?.payment?.payment_reference);
    if (completeRes.status !== 200 || !completeData.data?.payment?.payment_reference) {
      throw new Error(`Procurement completion failed: ${JSON.stringify(completeData)}`);
    }

    // Verify database table synchronization
    const { data: verifyBooking } = await supabase.from('bookings').select('status').eq('id', bookingIdA).single();
    const { data: verifyPR } = await supabase.from('procurement_requests').select('status').eq('id', prIdA).single();
    const { data: verifyQueue } = await supabase.from('queue_entries').select('status').eq('id', queueEntryIdA).single();

    console.log('Synced Booking Status:', verifyBooking?.status);
    console.log('Synced PR Status:', verifyPR?.status);
    console.log('Synced Queue Status:', verifyQueue?.status);

    if (verifyBooking?.status !== 'COMPLETED' || verifyPR?.status !== 'COMPLETED' || verifyQueue?.status !== 'COMPLETED') {
      throw new Error('Associated entities were not synchronized to COMPLETED!');
    }

    // -------------------------------------------------------------
    // IDEMPOTENT RE-COMPLETION TEST
    // -------------------------------------------------------------
    console.log('\n--- 9. Testing Idempotent Completion ---');
    const reCompleteRes = await fetch(`${BASE_URL}/api/procurement/${procurementRecordIdA}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({ notes: 'Duplicate complete call' })
    });
    const reCompleteData = await reCompleteRes.json();
    console.log('Re-completion status:', reCompleteRes.status, 'Already Completed:', reCompleteData.data?.already_completed);
    if (reCompleteRes.status !== 200 || !reCompleteData.data?.already_completed) {
      throw new Error('Idempotent completion check failed!');
    }

    // Cleanup test data
    console.log('\n--- Cleaning up temporary test data ---');
    await supabase.from('payments').delete().eq('procurement_record_id', procurementRecordIdA);
    await supabase.from('quality_checks').delete().eq('procurement_record_id', procurementRecordIdA);
    await supabase.from('procurement_records').delete().eq('id', procurementRecordIdA);
    await supabase.from('queue_events').delete().eq('queue_entry_id', queueEntryIdA);
    await supabase.from('queue_entries').delete().eq('id', queueEntryIdA);
    await supabase.from('bookings').delete().eq('id', bookingIdA);
    await supabase.from('procurement_requests').delete().eq('id', prIdA);

    await supabase.from('farmers').delete().eq('user_id', regDataA.data.user.id);
    await supabase.from('users').delete().eq('id', regDataA.data.user.id);
    await supabase.auth.admin.deleteUser(authUserA.id);

    await supabase.from('farmers').delete().eq('user_id', regDataB.data.user.id);
    await supabase.from('users').delete().eq('id', regDataB.data.user.id);
    await supabase.auth.admin.deleteUser(loginDataB.data.user.auth_id || loginDataB.data.user.id);

    await supabase.from('centre_staff').delete().eq('user_id', staffDbUser.id);
    await supabase.from('users').delete().eq('id', staffDbUser.id);
    await supabase.auth.admin.deleteUser(staffAuth.user.id);

    console.log('\nALL 15 PHASE 6A TEST SCENARIOS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('\nTEST SUITE FAILED:', err);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
  }
}

runProcurementTests();
