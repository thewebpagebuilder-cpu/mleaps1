import { NextRequest, NextResponse } from "next/server";
import { verifyCandidateAssignment } from "@/db/storage";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawEmail = String(body.email || "")
      .trim()
      .toLowerCase();
    const candidateNameInput = String(body.candidateName || "").trim();

    if (!rawEmail) {
      return NextResponse.json(
        {
          allowed: false,
          code: "INVALID_INPUT",
          message: "Please enter your assigned candidate email address.",
        },
        { status: 400 }
      );
    }

    const result = await verifyCandidateAssignment(rawEmail, candidateNameInput);
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/assignments/verify error:", error);
    return NextResponse.json(
      {
        allowed: false,
        code: "SERVER_ERROR",
        message: "Failed to verify candidate assignment.",
      },
      { status: 500 }
    );
  }
}
