const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Invoice, Product, Company, Expense } = require("../models");
const { Op } = require("sequelize");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const chatWithAssistant = async (req, res) => {
  const companyId = req.companyId;
  console.log(">>> Charis Assistant: Request received from Company ID:", companyId);
  
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error(">>> Charis Error: GEMINI_API_KEY is missing in backend .env");
      return res.status(500).json({ error: "AI service is not configured on the server." });
    }

    const lowerQuestion = question.toLowerCase();
    let financialContext = "";
    let inventoryContext = "";

    // 1. Conditional Context Fetching
    const isFinancialQuery = lowerQuestion.includes('profit') || lowerQuestion.includes('loss') || lowerQuestion.includes('sales') || lowerQuestion.includes('money');
    const isInventoryQuery = lowerQuestion.includes('stock') || lowerQuestion.includes('inventory');

    if (isFinancialQuery) {
      console.log(">>> Charis: Fetching Financial Context for relevant query...");
      try {
        const [totalSalesData, totalExpensesData] = await Promise.all([
          Invoice.sum('total_amount', { where: { company_id: companyId } }),
          Expense.sum('amount', { where: { company_id: companyId } })
        ]);

        const totalSales = parseFloat(totalSalesData || 0);
        const totalExpenses = parseFloat(totalExpensesData || 0);
        const netProfit = totalSales - totalExpenses;

        financialContext = `\n[Real-time Financial Data] Total Sales: ${totalSales.toFixed(2)}, Total Expenses: ${totalExpenses.toFixed(2)}, Net Profit: ${netProfit.toFixed(2)}.`;
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

        if (lowStockProducts.length > 0) {
          inventoryContext = "\n[Real-time Inventory Data] Items running low: " + lowStockProducts.map(p => `${p.name} (${p.stock_quantity} left)`).join(", ");
        } else {
          inventoryContext = "\n[Real-time Inventory Data] No products found in inventory.";
        }
      } catch (dbError) {
        console.error(">>> Charis DB Error (Inventory):", dbError.message);
      }
    }

    const company = await Company.findByPk(companyId, { attributes: ['name'] });
    const businessName = company?.name || "the business";

    // 2. Updated Personality & System Instruction
    const systemInstruction = `You are Charis, a friendly and intelligent business co-pilot for ${businessName}. 
Rules:
- Use the provided real-time data only when it is relevant to the user's question. 
- If the user says "Hi" or gives general greetings, reply like a normal assistant. Do not force financial numbers into every sentence.
- Formatting: Avoid using excessive markdown like triple asterisks (***). Use clean, readable text. Use bullet points only for lists of items or stock.
- Actions: If a user asks you to "create a bill," "make an invoice," or perform any database write action, politely explain that you are an AI assistant and they should use the "Create Sales Invoice" button in the sidebar. Do not pretend to have performed the action.
- Be concise, professional, and helpful.`;

    // 3. Prompt Construction
    const contextStr = (financialContext || inventoryContext) ? `\nContextual Data:${financialContext}${inventoryContext}` : "";
    const fullPrompt = `${systemInstruction}${contextStr}\n\nUser Question: ${question}`;

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
