/**
 * Dummy authentication middleware to allow the app to run without the auth module.
 * In a production environment, this should be replaced with real JWT validation.
 */
export const authenticateToken = (req, res, next) => {
    // Mock user for bypass
    req.user = {
        id: 1,
        email: "admin@example.com",
        role: "super_admin",
        firstName: "Admin",
        lastName: "User"
    };
    next();
};
