/**
 * Offline unit tests for HomePage.controller.js logic
 * Run: node test-homepage-unit.js
 * No server or database required.
 */

// ── Copy the pure functions from the controller for isolated testing ──

const toFiniteNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const safeFixed2 = (value) => {
  const num = toFiniteNumber(value);
  return num.toFixed(2);
};

const calcPercentChange = (currentValue, previousValue) => {
  const currentNum = toFiniteNumber(currentValue);
  const previousNum = toFiniteNumber(previousValue);
  if (previousNum === 0) {
    if (currentNum > 0) return 100;
    if (currentNum < 0) return -100;
    return 0;
  }
  return ((currentNum - previousNum) / Math.abs(previousNum)) * 100;
};

const MONTH_NAME_MAP = {
  'janvier': 0, 'janv': 0, 'jan': 0,
  'février': 1, 'fevrier': 1, 'févr': 1, 'fevr': 1, 'fév': 1, 'fev': 1, 'feb': 1,
  'mars': 2, 'mar': 2,
  'avril': 3, 'avr': 3, 'apr': 3,
  'mai': 4, 'may': 4,
  'juin': 5, 'jun': 5,
  'juillet': 6, 'juil': 6, 'jul': 6,
  'août': 7, 'aout': 7, 'aoû': 7, 'aou': 7, 'aug': 7,
  'septembre': 8, 'sept': 8, 'sep': 8,
  'octobre': 9, 'oct': 9,
  'novembre': 10, 'nov': 10,
  'décembre': 11, 'decembre': 11, 'déc': 11, 'dec': 11,
};

const parseMonthIndex = (raw) => {
  if (!raw || typeof raw !== 'string') return -1;
  const cleaned = raw.replace(/\./g, '').trim().toLowerCase();
  if (!cleaned) return -1;
  const asNum = parseInt(cleaned, 10);
  if (!isNaN(asNum) && asNum >= 1 && asNum <= 12 && String(asNum) === cleaned) {
    return asNum - 1;
  }
  if (cleaned in MONTH_NAME_MAP) return MONTH_NAME_MAP[cleaned];
  const noAccents = cleaned.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (noAccents !== cleaned && noAccents in MONTH_NAME_MAP) return MONTH_NAME_MAP[noAccents];
  return -1;
};

const ensureDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val.toDate === 'function') return ensureDate(val.toDate());
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

// ── Test runner ──

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${testName}`);
  } else {
    failed++;
    console.log(`  ❌ ${testName}`);
  }
}

function assertEqual(actual, expected, testName) {
  if (actual === expected) {
    passed++;
    console.log(`  ✅ ${testName}`);
  } else {
    failed++;
    console.log(`  ❌ ${testName} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════
console.log('\n🔤 parseMonthIndex — French abbreviated names (with dots)');
// ═══════════════════════════════════════════════════════════════════════
assertEqual(parseMonthIndex('Janv.'), 0, 'Janv. → 0 (January)');
assertEqual(parseMonthIndex('Févr.'), 1, 'Févr. → 1 (February)');
assertEqual(parseMonthIndex('Mars'), 2, 'Mars → 2 (March)');
assertEqual(parseMonthIndex('Avr.'), 3, 'Avr. → 3 (April)');
assertEqual(parseMonthIndex('Mai'), 4, 'Mai → 4 (May)');
assertEqual(parseMonthIndex('Juin'), 5, 'Juin → 5 (June)');
assertEqual(parseMonthIndex('Juil.'), 6, 'Juil. → 6 (July)');
assertEqual(parseMonthIndex('Août'), 7, 'Août → 7 (August)');
assertEqual(parseMonthIndex('Sept.'), 8, 'Sept. → 8 (September)');
assertEqual(parseMonthIndex('Oct.'), 9, 'Oct. → 9 (October)');
assertEqual(parseMonthIndex('Nov.'), 10, 'Nov. → 10 (November)');
assertEqual(parseMonthIndex('Déc.'), 11, 'Déc. → 11 (December)');

// ═══════════════════════════════════════════════════════════════════════
console.log('\n🔤 parseMonthIndex — Full French names');
// ═══════════════════════════════════════════════════════════════════════
assertEqual(parseMonthIndex('Janvier'), 0, 'Janvier → 0');
assertEqual(parseMonthIndex('Février'), 1, 'Février → 1');
assertEqual(parseMonthIndex('Juillet'), 6, 'Juillet → 6');
assertEqual(parseMonthIndex('Août'), 7, 'Août → 7');
assertEqual(parseMonthIndex('Septembre'), 8, 'Septembre → 8');
assertEqual(parseMonthIndex('Décembre'), 11, 'Décembre → 11');

// ═══════════════════════════════════════════════════════════════════════
console.log('\n🔤 parseMonthIndex — Short codes (no dots)');
// ═══════════════════════════════════════════════════════════════════════
assertEqual(parseMonthIndex('Jan'), 0, 'Jan → 0');
assertEqual(parseMonthIndex('Fév'), 1, 'Fév → 1');
assertEqual(parseMonthIndex('Mar'), 2, 'Mar → 2');
assertEqual(parseMonthIndex('Avr'), 3, 'Avr → 3');
assertEqual(parseMonthIndex('Jun'), 5, 'Jun → 5');
assertEqual(parseMonthIndex('Juil'), 6, 'Juil → 6');
assertEqual(parseMonthIndex('Sep'), 8, 'Sep → 8');
assertEqual(parseMonthIndex('Oct'), 9, 'Oct → 9');
assertEqual(parseMonthIndex('Nov'), 10, 'Nov → 10');
assertEqual(parseMonthIndex('Déc'), 11, 'Déc → 11');

// ═══════════════════════════════════════════════════════════════════════
console.log('\n🔤 parseMonthIndex — Non-accented variants');
// ═══════════════════════════════════════════════════════════════════════
assertEqual(parseMonthIndex('fev'), 1, 'fev (no accent) → 1');
assertEqual(parseMonthIndex('fevrier'), 1, 'fevrier (no accent) → 1');
assertEqual(parseMonthIndex('aout'), 7, 'aout (no accent) → 7');
assertEqual(parseMonthIndex('decembre'), 11, 'decembre (no accent) → 11');
assertEqual(parseMonthIndex('dec'), 11, 'dec (no accent) → 11');

// ═══════════════════════════════════════════════════════════════════════
console.log('\n🔢 parseMonthIndex — Numeric values');
// ═══════════════════════════════════════════════════════════════════════
assertEqual(parseMonthIndex('1'), 0, '"1" → 0 (January)');
assertEqual(parseMonthIndex('6'), 5, '"6" → 5 (June)');
assertEqual(parseMonthIndex('7'), 6, '"7" → 6 (July)');
assertEqual(parseMonthIndex('8'), 7, '"8" → 7 (August)');
assertEqual(parseMonthIndex('12'), 11, '"12" → 11 (December)');

// ═══════════════════════════════════════════════════════════════════════
console.log('\n🔤 parseMonthIndex — Case insensitivity');
// ═══════════════════════════════════════════════════════════════════════
assertEqual(parseMonthIndex('JANVIER'), 0, 'JANVIER (uppercase) → 0');
assertEqual(parseMonthIndex('juin'), 5, 'juin (lowercase) → 5');
assertEqual(parseMonthIndex('AOÛT'), 7, 'AOÛT (uppercase accented) → 7');
assertEqual(parseMonthIndex('JuIlLeT'), 6, 'JuIlLeT (mixed case) → 6');

// ═══════════════════════════════════════════════════════════════════════
console.log('\n❌ parseMonthIndex — Invalid inputs');
// ═══════════════════════════════════════════════════════════════════════
assertEqual(parseMonthIndex(''), -1, 'Empty string → -1');
assertEqual(parseMonthIndex(null), -1, 'null → -1');
assertEqual(parseMonthIndex(undefined), -1, 'undefined → -1');
assertEqual(parseMonthIndex('xyz'), -1, '"xyz" → -1');
assertEqual(parseMonthIndex('0'), -1, '"0" → -1 (out of range)');
assertEqual(parseMonthIndex('13'), -1, '"13" → -1 (out of range)');
assertEqual(parseMonthIndex('-1'), -1, '"-1" → -1 (negative)');
assertEqual(parseMonthIndex('   '), -1, 'Whitespace only → -1');
assertEqual(parseMonthIndex('...'), -1, 'Dots only → -1');

// ═══════════════════════════════════════════════════════════════════════
console.log('\n📊 calcPercentChange — Percentage calculations');
// ═══════════════════════════════════════════════════════════════════════
assertEqual(calcPercentChange(100, 50), 100, '50→100 = +100%');
assertEqual(calcPercentChange(50, 100), -50, '100→50 = -50%');
assertEqual(calcPercentChange(0, 0), 0, '0→0 = 0%');
assertEqual(calcPercentChange(100, 0), 100, '0→100 = +100% (from zero)');
assertEqual(calcPercentChange(-50, 0), -100, '0→-50 = -100% (from zero, negative)');
assertEqual(calcPercentChange(0, 100), -100, '100→0 = -100%');
assertEqual(calcPercentChange(200, 200), 0, '200→200 = 0% (no change)');
assertEqual(typeof calcPercentChange(10, 5), 'number', 'Returns a number, not a string');

// ═══════════════════════════════════════════════════════════════════════
console.log('\n📅 ensureDate — Date normalization');
// ═══════════════════════════════════════════════════════════════════════
assert(ensureDate(null) === null, 'null → null');
assert(ensureDate(undefined) === null, 'undefined → null');
assert(ensureDate('') === null, 'Empty string → null');
assert(ensureDate('not-a-date') === null, 'Invalid string → null');
assert(ensureDate(new Date('invalid')) === null, 'Invalid Date object → null');
assert(ensureDate(new Date('2026-03-15')) instanceof Date, 'Valid Date → Date');
assert(ensureDate('2026-03-15T10:00:00Z') instanceof Date, 'ISO string → Date');
assertEqual(ensureDate('2026-03-15T10:00:00Z').toISOString(), '2026-03-15T10:00:00.000Z', 'ISO string parsed correctly');

// Test Mongoose-like toDate()
const mongooseDate = { toDate: () => new Date('2026-06-01') };
assert(ensureDate(mongooseDate) instanceof Date, 'Mongoose timestamp .toDate() → Date');

// Test epoch milliseconds
assert(ensureDate(1735689600000) instanceof Date, 'Epoch ms → Date');

// ═══════════════════════════════════════════════════════════════════════
console.log('\n📅 January edge case — previous month wraps to December of prev year');
// ═══════════════════════════════════════════════════════════════════════
{
  const targetYear = 2026;
  const selectedMonthIndex = 0; // January
  const prevMonthIndex = (selectedMonthIndex - 1 + 12) % 12;
  assertEqual(prevMonthIndex, 11, 'Previous month of Jan (index 0) is Dec (index 11)');

  const prevYear = selectedMonthIndex === 0 ? targetYear - 1 : targetYear;
  assertEqual(prevYear, 2025, 'Previous year for Jan 2026 is 2025');

  const prevStart = new Date(prevYear, prevMonthIndex, 1);
  assertEqual(prevStart.getFullYear(), 2025, 'prevStart year = 2025');
  assertEqual(prevStart.getMonth(), 11, 'prevStart month = December');

  const prevEnd = new Date(targetYear, selectedMonthIndex, 1);
  assertEqual(prevEnd.getFullYear(), 2026, 'prevEnd year = 2026');
  assertEqual(prevEnd.getMonth(), 0, 'prevEnd month = January');
  assert(prevStart < prevEnd, 'prevStart < prevEnd (valid range)');
}

// ═══════════════════════════════════════════════════════════════════════
console.log('\n📅 Non-January months — previous month stays in same year');
// ═══════════════════════════════════════════════════════════════════════
{
  for (let idx = 1; idx <= 11; idx++) {
    const targetYear = 2026;
    const prevYear = idx === 0 ? targetYear - 1 : targetYear;
    const prevIdx = (idx - 1 + 12) % 12;
    const prevStart = new Date(prevYear, prevIdx, 1);
    const prevEnd = new Date(targetYear, idx, 1);
    assert(prevStart < prevEnd, `Month ${idx}: prevStart (${prevStart.toISOString().slice(0,7)}) < prevEnd (${prevEnd.toISOString().slice(0,7)})`);
  }
}

// ═══════════════════════════════════════════════════════════════════════
console.log('\n📊 safeFixed2 — Formatting edge cases');
// ═══════════════════════════════════════════════════════════════════════
assertEqual(safeFixed2(0), '0.00', '0 → "0.00"');
assertEqual(safeFixed2(100.5), '100.50', '100.5 → "100.50"');
assertEqual(safeFixed2(-30.123), '-30.12', '-30.123 → "-30.12"');
assertEqual(safeFixed2(NaN), '0.00', 'NaN → "0.00"');
assertEqual(safeFixed2(Infinity), '0.00', 'Infinity → "0.00"');
assertEqual(safeFixed2(null), '0.00', 'null → "0.00"');
assertEqual(safeFixed2(undefined), '0.00', 'undefined → "0.00"');
assertEqual(safeFixed2('50.00'), '50.00', 'String "50.00" → "50.00" (re-parse safe)');

// ═══════════════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════════════
console.log('\n' + '═'.repeat(60));
console.log(`\n  Total: ${passed + failed}  |  ✅ Passed: ${passed}  |  ❌ Failed: ${failed}\n`);
if (failed > 0) {
  console.log('  ⚠️  Some tests failed! Please review the failures above.\n');
  process.exit(1);
} else {
  console.log('  🎉 All tests passed!\n');
  process.exit(0);
}
