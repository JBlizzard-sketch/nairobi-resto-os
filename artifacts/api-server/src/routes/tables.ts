import { Router } from "express";
import { db } from "@workspace/db";
import { tablesTable, reservationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { generateId } from "../lib/ids";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.use(requireAuth);

router.get("/floor-map", async (req, res) => {
  const tables = await db.select().from(tablesTable)
    .where(and(
      eq(tablesTable.restaurantId, req.auth!.restaurantId),
      eq(tablesTable.isActive, true)
    ));

  const zones = [...new Set(tables.map(t => t.zone).filter(Boolean))] as string[];

  res.json({
    restaurantId: req.auth!.restaurantId,
    tables,
    zones,
    canvasWidth: 1200,
    canvasHeight: 800,
    updatedAt: new Date().toISOString(),
  });
});

router.put("/floor-map", async (req, res) => {
  const { tables, zones, canvasWidth, canvasHeight } = req.body;

  for (const t of tables) {
    await db.update(tablesTable)
      .set({
        positionX: t.positionX,
        positionY: t.positionY,
        width: t.width,
        height: t.height,
        zone: t.zone ?? null,
        updatedAt: new Date(),
      })
      .where(and(
        eq(tablesTable.id, t.id),
        eq(tablesTable.restaurantId, req.auth!.restaurantId)
      ));
  }

  const updatedTables = await db.select().from(tablesTable)
    .where(and(
      eq(tablesTable.restaurantId, req.auth!.restaurantId),
      eq(tablesTable.isActive, true)
    ));

  res.json({
    restaurantId: req.auth!.restaurantId,
    tables: updatedTables,
    zones: zones || [],
    canvasWidth: canvasWidth || 1200,
    canvasHeight: canvasHeight || 800,
    updatedAt: new Date().toISOString(),
  });
});

router.get("/availability", async (req, res) => {
  const { date, time, partySize } = req.query as { date: string; time: string; partySize: string };
  const restaurantId = req.auth!.restaurantId;

  const allTables = await db.select().from(tablesTable)
    .where(and(
      eq(tablesTable.restaurantId, restaurantId),
      eq(tablesTable.isActive, true)
    ));

  const eligibleTables = allTables.filter(t => t.capacity >= Number(partySize));

  const reservedTableIds = (await db.select({ tableId: reservationsTable.tableId })
    .from(reservationsTable)
    .where(and(
      eq(reservationsTable.restaurantId, restaurantId),
      eq(reservationsTable.date, date),
      eq(reservationsTable.time, time)
    )))
    .map(r => r.tableId)
    .filter(Boolean);

  const availableTables = eligibleTables.filter(t => !reservedTableIds.includes(t.id));

  res.json({
    date,
    time,
    partySize: Number(partySize),
    availableTables,
    isFullyBooked: availableTables.length === 0,
  });
});

router.get("/", async (req, res) => {
  const tables = await db.select().from(tablesTable)
    .where(eq(tablesTable.restaurantId, req.auth!.restaurantId));
  res.json(tables);
});

router.post("/", async (req, res) => {
  const [table] = await db.insert(tablesTable).values({
    id: generateId("tbl"),
    restaurantId: req.auth!.restaurantId,
    ...req.body,
  }).returning();

  res.status(201).json(table);
});

router.put("/:tableId", async (req, res) => {
  const [updated] = await db.update(tablesTable)
    .set({ ...req.body, updatedAt: new Date() })
    .where(and(
      eq(tablesTable.id, req.params.tableId),
      eq(tablesTable.restaurantId, req.auth!.restaurantId)
    ))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "not_found", message: "Table not found" });
    return;
  }

  res.json(updated);
});

router.delete("/:tableId", async (req, res) => {
  await db.update(tablesTable)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(
      eq(tablesTable.id, req.params.tableId),
      eq(tablesTable.restaurantId, req.auth!.restaurantId)
    ));

  res.json({ message: "Table removed" });
});

router.put("/:tableId/status", async (req, res) => {
  const { status, notes } = req.body;

  const [updated] = await db.update(tablesTable)
    .set({ status, notes, updatedAt: new Date() })
    .where(and(
      eq(tablesTable.id, req.params.tableId),
      eq(tablesTable.restaurantId, req.auth!.restaurantId)
    ))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "not_found", message: "Table not found" });
    return;
  }

  res.json(updated);
});

export default router;
