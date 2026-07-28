import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";

import { getChunksBySource } from "../models/chunk";

const openai = new OpenAI();

const studyGuideSchema = z.object({
  summaryPoints: z
    .array(z.string().describe("bullet point title"))
    .describe("Main takeaways as bullet points with 4-6 sentences each with point title"),
  keyConcepts: z.array(
    z.object({
      term: z.string().describe("important term/idea"),
      explanation: z.string().describe("4-6 sentences explanation"),
    })
  ),
  practiceQuestions: z.array(
    z.object({
      question: z.string().describe("question/answer pair testing understanding"),
      answer: z.string().describe("answer to the question"),
    })
  ),
});

export type StudyGuide = z.infer<typeof studyGuideSchema>;

export async function generateStudyGuide(sourceId: string): Promise<StudyGuide | null> {
  const chunks = await getChunksBySource(sourceId);

  if (chunks.length === 0) {
    return null;
  }

  const fullText = chunks.map((c) => c.text).join("\n\n");
  const title = chunks[0].title;

  const response = await openai.responses.create({
    model: "gpt-5.1",
    input: [
      {
        role: "system",
        content: `
You are an expert study assistant.

Generate a study guide from ONLY the supplied document.

Requirements:
- overview: 10–15 sentence summary in multiple paragraphs
- keyConcepts: important terms with 4–6 sentence explanations
- summaryPoints: main takeaways
- practiceQuestions: 4–8 question/answer pairs

Do not use outside knowledge.
        `,
      },
      {
        role: "user",
        content: `Title: ${title}\n\n${fullText}`,
      },
    ],
    text: {
      format: zodTextFormat(studyGuideSchema, "studyGuide"),
    },
  });

  const json = JSON.parse(response.output_text);

  const parsed = studyGuideSchema.safeParse(json);

  if (!parsed.success) {
    console.error(parsed.error);
    return null;
  }

  return parsed.data;
}
