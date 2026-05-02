import { pgTable, text, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { restaurantsTable } from "./restaurants";

export const staffRoleEnum = pgEnum("staff_role", [
  "owner", "manager", "host", "kitchen"
]);

export const staffTable = pgTable("staff", {
  id: text("id").primaryKey(),
  restaurantId: text("restaurant_id").notNull().references(() => restaurantsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: staffRoleEnum("role").notNull().default("host"),
  phone: text("phone"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertStaffSchema = createInsertSchema(staffTable).omit({
  id: true, createdAt: true, updatedAt: true, passwordHash: true,
});

export type StaffMember = typeof staffTable.$inferSelect;
export type InsertStaff = z.infer<typeof insertStaffSchema>;
