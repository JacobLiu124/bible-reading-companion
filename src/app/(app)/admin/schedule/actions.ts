"use server";

import { type ActionResult, runAction } from "@/lib/actions";
import { chapterLabel, isValidChapter } from "@/lib/books";

export async function setScheduleDayAction(_: ActionResult, form: FormData): Promise<ActionResult> {
  const day = String(form.get("day") ?? "");
  const book = String(form.get("book") ?? "");
  const chapter = Number(form.get("chapter"));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return { error: "Pick a date." };
  if (!isValidChapter(book, chapter)) return { error: `${book || "That book"} doesn't have chapter ${chapter || "?"}.` };
  return runAction((sb) =>
    sb.from("reading_schedule").upsert({ day, book, chapter, label: chapterLabel(book, chapter) }),
  );
}

export async function clearScheduleDayAction(day: string): Promise<ActionResult> {
  return runAction((sb) => sb.from("reading_schedule").delete().eq("day", day));
}
