const pool = require("../config/db");

async function withTransaction(callback) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function saveRequest(data, client = pool) {
  const result = await client.query(
    `
    INSERT INTO pending_staff_registrations (
      full_name,
      email,
      password_hash,
      verification_code_hash,
      verification_attempts,
      expires_at
    )
    VALUES ($1, $2, $3, $4, 0, $5)
    ON CONFLICT (email)
    DO UPDATE SET
      full_name = EXCLUDED.full_name,
      password_hash = EXCLUDED.password_hash,
      verification_code_hash = EXCLUDED.verification_code_hash,
      verification_attempts = 0,
      expires_at = EXCLUDED.expires_at,
      created_at = CURRENT_TIMESTAMP
    RETURNING id, full_name, email, password_hash, verification_attempts, expires_at
    `,
    [data.fullName, data.email, data.passwordHash, data.codeHash, data.expiresAt]
  );

  return result.rows[0];
}

async function findRequestById(id) {
  const result = await pool.query(
    `
    SELECT id, full_name, email, password_hash, verification_code_hash,
           verification_attempts, expires_at
    FROM pending_staff_registrations
    WHERE id = $1
    LIMIT 1
    `,
    [id]
  );

  return result.rows[0];
}

async function recordFailedAttempt(id) {
  const result = await pool.query(
    `
    UPDATE pending_staff_registrations
    SET verification_attempts = verification_attempts + 1
    WHERE id = $1
    RETURNING verification_attempts
    `,
    [id]
  );

  return result.rows[0];
}

async function deleteRequest(id, client = pool) {
  await client.query("DELETE FROM pending_staff_registrations WHERE id = $1", [id]);
}

module.exports = {
  withTransaction,
  saveRequest,
  findRequestById,
  recordFailedAttempt,
  deleteRequest
};
