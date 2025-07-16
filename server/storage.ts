import { 
  users, contacts, templates, campaigns, messages, shortLinks, linkClicks, optInRequests,
  type User, type InsertUser, type Contact, type InsertContact, 
  type Template, type InsertTemplate, type Campaign, type InsertCampaign,
  type Message, type InsertMessage, type ShortLink, type InsertShortLink,
  type LinkClick, type InsertLinkClick, type OptInRequest, type InsertOptInRequest
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Contacts
  getContact(id: number): Promise<Contact | undefined>;
  getContactsByUserId(userId: number): Promise<Contact[]>;
  getContactByPhoneNumber(userId: number, phoneNumber: string): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, contact: Partial<Contact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<boolean>;
  getContactsByTags(userId: number, tags: string[]): Promise<Contact[]>;
  unsubscribeContact(phoneNumber: string): Promise<boolean>;

  // Templates
  getTemplate(id: number): Promise<Template | undefined>;
  getTemplatesByUserId(userId: number): Promise<Template[]>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  updateTemplate(id: number, template: Partial<Template>): Promise<Template | undefined>;
  deleteTemplate(id: number): Promise<boolean>;

  // Campaigns
  getCampaign(id: number): Promise<Campaign | undefined>;
  getCampaignById(id: number): Promise<Campaign | undefined>;
  getCampaignsByUserId(userId: number): Promise<Campaign[]>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: number, campaign: Partial<Campaign>): Promise<Campaign | undefined>;
  deleteCampaign(id: number): Promise<boolean>;
  getScheduledCampaigns(): Promise<Campaign[]>;

  // Messages
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesByCampaignId(campaignId: number): Promise<Message[]>;
  getMessagesByContactId(contactId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: number, message: Partial<Message>): Promise<Message | undefined>;
  updateMessageStatus(twilioSid: string, status: string, deliveredAt?: Date): Promise<boolean>;

  // Short Links
  getShortLink(id: number): Promise<ShortLink | undefined>;
  getShortLinkByCode(shortCode: string): Promise<ShortLink | undefined>;
  getShortLinksByUserId(userId: number): Promise<ShortLink[]>;
  createShortLink(shortLink: InsertShortLink): Promise<ShortLink>;
  incrementLinkClick(shortCode: string): Promise<boolean>;

  // Link Clicks
  createLinkClick(linkClick: InsertLinkClick): Promise<LinkClick>;
  getLinkClicksByShortLinkId(shortLinkId: number): Promise<LinkClick[]>;

  // Opt-in Requests
  getOptInRequest(token: string): Promise<OptInRequest | undefined>;
  createOptInRequest(optInRequest: InsertOptInRequest): Promise<OptInRequest>;
  confirmOptInRequest(token: string): Promise<boolean>;

  // Analytics
  getDashboardStats(userId: number): Promise<{
    totalContacts: number;
    messagesSent: number;
    deliveryRate: number;
    clickRate: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private contacts: Map<number, Contact> = new Map();
  private templates: Map<number, Template> = new Map();
  private campaigns: Map<number, Campaign> = new Map();
  private messages: Map<number, Message> = new Map();
  private shortLinks: Map<number, ShortLink> = new Map();
  private linkClicks: Map<number, LinkClick> = new Map();
  private optInRequests: Map<string, OptInRequest> = new Map();
  
  private currentUserId = 1;
  private currentContactId = 1;
  private currentTemplateId = 1;
  private currentCampaignId = 1;
  private currentMessageId = 1;
  private currentShortLinkId = 1;
  private currentLinkClickId = 1;

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      id: this.currentUserId++,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  // Contacts
  async getContact(id: number): Promise<Contact | undefined> {
    return this.contacts.get(id);
  }

  async getContactsByUserId(userId: number): Promise<Contact[]> {
    return Array.from(this.contacts.values()).filter(contact => contact.userId === userId);
  }

  async getContactByPhoneNumber(userId: number, phoneNumber: string): Promise<Contact | undefined> {
    return Array.from(this.contacts.values()).find(
      contact => contact.userId === userId && contact.phoneNumber === phoneNumber
    );
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const contact: Contact = {
      ...insertContact,
      id: this.currentContactId++,
      createdAt: new Date(),
      firstName: insertContact.firstName || null,
      lastName: insertContact.lastName || null,
      email: insertContact.email || null,
      tags: insertContact.tags || null,
      isOptedIn: insertContact.isOptedIn || null,
      optInDate: insertContact.optInDate || null,
      optInSource: insertContact.optInSource || null,
      isUnsubscribed: insertContact.isUnsubscribed || null,
      unsubscribedAt: insertContact.unsubscribedAt || null,
      shopifyCustomerId: insertContact.shopifyCustomerId || null,
      customFields: insertContact.customFields || null,
    };
    this.contacts.set(contact.id, contact);
    return contact;
  }

  async updateContact(id: number, updateData: Partial<Contact>): Promise<Contact | undefined> {
    const contact = this.contacts.get(id);
    if (!contact) return undefined;
    
    const updatedContact = { ...contact, ...updateData };
    this.contacts.set(id, updatedContact);
    return updatedContact;
  }

  async deleteContact(id: number): Promise<boolean> {
    return this.contacts.delete(id);
  }

  async getContactsByTags(userId: number, tags: string[]): Promise<Contact[]> {
    return Array.from(this.contacts.values()).filter(contact => 
      contact.userId === userId && 
      contact.tags && 
      tags.some(tag => contact.tags!.includes(tag))
    );
  }

  async unsubscribeContact(phoneNumber: string): Promise<boolean> {
    const contact = Array.from(this.contacts.values()).find(c => c.phoneNumber === phoneNumber);
    if (!contact) return false;
    
    contact.isUnsubscribed = true;
    contact.unsubscribedAt = new Date();
    this.contacts.set(contact.id, contact);
    return true;
  }

  // Templates
  async getTemplate(id: number): Promise<Template | undefined> {
    return this.templates.get(id);
  }

  async getTemplatesByUserId(userId: number): Promise<Template[]> {
    return Array.from(this.templates.values()).filter(template => template.userId === userId);
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const template: Template = {
      ...insertTemplate,
      id: this.currentTemplateId++,
      createdAt: new Date(),
      variables: insertTemplate.variables || null,
      isActive: insertTemplate.isActive || null,
    };
    this.templates.set(template.id, template);
    return template;
  }

  async updateTemplate(id: number, updateData: Partial<Template>): Promise<Template | undefined> {
    const template = this.templates.get(id);
    if (!template) return undefined;
    
    const updatedTemplate = { ...template, ...updateData };
    this.templates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  async deleteTemplate(id: number): Promise<boolean> {
    return this.templates.delete(id);
  }

  // Campaigns
  async getCampaign(id: number): Promise<Campaign | undefined> {
    return this.campaigns.get(id);
  }

  async getCampaignById(id: number): Promise<Campaign | undefined> {
    return this.campaigns.get(id);
  }

  async getCampaignsByUserId(userId: number): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).filter(campaign => campaign.userId === userId);
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const campaign: Campaign = {
      ...insertCampaign,
      id: this.currentCampaignId++,
      createdAt: new Date(),
      tags: insertCampaign.tags || null,
      templateId: insertCampaign.templateId || null,
      scheduledAt: insertCampaign.scheduledAt || null,
      sentAt: null,
      contactsCount: insertCampaign.contactsCount || null,
      sentCount: null,
      deliveredCount: null,
      failedCount: null,
      clickCount: null,
      unsubscribeCount: null,
    };
    this.campaigns.set(campaign.id, campaign);
    return campaign;
  }

  async updateCampaign(id: number, updateData: Partial<Campaign>): Promise<Campaign | undefined> {
    const campaign = this.campaigns.get(id);
    if (!campaign) return undefined;
    
    const updatedCampaign = { ...campaign, ...updateData };
    this.campaigns.set(id, updatedCampaign);
    return updatedCampaign;
  }

  async deleteCampaign(id: number): Promise<boolean> {
    return this.campaigns.delete(id);
  }

  async getScheduledCampaigns(): Promise<Campaign[]> {
    const now = new Date();
    return Array.from(this.campaigns.values()).filter(
      campaign => campaign.status === 'scheduled' && campaign.scheduledAt && campaign.scheduledAt <= now
    );
  }

  // Messages
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessagesByCampaignId(campaignId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(message => message.campaignId === campaignId);
  }

  async getMessagesByContactId(contactId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(message => message.contactId === contactId);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const message: Message = {
      ...insertMessage,
      id: this.currentMessageId++,
      createdAt: new Date(),
      sentAt: insertMessage.sentAt || null,
      twilioSid: insertMessage.twilioSid || null,
      deliveredAt: insertMessage.deliveredAt || null,
      errorMessage: insertMessage.errorMessage || null,
    };
    this.messages.set(message.id, message);
    return message;
  }

  async updateMessage(id: number, updateData: Partial<Message>): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    
    const updatedMessage = { ...message, ...updateData };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }

  async updateMessageStatus(twilioSid: string, status: string, deliveredAt?: Date): Promise<boolean> {
    const message = Array.from(this.messages.values()).find(m => m.twilioSid === twilioSid);
    if (!message) return false;
    
    message.status = status;
    if (deliveredAt) message.deliveredAt = deliveredAt;
    this.messages.set(message.id, message);
    return true;
  }

  // Short Links
  async getShortLink(id: number): Promise<ShortLink | undefined> {
    return this.shortLinks.get(id);
  }

  async getShortLinkByCode(shortCode: string): Promise<ShortLink | undefined> {
    return Array.from(this.shortLinks.values()).find(link => link.shortCode === shortCode);
  }

  async getShortLinksByUserId(userId: number): Promise<ShortLink[]> {
    return Array.from(this.shortLinks.values()).filter(link => link.userId === userId);
  }

  async createShortLink(insertShortLink: InsertShortLink): Promise<ShortLink> {
    const shortLink: ShortLink = {
      ...insertShortLink,
      id: this.currentShortLinkId++,
      createdAt: new Date(),
      clickCount: insertShortLink.clickCount || null,
    };
    this.shortLinks.set(shortLink.id, shortLink);
    return shortLink;
  }

  async incrementLinkClick(shortCode: string): Promise<boolean> {
    const link = Array.from(this.shortLinks.values()).find(l => l.shortCode === shortCode);
    if (!link) return false;
    
    link.clickCount = (link.clickCount || 0) + 1;
    this.shortLinks.set(link.id, link);
    return true;
  }

  // Link Clicks
  async createLinkClick(insertLinkClick: InsertLinkClick): Promise<LinkClick> {
    const linkClick: LinkClick = {
      ...insertLinkClick,
      id: this.currentLinkClickId++,
      clickedAt: new Date(),
      campaignId: insertLinkClick.campaignId || null,
      contactId: insertLinkClick.contactId || null,
      ipAddress: insertLinkClick.ipAddress || null,
      userAgent: insertLinkClick.userAgent || null,
    };
    this.linkClicks.set(linkClick.id, linkClick);
    return linkClick;
  }

  async getLinkClicksByShortLinkId(shortLinkId: number): Promise<LinkClick[]> {
    return Array.from(this.linkClicks.values()).filter(click => click.shortLinkId === shortLinkId);
  }

  // Opt-in Requests
  async getOptInRequest(token: string): Promise<OptInRequest | undefined> {
    return this.optInRequests.get(token);
  }

  async createOptInRequest(insertOptInRequest: InsertOptInRequest): Promise<OptInRequest> {
    const optInRequest: OptInRequest = {
      ...insertOptInRequest,
      id: Math.floor(Math.random() * 1000000),
      createdAt: new Date(),
      isConfirmed: insertOptInRequest.isConfirmed || null,
      confirmedAt: insertOptInRequest.confirmedAt || null,
    };
    this.optInRequests.set(optInRequest.token, optInRequest);
    return optInRequest;
  }

  async confirmOptInRequest(token: string): Promise<boolean> {
    const request = this.optInRequests.get(token);
    if (!request || request.expiresAt < new Date()) return false;
    
    request.isConfirmed = true;
    request.confirmedAt = new Date();
    this.optInRequests.set(token, request);
    return true;
  }

  // Analytics
  async getDashboardStats(userId: number): Promise<{
    totalContacts: number;
    messagesSent: number;
    deliveryRate: number;
    clickRate: number;
  }> {
    const userContacts = Array.from(this.contacts.values()).filter(c => c.userId === userId);
    const userCampaigns = Array.from(this.campaigns.values()).filter(c => c.userId === userId);
    
    const totalContacts = userContacts.length;
    const messagesSent = userCampaigns.reduce((sum, campaign) => sum + (campaign.sentCount || 0), 0);
    const deliveredCount = userCampaigns.reduce((sum, campaign) => sum + (campaign.deliveredCount || 0), 0);
    const clickCount = userCampaigns.reduce((sum, campaign) => sum + (campaign.clickCount || 0), 0);
    
    const deliveryRate = messagesSent > 0 ? (deliveredCount / messagesSent) * 100 : 0;
    const clickRate = messagesSent > 0 ? (clickCount / messagesSent) * 100 : 0;
    
    return {
      totalContacts,
      messagesSent,
      deliveryRate,
      clickRate,
    };
  }
}

export const storage = new MemStorage();
