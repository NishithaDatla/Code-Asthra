/**
 * Phase 6E — PRD Queue API Contract Test Suite
 *
 * Verifies all 5 required PRD Queue Endpoints:
 * 1. POST /api/queue/:bookingId/check-in
 * 2. GET /api/queue/:bookingId
 * 3. POST /api/queue/call-next
 * 4. POST /api/queue/:id/start
 * 5. POST /api/queue/:id/complete
 */

import assert from 'node:assert/strict';
import app from '../app.js';
import supabase from '../config/supabase.js';

let server;
let BASE_URL;

async function startServer() {
  return new Promise(resolve => {
    server = app.listen(0, () => {
      const port = server.address().port;
      BASE_URL = `http://localhost:${port}`;
      console.log(`[Queue PRD Test] Server listening on ${BASE_URL}`);
      resolve();
    });
  });
}

function stopServer() {
  if (server) server.close();
}

async function makeRequest(method, path, headers = {}, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const response = await fetch(`${BASE_URL}${path}`, options);
  const data = await response.json();
  return { status: response.status, data };
}

let passedCount = 0;
let failedCount = 0;

async function test(description, fn) {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${description}`);
    passedCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${description}`);
    console.error(`     ${err.message}`);
    failedCount++;
  }
}

async function runQueuePRDTests() {
  await startServer();

  console.log('==================================================');
  console.log('PHASE 6E — QUEUE API PRD CONTRACT TEST SUITE');
  console.log('==================================================\n');

  try {
    // -------------------------------------------------------------------------
    // SETUP TEST ACCOUNTS AND RECORD FIXTURES
    // -------------------------------------------------------------------------
    console.log('[1] Setting up Test Fixtures (Farmer A, Farmer B, Staff)...');

    const farmerAUser = `farmer-prd-a-${Date.now()}@example.com`;
    const farmerBUser = `farmer-prd-b-${Date.now()}@example.com`;
    const staffUser = `staff-prd-${Date.now()}@example.com`;

    // 1. Register Farmer A
    const phoneA = `900${Math.floor(1000000 + Math.random() * 9000000)}`;
    await makeRequest('POST', '/api/auth/register', {}, {
      full_name: 'Farmer PRD A',
      phone_number: phoneA,
      email: farmerAUser,
      password: 'Password123!'
    });

    const loginA = await makeRequest('POST', '/api/auth/login', {}, {
      email: farmerAUser,
      password: 'Password123!'
    });
    const farmerAToken = loginA.data?.data?.session?.access_token;
    const headerA = { Authorization: `Bearer ${farmerAToken}` };

    // 2. Register Farmer B
    const phoneB = `901${Math.floor(1000000 + Math.random() * 9000000)}`;
    await makeRequest('POST', '/api/auth/register', {}, {
      full_name: 'Farmer PRD B',
      phone_number: phoneB,
      email: farmerBUser,
      password: 'Password123!'
    });

    const loginB = await makeRequest('POST', '/api/auth/login', {}, {
      email: farmerBUser,
      password: 'Password123!'
    });
    const farmerBToken = loginB.data?.data?.session?.access_token;
    const headerB = { Authorization: `Bearer ${farmerBToken}` };

    // 3. Register Staff via Supabase Auth Admin & Users table
    const { data: sAuth } = await supabase.auth.admin.createUser({
      email: staffUser,
      password: 'Password123!',
      email_confirm: true
    });
    const phoneS = `902${Math.floor(1000000 + Math.random() * 9000000)}`;
    const { data: sUser } = await supabase.from('users').insert({
      auth_id: sAuth.user.id,
      full_name: 'Staff PRD',
      phone_number: phoneS,
      email: staffUser,
      role: 'CENTRE_STAFF'
    }).select().single();

    const loginS = await makeRequest('POST', '/api/auth/login', {}, {
      email: staffUser,
      password: 'Password123!'
    });
    const staffToken = loginS.data?.data?.session?.access_token;
    const headerStaff = { Authorization: `Bearer ${staffToken}` };

    // Create isolated OPEN procurement centre for this test run
    const ts = Date.now();
    const { data: openCentre } = await supabase
      .from('procurement_centres')
      .insert({
        centre_code: `C-PRD-${ts}`,
        name: `PRD Test Centre ${ts}`,
        address_line: `PRD Address ${ts}`,
        district: 'Test District',
        state: 'Test State',
        pincode: '500001',
        daily_capacity_quintals: 1000.0,
        total_counters: 2,
        status: 'OPEN'
      })
      .select()
      .single();

    assert.ok(openCentre, 'OPEN centre required for test');

    // Create counter for centre
    await supabase.from('centre_counters').insert({
      centre_id: openCentre.id,
      counter_number: 1,
      counter_name: 'Counter 1',
      is_active: true
    });

    await supabase.from('centre_staff').upsert({
      user_id: sUser.id,
      centre_id: openCentre.id,
      staff_role: 'OFFICER',
      is_active: true
    });

    // Create Crop
    const { data: crop } = await supabase
      .from('crops')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .single();

    assert.ok(crop, 'Active crop required for test');

    // Ensure Farmer profiles exist
    const { data: userA } = await supabase.from('users').select('id').eq('email', farmerAUser).single();
    let { data: farmerA } = await supabase.from('farmers').select('id').eq('user_id', userA.id).maybeSingle();
    if (!farmerA) {
      const { data: newFarmer } = await supabase.from('farmers').insert({
        user_id: userA.id,
        farmer_code: `F-PRD-A-${Date.now()}`
      }).select().single();
      farmerA = newFarmer;
    }

    const { data: userB } = await supabase.from('users').select('id').eq('email', farmerBUser).single();
    let { data: farmerB } = await supabase.from('farmers').select('id').eq('user_id', userB.id).maybeSingle();
    if (!farmerB) {
      const { data: newFarmer } = await supabase.from('farmers').insert({
        user_id: userB.id,
        farmer_code: `F-PRD-B-${Date.now()}`
      }).select().single();
      farmerB = newFarmer;
    }

    // Create Procurement Request for Farmer A
    const { data: procReqA } = await supabase.from('procurement_requests').insert({
      request_number: `PR-A-${Date.now()}`,
      farmer_id: farmerA.id,
      crop_id: crop.id,
      estimated_quantity_quintals: 50.0,
      status: 'APPROVED'
    }).select().single();
    const procReqAId = procReqA.id;

    // Create Procurement Request for Farmer B
    const { data: procReqB } = await supabase.from('procurement_requests').insert({
      request_number: `PR-B-${Date.now()}`,
      farmer_id: farmerB.id,
      crop_id: crop.id,
      estimated_quantity_quintals: 40.0,
      status: 'APPROVED'
    }).select().single();
    const procReqBId = procReqB.id;

    // Get Active Slot for centre
    const targetDate = new Date().toISOString().split('T')[0];
    let { data: slot } = await supabase
      .from('slots')
      .select('id')
      .eq('centre_id', openCentre.id)
      .eq('slot_date', targetDate)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!slot) {
      const { data: newSlot } = await supabase.from('slots').insert({
        centre_id: openCentre.id,
        slot_date: targetDate,
        start_time: '09:00:00',
        end_time: '11:00:00',
        max_capacity_quintals: 500.0,
        booked_capacity_quintals: 0.0,
        max_farmers: 50,
        booked_farmers: 0,
        is_active: true
      }).select().single();
      slot = newSlot;
    }

    assert.ok(slot, 'Active slot required for test');

    // Create Booking for Farmer A
    const { data: bkgA } = await supabase.from('bookings').insert({
      booking_reference: `BK-A-${Date.now()}`,
      farmer_id: farmerA.id,
      procurement_request_id: procReqAId,
      slot_id: slot.id,
      quantity_quintals: 50.0,
      status: 'CONFIRMED'
    }).select().single();
    const bookingAId = bkgA.id;

    // Create Booking for Farmer B
    const { data: bkgB } = await supabase.from('bookings').insert({
      booking_reference: `BK-B-${Date.now()}`,
      farmer_id: farmerB.id,
      procurement_request_id: procReqBId,
      slot_id: slot.id,
      quantity_quintals: 40.0,
      status: 'CONFIRMED'
    }).select().single();
    const bookingBId = bkgB.id;

    // -------------------------------------------------------------------------
    // TEST ENDPOINT 1: POST /api/queue/:bookingId/check-in
    // -------------------------------------------------------------------------
    console.log('\n[2] Testing PRD Endpoint 1: POST /api/queue/:bookingId/check-in');

    await test('Unauthenticated check-in is rejected with 401', async () => {
      const res = await makeRequest('POST', `/api/queue/${bookingAId}/check-in`);
      assert.equal(res.status, 401);
    });

    await test('Farmer B IDOR check: cannot check in Farmer A booking (403)', async () => {
      const res = await makeRequest('POST', `/api/queue/${bookingAId}/check-in`, headerB);
      assert.equal(res.status, 403);
    });

    await test('Invalid booking UUID format returns 400', async () => {
      const res = await makeRequest('POST', '/api/queue/invalid-uuid/check-in', headerA);
      assert.equal(res.status, 400);
    });

    let queueEntryA;
    await test('Farmer A checks in own booking via POST /api/queue/:bookingId/check-in (201)', async () => {
      const res = await makeRequest('POST', `/api/queue/${bookingAId}/check-in`, headerA);
      assert.equal(res.status, 201);
      assert.equal(res.data.success, true);
      assert.ok(res.data.data.id);
      assert.equal(res.data.data.status, 'WAITING');
      queueEntryA = res.data.data;
    });

    let queueEntryB;
    await test('Farmer B checks in own booking via POST /api/queue/:bookingId/check-in (201)', async () => {
      const res = await makeRequest('POST', `/api/queue/${bookingBId}/check-in`, headerB);
      assert.equal(res.status, 201);
      assert.equal(res.data.success, true);
      assert.ok(res.data.data.id);
      queueEntryB = res.data.data;
    });

    // -------------------------------------------------------------------------
    // TEST ENDPOINT 2: GET /api/queue/:bookingId
    // -------------------------------------------------------------------------
    console.log('\n[3] Testing PRD Endpoint 2: GET /api/queue/:bookingId');

    await test('Unauthenticated GET /api/queue/:bookingId returns 401', async () => {
      const res = await makeRequest('GET', `/api/queue/${bookingAId}`);
      assert.equal(res.status, 401);
    });

    await test('Farmer B IDOR check: cannot GET Farmer A queue details by bookingId (403)', async () => {
      const res = await makeRequest('GET', `/api/queue/${bookingAId}`, headerB);
      assert.equal(res.status, 403);
    });

    await test('Farmer A GETs own queue entry by bookingId via GET /api/queue/:bookingId (200)', async () => {
      const res = await makeRequest('GET', `/api/queue/${bookingAId}`, headerA);
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.id, queueEntryA.id);
      assert.equal(res.data.data.token_number, queueEntryA.token_number);
      assert.ok(res.data.data.position !== undefined);
      assert.ok(res.data.data.eta !== undefined);
    });

    await test('Nonexistent booking ID returns 404', async () => {
      const fakeUuid = 'a0000000-0000-0000-0000-000000000000';
      const res = await makeRequest('GET', `/api/queue/${fakeUuid}`, headerA);
      assert.equal(res.status, 404);
    });

    // -------------------------------------------------------------------------
    // TEST ENDPOINT 3: POST /api/queue/call-next
    // -------------------------------------------------------------------------
    console.log('\n[4] Testing PRD Endpoint 3: POST /api/queue/call-next');

    await test('Farmer cannot call next token (403)', async () => {
      const res = await makeRequest('POST', '/api/queue/call-next', headerA);
      assert.equal(res.status, 403);
    });

    await test('Staff calls next token via POST /api/queue/call-next (200 -> CALLED)', async () => {
      const res = await makeRequest('POST', '/api/queue/call-next', headerStaff);
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.status, 'CALLED');
      assert.equal(res.data.data.id, queueEntryA.id, 'First checked-in farmer called FIFO');
    });

    // -------------------------------------------------------------------------
    // TEST ENDPOINT 4: POST /api/queue/:id/start
    // -------------------------------------------------------------------------
    console.log('\n[5] Testing PRD Endpoint 4: POST /api/queue/:id/start');

    await test('Farmer cannot start queue service (403)', async () => {
      const res = await makeRequest('POST', `/api/queue/${queueEntryA.id}/start`, headerA);
      assert.equal(res.status, 403);
    });

    await test('Staff starts service via POST /api/queue/:id/start (200 -> IN_SERVICE)', async () => {
      const res = await makeRequest('POST', `/api/queue/${queueEntryA.id}/start`, headerStaff);
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.status, 'IN_SERVICE');
    });

    // -------------------------------------------------------------------------
    // TEST ENDPOINT 5: POST /api/queue/:id/complete
    // -------------------------------------------------------------------------
    console.log('\n[6] Testing PRD Endpoint 5: POST /api/queue/:id/complete');

    await test('Farmer cannot complete queue service (403)', async () => {
      const res = await makeRequest('POST', `/api/queue/${queueEntryA.id}/complete`, headerA);
      assert.equal(res.status, 403);
    });

    await test('Staff completes service via POST /api/queue/:id/complete (200 -> COMPLETED)', async () => {
      const res = await makeRequest('POST', `/api/queue/${queueEntryA.id}/complete`, headerStaff);
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.status, 'COMPLETED');
    });

  } finally {
    stopServer();
  }

  console.log('\n==================================================');
  console.log(`SUMMARY: ${passedCount} Passed, ${failedCount} Failed out of 13 PRD Queue Tests`);
  console.log('==================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runQueuePRDTests();
