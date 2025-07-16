import { NextRequest, NextResponse } from "next/server";
import { db } from "@/shared/drizzle";
import { campaigns } from "@/shared/schema";
import { eq } from "drizzle-orm";
import { sendSMS } from "@/server/services/twilio";

export async function POST(req: NextRequest, context: { params: { id: string } }) {
  const { id } = await context.params;
  const { phoneNumber } = await req.json();
  if (!id || !phoneNumber) {
    return NextResponse.json({ error: "Campaign ID and phone number are required." }, { status: 400 });
  }

  // Fetch campaign
  const campaignArr = await db.select().from(campaigns).where(eq(campaigns.id, parseInt(id)));
  const campaign = campaignArr[0];
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
  }

  // Replace merge tags with sample data
  let content = campaign.content;
  content = content.replace(/\{\{first_name\}\}/g, "Test");
  content = content.replace(/\{\{last_name\}\}/g, "User");
  content = content.replace(/\{\{phone_number\}\}/g, phoneNumber);

  // Send SMS
  const smsResponse = await sendSMS(phoneNumber, content);
  if (smsResponse.status === "failed") {
    return NextResponse.json({ error: smsResponse.errorMessage || "Failed to send test SMS." }, { status: 500 });
  }

  return NextResponse.json({ success: true, sid: smsResponse.sid });
} 