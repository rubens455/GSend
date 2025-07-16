import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import * as schema from '@shared/schema';
import type { IStorage } from './storage';
import type { 
  User, InsertUser, Contact, InsertContact, Template, InsertTemplate, 
  Campaign, InsertCampaign, Message, InsertMessage, ShortLink, InsertShortLink, 
  LinkClick, InsertLinkClick, OptInRequest, InsertOptInRequest 
} from '@shared/schema';
import * as fs from 'fs';
import * as path from 'path';

// TODO: Move to environment variables
const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  throw new Error('SUPABASE_DB_URL environment variable is not set.');
}

const client = postgres(connectionString, {
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync(path.join(process.cwd(), 'prod-ca-2021.crt')).toString(),
  }
});
const db = drizzle(client, { schema });

export class SupabaseStorage implements IStorage {
  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const newCampaign = await db.insert(schema.campaigns).values(insertCampaign).returning();
    return newCampaign[0];
  }

  // --- Methods to be implemented ---

  async getUser(id: number): Promise<User | undefined> {
    throw new Error('Method not implemented.');
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    throw new Error('Method not implemented.');
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
    throw new Error('Method not implemented.');
  }
  async createUser(user: InsertUser): Promise<User> {
    throw new Error('Method not implemented.');
  }
  async getContact(id: number): Promise<Contact | undefined> {
    throw new Error('Method not implemented.');
  }
  async getContactsByUserId(userId: number): Promise<Contact[]> {
    console.log(`[DEBUG] Fetching contacts for userId: ${userId}`);
    const contacts = await db.select().from(schema.contacts).where(eq(schema.contacts.userId, userId));
    console.log(`[DEBUG] Found ${contacts.length} contacts for userId: ${userId}`);
    return contacts;
  }
  async getContactByPhoneNumber(userId: number, phoneNumber: string): Promise<Contact | undefined> {
    const contacts = await db.select().from(schema.contacts).where(
      eq(schema.contacts.userId, userId) && eq(schema.contacts.phoneNumber, phoneNumber)
    );
    return contacts[0];
  }
  async createContact(contact: InsertContact): Promise<Contact> {
    console.log(`[DEBUG] createContact called with data:`, contact);
    const newContact = await db.insert(schema.contacts).values(contact).returning();
    console.log(`[DEBUG] createContact result:`, newContact);
    return newContact[0];
  }
  async updateContact(id: number, contact: Partial<Contact>): Promise<Contact | undefined> {
    console.log(`[DEBUG] updateContact called with id: ${id}, contact data:`, contact);
    const updatedContact = await db.update(schema.contacts).set(contact).where(eq(schema.contacts.id, id)).returning();
    console.log(`[DEBUG] updateContact result:`, updatedContact);
    return updatedContact[0];
  }
  async deleteContact(id: number): Promise<boolean> {
    const result = await db.delete(schema.contacts).where(eq(schema.contacts.id, id)).returning();
    return result.length > 0;
  }
  async getContactsByTags(userId: number, tags: string[]): Promise<Contact[]> {
    // This is a simplified implementation - in a real app you might want more sophisticated tag matching
    const contacts = await db.select().from(schema.contacts).where(eq(schema.contacts.userId, userId));
    return contacts.filter(contact => 
      contact.tags && tags.some(tag => contact.tags!.includes(tag))
    );
  }
  async unsubscribeContact(phoneNumber: string): Promise<boolean> {
    const result = await db.update(schema.contacts)
      .set({ 
        isUnsubscribed: true, 
        unsubscribedAt: new Date() 
      })
      .where(eq(schema.contacts.phoneNumber, phoneNumber))
      .returning();
    return result.length > 0;
  }
  async getTemplate(id: number): Promise<Template | undefined> {
    throw new Error('Method not implemented.');
  }
  async getTemplatesByUserId(userId: number): Promise<Template[]> {
    console.log(`[DEBUG] Fetching templates for userId: ${userId}`);
    const templates = await db.select().from(schema.templates).where(eq(schema.templates.userId, userId));
    console.log(`[DEBUG] Found ${templates.length} templates for userId: ${userId}`);
    return templates;
  }
  async createTemplate(template: InsertTemplate): Promise<Template> {
    console.log(`[DEBUG] createTemplate called with data:`, template);
    const newTemplate = await db.insert(schema.templates).values(template).returning();
    console.log(`[DEBUG] createTemplate result:`, newTemplate);
    return newTemplate[0];
  }
  async updateTemplate(id: number, template: Partial<Template>): Promise<Template | undefined> {
    throw new Error('Method not implemented.');
  }
  async deleteTemplate(id: number): Promise<boolean> {
    const result = await db.delete(schema.templates).where(eq(schema.templates.id, id)).returning();
    return result.length > 0;
  }
  async getCampaign(id: number): Promise<Campaign | undefined> {
    const campaign = await db.select().from(schema.campaigns).where(eq(schema.campaigns.id, id));
    return campaign[0];
  }
  async getCampaignById(id: number): Promise<Campaign | undefined> {
    const campaign = await db.select().from(schema.campaigns).where(eq(schema.campaigns.id, id));
    return campaign[0];
  }
  async getCampaignsByUserId(userId: number): Promise<Campaign[]> {
    console.log(`[DEBUG] Fetching campaigns for userId: ${userId}`);
    const campaigns = await db.select().from(schema.campaigns).where(eq(schema.campaigns.userId, userId));
    console.log(`[DEBUG] Found ${campaigns.length} campaigns for userId: ${userId}`);
    return campaigns;
  }
  async updateCampaign(id: number, campaign: Partial<Campaign>): Promise<Campaign | undefined> {
    console.log(`[DEBUG] updateCampaign called with id: ${id}, campaign data:`, campaign);
    try {
      // Test database connection first
      console.log(`[DEBUG] Testing database connection...`);
      await client`SELECT 1`;
      console.log(`[DEBUG] Database connection test successful`);
      
      console.log(`[DEBUG] About to execute database update query`);
      const updatedCampaign = await db.update(schema.campaigns).set(campaign).where(eq(schema.campaigns.id, id)).returning();
      console.log(`[DEBUG] updateCampaign result:`, updatedCampaign);
      return updatedCampaign[0];
    } catch (error) {
      console.error(`[DEBUG] updateCampaign error:`, error);
      console.error(`[DEBUG] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  }
  async deleteCampaign(id: number): Promise<boolean> {
    const result = await db.delete(schema.campaigns).where(eq(schema.campaigns.id, id)).returning();
    return result.length > 0;
  }
  async getScheduledCampaigns(): Promise<Campaign[]> {
    throw new Error('Method not implemented.');
  }
  async getMessage(id: number): Promise<Message | undefined> {
    throw new Error('Method not implemented.');
  }
  async getMessagesByCampaignId(campaignId: number): Promise<Message[]> {
    throw new Error('Method not implemented.');
  }
  async createMessage(message: InsertMessage): Promise<Message> {
    throw new Error('Method not implemented.');
  }
  async updateMessage(id: number, message: Partial<Message>): Promise<Message | undefined> {
    throw new Error('Method not implemented.');
  }
  async updateMessageStatus(twilioSid: string, status: string, deliveredAt?: Date): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  async getShortLink(id: number): Promise<ShortLink | undefined> {
    throw new Error('Method not implemented.');
  }
  async getShortLinkByCode(shortCode: string): Promise<ShortLink | undefined> {
    throw new Error('Method not implemented.');
  }
  async getShortLinksByUserId(userId: number): Promise<ShortLink[]> {
    throw new Error('Method not implemented.');
  }
  async createShortLink(shortLink: InsertShortLink): Promise<ShortLink> {
    throw new Error('Method not implemented.');
  }
  async incrementLinkClick(shortCode: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  async createLinkClick(linkClick: InsertLinkClick): Promise<LinkClick> {
    throw new Error('Method not implemented.');
  }
  async getLinkClicksByShortLinkId(shortLinkId: number): Promise<LinkClick[]> {
    throw new Error('Method not implemented.');
  }
  async getOptInRequest(token: string): Promise<OptInRequest | undefined> {
    throw new Error('Method not implemented.');
  }
  async createOptInRequest(optInRequest: InsertOptInRequest): Promise<OptInRequest> {
    throw new Error('Method not implemented.');
  }
  async confirmOptInRequest(token: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  async getDashboardStats(userId: number): Promise<{ totalContacts: number; messagesSent: number; deliveryRate: number; clickRate: number; }> {
    throw new Error('Method not implemented.');
  }
} 