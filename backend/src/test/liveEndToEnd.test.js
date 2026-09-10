/**
 * SmartProcure Phase 2 Live End-to-End Integration Verification Suite (Phase 2F.2)
 *
 * Runs a complete, end-to-end operational flow against the live shared Supabase database
 * using isolated test records tagged with a unique test marker.
 *
 * Guarantees COMPLETE cleanup of all created test records in a finally block.
 */

import assert from 'node:assert/strict';
import { supabase, supabaseAnon } from '../config/supabase.js';
import app from '../app.js';

let passed = 0;
let failed = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${description}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

async function asyncTest(description, fn) {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${description}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

// Lightweight HTTP client for Express app testing
async function makeRequest(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const http = import('node:http');
    http.then(mod => {
      const server = mod.createServer(app);
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        const options = {
          hostname: '127.0.0.1',
          port,
          path,
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers
          }
        };

        const req = mod.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            server.close();
            try {
              const json = data ? JSON.parse(data) : {};
              resolve({ status: res.statusCode, body: json });
            } catch (e) {
              resolve({ status: res.statusCode, text: data });
            }
          });
        });

        req.on('error', (err) => {
          server.close();
          reject(err);
        });

        if (body) {
          req.write(JSON.stringify(body));
        }
        req.end();
      });
    });
  });
}

const TIMESTAMP = Date.now();
const TEST_MARKER = `TEST_E2E_${TIMESTAMP}`;
const TEST_EMAIL = `e2e_test_${TIMESTAMP}@smartprocure.test`;
const TEST_PASSWORD = `TestP@ssword_${TIMESTAMP}`;

console.log('==================================================');
console.log('SMARTPROCURE LIVE END-TO-END INTEGRATION SUITE');
console.log('==================================================\n');
console.log(`Test Marker: ${TEST_MARKER}`);

async function runLiveEndToEndTest() {
  let createdAuthUser = null;
  let createdUser = null;
  let createdFarmer = null;
  let createdCentre = null;
  let createdCounter = null;
  let createdCrop = null;
  let createdSlot = null;
  let createdRequest = null;
  let createdBooking = null;
  let createdQueueEntry = null;

  let accessToken = null;

  try {
    // -------------------------------------------------------------------------
    // STEP 1: AUTHENTICATE & PREPARE TEST DATA
    // -------------------------------------------------------------------------
    console.log('[1] Preparing Auth User & Test Dataset:');

    // 1. Create Auth User
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true
    });

    if (authErr || !authData.user) {
      throw new Error(`Failed to create test auth user: ${authErr?.message}`);
    }
    createdAuthUser = authData.user;

    // 2. Sign in with password to obtain real access_token
    const { data: signInData, error: signInErr } = await supabaseAnon.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (signInErr || !signInData.session) {
      throw new Error(`Failed to sign in test auth user: ${signInErr?.message}`);
    }
    accessToken = signInData.session.access_token;
    console.log('  ✅ Authenticated test user via project auth API');

    // 3. Create User Profile
    const { data: userProfile, error: userErr } = await supabase
      .from('users')
      .insert({
        id: createdAuthUser.id,
        auth_id: createdAuthUser.id,
        email: TEST_EMAIL,
        phone_number: `99${TIMESTAMP.toString().slice(-8)}`,
        full_name: `${TEST_MARKER} User`,
        role: 'FARMER'
      })
      .select()
      .single();

    if (userErr) throw new Error(`User profile insert failed: ${userErr.message}`);
    createdUser = userProfile;

    // 4. Create Farmer Profile
    const { data: farmer, error: farmerErr } = await supabase
      .from('farmers')
      .insert({
        user_id: createdUser.id,
        farmer_code: `F-${TIMESTAMP}`
      })
      .select()
      .single();

    if (farmerErr) throw new Error(`Farmer profile insert failed: ${farmerErr.message}`);
    createdFarmer = farmer;

    // 5. Create Procurement Centre
    const { data: centre, error: centreErr } = await supabase
      .from('procurement_centres')
      .insert({
        centre_code: `C-${TIMESTAMP}`,
        name: `${TEST_MARKER} Centre`,
        address_line: `${TEST_MARKER} Address`,
        district: 'Test District',
        state: 'Test State',
        pincode: '500001',
        daily_capacity_quintals: 1000.0,
        total_counters: 2,
        status: 'OPEN'
      })
      .select()
      .single();

    if (centreErr) throw new Error(`Procurement centre insert failed: ${centreErr.message}`);
    createdCentre = centre;

    // 6. Create Centre Counter
    const { data: counter, error: counterErr } = await supabase
      .from('centre_counters')
      .insert({
        centre_id: createdCentre.id,
        counter_number: 1,
        counter_name: 'Counter 1',
        is_active: true
      })
      .select()
      .single();

    if (counterErr) throw new Error(`Centre counter insert failed: ${counterErr.message}`);
    createdCounter = counter;

    // 7. Create Crop
    const { data: crop, error: cropErr } = await supabase
      .from('crops')
      .insert({
        crop_code: `CROP-${TIMESTAMP}`,
        name: `${TEST_MARKER} Paddy`,
        category: 'Grain',
        msp_per_quintal: 2200.0
      })
      .select()
      .single();

    if (cropErr) throw new Error(`Crop insert failed: ${cropErr.message}`);
    createdCrop = crop;

    // 8. Create Procurement Request
    const { data: request, error: reqErr } = await supabase
      .from('procurement_requests')
      .insert({
        request_number: `PR-${TIMESTAMP}`,
        farmer_id: createdFarmer.id,
        crop_id: createdCrop.id,
        estimated_quantity_quintals: 50.0,
        status: 'APPROVED'
      })
      .select()
      .single();

    if (reqErr) throw new Error(`Procurement request insert failed: ${reqErr.message}`);
    createdRequest = request;

    // 9. Create Slot
    const targetDate = new Date().toISOString().split('T')[0];
    const { data: slot, error: slotErr } = await supabase
      .from('slots')
      .insert({
        centre_id: createdCentre.id,
        slot_date: targetDate,
        start_time: '09:00:00',
        end_time: '11:00:00',
        max_capacity_quintals: 500.0,
        booked_capacity_quintals: 50.0,
        max_farmers: 20,
        booked_farmers: 1,
        is_active: true
      })
      .select()
      .single();

    if (slotErr) throw new Error(`Slot insert failed: ${slotErr.message}`);
    createdSlot = slot;

    // 10. Create Booking (CONFIRMED status)
    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .insert({
        booking_reference: `BK-${TIMESTAMP}`,
        farmer_id: createdFarmer.id,
        procurement_request_id: createdRequest.id,
        slot_id: createdSlot.id,
        quantity_quintals: 50.0,
        status: 'CONFIRMED'
      })
      .select()
      .single();

    if (bookingErr) throw new Error(`Booking insert failed: ${bookingErr.message}`);
    createdBooking = booking;

    console.log('  ✅ Isolated test dataset created successfully');

    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // -------------------------------------------------------------------------
    // STEP 2: POST /api/queue/check-in
    // -------------------------------------------------------------------------
    console.log('\n[2] Testing POST /api/queue/check-in:');
    await asyncTest('POST /api/queue/check-in atomically checks in booking and creates queue entry', async () => {
      const res = await makeRequest('POST', '/api/queue/check-in', authHeader, {
        bookingId: createdBooking.id,
        centreId: createdCentre.id
      });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.id);
      assert.equal(res.body.data.status, 'WAITING');

      createdQueueEntry = res.body.data;

      // Verify DB mutations (Booking -> CHECKED_IN)
      const { data: updatedBk } = await supabase.from('bookings').select('status').eq('id', createdBooking.id).single();
      assert.equal(updatedBk.status, 'CHECKED_IN');

      // Verify TOKEN_ISSUED event in queue_events
      const { data: events } = await supabase.from('queue_events').select('event_type').eq('queue_entry_id', createdQueueEntry.id);
      assert.ok(events.some(e => e.event_type === 'TOKEN_ISSUED'));
    });

    // -------------------------------------------------------------------------
    // STEP 3: GET /api/queue/:id/position & GET /api/queue/:id/eta
    // -------------------------------------------------------------------------
    console.log('\n[3] Testing GET queue position & ETA:');
    await asyncTest('GET /api/queue/:id/position returns dynamic position = 1', async () => {
      const res = await makeRequest('GET', `/api/queue/${createdQueueEntry.id}/position`, authHeader);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.position, 1);
    });

    await asyncTest('GET /api/queue/:id/eta returns valid ETA calculation', async () => {
      const res = await makeRequest('GET', `/api/queue/${createdQueueEntry.id}/eta`, authHeader);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.estimatedWaitTimeMinutes, 0); // Next in line
    });

    // -------------------------------------------------------------------------
    // STEP 4: PATCH /api/queue/:id/status (WAITING -> CALLED)
    // -------------------------------------------------------------------------
    console.log('\n[4] Testing PATCH /api/queue/:id/status (WAITING -> CALLED):');
    await asyncTest('PATCH status WAITING -> CALLED updates status and logs CALLED event', async () => {
      const res = await makeRequest('PATCH', `/api/queue/${createdQueueEntry.id}/status`, authHeader, {
        status: 'CALLED',
        counterId: createdCounter.id
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.status, 'CALLED');

      // Verify CALLED event in DB
      const { data: events } = await supabase.from('queue_events').select('event_type').eq('queue_entry_id', createdQueueEntry.id);
      assert.ok(events.some(e => e.event_type === 'CALLED'));
    });

    // -------------------------------------------------------------------------
    // STEP 5: PATCH /api/queue/:id/status (CALLED -> IN_SERVICE)
    // -------------------------------------------------------------------------
    console.log('\n[5] Testing PATCH /api/queue/:id/status (CALLED -> IN_SERVICE):');
    await asyncTest('PATCH status CALLED -> IN_SERVICE updates status and logs SERVICE_STARTED event', async () => {
      const res = await makeRequest('PATCH', `/api/queue/${createdQueueEntry.id}/status`, authHeader, {
        status: 'IN_SERVICE'
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.status, 'IN_SERVICE');

      // Verify SERVICE_STARTED event in DB
      const { data: events } = await supabase.from('queue_events').select('event_type').eq('queue_entry_id', createdQueueEntry.id);
      assert.ok(events.some(e => e.event_type === 'SERVICE_STARTED'));
    });

    // -------------------------------------------------------------------------
    // STEP 6: GET CENTRE METRICS & ANALYTICS ENDPOINTS
    // -------------------------------------------------------------------------
    console.log('\n[6] Testing Read-Only Centre Metrics & Analytics Endpoints:');
    await asyncTest('GET /api/centres/:id/capacity returns effective capacity metrics', async () => {
      const res = await makeRequest('GET', `/api/centres/${createdCentre.id}/capacity`, authHeader);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.activeCounters, 1);
    });

    await asyncTest('GET /api/centres/:id/congestion returns real-time congestion metrics', async () => {
      const res = await makeRequest('GET', `/api/centres/${createdCentre.id}/congestion`, authHeader);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(typeof res.body.data.congestionScore === 'number');
    });

    await asyncTest('GET /api/centres/:id/bottlenecks returns bottleneck analysis', async () => {
      const res = await makeRequest('GET', `/api/centres/${createdCentre.id}/bottlenecks`, authHeader);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(typeof res.body.data.bottlenecksFound === 'boolean');
    });

    await asyncTest('GET /api/centres/:id/workload returns workload analysis', async () => {
      const res = await makeRequest('GET', `/api/centres/${createdCentre.id}/workload`, authHeader);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.scheduledWorkload);
    });

    await asyncTest('GET /api/centres/:id/disruptions returns disruption report', async () => {
      const res = await makeRequest('GET', `/api/centres/${createdCentre.id}/disruptions`, authHeader);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(typeof res.body.data.disruptionsFound === 'boolean');
    });

    await asyncTest('GET /api/centres/:id/analytics returns 5-section operational analytics', async () => {
      const res = await makeRequest('GET', `/api/centres/${createdCentre.id}/analytics`, authHeader);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.queueSummary);
      assert.ok(res.body.data.capacitySummary);
      assert.ok(res.body.data.performanceSummary);
      assert.ok(res.body.data.demandWorkloadSummary);
      assert.ok(res.body.data.congestionDisruptionSummary);
    });

    // -------------------------------------------------------------------------
    // STEP 7: POST /api/notifications/trigger
    // -------------------------------------------------------------------------
    console.log('\n[7] Testing Notification Triggering:');
    await asyncTest('POST /api/notifications/trigger inserts notification record for user', async () => {
      const res = await makeRequest('POST', '/api/notifications/trigger', authHeader, {
        eventType: 'QUEUE_CALLED',
        context: {
          tokenNumber: createdQueueEntry.token_number,
          counterNumber: 'Counter 1'
        }
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.triggered, true);

      // Verify DB record in notifications table
      const { data: notifs } = await supabase.from('notifications').select('*').eq('user_id', createdUser.id);
      assert.ok(notifs && notifs.length > 0);
      assert.ok(notifs.some(n => n.type === 'QUEUE_CALLED'));
    });

    // -------------------------------------------------------------------------
    // STEP 8: PATCH /api/queue/:id/status (IN_SERVICE -> COMPLETED)
    // -------------------------------------------------------------------------
    console.log('\n[8] Testing PATCH /api/queue/:id/status (IN_SERVICE -> COMPLETED):');
    await asyncTest('PATCH status IN_SERVICE -> COMPLETED updates queue & booking to COMPLETED', async () => {
      const res = await makeRequest('PATCH', `/api/queue/${createdQueueEntry.id}/status`, authHeader, {
        status: 'COMPLETED'
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.status, 'COMPLETED');

      // Verify DB mutations (Booking -> COMPLETED)
      const { data: finalBk } = await supabase.from('bookings').select('status').eq('id', createdBooking.id).single();
      assert.equal(finalBk.status, 'COMPLETED');

      // Verify SERVICE_COMPLETED event in queue_events
      const { data: events } = await supabase.from('queue_events').select('event_type').eq('queue_entry_id', createdQueueEntry.id);
      assert.ok(events.some(e => e.event_type === 'SERVICE_COMPLETED'));
    });

    // -------------------------------------------------------------------------
    // STEP 9: INVALID TRANSITION & DUPLICATE CHECK-IN REJECTION
    // -------------------------------------------------------------------------
    console.log('\n[9] Testing Invalid Transitions & Duplicate Rejection:');
    await asyncTest('Rejects invalid transition COMPLETED -> CALLED (returns HTTP 400)', async () => {
      const res = await makeRequest('PATCH', `/api/queue/${createdQueueEntry.id}/status`, authHeader, {
        status: 'CALLED',
        counterId: createdCounter.id
      });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.ok(res.body.message.includes('Invalid queue status transition'));
    });

    await asyncTest('Rejects duplicate check-in for completed booking (returns HTTP 400)', async () => {
      const res = await makeRequest('POST', '/api/queue/check-in', authHeader, {
        bookingId: createdBooking.id,
        centreId: createdCentre.id
      });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.ok(res.body.message.includes('CONFIRMED'));
    });

  } finally {
    // -------------------------------------------------------------------------
    // SAFE CLEANUP OF ALL TEST RECORDS IN REVERSE DEPENDENCY ORDER
    // -------------------------------------------------------------------------
    console.log('\n==================================================');
    console.log('SAFE CLEANUP OF TEST RECORDS');
    console.log('==================================================');

    try {
      if (createdUser?.id) {
        await supabase.from('notifications').delete().eq('user_id', createdUser.id);
      }
      if (createdQueueEntry?.id) {
        await supabase.from('queue_events').delete().eq('queue_entry_id', createdQueueEntry.id);
        await supabase.from('queue_entries').delete().eq('id', createdQueueEntry.id);
      }
      if (createdBooking?.id) {
        await supabase.from('bookings').delete().eq('id', createdBooking.id);
      }
      if (createdSlot?.id) {
        await supabase.from('slots').delete().eq('id', createdSlot.id);
      }
      if (createdRequest?.id) {
        await supabase.from('procurement_requests').delete().eq('id', createdRequest.id);
      }
      if (createdCrop?.id) {
        await supabase.from('crops').delete().eq('id', createdCrop.id);
      }
      if (createdCounter?.id) {
        await supabase.from('centre_counters').delete().eq('id', createdCounter.id);
      }
      if (createdCentre?.id) {
        await supabase.from('procurement_centres').delete().eq('id', createdCentre.id);
      }
      if (createdFarmer?.id) {
        await supabase.from('farmers').delete().eq('id', createdFarmer.id);
      }
      if (createdUser?.id) {
        await supabase.from('users').delete().eq('id', createdUser.id);
      }
      if (createdAuthUser?.id) {
        await supabase.auth.admin.deleteUser(createdAuthUser.id);
      }
      console.log('  ✅ ALL isolated test records cleaned up successfully.');
    } catch (cleanupErr) {
      console.error('  ❌ Cleanup Error:', cleanupErr.message);
    }
  }

  console.log('\n==================================================');
  console.log(`SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('==================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runLiveEndToEndTest();
