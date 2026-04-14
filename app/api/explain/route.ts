import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

interface MoveContext {
  san: string;
  fenBefore: string;
  classification: string;
  cpLoss: number;
  bestMoveSan: string;
  playerColor: "white" | "black";
  playerRating?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { move?: MoveContext };
    const { move } = body;

    if (!move) {
      return NextResponse.json({ error: "move context is required" }, { status: 400 });
    }

    const ratingNote = move.playerRating
      ? `The player's rating is approximately ${move.playerRating}, so calibrate your explanation accordingly.`
      : "";

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      tools: [
        {
          name: "explain_move",
          description: "Explain a chess move in structured format",
          input_schema: {
            type: "object" as const,
            properties: {
              summary: {
                type: "string",
                description: "1-2 sentence plain English explanation of what happened and why it was a blunder/mistake/good move",
              },
              concepts: {
                type: "array",
                items: { type: "string" },
                description: "Chess concepts this move relates to (e.g. 'fork', 'pin', 'king safety')",
              },
              suggestion: {
                type: "string",
                description: "For blunders/mistakes: brief note on what the better move achieves. Omit for good/best moves.",
              },
            },
            required: ["summary", "concepts"],
          },
        },
      ],
      tool_choice: { type: "auto" },
      messages: [
        {
          role: "user",
          content: `A chess player (${move.playerColor}) played ${move.san} in the position with FEN: ${move.fenBefore}

Move classification: ${move.classification} (centipawn loss: ${move.cpLoss})
Best move was: ${move.bestMoveSan}
${ratingNote}

Explain this move using the explain_move tool.`,
        },
      ],
    });

    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return NextResponse.json({ error: "No explanation generated" }, { status: 500 });
    }

    return NextResponse.json(toolUse.input);
  } catch (err) {
    console.error("/api/explain error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
