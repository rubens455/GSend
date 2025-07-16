import type { Router } from "express";
import { createServer, type Server } from "http";
import { campaignScheduler } from "./services/scheduler";
import { sendSMS, formatPhoneNumber, isValidPhoneNumber, extractMergeTags } from "./services/twilio";
import { createShortLink } from "./services/shortio";
import { createShopifyService, formatShopifyPhoneNumber } from "./services/shopify";
import { 
  insertContactSchema, insertTemplateSchema, insertCampaignSchema, 
  insertShortLinkSchema, insertOptInRequestSchema
} from "@shared/schema";
import { z } from "zod";
import { randomBytes } from "crypto";
import type { IStorage } from "./storage";

export function registerApiRoutes(router: Router, storage: IStorage) {
  // Start the campaign scheduler
  campaignScheduler.start();

  // Dashboard stats
  router.get("/dashboard/stats", async (req, res) => {
    try {
      const userId = 1; // TODO: Get from session/auth
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Contacts routes
  router.get("/contacts", async (req, res) => {
    try {
      const userId = 1; // TODO: Get from session/auth
      const contacts = await storage.getContactsByUserId(userId);
      res.json(contacts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/contacts", async (req, res) => {
    try {
      const userId = 1; // TODO: Get from session/auth
      const data = insertContactSchema.parse({ ...req.body, userId });
      
      // Format phone number
      data.phoneNumber = formatPhoneNumber(data.phoneNumber);
      
      if (!isValidPhoneNumber(data.phoneNumber)) {
        return res.status(400).json({ error: "Invalid phone number format" });
      }

      // Check if contact already exists
      const existingContact = await storage.getContactByPhoneNumber(userId, data.phoneNumber);
      if (existingContact) {
        return res.status(400).json({ error: "Contact with this phone number already exists" });
      }

      const contact = await storage.createContact(data);
      res.json(contact);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  router.post("/contacts/upload", async (req, res) => {
    try {
      const userId = 1; // TODO: Get from session/auth
      const { contacts: contactsData } = req.body;
      
      if (!Array.isArray(contactsData)) {
        return res.status(400).json({ error: "Invalid contacts data" });
      }

      const results = {
        imported: 0,
        skipped: 0,
        errors: [] as string[],
      };

      for (const contactData of contactsData) {
        try {
          const phoneNumber = formatPhoneNumber(contactData.phoneNumber || contactData.phone);
          
          if (!isValidPhoneNumber(phoneNumber)) {
            results.errors.push(`Invalid phone number: ${contactData.phoneNumber || contactData.phone}`);
            results.skipped++;
            continue;
          }

          // Check if contact already exists
          const existingContact = await storage.getContactByPhoneNumber(userId, phoneNumber);
          if (existingContact) {
            results.skipped++;
            continue;
          }

          await storage.createContact({
            userId,
            firstName: contactData.firstName || contactData.first_name || '',
            lastName: contactData.lastName || contactData.last_name || '',
            phoneNumber,
            email: contactData.email || null,
            tags: contactData.tags ? contactData.tags.split(',').map((t: string) => t.trim()) : [],
            isOptedIn: false, // Require explicit opt-in
            optInSource: 'csv_upload',
            isUnsubscribed: false,
            customFields: contactData.customFields || null,
          });

          results.imported++;
        } catch (error: any) {
          results.errors.push(`Error importing contact: ${error.message}`);
          results.skipped++;
        }
      }

      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.put("/contacts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      if (updateData.phoneNumber) {
        updateData.phoneNumber = formatPhoneNumber(updateData.phoneNumber);
        if (!isValidPhoneNumber(updateData.phoneNumber)) {
          return res.status(400).json({ error: "Invalid phone number format" });
        }
      }

      const contact = await storage.updateContact(parseInt(id), updateData);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.json(contact);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  router.delete("/contacts/bulk", async (req, res) => {
    try {
      console.log('[BULK DELETE] Request received');
      console.log('[BULK DELETE] Request body:', req.body);
      console.log('[BULK DELETE] Request headers:', req.headers);
      
      const userId = 1; // TODO: Get from session/auth
      let { ids } = req.body;
      
      console.log('[BULK DELETE] Extracted ids:', ids);
      console.log('[BULK DELETE] ids type:', typeof ids);
      console.log('[BULK DELETE] ids isArray:', Array.isArray(ids));
      
      if (!Array.isArray(ids) || ids.length === 0) {
        console.log('[BULK DELETE] Error: No contact IDs provided or not an array');
        return res.status(400).json({ error: "No contact IDs provided" });
      }
      // Convert all ids to numbers first
      ids = ids.map(id => Number(id)).filter(id => Number.isInteger(id) && !isNaN(id));
      console.log('[BULK DELETE] Filtered IDs:', ids);
      if (ids.length === 0) {
        console.log('[BULK DELETE] Error: No valid contact IDs after filtering');
        return res.status(400).json({ error: "No valid contact IDs provided" });
      }
      let deletedCount = 0;
      for (const id of ids) {
        console.log('[BULK DELETE] Attempting to delete contact ID:', id);
        const success = await storage.deleteContact(Number(id));
        if (success) {
          deletedCount++;
          console.log('[BULK DELETE] Successfully deleted contact ID:', id);
        } else {
          console.log('[BULK DELETE] Failed to delete contact ID:', id);
        }
      }
      console.log('[BULK DELETE] Total deleted:', deletedCount);
      res.json({ deleted: deletedCount });
    } catch (error: any) {
      console.error('[BULK DELETE] Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  router.delete("/contacts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteContact(parseInt(id));
      if (!success) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Messages routes
  router.get("/contacts/:id/messages", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = 1; // TODO: Get from session/auth
      
      // Verify contact belongs to user
      const contact = await storage.getContact(parseInt(id));
      if (!contact || contact.userId !== userId) {
        return res.status(404).json({ error: "Contact not found" });
      }
      
      const messages = await storage.getMessagesByContactId(parseInt(id));
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/contacts/:id/messages", async (req, res) => {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const userId = 1; // TODO: Get from session/auth
      
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: "Message content is required" });
      }
      
      // Verify contact belongs to user
      const contact = await storage.getContact(parseInt(id));
      if (!contact || contact.userId !== userId) {
        return res.status(404).json({ error: "Contact not found" });
      }
      
      // Create a dummy campaign for individual messages
      const dummyCampaign = await storage.createCampaign({
        userId,
        name: `Individual Message to ${contact.firstName || contact.phoneNumber}`,
        content,
        status: 'sent',
        contactsCount: 1,
      });
      
      // Create message record
      const message = await storage.createMessage({
        campaignId: dummyCampaign.id,
        contactId: parseInt(id),
        phoneNumber: contact.phoneNumber,
        content,
        status: 'sent',
      });
      
      // Send SMS via Twilio
      try {
        await sendSMS(contact.phoneNumber, content);
        // Update message status to delivered
        await storage.updateMessage(message.id, { status: 'delivered' });
      } catch (smsError: any) {
        console.error('SMS sending failed:', smsError);
        await storage.updateMessage(message.id, { status: 'failed' });
        return res.status(500).json({ error: "Failed to send SMS" });
      }
      
      res.json(message);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Templates routes
  router.get("/templates", async (req, res) => {
    try {
      const userId = 1; // TODO: Get from session/auth
      const templates = await storage.getTemplatesByUserId(userId);
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/templates", async (req, res) => {
    try {
      const userId = 1; // TODO: Get from session/auth
      const data = insertTemplateSchema.parse({ ...req.body, userId });
      
      // Extract variables from template content
      const variableRegex = /\{\{(\w+)\}\}/g;
      const variables: string[] = [];
      let match;
      while ((match = variableRegex.exec(data.content)) !== null) {
        if (!variables.includes(match[1])) {
          variables.push(match[1]);
        }
      }
      data.variables = variables;

      const template = await storage.createTemplate(data);
      res.json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  router.put("/templates/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      if (updateData.content) {
        // Extract variables from template content
        const variableRegex = /\{\{(\w+)\}\}/g;
        const variables: string[] = [];
        let match;
        while ((match = variableRegex.exec(updateData.content)) !== null) {
          if (!variables.includes(match[1])) {
            variables.push(match[1]);
          }
        }
        updateData.variables = variables;
      }

      const template = await storage.updateTemplate(parseInt(id), updateData);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  router.delete("/templates/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteTemplate(parseInt(id));
      if (!success) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Campaigns routes
  router.get("/campaigns", async (req, res) => {
    try {
      console.log("[DEBUG] GET /api/campaigns route hit");
      const userId = 1; // TODO: Get from session/auth
      const campaigns = await storage.getCampaignsByUserId(userId);
      res.json(campaigns);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/campaigns", async (req, res) => {
    try {
      console.log('[DEBUG] Received /api/campaigns POST request with body:', req.body);
      const userId = 1; // TODO: Get from session/auth
      const data = insertCampaignSchema.parse({ ...req.body, userId });
      
      console.log('[DEBUG] Parsed campaign data for storage:', data);
      const campaign = await storage.createCampaign(data);
      console.log('[DEBUG] Response from storage.createCampaign:', campaign);
      
      if (!campaign) {
        console.error('[DEBUG] Campaign creation failed, storage returned undefined.');
        return res.status(500).json({ error: "Campaign creation failed on the server." });
      }

      res.json(campaign);
    } catch (error: any) {
      console.error('[DEBUG] Error in /api/campaigns route:', error);
      res.status(400).json({ error: error.message });
    }
  });

  router.post("/campaigns/:id/send", async (req, res) => {
    try {
      const { id } = req.params;
      const campaign = await storage.getCampaign(parseInt(id));
      
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
        return res.status(400).json({ error: "Campaign cannot be sent" });
      }

      // Execute campaign immediately
      await campaignScheduler.executeNow(parseInt(id));
      
      res.json({ success: true, message: "Campaign sent successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/campaigns/:id/test", async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      const campaignId = req.params.id;

      if (!phoneNumber) {
        return res.status(400).json({ error: "Phone number is required" });
      }

      // Get the campaign
      const campaign = await storage.getCampaign(parseInt(campaignId));
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      // Format the phone number
      const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
      if (!isValidPhoneNumber(formattedPhoneNumber)) {
        return res.status(400).json({ error: "Invalid phone number format" });
      }

      // Replace merge tags with sample data
      let messageContent = campaign.content;
      const mergeTags = extractMergeTags(campaign.content);
      
      mergeTags.forEach(tag => {
        const sampleValue = `[${tag}]`; // Sample replacement
        messageContent = messageContent.replace(new RegExp(`\\{\\{${tag}\\}\\}`, 'g'), sampleValue);
      });

      // Send the test message
      const result = await sendSMS(formattedPhoneNumber, messageContent);
      
      if (result.status === 'failed') {
        return res.status(500).json({ error: result.errorMessage || "Failed to send test message" });
      }

      return res.json({ 
        success: true, 
        sid: result.sid,
        message: "Test message sent successfully"
      });

    } catch (error: any) {
      console.error("Error sending test message:", error);
      return res.status(500).json({ 
        error: "Internal server error", 
        details: error.message 
      });
    }
  });

  router.put("/campaigns/:id", async (req, res) => {
    console.log(`[DEBUG] PUT /campaigns/:id route handler called`);
    console.log(`[DEBUG] Request params:`, req.params);
    console.log(`[DEBUG] Request body:`, req.body);
    console.log(`[DEBUG] Storage instance:`, storage.constructor.name);
    
    try {
      const { id } = req.params;
      const updateData = req.body;
      console.log(`[DEBUG] PUT /campaigns/${id} called with data:`, updateData);
      
      const campaign = await storage.updateCampaign(parseInt(id), updateData);
      console.log(`[DEBUG] PUT /campaigns/${id} result:`, campaign);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error: any) {
      console.error(`[DEBUG] PUT /campaigns/${req.params.id} error:`, error);
      res.status(400).json({ error: error.message });
    }
  });

  router.delete("/campaigns/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteCampaign(parseInt(id));
      if (!success) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Short Links routes
  router.get("/short-links", async (req, res) => {
    try {
      const userId = 1; // TODO: Get from session/auth
      const shortLinks = await storage.getShortLinksByUserId(userId);
      res.json(shortLinks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/short-links", async (req, res) => {
    try {
      const userId = 1; // TODO: Get from session/auth
      const { originalUrl, title } = req.body;
      
      const shortLinkResponse = await createShortLink({ originalUrl, title });
      
      if (!shortLinkResponse.success) {
        return res.status(400).json({ error: shortLinkResponse.error });
      }

      const shortLink = await storage.createShortLink({
        userId,
        originalUrl,
        shortCode: shortLinkResponse.shortCode,
        shortUrl: shortLinkResponse.shortUrl,
      });

      res.json(shortLink);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Short link redirect is not part of /api
  // We'll handle this separately if needed.
  // router.get("/s/:code", async (req, res) => { ... });

  // Shopify sync routes
  router.post("/shopify/sync", async (req, res) => {
    try {
      const { shopDomain, accessToken } = req.body;
      const userId = 1; // TODO: Get from session/auth
      
      if (!shopDomain || !accessToken) {
        return res.status(400).json({ error: "Shop domain and access token are required" });
      }

      const shopifyService = createShopifyService(shopDomain, accessToken);
      const shopifyCustomers = await shopifyService.getAllCustomersWithPhone();
      
      const results = {
        imported: 0,
        updated: 0,
        skipped: 0,
        errors: [] as string[],
      };

      for (const customer of shopifyCustomers) {
        try {
          const phoneNumber = formatShopifyPhoneNumber(customer.phone);
          
          if (!isValidPhoneNumber(phoneNumber)) {
            results.errors.push(`Invalid phone number for customer ${customer.id}: ${customer.phone}`);
            results.skipped++;
            continue;
          }

          // Check if contact already exists
          const existingContact = await storage.getContactByPhoneNumber(userId, phoneNumber);
          
          if (existingContact) {
            // Update existing contact with Shopify data
            await storage.updateContact(existingContact.id, {
              firstName: customer.first_name || existingContact.firstName,
              lastName: customer.last_name || existingContact.lastName,
              email: customer.email || existingContact.email,
              shopifyCustomerId: customer.id.toString(),
              isOptedIn: customer.accepts_marketing && existingContact.isOptedIn,
            });
            results.updated++;
          } else {
            // Create new contact
            await storage.createContact({
              userId,
              firstName: customer.first_name || '',
              lastName: customer.last_name || '',
              phoneNumber,
              email: customer.email || null,
              tags: customer.tags ? customer.tags.split(',').map(t => t.trim()) : [],
              isOptedIn: customer.accepts_marketing,
              optInDate: customer.accepts_marketing ? new Date(customer.accepts_marketing_updated_at) : null,
              optInSource: 'shopify_sync',
              shopifyCustomerId: customer.id.toString(),
              isUnsubscribed: false,
            });
            results.imported++;
          }
        } catch (error: any) {
          results.errors.push(`Error syncing customer ${customer.id}: ${error.message}`);
          results.skipped++;
        }
      }

      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Opt-in routes
  router.post("/opt-in", async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ error: "Phone number is required" });
      }

      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      if (!isValidPhoneNumber(formattedPhone)) {
        return res.status(400).json({ error: "Invalid phone number format" });
      }

      const userId = 1; // TODO: Get from session/auth
      const contact = await storage.getContactByPhoneNumber(userId, formattedPhone);
      
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }

      if (contact.isOptedIn) {
        return res.status(400).json({ error: "Contact is already opted in" });
      }

      // Generate opt-in token
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await storage.createOptInRequest({
        contactId: contact.id,
        token,
        expiresAt,
        isConfirmed: false,
      });

      // Send opt-in SMS
      const optInUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/opt-in/${token}`;
      const message = `Hi ${contact.firstName || 'there'}! Please confirm your SMS subscription by clicking: ${optInUrl}`;
      
      await sendSMS(formattedPhone, message);

      res.json({ success: true, message: "Opt-in request sent" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get("/opt-in/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const optInRequest = await storage.getOptInRequest(token);
      
      if (!optInRequest) {
        return res.status(404).json({ error: "Invalid opt-in token" });
      }

      if (optInRequest.expiresAt < new Date()) {
        return res.status(400).json({ error: "Opt-in token has expired" });
      }

      if (optInRequest.isConfirmed) {
        return res.status(400).json({ error: "Already confirmed" });
      }

      // Confirm opt-in
      await storage.confirmOptInRequest(token);
      
      // Update contact
      await storage.updateContact(optInRequest.contactId, {
        isOptedIn: true,
        optInDate: new Date(),
        optInSource: 'double_opt_in',
      });

      res.json({ success: true, message: "Opt-in confirmed successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Unsubscribe route
  router.post("/unsubscribe", async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ error: "Phone number is required" });
      }

      const success = await storage.unsubscribeContact(phoneNumber);
      
      if (!success) {
        return res.status(404).json({ error: "Contact not found" });
      }

      res.json({ success: true, message: "Successfully unsubscribed" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Twilio webhook for message status updates
  router.post("/webhooks/twilio", async (req, res) => {
    try {
      const { MessageSid, MessageStatus, EventType } = req.body;
      
      if (EventType === 'message-status') {
        const deliveredAt = MessageStatus === 'delivered' ? new Date() : undefined;
        await storage.updateMessageStatus(MessageSid, MessageStatus, deliveredAt);
      }

      res.status(200).send('OK');
    } catch (error: any) {
      console.error('Twilio webhook error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Handle STOP keyword
  router.post("/webhooks/twilio/inbound", async (req, res) => {
    try {
      const { From, Body } = req.body;
      
      if (Body && Body.toUpperCase().includes('STOP')) {
        await storage.unsubscribeContact(From);
        
        // Send confirmation
        await sendSMS(
          From,
          "You have been unsubscribed from SMS messages. Reply START to opt back in."
        );
      } else if (Body && Body.toUpperCase().includes('START')) {
        // Re-subscribe logic would go here
        await sendSMS(
          From,
          "You have been re-subscribed to SMS messages. Reply STOP to unsubscribe."
        );
      }

      res.status(200).send('OK');
    } catch (error: any) {
      console.error('Inbound SMS webhook error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // User registration route
  router.post("/users", async (req, res) => {
    try {
      const { email, fullName } = req.body;
      if (!email || !fullName) {
        return res.status(400).json({ error: "Email and full name are required" });
      }
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" });
      }
      // Insert user (username = fullName, password = '')
      const user = await storage.createUser({
        email,
        username: fullName,
        password: '', // Not used, as auth is managed by Supabase
      });
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Simple test route to verify API routing works
  router.post("/test-simple", async (req, res) => {
    try {
      return res.json({ success: true, message: "Test route working!" });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // Helper to quote only when needed
  function csvEscape(val: unknown) {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  router.get("/contacts/export", async (req, res) => {
    try {
      const userId = 1; // TODO: Get from session/auth
      const contacts = await storage.getContactsByUserId(userId);
      // CSV header
      const header = [
        'firstName', 'lastName', 'phoneNumber', 'email', 'tags'
      ];
      // CSV rows
      const rows = contacts.map(contact => [
        contact.firstName || '',
        contact.lastName || '',
        contact.phoneNumber || '',
        contact.email || '',
        (contact.tags || []).join(',')
      ]);
      // Combine header and rows
      const csv = [header, ...rows].map(row => row.map(csvEscape).join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="contacts_export.csv"');
      res.send(csv);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.use((req, res, next) => {
    console.log('[API ROUTER] Unmatched route:', req.method, req.originalUrl);
    next();
  });
}
