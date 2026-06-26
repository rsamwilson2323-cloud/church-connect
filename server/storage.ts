import { db } from "./db";
import {
  classes, divisions, members, attendance,
  type InsertClass, type InsertDivision, type InsertMember, type InsertAttendance,
  type AttendanceBatchRequest
} from "@shared/schema";
import { eq, and, sql, between, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Classes & Divisions
  getClasses(): Promise<(typeof classes.$inferSelect & { divisions: typeof divisions.$inferSelect[] })[]>;
  createClass(data: InsertClass): Promise<typeof classes.$inferSelect>;
  deleteClass(id: number): Promise<void>;
  createDivision(data: InsertDivision): Promise<typeof divisions.$inferSelect>;
  deleteDivision(id: number): Promise<void>;

  // Members
  getMembers(divisionId?: number, search?: string): Promise<(typeof members.$inferSelect & { division: typeof divisions.$inferSelect & { class: typeof classes.$inferSelect } })[]>;
  getMember(id: number): Promise<typeof members.$inferSelect | undefined>;
  createMember(data: InsertMember): Promise<typeof members.$inferSelect>;
  updateMember(id: number, data: Partial<InsertMember>): Promise<typeof members.$inferSelect>;
  deleteMember(id: number): Promise<void>;

  // Attendance
  getAttendance(date: string, divisionId?: number): Promise<typeof attendance.$inferSelect[]>;
  getAttendanceSummary(date: string): Promise<any>;
  batchUpdateAttendance(data: AttendanceBatchRequest): Promise<typeof attendance.$inferSelect[]>;
  
  // Reports
  getMemberStats(startDate?: string, endDate?: string): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  async getClasses() {
    return await db.query.classes.findMany({
      with: { divisions: true },
      orderBy: (classes, { asc }) => [asc(classes.name)]
    });
  }

  async createClass(data: InsertClass) {
    const [newClass] = await db.insert(classes).values(data).returning();
    return newClass;
  }

  async deleteClass(id: number) {
    await db.delete(divisions).where(eq(divisions.classId, id));
    await db.delete(classes).where(eq(classes.id, id));
  }

  async createDivision(data: InsertDivision) {
    const [newDiv] = await db.insert(divisions).values(data).returning();
    return newDiv;
  }

  async deleteDivision(id: number) {
    await db.delete(divisions).where(eq(divisions.id, id));
  }

  async getMembers(divisionId?: number, search?: string) {
    const conditions = [];
    if (divisionId) conditions.push(eq(members.divisionId, divisionId));
    if (search) conditions.push(sql`lower(${members.name}) like ${`%${search.toLowerCase()}%`}`);

    return await db.query.members.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: {
        division: {
          with: { class: true }
        }
      },
      orderBy: (members, { asc }) => [asc(members.name)]
    });
  }

  async getMember(id: number) {
    return await db.query.members.findFirst({
      where: eq(members.id, id)
    });
  }

  async createMember(data: InsertMember) {
    const [member] = await db.insert(members).values(data).returning();
    return member;
  }

  async updateMember(id: number, data: Partial<InsertMember>) {
    const [member] = await db.update(members).set(data).where(eq(members.id, id)).returning();
    return member;
  }

  async deleteMember(id: number) {
    await db.delete(attendance).where(eq(attendance.memberId, id));
    await db.delete(members).where(eq(members.id, id));
  }

  async getAttendance(date: string, divisionId?: number) {
    // If divisionId is provided, filter by members of that division
    let memberIds: number[] = [];
    if (divisionId) {
      const divMembers = await db.select({ id: members.id }).from(members).where(eq(members.divisionId, divisionId));
      memberIds = divMembers.map(m => m.id);
      if (memberIds.length === 0) return [];
    }

    const conditions = [eq(attendance.date, date)];
    if (divisionId) {
      conditions.push(sql`${attendance.memberId} IN ${memberIds}`);
    }

    return await db.select().from(attendance)
      .where(and(...conditions));
  }

  async getAttendanceSummary(date: string) {
    const records = await db.select({
      classId: classes.id,
      className: classes.name,
      offering: sql<number>`sum(${attendance.offering})::int`,
      present: sql<number>`count(case when ${attendance.present} = true then 1 end)::int`
    })
    .from(attendance)
    .innerJoin(members, eq(attendance.memberId, members.id))
    .innerJoin(divisions, eq(members.divisionId, divisions.id))
    .innerJoin(classes, eq(divisions.classId, classes.id))
    .where(eq(attendance.date, date))
    .groupBy(classes.id, classes.name);

    const totalOffering = records.reduce((acc, curr) => acc + (curr.offering || 0), 0);
    const totalPresent = records.reduce((acc, curr) => acc + (curr.present || 0), 0);

    return {
      totalOffering,
      totalPresent,
      byClass: records.map(r => ({ ...r, offering: r.offering || 0, present: r.present || 0 }))
    };
  }

  async batchUpdateAttendance(data: AttendanceBatchRequest) {
    const results = [];
    for (const record of data.records) {
      // Check existing
      const [existing] = await db.select().from(attendance).where(and(
        eq(attendance.memberId, record.memberId),
        eq(attendance.date, data.date)
      ));

      if (existing) {
        const [updated] = await db.update(attendance)
          .set({ present: record.present, offering: record.offering?.toString() ?? "0" })
          .where(eq(attendance.id, existing.id))
          .returning();
        results.push(updated);
      } else {
        const [inserted] = await db.insert(attendance).values({
          memberId: record.memberId,
          date: data.date,
          present: record.present,
          offering: record.offering?.toString() ?? "0"
        }).returning();
        results.push(inserted);
      }
    }
    return results;
  }

  async getMemberStats(startDate?: string, endDate?: string) {
    const dateCondition = startDate && endDate 
      ? and(gte(attendance.date, startDate), lte(attendance.date, endDate))
      : undefined;

    const stats = await db.select({
      memberId: members.id,
      memberName: members.name,
      type: members.type,
      className: classes.name,
      divisionName: divisions.name,
      totalPresent: sql<number>`count(case when ${attendance.present} = true then 1 end)::int`,
      totalOffering: sql<number>`sum(${attendance.offering})::int`,
      totalDays: sql<number>`count(${attendance.id})::int`
    })
    .from(members)
    .innerJoin(divisions, eq(members.divisionId, divisions.id))
    .innerJoin(classes, eq(divisions.classId, classes.id))
    .leftJoin(attendance, and(eq(members.id, attendance.memberId), dateCondition))
    .groupBy(members.id, members.name, members.type, classes.name, divisions.name);

    return stats.map(s => ({
      ...s,
      attendancePercentage: s.totalDays > 0 ? Math.round((s.totalPresent / s.totalDays) * 100) : 0,
      totalOffering: s.totalOffering || 0,
      totalPresent: s.totalPresent || 0
    }));
  }
}

export const storage = new DatabaseStorage();
