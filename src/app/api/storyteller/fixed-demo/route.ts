import { createReadStream, statSync } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEMO_PATH = join(
  process.cwd(),
  "private-assets/storyteller/bed-khali-kon-aahe-cinematic-demo-v1.m4a",
);

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const referer = request.headers.get("referer");
  if (!referer || new URL(referer).origin !== requestUrl.origin) {
    return NextResponse.json(
      { error: "Direct demo downloads are not allowed." },
      { status: 403 },
    );
  }

  const size = statSync(DEMO_PATH).size;
  const range = request.headers.get("range");
  let start = 0;
  let end = size - 1;

  if (range) {
    const match = /^bytes=(\d+)-(\d*)$/.exec(range);
    if (!match) {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${size}` },
      });
    }
    start = Number(match[1]);
    end = match[2]
      ? Math.min(Number(match[2]), size - 1)
      : Math.min(start + 1024 * 1024 - 1, size - 1);
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= size) {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${size}` },
      });
    }
  }

  return new Response(
    Readable.toWeb(createReadStream(DEMO_PATH, { start, end })) as ReadableStream,
    {
      status: range ? 206 : 200,
      headers: {
        "Content-Type": "audio/mp4",
        "Content-Length": String(end - start + 1),
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Disposition": 'inline; filename="storyteller-demo.m4a"',
        "X-Content-Type-Options": "nosniff",
        ...(range ? { "Content-Range": `bytes ${start}-${end}/${size}` } : {}),
      },
    },
  );
}
