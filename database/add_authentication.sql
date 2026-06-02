CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'staff')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS pending_staff_registrations (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    verification_code_hash TEXT NOT NULL,
    verification_attempts INTEGER NOT NULL DEFAULT 0 CHECK (verification_attempts >= 0),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pending_staff_email ON pending_staff_registrations(email);

INSERT INTO users (full_name, email, password_hash, role)
VALUES
('Sample Staff', 'staff@pharmacy.local', 'scrypt$staff-demo-salt$12a648d9902a75420ab951fd4065e835e5fc79ca745d307e7134e074076040b3a63dc092e599284617f8b2f70121da098c783da38f92ed469baf952b5074b5ce', 'staff'),
('Sample Customer', 'customer@pharmacy.local', 'scrypt$customer-demo-salt$807a563ef4ac58511c52715aadd705bb51ae16b4689546a24dafc3461dd88c8c5bb42878150d2dc6af1399196e2f2676b0645aa2ce693d5de614c83a4a017763', 'customer')
ON CONFLICT (email) DO NOTHING;
