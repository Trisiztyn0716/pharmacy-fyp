INSERT INTO users (full_name, email, password_hash, role)
VALUES
('Sample Staff', 'staff@pharmacy.local', 'scrypt$staff-demo-salt$12a648d9902a75420ab951fd4065e835e5fc79ca745d307e7134e074076040b3a63dc092e599284617f8b2f70121da098c783da38f92ed469baf952b5074b5ce', 'staff'),
('Sample Customer', 'customer@pharmacy.local', 'scrypt$customer-demo-salt$807a563ef4ac58511c52715aadd705bb51ae16b4689546a24dafc3461dd88c8c5bb42878150d2dc6af1399196e2f2676b0645aa2ce693d5de614c83a4a017763', 'customer');

INSERT INTO suppliers (supplier_name, phone, email, address)
VALUES
('Sample Pharma Supplier', '0900000000', 'supplier@example.com', 'Ho Chi Minh City');

INSERT INTO medicines (
    medicine_name,
    brand_name,
    category,
    dosage_form,
    strength,
    image_url,
    stock_quantity,
    import_price,
    selling_price,
    expiry_date,
    supplier_id
)
VALUES
('Ibuprofen', 'Sample Brand', 'Pain relief', 'Tablet', '200mg', '/images/medicines/Ibuprofen.webp', 100, 800, 1200, '2027-12-31', 1),
('Acetaminophen', 'Sample Brand', 'Pain relief', 'Tablet', '500mg', '/images/medicines/Equate-Extra-Strength-Acetaminophen-Pain-Reliever-Tablets-500-mg-100-Count_fad66028-24f3-4ed4-8862-149ef70ec693.494a0a7f3f7e2bae21fcb6782b43cd2a.webp', 120, 700, 1100, '2027-10-31', 1),
('Amoxicillin', 'Sample Brand', 'Antibiotic', 'Capsule', '500mg', '/images/medicines/Amoxicillin.webp', 80, 1500, 2500, '2027-08-31', 1);
