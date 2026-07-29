import { NextRequest, NextResponse } from "next/server";
import { retrieve } from "../../src/lib/retrieve";
import { generateAnswer } from "../../src/lib/answer";
import type { RetrievedChunk } from "../../src/lib/retrieve";
import { verifyCitations } from "../../src/lib/verityChunk";
import { checkRateLimit } from "../../src/lib/rateLimit";
import { detectInjection } from "../../src/lib/injectionGuard";
import { classifyIntent } from "../../src/lib/queryIntent";
import { summarizeSource } from "../../src/lib/summrize";

const RELEVANCE_THRESHOLD = 0.25; // tune empirically

export async function POST(req: NextRequest) {
  // --- rate limit: first thing, before spending anything ---
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "local";

  const rateLimit = await checkRateLimit(ipAddress);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please try again later." },
      { status: 429, headers: { "Retry-After": rateLimit.retryAfter.toString() } }
    );
  }

  const { question, sourceIds, playlistId } = await req.json();
  if (!question?.trim()) return NextResponse.json({ error: "Question required" }, { status: 400 });

  const injection = await detectInjection(question);
  if (injection.isInjection) {
    return NextResponse.json(
      { error: `Injection detected: ${injection.reason}. Please try again.` },
      { status: 400 }
    );
  }

  const intent = await classifyIntent(question);

  switch (intent.category) {
    case "GREETING":
      return NextResponse.json({
        answer:
          "Hi! Ask me a question about your uploaded documents and I’ll find the answer with citations.",
        citations: [],
      });

    case "INAPPROPRIATE":
      return NextResponse.json(
        { error: "That request isn’t something I can help with." },
        { status: 400 }
      );

    case "OFF_TOPIC":
      return NextResponse.json({
        answer:
          "I can only answer questions about your uploaded documents. Try asking about their content.",
        citations: [],
      });

    case "SUMMARY_REQUEST": {
      // summary needs a target source. Require sourceIds for now.
      const targetId = sourceIds?.[0];
      if (!targetId) {
        return NextResponse.json({
          answer: "Which document would you like summarized? Please select a source.",
          citations: [],
        });
      }

      const result = await summarizeSource(targetId);
      if (!result) {
        return NextResponse.json({
          answer: "I couldn't find that source. result is null.",
          citations: [],
        });
      }

      return NextResponse.json({
        answer: result.summary,
        citations: [{ sourceId: result.sourceId, title: result.title }], // whole-source citation
        mode: "summary",
      });
    }

    case "DOCUMENT_QUESTION":
      break; // fall through to retrieve -> rerank -> generate
  }

  const candidates = await retrieve(question, { topK: 10, sourceIds, playlistId });

  if (candidates.length === 0)
    return NextResponse.json({
      answer: "I couldn't find this in your sources candidates length is 0.",
      citations: [],
    });

  // threshold gate on the VECTOR score now (not rerank)
  const topScore = candidates[0]?.score ?? 0;

  if (topScore < RELEVANCE_THRESHOLD) {
    // vector scores run lower than rerank — tune this
    return NextResponse.json({
      answer: "I couldn't find this in your sources topScore is less than relevance threshold.",
      citations: [],
    });
  }

  // 4. generate from the top 5
  const result = await generateAnswer(question, candidates);

  const citations = candidates // the chunks you sent to the LLM
    .map((c) => ({
      chunkId: c.chunkId,
      sourceId: c.sourceId,
      title: c.title,
      snippet: c.snippet,
      ...(c.page !== undefined ? { page: c.page } : {}),
      ...(c.startSeconds !== undefined
        ? { videoId: c.videoId, startSeconds: c.startSeconds, endSeconds: c.endSeconds }
        : {}),
    }));

  // grounding gate: model says it's not in sources -> return fallback
  if (!result.foundInSources) {
    return NextResponse.json({
      answer: "I couldn't find this in your sources. result.foundInSources is false.",
      citations: [],
    });
  }

  // citation verificationF
  const { trustworthy } = verifyCitations(result, candidates);

  // strict: a factual answer with no valid citation is not trustworthy -> refuse
  if (!trustworthy) {
    return NextResponse.json({
      answer: "I couldn't find this in your sources. !trustworthy",
      citations: [],
    });
  }

  return NextResponse.json({
    answer: result.answer,
    citations,
    topScore,
    followUps: result.followUps,
  });
}
