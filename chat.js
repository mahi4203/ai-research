// pages/api/chat.js
import { TavilyClient } from 'tavily';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

const tavilyClient = new TavilyClient({ apiKey: TAVILY_API_KEY });

async function searchWeb(query) {
  try {
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    const datedQuery = `${query} ${today}`;

    const response = await tavilyClient.search(datedQuery, {
      includeAnswer: 'advanced',
      searchDepth: 'advanced',
      includeImages: false,
      topic: 'news',
      days: 1,
      maxResults: 5,
    });

    const answer = response.answer || '';
    const results = response.results || [];
    const filtered = results.map(r =>
      `[${r.published_date || ''}] ${r.content}`
    ).join('\n');

    return `${answer}\n\n${filtered}`;
  } catch (e) {
    return `Search failed: ${e.message}`;
  }
}

const systemPrompt = `You are a high-accuracy AI research assistant.

Your task is to provide only verified, relevant, and current information.

STRICT RULES:
1. Always search the web before answering current-events or factual questions.
2. Only use trusted and high-authority sources.
3. Cross-check major facts across multiple reliable sources.
4. Never invent, assume, or speculate.
5. Never present outdated information as current.
6. Ignore low-quality, unclear, niche, or unverified sources.
7. If verification is weak or inconsistent, exclude the information.
8. Do not include filler analysis or generic commentary.
9. Keep answers concise, accurate, and directly relevant.

TRUSTED SOURCES PRIORITY:
- Reuters, AP News, BBC, Bloomberg, CNBC
- Official government websites
- Official company announcements
- Research papers and official documentation

FOR NEWS REQUESTS, ONLY include:
- major verified headlines
- important global or national developments
- officially confirmed events

DO NOT include: rumors, speculative reports, social media trends without verification, outdated stories.

RESPONSE FORMAT:
✅ Top Verified Headlines
- concise bullet points only

📈 Key Developments
- short factual explanations

📍 Why It Matters
- only if truly relevant

🔰 Final Summary
- 2-3 line accurate recap

STYLE: Professional, Clean, Research-focused, Direct. No fluff, no repetition.

MOST IMPORTANT RULE: If information is not confidently verified, do not include it.`;

const tools = [
  {
    type: 'function',
    function: {
      name: 'search_web',
      description: 'Search the web for the latest information. Use for current events, news, factual queries.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query string.',
          },
        },
        required: ['query'],
      },
    },
  },
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages' });
  }

  try {
    // Agentic loop: up to 5 tool call rounds
    let groqMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    for (let round = 0; round < 5; round++) {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'qwen/qwen3-32b',
          messages: groqMessages,
          tools,
          tool_choice: 'auto',
          max_tokens: 4096,
          temperature: 0,
        }),
      });

      const data = await groqRes.json();

      if (!groqRes.ok) {
        return res.status(500).json({ error: data.error?.message || 'Groq error' });
      }

      const choice = data.choices?.[0];
      const message = choice?.message;

      if (!message) {
        return res.status(500).json({ error: 'No response from model' });
      }

      // No tool calls — final answer
      if (!message.tool_calls || message.tool_calls.length === 0) {
        return res.status(200).json({ content: message.content });
      }

      // Process tool calls
      groqMessages.push(message);

      for (const toolCall of message.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments || '{}');
        let toolResult = '';

        if (toolCall.function.name === 'search_web') {
          toolResult = await searchWeb(args.query);
        } else {
          toolResult = 'Tool not found.';
        }

        groqMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: toolResult,
        });
      }
    }

    return res.status(200).json({ content: 'Could not complete the request after multiple attempts.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
