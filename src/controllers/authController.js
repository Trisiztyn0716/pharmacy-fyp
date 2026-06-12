const authService = require("../services/authService");
const emailService = require("../services/emailService");
const staffRegistrationModel = require("../models/staffRegistrationModel");
const userModel = require("../models/userModel");
const medicineModel = require("../models/medicineModel");
const purchaseModel = require("../models/purchaseModel");

const STAFF_VERIFICATION_LIFETIME_MINUTES = 10;
const MAX_STAFF_VERIFICATION_ATTEMPTS = 5;

function destinationFor(user) {
  return user.role === "staff" ? "/staff" : "/user/home";
}

function selectedRole(value) {
  return value === "staff" ? "staff" : "customer";
}

function registrationNotice(value) {
  if (value === "staff") {
    return "Your staff account has been verified and created. Sign in to continue.";
  }

  if (value === "customer") {
    return "Your customer account has been created. Sign in to continue.";
  }

  return null;
}

function getSignupDetails(req) {
  return {
    fullName: String(req.body.full_name || "").trim(),
    email: String(req.body.email || "").trim().toLowerCase(),
    password: String(req.body.password || ""),
    confirmPassword: String(req.body.confirm_password || "")
  };
}

function validateSignupDetails(details) {
  if (!details.fullName || !details.email || !details.password || !details.confirmPassword) {
    return "Complete all required fields.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) {
    return "Enter a valid email address.";
  }

  if (details.password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (details.password !== details.confirmPassword) {
    return "Passwords do not match.";
  }

  return null;
}

function validateStaffEmail(email) {
  const configuredDomain = String(process.env.STAFF_ALLOWED_EMAIL_DOMAIN || "")
    .trim()
    .toLowerCase()
    .replace(/^@/, "");

  if (!configuredDomain && process.env.NODE_ENV === "production") {
    return "Staff registration is unavailable until an approved staff email domain is configured.";
  }

  if (configuredDomain && !email.endsWith(`@${configuredDomain}`)) {
    return `Staff registration requires an @${configuredDomain} email address.`;
  }

  return null;
}

function emailFailureMessage(error, messageType) {
  const genericMessage = `The ${messageType} email could not be sent. Try again later.`;

  if (process.env.NODE_ENV === "production") {
    return genericMessage;
  }

  const technicalMessage = String(error && error.message || "");

  if (
    technicalMessage.includes("Email delivery is not configured") ||
    technicalMessage.includes("Set both SMTP_USER and SMTP_PASS")
  ) {
    return "Outgoing email is not configured. Add the SMTP sender settings to your .env file and restart the application.";
  }

  if (error && error.code === "EAUTH") {
    return "The SMTP sender login was rejected. Check SMTP_USER and SMTP_PASS in your .env file and restart the application.";
  }

  return genericMessage;
}

function parseRequestId(value) {
  const requestId = Number(value);

  return Number.isInteger(requestId) && requestId > 0 ? requestId : null;
}

function renderSignup(res, role, details = {}, error = null, status = 200) {
  return res.status(status).render("signup", {
    pageTitle: `${role === "staff" ? "Staff" : "Customer"} Sign Up | Pharmacy Portal`,
    role,
    fullName: details.fullName || "",
    email: details.email || "",
    error
  });
}

function maskEmail(email) {
  const [name, domain] = email.split("@");
  const visible = name.slice(0, Math.min(2, name.length));

  return `${visible}${"*".repeat(Math.max(1, name.length - visible.length))}@${domain}`;
}

function renderStaffVerification(res, request, error = null, status = 200) {
  return res.status(status).render("staff-verification", {
    pageTitle: "Verify Staff Email | Pharmacy Portal",
    requestId: request.id,
    email: maskEmail(request.email),
    error
  });
}

function rootPage(req, res) {
  if (req.user) {
    return res.redirect(destinationFor(req.user));
  }

  res.redirect("/login");
}

function purchaseNotice(orderCode) {
  if (!orderCode) {
    return null;
  }

  return `Purchase request ${orderCode} was submitted successfully. Our pharmacy team will confirm it soon.`;
}

function loginPage(req, res) {
  if (req.user) {
    return res.redirect(destinationFor(req.user));
  }

  res.render("login", {
    pageTitle: "Sign In | Pharmacy Portal",
    role: selectedRole(req.query.role),
    email: "",
    error: null,
    notice: registrationNotice(req.query.registered)
  });
}

async function login(req, res) {
  const role = selectedRole(req.body.role);
  const email = String(req.body.email || "").trim();
  const password = String(req.body.password || "");

  try {
    const user = await userModel.findByEmail(email);
    const credentialsMatch = user && user.role === role && authService.verifyPassword(password, user.password_hash);

    if (!credentialsMatch) {
      return res.status(401).render("login", {
        pageTitle: "Sign In | Pharmacy Portal",
        role,
        email,
        error: `Invalid ${role === "staff" ? "staff" : "customer"} login details.`,
        notice: null
      });
    }

    const token = authService.createSessionToken(user);
    res.cookie(authService.COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: authService.SESSION_LIFETIME_SECONDS * 1000
    });

    res.redirect(destinationFor(user));
  } catch (error) {
    res.status(500).send(`Login failed: ${error.message}`);
  }
}

function signupPage(req, res) {
  if (req.user) {
    return res.redirect(destinationFor(req.user));
  }

  return renderSignup(res, selectedRole(req.query.role));
}

async function signupCustomer(req, res) {
  const details = getSignupDetails(req);
  const error = validateSignupDetails(details);

  if (error) {
    return renderSignup(res, "customer", details, error, 400);
  }

  try {
    if (await userModel.findByEmail(details.email)) {
      return renderSignup(res, "customer", details, "An account with this email address already exists.", 409);
    }

    await staffRegistrationModel.withTransaction(async (client) => {
      const user = await userModel.createUser({
        fullName: details.fullName,
        email: details.email,
        passwordHash: authService.hashPassword(details.password),
        role: "customer"
      }, client);

      await emailService.sendSignupConfirmationEmail(user);
    });

    res.redirect("/login?role=customer&registered=customer");
  } catch (caughtError) {
    console.error("Customer registration failed:", caughtError.message);

    if (caughtError.code === "23505") {
      return renderSignup(res, "customer", details, "An account with this email address already exists.", 409);
    }

    return renderSignup(
      res,
      "customer",
      details,
      emailFailureMessage(caughtError, "registration confirmation"),
      503
    );
  }
}

async function signupStaff(req, res) {
  const details = getSignupDetails(req);
  const error = validateSignupDetails(details) || validateStaffEmail(details.email);

  if (error) {
    return renderSignup(res, "staff", details, error, 400);
  }

  try {
    if (await userModel.findByEmail(details.email)) {
      return renderSignup(res, "staff", details, "An account with this email address already exists.", 409);
    }

    const code = authService.createVerificationCode();
    const request = await staffRegistrationModel.withTransaction(async (client) => {
      const registration = await staffRegistrationModel.saveRequest({
        fullName: details.fullName,
        email: details.email,
        passwordHash: authService.hashPassword(details.password),
        codeHash: authService.hashVerificationCode(code),
        expiresAt: new Date(Date.now() + STAFF_VERIFICATION_LIFETIME_MINUTES * 60 * 1000)
      }, client);

      await emailService.sendStaffVerificationEmail({
        email: registration.email,
        fullName: registration.full_name,
        code
      });

      return registration;
    });

    res.redirect(`/signup/staff/verify?request=${request.id}`);
  } catch (caughtError) {
    console.error("Staff verification email failed:", caughtError.message);
    return renderSignup(
      res,
      "staff",
      details,
      emailFailureMessage(caughtError, "verification"),
      503
    );
  }
}

async function staffVerificationPage(req, res) {
  try {
    const requestId = parseRequestId(req.query.request);

    if (!requestId) {
      return renderSignup(res, "staff", {}, "Start staff registration to receive a verification code.", 400);
    }

    const request = await staffRegistrationModel.findRequestById(requestId);

    if (!request || new Date(request.expires_at).getTime() <= Date.now()) {
      return renderSignup(res, "staff", {}, "Your verification request has expired. Register again for a new code.", 400);
    }

    return renderStaffVerification(res, request);
  } catch (error) {
    res.status(500).send(`Cannot display staff verification: ${error.message}`);
  }
}

async function verifyStaffSignup(req, res) {
  const requestId = parseRequestId(req.body.request_id);
  const code = String(req.body.verification_code || "").trim();

  try {
    if (!requestId) {
      return renderSignup(res, "staff", {}, "Start staff registration to receive a verification code.", 400);
    }

    const request = await staffRegistrationModel.findRequestById(requestId);

    if (!request || new Date(request.expires_at).getTime() <= Date.now()) {
      return renderSignup(res, "staff", {}, "Your verification request has expired. Register again for a new code.", 400);
    }

    if (request.verification_attempts >= MAX_STAFF_VERIFICATION_ATTEMPTS) {
      await staffRegistrationModel.deleteRequest(request.id);
      return renderSignup(res, "staff", {}, "Too many invalid codes. Register again for a new code.", 429);
    }

    if (!/^\d{6}$/.test(code) || !authService.verifyVerificationCode(code, request.verification_code_hash)) {
      const attempt = await staffRegistrationModel.recordFailedAttempt(request.id);

      if (attempt.verification_attempts >= MAX_STAFF_VERIFICATION_ATTEMPTS) {
        await staffRegistrationModel.deleteRequest(request.id);
        return renderSignup(res, "staff", {}, "Too many invalid codes. Register again for a new code.", 429);
      }

      return renderStaffVerification(res, request, "The verification code is incorrect.", 400);
    }

    await staffRegistrationModel.withTransaction(async (client) => {
      const user = await userModel.createUser({
        fullName: request.full_name,
        email: request.email,
        passwordHash: request.password_hash,
        role: "staff"
      }, client);

      await staffRegistrationModel.deleteRequest(request.id, client);
      await emailService.sendSignupConfirmationEmail(user);
    });

    res.redirect("/login?role=staff&registered=staff");
  } catch (caughtError) {
    console.error("Staff registration completion failed:", caughtError.message);

    if (caughtError.code === "23505") {
      return renderSignup(res, "staff", {}, "An account with this email address already exists.", 409);
    }

    const request = await staffRegistrationModel.findRequestById(requestId);
    if (request) {
      return renderStaffVerification(
        res,
        request,
        emailFailureMessage(caughtError, "account confirmation"),
        503
      );
    }

    res.status(503).send("Staff registration could not be completed.");
  }
}

function logout(req, res) {
  res.clearCookie(authService.COOKIE_NAME);
  res.redirect("/login");
}

async function userHome(req, res) {
  const searchTerm = String(req.query.search || "").trim().slice(0, 100);

  try {
    const [medicines, categories, purchases] = await Promise.all([
      medicineModel.getAvailableMedicines(searchTerm),
      medicineModel.getAvailableCategories(),
      purchaseModel.getPurchasesByUserId(req.user.id)
    ]);

    res.render("user-home", {
      pageTitle: "Online Pharmacy | Pharmacy Portal",
      user: req.user,
      medicines,
      categories,
      purchases,
      searchTerm,
      purchaseNotice: purchaseNotice(req.query.order),
      purchaseError: req.query.purchase_error || null
    });
  } catch (error) {
    res.status(500).send(`Cannot display pharmacy home page: ${error.message}`);
  }
}

module.exports = {
  rootPage,
  loginPage,
  login,
  signupPage,
  signupCustomer,
  signupStaff,
  staffVerificationPage,
  verifyStaffSignup,
  logout,
  userHome
};
