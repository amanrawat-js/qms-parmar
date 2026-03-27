import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Shift from "@/models/Shift";
import Exam from "@/models/Exam";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

export const revalidate = 60;

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const examId = searchParams.get("examId");
    const search = searchParams.get("search");

    const query = {};

    if (examId) {
      if (!mongoose.Types.ObjectId.isValid(examId)) {
        return NextResponse.json(
          { message: "Invalid Exam ID." },
          { status: 400 }
        );
      }
      query.exam = examId;
    }

    if (search) {
      query.shiftLabel = { $regex: search, $options: "i" };
    }

    const shifts = await Shift.find(query)
      .populate("exam", "examName")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ shifts }, { status: 200 });
  } catch (error) {
    console.error("GET_SHIFTS_ERROR", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    await connectDB();
    const newShift = await Shift.create({
      ...body,
      createdBy: session.user.id,
    });
    revalidatePath("/api/shifts");
    return NextResponse.json(newShift, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
