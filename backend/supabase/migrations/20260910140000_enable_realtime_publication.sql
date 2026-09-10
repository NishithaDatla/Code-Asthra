-- SIH 26032 Smart Procurement Flow Management System
-- Migration: 20260910140000_enable_realtime_publication.sql
-- Description: Add queue_entries and queue_events to Supabase Realtime publication

DO $$
BEGIN
  -- Ensure publication exists
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    -- Add queue_entries to supabase_realtime publication if not already present
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'queue_entries'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE queue_entries;
    END IF;

    -- Add queue_events to supabase_realtime publication if not already present
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'queue_events'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE queue_events;
    END IF;
  END IF;
END $$;
