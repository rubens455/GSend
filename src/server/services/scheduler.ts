import { storage } from '../storage';
import { sendSMS } from './twilio';
import { createShortLink, extractLinksFromText, replaceLinksWithShortLinks } from './shortio';

class CampaignScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    // Check for scheduled campaigns every minute
    this.intervalId = setInterval(() => {
      this.processScheduledCampaigns().catch(console.error);
    }, 60000);
    
    console.log('Campaign scheduler started');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Campaign scheduler stopped');
  }

  private async processScheduledCampaigns() {
    try {
      const scheduledCampaigns = await storage.getScheduledCampaigns();
      
      for (const campaign of scheduledCampaigns) {
        await this.executeCampaign(campaign);
      }
    } catch (error) {
      console.error('Error processing scheduled campaigns:', error);
    }
  }

  private async executeCampaign(campaign: any) {
    try {
      console.log(`Executing campaign: ${campaign.name} (ID: ${campaign.id})`);
      
      // Update campaign status to sending
      await storage.updateCampaign(campaign.id, {
        status: 'sending',
        sentAt: new Date(),
      });

      // Get contacts based on tags
      let contacts = [];
      if (campaign.tags && campaign.tags.length > 0) {
        contacts = await storage.getContactsByTags(campaign.userId, campaign.tags);
      } else {
        contacts = await storage.getContactsByUserId(campaign.userId);
      }

      // Filter out unsubscribed and users without opt-in
      const eligibleContacts = contacts.filter(contact => 
        !contact.isUnsubscribed && contact.isOptedIn
      );

      let sentCount = 0;
      let failedCount = 0;
      let deliveredCount = 0;

      // Process links in the content
      const originalLinks = extractLinksFromText(campaign.content);
      const linkMap = new Map<string, string>();

      // Create short links for each URL found
      for (const link of originalLinks) {
        try {
          const shortLinkResponse = await createShortLink({ originalUrl: link });
          if (shortLinkResponse.success) {
            // Store the short link in our database
            await storage.createShortLink({
              userId: campaign.userId,
              originalUrl: link,
              shortCode: shortLinkResponse.shortCode,
              shortUrl: shortLinkResponse.shortUrl,
            });
            linkMap.set(link, shortLinkResponse.shortUrl);
          }
        } catch (error) {
          console.error('Error creating short link:', error);
        }
      }

      // Replace original links with short links in the content
      const processedContent = replaceLinksWithShortLinks(campaign.content, linkMap);

      // Send messages to each contact
      for (const contact of eligibleContacts) {
        try {
          // Replace merge tags in the content
          let personalizedContent = processedContent;
          personalizedContent = personalizedContent.replace(/\{\{first_name\}\}/g, contact.firstName || '');
          personalizedContent = personalizedContent.replace(/\{\{last_name\}\}/g, contact.lastName || '');
          personalizedContent = personalizedContent.replace(/\{\{phone_number\}\}/g, contact.phoneNumber);

          // Send SMS
          const smsResponse = await sendSMS({
            to: contact.phoneNumber,
            body: personalizedContent,
            webhookUrl: `${process.env.BASE_URL}/api/webhooks/twilio`,
          });

          // Create message record
          await storage.createMessage({
            campaignId: campaign.id,
            contactId: contact.id,
            phoneNumber: contact.phoneNumber,
            content: personalizedContent,
            status: smsResponse.status,
            twilioSid: smsResponse.sid,
            sentAt: smsResponse.status !== 'failed' ? new Date() : null,
            errorMessage: smsResponse.errorMessage,
          });

          if (smsResponse.status === 'failed') {
            failedCount++;
          } else {
            sentCount++;
            // Assume delivery for now (will be updated by webhook)
            deliveredCount++;
          }

          // Rate limiting - don't send too fast
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error sending message to ${contact.phoneNumber}:`, error);
          failedCount++;
        }
      }

      // Update campaign with final counts
      await storage.updateCampaign(campaign.id, {
        status: 'sent',
        contactsCount: eligibleContacts.length,
        sentCount,
        deliveredCount,
        failedCount,
      });

      console.log(`Campaign ${campaign.name} completed: ${sentCount} sent, ${failedCount} failed`);
    } catch (error) {
      console.error(`Error executing campaign ${campaign.id}:`, error);
      
      // Update campaign status to failed
      await storage.updateCampaign(campaign.id, {
        status: 'failed',
      });
    }
  }

  // Manual campaign execution (for immediate sends)
  async executeNow(campaignId: number) {
    const campaign = await storage.getCampaign(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }
    
    await this.executeCampaign(campaign);
  }
}

export const campaignScheduler = new CampaignScheduler();
