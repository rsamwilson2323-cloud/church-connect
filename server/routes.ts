import type { Express, Request, Response } from "express";
import type { Server } from "http";
import { storageFor } from "./fileStorage";

// Middleware: require authenticated user
function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
  next();
}

// Get per-user storage from the session
function storage(req: Request) {
  const user = req.user as any;
  return storageFor(user.username);
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  // ─── Classes ─────────────────────────────────────────────────────────
  app.get("/api/classes", requireAuth, async (req, res) => {
    res.json(await storage(req).getClasses());
  });

  app.post("/api/classes", requireAuth, async (req, res) => {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Name is required" });
    res.status(201).json(await storage(req).createClass({ name: name.trim() }));
  });

  app.put("/api/classes/:id", requireAuth, async (req, res) => {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Name is required" });
    try {
      res.json(await storage(req).updateClass(parseInt(req.params.id), { name: name.trim() }));
    } catch { res.status(404).json({ message: "Not found" }); }
  });

  app.delete("/api/classes/:id", requireAuth, async (req, res) => {
    await storage(req).deleteClass(parseInt(req.params.id));
    res.status(204).end();
  });

  // ─── Divisions ───────────────────────────────────────────────────────
  app.post("/api/divisions", requireAuth, async (req, res) => {
    const { name, classId } = req.body;
    if (!name?.trim() || !classId) return res.status(400).json({ message: "Name and classId required" });
    res.status(201).json(await storage(req).createDivision({ name: name.trim(), classId: parseInt(classId) }));
  });

  app.put("/api/divisions/:id", requireAuth, async (req, res) => {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Name is required" });
    try {
      res.json(await storage(req).updateDivision(parseInt(req.params.id), { name: name.trim() }));
    } catch { res.status(404).json({ message: "Not found" }); }
  });

  app.delete("/api/divisions/:id", requireAuth, async (req, res) => {
    await storage(req).deleteDivision(parseInt(req.params.id));
    res.status(204).end();
  });

  // ─── Members ─────────────────────────────────────────────────────────
  app.get("/api/members", requireAuth, async (req, res) => {
    const divisionId = req.query.divisionId ? parseInt(req.query.divisionId as string) : undefined;
    const search = req.query.search as string | undefined;
    res.json(await storage(req).getMembers(divisionId, search));
  });

  app.post("/api/members", requireAuth, async (req, res) => {
    const { name, type, divisionId, active } = req.body;
    if (!name?.trim() || !divisionId) return res.status(400).json({ message: "Name and division required" });
    res.status(201).json(await storage(req).createMember({
      name: name.trim(), type: type || "Student",
      divisionId: parseInt(divisionId), active: active ?? true
    }));
  });

  app.put("/api/members/:id", requireAuth, async (req, res) => {
    const { name, type, divisionId, active } = req.body;
    const data: any = {};
    if (name !== undefined) data.name = name.trim();
    if (type !== undefined) data.type = type;
    if (divisionId !== undefined) data.divisionId = parseInt(divisionId);
    if (active !== undefined) data.active = active;
    try {
      res.json(await storage(req).updateMember(parseInt(req.params.id), data));
    } catch { res.status(404).json({ message: "Not found" }); }
  });

  app.delete("/api/members/:id", requireAuth, async (req, res) => {
    await storage(req).deleteMember(parseInt(req.params.id));
    res.status(204).end();
  });

  // ─── Attendance ──────────────────────────────────────────────────────
  app.get("/api/attendance", requireAuth, async (req, res) => {
    const date = req.query.date as string;
    const divisionId = req.query.divisionId ? parseInt(req.query.divisionId as string) : undefined;
    if (!date) return res.status(400).json({ message: "Date required" });
    res.json(await storage(req).getAttendance(date, divisionId));
  });

  app.get("/api/attendance/summary", requireAuth, async (req, res) => {
    const date = req.query.date as string;
    if (!date) return res.status(400).json({ message: "Date required" });
    res.json(await storage(req).getAttendanceSummary(date));
  });

  app.post("/api/attendance/batch", requireAuth, async (req, res) => {
    const { date, records } = req.body;
    if (!date || !Array.isArray(records)) return res.status(400).json({ message: "Invalid input" });
    res.json(await storage(req).batchUpdateAttendance({ date, records }));
  });

  // ─── Reports ─────────────────────────────────────────────────────────
  app.get("/api/reports/stats", requireAuth, async (req, res) => {
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    res.json(await storage(req).getMemberStats(startDate, endDate));
  });

  return httpServer;
}
