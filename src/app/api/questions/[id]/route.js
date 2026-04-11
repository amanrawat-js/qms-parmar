import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Question from "@/models/Question";
import Exam from "@/models/Exam";
import Shift from "@/models/Shift";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";
import User from "@/models/User";
import { requireRole } from "@/lib/auth-guard";

/**
 * GET: Fetch a single question with all language blocks
 */
export async function GET(req, { params }) {
  const { session, denied } = await requireRole(req, "GET", "/api/questions");
  if (denied) return denied;

  try {
    const { id } = await params;
    await connectDB();

    const question = await Question.findById(id)
      .populate("exam", "examName")
      .populate("shift", "shiftLabel")
      .populate("subject", "subjectName")
      .populate("topic", "topicName")
      .populate("createdBy", "name")
      .lean({ virtuals: true });

    if (!question) {
      return NextResponse.json({ message: "Question not found" }, { status: 404 });
    }

    return NextResponse.json(question, { status: 200 });
  } catch (error) {
    console.error("GET_QUESTION_ERROR", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * PUT: Update question content or logical references
 * Triggers pre-save hooks for hierarchy and language validation
 */
export async function PUT(req, { params }) {
  const { session, denied } = await requireRole(req, "PUT", "/api/questions");
  if (denied) return denied;

  try {
    const { id } = await params;
    const body = await req.json();
    await connectDB();

    // Use findOne and then .save() to trigger the Mongoose pre-save hooks
    // This ensures availableLanguages and correctOption IDs are re-synced
    const question = await Question.findById(id);

    if (!question) {
      return NextResponse.json({ message: "Question not found" }, { status: 404 });
    }

    // Update root level fields and content Map
    Object.assign(question, body);
    question.updatedBy = session.user.id;

    await question.save();

    return NextResponse.json(question, { status: 200 });
  } catch (error) {
    console.error("PUT_QUESTION_ERROR", error);
    return NextResponse.json(
      { message: error.message || "Update failed" },
      { status: 400 }
    );
  }
}

/**
 * DELETE: Permanently remove a question from the database.
 */
export async function DELETE(req, { params }) {
  const { session, denied } = await requireRole(req, "DELETE", "/api/questions");
  if (denied) return denied;

  try {
    const { id } = await params;
    await connectDB();

    const deletedQuestion = await Question.findByIdAndDelete(id);

    if (!deletedQuestion) {
      return NextResponse.json({ message: "Question not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Question deleted successfully" });
  } catch (error) {
    console.error("DELETE_QUESTION_ERROR", error);
    return NextResponse.json({ message: "Delete failed" }, { status: 500 });
  }
}