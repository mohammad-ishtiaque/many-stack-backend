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

const safePercentChange = (currentValue, previousValue) => {
  const currentNum = toFiniteNumber(currentValue);
  const previousNum = toFiniteNumber(previousValue);
  if (previousNum === 0) {
    if (currentNum > 0) return '100.00';
    if (currentNum < 0) return '-100.00';
    return '0.00';
  }
  const change = ((currentNum - previousNum) / Math.abs(previousNum)) * 100;
  return safeFixed2(change);
};

exports.getHomePageData = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Force fresh data fetch - no caching
    // Add a small delay to ensure any pending database operations are committed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const interventions = await Intervention.find({ 
      user: userId,
      createdAt: { $exists: true }
    }).lean();
    
    const expenses = await Expense.find({ 
      user: userId,
      createdAt: { $exists: true }
    }).lean();

    // Debug logging
    console.log(`Homepage Data Fetch - User: ${userId}`);
    console.log(`Interventions count: ${interventions.length}`);
    console.log(`Expenses count: ${expenses.length}`);
    console.log(`Total intervention amount: ${interventions.reduce(sumPrice, 0)}`);
    console.log(`Total expense amount: ${expenses.reduce(sumPrice, 0)}`);

    // Convert MongoDB dates to JavaScript Date objects
    interventions.forEach(int => {
      if (int.createdAt && typeof int.createdAt.toDate === 'function') {
        int.createdAt = int.createdAt.toDate();
      }
    });

    expenses.forEach(exp => {
      if (exp.createdAt && typeof exp.createdAt.toDate === 'function') {
        exp.createdAt = exp.createdAt.toDate();
      }
    });

    const totalIncomeAmount = interventions.reduce(sumPrice, 0);
    const totalExpenseAmount = expenses.reduce(sumPrice, 0);
    const totalProfit = toFiniteNumber(totalIncomeAmount) - toFiniteNumber(totalExpenseAmount);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyDataRaw = months.map((month, index) => {
      const startOfMonth = new Date(today.getFullYear(), index, 1);
      const endOfMonth = new Date(today.getFullYear(), index + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);

      const monthIncome = interventions
        .filter(int => int.createdAt && int.createdAt >= startOfMonth && int.createdAt <= endOfMonth)
        .reduce(sumPrice, 0);

      const monthExpense = expenses
        .filter(exp => exp.createdAt && exp.createdAt >= startOfMonth && exp.createdAt <= endOfMonth)
        .reduce(sumPrice, 0);

      return {
        month,
        income: safeFixed2(monthIncome),
        expenses: safeFixed2(monthExpense),
        profit: safeFixed2(toFiniteNumber(monthIncome) - toFiniteNumber(monthExpense))
      };
    });

    // Rotate monthly data so current month appears first (default view)
    const currentMonthIndex = today.getMonth();
    const monthlyData = [
      ...monthlyDataRaw.slice(currentMonthIndex),
      ...monthlyDataRaw.slice(0, currentMonthIndex)
    ];

    const todayInterventions = interventions.filter(
      int => int.createdAt && int.createdAt >= today && int.createdAt < tomorrow
    );

    const todayTotalPrice = todayInterventions.reduce(sumPrice, 0);
    const interventionPercentage = interventions.length > 0
      ? toFiniteNumber((todayInterventions.length / interventions.length) * 100)
      : 0;
    const prevMonthIndex = (currentMonthIndex - 1 + 12) % 12;

    const currentMonthIncome = toFiniteNumber(monthlyDataRaw[currentMonthIndex].income);
    const prevMonthIncome = toFiniteNumber(monthlyDataRaw[prevMonthIndex].income);
    const currentMonthExpenses = toFiniteNumber(monthlyDataRaw[currentMonthIndex].expenses);
    const prevMonthExpenses = toFiniteNumber(monthlyDataRaw[prevMonthIndex].expenses);

    const incomeChange = safePercentChange(currentMonthIncome, prevMonthIncome);
    const expenseChange = safePercentChange(currentMonthExpenses, prevMonthExpenses);

    const prevMonthProfit = toFiniteNumber(prevMonthIncome) - toFiniteNumber(prevMonthExpenses);
    const currentMonthProfit = toFiniteNumber(currentMonthIncome) - toFiniteNumber(currentMonthExpenses);
    const profitChange = safePercentChange(currentMonthProfit, prevMonthProfit);

    const currentMonthInterventions = interventions.filter(int =>
      int.createdAt.getMonth() === currentMonthIndex &&
      int.createdAt.getFullYear() === today.getFullYear()
    );
    const currentMonthExpensesList = expenses.filter(exp =>
      exp.createdAt.getMonth() === currentMonthIndex &&
      exp.createdAt.getFullYear() === today.getFullYear()
    );

    const currentMonthData = {
      income: safeFixed2(currentMonthInterventions.reduce(sumPrice, 0)),
      expenses: safeFixed2(currentMonthExpensesList.reduce(sumPrice, 0)),
      profit: safeFixed2(
        toFiniteNumber(currentMonthInterventions.reduce(sumPrice, 0)) -
        toFiniteNumber(currentMonthExpensesList.reduce(sumPrice, 0))
      )
    };

    const currentMonthTotalInterventions = currentMonthInterventions.length;
    const currentMonthTotalExpenses = currentMonthExpensesList.length;
    const currentMonthTotalIncome = currentMonthData.income;
    const currentMonthTotalProfit = currentMonthData.profit;

    const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(previousMonth.getFullYear(), previousMonth.getMonth() + 1, 1);
    const previousMonthInterventions = interventions.filter(int =>
      int.createdAt && int.createdAt >= previousMonth && int.createdAt < endOfPreviousMonth
    ).length;

    const currentMonthPercentageChange = previousMonthInterventions
      ? safeFixed2(((currentMonthTotalInterventions - previousMonthInterventions) / previousMonthInterventions) * 100)
      : '0.00';

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        totalProfit: safeFixed2(totalProfit),
        profitChange: `${safeFixed2(profitChange)}%`,
        totalInterventions: interventions.length,
        totalExpenses: expenses.length,
        totalExpensesInPrice: safeFixed2(totalExpenseAmount),
        totalInterventionsInPrice: safeFixed2(totalIncomeAmount),
        totalIncome: safeFixed2(totalIncomeAmount),
        incomeChange: `${safeFixed2(incomeChange)}%`,
        expenseChange: `${safeFixed2(expenseChange)}%`,
        interventionChange: safeFixed2(interventionPercentage) + '%',
        monthlyData,
        todayHighlights: {
          totalInterventions: todayInterventions.length,
          totalPrice: safeFixed2(todayTotalPrice)
        },
        currentMonthData,
        currentMonthPercentageChange,
        currentMonthTotalInterventions,
        currentMonthTotalExpenses,
        currentMonthTotalIncome,
        currentMonthTotalProfit,
        previousMonthInterventions
      }
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
