## Question

Does a deliberately crude first build reveal the real problem faster than a careful one?

## Input

Three unrelated tasks taken from ordinary work: a small data-cleaning script, a landing page, and the outline of a talk.

## Method

For each task, build the worst version that technically works inside a fixed time box (45 minutes). Log what broke, what was trivial, and what turned out to be a different problem than expected. Then build the real version and compare where the effort actually went.

## Tools

A text editor, a timer, and a rule against tidying anything.

## Process

Ongoing. Two of three tasks logged so far.

**Data-cleaning script.** The crude version hard-coded every column name. Within ten minutes it was obvious that the actual difficulty was not the cleaning logic but that the input format was inconsistent between files — something a careful, well-structured first version would have hidden behind abstraction for another hour.

**Landing page.** The crude version had no styling and placeholder copy. It immediately exposed that there was no clear single message; three competing claims were fighting for the top of the page. That is a writing problem, not a design problem, and the ugly build surfaced it in fifteen minutes.

## Result

In both logged cases the crude build relocated the problem — from where it was assumed to be, to where it actually was — inside the time box. The real builds afterwards were faster and aimed better.

## Observations

- The discomfort of shipping something ugly, even privately, is real and worth naming. It fades after the first few minutes.
- The crude build is only useful if you actually read it. Twice I nearly moved straight to the real version without stopping to look.

## Failure points

- Three tasks is nothing. Selection was casual.
- "Worst version that works" is not well defined and I have been inconsistent about how far to take it.
- No control: I did not build any of these carefully-first to compare directly.

## Next question

Is there a class of problem where building badly actively misleads — where the crude version's failures point at the wrong thing?
