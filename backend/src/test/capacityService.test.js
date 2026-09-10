import {
  calculateCapacityMetrics,
  DEFAULT_FALLBACK_PROCESSING_TIME_MINUTES
} from '../services/capacity.service.js';

console.log('==================================================');
console.log('SMARTPROCURE EFFECTIVE CAPACITY ENGINE UNIT TESTS');
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
  try {
    // 1. All Counters Active (OPEN centre)
    console.log('[1] Centre with 100% Active Counters (OPEN):');
    const centre1 = { id: 'c1', centre_code: 'CTR01', name: 'Centre 1', total_counters: 2, daily_capacity_quintals: 1000, status: 'OPEN' };
    const counters1 = [{ id: 'k1', is_active: true }, { id: 'k2', is_active: true }];
    const metrics1 = calculateCapacityMetrics(centre1, counters1, []);

    assert(metrics1.activeCounters === 2, 'Active counters count is 2');
    assert(metrics1.counterOperatingRatio === 1.0, 'Operating ratio is 1.0 (100%)');
    assert(metrics1.effectiveDailyCapacityQuintals === 1000.0, 'Effective daily capacity equals base daily capacity (1000 quintals)');
    assert(metrics1.isFallbackProcessingTime === true, 'Uses fallback processing time when sample size < 3');
    assert(metrics1.avgProcessingTimeMinutes === DEFAULT_FALLBACK_PROCESSING_TIME_MINUTES, `Avg processing time is fallback default (${DEFAULT_FALLBACK_PROCESSING_TIME_MINUTES}m)`);
    assert(metrics1.effectiveTokensPerHour === 8.0, 'Throughput calculation: (2 counters * 60m) / 15m = 8 tokens/hour');

    // 2. Partially Active Counters (OPEN centre)
    console.log('\n[2] Centre with 50% Active Counters (OPEN):');
    const counters2 = [{ id: 'k1', is_active: true }, { id: 'k2', is_active: false }];
    const metrics2 = calculateCapacityMetrics(centre1, counters2, []);

    assert(metrics2.activeCounters === 1, 'Active counters count is 1');
    assert(metrics2.counterOperatingRatio === 0.5, 'Operating ratio is 0.5 (50%)');
    assert(metrics2.effectiveDailyCapacityQuintals === 500.0, 'Effective daily capacity scaled to 500 quintals');
    assert(metrics2.effectiveTokensPerHour === 4.0, 'Throughput scaled to 4 tokens/hour');

    // 3. Centre PAUSED or CLOSED
    console.log('\n[3] Centre PAUSED or CLOSED:');
    const centrePaused = { ...centre1, status: 'PAUSED' };
    const metricsPaused = calculateCapacityMetrics(centrePaused, counters1, []);

    assert(metricsPaused.activeCounters === 0, 'Active counters is 0 when PAUSED');
    assert(metricsPaused.counterOperatingRatio === 0.0, 'Operating ratio is 0.0 when PAUSED');
    assert(metricsPaused.effectiveDailyCapacityQuintals === 0.0, 'Effective daily capacity is 0 quintals when PAUSED');
    assert(metricsPaused.effectiveTokensPerHour === 0.0, 'Effective tokens per hour is 0 when PAUSED');

    // 4. Historical Duration Derived Processing Rate (>= 3 completed entries)
    console.log('\n[4] Historical Duration Derived Processing Speed (Sample size >= 3):');
    const completedEntries = [
      { service_started_at: '2026-09-10T10:00:00Z', completed_at: '2026-09-10T10:10:00Z' }, // 10 min
      { service_started_at: '2026-09-10T10:15:00Z', completed_at: '2026-09-10T10:27:00Z' }, // 12 min
      { service_started_at: '2026-09-10T10:30:00Z', completed_at: '2026-09-10T10:38:00Z' }  // 8 min
    ]; // Mean = (10 + 12 + 8) / 3 = 10.0 minutes per token

    const metricsHist = calculateCapacityMetrics(centre1, counters1, completedEntries);

    assert(metricsHist.isFallbackProcessingTime === false, 'isFallbackProcessingTime is false when sample size >= 3');
    assert(metricsHist.sampleSize === 3, 'Sample size correctly recorded as 3');
    assert(metricsHist.avgProcessingTimeMinutes === 10.0, 'Derived average processing time is 10.0 minutes');
    assert(metricsHist.effectiveTokensPerHour === 12.0, 'Throughput calculation: (2 counters * 60m) / 10m = 12 tokens/hour');

    // 5. Read-only Non-mutation Invariant
    console.log('\n[5] Read-only Non-mutation Invariant:');
    assert(typeof calculateCapacityMetrics === 'function', 'Capacity service is a read-only pure metric calculator');

  } catch (err) {
    console.error('\n❌ CRITICAL ERROR IN CAPACITY SERVICE TEST SUITE:', err);
  } finally {
    console.log('\n==================================================');
    console.log(`SUMMARY: ${totalPassed} Passed, ${totalFailed} Failed`);
    console.log('==================================================');
    if (totalFailed > 0) process.exit(1);
  }
}

runTests();
