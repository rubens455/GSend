import { NextRequest, NextResponse } from "next/server";
import { db } from "@/shared/drizzle";
import { contacts } from "@/shared/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  // Fetch all contacts from the database
  const allContacts = await db.select().from(contacts);
  return NextResponse.json(allContacts);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  // Insert new contact into the database
  const inserted = await db.insert(contacts).values({
    ...data,
    userId: 1, // Hardcoded user ID like in old code
  }).returning();
  return NextResponse.json(inserted[0], { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 });
  }

  try {
    const deleted = await db.delete(contacts).where(eq(contacts.id, parseInt(id))).returning();
    
    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
  }
} 

export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 });
  }
  const data = await req.json();
  try {
    const updated = await db.update(contacts)
      .set(data)
      .where(eq(contacts.id, parseInt(id)))
      .returning();
    if (updated.length === 0) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }
    return NextResponse.json(updated[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
  }
} 