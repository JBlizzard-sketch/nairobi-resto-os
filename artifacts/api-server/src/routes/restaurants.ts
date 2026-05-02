import { Router } from "express";
import { db } from "@workspace/db";
import { restaurantsTable, reservationsTable, tablesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.use(requireAuth);

router.get("/me", async (req, res) => {
  const [restaurant] = await db.select().from(restaurantsTable)
    .where(eq(restaurantsTable.id, req.auth!.restaurantId)).limit(1);

  if (!restaurant) {
    res.status(404).json({ error: "not_found", message: "Restaurant not found" });
    return;
  }

  res.json(restaurant);
});

router.put("/me", async (req, res) => {
  const [updated] = await db.update(restaurantsTable)
    .set({ ...req.body, updatedAt: new Date() })
    .where(eq(restaurantsTable.id, req.auth!.restaurantId))
    .returning();

  res.json(updated);
});

router.get("/me/stats", async (req, res) => {
  const restaurantId = req.auth!.restaurantId;
  const today = new Date().toISOString().split("T")[0];

  const reservations = await db.select().from(reservationsTable)
    .where(and(
      eq(reservationsTable.restaurantId, restaurantId),
      eq(reservationsTable.date, today)
    ));

  const tables = await db.select().from(tablesTable)
    .where(and(
      eq(tablesTable.restaurantId, restaurantId),
      eq(tablesTable.isActive, true)
    ));

  const tonightCovers = reservations.filter(r => !["cancelled", "no_show"].includes(r.status))
    .reduce((sum, r) => sum + r.partySize, 0);

  const confirmedReservations = reservations.filter(r => r.status === "confirmed").length;
  const pendingReservations = reservations.filter(r => r.status === "pending").length;
  const seatedGuests = reservations.filter(r => r.status === "seated")
    .reduce((sum, r) => sum + r.partySize, 0);

  const availableTables = tables.filter(t => t.status === "available").length;
  const occupiedTables = tables.filter(t => ["seated", "reserved"].includes(t.status)).length;

  const depositsCollectedKes = reservations
    .filter(r => r.depositPaid && r.depositAmountKes)
    .reduce((sum, r) => sum + (r.depositAmountKes || 0), 0);

  const depositsExpectedKes = reservations
    .filter(r => r.depositRequired && r.depositAmountKes)
    .reduce((sum, r) => sum + (r.depositAmountKes || 0), 0);

  const noShowCount = reservations.filter(r => r.status === "no_show").length;
  const preOrdersPending = reservations.filter(r => r.hasPreOrder && r.status !== "completed").length;

  res.json({
    tonightCovers,
    confirmedReservations,
    pendingReservations,
    seatedGuests,
    availableTables,
    occupiedTables,
    depositsCollectedKes,
    depositsExpectedKes,
    noShowCount,
    preOrdersPending,
  });
});

export default router;
