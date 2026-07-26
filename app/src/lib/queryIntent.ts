import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI();

const schema = z.object({
  category: z.enum(["DOCUMENT_QUESTION", "GREETING", "INAPPROPRIATE", "OFF_TOPIC"]),
  reason: z.string(),
});
export type QueryIntent = z.infer<typeof schema>;

export async function classifyIntent(question: string): Promise<QueryIntent> {
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Classify a user input to a document Q&A assistant into ONE category:\n" +
          "- DOCUMENT_QUESTION: ANY question or request for information that could plausibly " +
          "be answered from documents — even if vague, short, or about a general topic " +
          '(e.g. "any info about paris?", "what does it say about pricing?"). ' +
          "You do NOT know what the documents contain, so assume any information request is this.\n" +
          '- GREETING: greetings, thanks, or blank/meaningless input (hi, hello, "asdf").\n' +
          "- INAPPROPRIATE: sexual, offensive, or abusive content.\n" +
          "- OFF_TOPIC: ONLY clearly non-informational requests unrelated to reading documents — " +
          "jokes, creative writing, coding help, general chit-chat. " +
          "When in doubt, choose DOCUMENT_QUESTION, never OFF_TOPIC.\n" +
          'Reply ONLY as JSON: {"category":"...","reason":"..."}',
      },
      { role: "user", content: question },
    ],
  });

  return schema.parse(JSON.parse(res.choices[0].message.content!));
}
