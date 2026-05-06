import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

const client = new Anthropic();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildSystem(ctx: any): string {
  const arms = (ctx.design?.arms ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((a: any) => `${a.name} (n=${a.n || '?'})`)
    .join(', ') || 'Not defined';

  return `You are an expert clinical research consultant embedded in a protocol design workspace. You have deep expertise in FDA regulations (21 CFR Parts 50, 54, 56, 312, 314, 812), ICH guidelines (E6 GCP, E8, E9, E10), biostatistics, IRB submissions, and clinical trial design.

Current protocol context:
Title: ${ctx.protocolTitle || 'Not set'}
Phase: ${ctx.phase || 'Not set'} | Type: ${ctx.studyType || 'Not set'} | Indication: ${ctx.indication || 'Not set'}
Sponsor: ${ctx.sponsor || 'Not set'}

PICO:
  Population: ${ctx.hypothesis?.population || 'Not defined'}
  Intervention: ${ctx.hypothesis?.intervention || 'Not defined'}
  Comparator: ${ctx.hypothesis?.comparator || 'Not defined'}
  Primary Outcome: ${ctx.hypothesis?.primaryOutcome || 'Not defined'}
  Timeframe: ${ctx.hypothesis?.timeframe || 'Not defined'}

Endpoints:
  Primary: ${ctx.endpoints?.primary || 'Not defined'}
  Secondary: ${ctx.endpoints?.secondary || 'Not defined'}
  Safety: ${ctx.endpoints?.safety || 'Not defined'}

Design: ${ctx.design?.designType || 'Not set'} | Randomization: ${ctx.design?.randomization || 'N/A'} | Blinding: ${ctx.design?.blinding || 'N/A'}
Arms: ${arms}

Regulatory: FDA Pathway = ${ctx.regulatory?.fdaPathway || 'None'} | IRB Type = ${ctx.irb?.irbType || 'Not set'} | IRB Status = ${ctx.irb?.irbStatus || 'Not submitted'}
Stats: n=${ctx.stats?.sampleSizeTotal || '?'} | α=${ctx.stats?.alpha || '0.05'} | Power=${ctx.stats?.power || '80%'} | SAP=${ctx.stats?.sapStatus || 'not-started'}

Provide specific, actionable guidance. Reference relevant FDA guidances and ICH documents by number. Be concise and precise — this is a professional workspace for investigators and sponsors. Use markdown formatting with headers and bullets when helpful.`;
}

export async function POST(req: NextRequest) {
  const { messages, context } = (await req.json()) as {
    messages: { role: 'user' | 'assistant'; content: string }[];
    context: unknown;
  };

  const stream = client.messages.stream({
    model: 'claude-opus-4-7',
    max_tokens: 1024,
    system: buildSystem(context),
    messages,
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } finally {
        controller.close();
      }
    },
    cancel() { stream.abort(); },
  });

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
