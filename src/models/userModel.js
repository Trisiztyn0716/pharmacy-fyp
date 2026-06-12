const pool = require("../config/db");

async function findByEmail(email) {
  const result = await pool.query(
    `
    SELECT id, full_name, email, password_hash, role
    FROM users
    WHERE LOWER(email) = LOWER($1)
    LIMIT 1
    `,
    [email]
  );

  return result.rows[0];
}

async function findById(id) {
  const result = await pool.query(
    `
    SELECT id, full_name, email, role
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [id]
  );

  return result.rows[0];
}

async function createUser(data, client = pool) {
  const result = await client.query(
    `
    INSERT INTO users (full_name, email, password_hash, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, full_name, email, role
    `,
    [data.fullName, data.email, data.passwordHash, data.role]
  );

  return result.rows[0];
}

module.exports = {
  findByEmail,
  findById,
  createUser
};
