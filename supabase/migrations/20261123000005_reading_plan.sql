-- Default reading plan: one chapter a day starting 2026-11-23.
-- Site admins can edit or extend it from /admin/schedule.
with books(ord, book, chapters) as (
  values (1, 'John', 21), (2, 'Mark', 16), (3, 'Psalms', 150), (4, 'Acts', 28),
         (5, 'Romans', 16), (6, 'Proverbs', 31), (7, 'Genesis', 50), (8, 'Luke', 24),
         (9, 'Philippians', 4), (10, 'Ephesians', 6), (11, 'James', 5),
         (12, 'Matthew', 28), (13, 'Exodus', 40)
),
chapters as (
  select b.book, c.n as chapter,
         row_number() over (order by b.ord, c.n) - 1 as idx
  from books b cross join lateral generate_series(1, b.chapters) as c(n)
)
insert into public.reading_schedule (day, book, chapter, label)
select date '2026-11-23' + idx::int, book, chapter,
       case when book = 'Psalms' then 'Psalm ' else book || ' ' end || chapter
from chapters
on conflict (day) do nothing;
