const Intervention = require('../models/Intervention');
const Expense = require('../models/Expense');

exports.getHomePageData = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get all interventions and expenses
        const interventions = await Intervention.find({ user: userId });
        const expenses = await Expense.find({ user: userId });

        // Calculate total profit
        const totalIncome = interventions.reduce((sum, int) => sum + int.price, 0);
        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.price, 0);
        const totalProfit = totalIncome - totalExpenses;

        // Get monthly data for charts
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyData = months.map(month => {
            const monthIndex = months.indexOf(month);
            
            // Filter interventions and expenses for this month
            const monthInterventions = interventions.filter(int => 
                new Date(int.createdAt).getMonth() === monthIndex
            );
            const monthExpenses = expenses.filter(exp => 
                new Date(exp.createdAt).getMonth() === monthIndex
            );

            return {
                month,
                income: monthInterventions.reduce((sum, int) => sum + int.price, 0),
                expenses: monthExpenses.reduce((sum, exp) => sum + exp.price, 0),
                profit: monthInterventions.reduce((sum, int) => sum + int.price, 0) - 
                       monthExpenses.reduce((sum, exp) => sum + exp.price, 0)
            };
        });

        // Get today's highlights
        const todayInterventions = await Intervention.find({
            user: userId,
            createdAt: {
                $gte: today,
                $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            }
        });

        const todayTotalPrice = todayInterventions.reduce((sum, int) => sum + int.price, 0);

        // Calculate percentage changes (compared to previous period)
        const previousPeriod = interventions.filter(int => 
            int.createdAt < today && 
            int.createdAt >= new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        ).length;

        const currentPeriod = interventions.filter(int => 
            int.createdAt >= today
        ).length;

        const percentageChange = previousPeriod ? 
            ((currentPeriod - previousPeriod) / previousPeriod * 100).toFixed(1) : 0;

        res.status(200).json({
            success: true,
            data: {
                totalProfit: totalProfit,
                profitChange: `${percentageChange}%`,
                totalInterventions: interventions.length,
                totalExpenses: expenses.length,
                totalExpensesInPrice: totalExpenses,
                totalInterventionsInPrice: totalIncome,
                totalIncome: totalIncome,
                interventionChange: `${percentageChange}%`,
                monthlyData: monthlyData,
                todayHighlights: {
                    totalInterventions: todayInterventions.length,
                    totalPrice: todayTotalPrice
                }
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};