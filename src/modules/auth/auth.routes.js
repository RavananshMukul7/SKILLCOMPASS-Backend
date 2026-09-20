import { Router } from "express";
import { login, logout, logoutAll, me, register, revokeUserSession, sessions, } from "./auth.controller.js";
import { loginSchema, registerSchema, sessionIdSchema, } from "./auth.validation.js";
import { validate } from "../../middleware/validate.js";
import { requireAuth } from "../../middleware/requireAuth.js";
const router = Router();
router.post("/logout", logout);
router
    .route("/login")
    .post(validate(loginSchema), login)
    .get((req, res) => {
    res.render("login");
});
router
    .route("/register")
    .get((req, res) => {
    res.render("register");
})
    .post(validate(registerSchema), register);
router.get("/me", requireAuth, me);
router.get("/sessions", requireAuth, sessions);
router.delete("/sessions/:sessionId", requireAuth, validate(sessionIdSchema), revokeUserSession);
router.post("/logout-all", requireAuth, logoutAll);
export default router;
