# Reflection

**Name / Andrew ID:** Benjamin Najib / bnajibmo

**Recitation group members (Task 2):** William Liu

---

### 1. Valid but weak

Pick a property you wrote that passes on the correct implementation but
kills few or no mutants. Why is it still a *valid* property? Describe a
concrete bug (not one of our mutants) that it *would* catch.

Wordle invariant: "The result always has exactly five colors." It kills no
public mutants. It is valid because the spec says the function returns five
colors, and it passes on the correct implementation. It would catch an
off-by-one loop `for (let i = 0; i <= 5; i++)` in the green pass. At `i = 5`,
`guess[5]` and `secret[5]` are both `undefined`, so they compare equal and the
result gets a sixth color `'G'`.

### 2. A generator problem, not a property problem

Describe a mutant, from either task, that survived or was flaky because of
your **generator** rather than your property. What did the generator fail to
produce? How did you fix it? Paste the runner output from before and after.

`touchingNotMerged` in Task 2. My invariant "consecutive output intervals
neither overlap nor touch" already checks this bug. The generator drew
endpoints from the full integer range, so two intervals almost never shared an
endpoint, like `[1, 3]` and `[3, 5]`. I fixed it by drawing endpoints from -20
to 20 with `fc.integer({ min: -20, max: 20 })`. Shared endpoints are now common.

Before:

```
  ✘ touchingNotMerged       SURVIVED
```

After:

```
  ✔ touchingNotMerged       killed  by: consecutive output intervals neither overlap nor touch; reversing the input does not change the output
      Counterexample: [[[0,10],[10,10]]]
      AssertionError: expected 10 to be less than 10
```

### 3. Reading a counterexample

Paste one counterexample that the mutation runner printed for a killed
mutant. In 2–3 sentences, explain using the *specification* why that input
exposes the bug.

```
  ✔ greensOnly     killed  by: an anagram of the secret has no blacks
      Counterexample: [["AAAAZ","ZAAAA"]]
      AssertionError: expected [ 'B', 'G', 'G', 'G', 'B' ] to not include 'B'
```

The secret is `AAAAZ` and the guess is `ZAAAA`, so positions 1 to 3 are green.
By the spec, the guess's `Z` and last `A` each match an unused letter of the
secret (positions 4 and 0), so both must be yellow. The mutant marks them
black, so it does not assign yellows.

### 4. Your project

Name one function or module in your team's project that would benefit from
property-based testing. State two properties in English, name the pattern of
each, and describe the generator you'd need, including anything about its
inputs that a naive generator would get wrong.

`matches` in `packages/opencode/src/session/walkthrough.ts`. It checks that the
agent's walkthrough lists exactly the files it read in the current request,
once each. It would first need to be pulled out of `make` as a pure function
of the directory, the read files, and the walkthrough.

- Conditional: if the walkthrough lists each read file exactly once, in any
  order and in any equivalent path form, `matches` returns true.
- Metamorphic: duplicating any entry of a matching walkthrough makes `matches`
  return false.

Generator: build a set of distinct, normalized relative paths from short
segments as the read files. Build the walkthrough by shuffling them and
rewriting each path into an equivalent form: absolute, `./path`, or
`dir/../dir/path`. A naive generator of random path strings would almost
never produce a walkthrough that matches the read files, so the true case
would not be tested. It would also produce paths like `a` and `./a` that
resolve to the same file, so the read files would not be distinct.
