
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS patient_email text;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS calendly_event_uri text;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS pending_reason text;
