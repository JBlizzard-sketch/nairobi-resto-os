import { pgTable, text, boolean, integer, timestamp, pgEnum, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { restaurantsTable } from "./restaurants";
import { tablesTable } from "./tables";
import { guestsTable } from "./guests";

export const reservationStatusEnum = pgEnum("reservation_status", [
  "pending", "confirmed", "seated", "completed", "cancelled", "no_show"
]);

export const reservationSourceEnum = pgEnum("reservation_source", [
  "online", "whatsapp", "walk_in", "phone", "manual"
]);

export const reservationOccasionEnum = pgEnum("reservation_occasion", [
  "birthday", "anniversary", "proposal", "business", "other"
]);

export const reservationsTable = pgTable("reservations", {
  id: text("id").primaryKey(),
  restaurantId: text("restaurant_id").notNull().references(() => restaurantsTable.id, { onDelete: "cascade" }),
  guestId: text("guest_id").references(() => guestsTable.id, { onDelete: "set null" }),
  tableId: text("table_id").references(() => tablesTable.id, { onDelete: "set null" }),
  guestName: text("guest_name").notNull(),
  guestPhone: text("guest_phone").notNull(),
  guestWhatsapp: text("guest_whatsapp"),
  partySize: integer("party_size").notNull(),
  date: date("date").notNull(),
  time: text("time").notNull(),
  occasion: reservationOccasionEnum("occasion"),
  status: reservationStatusEnum("status").notNull().default("pending"),
  source: reservationSourceEnum("source").notNull().default("manual"),
  depositRequired: boolean("deposit_required").notNull().default(false),
  depositPaid: boolean("deposit_paid").notNull().default(false),
  depositAmountKes: integer("deposit_amount_kes"),
  dietaryNotes: text("dietary_notes"),
  internalNotes: text("internal_notes"),
  hasPreOrder: boolean("has_pre_order").notNull().default(false),
  reminderSent24h: boolean("reminder_sent_24h").notNull().default(false),
  reminderSent2h: boolean("reminder_sent_2h").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertReservationSchema = createInsertSchema(reservationsTable).omit({
  id: true, createdAt: true, updatedAt: true,
});

export type Reservation = typeof reservationsTable.$inferSelect;
export type InsertReservation = z.infer<typeof insertReservationSchema>;
