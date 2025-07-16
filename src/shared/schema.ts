import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phoneNumber: text("phone_number").notNull(),
  email: text("email"),
  tags: text("tags").array(),
  isOptedIn: boolean("is_opted_in").default(false),
  optInDate: timestamp("opt_in_date"),
  optInSource: text("opt_in_source"),
  isUnsubscribed: boolean("is_unsubscribed").default(false),
  unsubscribedAt: timestamp("unsubscribed_at"),
  shopifyCustomerId: text("shopify_customer_id"),
  customFields: jsonb("custom_fields"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  variables: text("variables").array(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  templateId: integer("template_id"),
  content: text("content").notNull(),
  status: text("status").notNull(), // draft, scheduled, sending, sent, failed
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  contactsCount: integer("contacts_count").default(0),
  sentCount: integer("sent_count").default(0),
  deliveredCount: integer("delivered_count").default(0),
  failedCount: integer("failed_count").default(0),
  clickCount: integer("click_count").default(0),
  unsubscribeCount: integer("unsubscribe_count").default(0),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  contactId: integer("contact_id").notNull(),
  phoneNumber: text("phone_number").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull(), // queued, sending, sent, delivered, failed, undelivered
  twilioSid: text("twilio_sid"),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const shortLinks = pgTable("short_links", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  originalUrl: text("original_url").notNull(),
  shortCode: text("short_code").notNull().unique(),
  shortUrl: text("short_url").notNull(),
  clickCount: integer("click_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const linkClicks = pgTable("link_clicks", {
  id: serial("id").primaryKey(),
  shortLinkId: integer("short_link_id").notNull(),
  campaignId: integer("campaign_id"),
  contactId: integer("contact_id"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  clickedAt: timestamp("clicked_at").defaultNow().notNull(),
});

export const optInRequests = pgTable("opt_in_requests", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").notNull(),
  token: text("token").notNull().unique(),
  isConfirmed: boolean("is_confirmed").default(false),
  confirmedAt: timestamp("confirmed_at"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertContactSchema = createInsertSchema(contacts).omit({ id: true, createdAt: true });
export const insertTemplateSchema = createInsertSchema(templates).omit({ id: true, createdAt: true });
export const insertCampaignSchema = createInsertSchema(campaigns).omit({ id: true, createdAt: true, sentAt: true, sentCount: true, deliveredCount: true, failedCount: true, clickCount: true, unsubscribeCount: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertShortLinkSchema = createInsertSchema(shortLinks).omit({ id: true, createdAt: true });
export const insertLinkClickSchema = createInsertSchema(linkClicks).omit({ id: true });
export const insertOptInRequestSchema = createInsertSchema(optInRequests).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Template = typeof templates.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type ShortLink = typeof shortLinks.$inferSelect;
export type InsertShortLink = z.infer<typeof insertShortLinkSchema>;
export type LinkClick = typeof linkClicks.$inferSelect;
export type InsertLinkClick = z.infer<typeof insertLinkClickSchema>;
export type OptInRequest = typeof optInRequests.$inferSelect;
export type InsertOptInRequest = z.infer<typeof insertOptInRequestSchema>;
