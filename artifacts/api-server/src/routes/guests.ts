import { Router } from "express";
import { db } from "@workspace/db";
import { guestsTable, reservationsTable } from "@workspace/db";
import { eq, and, ilike, or } from "drizzle-orm";
import { generateId } from "../lib/ids";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  const { search, vip } = req.query as Record<string, string>;
  const restaurantId = req.auth!.restaurantId;

  let guests = await db.select().from(guestsTable)
    .where(eq(guestsTable.restaurantId, restaurantId));

  if (vip === "true") guests = guests.filter(g => g.isVip);
  if (search) {
    const q = search.toLowerCase();
    guests = guests.filter(g =>
      g.name.toLowerCase().includes(q) || g.phone.includes(q)
    );
  }

  res.json(guests);
});

router.post("/", async (req, res) => {
  const [guest] = await db.insert(guestsTable).values({
    id: generateId("gst"),
    restaurantId: req.auth!.restaurantId,
    visitCount: 0,
    loyaltyPoints: 0,
    isVip: false,
    ...req.body,
  }).returning();

  res.status(201).json(guest);
});

router.get("/:guestId", async (req, res) => {
  const [guest] = await db.select().from(guestsTable)
    .where(and(
      eq(guestsTable.id, req.params.guestId),
      eq(guestsTable.restaurantId, req.auth!.restaurantId)
    )).limit(1);

  if (!guest) {
    res.status(404).json({ error: "not_found", message: "Guest not found" });
    return;
  }

  const reservationHistory = await db.select().from(reservationsTable)
    .where(and(
      eq(reservationsTable.guestId, req.params.guestId),
      eq(reservationsTable.restaurantId, req.auth!.restaurantId)
    ));

  res.json({ ...guest, reservationHistory });
});

router.put("/:guestId", async (req, res) => {
  const [updated] = await db.update(guestsTable)
    .set({ ...req.body, updatedAt: new Date() })
    .where(and(
      eq(guestsTable.id, req.params.guestId),
      eq(guestsTable.restaurantId, req.auth!.restaurantId)
    ))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "not_found", message: "Guest not found" });
    return;
  }

  res.json(updated);
});

export default router;
