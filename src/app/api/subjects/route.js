import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import connectDB from "@/lib/db";
import Subject from "@/models/Subject";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const revalidate = 60; // 1-minute cache

export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const query = {};
  if (searchParams.get("activeOnly") === "true") {
    query.status = "ACTIVE";
  }
  const subjects = await Subject.find(query).sort({ subjectName: 1 });
  return NextResponse.json({ subjects });
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    await connectDB();

    const newSubject = await Subject.create({
      ...body,
      createdBy: session.user.id,
    });

    revalidatePath("/dashboard/subjects");
    return NextResponse.json(newSubject, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}