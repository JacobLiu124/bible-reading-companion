import { chapterLabel } from "./books";

export type PlanDay = { day: string; book: string; chapter: number };
export type ShelfStatus = "finished" | "in_progress" | "not_started";
export type ShelfBook = { book: string; chapters: number; read: number; status: ShelfStatus };
export type Shelf = {
  books: ShelfBook[];
  current: { book: string; chapter: number } | null;
  booksFinished: number;
  chaptersRead: number;
};

/**
 * The reading plan as a shelf of books, in plan order.
 * A book's status follows the shared plan: finished once all its days are past,
 * in progress while today falls inside it, not started before then.
 * `read` counts the chapters this reader checked in on.
 */
export function buildShelf(plan: PlanDay[], today: string, checkIns: string[]): Shelf {
  const readDays = new Set(checkIns);
  const byBook = new Map<string, { book: string; days: PlanDay[] }>();
  for (const d of [...plan].sort((a, b) => a.day.localeCompare(b.day))) {
    const entry = byBook.get(d.book) ?? { book: d.book, days: [] };
    entry.days.push(d);
    byBook.set(d.book, entry);
  }

  let current: Shelf["current"] = null;
  const books = [...byBook.values()].map(({ book, days }) => {
    const first = days[0].day;
    const last = days[days.length - 1].day;
    const todays = days.find((d) => d.day === today);
    if (todays) current = { book, chapter: todays.chapter };
    const status: ShelfStatus = last < today ? "finished" : first <= today ? "in_progress" : "not_started";
    return { book, chapters: days.length, read: days.filter((d) => readDays.has(d.day)).length, status };
  });

  return {
    books,
    current,
    booksFinished: books.filter((b) => b.status === "finished").length,
    chaptersRead: books.reduce((n, b) => n + b.read, 0),
  };
}

/** One plain sentence about where the reader is in the plan. */
export function shelfSummary(shelf: Shelf): string {
  const total = shelf.books.length;
  const now = shelf.current
    ? `Reading ${chapterLabel(shelf.current.book, shelf.current.chapter)} today. `
    : "";
  const books = `${shelf.booksFinished} of ${total} ${total === 1 ? "book" : "books"} finished`;
  const chapters = `${shelf.chaptersRead} ${shelf.chaptersRead === 1 ? "chapter" : "chapters"} read`;
  return `${now}${books}, ${chapters}.`;
}
