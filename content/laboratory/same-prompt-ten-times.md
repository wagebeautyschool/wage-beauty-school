## Question

Does the disagreement between repeated runs of one prompt tell you where a model is least grounded?

## Input

A single prompt asking for a factual-sounding brief on a mid-obscure topic: the history of a minor typeface, with dates, names, and a short assessment of its influence.

## Method

Run the identical prompt ten times in fresh sessions. Collect all ten outputs. For every factual claim, record how many of the ten runs make it, and whether it is correct when checked against a reference that is not a language model.

## Tools

One general-purpose language model; a spreadsheet; two printed references and one library catalogue for verification.

## Process

1. Ten runs, saved verbatim, no editing.
2. Every distinct claim extracted into a row.
3. Agreement count per claim (0–10).
4. Independent verification of each claim, marked true / false / unverifiable.
5. Cross-tabulate agreement against correctness.

## Result

Claims made by all ten runs were correct in the large majority of cases. Claims made by only three to six runs were roughly a coin flip. The wrongest single claim — a confidently stated founding date off by nineteen years — appeared in four runs, phrased slightly differently each time.

## Observations

- Low agreement was a strong warning sign. High agreement was reassuring but not proof; a few shared errors were shared by all ten.
- The *wording* of an unstable claim changed between runs even when the claim itself held. Instability of phrasing tracked instability of fact.
- Reading ten runs took about forty minutes. Reading one and verifying it properly would have taken nearly as long.

## Failure points

- One topic, one model. No idea yet how far this generalises.
- "Mid-obscure" is not a real category. Topic difficulty was chosen by feel.
- Verification of three claims was inconclusive and they were dropped, which biases the result toward the checkable.

## Next question

Can the agreement count be turned into a rough confidence score a non-expert could use without doing full verification — and does the method survive a change of topic domain and a change of model?
