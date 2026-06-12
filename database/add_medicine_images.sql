ALTER TABLE medicines
ADD COLUMN IF NOT EXISTS image_url TEXT;

UPDATE medicines
SET image_url = CASE LOWER(medicine_name)
    WHEN 'ibuprofen' THEN '/images/medicines/Ibuprofen.webp'
    WHEN 'acetaminophen' THEN '/images/medicines/Equate-Extra-Strength-Acetaminophen-Pain-Reliever-Tablets-500-mg-100-Count_fad66028-24f3-4ed4-8862-149ef70ec693.494a0a7f3f7e2bae21fcb6782b43cd2a.webp'
    WHEN 'amoxicillin' THEN '/images/medicines/Amoxicillin.webp'
    WHEN 'paracetamol 500mg' THEN '/images/medicines/panadol%20paracetamol%20500mg.png'
    ELSE image_url
END
WHERE image_url IS NULL;
