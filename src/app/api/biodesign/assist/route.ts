import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type AssistType = 'need' | 'concept' | 'regulatory' | 'clinical' | 'ip-filing' | 'competitive';

const SYSTEM = `You are an expert medical device development consultant with deep expertise in the Stanford Biodesign framework, FDA regulatory affairs, IP strategy, and clinical trial design. Provide concise, professionally worded, clinically grounded suggestions appropriate for medical device startup teams. Always respond with valid JSON only — no markdown, no explanation, just the JSON object.`;

function buildPrompt(type: AssistType, ctx: Record<string, string>): string {
  const ctxLines = Object.entries(ctx)
    .filter(([, v]) => v?.trim())
    .map(([k, v]) => `  ${k}: ${v}`)
    .join('\n');

  switch (type) {
    case 'need':
      return `Complete or improve this Stanford Biodesign need statement based on the context provided.

Context:
${ctxLines}

Return a JSON object with these fields (improve empty fields, keep good ones):
{
  "problem": "specific unmet clinical need or task users cannot do well (1-2 sentences)",
  "population": "precise patient or user population with relevant clinical details",
  "setting": "clinical context, care setting, or procedure where the problem occurs",
  "outcome": "measurable desired outcome if the problem is solved"
}`;

    case 'concept':
      return `Draft a medical device concept based on the provided context.

Context:
${ctxLines}

Return a JSON object:
{
  "title": "clear concise concept name (3-6 words)",
  "description": "2-3 sentence description: what the device does, how it helps patients, key clinical benefit",
  "mechanism": "2-3 sentences: mechanism of action or technical approach, materials, how it interfaces with anatomy or workflow"
}`;

    case 'regulatory':
      return `Draft FDA regulatory language for this medical device.

Context:
${ctxLines}

Return a JSON object:
{
  "intendedUse": "FDA-format intended use statement (1-2 sentences, starting with 'The [device] is intended to...')",
  "indicationsForUse": "specific indications for use including patient population, anatomical site, clinical conditions, and care setting (2-4 sentences)",
  "substantialEquivalence": "argument for substantial equivalence: same intended use as predicate, technological characteristics comparison, and why any differences don't raise new safety/effectiveness questions (2-3 sentences)"
}`;

    case 'clinical':
      return `Design a clinical evidence strategy for this medical device.

Context:
${ctxLines}

Return a JSON object:
{
  "primaryEndpoint": "specific measurable primary endpoint with statistical framework (e.g., non-inferiority margin, success criteria)",
  "studyDesign": "recommended study design including type (RCT, single-arm, etc.), control arm if any, blinding, and rationale",
  "inclusionCriteria": "3-5 key inclusion criteria as a single string, semicolon-separated",
  "exclusionCriteria": "3-5 key exclusion criteria as a single string, semicolon-separated"
}`;

    case 'ip-filing':
      return `Draft content for this intellectual property filing.

Context:
${ctxLines}

Return a JSON object where keys are section names and values are drafted content (1-3 sentences each). Include only sections relevant to the filing type. For patent filings include: "field", "background", "summary", "claims_preview". For trademarks include: "mark_description", "goods_services", "distinctiveness_argument". For copyrights include: "work_description", "authorship_statement". For trade secrets include: "identification", "commercial_value", "protection_measures".`;

    case 'competitive':
      return `Research and analyze the competitive landscape for this medical device.

Context:
${ctxLines}

Return a JSON object:
{
  "positioning": "1-2 sentences on how this device is differentiated from likely competitors (focus on clinical workflow, patient outcomes, or regulatory pathway advantages)",
  "keyAdvantages": "3 key competitive advantages, semicolon-separated",
  "threats": "2-3 key competitive threats or market risks, semicolon-separated",
  "marketInsight": "1-2 sentences on market dynamics, barriers to entry, or key trends relevant to this device space"
}`;

    default:
      return '';
  }
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: 'ANTHROPIC_API_KEY not configured. Add it to your Vercel environment variables.' },
      { status: 503 }
    );
  }

  let body: { type: AssistType; context: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { type, context } = body;
  const prompt = buildPrompt(type, context ?? {});

  if (!prompt) {
    return Response.json({ error: `Unknown assist type: ${type}` }, { status: 400 });
  }

  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    const suggestions = JSON.parse(jsonMatch[0]);
    return Response.json({ suggestions });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
