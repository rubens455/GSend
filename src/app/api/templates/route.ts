import { NextRequest, NextResponse } from "next/server";
import { db } from "@/shared/drizzle";
import { templates } from "@/shared/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const allTemplates = await db.select().from(templates);
  return NextResponse.json(allTemplates);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const inserted = await db.insert(templates).values({
    ...data,
    userId: 1, // Hardcoded user ID like in old code
  }).returning();
  return NextResponse.json(inserted[0], { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
  }

  try {
    const parsedId = parseInt(id);
    
    // First, let's check if the template exists
    const existingTemplate = await db.select().from(templates).where(eq(templates.id, parsedId));
    
    if (existingTemplate.length === 0) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    
    const deleted = await db.delete(templates).where(eq(templates.id, parsedId)).returning();
    
    return NextResponse.json({ message: 'Template deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
} 

export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
  }
  const data = await req.json();
  try {
    const updated = await db.update(templates)
      .set(data)
      .where(eq(templates.id, parseInt(id)))
      .returning();
    if (updated.length === 0) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    return NextResponse.json(updated[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
} 