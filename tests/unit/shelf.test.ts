import { describe, expect, test } from "vitest";
import { buildShelf, shelfSummary } from "@/lib/shelf";

// Plan: John 1-3 (23-25 Nov), Mark 1-2 (26-27 Nov), Psalms 1-2 (28-29 Nov).
const plan = [
  { day: "2026-11-23", book: "John", chapter: 1 },
  { day: "2026-11-24", book: "John", chapter: 2 },
  { day: "2026-11-25", book: "John", chapter: 3 },
  { day: "2026-11-26", book: "Mark", chapter: 1 },
  { day: "2026-11-27", book: "Mark", chapter: 2 },
  { day: "2026-11-28", book: "Psalms", chapter: 1 },
  { day: "2026-11-29", book: "Psalms", chapter: 2 },
];

describe("buildShelf", () => {
  test("books keep plan order with their chapter counts", () => {
    const s = buildShelf(plan, "2026-11-24", []);
    expect(s.books.map((b) => [b.book, b.chapters])).toEqual([
      ["John", 3],
      ["Mark", 2],
      ["Psalms", 2],
    ]);
  });

  test("the book with today's chapter is in progress, earlier books finished, later not started", () => {
    const s = buildShelf(plan, "2026-11-26", []);
    expect(s.books.map((b) => b.status)).toEqual(["finished", "in_progress", "not_started"]);
    expect(s.current).toEqual({ book: "Mark", chapter: 1 });
  });

  test("counts the chapters you read, per book and in total", () => {
    const s = buildShelf(plan, "2026-11-26", ["2026-11-23", "2026-11-25", "2026-11-26", "2026-12-25"]);
    expect(s.books[0].read).toBe(2);
    expect(s.books[1].read).toBe(1);
    expect(s.chaptersRead).toBe(3);
    expect(s.booksFinished).toBe(1);
  });

  test("a day with no reading between books keeps the next book not started", () => {
    const gap = [plan[0], { ...plan[3], day: "2026-11-30" }];
    const s = buildShelf(gap, "2026-11-25", []);
    expect(s.books.map((b) => b.status)).toEqual(["finished", "not_started"]);
    expect(s.current).toBeNull();
  });

  test("after the plan ends every book is finished", () => {
    expect(buildShelf(plan, "2027-01-01", []).books.every((b) => b.status === "finished")).toBe(true);
  });
});

describe("shelfSummary", () => {
  test("names today's chapter, books finished and chapters read", () => {
    const s = buildShelf(plan, "2026-11-28", ["2026-11-23", "2026-11-24"]);
    expect(shelfSummary(s)).toBe("Reading Psalm 1 today. 2 of 3 books finished, 2 chapters read.");
  });
  test("singular wording and no 'today' when nothing is scheduled", () => {
    const s = buildShelf([plan[0]], "2026-12-01", ["2026-11-23"]);
    expect(shelfSummary(s)).toBe("1 of 1 book finished, 1 chapter read.");
  });
});
