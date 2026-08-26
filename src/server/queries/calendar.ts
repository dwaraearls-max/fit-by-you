import "server-only";

import { prisma } from "@/lib/db";
import type { CalendarKind } from "@/lib/calendar";

export type CalendarEvent = {
  id: string;
  kind: CalendarKind;
  at: Date;
  /** Null for all-day entries such as a delivery date. */
  timed: boolean;
  title: string;
  detail: string | null;
  href: string;
  status?: string | null;
};

export async function calendarEvents(
  businessId: string,
  range: { start: Date; end: Date },
): Promise<CalendarEvent[]> {
  const window = { gte: range.start, lte: range.end };

  const [fittings, appointments, deliveries, measurements, reminders] =
    await Promise.all([
      prisma.fitting.findMany({
        where: { businessId, scheduledFor: window },
        select: {
          id: true,
          scheduledFor: true,
          status: true,
          durationMinutes: true,
          customer: { select: { fullName: true } },
          order: { select: { id: true, title: true } },
        },
      }),
      prisma.appointment.findMany({
        where: { businessId, scheduledFor: window },
        select: {
          id: true,
          scheduledFor: true,
          title: true,
          type: true,
          status: true,
          notes: true,
          customer: { select: { id: true, fullName: true } },
          order: { select: { id: true } },
        },
      }),
      prisma.order.findMany({
        where: {
          businessId,
          deliveryDate: window,
          status: { notIn: ["CANCELLED", "DELIVERED"] },
        },
        select: {
          id: true,
          title: true,
          deliveryDate: true,
          status: true,
          priority: true,
          customer: { select: { fullName: true } },
        },
      }),
      prisma.measurementSet.findMany({
        where: { businessId, measuredAt: window },
        select: {
          id: true,
          measuredAt: true,
          customerId: true,
          customer: { select: { fullName: true } },
          _count: { select: { values: true } },
        },
      }),
      prisma.paymentReminder.findMany({
        where: { businessId, createdAt: window, status: "PENDING" },
        select: {
          id: true,
          createdAt: true,
          customer: { select: { id: true, fullName: true } },
          order: { select: { title: true } },
        },
      }),
    ]);

  const events: CalendarEvent[] = [
    ...fittings.map((fitting) => ({
      id: `fitting-${fitting.id}`,
      kind: "FITTING" as const,
      at: fitting.scheduledFor,
      timed: true,
      title: `Fitting — ${fitting.customer.fullName}`,
      detail: `${fitting.order.title} · ${fitting.durationMinutes} min`,
      href: `/app/orders/${fitting.order.id}`,
      status: fitting.status,
    })),
    ...appointments.map((appointment) => ({
      id: `appointment-${appointment.id}`,
      kind: "APPOINTMENT" as const,
      at: appointment.scheduledFor,
      timed: true,
      title: appointment.title,
      detail:
        appointment.customer?.fullName ??
        appointment.notes ??
        appointment.type.toLowerCase(),
      href: appointment.order
        ? `/app/orders/${appointment.order.id}`
        : appointment.customer
          ? `/app/customers/${appointment.customer.id}`
          : "/app/calendar",
      status: appointment.status,
    })),
    ...deliveries.map((order) => ({
      id: `delivery-${order.id}`,
      kind: "DELIVERY" as const,
      at: order.deliveryDate!,
      timed: false,
      title: `Deliver ${order.title}`,
      detail: `${order.customer.fullName}${order.priority === "RUSH" ? " · Rush" : ""}`,
      href: `/app/orders/${order.id}`,
      status: order.status,
    })),
    ...measurements.map((set) => ({
      id: `measurement-${set.id}`,
      kind: "MEASUREMENT" as const,
      at: set.measuredAt,
      timed: false,
      title: `Measured ${set.customer.fullName}`,
      detail: `${set._count.values} measurements taken`,
      href: `/app/customers/${set.customerId}?tab=measurements`,
    })),
    ...reminders.map((reminder) => ({
      id: `reminder-${reminder.id}`,
      kind: "REMINDER" as const,
      at: reminder.createdAt,
      timed: false,
      title: `Chase ${reminder.customer.fullName}`,
      detail: reminder.order?.title ?? "Outstanding balance",
      href: "/app/payments",
    })),
  ];

  return events.sort((a, b) => a.at.getTime() - b.at.getTime());
}
