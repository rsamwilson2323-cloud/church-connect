import { pgTable, text, serial, integer, boolean, date, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === CLASSES ===
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., Beginner, Primary, Junior
});

export const classesRelations = relations(classes, ({ many }) => ({
  divisions: many(divisions),
}));

export const insertClassSchema = createInsertSchema(classes).omit({ id: true });
export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;

// === DIVISIONS ===
export const divisions = pgTable("divisions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., Division A, Division B
  classId: integer("class_id").notNull().references(() => classes.id),
});

export const divisionsRelations = relations(divisions, ({ one, many }) => ({
  class: one(classes, {
    fields: [divisions.classId],
    references: [classes.id],
  }),
  members: many(members),
}));

export const insertDivisionSchema = createInsertSchema(divisions).omit({ id: true });
export type Division = typeof divisions.$inferSelect;
export type InsertDivision = z.infer<typeof insertDivisionSchema>;

// === MEMBERS ===
export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default("Student"), // Student, Teacher
  divisionId: integer("division_id").notNull().references(() => divisions.id),
  active: boolean("active").notNull().default(true),
});

export const membersRelations = relations(members, ({ one, many }) => ({
  division: one(divisions, {
    fields: [members.divisionId],
    references: [divisions.id],
  }),
  attendance: many(attendance),
}));

export const insertMemberSchema = createInsertSchema(members).omit({ id: true });
export type Member = typeof members.$inferSelect;
export type InsertMember = z.infer<typeof insertMemberSchema>;

// === ATTENDANCE & OFFERING ===
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull().references(() => members.id),
  date: text("date").notNull(), // YYYY-MM-DD
  present: boolean("present").notNull().default(false),
  offering: numeric("offering").default("0"),
});

export const attendanceRelations = relations(attendance, ({ one }) => ({
  member: one(members, {
    fields: [attendance.memberId],
    references: [members.id],
  }),
}));

export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true });
export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;

// === USERS (local auth) ===
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // bcrypt hash
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// === API CONTRACT TYPES ===

// Responses
export type ClassWithDivisions = Class & { divisions: Division[] };
export type MemberWithDetails = Member & { division: Division & { class: Class } };

// Attendance Batch Input
export const attendanceBatchSchema = z.object({
  date: z.string(),
  records: z.array(z.object({
    memberId: z.number(),
    present: z.boolean(),
    offering: z.coerce.number().optional(),
  })),
});
export type AttendanceBatchRequest = z.infer<typeof attendanceBatchSchema>;

// Reports
export type ReportQuery = {
  startDate: string;
  endDate: string;
};

export type MemberStats = {
  memberId: number;
  memberName: string;
  type: string;
  className: string;
  divisionName: string;
  totalPresent: number;
  totalOffering: number;
  attendancePercentage: number;
};
