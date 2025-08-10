export type AnyCitation = {
  title?: string;
  url?: string;
  text?: string;
  note?: string;
  id?: string;
};

const isValidUrl = (u: unknown): u is string =>
  typeof u === "string" && /^https?:\/\//i.test(u);

export function sanitizeCitations(incoming: any): AnyCitation[] {
  const list: any[] =
    Array.isArray(incoming) ? incoming :
    Array.isArray(incoming?.sources) ? incoming.sources :
    Array.isArray(incoming?.sourceLinks) ? incoming.sourceLinks :
    [];

  return list.map((c) => {
    const url = isValidUrl(c?.url) ? c.url : isValidUrl(c) ? c : undefined;
    const title = typeof c?.title === "string" && c.title.trim() ? c.title.trim() : undefined;
    const text  = typeof c?.text  === "string" && c.text.trim()  ? c.text.trim()  : undefined;
    const note  = typeof c?.note  === "string" && c.note.trim()  ? c.note.trim()  : undefined;
    const id    = typeof c?.id    === "string" && c.id.trim()    ? c.id.trim()    : undefined;

    const fallbackTitle = (!title && url) ? new URL(url).hostname.replace(/^www\./, "") : undefined;

    if (!url && !title && !text && id) return { id };

    return { title: title || fallbackTitle, url, text, note, id };
  })
  .filter((c) => c.url || c.title || c.text || c.id);
}
