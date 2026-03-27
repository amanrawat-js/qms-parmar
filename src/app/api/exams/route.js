import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import connectDB from "@/lib/db";
import Exam from "@/models/Exam";
import Board from "@/models/Board";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const revalidate = 60; // 1-minute cache

export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const query = {};
  if (searchParams.get("publishedOnly") === "true") {
    query.status = "PUBLISHED";
  }
  const exams = await Exam.find(query).populate("board", "boardShortName").sort({ createdAt: -1 });
  return NextResponse.json({ exams });
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    await connectDB();

    const newExam = await Exam.create({ ...body, createdBy: session.user.id });
    revalidatePath("/dashboard/exams");
    return NextResponse.json(newExam, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}