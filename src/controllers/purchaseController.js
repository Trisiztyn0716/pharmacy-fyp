const purchaseModel = require("../models/purchaseModel");

const DEFAULT_DENIAL_HOTLINE = "0367016147";

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
      purchases,
      message: req.query.status === "updated" ? "Purchase status updated." : null,
      error: req.query.error || null,
      defaultDenialHotline: DEFAULT_DENIAL_HOTLINE,
      statusOptions: [
        { value: "pending", label: "Pending" },
        { value: "approved", label: "Approve" },
        { value: "denied", label: "Deny" }
      ]
    });
  } catch (error) {
    res.status(500).send(`Cannot load web sales: ${error.message}`);
  }
}

async function updatePurchaseStatus(req, res) {
  try {
    const orderId = req.params.id;
    const status = cleanText(req.body.status).toLowerCase();
    const denialReason = cleanText(req.body.denial_reason);
    const denialHotline = cleanText(req.body.denial_hotline) || DEFAULT_DENIAL_HOTLINE;

    if (status === "denied" && !denialReason) {
      return res.redirect(`/staff/sales?error=${encodeURIComponent("A denial reason is required when denying a purchase.")}`);
    }

    if (status === "denied" && !/^[0-9+\-\s()]{8,20}$/.test(denialHotline)) {
      return res.redirect(`/staff/sales?error=${encodeURIComponent("Enter a valid hotline phone number for denied purchases.")}`);
    }

    const purchase = await purchaseModel.updateOrderStatus(orderId, status, {
      denialReason,
      denialHotline
    });

    if (!purchase) {
      return res.status(404).send("Purchase not found");
    }

    res.redirect("/staff/sales?status=updated");
  } catch (error) {
    res.redirect(`/staff/sales?error=${encodeURIComponent(error.message)}`);
  }
}

module.exports = {
  createPurchase,
  salesPage,
  updatePurchaseStatus
};
