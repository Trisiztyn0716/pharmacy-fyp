const pool = require("../config/db");

function createOrderCode() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();

  return `WEB-${timestamp}-${random}`;
}

async function createPurchase(data) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const medicineResult = await client.query(
      `
      SELECT id, medicine_name, brand_name, image_url, stock_quantity, selling_price
      FROM medicines
      WHERE id = $1
      FOR UPDATE
      `,
      [data.medicineId]
    );
    const medicine = medicineResult.rows[0];

    if (!medicine) {
      throw new Error("Medicine is not available.");
    }

    if (medicine.stock_quantity < data.quantity) {
      throw new Error(`Only ${medicine.stock_quantity} item(s) are available.`);
    }

    const unitPrice = Number(medicine.selling_price);
    const subtotal = unitPrice * data.quantity;

    const purchaseResult = await client.query(
      `
      INSERT INTO purchases (
        order_code,
        user_id,
        customer_name,
        phone,
        address,
        payment_method,
        subtotal
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
      `,
      [
        createOrderCode(),
        data.userId,
        data.customerName,
        data.phone,
        data.address,
        data.paymentMethod,
        subtotal
      ]
    );
    const purchase = purchaseResult.rows[0];

    const itemResult = await client.query(
      `
      INSERT INTO purchase_items (
        purchase_id,
        medicine_id,
        medicine_name,
        brand_name,
        image_url,
        quantity,
        unit_price
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
      `,
      [
        purchase.id,
        medicine.id,
        medicine.medicine_name,
        medicine.brand_name,
        medicine.image_url,
        data.quantity,
        unitPrice
      ]
    );

    await client.query(
      `
      UPDATE medicines
      SET stock_quantity = stock_quantity - $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [medicine.id, data.quantity]
    );

    await client.query("COMMIT");

    return {
      ...purchase,
      item: itemResult.rows[0]
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getAllPurchases() {
  const result = await pool.query(`
    SELECT
      p.*,
      u.email AS account_email,
      pi.medicine_name,
      pi.brand_name,
      pi.image_url,
      pi.quantity,
      pi.unit_price,
      pi.total_price
    FROM purchases p
    JOIN purchase_items pi ON pi.purchase_id = p.id
    LEFT JOIN users u ON u.id = p.user_id
    ORDER BY p.created_at DESC, p.id DESC
  `);

  return result.rows;
}

async function updateOrderStatus(orderId, status, details = {}) {
  const allowedStatuses = ["pending", "approved", "denied"];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid order status");
  }

  const result = await pool.query(
    `
    UPDATE purchases
    SET status = $1,
        denial_reason = CASE WHEN $2 THEN $3 ELSE NULL END,
        denial_hotline = CASE WHEN $2 THEN $4 ELSE NULL END
    WHERE id = $5
    RETURNING *
    `,
    [
      status,
      status === "denied",
      details.denialReason || null,
      details.denialHotline || null,
      orderId
    ]
  );

  return result.rows[0];
}

module.exports = {
  createPurchase,
  getAllPurchases,
  updateOrderStatus
};
