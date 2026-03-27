import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import connectDB from "@/lib/db";
import Topic from "@/models/Topic";
import Subject from "@/models/Subject";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// This tells Next.js to cache this route and revalidate every 60 seconds
export const revalidate = 60;

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId");

    const query = subjectId ? { subject: subjectId } : {};
    if (searchParams.get("activeOnly") === "true") {
      query.status = "ACTIVE";
    }
    const topics = await Topic.find(query)
      .populate("subject", "_id subjectName status")
      .populate("parent", "_id topicName status") // Populate parent status
      .sort({ topicName: 1 });

    return NextResponse.json({ topics });
  } catch (error) {
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    await connectDB();

    const newTopic = await Topic.create({
      ...body,
      createdBy: session.user.id,
    });

    revalidatePath("/dashboard/topics");

    return NextResponse.json(newTopic, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
