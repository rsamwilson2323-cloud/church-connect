import { z } from 'zod';
import { 
  insertClassSchema, 
  insertDivisionSchema, 
  insertMemberSchema, 
  attendanceBatchSchema,
  classes, 
  divisions, 
  members, 
  attendance
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  classes: {
    list: {
      method: 'GET' as const,
      path: '/api/classes',
      responses: {
        200: z.array(z.custom<typeof classes.$inferSelect & { divisions: typeof divisions.$inferSelect[] }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/classes',
      input: insertClassSchema,
      responses: {
        201: z.custom<typeof classes.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/classes/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    }
  },
  divisions: {
    create: {
      method: 'POST' as const,
      path: '/api/divisions',
      input: insertDivisionSchema,
      responses: {
        201: z.custom<typeof divisions.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/divisions/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    }
  },
  members: {
    list: {
      method: 'GET' as const,
      path: '/api/members',
      input: z.object({
        divisionId: z.string().optional(),
        search: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof members.$inferSelect & { division: typeof divisions.$inferSelect & { class: typeof classes.$inferSelect } }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/members',
      input: insertMemberSchema,
      responses: {
        201: z.custom<typeof members.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/members/:id',
      input: insertMemberSchema.partial(),
      responses: {
        200: z.custom<typeof members.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/members/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    }
  },
  attendance: {
    get: {
      method: 'GET' as const,
      path: '/api/attendance',
      input: z.object({
        date: z.string(),
        divisionId: z.string().optional(), // Made optional to support fetching all for summary
      }),
      responses: {
        200: z.array(z.custom<typeof attendance.$inferSelect>()),
      },
    },
    summary: { // New endpoint for daily summary
      method: 'GET' as const,
      path: '/api/attendance/summary',
      input: z.object({
        date: z.string(),
      }),
      responses: {
        200: z.object({
          totalOffering: z.number(),
          totalPresent: z.number(),
          byClass: z.array(z.object({
            classId: z.number(),
            className: z.string(),
            offering: z.number(),
            present: z.number(),
          })),
        }),
      },
    },
    batch: {
      method: 'POST' as const,
      path: '/api/attendance/batch',
      input: attendanceBatchSchema,
      responses: {
        200: z.array(z.custom<typeof attendance.$inferSelect>()),
      },
    }
  },
  reports: {
    stats: {
      method: 'GET' as const,
      path: '/api/reports/stats',
      input: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.object({
          memberId: z.number(),
          memberName: z.string(),
          type: z.string(),
          className: z.string(),
          divisionName: z.string(),
          totalPresent: z.number(),
          totalOffering: z.number(),
          totalDays: z.number(),
          attendancePercentage: z.number(),
        })),
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
