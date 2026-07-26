import OpenAI from "openai";
import { z } from "zod";
import type { RetrievedChunk } from "./retrieve";

const openai = new OpenAI();

const answerSchema = z.object({
  foundInSources: z.boolean(),
  answer: z.string(),
  citedChunkIds: z.array(z.string()),
});

export type Answer = z.infer<typeof answerSchema>;

export async function generateAnswer(question: string, chunks: RetrievedChunk[]): Promise<Answer> {
  const context = chunks
    .map((c) => `[chunkId: ${c.chunkId}] (page ${c.page})\n${c.text}`)
    .join("\n\n---\n\n");

  console.log("[answer] context:", context);
  console.log("[answer] question:", question);

  const prompt = `
You answer strictly from the provided context — never from your own knowledge.

Rules:
1. If the answer is present in the context:
   - foundInSources = true
   - answer the question
   - cite the chunkIds you used.
2. If the answer is NOT present:
   - foundInSources = false
   - answer = ""
   - citedChunkIds = []
3. Do not guess or use outside knowledge.

Context:
${context}

Question:
${question}

Return ONLY valid JSON in this format:
{
  "foundInSources": true,
  "answer": "...",
  "citedChunkIds": ["chunk1"]
}
`;

  const res = await openai.responses.create({
    model: "gpt-5.1",
    temperature: 0,
    text: {
      format: {
        type: "json_schema",
        name: "answer",
        schema: {
          type: "object",
          properties: {
            foundInSources: { type: "boolean" },
            answer: { type: "string" },
            citedChunkIds: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["foundInSources", "answer", "citedChunkIds"],
          additionalProperties: false,
        },
      },
    },
    input: prompt,
  });

  const raw = JSON.parse(res.output_text);

  return answerSchema.parse(raw);
}
