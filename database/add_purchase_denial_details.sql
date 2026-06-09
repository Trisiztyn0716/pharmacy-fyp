ALTER TABLE purchases
ADD COLUMN IF NOT EXISTS denial_reason TEXT;

ALTER TABLE purchases
ADD COLUMN IF NOT EXISTS denial_hotline VARCHAR(50);

UPDATE purchases
SET denial_hotline = '0367016147'
WHERE status = 'denied'
  AND (denial_hotline IS NULL OR denial_hotline = '');
