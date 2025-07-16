import { NextRequest, NextResponse } from "next/server";
import { db } from "@/shared/drizzle";
import { messages, contacts } from "@/shared/schema";
import { eq } from "drizzle-orm";
import { sendSMS } from "@/server/services/twilio";

export async function POST(req: NextRequest, context: { params: { id: string } }) {
  const { id } = await context.params;
  const { content } = await req.json();
  if (!id || !content) {
    return NextResponse.json({ error: "Contact ID and message content are required." }, { status: 400 });
  }

  // Fetch contact
  const contactArr = await db.select().from(contacts).where(eq(contacts.id, parseInt(id)));
  const contact = contactArr[0];
  if (!contact) {
    return NextResponse.json({ error: "Contact not found." }, { status: 404 });
  }

  // Send SMS
  const smsResponse = await sendSMS(contact.phoneNumber, content);
  if (smsResponse.status === "failed") {
    return NextResponse.json({ error: smsResponse.errorMessage || "Failed to send SMS." }, { status: 500 });
  }

  // Save message to DB
  const inserted = await db.insert(messages).values({
    contactId: contact.id,
    phoneNumber: contact.phoneNumber,
    content,
    status: smsResponse.status === "sent" ? "sent" : "failed",
    sentAt: new Date(),
    createdAt: new Date(),
    campaignId: null,
  }).returning();

  return NextResponse.json({ success: true, message: inserted[0], sid: smsResponse.sid });
}

export async function GET(req: NextRequest, context: { params: { id: string } }) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Contact ID is required." }, { status: 400 });
  }
  const msgs = await db.select().from(messages).where(eq(messages.contactId, parseInt(id))).orderBy(messages.sentAt);
  return NextResponse.json(msgs);
} 