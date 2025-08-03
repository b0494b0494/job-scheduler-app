import { publicProcedure, router } from './trpc';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

export const appRouter = router({
  hello: publicProcedure
    .query(() => {
      return { message: 'Hello from tRPC!' };
    }),

  // Schedule API
  getSchedules: publicProcedure
    .query(async () => {
      return prisma.schedule.findMany();
    }),
  createSchedule: publicProcedure
    .input(z.object({
      title: z.string(),
      date: z.string(),
      description: z.string().optional(),
    }))
    .mutation(async (opts) => {
      const { input } = opts;
      const newSchedule = await prisma.schedule.create({
        data: {
          title: input.title,
          date: new Date(input.date),
          description: input.description,
        },
      });
      return newSchedule;
    }),
  updateSchedule: publicProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      date: z.string().optional(),
      description: z.string().optional(),
    }))
    .mutation(async (opts) => {
      const { input } = opts;
      const updatedSchedule = await prisma.schedule.update({
        where: { id: input.id },
        data: {
          title: input.title,
          date: input.date ? new Date(input.date) : undefined,
          description: input.description,
        },
      });
      return updatedSchedule;
    }),
  deleteSchedule: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async (opts) => {
      const { input } = opts;
      await prisma.schedule.delete({
        where: { id: input.id },
      });
      return { message: 'Schedule deleted' };
    }),

  // Feedback API
  getFeedbacks: publicProcedure
    .query(async () => {
      return prisma.feedback.findMany();
    }),
  createFeedback: publicProcedure
    .input(z.object({
      impression: z.string().optional(),
      attraction: z.string().optional(),
      concern: z.string().optional(),
      aspiration: z.string().optional(),
      next_step: z.string().optional(),
      other: z.string().optional(),
      scheduleId: z.number(),
    }))
    .mutation(async (opts) => {
      const { input } = opts;
      const newFeedback = await prisma.feedback.create({
        data: {
          impression: input.impression,
          attraction: input.attraction,
          concern: input.concern,
          aspiration: input.aspiration,
          next_step: input.next_step,
          other: input.other,
          scheduleId: input.scheduleId,
        },
      });
      return newFeedback;
    }),
  updateFeedback: publicProcedure
    .input(z.object({
      id: z.number(),
      impression: z.string().optional(),
      attraction: z.string().optional(),
      concern: z.string().optional(),
      aspiration: z.string().optional(),
      next_step: z.string().optional(),
      other: z.string().optional(),
      scheduleId: z.number().optional(),
    }))
    .mutation(async (opts) => {
      const { input } = opts;
      const updatedFeedback = await prisma.feedback.update({
        where: { id: input.id },
        data: {
          impression: input.impression,
          attraction: input.attraction,
          concern: input.concern,
          aspiration: input.aspiration,
          next_step: input.next_step,
          other: input.other,
          scheduleId: input.scheduleId,
        },
      });
      return updatedFeedback;
    }),
  deleteFeedback: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async (opts) => {
      const { input } = opts;
      await prisma.feedback.delete({
        where: { id: input.id },
      });
      return { message: 'Feedback deleted' };
    }),
});