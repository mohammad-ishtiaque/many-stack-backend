const Intervention = require('../models/Intervention');
const Expense = require('../models/Expense');

// Helper function to normalize dates to start of day
const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Numeric safety helpers
const toFiniteNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const sumPrice = (acc, item) => acc + toFiniteNumber(item?.price);

const safeFixed2 = (value) => {
  const num = toFiniteNumber(value);
  return num.toFixed(2);
};

// Returns a NUMBER (not a string) so callers can format it once
const safePercentChange = (currentValue, previousValue) => {
  const currentNum = toFiniteNumber(currentValue);
  const previousNum = toFiniteNumber(previousValue);
  if (previousNum === 0) {
    if (currentNum > 0) return 100;
    if (currentNum < 0) return -100;
    return 0;
  }
  return ((currentNum - previousNum) / Math.abs(previousNum)) * 100;
};

// Display-friendly month labels (French abbreviated)
const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

// Robust French month name → index lookup
// Covers: full names, common abbreviations (with/without dots), accented & non-accented variants, numeric (1-12)
const MONTH_NAME_MAP = {
  // January
  'janvier': 0, 'janv': 0, 'jan': 0,
  // February
  'février': 1, 'fevrier': 1, 'févr': 1, 'fevr': 1, 'fév': 1, 'fev': 1, 'feb': 1,
  // March
  'mars': 2, 'mar': 2,
  // April
  'avril': 3, 'avr': 3, 'apr': 3,
  // May
  'mai': 4, 'may': 4,
  // June
  'juin': 5, 'jun': 5,
  // July
  'juillet': 6, 'juil': 6, 'jul': 6,
  // August
  'août': 7, 'aout': 7, 'aoû': 7, 'aou': 7, 'aug': 7,
  // September
  'septembre': 8, 'sept': 8, 'sep': 8,
  // October
  'octobre': 9, 'oct': 9,
  // November
  'novembre': 10, 'nov': 10,
  // December
  'décembre': 11, 'decembre': 11, 'déc': 11, 'dec': 11,
};

/**
 * Parse a month query param into a 0-based month index.
 * Supports: numeric (1-12), French full/abbreviated names, with/without dots/accents.
 * Returns -1 if unrecognised.
 */
const parseMonthIndex = (raw) => {
  if (!raw || typeof raw !== 'string') return -1;

  // Strip dots and trailing/leading whitespace, lowercase
  const cleaned = raw.replace(/\./g, '').trim().toLowerCase();
  if (!cleaned) return -1;

  // Try numeric first (1-12)
  const asNum = parseInt(cleaned, 10);
  if (!isNaN(asNum) && asNum >= 1 && asNum <= 12 && String(asNum) === cleaned) {
    return asNum - 1;
  }

  // Try direct lookup
  if (cleaned in MONTH_NAME_MAP) return MONTH_NAME_MAP[cleaned];

  // Try stripping accents as a last resort (e.g. Février → fevrier)
  const noAccents = cleaned.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (noAccents !== cleaned && noAccents in MONTH_NAME_MAP) return MONTH_NAME_MAP[noAccents];

  return -1;
};

/**
 * Ensure a value is a proper JS Date. Handles Mongoose Timestamps, ISO strings, and epoch ms.
 * Returns null if the value cannot be converted.
 */
const ensureDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val.toDate === 'function') return ensureDate(val.toDate());
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

exports.getHomePageData = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = startOfDay(new Date());

    // ── Parse query params ──────────────────────────────────────────
    const queryMonthRaw = (req.query.month || '').toString().trim();
    const queryYearRaw = req.query.year;

    const parsedYear = Number(queryYearRaw);
    const targetYear = Number.isFinite(parsedYear) && parsedYear > 0 ? parsedYear : today.getFullYear();

    const monthFromQueryIndex = parseMonthIndex(queryMonthRaw);
    const currentMonthIndex = monthFromQueryIndex >= 0 ? monthFromQueryIndex : today.getMonth();

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // ── Fetch data ──────────────────────────────────────────────────
    const [interventions, expenses] = await Promise.all([
      Intervention.find({ user: userId, createdAt: { $exists: true } }).lean(),
      Expense.find({ user: userId, createdAt: { $exists: true } }).lean(),
    ]);

    // Normalise all createdAt fields to proper JS Date objects
    interventions.forEach(doc => { doc.createdAt = ensureDate(doc.createdAt); });
    expenses.forEach(doc => { doc.createdAt = ensureDate(doc.createdAt); });

    // ── Build monthly data for all 12 months of targetYear ──────────
    const monthlyDataRaw = months.map((label, idx) => {
      const monthStart = new Date(targetYear, idx, 1);
      const monthEnd = new Date(targetYear, idx + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);

      const monthInterventions = interventions.filter(
        d => d.createdAt && d.createdAt >= monthStart && d.createdAt <= monthEnd
      );
      const monthExpensesList = expenses.filter(
        d => d.createdAt && d.createdAt >= monthStart && d.createdAt <= monthEnd
      );

      const incomeSum = monthInterventions.reduce(sumPrice, 0);
      const expenseSum = monthExpensesList.reduce(sumPrice, 0);
      const profitNum = toFiniteNumber(incomeSum) - toFiniteNumber(expenseSum);

      // Previous month date range (correctly wraps to Dec of previous year for Jan)
      const prevYear = idx === 0 ? targetYear - 1 : targetYear;
      const prevIdx = (idx - 1 + 12) % 12;
      const prevStart = new Date(prevYear, prevIdx, 1);
      const prevEnd = new Date(targetYear, idx, 1); // first instant of current month
      const prevInterventionsCount = interventions.filter(
        d => d.createdAt && d.createdAt >= prevStart && d.createdAt < prevEnd
      ).length;

      const percentageChange = prevInterventionsCount
        ? toFiniteNumber(((monthInterventions.length - prevInterventionsCount) / prevInterventionsCount) * 100)
        : 0;

      return {
        month: label,
        income: safeFixed2(incomeSum),
        expenses: safeFixed2(expenseSum),
        profit: safeFixed2(profitNum),
        totalInterventions: monthInterventions.length,
        totalExpenses: monthExpensesList.length,
        percentageChange: safeFixed2(percentageChange),
        previousMonthInterventions: prevInterventionsCount,
      };
    });

    // ── Current month data (derived from the single monthlyDataRaw pass) ─
    const currentMonthIndexData = monthlyDataRaw[currentMonthIndex];
    const prevMonthIndex = (currentMonthIndex - 1 + 12) % 12;

    // For percentage-change comparisons we need the previous month's figures.
    // When currentMonthIndex is January, we need December of (targetYear - 1).
    let prevMonthIncome, prevMonthExpenses;
    if (currentMonthIndex === 0) {
      // Previous month is December of previous year — compute from raw data
      const prevStart = new Date(targetYear - 1, 11, 1);
      const prevEnd = new Date(targetYear, 0, 1);
      prevMonthIncome = interventions
        .filter(d => d.createdAt && d.createdAt >= prevStart && d.createdAt < prevEnd)
        .reduce(sumPrice, 0);
      prevMonthExpenses = expenses
        .filter(d => d.createdAt && d.createdAt >= prevStart && d.createdAt < prevEnd)
        .reduce(sumPrice, 0);
    } else {
      const prev = monthlyDataRaw[prevMonthIndex];
      prevMonthIncome = toFiniteNumber(prev.income);
      prevMonthExpenses = toFiniteNumber(prev.expenses);
    }
    const prevMonthProfit = toFiniteNumber(prevMonthIncome) - toFiniteNumber(prevMonthExpenses);

    const currentMonthIncome = toFiniteNumber(currentMonthIndexData.income);
    const currentMonthExpenses = toFiniteNumber(currentMonthIndexData.expenses);
    const currentMonthProfit = toFiniteNumber(currentMonthIndexData.profit);

    const incomeChange = safePercentChange(currentMonthIncome, prevMonthIncome);
    const expenseChange = safePercentChange(currentMonthExpenses, prevMonthExpenses);
    const profitChange = safePercentChange(currentMonthProfit, prevMonthProfit);

    // ── Today's highlights ──────────────────────────────────────────
    const todayInterventions = interventions.filter(
      d => d.createdAt && d.createdAt >= today && d.createdAt < tomorrow
    );
    const todayTotalPrice = todayInterventions.reduce(sumPrice, 0);

    // ── Previous month intervention count (for intervention % change) ─
    const prevYearForCount = currentMonthIndex === 0 ? targetYear - 1 : targetYear;
    const prevCountStart = new Date(prevYearForCount, prevMonthIndex, 1);
    const prevCountEnd = new Date(targetYear, currentMonthIndex, 1);
    const previousMonthInterventionCount = interventions.filter(
      d => d.createdAt && d.createdAt >= prevCountStart && d.createdAt < prevCountEnd
    ).length;

    const currentMonthPercentageChange = safePercentChange(
      currentMonthIndexData.totalInterventions,
      previousMonthInterventionCount
    );

    // ── Current month summary object (kept for backwards compatibility) ─
    const currentMonthData = {
      income: currentMonthIndexData.income,
      expenses: currentMonthIndexData.expenses,
      profit: currentMonthIndexData.profit,
    };

    // ── Build allMonthsData with richer per-month detail ────────────
    const allMonthsData = monthlyDataRaw.map((m, idx) => ({
      month: m.month,
      data: {
        income: m.income,
        expenses: m.expenses,
        profit: m.profit,
      },
      percentageChange: m.percentageChange,
      totalInterventions: m.totalInterventions,
      totalExpenses: m.totalExpenses,
      totalIncome: m.income,
      totalProfit: m.profit,
      previousMonthInterventions: m.previousMonthInterventions,
    }));

    // ── Response ────────────────────────────────────────────────────
    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        // Selected month totals
        totalProfit: currentMonthIndexData.profit,
        profitChange: `${safeFixed2(profitChange)}%`,
        totalInterventions: currentMonthIndexData.totalInterventions,
        totalExpenses: currentMonthIndexData.totalExpenses,
        totalExpensesInPrice: currentMonthIndexData.expenses,
        totalInterventionsInPrice: currentMonthIndexData.income,
        totalIncome: currentMonthIndexData.income,
        incomeChange: `${safeFixed2(incomeChange)}%`,
        expenseChange: `${safeFixed2(expenseChange)}%`,
        interventionChange: `${safeFixed2(currentMonthPercentageChange)}%`,
        selectedMonth: months[currentMonthIndex],
        selectedYear: targetYear,

        // Rotate monthly data so selected month appears first (matches original app expectation)
        monthlyData: [
          ...monthlyDataRaw.slice(currentMonthIndex),
          ...monthlyDataRaw.slice(0, currentMonthIndex)
        ],

        todayHighlights: {
          totalInterventions: todayInterventions.length,
          totalPrice: safeFixed2(todayTotalPrice),
        },

        // Backwards-compatible fields
        currentMonthData,
        currentMonthPercentageChange: safeFixed2(currentMonthPercentageChange),
        currentMonthTotalInterventions: currentMonthIndexData.totalInterventions,
        currentMonthTotalExpenses: currentMonthIndexData.totalExpenses,
        currentMonthTotalIncome: currentMonthIndexData.income,
        currentMonthTotalProfit: currentMonthIndexData.profit,
        previousMonthInterventions: previousMonthInterventionCount,
        allMonthsData,
      },
    });
  } catch (error) {
    console.error('Homepage data fetch error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Debug endpoint to check raw data
exports.getDebugData = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const interventions = await Intervention.find({ user: userId }).lean();
    const expenses = await Expense.find({ user: userId }).lean();
    
    res.status(200).json({
      success: true,
      debug: {
        userId,
        interventionsCount: interventions.length,
        expensesCount: expenses.length,
        interventions: interventions.map(int => ({
          id: int._id,
          price: int.price,
          createdAt: int.createdAt,
          status: int.status
        })),
        expenses: expenses.map(exp => ({
          id: exp._id,
          price: exp.price,
          createdAt: exp.createdAt,
          expenseName: exp.expenseName
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
