import { NextResponse } from 'next/server';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOSTNAME,
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
});

export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {

  const { name } = await params;
  const cache_key = "gh-repo-" + name;

  console.log("name, cache_key : " + name + " " + cache_key);

  try {
    const cached = await redis.get(cache_key)
    if (cached) {
      return NextResponse.json({ status: 200, data: JSON.parse(cached) });
    }

    const response = await fetch(`https://raw.githubusercontent.com/isaacchacko/${name}/refs/heads/main/README.md`);

    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json({ status: response.status, title: "GitHub GET request error" });
    }

    const htmlResponse = await fetch("https://api.github.com/markdown", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // You can add Authorization if you hit rate limits:
        // "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`,
      },
      body: JSON.stringify({
        text: text,
        mode: "gfm", // GitHub Flavored Markdown
      }),
    });

    if (!htmlResponse.ok) {
      return NextResponse.json({ status: htmlResponse.status, title: "GitHub Markdown API error" });
    }

    const html = await htmlResponse.text();

    // Cache the HTML
    await redis.set(cache_key, JSON.stringify(html), 'EX', 120);

    return NextResponse.json({ status: 200, data: html });

  } catch (error) {
    return NextResponse.json({ status: 500, title: "Internal server error", message: String(error) })
  }
}
