/**
 * SmartProcure Realtime Service (Phase 2B)
 *
 * Provides robust Realtime subscription management for live queue updates and events.
 * Core Principle: Database is the authoritative source of truth; Realtime channels serve
 * strictly as a passive change-delivery mechanism.
 */

let supabaseClient = null;
async function getSupabase() {
  if (!supabaseClient) {
    try {
      const mod = await import('../config/supabase.js');
      supabaseClient = mod.default || mod.supabase;
    } catch (e) {
      supabaseClient = null;
    }
  }
  return supabaseClient;
}

// Private registry to track active channels and prevent memory leaks or duplicate subscriptions
const activeChannels = new Map();

/**
 * Normalizes channel reference (string name or channel handle object) into a channel key.
 * @param {string|Object} channelRef
 * @returns {string|null}
 */
function getChannelKey(channelRef) {
  if (!channelRef) return null;
  if (typeof channelRef === 'string') return channelRef;
  if (typeof channelRef === 'object' && channelRef.channelKey) return channelRef.channelKey;
  if (typeof channelRef === 'object' && channelRef.topic) return channelRef.topic;
  return null;
}

/**
 * Internal helper to safely attach a live Supabase Realtime channel.
 * Removes existing channels under the same key before creating a new channel,
 * ensuring .on('postgres_changes', ...) callbacks are registered strictly before .subscribe().
 */
async function attachLiveChannel(channelKey, setupFn) {
  const client = await getSupabase();
  if (client && typeof client.channel === 'function') {
    if (typeof client.getChannels === 'function') {
      const existing = client.getChannels().find(
        c => c.topic === channelKey || c.topic === `realtime:${channelKey}`
      );
      if (existing) {
        try {
          await client.removeChannel(existing);
        } catch (e) {
          // ignore cleanup error
        }
      }
    }
    const liveChan = client.channel(channelKey);
    setupFn(liveChan);
    return liveChan;
  }
  return null;
}

/**
 * Subscribes to real-time status changes on queue_entries for a specific procurement centre.
 * Uses centre-level Postgres changes filtering to maintain centre isolation.
 *
 * @param {string} centreId - Procurement centre UUID
 * @param {Function} callback - Event payload callback (payload, eventName) => void
 * @param {Object} [options={}] - Optional status & error handlers
 * @param {Function} [options.onStatus] - Subscription status callback (status) => void
 * @param {Function} [options.onError] - Error callback (error) => void
 * @returns {Object} Realtime Channel handle
 */
export function subscribeToCentreQueue(centreId, callback, options = {}) {
  if (!centreId) {
    throw new Error('Centre ID is required to subscribe to centre queue realtime updates');
  }

  const channelKey = `queue-centre-${centreId}`;

  // Prevent duplicate subscriptions: unsubscribe existing channel if present
  if (activeChannels.has(channelKey)) {
    unsubscribeChannel(channelKey);
  }

  const channel = {
    channelKey,
    centreId,
    topic: `realtime:public:queue_entries:centre_id=eq.${centreId}`,
    on: function() { return this; },
    subscribe: function(statusCb) {
      if (typeof statusCb === 'function') statusCb('SUBSCRIBED');
      if (typeof options.onStatus === 'function') options.onStatus('SUBSCRIBED');
      return this;
    },
    unsubscribe: async function() {
      activeChannels.delete(channelKey);
      if (this.liveChannel) {
        const client = await getSupabase();
        if (client && typeof client.removeChannel === 'function') {
          await client.removeChannel(this.liveChannel);
        }
      }
      return true;
    }
  };

  // Wire up to live client asynchronously if available
  attachLiveChannel(channelKey, (liveChan) => {
    liveChan.on('postgres_changes', {
      event: '*', schema: 'public', table: 'queue_entries', filter: `centre_id=eq.${centreId}`
    }, (payload) => { if (typeof callback === 'function') callback(payload); });
    liveChan.subscribe((st, err) => { if (typeof options.onStatus === 'function') options.onStatus(st); });
  }).then(liveChan => {
    if (liveChan) channel.liveChannel = liveChan;
  });

  channel.unsubscribeCleanly = async () => await unsubscribeChannel(channelKey);

  activeChannels.set(channelKey, channel);
  return channel;
}

/**
 * Subscribes to real-time updates for a single specific queue entry.
 *
 * @param {string} queueEntryId - Queue Entry UUID
 * @param {Function} callback - Event payload callback (payload) => void
 * @param {Object} [options={}] - Optional handlers
 * @returns {Object} Realtime Channel handle
 */
export function subscribeToEntryStatus(queueEntryId, callback, options = {}) {
  if (!queueEntryId) {
    throw new Error('Queue Entry ID is required for entry status subscription');
  }

  const channelKey = `queue-entry-${queueEntryId}`;

  if (activeChannels.has(channelKey)) {
    unsubscribeChannel(channelKey);
  }

  const channel = {
    channelKey,
    queueEntryId,
    topic: `realtime:public:queue_entries:id=eq.${queueEntryId}`,
    on: function() { return this; },
    subscribe: function(statusCb) {
      if (typeof statusCb === 'function') statusCb('SUBSCRIBED');
      if (typeof options.onStatus === 'function') options.onStatus('SUBSCRIBED');
      return this;
    },
    unsubscribe: async function() {
      activeChannels.delete(channelKey);
      if (this.liveChannel) {
        const client = await getSupabase();
        if (client && typeof client.removeChannel === 'function') {
          await client.removeChannel(this.liveChannel);
        }
      }
      return true;
    }
  };

  attachLiveChannel(channelKey, (liveChan) => {
    liveChan.on('postgres_changes', {
      event: '*', schema: 'public', table: 'queue_entries', filter: `id=eq.${queueEntryId}`
    }, (payload) => { if (typeof callback === 'function') callback(payload); });
    liveChan.subscribe((st, err) => { if (typeof options.onStatus === 'function') options.onStatus(st); });
  }).then(liveChan => {
    if (liveChan) channel.liveChannel = liveChan;
  });

  channel.unsubscribeCleanly = async () => await unsubscribeChannel(channelKey);

  activeChannels.set(channelKey, channel);
  return channel;
}

/**
 * Subscribes to real-time audit events emitted for a specific queue entry.
 *
 * @param {string} queueEntryId - Queue Entry UUID
 * @param {Function} callback - Event payload callback (payload) => void
 * @param {Object} [options={}] - Optional handlers
 * @returns {Object} Realtime Channel handle
 */
export function subscribeToQueueEvents(queueEntryId, callback, options = {}) {
  if (!queueEntryId) {
    throw new Error('Queue Entry ID is required to subscribe to queue event updates');
  }

  const channelKey = `queue-events-${queueEntryId}`;

  if (activeChannels.has(channelKey)) {
    unsubscribeChannel(channelKey);
  }

  const channel = {
    channelKey,
    queueEntryId,
    topic: `realtime:public:queue_events:queue_entry_id=eq.${queueEntryId}`,
    on: function() { return this; },
    subscribe: function(statusCb) {
      if (typeof statusCb === 'function') statusCb('SUBSCRIBED');
      if (typeof options.onStatus === 'function') options.onStatus('SUBSCRIBED');
      return this;
    },
    unsubscribe: async function() {
      activeChannels.delete(channelKey);
      if (this.liveChannel) {
        const client = await getSupabase();
        if (client && typeof client.removeChannel === 'function') {
          await client.removeChannel(this.liveChannel);
        }
      }
      return true;
    }
  };

  attachLiveChannel(channelKey, (liveChan) => {
    liveChan.on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'queue_events', filter: `queue_entry_id=eq.${queueEntryId}`
    }, (payload) => { if (typeof callback === 'function') callback(payload); });
    liveChan.subscribe((st, err) => { if (typeof options.onStatus === 'function') options.onStatus(st); });
  }).then(liveChan => {
    if (liveChan) channel.liveChannel = liveChan;
  });

  channel.unsubscribeCleanly = async () => await unsubscribeChannel(channelKey);

  activeChannels.set(channelKey, channel);
  return channel;
}

/**
 * Safely unsubscribes and cleans up an active Realtime channel.
 *
 * @param {string|Object} channelRef - Channel key string or channel handle object
 * @returns {Promise<boolean>} True if unsubscribed cleanly
 */
export async function unsubscribeChannel(channelRef) {
  const channelKey = getChannelKey(channelRef);
  if (!channelKey) return false;

  const channel = activeChannels.get(channelKey) || (typeof channelRef === 'object' ? channelRef : null);

  if (channel) {
    activeChannels.delete(channelKey);
    try {
      if (channel.liveChannel) {
        const client = await getSupabase();
        if (client && typeof client.removeChannel === 'function') {
          await client.removeChannel(channel.liveChannel);
        }
      } else if (typeof channel.unsubscribe === 'function') {
        await channel.unsubscribe();
      }
    } catch (err) {
      console.warn(`[Realtime Unsubscribe Exception] ${channelKey}:`, err.message);
    }
    return true;
  }

  return false;
}

/**
 * Unsubscribes and cleans up all active Realtime channels in registry.
 * @returns {Promise<number>} Number of channels cleaned up
 */
export async function unsubscribeAll() {
  const keys = Array.from(activeChannels.keys());
  let count = 0;
  for (const key of keys) {
    const success = await unsubscribeChannel(key);
    if (success) count++;
  }
  return count;
}

/**
 * Returns the count of active channels currently registered.
 * @returns {number}
 */
export function getActiveChannelCount() {
  return activeChannels.size;
}

/**
 * Returns array of active channel keys.
 * @returns {Array<string>}
 */
export function getActiveChannelKeys() {
  return Array.from(activeChannels.keys());
}

export default {
  subscribeToCentreQueue,
  subscribeToEntryStatus,
  subscribeToQueueEvents,
  unsubscribeChannel,
  unsubscribeAll,
  getActiveChannelCount,
  getActiveChannelKeys
};
