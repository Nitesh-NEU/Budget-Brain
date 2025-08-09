export async function POST() {
  return new Response(JSON.stringify({ message: "todo optimize" }), {
    headers: { "Content-Type": "application/json" },
  });
}