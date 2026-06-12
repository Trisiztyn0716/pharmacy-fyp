ALTER TABLE purchases
ADD COLUMN IF NOT EXISTS stock_deducted BOOLEAN;

UPDATE medicines m
SET stock_quantity = stock_quantity + legacy.quantity
FROM (
    SELECT pi.medicine_id, SUM(pi.quantity)::integer AS quantity
    FROM purchase_items pi
    JOIN purchases p ON p.id = pi.purchase_id
    WHERE p.stock_deducted IS NULL
      AND p.status <> 'approved'
      AND pi.medicine_id IS NOT NULL
    GROUP BY pi.medicine_id
) legacy
WHERE m.id = legacy.medicine_id;

UPDATE purchases
SET stock_deducted = (status = 'approved')
WHERE stock_deducted IS NULL;

ALTER TABLE purchases
ALTER COLUMN stock_deducted SET DEFAULT false;

ALTER TABLE purchases
ALTER COLUMN stock_deducted SET NOT NULL;
