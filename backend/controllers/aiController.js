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
    let financialContext = "";
    let inventoryContext = "";

    // 1. Conditional Context Fetching - ONLY for in-app business data
    const isFinancialQuery = lowerQuestion.includes('sale') || lowerQuestion.includes('profit') || lowerQuestion.includes('loss') || lowerQuestion.includes('revenue') || lowerQuestion.includes('income') || lowerQuestion.includes('expense') || lowerQuestion.includes('money') || lowerQuestion.includes('today') || lowerQuestion.includes('total') || lowerQuestion.includes('business');
    const isInventoryQuery = lowerQuestion.includes('stock') || lowerQuestion.includes('inventory') || lowerQuestion.includes('product') || lowerQuestion.includes('item');

    if (isFinancialQuery) {
      console.log(">>> Charis: Fetching Financial Context for relevant query...");
      try {
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

        const totalSales = parseFloat(totalSalesData || 0);
        const totalExpenses = parseFloat(totalExpensesData || 0);
        const todaySales = parseFloat(todaySalesData || 0);
        const netProfit = totalSales - totalExpenses;

        financialContext = `\n[Real-time Business Data] Today's Sales: ₹${todaySales.toFixed(2)}, Total Sales: ₹${totalSales.toFixed(2)}, Total Expenses: ₹${totalExpenses.toFixed(2)}, Net Profit: ₹${netProfit.toFixed(2)}.`;
      } catch (dbError) {
        console.error(">>> Charis DB Error (Financial):", dbError.message);
      }
    }

    if (isInventoryQuery) {
      console.log(">>> Charis: Fetching Inventory Context for relevant query...");
      try {
        const lowStockProducts = await Product.findAll({
          where: { company_id: companyId },
          order: [['stock_quantity', 'ASC']],
          limit: 5,
          attributes: ['name', 'stock_quantity']
        });

        const totalProducts = await Product.count({ where: { company_id: companyId } });

        if (lowStockProducts.length > 0) {
          inventoryContext = `\n[Real-time Inventory Data] Total Products: ${totalProducts}. Items running low: ` + lowStockProducts.map(p => `${p.name} (${p.stock_quantity} left)`).join(", ");
        } else {
          inventoryContext = `\n[Real-time Inventory Data] Total Products: ${totalProducts}. All items well stocked.`;
        }
      } catch (dbError) {
        console.error(">>> Charis DB Error (Inventory):", dbError.message);
      }
    }

    const company = await Company.findByPk(companyId, { attributes: ['name'] });
    const businessName = company?.name || "your business";

    // 2. STRICT System Instruction - ONLY in-app business data, NO coding
    const systemInstruction = `You are Charis, an AI business assistant for ${businessName}.

STRICT RULES - YOU MUST FOLLOW:
1. PURPOSE: You ONLY provide in-app business data like sales, expenses, inventory, and profit/loss information.
2. NO CODING: You NEVER write code, provide scripts, terminal commands, or technical implementation. If asked for code, politely refuse: "I'm here to help with your business data only. For technical support, please contact our support team."
3. NO EXTERNAL HELP: You cannot help with general knowledge, weather, news, math problems, writing emails, or any non-business tasks.
4. BUSINESS ONLY: Only answer questions about: Today's sales, Total sales, Expenses, Profit/Loss, Inventory levels, Stock status, Product counts.
5. GREETINGS: If user says "Hi", respond warmly as a business assistant and offer to help with their sales/expenses/stock data.
6. NO ACTIONS: You cannot create invoices, bills, or perform any actions. Only READ and REPORT existing data.
7. CONCISE: Keep answers short and focused on the business data provided.

If asked anything outside business data (coding, general questions, etc.), reply: "I'm Charis, your business data assistant. I can help you with information about your sales, expenses, inventory, and profits. What would you like to know about your business today?"`;

    // 3. Build full prompt with system instruction and context
    const contextStr = (financialContext || inventoryContext) ? `\n[Your Business Data]:${financialContext}${inventoryContext}` : "";
    const fullPrompt = `${systemInstruction}\n\n${contextStr}\n\nUser Question: ${question}`;

    // 4. Gemini Call with Fallback
    let text;
    const modelName = "gemini-3-flash-preview";
    
    try {
      console.log(`>>> Charis: Attempting to call ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      text = response.text();
    } catch (apiError) {
      console.error(">>> Charis API Error (Primary):", apiError.message);
      try {
        console.log(`>>> Charis: Retrying with models/${modelName}...`);
        const model = genAI.getGenerativeModel({ model: `models/${modelName}` });
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        text = response.text();
      } catch (retryError) {
        console.error(">>> Charis API Error (Retry):", retryError.message);
        try {
          console.log(">>> Charis: Falling back to gemini-1.5-flash...");
          const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          const result = await fallbackModel.generateContent(fullPrompt);
          const response = await result.response;
          text = response.text();
        } catch (fatalError) {
          console.error(">>> Charis API Fatal Error:", fatalError.message);
          return res.status(200).json({ 
            answer: "Charis is currently updating its financial brain. Please try again in a moment." 
          });
        }
      }
    }

    console.log(">>> Charis successfully generated a response.");
    res.json({ answer: text });

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
