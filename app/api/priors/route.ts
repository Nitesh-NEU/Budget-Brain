export async function GET() {
  return new Response(JSON.stringify({ message: "todo " }), {
    headers: { "Content-Type": "application/json" },
  });
}