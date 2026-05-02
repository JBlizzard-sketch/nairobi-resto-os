import { pgTable, text, boolean, integer, timestamp, pgEnum, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { restaurantsTable } from "./restaurants";

export const loyaltyTierEnum = pgEnum("loyalty_tier", ["regular", "preferred", "vip"]);

export const guestsTable = pgTable("guests", {
  id: text("id").primaryKey(),
  restaurantId: text("restaurant_id").notNull().references(() => restaurantsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  whatsapp: text("whatsapp"),
  email: text("email"),
  dietaryNotes: text("dietary_notes"),
  allergies: text("allergies"),
  preferences: text("preferences"),
  isVip: boolean("is_vip").notNull().default(false),
  visitCount: integer("visit_count").notNull().default(0),
  lastVisitDate: date("last_visit_date"),
  loyaltyPoints: integer("loyalty_points").notNull().default(0),
  loyaltyTier: loyaltyTierEnum("loyalty_tier"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertGuestSchema = createInsertSchema(guestsTable).omit({
  id: true, createdAt: true, updatedAt: true,
});

export type Guest = typeof guestsTable.$inferSelect;
export type InsertGuest = z.infer<typeof insertGuestSchema>;
