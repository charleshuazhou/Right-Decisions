import { buildPrompt, parseReadingJson } from "@/lib/prompt";
import type { ComputedReading, Locale, PracticalFactors } from "@/lib/types";

type Body = {
  question: string;
  options: string[];
  practical: PracticalFactors;
  computed: ComputedReading;
  language: Locale;
  name: string;
};

function config() {
  if (process.env.XAI_API_KEY) {
    return {
      provider: "xai",
      apiKey: process.env.XAI_API_KEY,
      baseUrl: (process.env.XAI_BASE_URL || "https://api.x.ai/v1").replace(/\/$/, ""),
      model: process.env.XAI_MODEL || "grok-3",
    };
  }
  if (process.env.OPENAI_API_KEY) {
    return {
      provider: "openai",
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, ""),
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    };
  }
  if (process.env.AI_API_KEY) {
    return {
      provider: "custom",
      apiKey: process.env.AI_API_KEY,
      baseUrl: (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, ""),
      model: process.env.AI_MODEL || "gpt-4o-mini",
    };
  }
  return null;
}

function safeError(text: string): string {
  return text.replace(/sk-[A-Za-z0-9_-]+/g, "[redacted]").replace(/Bearer\s+\S+/g, "Bearer [redacted]").slice(0, 280);
}

export async function POST(request: Request) {
  const ai = config();
  if (!ai) return Response.json({ mode: "unconfigured" });
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ mode: "error", message: "invalid json" }, { status: 400 });
  }
  const prompt = buildPrompt(body);
  try {
    const response = await fetch(`${ai.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ai.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: ai.model,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user },
        ],
      }),
    });
    if (!response.ok) {
      return Response.json({ mode: "error", message: safeError(await response.text()) }, { status: 502 });
    }
    const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const text = payload.choices?.[0]?.message?.content ?? "";
    const reading = parseReadingJson(text);
    if (!reading) return Response.json({ mode: "error", message: "The model did not return the expected JSON." }, { status: 502 });
    return Response.json({ mode: "llm", provider: ai.provider, model: ai.model, reading });
  } catch (error) {
    return Response.json({ mode: "error", message: safeError(error instanceof Error ? error.message : "request failed") }, { status: 502 });
  }
}
