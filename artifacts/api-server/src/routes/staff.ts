import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { staffTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { generateId } from "../lib/ids";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.use(requireAuth);

const safeStaff = (s: typeof staffTable.$inferSelect) => {
  const { passwordHash: _, ...safe } = s;
  return safe;
};

router.get("/", async (req, res) => {
  const staff = await db.select().from(staffTable)
    .where(eq(staffTable.restaurantId, req.auth!.restaurantId));
  res.json(staff.map(safeStaff));
});

router.post("/", async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400).json({ error: "validation_error", message: "Name, email, password, and role are required" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [staff] = await db.insert(staffTable).values({
    id: generateId("usr"),
    restaurantId: req.auth!.restaurantId,
    name,
    email,
    passwordHash,
    role,
    phone,
    isActive: true,
  }).returning();

  res.status(201).json(safeStaff(staff));
});

router.get("/:staffId", async (req, res) => {
  const [staff] = await db.select().from(staffTable)
    .where(and(
      eq(staffTable.id, req.params.staffId),
      eq(staffTable.restaurantId, req.auth!.restaurantId)
    )).limit(1);

  if (!staff) {
    res.status(404).json({ error: "not_found", message: "Staff member not found" });
    return;
  }

  res.json(safeStaff(staff));
});

router.put("/:staffId", async (req, res) => {
  const { password, ...rest } = req.body;
  const updates: Record<string, unknown> = { ...rest, updatedAt: new Date() };

  if (password) {
    updates.passwordHash = await bcrypt.hash(password, 10);
  }

  const [updated] = await db.update(staffTable)
    .set(updates)
    .where(and(
      eq(staffTable.id, req.params.staffId),
      eq(staffTable.restaurantId, req.auth!.restaurantId)
    ))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "not_found", message: "Staff member not found" });
    return;
  }

  res.json(safeStaff(updated));
});

router.delete("/:staffId", async (req, res) => {
  await db.delete(staffTable)
    .where(and(
      eq(staffTable.id, req.params.staffId),
      eq(staffTable.restaurantId, req.auth!.restaurantId)
    ));

  res.json({ message: "Staff member removed" });
});

export default router;
