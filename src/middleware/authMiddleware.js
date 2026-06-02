const authService = require("../services/authService");
const userModel = require("../models/userModel");

function getCookieValue(req, name) {
  const cookies = (req.headers.cookie || "").split(";");

  for (const cookie of cookies) {
    const [key, ...value] = cookie.trim().split("=");
    if (key === name) {
      return decodeURIComponent(value.join("="));
    }
  }

  return null;
}

async function authenticateUser(req, res, next) {
  req.user = null;
  res.locals.currentUser = null;

  try {
    const token = getCookieValue(req, authService.COOKIE_NAME);
    const session = authService.readSessionToken(token);

    if (session) {
      const user = await userModel.findById(session.userId);

      if (user && user.role === session.role) {
        req.user = user;
        res.locals.currentUser = user;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}

function requireRole(role) {
  return function requireSelectedRole(req, res, next) {
    if (!req.user) {
      return res.redirect(`/login?role=${role}`);
    }

    if (req.user.role !== role) {
      return res.status(403).render("access-denied", {
        pageTitle: "Access Denied"
      });
    }

    next();
  };
}

module.exports = {
  authenticateUser,
  requireRole
};
