import { pgTable, text, boolean, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const neighbourhoodEnum = pgEnum("neighbourhood", [
  "westlands", "kilimani", "karen", "hurlingham", "cbd", "other"
]);

export const subscriptionPlanEnum = pgEnum("subscription_plan", [
  "starter", "professional", "enterprise"
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active", "trial", "suspended"
]);

export const restaurantsTable = pgTable("restaurants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  neighbourhood: neighbourhoodEnum("neighbourhood").notNull().default("westlands"),
  phone: text("phone").notNull(),
  email: text("email").notNull().unique(),
  logoUrl: text("logo_url"),
  description: text("description"),
  openingTime: text("opening_time").notNull().default("12:00"),
  closingTime: text("closing_time").notNull().default("23:00"),
  slotDurationMinutes: integer("slot_duration_minutes").notNull().default(30),
  turnTimeMinutes: integer("turn_time_minutes").notNull().default(90),
  currency: text("currency").notNull().default("KES"),
  depositRequired: boolean("deposit_required").notNull().default(false),
  depositAmountKes: integer("deposit_amount_kes"),
  depositPeakSlotsOnly: boolean("deposit_peak_slots_only").notNull().default(true),
  peakSlots: text("peak_slots").array().notNull().default([]),
  subscriptionPlan: subscriptionPlanEnum("subscription_plan").notNull().default("starter"),
  subscriptionStatus: subscriptionStatusEnum("subscription_status").notNull().default("trial"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertRestaurantSchema = createInsertSchema(restaurantsTable).omit({
  id: true, createdAt: true, updatedAt: true,
});

export type Restaurant = typeof restaurantsTable.$inferSelect;
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;
