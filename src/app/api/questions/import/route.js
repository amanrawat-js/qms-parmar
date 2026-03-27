import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Question from "@/models/Question";
import Collection from "@/models/Collection";
import Shift from "@/models/Shift";
import Topic from "@/models/Topic";
import Subject from "@/models/Subject";
import Exam from "@/models/Exam";
import Board from "@/models/Board";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import slugify from "slugify";

/* -------------------------------------------------
   Utils + Canonical Cache
------------------------------------------------- */

const isObjectId = (v) => mongoose.Types.ObjectId.isValid(v);

const normalizeKey = (v = "") =>
  slugify(v.toString().trim().toLowerCase(), { lower: true });

const escapeRegex = (v = "") => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const cache = new Map();

const cached = async (key, fn) => {
  if (cache.has(key)) return cache.get(key);
  const val = await fn();
  cache.set(key, val);
  return val;
};

const normalizeDate = (v) => {
  if (!v) return null;
  const [d, m, y] = v.split("/");
  return `${y}-${m}-${d}`;
};

const normalizeTimeMixed = (v) => {
  if (!v) return {};

  const to24 = (t) => {
    const [time, meridian] = t.trim().split(" ");
    let [h, m] = time.split(":");
    h = parseInt(h, 10);

    if (meridian === "PM" && h !== 12) h += 12;
    if (meridian === "AM" && h === 12) h = 0;

    return `${h.toString().padStart(2, "0")}:${m}`;
  };

  if (v.includes("-")) {
    const [start, end] = v.split("-").map((s) => s.trim());
    return { startTime: to24(start), endTime: to24(end) };
  }

  return { startTime: to24(v), endTime: null };
};

/* -------------------------------------------------
   Resolvers
------------------------------------------------- */

// Board (find-or-create by Section_Name)
async function resolveBoard(sectionName, userId) {
  if (!sectionName) return null;

  const key = `board:${normalizeKey(sectionName)}`;
  return cached(key, async () => {
    const escaped = escapeRegex(sectionName.trim());

    let board = await Board.findOne({
      $or: [
        { boardName: new RegExp(`^${escaped}$`, "i") },
        { boardShortName: new RegExp(`^${escaped}$`, "i") },
        { boardSlug: new RegExp(`^${normalizeKey(sectionName)}$`, "i") },
      ],
    });

    if (!board) {
      board = await Board.create({
        boardName: sectionName.trim(),
        boardShortName: sectionName.trim().toUpperCase().slice(0, 10),
        boardSlug: normalizeKey(sectionName),
        createdBy: userId,
      });
    }

    return board._id;
  });
}

// Exam (find-or-create by name)
async function resolveExam(examInput, boardId, userId) {
  if (!examInput || examInput.trim() === "none") return null;

  const key = `exam:${normalizeKey(examInput)}`;

  return cached(key, async () => {
    if (isObjectId(examInput)) {
      const exam = await Exam.findById(examInput);
      if (exam) return exam._id;
    }

    const escaped = escapeRegex(examInput.trim());
    let exam = await Exam.findOne({
      $or: [
        { examName: new RegExp(`^${escaped}$`, "i") },
        { examSlug: new RegExp(`^${normalizeKey(examInput)}$`, "i") },
      ],
    });

    if (!exam) {
      exam = await Exam.create({
        examName: examInput.trim(),
        examSlug: normalizeKey(examInput),
        examYear: new Date().getFullYear(),
        board: boardId,
        status: "DRAFT",
        createdBy: userId,
      });
    }

    return exam._id;
  });
}

// Subject (NO DUPLICATES — find-or-create)
async function resolveSubject(subjectInput, userId) {
  if (!subjectInput) return null;
  if (isObjectId(subjectInput)) return subjectInput;

  const key = `subject:${normalizeKey(subjectInput)}`;

  return cached(key, async () => {
    const escaped = escapeRegex(subjectInput.trim());

    let subject = await Subject.findOne({
      $or: [
        { subjectName: new RegExp(`^${escaped}$`, "i") },
        { subjectSlug: new RegExp(`^${escaped}$`, "i") },
      ],
    });

    if (!subject) {
      subject = await Subject.create({
        subjectName: subjectInput.trim(),
        subjectSlug: normalizeKey(subjectInput),
        createdBy: userId,
      });
    }

    return subject._id;
  });
}

// Topic (subject-scoped, NO DUPLICATES — find-or-create)
async function resolveTopic(topicInput, subjectId, userId) {
  if (!topicInput || !subjectId) return null;
  if (isObjectId(topicInput)) return topicInput;

  const slug = normalizeKey(topicInput);
  const key = `topic:${subjectId}:${slug}`;

  return cached(key, async () => {
    const escaped = escapeRegex(topicInput.trim());

    let topic = await Topic.findOne({
      subject: subjectId,
      $or: [
        { topicName: new RegExp(`^${escaped}$`, "i") },
        { topicSlug: new RegExp(`^${escaped}$`, "i") },
      ],
    });

    if (topic) return topic._id;

    try {
      topic = await Topic.create({
        topicName: topicInput.trim(),
        topicSlug: slug,
        subject: subjectId,
        createdBy: userId,
      });
      return topic._id;
    } catch (err) {
      if (err.code === 11000) {
        const existing = await Topic.findOne({ topicSlug: slug });
        if (existing) return existing._id;
      }
      throw err;
    }
  });
}

// Shift (find-or-create by shiftLabel)
async function resolveShift(shiftInput, examId, userId) {
  if (!shiftInput || !examId) return null;
  if (isObjectId(shiftInput)) return shiftInput;

  // Accept a shiftLabel string directly
  const label = typeof shiftInput === "string" ? shiftInput : shiftInput.shiftLabel;
  if (!label) return null;

  const key = `shift:${examId}:${normalizeKey(label)}`;

  return cached(key, async () => {
    let shift = await Shift.findOne({
      exam: examId,
      shiftLabel: label,
    });

    if (!shift) {
      shift = await Shift.create({
        exam: examId,
        shiftLabel: label,
        createdBy: userId,
      });
    }

    return shift._id;
  });
}

// Resolve shift from a final.json question entry — combines Date + Time into shiftLabel
async function resolveShiftFromFinalJson(question, examId, userId) {
  if (!examId || !question) return null;

  const dateStr = question.Date; // e.g., "16/02/2026"
  const timeStr = question.Time; // e.g., "9:00 AM - 10:00 AM"

  if (!dateStr || !timeStr) return null;

  // Build shiftLabel: "16/02/2026 | 9:00 AM – 10:00 AM"
  const shiftLabel = `${dateStr} | ${timeStr.replace(" - ", " – ")}`;

  const key = `shift:${examId}:${normalizeKey(shiftLabel)}`;

  return cached(key, async () => {
    let shift = await Shift.findOne({
      exam: examId,
      shiftLabel,
    });

    if (!shift) {
      shift = await Shift.create({
        exam: examId,
        shiftLabel,
        createdBy: userId,
      });
    }

    return shift._id;
  });
}

/* -------------------------------------------------
   Transform final.json entry → Question document
------------------------------------------------- */

function transformFinalJsonToQuestion(q) {
  const correctIdx = parseInt(q.correct_option_number, 10) - 1;

  const enOptions = (q.options_en || []).map((text, i) => ({
    text,
    correctOption: i === correctIdx,
  }));
  const hnOptions = (q.options_hn || []).map((text, i) => ({
    text,
    correctOption: i === correctIdx,
  }));

  return {
    content: {
      en: {
        text: q.Question_en || "",
        passage: "",
        solution: "",
        description: "",
        options: enOptions,
      },
      hi: {
        text: q.Question_hn || "",
        passage: "",
        solution: "",
        description: "",
        options: hnOptions,
      },
    },
    code: q.question_id || undefined,
    availableLanguages: ["en", "hi"],
  };
}

/* -------------------------------------------------
   API
------------------------------------------------- */

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { questions = [], hierarchy = {}, collection } = await req.json();
    if (!questions.length)
      return NextResponse.json(
        { message: "No questions provided" },
        { status: 400 }
      );

    await connectDB();
    const userId = session.user.id;

    /* ---------- Detect format ---------- */
    const isFinalJson = questions[0]?.Question_en !== undefined;

    /* ---------- Resolve hierarchy ---------- */

    // For final.json, hierarchy comes per-question (Name, Date, Time, subject, topic)
    // For legacy format, hierarchy comes from the sidebar
    const hierarchyExamId = !isFinalJson
      ? await resolveExam(hierarchy.exam, null, userId)
      : null;

    const hierarchyShiftId =
      !isFinalJson && hierarchyExamId
        ? await resolveShift(hierarchy.shift, hierarchyExamId, userId)
        : null;

    const hierarchySubjectId = !isFinalJson
      ? await resolveSubject(hierarchy.subject, userId)
      : null;

    const hierarchyTopicId = !isFinalJson
      ? await resolveTopic(hierarchy.topic, hierarchySubjectId, userId)
      : null;

    /* ---------- Questions ---------- */

    const docs = [];
    let qNo = 1;
    for (const q of questions) {
      console.log("Question Number", qNo++);

      if (isFinalJson) {
        // --- final.json flow ---
        const boardId = await resolveBoard(q.Section_Name, userId);
        const examId = await resolveExam(q.Name, boardId, userId);
        const shiftId = await resolveShiftFromFinalJson(q, examId, userId);

        const subjectId = q.subject
          ? await resolveSubject(q.subject, userId)
          : null;
        const topicId =
          q.topic && subjectId
            ? await resolveTopic(q.topic, subjectId, userId)
            : null;

        const transformed = transformFinalJsonToQuestion(q);

        docs.push({
          ...transformed,
          code: q.question_id || undefined,
          exam: examId,
          shift: shiftId,
          subject: subjectId,
          topic: topicId,
          createdBy: userId,
          isActive: true,
        });
      } else {
        // --- Legacy flow ---
        const subjectId =
          hierarchySubjectId ??
          (q.subject ? await resolveSubject(q.subject, userId) : null);

        const topicId =
          hierarchyTopicId ??
          (q.topic ? await resolveTopic(q.topic, subjectId, userId) : null);

        const shiftId = hierarchyShiftId;

        const availableLanguages =
          q.content && typeof q.content === "object"
            ? Object.keys(q.content)
            : [];

        docs.push({
          ...q,
          exam: hierarchyExamId,
          shift: shiftId,
          subject: subjectId,
          topic: topicId,
          availableLanguages,
          createdBy: userId,
          isActive: true,
        });
      }
    }

    let saved = [];

    try {
      saved = await Question.insertMany(docs, { ordered: false });
    } catch (err) {
      console.error("InsertMany error (expected with duplicates)");

      if (err.result?.insertedDocs) {
        saved = err.result.insertedDocs;
      } else if (err.writeErrors) {
        console.log("Duplicate errors:", err.writeErrors.length);
        saved = err.insertedDocs || [];
      } else {
        throw err;
      }
    }

    console.log("Saved count:", saved.length);

    if (collection?.title && saved.length) {
      const body = {
        title: collection.title,
        category: "PRACTICE_SET",
        exam: hierarchyExamId,
        shift: hierarchyShiftId,
        subject: hierarchySubjectId,
        topic: hierarchyTopicId,
        questions: saved.map((q) => q._id),
        createdBy: userId,
      };

      try {
        await Collection.create({ ...body });
      } catch (err) {
        if (err.code === 11000) {
          const istStamp = () => {
            const d = new Date(Date.now());
            return (
              d.getFullYear() +
              String(d.getMonth() + 1).padStart(2, "0") +
              String(d.getDate()).padStart(2, "0") +
              String(d.getHours()).padStart(2, "0") +
              String(d.getMinutes()).padStart(2, "0") +
              String(d.getSeconds()).padStart(2, "0")
            );
          };

          body.title = `${collection.title}-${istStamp()}`;
          await Collection.create({ ...body });
        } else {
          console.error("Error creating collection:", err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: saved.length,
    });
  } catch (err) {
    console.error("IMPORT_ERROR", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
