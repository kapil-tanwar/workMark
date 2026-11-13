import { test } from "node:test";
import assert from "node:assert/strict";
import { csvSafeCell, toCsv } from "../src/lib/csv.js";

test("formula-like values are neutralised", () => {
  for (const v of ["=1+1", "+cmd|' /C calc'!A0", "-2+3", "@SUM(A1)", "\t=1", "\r=1", "  =1+1"]) {
    assert.ok(csvSafeCell(v).startsWith(`"'`), `${JSON.stringify(v)} -> ${csvSafeCell(v)}`);
  }
});
test("ordinary values are only quoted, quotes are escaped", () => {
  assert.equal(csvSafeCell("Jane Doe"), '"Jane Doe"');
  assert.equal(csvSafeCell('say "hi", ok'), '"say ""hi"", ok"');
  assert.equal(csvSafeCell(null), '""');
  assert.equal(csvSafeCell(12), '"12"');
});
test("toCsv builds CRLF rows with a BOM", () => {
  const out = toCsv([["a", "=b"], ["c", "d"]]);
  assert.ok(out.startsWith("\uFEFF"));
  assert.equal(out.slice(1), `"a","'=b"\r\n"c","d"\r\n`);
});
