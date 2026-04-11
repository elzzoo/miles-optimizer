import crypto from "node:crypto";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");

/**
 * JWT middleware — verifies custom JWT token (issued by /api/auth/verify)
 * Attaches req.user = { sub, email, plan } on success
 */
export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Non autorisé" });
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Token invalide ou expiré" });
  }
}

/**
 * Optional auth — sets req.user = null if no valid token, otherwise attaches payload
 */
export function optionalAuthMiddleware(req, res, next) {
  const header = req.headers.authorization;
  req.user = null;
  if (header?.startsWith("Bearer ")) {
    try { req.user = jwt.verify(header.slice(7), JWT_SECRET); } catch {}
  }
  next();
}
