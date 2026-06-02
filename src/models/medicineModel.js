const pool = require("../config/db");

async function getAllMedicines() {
  const result = await pool.query(`
    SELECT 
      m.*,
      s.supplier_name
    FROM medicines m
    LEFT JOIN suppliers s ON m.supplier_id = s.id
    ORDER BY m.id DESC
  `);
  return result.rows;
}

async function getAvailableMedicines(searchTerm = "") {
  const result = await pool.query(
    `
    SELECT id, medicine_name, brand_name, category, dosage_form, strength, image_url,
           stock_quantity, selling_price
    FROM medicines
    WHERE stock_quantity > 0
      AND (
        $1 = ''
        OR medicine_name ILIKE '%' || $1 || '%'
        OR COALESCE(brand_name, '') ILIKE '%' || $1 || '%'
        OR COALESCE(category, '') ILIKE '%' || $1 || '%'
      )
    ORDER BY medicine_name ASC
    LIMIT 12
    `,
    [searchTerm]
  );

  return result.rows;
}

async function getAvailableCategories() {
  const result = await pool.query(`
    SELECT category, COUNT(*)::integer AS product_count
    FROM medicines
    WHERE stock_quantity > 0
      AND category IS NOT NULL
      AND category <> ''
    GROUP BY category
    ORDER BY category ASC
    LIMIT 8
  `);

  return result.rows;
}

async function getMedicineById(id) {
  const result = await pool.query(
    `
    SELECT 
      m.*,
      s.supplier_name
    FROM medicines m
    LEFT JOIN suppliers s ON m.supplier_id = s.id
    WHERE m.id = $1
    `,
    [id]
  );
  return result.rows[0];
}

async function createMedicine(data) {
  const result = await pool.query(
    `
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
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING *
    `,
    [
      data.medicine_name,
      data.brand_name || null,
      data.category || null,
      data.dosage_form || null,
      data.strength || null,
      data.image_url || null,
      Number(data.stock_quantity || 0),
      Number(data.import_price || 0),
      Number(data.selling_price || 0),
      data.expiry_date || null,
      data.supplier_id || null
    ]
  );

  return result.rows[0];
}

async function updateMedicine(id, data) {
  const result = await pool.query(
    `
    UPDATE medicines
    SET medicine_name = $2,
        brand_name = $3,
        category = $4,
        dosage_form = $5,
        strength = $6,
        image_url = $7,
        stock_quantity = $8,
        import_price = $9,
        selling_price = $10,
        expiry_date = $11,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
    `,
    [
      id,
      data.medicine_name,
      data.brand_name || null,
      data.category || null,
      data.dosage_form || null,
      data.strength || null,
      data.image_url || null,
      Number(data.stock_quantity || 0),
      Number(data.import_price || 0),
      Number(data.selling_price || 0),
      data.expiry_date || null
    ]
  );

  return result.rows[0];
}

async function deleteMedicine(id) {
  const result = await pool.query(
    "DELETE FROM medicines WHERE id = $1 RETURNING id, medicine_name",
    [id]
  );

  return result.rows[0];
}

async function reduceStockAfterSale(medicineId, quantity) {
  const result = await pool.query(
    `
    UPDATE medicines
    SET stock_quantity = stock_quantity - $2,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
      AND stock_quantity >= $2
    RETURNING *
    `,
    [medicineId, quantity]
  );

  return result.rows[0];
}

module.exports = {
  getAllMedicines,
  getAvailableMedicines,
  getAvailableCategories,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  reduceStockAfterSale
};
