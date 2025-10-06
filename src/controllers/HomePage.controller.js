const Intervention = require('../models/Intervention');
const Expense = require('../models/Expense');

exports.getHomePageData = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const interventions = await Intervention.find({ user: userId });
    const expenses = await Expense.find({ user: userId });

    const totalIncomeAmount = interventions.reduce((total, int) => total + int.price, 0);
    const totalExpenseAmount = expenses.reduce((total, exp) => total + exp.price, 0);
    const totalProfit = totalIncomeAmount - totalExpenseAmount;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = months.map((month, index) => {
      const startOfMonth = new Date(today.getFullYear(), index, 1);
      const endOfMonth = new Date(today.getFullYear(), index + 1, 0);

      const monthIncome = interventions
        .filter(int => int.createdAt >= startOfMonth && int.createdAt <= endOfMonth)
        .reduce((total, int) => total + int.price, 0);

      const monthExpense = expenses
        .filter(exp => exp.createdAt >= startOfMonth && exp.createdAt <= endOfMonth)
        .reduce((total, exp) => total + exp.price, 0);

      return {
        month,
        income: monthIncome.toFixed(2),
        expenses: monthExpense.toFixed(2),
        profit: (monthIncome - monthExpense).toFixed(2)
      };
    });

    const todayInterventions = interventions.filter(
      int => int.createdAt >= today && int.createdAt < new Date(today.getTime() + 24 * 60 * 60 * 1000)
    );
    const todayTotalPrice = todayInterventions.reduce((total, int) => total + int.price, 0);
    const interventionPercentage = interventions.length > 0
      ? (todayInterventions.length / interventions.length) * 100
      : 0;

    const currentMonthIndex = today.getMonth();
    const prevMonthIndex = (currentMonthIndex - 1 + 12) % 12;

    const currentMonthIncome = monthlyData[currentMonthIndex].income;
    const prevMonthIncome = monthlyData[prevMonthIndex].income;
    const currentMonthExpenses = monthlyData[currentMonthIndex].expenses;
    const prevMonthExpenses = monthlyData[prevMonthIndex].expenses;

    const incomeChange = prevMonthIncome
      ? ((currentMonthIncome - prevMonthIncome) / prevMonthIncome * 100).toFixed(1)
      : 0;
    const expenseChange = prevMonthExpenses
      ? ((currentMonthExpenses - prevMonthExpenses) / prevMonthExpenses * 100).toFixed(1)
      : 0;
    const profitChange = prevMonthIncome || prevMonthExpenses
      ? (((currentMonthIncome - currentMonthExpenses) - (prevMonthIncome - prevMonthExpenses)) / (prevMonthIncome - prevMonthExpenses) * 100).toFixed(1)
      : 0;

    const currentMonthInterventions = interventions.filter(int =>
      int.createdAt.getMonth() === currentMonthIndex &&
      int.createdAt.getFullYear() === today.getFullYear()
    );
    const currentMonthExpensesList = expenses.filter(exp =>
      exp.createdAt.getMonth() === currentMonthIndex &&
      exp.createdAt.getFullYear() === today.getFullYear()
    );

    const currentMonthData = {
      income: currentMonthInterventions.reduce((total, int) => total + int.price, 0).toFixed(2),
      expenses: currentMonthExpensesList.reduce((total, exp) => total + exp.price, 0).toFixed(2),
      profit: (currentMonthInterventions.reduce((total, int) => total + int.price, 0) -
        currentMonthExpensesList.reduce((total, exp) => total + exp.price, 0)).toFixed(2)
    };

    const currentMonthTotalInterventions = currentMonthInterventions.length;
    const currentMonthTotalExpenses = currentMonthExpensesList.length;
    const currentMonthTotalIncome = currentMonthData.income;
    const currentMonthTotalProfit = currentMonthData.profit;

    const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const previousMonthInterventions = interventions.filter(int =>
      int.createdAt >= previousMonth &&
      int.createdAt < new Date(previousMonth.getFullYear(), previousMonth.getMonth() + 1, 0)
    ).length;

    const currentMonthPercentageChange = previousMonthInterventions
      ? ((currentMonthTotalInterventions - previousMonthInterventions) / previousMonthInterventions * 100).toFixed(1)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        totalProfit: totalProfit.toFixed(2),
        profitChange: `${profitChange}%`,
        totalInterventions: interventions.length,
        totalExpenses: expenses.length,
        totalExpensesInPrice: totalExpenseAmount.toFixed(2),
        totalInterventionsInPrice: totalIncomeAmount.toFixed(2),
        totalIncome: totalIncomeAmount.toFixed(2),
        incomeChange: `${incomeChange}%`,
        expenseChange: `${expenseChange}%`,
        interventionChange: interventionPercentage.toFixed(1) + '%',
        monthlyData,
        todayHighlights: {
          totalInterventions: todayInterventions.length,
          totalPrice: todayTotalPrice.toFixed(2)
        },
        currentMonthData,
        currentMonthPercentageChange,
        currentMonthTotalInterventions,
        currentMonthTotalExpenses,
        currentMonthTotalIncome,
        currentMonthTotalProfit,
        previousMonthInterventions,
        currentMonthPercentageChange
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
