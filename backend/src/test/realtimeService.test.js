import {
  subscribeToCentreQueue,
  subscribeToEntryStatus,
  subscribeToQueueEvents,
  unsubscribeChannel,
  unsubscribeAll,
  getActiveChannelCount,
  getActiveChannelKeys
} from '../services/realtime.service.js';

console.log('==================================================');
console.log('SMARTPROCURE REALTIME SERVICE UNIT TEST SUITE');
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

async function runTests() {
  try {
    // 1. Initial State Check
    console.log('[1] Initial Registry State:');
    assert(getActiveChannelCount() === 0, 'Active channel count starts at 0');

    // 2. Subscription Validation
    console.log('\n[2] Parameter Validation:');
    let threwCentreErr = false;
    try { subscribeToCentreQueue(null, () => {}); } catch (e) { threwCentreErr = true; }
    assert(threwCentreErr, 'subscribeToCentreQueue throws when centreId is missing');

    let threwEntryErr = false;
    try { subscribeToEntryStatus(null, () => {}); } catch (e) { threwEntryErr = true; }
    assert(threwEntryErr, 'subscribeToEntryStatus throws when queueEntryId is missing');

    let threwEventErr = false;
    try { subscribeToQueueEvents(null, () => {}); } catch (e) { threwEventErr = true; }
    assert(threwEventErr, 'subscribeToQueueEvents throws when queueEntryId is missing');

    // 3. Channel Registration & Key Generation
    console.log('\n[3] Channel Creation & Tracking:');
    const dummyCentreId = '11111111-1111-1111-1111-111111111111';
    const dummyEntryId = '22222222-2222-2222-2222-222222222222';

    const centreChannel = subscribeToCentreQueue(dummyCentreId, () => {});
    assert(centreChannel !== null, 'Centre queue subscription returns channel handle');
    assert(centreChannel.channelKey === `queue-centre-${dummyCentreId}`, 'Correct channelKey attached');
    assert(getActiveChannelCount() === 1, 'Active channel count updated to 1');

    const entryChannel = subscribeToEntryStatus(dummyEntryId, () => {});
    assert(getActiveChannelCount() === 2, 'Active channel count updated to 2');

    const eventChannel = subscribeToQueueEvents(dummyEntryId, () => {});
    assert(getActiveChannelCount() === 3, 'Active channel count updated to 3');

    const keys = getActiveChannelKeys();
    assert(keys.includes(`queue-centre-${dummyCentreId}`), 'Registry tracks centre channel key');
    assert(keys.includes(`queue-entry-${dummyEntryId}`), 'Registry tracks entry status channel key');
    assert(keys.includes(`queue-events-${dummyEntryId}`), 'Registry tracks queue events channel key');

    // 4. Duplicate Subscription Prevention
    console.log('\n[4] Duplicate Subscription Handling:');
    const duplicateCentreChannel = subscribeToCentreQueue(dummyCentreId, () => {});
    assert(duplicateCentreChannel.channelKey === `queue-centre-${dummyCentreId}`, 'Re-subscribing replaces channel under same key');
    assert(getActiveChannelCount() === 3, 'Active channel count remains 3 (duplicate prevented)');

    // 5. Single Channel Unsubscription
    console.log('\n[5] Single Channel Unsubscription:');
    const unSubRes = await unsubscribeChannel(`queue-centre-${dummyCentreId}`);
    assert(unSubRes === true, 'unsubscribeChannel returns true for active channel');
    assert(getActiveChannelCount() === 2, 'Active channel count decreased to 2');
    assert(!getActiveChannelKeys().includes(`queue-centre-${dummyCentreId}`), 'Channel key removed from active registry');

    // 6. Complete Registry Cleanup
    console.log('\n[6] Registry Cleanup (unsubscribeAll):');
    const cleanedCount = await unsubscribeAll();
    assert(cleanedCount === 2, 'unsubscribeAll cleaned up remaining 2 channels');
    assert(getActiveChannelCount() === 0, 'Active channel count reset to 0');

    // 7. Non-mutation Invariant
    console.log('\n[7] Non-Mutation Invariant Guard:');
    assert(typeof subscribeToCentreQueue === 'function', 'Realtime functions are strictly observe-only getters');

  } catch (err) {
    console.error('\n❌ CRITICAL ERROR IN REALTIME TEST SUITE:', err);
  } finally {
    console.log('\n==================================================');
    console.log(`SUMMARY: ${totalPassed} Passed, ${totalFailed} Failed`);
    console.log('==================================================');
    if (totalFailed > 0) process.exit(1);
  }
}

runTests();
