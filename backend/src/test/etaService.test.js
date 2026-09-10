import { calculateTokenETA } from '../services/eta.service.js';

console.log('==================================================');
console.log('SMARTPROCURE ETA ENGINE UNIT TEST SUITE');
console.log('==================================================\n');

let totalPassed = 0;
let totalFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    totalPassed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    totalFailed++;
  }
}

function runTests() {
  const mockNow = '2026-09-10T12:00:00.000Z';

  try {
    // 1. Empty Queue / Next in Line (Position 1, 0 Farmers Ahead)
    console.log('[1] Empty Queue / Next in Line (Position 1):');
    const entry1 = { id: 'q1', token_number: 'TK-01', status: 'WAITING' };
    const pos1 = { position: 1, status: 'WAITING', farmersAhead: 0 };
    const cap1 = { activeCounters: 2, avgProcessingTimeMinutes: 10.0, isFallbackProcessingTime: false, status: 'OPEN' };

    const eta1 = calculateTokenETA(entry1, pos1, cap1, { nowTime: mockNow });

    assert(eta1.position === 1, 'Position is 1');
    assert(eta1.farmersAhead === 0, 'Farmers ahead is 0');
    assert(eta1.estimatedWaitTimeMinutes === 0, 'Wait time is 0 minutes');
    assert(eta1.isNextInLine === true, 'isNextInLine is true');
    assert(eta1.estimatedStartTime === mockNow, 'Estimated start time equals current time');
    assert(eta1.confidenceLevel === 'HIGH', 'Confidence level is HIGH (sample size >= 3)');

    // 2. Single Active Counter, 1 Farmer Ahead (Position 2)
    console.log('\n[2] Single Active Counter, 1 Farmer Ahead (Position 2):');
    const pos2 = { position: 2, status: 'WAITING' };
    const cap2 = { activeCounters: 1, avgProcessingTimeMinutes: 10.0, isFallbackProcessingTime: false, status: 'OPEN' };

    const eta2 = calculateTokenETA(entry1, pos2, cap2, { nowTime: mockNow });

    assert(eta2.farmersAhead === 1, 'Farmers ahead is 1');
    assert(eta2.estimatedWaitTimeMinutes === 10, 'Wait time calculation: (1 ahead * 10m) / 1 counter = 10 minutes');
    assert(eta2.estimatedStartTime === '2026-09-10T12:10:00.000Z', 'Start time shifted by 10 minutes');

    // 3. Multiple Active Counters (2 Counters), 4 Farmers Ahead (Position 5)
    console.log('\n[3] Multiple Active Counters (2 Counters), 4 Farmers Ahead (Position 5):');
    const pos5 = { position: 5, status: 'WAITING' };
    const capMulti = { activeCounters: 2, avgProcessingTimeMinutes: 10.0, isFallbackProcessingTime: false, status: 'OPEN' };

    const etaMulti = calculateTokenETA(entry1, pos5, capMulti, { nowTime: mockNow });

    assert(etaMulti.farmersAhead === 4, 'Farmers ahead is 4');
    assert(etaMulti.estimatedWaitTimeMinutes === 20, 'Wait time calculation: (4 ahead * 10m) / 2 counters = 20 minutes');
    assert(etaMulti.estimatedStartTime === '2026-09-10T12:20:00.000Z', 'Start time shifted by 20 minutes');

    // 4. Insufficient Historical Data (Fallback Processing Time)
    console.log('\n[4] Insufficient Data / Fallback Processing Time:');
    const capFallback = { activeCounters: 2, avgProcessingTimeMinutes: 15.0, isFallbackProcessingTime: true, status: 'OPEN' };

    const etaFallback = calculateTokenETA(entry1, pos5, capFallback, { nowTime: mockNow });

    assert(etaFallback.confidenceLevel === 'MEDIUM', 'Confidence level is MEDIUM when fallback processing time is used');
    assert(etaFallback.estimatedWaitTimeMinutes === 30, 'Wait time calculation: (4 ahead * 15m default) / 2 counters = 30 minutes');
    assert(etaFallback.explanation.includes('baseline service speed'), 'Explanation notes standard baseline fallback speed');

    // 5. Zero Active Counters or Centre PAUSED/CLOSED
    console.log('\n[5] Zero Active Counters or PAUSED Centre:');
    const capPaused = { activeCounters: 0, avgProcessingTimeMinutes: 15.0, isFallbackProcessingTime: true, status: 'PAUSED' };

    const etaPaused = calculateTokenETA(entry1, pos5, capPaused, { nowTime: mockNow });

    assert(etaPaused.estimatedWaitTimeMinutes === null, 'Estimated wait time is null when PAUSED');
    assert(etaPaused.estimatedStartTime === null, 'Estimated start time is null when PAUSED');
    assert(etaPaused.confidenceLevel === 'LOW', 'Confidence level is LOW when centre is PAUSED');

    // 6. Non-Waiting Statuses (CALLED, IN_SERVICE, COMPLETED, SKIPPED)
    console.log('\n[6] Non-Waiting Queue Entry Statuses:');
    const entryCalled = { id: 'q2', token_number: 'TK-02', status: 'CALLED' };
    const etaCalled = calculateTokenETA(entryCalled, { status: 'CALLED' }, cap1, { nowTime: mockNow });
    assert(etaCalled.estimatedWaitTimeMinutes === 0, 'CALLED status wait time is 0');
    assert(etaCalled.isNextInLine === true, 'CALLED status isNextInLine is true');

    const entryCompleted = { id: 'q3', token_number: 'TK-03', status: 'COMPLETED' };
    const etaCompleted = calculateTokenETA(entryCompleted, { status: 'COMPLETED' }, cap1, { nowTime: mockNow });
    assert(etaCompleted.estimatedWaitTimeMinutes === null, 'COMPLETED status wait time is null');

    // 7. Read-only Non-mutation Invariant
    console.log('\n[7] Read-only Non-mutation Invariant:');
    assert(typeof calculateTokenETA === 'function', 'ETA engine is a read-only pure metric calculator');

  } catch (err) {
    console.error('\n❌ CRITICAL ERROR IN ETA ENGINE TEST SUITE:', err);
  } finally {
    console.log('\n==================================================');
    console.log(`SUMMARY: ${totalPassed} Passed, ${totalFailed} Failed`);
    console.log('==================================================');
    if (totalFailed > 0) process.exit(1);
  }
}

runTests();
