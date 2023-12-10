const admin = require("firebase-admin");

const verifyToken = async (req, res, next) => {
  const idToken =
    req.headers.authorization && req.headers.authorization.split(" ")[1];

  if (!idToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.currentUser = decodedToken;
    next();
  } catch (error) {
    console.error("Error verifying ID token:", error);
    return res.status(403).json({ message: "Forbidden" });
  }
};
