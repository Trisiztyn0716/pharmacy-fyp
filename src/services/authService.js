const crypto = require("crypto");

const COOKIE_NAME = "pharmacy_session";
const SESSION_LIFETIME_SECONDS = 60 * 60 * 8;
const sessionSecret = process.env.AUTH_SESSION_SECRET || crypto.randomBytes(32).toString("hex");

function getSessionSecret() {
  return sessionSecret;
}

function signValue(value) {
  return crypto.createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function createSessionToken(user) {
  const session = {
    userId: user.id,
    role: user.role,
    expiresAt: Date.now() + SESSION_LIFETIME_SECONDS * 1000
  };
  const value = Buffer.from(JSON.stringify(session)).toString("base64url");

  return `${value}.${signValue(value)}`;
}

function readSessionToken(token) {
  if (!token) {
    return null;
  }

  const [value, signature] = token.split(".");
  if (!value || !signature) {
    return null;
  }

  const expected = Buffer.from(signValue(value));
  const received = Buffer.from(signature);

  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
    return null;
  }

  try {
    const session = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));

    if (!session.userId || !["staff", "customer"].includes(session.role) || session.expiresAt <= Date.now()) {
      return null;
    }

    return session;
  } catch (error) {
    return null;
  }
}

function verifyPassword(password, storedHash) {
  const [algorithm, salt, savedHash] = String(storedHash || "").split("$");

  if (algorithm !== "scrypt" || !salt || !savedHash) {
    return false;
  }

  const derivedHash = crypto.scryptSync(password, salt, 64);
  const savedBuffer = Buffer.from(savedHash, "hex");

  return savedBuffer.length === derivedHash.length && crypto.timingSafeEqual(savedBuffer, derivedHash);
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");

  return `scrypt$${salt}$${hash}`;
}

function createVerificationCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashVerificationCode(code) {
  return crypto.createHmac("sha256", getSessionSecret()).update(String(code)).digest("hex");
}

function verifyVerificationCode(code, expectedHash) {
  const expected = Buffer.from(String(expectedHash || ""), "hex");
  const received = Buffer.from(hashVerificationCode(code), "hex");

  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

module.exports = {
  COOKIE_NAME,
  SESSION_LIFETIME_SECONDS,
  createSessionToken,
  readSessionToken,
  verifyPassword,
  hashPassword,
  createVerificationCode,
  hashVerificationCode,
  verifyVerificationCode
};
