const nodemailer = require("nodemailer");

let transporter;

function getEmailConfiguration() {
  const host = String(process.env.SMTP_HOST || "").trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const user = String(process.env.SMTP_USER || "").trim();
  const pass = String(process.env.SMTP_PASS || "").trim();
  const from = String(process.env.MAIL_FROM || user).trim();

  if (!host || !from || !Number.isInteger(port)) {
    throw new Error("Email delivery is not configured. Set SMTP_HOST, SMTP_PORT, and MAIL_FROM.");
  }

  if ((user && !pass) || (!user && pass)) {
    throw new Error("Set both SMTP_USER and SMTP_PASS when SMTP authentication is required.");
  }

  return {
    from,
    transport: {
      host,
      port,
      secure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true",
      auth: user && pass ? { user, pass } : undefined
    }
  };
}

function getTransporter() {
  if (!transporter) {
    const configuration = getEmailConfiguration();
    transporter = nodemailer.createTransport(configuration.transport);
  }

  return transporter;
}

async function sendStaffVerificationEmail({ email, fullName, code }) {
  const configuration = getEmailConfiguration();

  await getTransporter().sendMail({
    from: configuration.from,
    to: email,
    subject: "Verify your pharmacy staff registration",
    text: [
      `Hello ${fullName},`,
      "",
      `Your staff registration verification code is: ${code}`,
      "",
      "This code expires in 10 minutes. If you did not request this registration, ignore this email."
    ].join("\n")
  });
}

async function sendSignupConfirmationEmail({ email, fullName, full_name: storedFullName, role }) {
  const configuration = getEmailConfiguration();
  const accountType = role === "staff" ? "staff" : "customer";
  const recipientName = fullName || storedFullName;

  await getTransporter().sendMail({
    from: configuration.from,
    to: email,
    subject: "Your Pharmacy Portal account has been created",
    text: [
      `Hello ${recipientName},`,
      "",
      `Your ${accountType} account has been created successfully.`,
      "You can now return to the Pharmacy Portal login page and sign in.",
      "",
      "If you did not create this account, please contact the pharmacy."
    ].join("\n")
  });
}

module.exports = {
  sendStaffVerificationEmail,
  sendSignupConfirmationEmail
};
