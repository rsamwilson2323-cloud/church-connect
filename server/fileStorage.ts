import fs from "fs";
import path from "path";

const DATA_ROOT = path.resolve(process.cwd(), "data");

// ─── Shared user store (data/users.json) ────────────────────────────────────

interface UserRecord {
  id: number;
  username: string;
  password: string; // bcrypt hash
  displayName?: string;
}

interface UsersDb {
  users: UserRecord[];
  counter: number;
}

function usersPath() {
  return path.join(DATA_ROOT, "users.json");
}

function readUsers(): UsersDb {
  try {
    const raw = fs.readFileSync(usersPath(), "utf-8");
    const p = JSON.parse(raw);
    return { users: p.users || [], counter: p.counter || 0 };
  } catch {
    return { users: [], counter: 0 };
  }
}

function writeUsers(db: UsersDb) {
  fs.mkdirSync(DATA_ROOT, { recursive: true });
  fs.writeFileSync(usersPath(), JSON.stringify(db, null, 2), "utf-8");
}

export const userStore = {
  getByUsername(username: string): UserRecord | undefined {
    return readUsers().users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  },
  getById(id: number): UserRecord | undefined {
    return readUsers().users.find((u) => u.id === id);
  },
  create(username: string, password: string): UserRecord {
    const db = readUsers();
    db.counter += 1;
    const user: UserRecord = { id: db.counter, username, password };
    db.users.push(user);
    writeUsers(db);
    return user;
  },
  update(id: number, data: Partial<Pick<UserRecord, "displayName" | "password">>): UserRecord | undefined {
    const db = readUsers();
    const user = db.users.find((u) => u.id === id);
    if (!user) return undefined;
    if (data.displayName !== undefined) user.displayName = data.displayName;
    if (data.password !== undefined) user.password = data.password;
    writeUsers(db);
    return user;
  },
  isFirst(): boolean {
    return readUsers().users.length === 0;
  },
  count(): number {
    return readUsers().users.length;
  },
};

// ─── Per-user data store (data/users/{id}/db.json) ──────────────────────────

interface UserDbData {
  classes: { id: number; name: string }[];
  divisions: { id: number; name: string; classId: number }[];
  members: { id: number; name: string; type: string; divisionId: number; active: boolean }[];
  attendance: { id: number; memberId: number; date: string; present: boolean; offering: string | null }[];
  counters: { classes: number; divisions: number; members: number; attendance: number };
}

function userDbPath(username: string) {
  return path.join(DATA_ROOT, "users", username, "db.json");
}

function readUserDb(username: string): UserDbData {
  try {
    const raw = fs.readFileSync(userDbPath(username), "utf-8");
    const p = JSON.parse(raw);
    return {
      classes: p.classes || [],
      divisions: p.divisions || [],
      members: p.members || [],
      attendance: p.attendance || [],
      counters: p.counters || { classes: 0, divisions: 0, members: 0, attendance: 0 },
    };
  } catch {
    return {
      classes: [], divisions: [], members: [], attendance: [],
      counters: { classes: 0, divisions: 0, members: 0, attendance: 0 },
    };
  }
}

function writeUserDb(username: string, data: UserDbData) {
  const dir = path.dirname(userDbPath(username));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(userDbPath(username), JSON.stringify(data, null, 2), "utf-8");
}

function nextId(counters: UserDbData["counters"], key: keyof UserDbData["counters"]): number {
  counters[key] = (counters[key] || 0) + 1;
  return counters[key];
}

// ─── Per-user storage class ──────────────────────────────────────────────────

export class UserStorage {
  constructor(private username: string) {}

  // Classes
  async getClasses() {
    const db = readUserDb(this.username);
    return db.classes.map((cls) => ({
      ...cls,
      divisions: db.divisions.filter((d) => d.classId === cls.id),
    }));
  }

  async createClass(data: { name: string }) {
    const db = readUserDb(this.username);
    const item = { id: nextId(db.counters, "classes"), name: data.name };
    db.classes.push(item);
    writeUserDb(this.username, db);
    return item;
  }

  async updateClass(id: number, data: { name: string }) {
    const db = readUserDb(this.username);
    const item = db.classes.find((c) => c.id === id);
    if (!item) throw new Error("Not found");
    item.name = data.name;
    writeUserDb(this.username, db);
    return item;
  }

  async deleteClass(id: number) {
    const db = readUserDb(this.username);
    const divIds = db.divisions.filter((d) => d.classId === id).map((d) => d.id);
    const memberIds = db.members.filter((m) => divIds.includes(m.divisionId)).map((m) => m.id);
    db.attendance = db.attendance.filter((a) => !memberIds.includes(a.memberId));
    db.members = db.members.filter((m) => !divIds.includes(m.divisionId));
    db.divisions = db.divisions.filter((d) => d.classId !== id);
    db.classes = db.classes.filter((c) => c.id !== id);
    writeUserDb(this.username, db);
  }

  // Divisions
  async createDivision(data: { name: string; classId: number }) {
    const db = readUserDb(this.username);
    const item = { id: nextId(db.counters, "divisions"), name: data.name, classId: data.classId };
    db.divisions.push(item);
    writeUserDb(this.username, db);
    return item;
  }

  async updateDivision(id: number, data: { name: string }) {
    const db = readUserDb(this.username);
    const item = db.divisions.find((d) => d.id === id);
    if (!item) throw new Error("Not found");
    item.name = data.name;
    writeUserDb(this.username, db);
    return item;
  }

  async deleteDivision(id: number) {
    const db = readUserDb(this.username);
    const memberIds = db.members.filter((m) => m.divisionId === id).map((m) => m.id);
    db.attendance = db.attendance.filter((a) => !memberIds.includes(a.memberId));
    db.members = db.members.filter((m) => m.divisionId !== id);
    db.divisions = db.divisions.filter((d) => d.id !== id);
    writeUserDb(this.username, db);
  }

  // Members
  async getMembers(divisionId?: number, search?: string) {
    const db = readUserDb(this.username);
    let list = db.members;
    if (divisionId) list = list.filter((m) => m.divisionId === divisionId);
    if (search) list = list.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));
    return list.map((m) => {
      const div = db.divisions.find((d) => d.id === m.divisionId)!;
      const cls = db.classes.find((c) => c.id === div?.classId)!;
      return { ...m, division: { ...div, class: cls } };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }

  async createMember(data: { name: string; type: string; divisionId: number; active?: boolean }) {
    const db = readUserDb(this.username);
    const item = {
      id: nextId(db.counters, "members"),
      name: data.name,
      type: data.type ?? "Student",
      divisionId: data.divisionId,
      active: data.active ?? true,
    };
    db.members.push(item);
    writeUserDb(this.username, db);
    return item;
  }

  async updateMember(id: number, data: Partial<{ name: string; type: string; divisionId: number; active: boolean }>) {
    const db = readUserDb(this.username);
    const item = db.members.find((m) => m.id === id);
    if (!item) throw new Error("Not found");
    Object.assign(item, data);
    writeUserDb(this.username, db);
    return item;
  }

  async deleteMember(id: number) {
    const db = readUserDb(this.username);
    db.attendance = db.attendance.filter((a) => a.memberId !== id);
    db.members = db.members.filter((m) => m.id !== id);
    writeUserDb(this.username, db);
  }

  // Attendance
  async getAttendance(date: string, divisionId?: number) {
    const db = readUserDb(this.username);
    let memberIds: number[] | undefined;
    if (divisionId) {
      memberIds = db.members.filter((m) => m.divisionId === divisionId).map((m) => m.id);
      if (memberIds.length === 0) return [];
    }
    return db.attendance.filter((a) => {
      if (a.date !== date) return false;
      if (memberIds && !memberIds.includes(a.memberId)) return false;
      return true;
    });
  }

  async getAttendanceSummary(date: string) {
    const db = readUserDb(this.username);
    const dayAtt = db.attendance.filter((a) => a.date === date);
    const byClass = db.classes.map((cls) => {
      const divIds = db.divisions.filter((d) => d.classId === cls.id).map((d) => d.id);
      const memberIds = db.members.filter((m) => divIds.includes(m.divisionId)).map((m) => m.id);
      const records = dayAtt.filter((a) => memberIds.includes(a.memberId));
      return {
        classId: cls.id,
        className: cls.name,
        offering: records.reduce((s, r) => s + (parseFloat(r.offering || "0") || 0), 0),
        present: records.filter((r) => r.present).length,
      };
    }).filter((c) => {
      const divIds = db.divisions.filter((d) => d.classId === c.classId).map((d) => d.id);
      const memberIds = db.members.filter((m) => divIds.includes(m.divisionId)).map((m) => m.id);
      return db.attendance.some((a) => a.date === date && memberIds.includes(a.memberId));
    });

    return {
      totalOffering: byClass.reduce((s, c) => s + c.offering, 0),
      totalPresent: byClass.reduce((s, c) => s + c.present, 0),
      byClass,
    };
  }

  async batchUpdateAttendance(data: { date: string; records: { memberId: number; present: boolean; offering: number | null }[] }) {
    const db = readUserDb(this.username);
    const results = [];
    for (const record of data.records) {
      const existing = db.attendance.find((a) => a.memberId === record.memberId && a.date === data.date);
      if (existing) {
        existing.present = record.present;
        existing.offering = record.offering != null ? record.offering.toString() : null;
        results.push({ ...existing });
      } else {
        const item = {
          id: nextId(db.counters, "attendance"),
          memberId: record.memberId,
          date: data.date,
          present: record.present,
          offering: record.offering != null ? record.offering.toString() : null,
        };
        db.attendance.push(item);
        results.push({ ...item });
      }
    }
    writeUserDb(this.username, db);
    return results;
  }

  async getMemberStats(startDate?: string, endDate?: string) {
    const db = readUserDb(this.username);
    let dayAtt = db.attendance;
    if (startDate) dayAtt = dayAtt.filter((a) => a.date >= startDate);
    if (endDate) dayAtt = dayAtt.filter((a) => a.date <= endDate);
    return db.members.map((m) => {
      const div = db.divisions.find((d) => d.id === m.divisionId)!;
      const cls = db.classes.find((c) => c.id === div?.classId)!;
      const records = dayAtt.filter((a) => a.memberId === m.id);
      const totalPresent = records.filter((r) => r.present).length;
      const totalOffering = records.reduce((s, r) => s + (parseFloat(r.offering || "0") || 0), 0);
      return {
        memberId: m.id,
        memberName: m.name,
        type: m.type,
        className: cls?.name || "",
        divisionName: div?.name || "",
        totalPresent,
        totalOffering,
        totalDays: records.length,
        attendancePercentage: records.length > 0 ? Math.round((totalPresent / records.length) * 100) : 0,
      };
    }).sort((a, b) => a.memberName.localeCompare(b.memberName));
  }

  // Seed demo data with realistic attendance records
  async seedDemo() {
    const db = readUserDb(this.username);
    if (db.classes.length > 0) return;

    // Classes
    const begId = nextId(db.counters, "classes");
    const priId = nextId(db.counters, "classes");
    const junId = nextId(db.counters, "classes");
    db.classes.push(
      { id: begId, name: "Beginner" },
      { id: priId, name: "Primary" },
      { id: junId, name: "Junior" }
    );

    // Divisions
    const divA = nextId(db.counters, "divisions"); // Beginner - Section A
    const divB = nextId(db.counters, "divisions"); // Beginner - Section B
    const divC = nextId(db.counters, "divisions"); // Primary - Section A
    const divD = nextId(db.counters, "divisions"); // Junior - Section A
    db.divisions.push(
      { id: divA, name: "Section A", classId: begId },
      { id: divB, name: "Section B", classId: begId },
      { id: divC, name: "Section A", classId: priId },
      { id: divD, name: "Section A", classId: junId }
    );

    // Members (IDs 1-11)
    const memberDefs = [
      { name: "John Doe",       type: "Student", divisionId: divA },
      { name: "Mary Grace",     type: "Student", divisionId: divA },
      { name: "James Brown",    type: "Teacher", divisionId: divA },
      { name: "Anna Lee",       type: "Student", divisionId: divB },
      { name: "Peter Kim",      type: "Student", divisionId: divB },
      { name: "Sarah Johnson",  type: "Teacher", divisionId: divB },
      { name: "David Wilson",   type: "Student", divisionId: divC },
      { name: "Lucy Chen",      type: "Student", divisionId: divC },
      { name: "Michael Park",   type: "Teacher", divisionId: divC },
      { name: "Emily Davis",    type: "Student", divisionId: divD },
      { name: "Thomas Moore",   type: "Student", divisionId: divD },
    ];
    const memberIds: number[] = [];
    for (const m of memberDefs) {
      const id = nextId(db.counters, "members");
      memberIds.push(id);
      db.members.push({ id, active: true, ...m });
    }

    // Six past Sundays of attendance (realistic patterns)
    // memberIds: [0]=John,[1]=Mary,[2]=James,[3]=Anna,[4]=Peter,[5]=Sarah,
    //            [6]=David,[7]=Lucy,[8]=Michael,[9]=Emily,[10]=Thomas
    const sundays = [
      "2026-06-08",
      "2026-06-01",
      "2026-05-25",
      "2026-05-18",
      "2026-05-11",
      "2026-05-04",
    ];

    // present[memberIndex][sundayIndex] = true/false
    const presentGrid = [
      //  Jun8   Jun1   May25  May18  May11  May4
      [true,  true,  true,  true,  false, true ],  // John Doe
      [true,  true,  false, true,  true,  true ],  // Mary Grace
      [true,  true,  true,  true,  true,  true ],  // James Brown (teacher - always present)
      [false, true,  true,  false, true,  true ],  // Anna Lee
      [true,  true,  false, true,  false, false],  // Peter Kim
      [true,  true,  true,  true,  true,  false],  // Sarah Johnson
      [true,  false, true,  true,  true,  true ],  // David Wilson
      [false, true,  true,  true,  false, true ],  // Lucy Chen
      [true,  true,  true,  true,  true,  true ],  // Michael Park (teacher)
      [true,  true,  true,  false, true,  false],  // Emily Davis
      [false, false, true,  true,  true,  true ],  // Thomas Moore
    ];

    // offerings[memberIndex][sundayIndex]
    const offeringGrid = [
      [5,    5,    10,   5,    0,    5   ],  // John Doe
      [10,   5,    0,    5,    10,   5   ],  // Mary Grace
      [20,   20,   20,   15,   20,   20  ],  // James Brown
      [0,    5,    5,    0,    5,    5   ],  // Anna Lee
      [5,    10,   0,    5,    0,    0   ],  // Peter Kim
      [15,   15,   10,   15,   20,   0   ],  // Sarah Johnson
      [10,   0,    10,   10,   10,   10  ],  // David Wilson
      [0,    5,    5,    5,    0,    5   ],  // Lucy Chen
      [25,   25,   20,   25,   25,   25  ],  // Michael Park
      [5,    10,   5,    0,    5,    0   ],  // Emily Davis
      [0,    0,    5,    5,    5,    10  ],  // Thomas Moore
    ];

    for (let si = 0; si < sundays.length; si++) {
      const date = sundays[si];
      for (let mi = 0; mi < memberIds.length; mi++) {
        const present = presentGrid[mi][si];
        const offering = offeringGrid[mi][si];
        db.attendance.push({
          id: nextId(db.counters, "attendance"),
          memberId: memberIds[mi],
          date,
          present,
          offering: offering > 0 ? offering.toString() : null,
        });
      }
    }

    writeUserDb(this.username, db);
  }
}

// Helper: get storage for authenticated user (keyed by username)
export function storageFor(username: string): UserStorage {
  return new UserStorage(username);
}
