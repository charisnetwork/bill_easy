const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Invoice, Product, Company, Expense, Subscription, Plan } = require("../models");
const { Op } = require("sequelize");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const chatWithAssistant = async (req, res) => {
  const companyId = req.companyId;
  console.log(">>> Charis Assistant: Request received from Company ID:", companyId);
  
  try {
    const { question, history = [] } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error(">>> Charis Error: GEMINI_API_KEY is missing in backend .env");
      return res.status(500).json({ error: "AI service is not configured on the server." });
    }

    // CHECK 1: Verify user has Premium or Enterprise plan
    try {
      const subscription = await Subscription.findOne({
        where: { company_id: companyId },
        include: [{ model: Plan, attributes: ['plan_name'] }]
      });

      const allowedPlans = ['Premium', 'Enterprise'];
      const planName = subscription?.Plan?.plan_name;

      if (!subscription || !allowedPlans.includes(planName)) {
        console.log(`>>> Charis Access Denied: Company ${companyId} has plan '${planName}', not Premium/Enterprise`);
        return res.status(403).json({
          answer: "Charis AI Assistant is only available for Premium and Enterprise plan users. Please upgrade your plan to access this feature."
        });
      }

      console.log(`>>> Charis Access Granted: Company ${companyId} has ${planName} plan`);
    } catch (subError) {
      console.error(">>> Charis Subscription Check Error:", subError.message);
      return res.status(500).json({ error: "Failed to verify subscription." });
    }

    const lowerQuestion = question.toLowerCase();
    
    // 1. Fetch Business Data ALWAYS (don't rely on AI to filter)
    let businessData = {};
    
    try {
      // Get financial data
      const [totalSalesData, totalExpensesData] = await Promise.all([
        Invoice.sum('total_amount', { where: { company_id: companyId } }),
        Expense.sum('amount', { where: { company_id: companyId } })
      ]);

      // Get today's sales
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todaySalesData = await Invoice.sum('total_amount', { 
        where: { 
          company_id: companyId,
          invoice_date: { [Op.gte]: today }
        } 
      });

      // Get inventory data
      const totalProducts = await Product.count({ where: { company_id: companyId } });
      const lowStockProducts = await Product.findAll({
        where: { company_id: companyId },
        order: [['stock_quantity', 'ASC']],
        limit: 5,
        attributes: ['name', 'stock_quantity']
      });

      businessData = {
        todaySales: parseFloat(todaySalesData || 0),
        totalSales: parseFloat(totalSalesData || 0),
        totalExpenses: parseFloat(totalExpensesData || 0),
        netProfit: parseFloat(totalSalesData || 0) - parseFloat(totalExpensesData || 0),
        totalProducts: totalProducts,
        lowStockItems: lowStockProducts.map(p => `${p.name} (${p.stock_quantity} left)`).join(', ')
      };
      
      console.log(">>> Charis: Business data fetched:", businessData);
    } catch (dbError) {
      console.error(">>> Charis DB Error:", dbError.message);
    }

    const company = await Company.findByPk(companyId, { attributes: ['name'] });
    const businessName = company?.name || "your business";

    // 2. ULTRA STRICT Response - Only return business data, no AI creativity
    const isBusinessQuery = lowerQuestion.includes('sale') || 
                           lowerQuestion.includes('profit') || 
                           lowerQuestion.includes('loss') || 
                           lowerQuestion.includes('revenue') || 
                           lowerQuestion.includes('income') || 
                           lowerQuestion.includes('expense') || 
                           lowerQuestion.includes('money') || 
                           lowerQuestion.includes('today') || 
                           lowerQuestion.includes('total') || 
                           lowerQuestion.includes('business') ||
                           lowerQuestion.includes('stock') || 
                           lowerQuestion.includes('inventory') || 
                           lowerQuestion.includes('product');

    // Check for greetings
    const isGreeting = /^(hi|hello|hey|good morning|good afternoon|good evening|namaste)/i.test(question.trim());

    let responseText = "";

    if (isGreeting) {
      responseText = `Hello! I'm Charis, your business assistant for ${businessName}. I can help you with:\n\n• Today's Sales: ₹${businessData.todaySales?.toFixed(2) || '0.00'}\n• Total Sales: ₹${businessData.totalSales?.toFixed(2) || '0.00'}\n• Total Expenses: ₹${businessData.totalExpenses?.toFixed(2) || '0.00'}\n• Net Profit: ₹${businessData.netProfit?.toFixed(2) || '0.00'}\n• Total Products: ${businessData.totalProducts || 0}\n\nWhat would you like to know about your business?`;
    } else if (isBusinessQuery) {
      // Build response based on what they asked
      let answer = "";
      
      if (lowerQuestion.includes('today') && lowerQuestion.includes('sale')) {
        answer = `Today's Sales: ₹${businessData.todaySales?.toFixed(2) || '0.00'}`;
      } else if (lowerQuestion.includes('total') && lowerQuestion.includes('sale')) {
        answer = `Total Sales: ₹${businessData.totalSales?.toFixed(2) || '0.00'}`;
      } else if (lowerQuestion.includes('expense')) {
        answer = `Total Expenses: ₹${businessData.totalExpenses?.toFixed(2) || '0.00'}`;
      } else if (lowerQuestion.includes('profit') || lowerQuestion.includes('loss')) {
        const profit = businessData.netProfit || 0;
        answer = profit >= 0 
          ? `Net Profit: ₹${profit.toFixed(2)}` 
          : `Net Loss: ₹${Math.abs(profit).toFixed(2)}`;
      } else if (lowerQuestion.includes('stock') || lowerQuestion.includes('inventory') || lowerQuestion.includes('product')) {
        answer = `Total Products: ${businessData.totalProducts || 0}`;
        if (businessData.lowStockItems) {
          answer += `\n\nLow Stock Alert:\n${businessData.lowStockItems}`;
        }
      } else {
        // General business summary
        answer = `Here's your business summary:\n\n📊 Financials:\n• Today's Sales: ₹${businessData.todaySales?.toFixed(2) || '0.00'}\n• Total Sales: ₹${businessData.totalSales?.toFixed(2) || '0.00'}\n• Total Expenses: ₹${businessData.totalExpenses?.toFixed(2) || '0.00'}\n• Net Profit: ₹${businessData.netProfit?.toFixed(2) || '0.00'}\n\n📦 Inventory:\n• Total Products: ${businessData.totalProducts || 0}`;
        if (businessData.lowStockItems) {
          answer += `\n• Low Stock: ${businessData.lowStockItems}`;
        }
      }
      
      responseText = answer;
    } else {
      // Non-business query - strictly refuse
      responseText = "I'm Charis, your business data assistant for Bill Easy. I can only provide information about your sales, expenses, inventory, and profits. I cannot help with coding, general knowledge, or other tasks. How can I help you with your business today?";
    }

    console.log(">>> Charis: Sending business data response");
    res.json({ answer: responseText });

  } catch (error) {
    console.error(">>> Charis Assistant General Error:", error);
    res.status(500).json({ 
      error: "Charis is temporarily unavailable", 
      details: error.message 
    });
  }
};

module.exports = {
  chatWithAssistant
};
