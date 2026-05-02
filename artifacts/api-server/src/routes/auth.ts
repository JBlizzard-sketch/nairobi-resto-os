import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { staffTable, restaurantsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { generateId } from "../lib/ids";
import { requireAuth, signToken } from "../middlewares/auth";

const router = Router();

router.post("/register", async (req, res) => {
  const { restaurantName, location, ownerName, email, password, phone } = req.body;

  if (!restaurantName || !location || !ownerName || !email || !password || !phone) {
    res.status(400).json({ error: "validation_error", message: "All fields are required" });
    return;
  }

  const existing = await db.select().from(staffTable).where(eq(staffTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "conflict", message: "Email already registered" });
    return;
  }

  const restaurantId = generateId("rst");
  const staffId = generateId("usr");
  const passwordHash = await bcrypt.hash(password, 10);

  const [restaurant] = await db.insert(restaurantsTable).values({
    id: restaurantId,
    name: restaurantName,
    location,
    email,
    phone,
    neighbourhood: "westlands",
    openingTime: "12:00",
    closingTime: "23:00",
    slotDurationMinutes: 30,
    turnTimeMinutes: 90,
    currency: "KES",
    depositRequired: false,
    depositPeakSlotsOnly: true,
    peakSlots: ["19:00", "19:30", "20:00", "20:30"],
    subscriptionPlan: "starter" as const,
    subscriptionStatus: "trial" as const,
  }).returning();

  const [staff] = await db.insert(staffTable).values({
    id: staffId,
    restaurantId,
    name: ownerName,
    email,
    passwordHash,
    role: "owner",
    phone,
    isActive: true,
  }).returning();

  const token = signToken({ userId: staff.id, restaurantId, role: staff.role });
  const { passwordHash: _, ...safeStaff } = staff;

  res.status(201).json({ token, user: safeStaff, restaurant });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "validation_error", message: "Email and password are required" });
    return;
  }

  const [staff] = await db.select().from(staffTable).where(eq(staffTable.email, email)).limit(1);

  if (!staff || !staff.isActive) {
    res.status(401).json({ error: "unauthorized", message: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, staff.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "unauthorized", message: "Invalid credentials" });
    return;
  }

  const [restaurant] = await db.select().from(restaurantsTable)
    .where(eq(restaurantsTable.id, staff.restaurantId)).limit(1);

  const token = signToken({ userId: staff.id, restaurantId: staff.restaurantId, role: staff.role });
  const { passwordHash: _, ...safeStaff } = staff;

  res.json({ token, user: safeStaff, restaurant });
});

router.post("/logout", (_req, res) => {
  res.json({ message: "Logged out successfully" });
});

router.get("/me", requireAuth, async (req, res) => {
  const [staff] = await db.select().from(staffTable)
    .where(eq(staffTable.id, req.auth!.userId)).limit(1);

  if (!staff) {
    res.status(401).json({ error: "unauthorized", message: "User not found" });
    return;
  }

  const { passwordHash: _, ...safeStaff } = staff;
  res.json(safeStaff);
});

export default router;
