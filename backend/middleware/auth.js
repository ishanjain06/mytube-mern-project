import jwt from "jsonwebtoken";
export const protect = (req, res, next) => {
  const token = req.headers.authorization?.startsWith("Bearer ") && req.headers.authorization.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Please log in to continue." });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { return res.status(401).json({ message: "Your session is invalid or has expired." }); }
};
