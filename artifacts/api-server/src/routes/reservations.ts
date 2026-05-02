import { Router } from "express";
import { db } from "@workspace/db";
import { reservationsTable, tablesTable, guestsTable } from "@workspace/db";
import { eq, and, ilike, or } from "drizzle-orm";
import { generateId } from "../lib/ids";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.use(requireAuth);

router.get("/tonight", async (req, res) => {
  const restaurantId = req.auth!.restaurantId;
  const today = new Date().toISOString().split("T")[0];

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

  const mapped = reservations.map(r => ({
    ...r.reservation,
    table: r.table,
    guest: r.guest,
  }));

  const active = mapped.filter(r => !["cancelled"].includes(r.status));
  const totalCovers = active.reduce((sum, r) => sum + r.partySize, 0);

  const statsByStatus = mapped.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const depositsCollected = mapped
    .filter(r => r.depositPaid && r.depositAmountKes)
    .reduce((sum, r) => sum + (r.depositAmountKes || 0), 0);

  const depositsExpected = mapped
    .filter(r => r.depositRequired && r.depositAmountKes)
    .reduce((sum, r) => sum + (r.depositAmountKes || 0), 0);

  const depositsPending = depositsExpected - depositsCollected;

  res.json({
    date: today,
    totalCovers,
    reservations: mapped,
    statsByStatus,
    depositsSummary: {
      collected: depositsCollected,
      expected: depositsExpected,
      pending: Math.max(0, depositsPending),
    },
  });
});

router.get("/", async (req, res) => {
  const { date, status, tableId, search } = req.query as Record<string, string>;
  const restaurantId = req.auth!.restaurantId;

  let query = db.select({
    reservation: reservationsTable,
    table: tablesTable,
    guest: guestsTable,
  })
    .from(reservationsTable)
    .leftJoin(tablesTable, eq(reservationsTable.tableId, tablesTable.id))
    .leftJoin(guestsTable, eq(reservationsTable.guestId, guestsTable.id));

  const conditions = [eq(reservationsTable.restaurantId, restaurantId)];

  if (date) conditions.push(eq(reservationsTable.date, date));
  if (status) conditions.push(eq(reservationsTable.status, status as any));
  if (tableId) conditions.push(eq(reservationsTable.tableId, tableId));

  const results = await query.where(and(...conditions));

  let mapped = results.map(r => ({ ...r.reservation, table: r.table, guest: r.guest }));

  if (search) {
    const q = search.toLowerCase();
    mapped = mapped.filter(r =>
      r.guestName.toLowerCase().includes(q) ||
      r.guestPhone.includes(q)
    );
  }

  res.json(mapped);
});

router.post("/", async (req, res) => {
  const reservation = {
    id: generateId("rsv"),
    restaurantId: req.auth!.restaurantId,
    ...req.body,
  };

  const [created] = await db.insert(reservationsTable).values(reservation).returning();

  const [withRelations] = await db.select({
    reservation: reservationsTable,
    table: tablesTable,
    guest: guestsTable,
  })
    .from(reservationsTable)
    .leftJoin(tablesTable, eq(reservationsTable.tableId, tablesTable.id))
    .leftJoin(guestsTable, eq(reservationsTable.guestId, guestsTable.id))
    .where(eq(reservationsTable.id, created.id));

  res.status(201).json({ ...withRelations.reservation, table: withRelations.table, guest: withRelations.guest });
});

router.get("/:reservationId", async (req, res) => {
  const [result] = await db.select({
    reservation: reservationsTable,
    table: tablesTable,
    guest: guestsTable,
  })
    .from(reservationsTable)
    .leftJoin(tablesTable, eq(reservationsTable.tableId, tablesTable.id))
    .leftJoin(guestsTable, eq(reservationsTable.guestId, guestsTable.id))
    .where(and(
      eq(reservationsTable.id, req.params.reservationId),
      eq(reservationsTable.restaurantId, req.auth!.restaurantId)
    )).limit(1);

  if (!result) {
    res.status(404).json({ error: "not_found", message: "Reservation not found" });
    return;
  }

  res.json({ ...result.reservation, table: result.table, guest: result.guest });
});

router.put("/:reservationId", async (req, res) => {
  const [updated] = await db.update(reservationsTable)
    .set({ ...req.body, updatedAt: new Date() })
    .where(and(
      eq(reservationsTable.id, req.params.reservationId),
      eq(reservationsTable.restaurantId, req.auth!.restaurantId)
    ))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "not_found", message: "Reservation not found" });
    return;
  }

  res.json(updated);
});

router.delete("/:reservationId", async (req, res) => {
  await db.update(reservationsTable)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(and(
      eq(reservationsTable.id, req.params.reservationId),
      eq(reservationsTable.restaurantId, req.auth!.restaurantId)
    ));

  res.json({ message: "Reservation cancelled" });
});

export default router;
