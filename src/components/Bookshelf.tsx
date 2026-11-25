import type { Shelf, ShelfStatus } from "@/lib/shelf";

const SPINE: Record<ShelfStatus, string> = {
  finished: "bg-done text-done-ink",
  in_progress: "bg-joy text-joy-ink",
  not_started: "bg-surface-2 text-muted ring-1 ring-inset ring-line",
};
const STATUS_TEXT: Record<ShelfStatus, string> = {
  finished: "finished",
  in_progress: "in progress",
  not_started: "not started",
};

// Spine height follows the book's length in the plan: 72px for one chapter up to 176px for Psalms.
const spineHeight = (chapters: number) => Math.round(72 + Math.min(chapters, 150) * (104 / 150));

/** The reading plan as a shelf of book spines. Flat CSS only. */
export function Bookshelf({ shelf }: { shelf: Shelf }) {
  return (
    <div>
      <div
        className="overflow-x-auto pb-1"
        tabIndex={0}
        aria-label="Reading plan bookshelf, scrolls sideways"
      >
        <ul className="border-ink flex w-max items-end gap-1.5 border-b-4 px-1">
          {shelf.books.map((b) => (
            <li
              key={b.book}
              className={`flex w-8 shrink-0 items-end justify-center rounded-t-[4px] pb-2 ${SPINE[b.status]}`}
              style={{ height: spineHeight(b.chapters) }}
            >
              <span
                aria-hidden
                className="rotate-180 text-xs font-bold whitespace-nowrap [writing-mode:vertical-rl]"
              >
                {b.book}
              </span>
              <span className="sr-only">
                {b.book}, {b.chapters} {b.chapters === 1 ? "chapter" : "chapters"}, {STATUS_TEXT[b.status]},
                you read {b.read}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <ul className="text-muted mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Colour key">
        <li className="flex items-center gap-2">
          <span aria-hidden className="bg-done size-3 rounded-sm" /> Finished
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden className="bg-joy size-3 rounded-sm" /> In progress
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden className="bg-surface-2 ring-line size-3 rounded-sm ring-1" /> Not started
        </li>
      </ul>
    </div>
  );
}
