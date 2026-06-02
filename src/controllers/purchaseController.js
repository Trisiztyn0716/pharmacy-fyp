const purchaseModel = require("../models/purchaseModel");

function cleanText(value) {
  return String(value || "").trim();
}

function validatePurchase(body) {
  const quantity = Number(body.quantity || 1);
  const medicineId = Number(body.medicine_id);
  const paymentMethod = cleanText(body.payment_method);

  const data = {
    medicineId,
    quantity,
    customerName: cleanText(body.customer_name),
    phone: cleanText(body.phone),
    address: cleanText(body.address),
    paymentMethod
  };

  if (!Number.isInteger(medicineId) || medicineId <= 0) {
    return { error: "Choose a valid product.", data };
  }

  if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 99) {
    return { error: "Quantity must be between 1 and 99.", data };
  }

  if (!data.customerName || !data.phone || !data.address) {
    return { error: "Enter your name, phone number, and delivery address.", data };
  }

  if (!/^[0-9+\-\s()]{8,20}$/.test(data.phone)) {
    return { error: "Enter a valid phone number.", data };
  }

  if (!["card", "cod"].includes(paymentMethod)) {
    return { error: "Choose card or COD cash payment.", data };
  }

  return { data };
}

function redirectWithPurchaseError(res, message) {
  res.redirect(`/user/home?purchase_error=${encodeURIComponent(message)}#products`);
}

async function createPurchase(req, res) {
  const { error, data } = validatePurchase(req.body);

  if (error) {
    return redirectWithPurchaseError(res, error);
  }

  try {
    const purchase = await purchaseModel.createPurchase({
      ...data,
      userId: req.user.id
    });

    res.redirect(`/user/home?order=${encodeURIComponent(purchase.order_code)}#products`);
  } catch (caughtError) {
    redirectWithPurchaseError(res, caughtError.message);
  }
}

async function salesPage(req, res) {
  try {
    const purchases = await purchaseModel.getAllPurchases();

    res.render("sales", {
      pageTitle: "Web Sales | Staff Dashboard",
      user: req.user,
      purchases
    });
  } catch (error) {
    res.status(500).send(`Cannot load web sales: ${error.message}`);
  }
}

// NEW: Staff/admin updates order status
async function updatePurchaseStatus(req, res) {
  try {
    const orderId = req.params.id;
    const status = cleanText(req.body.status);

    await purchaseModel.updateOrderStatus(orderId, status);

    res.redirect("/staff/sales");
  } catch (error) {
    res.status(500).send(`Cannot update order status: ${error.message}`);
  }
}

module.exports = {
  createPurchase,
  salesPage,
  updatePurchaseStatus
};