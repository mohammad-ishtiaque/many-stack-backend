const Intervention = require('../models/Intervention');
const Expense = require('../models/Expense');

exports.getHomePageData = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const interventions = await Intervention.find({ user: userId });
        const expenses = await Expense.find({ user: userId });

        const totalIncomeAmount = interventions.reduce((sum, int) => sum + int.price, 0);
        const totalExpenseAmount = expenses.reduce((sum, exp) => sum + exp.price, 0);
        const totalProfit = totalIncomeAmount - totalExpenseAmount;

        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const monthlyData = months.map((month, monthIndex) => {
            const monthIncome = interventions
                .filter(int => new Date(int.createdAt).getMonth() === monthIndex)
                .reduce((sum, int) => sum + int.price, 0);

            const monthExpense = expenses
                .filter(exp => new Date(exp.createdAt).getMonth() === monthIndex)
                .reduce((sum, exp) => sum + exp.price, 0);

            return {
                month,
                income: monthIncome.toFixed(2),
                expenses: monthExpense.toFixed(2),
                profit: (monthIncome - monthExpense).toFixed(2)
            };
        });

        const todayInterventions = interventions.filter(
            int => int.createdAt >= today && int.createdAt < new Date(today.getTime() + 24*60*60*1000)
        );
        const todayTotalPrice = todayInterventions.reduce((sum, int) => sum + int.price, 0);
        const interventionPercentage = interventions.length > 0 
            ? (todayInterventions.length / interventions.length) * 100 
            : 0;

        // Example: compare this month vs last month
        const currentMonthIndex = today.getMonth();
        const prevMonthIndex = (currentMonthIndex - 1 + 12) % 12;

        const currentMonthIncome = monthlyData[currentMonthIndex].income;
        const prevMonthIncome = monthlyData[prevMonthIndex].income;
        const currentMonthExpenses = monthlyData[currentMonthIndex].expenses;
        const prevMonthExpenses = monthlyData[prevMonthIndex].expenses;

        const incomeChange = prevMonthIncome ? ((currentMonthIncome - prevMonthIncome) / prevMonthIncome * 100).toFixed(1) : 0;
        const expenseChange = prevMonthExpenses ? ((currentMonthExpenses - prevMonthExpenses) / prevMonthExpenses * 100).toFixed(1) : 0;
        const profitChange = prevMonthIncome || prevMonthExpenses
            ? (((currentMonthIncome - currentMonthExpenses) - (prevMonthIncome - prevMonthExpenses)) / (prevMonthIncome - prevMonthExpenses) * 100).toFixed(1)
            : 0;

        // Get current month data separately (reuse currentMonthIndex defined above)
        const currentMonthInterventions = interventions.filter(int => 
            new Date(int.createdAt).getMonth() === currentMonthIndex
        );
        const currentMonthExpensesList = expenses.filter(exp => 
            new Date(exp.createdAt).getMonth() === currentMonthIndex
        );

        const currentMonthData = {
            income: currentMonthInterventions.reduce((sum, int) => sum + int.price, 0),
            expenses: currentMonthExpensesList.reduce((sum, exp) => sum + exp.price, 0),
            profit: currentMonthInterventions.reduce((sum, int) => sum + int.price, 0) - 
                    currentMonthExpensesList.reduce((sum, exp) => sum + exp.price, 0)
        };

        // Calculate current month statistics
        const currentMonthTotalInterventions = currentMonthInterventions.length;
        const currentMonthTotalExpenses = currentMonthExpensesList.length;
        const currentMonthTotalIncome = currentMonthData.income;
        const currentMonthTotalProfit = currentMonthData.profit;

        // Calculate percentage changes for current month
        const previousMonth = new Date();
        previousMonth.setMonth(today.getMonth() - 1);
        const previousMonthInterventions = interventions.filter(int => 
            new Date(int.createdAt).getMonth() === previousMonth.getMonth() &&
            new Date(int.createdAt).getFullYear() === previousMonth.getFullYear()
        ).length;

        const currentMonthPercentageChange = previousMonthInterventions ? 
            ((currentMonthTotalInterventions - previousMonthInterventions) / previousMonthInterventions * 100).toFixed(1) : 0;

        res.status(200).json({
            success: true,
            data: {
                totalProfit,
                profitChange: `${profitChange}%`,
                totalInterventions: interventions.length,
                totalExpenses: expenses.length,
                totalExpensesInPrice: totalExpenseAmount,
                totalInterventionsInPrice: totalIncomeAmount,
                totalIncome: totalIncomeAmount,
                incomeChange: `${incomeChange}%`,
                expenseChange: `${expenseChange}%`,
                interventionChange: interventionPercentage.toFixed(1) + '%',
                monthlyData,
                todayHighlights: {
                    totalInterventions: todayInterventions.length,
                    totalPrice: todayTotalPrice
                }
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
