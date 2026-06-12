const pool = require("../config/db");

async function findCachedInfoByName(medicineName) {
  const result = await pool.query(
    `
    SELECT *
    FROM medicine_external_info
    WHERE LOWER(medicine_name) = LOWER($1)
    ORDER BY updated_at DESC
    LIMIT 1
    `,
    [medicineName]
  );

  return result.rows[0];
}

async function saveExternalInfo(info) {
  const result = await pool.query(
    `
    INSERT INTO medicine_external_info (
      medicine_name,
      set_id,
      title,
      source_name,
      source_url,
      raw_json
    )
    VALUES ($1,$2,$3,$4,$5,$6)
    ON CONFLICT (set_id)
    DO UPDATE SET
      medicine_name = EXCLUDED.medicine_name,
      title = EXCLUDED.title,
      source_url = EXCLUDED.source_url,
      raw_json = EXCLUDED.raw_json,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
    `,
    [
      info.medicine_name,
      info.set_id,
      info.title,
      info.source_name || "DailyMed",
      info.source_url,
      info.raw_json
    ]
  );

  return result.rows[0];
}

module.exports = {
  findCachedInfoByName,
  saveExternalInfo
};
