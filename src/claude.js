const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function findCommonThreads(summaries) {
  const formatted = summaries
    .map((s, i) => `--- Meeting ${i + 1}: ${s.name} (${s.date}) ---\n${s.summary}`)
    .join('\n\n');

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 2048,
    system:
      'You are an expert at analyzing meeting notes and identifying patterns. ' +
      'Your output will be inserted directly into a Word document, so use clear plain-text headings and bullet points.',
    messages: [
      {
        role: 'user',
        content: `Below are summaries from ${summaries.length} meetings over the past 7 days. ` +
          'Please identify the common threads, recurring themes, and any patterns the person might have missed. ' +
          'Structure your response as:\n\n' +
          '1. COMMON THREADS — bulleted list of recurring topics\n' +
          '2. KEY THEMES — 2-3 sentence narrative of the overarching patterns\n' +
          '3. THINGS TO WATCH — items that appeared multiple times and may need attention\n\n' +
          `Meeting summaries:\n\n${formatted}`,
      },
    ],
  });

  return message.content[0].text;
}

module.exports = { findCommonThreads };
