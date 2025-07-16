import { NextRequest, NextResponse } from "next/server";
import { db } from "@/shared/drizzle";
import { campaigns } from "@/shared/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const allCampaigns = await db.select().from(campaigns);
  return NextResponse.json(allCampaigns);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const inserted = await db.insert(campaigns).values({
    ...data,
    userId: 1, // Hardcoded user ID like in old code
  }).returning();
  return NextResponse.json(inserted[0], { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 });
  }

  try {
    const deleted = await db.delete(campaigns).where(eq(campaigns.id, parseInt(id))).returning();
    
    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 });
  }
} 

export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 });
  }
  const data = await req.json();
  try {
    const updated = await db.update(campaigns)
      .set(data)
      .where(eq(campaigns.id, parseInt(id)))
      .returning();
    if (updated.length === 0) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    return NextResponse.json(updated[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
  }
} 