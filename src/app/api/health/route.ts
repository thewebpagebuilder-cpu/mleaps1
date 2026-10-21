import { getQuestions } from "@/db/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const questions = await getQuestions();
    return Response.json({
      ok: true,
      questionsCount: questions.length,
      status: "operational",
    });
  } catch (error) {
    console.error("Health check error:", error);
    return Response.json({ ok: false }, { status: 500 });
  }
}
