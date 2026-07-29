import OpenAI from "openai";
import { z } from "zod";
import type { RetrievedChunk } from "./retrieve";

const openai = new OpenAI();

const answerSchema = z.object({
  foundInSources: z.boolean(),
  answer: z.string(),
  citedChunkIds: z.array(z.string()),
  followUps: z.array(z.string()),
});

export type Answer = z.infer<typeof answerSchema>;

export async function generateAnswer(question: string, chunks: RetrievedChunk[]): Promise<Answer> {
  const context = chunks
    .map((c) => `[chunkId: ${c.chunkId}] (page ${c.page})\n${c.text}`)
    .join("\n\n---\n\n");

  const prompt = `
You answer strictly from the provided context — never from your own knowledge.

Rules:
1.If the answer is present in the context:
   - foundInSources = true
   - answer the question
   - cite the chunkIds you used.
2.CITATIONS: after each factual claim, insert an inline marker [cite:CHUNK_ID] '
          'using the exact chunkId of the chunk that supports that claim. Place the marker ' 
          'immediately after the claim, mid-sentence if needed. ' +
          'Example: "The visa fee is €80 [cite:abc-123] and processing takes 15 days [cite:def-456]."
3.Only use chunkIds that appear in the context. List every cited id in citedChunkIds too.
4.FollowUps: suggest 2-3 short, natural follow-up questions the user might ask next.
2. If the answer is NOT present:
   - foundInSources = false
   - answer = ""
   - citedChunkIds = []
   - followUps = []
3. Do not guess or use outside knowledge.
4. IMPORTANT: DO NOT SEND  SOURCE ID example like this "c670218a-3a1d-44c4-ae17-94b796764a1d".

Context:
${context}

Question:
${question}

Return ONLY valid JSON in this format:
{
  "foundInSources": true,
  "answer": "... Text only, no source id or other information.",
  "citedChunkIds": ["chunk1"],
  "followUps": ["question1", "question2"]
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
            foundInSources: {
              type: "boolean",
            },
            answer: {
              type: "string",
            },
            citedChunkIds: {
              type: "array",
              items: {
                type: "string",
              },
            },
            followUps: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
          required: ["foundInSources", "answer", "citedChunkIds", "followUps"],
          additionalProperties: false,
        },
      },
    },
    input: prompt,
  });

  const raw = JSON.parse(res.output_text);

  return answerSchema.parse(raw);
}
