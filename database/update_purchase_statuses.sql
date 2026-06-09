UPDATE purchases
SET status = CASE status
    WHEN 'confirmed' THEN 'approved'
    WHEN 'completed' THEN 'approved'
    WHEN 'cancelled' THEN 'denied'
    WHEN 'rejected' THEN 'denied'
    WHEN 'deny' THEN 'denied'
    WHEN 'approve' THEN 'approved'
    ELSE LOWER(status)
END;

ALTER TABLE purchases
DROP CONSTRAINT IF EXISTS purchases_status_check;

ALTER TABLE purchases
ADD CONSTRAINT purchases_status_check
CHECK (status IN ('pending', 'approved', 'denied'));
