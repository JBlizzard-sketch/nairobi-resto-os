import { pgTable, text, boolean, integer, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { restaurantsTable } from "./restaurants";

export const tableShapeEnum = pgEnum("table_shape", ["round", "rectangular", "booth"]);
export const tableStatusEnum = pgEnum("table_status", [
  "available", "reserved", "seated", "needs_cleaning", "hold"
]);

export const tablesTable = pgTable("tables", {
  id: text("id").primaryKey(),
  restaurantId: text("restaurant_id").notNull().references(() => restaurantsTable.id, { onDelete: "cascade" }),
  number: text("number").notNull(),
  capacity: integer("capacity").notNull(),
  shape: tableShapeEnum("shape").notNull().default("round"),
  zone: text("zone"),
  positionX: real("position_x"),
  positionY: real("position_y"),
  width: real("width").default(80),
  height: real("height").default(80),
  status: tableStatusEnum("status").notNull().default("available"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTableSchema = createInsertSchema(tablesTable).omit({
  id: true, createdAt: true, updatedAt: true,
});

export type Table = typeof tablesTable.$inferSelect;
export type InsertTable = z.infer<typeof insertTableSchema>;
