import { Router } from "express";
import { db } from "@workspace/db";
import { reservationsTable, tablesTable, guestsTable } from "@workspace/db";
import { eq, and, gte, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.use(requireAuth);

router.get("/tonight", async (req, res) => {
  const restaurantId = req.auth!.restaurantId;
  const today = new Date().toISOString().split("T")[0];
  const now = new Date();
  const inNextHour = new Date(now.getTime() + 60 * 60 * 1000);

  const reservations = await db.select({
    reservation: reservationsTable,
    table: tablesTable,
    guest: guestsTable,
  })
    .from(reservationsTable)
    .leftJoin(tablesTable, eq(reservationsTable.tableId, tablesTable.id))
    .leftJoin(guestsTable, eq(reservationsTable.guestId, guestsTable.id))
    .where(and(
      eq(reservationsTable.restaurantId, restaurantId),
      eq(reservationsTable.date, today)
    ));

  const mapped = reservations.map(r => ({ ...r.reservation, table: r.table, guest: r.guest }));

  const active = mapped.filter(r => !["cancelled"].includes(r.status));
  const tables = await db.select().from(tablesTable)
    .where(and(eq(tablesTable.restaurantId, restaurantId), eq(tablesTable.isActive, true)));

  const alerts = [];

  for (const r of active) {
    if (r.guest?.allergies) {
      alerts.push({
        type: "allergy" as const,
        message: `${r.guestName} has allergy: ${r.guest.allergies}`,
        reservationId: r.id,
      });
    }
    if (r.guest?.isVip) {
      alerts.push({
        type: "vip_arrival" as const,
        message: `VIP guest ${r.guestName} arriving at ${r.time}`,
        reservationId: r.id,
      });
    }
    if (r.depositRequired && !r.depositPaid) {
      alerts.push({
        type: "deposit_missing" as const,
        message: `Deposit not collected for ${r.guestName} (${r.time})`,
        reservationId: r.id,
      });
    }
  }

  const currentTime = now.toTimeString().slice(0, 5);
  const upcomingArrivals = active
    .filter(r => r.status === "confirmed" && r.time >= currentTime)
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(0, 8);

  res.json({
    date: today,
    totalCovers: active.reduce((sum, r) => sum + r.partySize, 0),
    confirmed: mapped.filter(r => r.status === "confirmed").length,
    seated: mapped.filter(r => r.status === "seated").length,
    completed: mapped.filter(r => r.status === "completed").length,
    noShows: mapped.filter(r => r.status === "no_show").length,
    cancelled: mapped.filter(r => r.status === "cancelled").length,
    availableTables: tables.filter(t => t.status === "available").length,
    occupiedTables: tables.filter(t => ["seated", "reserved"].includes(t.status)).length,
    totalTables: tables.length,
    depositsCollectedKes: active.filter(r => r.depositPaid).reduce((sum, r) => sum + (r.depositAmountKes || 0), 0),
    depositsExpectedKes: active.filter(r => r.depositRequired).reduce((sum, r) => sum + (r.depositAmountKes || 0), 0),
    preOrdersPending: active.filter(r => r.hasPreOrder && r.status !== "completed").length,
    preOrdersConfirmed: active.filter(r => r.hasPreOrder && r.status === "confirmed").length,
    alerts: alerts.slice(0, 10),
    upcomingArrivals,
  });
});

router.get("/analytics", async (req, res) => {
  const restaurantId = req.auth!.restaurantId;
  const days = Number(req.query.days) || 30;

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceDate = since.toISOString().split("T")[0];

  const reservations = await db.select().from(reservationsTable)
    .where(and(
      eq(reservationsTable.restaurantId, restaurantId),
      gte(reservationsTable.date, sinceDate)
    ));

  const completed = reservations.filter(r => !["cancelled"].includes(r.status));
  const totalCovers = completed.reduce((sum, r) => sum + r.partySize, 0);
  const avgCoversPerNight = days > 0 ? totalCovers / days : 0;
  const avgPartySize = completed.length > 0 ? totalCovers / completed.length : 0;
  const noShows = reservations.filter(r => r.status === "no_show").length;
  const noShowRate = reservations.length > 0 ? noShows / reservations.length : 0;
  const cancelled = reservations.filter(r => r.status === "cancelled").length;
  const cancellationRate = reservations.length > 0 ? cancelled / reservations.length : 0;

  const withDeposit = reservations.filter(r => r.depositRequired);
  const depositsPaid = withDeposit.filter(r => r.depositPaid);
  const depositConversionRate = withDeposit.length > 0 ? depositsPaid.length / withDeposit.length : 0;

  const totalDepositsCollectedKes = depositsPaid.reduce((sum, r) => sum + (r.depositAmountKes || 0), 0);

  const occasionCounts: Record<string, number> = {};
  for (const r of reservations) {
    if (r.occasion) {
      occasionCounts[r.occasion] = (occasionCounts[r.occasion] || 0) + 1;
    }
  }
  const topOccasions = Object.entries(occasionCounts)
    .map(([occasion, count]) => ({ occasion, count }))
    .sort((a, b) => b.count - a.count);

  const coversByDate: Record<string, number> = {};
  for (const r of completed) {
    coversByDate[r.date] = (coversByDate[r.date] || 0) + r.partySize;
  }
  const coversByDay = Object.entries(coversByDate)
    .map(([date, covers]) => ({ date, covers }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const sourceCounts: Record<string, number> = {};
  for (const r of reservations) {
    sourceCounts[r.source] = (sourceCounts[r.source] || 0) + 1;
  }
  const bookingsBySource = Object.entries(sourceCounts)
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  const timeCounts: Record<string, number> = {};
  for (const r of reservations) {
    timeCounts[r.time] = (timeCounts[r.time] || 0) + 1;
  }
  const peakBookingTimes = Object.entries(timeCounts)
    .map(([time, count]) => ({ time, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  res.json({
    periodDays: days,
    totalCovers,
    averageCoversPerNight: Math.round(avgCoversPerNight * 10) / 10,
    averagePartySize: Math.round(avgPartySize * 10) / 10,
    noShowRate: Math.round(noShowRate * 1000) / 1000,
    cancellationRate: Math.round(cancellationRate * 1000) / 1000,
    depositConversionRate: Math.round(depositConversionRate * 1000) / 1000,
    totalDepositsCollectedKes,
    topOccasions,
    coversByDay,
    bookingsBySource,
    peakBookingTimes,
  });
});

export default router;
