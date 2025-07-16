import { NextRequest, NextResponse } from "next/server";
import { db } from "@/shared/drizzle";
import { shortLinks } from "@/shared/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const allShortLinks = await db.select().from(shortLinks);
  return NextResponse.json(allShortLinks);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const inserted = await db.insert(shortLinks).values({
    ...data,
    userId: 1, // Hardcoded user ID like in old code
  }).returning();
  return NextResponse.json(inserted[0], { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ error: 'Short link ID is required' }, { status: 400 });
  }

  try {
    const parsedId = parseInt(id);
    
    // First, let's check if the short link exists
    const existingShortLink = await db.select().from(shortLinks).where(eq(shortLinks.id, parsedId));
    
    if (existingShortLink.length === 0) {
      return NextResponse.json({ error: 'Short link not found' }, { status: 404 });
    }
    
    const deleted = await db.delete(shortLinks).where(eq(shortLinks.id, parsedId)).returning();
    
    return NextResponse.json({ message: 'Short link deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete short link' }, { status: 500 });
  }
} 

export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Short link ID is required' }, { status: 400 });
  }
  const data = await req.json();
  try {
    const updated = await db.update(shortLinks)
      .set(data)
      .where(eq(shortLinks.id, parseInt(id)))
      .returning();
    if (updated.length === 0) {
      return NextResponse.json({ error: 'Short link not found' }, { status: 404 });
    }
    return NextResponse.json(updated[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update short link' }, { status: 500 });
  }
} 