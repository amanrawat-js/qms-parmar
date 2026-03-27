import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Question from "@/models/Question";
import Shift from "@/models/Shift";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    // 1. Extract Pagination Parameters
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    // 2. Build Dynamic Query
    const query = { isActive: true };
    
    if (searchParams.get("examId")) query.exam = searchParams.get("examId");
    if (searchParams.get("shiftId")) query.shift = searchParams.get("shiftId");
    if (searchParams.get("subjectId")) query.subject = searchParams.get("subjectId");
    if (searchParams.get("topicId")) query.topic = searchParams.get("topicId");
    
    if (searchParams.get("lang")) {
      query.availableLanguages = searchParams.get("lang");
    }

    const search = searchParams.get("search");
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: "i" } },
        { "content.en.text": { $regex: search, $options: "i" } },
        { "content.hi.text": { $regex: search, $options: "i" } } // Added Hindi search support
      ];
    }

    // 3. Execute Query with Pagination
    // We run countDocuments and find in parallel for better performance
    const [questions, total] = await Promise.all([
      Question.find(query)
        .populate("exam", "examName")
        .populate("shift", "shiftLabel")
        .populate("subject", "subjectName")
        .populate("topic", "topicName")
        .populate("createdBy", "name role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean({ virtuals: true }),
      Question.countDocuments(query)
    ]);

    // 4. Return Data with Pagination Metadata
    return NextResponse.json({ 
      questions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }, { status: 200 });

  } catch (error) {
    console.error("GET_QUESTIONS_ERROR", error);
    return NextResponse.json({ message: "Failed to fetch questions" }, { status: 500 });
  }
}

// POST remains mostly the same, ensure createdBy mapping is solid
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    await connectDB();

    const newQuestion = await Question.create({
      ...body,
      createdBy: session.user.id,
    });

    revalidatePath("/dashboard/questions");
    return NextResponse.json(newQuestion, { status: 201 });
  } catch (error) {
    console.error("POST_QUESTION_ERROR", error);
    return NextResponse.json(
      { message: error.message || "Failed to create question" }, 
      { status: 400 }
    );
  }
}