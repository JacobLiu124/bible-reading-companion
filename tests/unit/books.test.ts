import { expect, test } from "vitest";
import { BOOKS, chapterLabel, isValidChapter } from "@/lib/books";

test("66-book Protestant canon with 1189 chapters", () => {
  expect(BOOKS).toHaveLength(66);
  expect(BOOKS.reduce((n, b) => n + b.chapters, 0)).toBe(1189);
  expect(BOOKS[0]).toEqual({ name: "Genesis", chapters: 50 });
  expect(BOOKS[65]).toEqual({ name: "Revelation", chapters: 22 });
});

test("labels", () => {
  expect(chapterLabel("Psalms", 23)).toBe("Psalm 23");
  expect(chapterLabel("John", 3)).toBe("John 3");
});

test("chapter bounds", () => {
  expect(isValidChapter("Jude", 1)).toBe(true);
  expect(isValidChapter("Jude", 2)).toBe(false);
  expect(isValidChapter("Tobit", 1)).toBe(false);
  expect(isValidChapter("Psalms", 0)).toBe(false);
});
