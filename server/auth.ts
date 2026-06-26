import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import bcrypt from "bcryptjs";
import type { Express } from "express";
import { userStore, storageFor } from "./fileStorage";

const DEMO_USERNAME = "sam_2323";
const DEMO_PASSWORD = "sam@2323";

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
  next();
}

function safeUser(u: any) {
  return { id: u.id, username: u.username, displayName: u.displayName || u.username };
}

// Called once at server startup — ensures the demo account always exists
export async function ensureDemoUser() {
  if (!userStore.getByUsername(DEMO_USERNAME)) {
    const hashed = await bcrypt.hash(DEMO_PASSWORD, 10);
    const user = userStore.create(DEMO_USERNAME, hashed);
    await storageFor(user.username).seedDemo();
    console.log(`[setup] Demo account created: ${DEMO_USERNAME}`);
  }
}

export function setupAuth(app: Express) {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "church-mgmt-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = userStore.getByUsername(username);
        if (!user) return done(null, false, { message: "Invalid username or password" });
        const match = await bcrypt.compare(password, user.password);
        if (!match) return done(null, false, { message: "Invalid username or password" });
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser((id: number, done) => {
    const user = userStore.getById(id);
    done(null, user || false);
  });

  // Register — new users always start with empty data
  app.post("/api/register", async (req, res) => {
    const { username, password } = req.body;
    if (!username?.trim() || !password) return res.status(400).json({ message: "Username and password are required" });
    if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });
    if (username.trim().toLowerCase() === DEMO_USERNAME.toLowerCase()) {
      return res.status(409).json({ message: "Username already taken" });
    }
    if (userStore.getByUsername(username)) return res.status(409).json({ message: "Username already taken" });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = userStore.create(username.trim(), hashed);

    req.login(newUser, (err) => {
      if (err) return res.status(500).json({ message: "Login failed after registration" });
      return res.status(201).json(safeUser(newUser));
    });
  });

  // Login
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Invalid credentials" });
      req.login(user, (err) => {
        if (err) return next(err);
        return res.json(safeUser(user));
      });
    })(req, res, next);
  });

  // Logout
  app.post("/api/logout", (req, res) => {
    req.logout(() => res.json({ ok: true }));
  });

  // Current user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    return res.json(safeUser(req.user as any));
  });

  // Settings: update display name
  app.put("/api/settings/profile", requireAuth, async (req, res) => {
    const { displayName } = req.body;
    if (!displayName?.trim()) return res.status(400).json({ message: "Display name is required" });
    const user = req.user as any;
    const updated = userStore.update(user.id, { displayName: displayName.trim() });
    if (!updated) return res.status(404).json({ message: "User not found" });
    return res.json(safeUser(updated));
  });

  // Settings: change password
  app.put("/api/settings/password", requireAuth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: "Both passwords are required" });
    if (newPassword.length < 6) return res.status(400).json({ message: "New password must be at least 6 characters" });

    const user = req.user as any;
    const record = userStore.getById(user.id);
    if (!record) return res.status(404).json({ message: "User not found" });

    const match = await bcrypt.compare(currentPassword, record.password);
    if (!match) return res.status(400).json({ message: "Current password is incorrect" });

    const hashed = await bcrypt.hash(newPassword, 10);
    userStore.update(user.id, { password: hashed });
    return res.json({ ok: true });
  });
}
