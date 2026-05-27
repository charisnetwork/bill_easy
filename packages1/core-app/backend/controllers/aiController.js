const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Invoice, Product, Company, Expense, Subscription, Plan, AIUsage, Purchase, Supplier } = require("../models");
const { Op, sequelize } = require("sequelize");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// STRICT SYSTEM INSTRUCTION FOR CHARIS
const CHARIS_SYSTEM_INSTRUCTION = `You are Charis, the exclusive AI assistant for Bill Easy - a GST billing and inventory management platform.

🚫 STRICT RULES - NEVER VIOLATE:
1. ONLY discuss Bill Easy platform topics: Invoices, E-way Bills, Purchase Orders, Reports, Products, Stock, GST, Customers, Suppliers
2. NEVER answer coding questions, programming, general news, weather, sports, entertainment, or any non-business topics
3. NEVER provide code examples, scripts, or technical implementations
4. If asked about unrelated topics, politely redirect: "I'm Charis, your Bill Easy assistant. I can only help with billing, inventory, and business tasks on the Bill Easy platform."

✅ ALLOWED TOPICS:
- How to create invoices, quotations, credit notes
- How to create E-way bills and track them
- How to create Purchase Orders (PO)
- How to generate and read reports (sales, purchase, GST, stock)
- How to add/manage products and stock
- How to add customers and suppliers
- GST calculations and compliance
- How to use Bill Easy features

📋 BILL EASY FEATURES GUIDE:

1. CREATE INVOICE:
   - Go to Sales → Invoices → Create Invoice
   - Select Customer or add new
   - Add items (search existing or type new)
   - Set GST rates, quantities, prices
   - Save and print/share

2. CREATE E-WAY BILL:
   - Go to Sales → E-way Bills → Create E-way Bill
   - Fill vehicle details, distance, transport info
   - Generate and print

3. CREATE PURCHASE ORDER (PO):
   - Go to Purchase → Purchase Orders → Create PO
   - Select Supplier
   - Add items to order
   - Set expected delivery date
   - Save and send to supplier

4. VIEW REPORTS:
   - Go to Reports section
   - Available: Sales Report, Purchase Report, GST Report, Stock Report, Profit/Loss
   - Select date range and filters
   - Export to PDF/Excel

5. ADD PRODUCT:
   - Go to Products → Add Product
   - Fill: Name, HSN Code, GST Rate, Unit, Opening Stock
   - Set Low Stock Alert
   - Save

6. MANAGE STOCK:
   - View low stock alerts on dashboard
   - Go to Inventory → Stock Adjustment
   - Transfer between godowns
   - Update quantities

Always be helpful, concise, and guide users step-by-step for Bill Easy operations.`;

const chatWithAssistant = async (req, res) => {
  const companyId = req.companyId;
  const userId = req.user.id;
  // Charis Assistant request received
  
  try {
    const { question, pdfData, pdfType } = req.body;

    if (!question && !pdfData) {
      return res.status(400).json({ error: "Question or PDF data is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      // GEMINI_API_KEY missing error
      return res.status(500).json({ error: "AI service is not configured on the server." });
    }

    // 1. Check Usage Limits
    const subscription = await Subscription.findOne({
      where: { company_id: companyId },
      include: [Plan]
    });

    const planName = subscription?.Plan?.plan_name || 'Free Account';
    let dailyLimit = 12;

    if (planName.toLowerCase().includes('premium')) {
      dailyLimit = 50;
    } else if (planName.toLowerCase().includes('enterprise')) {
      dailyLimit = 100;
    }

    const today = new Date().toISOString().split('T')[0];
    const [usage, created] = await AIUsage.findOrCreate({
      where: { user_id: userId, date: today },
      defaults: { company_id: companyId, count: 0 }
    });

    if (usage.count >= dailyLimit) {
      return res.status(403).json({ 
        error: `Daily limit reached. Your ${planName} allows ${dailyLimit} messages per day. Please upgrade for more access.` 
      });
    }

    // 2. STRICT Topic Filtering - Block non-Bill Easy topics
    const lowerQuestion = (question || '').toLowerCase();
    
    // STRICT BLOCK LIST - Topics Charis should NEVER answer
    const blockedTopics = [
      'code', 'coding', 'programming', 'script', 'python', 'javascript', 'java', 'c++',
      'news', 'weather', 'sports', 'cricket', 'football', 'movie', 'film', 'song',
      'recipe', 'cooking', 'travel', 'politics', 'election', 'stock market', 'crypto',
      'bitcoin', 'game', 'gaming', 'playstation', 'xbox', 'dating', 'relationship'
    ];
    
    const isBlocked = blockedTopics.some(topic => lowerQuestion.includes(topic));
    
    if (isBlocked) {
      return res.json({ 
        answer: "🚫 I'm Charis, your Bill Easy business assistant. I cannot help with coding, news, entertainment, or general topics.\n\n✅ I can help you with:\n• Creating invoices, e-way bills, purchase orders\n• Generating sales, GST, and stock reports\n• Managing products and inventory\n• Bill Easy platform features\n\nHow can I assist with your billing or inventory today?" 
      });
    }

    // 3. Handle PDF Processing for Items/Purchases
    let pdfContext = "";
    if (pdfData && pdfType) {
      // Processing PDF data
      
      if (pdfType === 'purchase_invoice' || pdfType === 'supplier_bill') {
        pdfContext = `\n[PDF DATA PROVIDED - Purchase Document]\nExtract product details from this PDF and:\n1. If item exists in database: Add purchase quantity to stock\n2. If item is NEW: Create new product with details\n\nPDF Content Summary: ${pdfData.substring(0, 2000)}`;
      } else if (pdfType === 'product_catalog') {
        pdfContext = `\n[PDF DATA PROVIDED - Product Catalog]\nExtract products and add them to inventory. Create new products if they don't exist.\n\nPDF Content: ${pdfData.substring(0, 2000)}`;
      }
    }

    // 4. Fetch Contextual Data
    let financialContext = "";
    let inventoryContext = "";

    const isFinancialQuery = lowerQuestion.includes('profit') || lowerQuestion.includes('loss') || 
                            lowerQuestion.includes('sales') || lowerQuestion.includes('money') || 
                            lowerQuestion.includes('total') || lowerQuestion.includes('expense');
    
    const isInventoryQuery = lowerQuestion.includes('stock') || lowerQuestion.includes('inventory') || 
                            lowerQuestion.includes('item') || lowerQuestion.includes('product') ||
                            lowerQuestion.includes('low stock');

    if (isFinancialQuery) {
      // Fetching financial context
      try {
        const todayStart = new Date();
        todayStart.setHours(0,0,0,0);

        const [totalSalesData, todaySalesData, totalExpensesData] = await Promise.all([
          Invoice.sum('total_amount', { where: { company_id: companyId } }),
          Invoice.sum('total_amount', { where: { company_id: companyId, invoice_date: { [Op.gte]: todayStart } } }),
          Expense.sum('amount', { where: { company_id: companyId } })
        ]);

        const totalSales = parseFloat(totalSalesData || 0);
        const todaySales = parseFloat(todaySalesData || 0);
        const totalExpenses = parseFloat(totalExpensesData || 0);
        const netProfit = totalSales - totalExpenses;

        financialContext = `\n[Financial Data] Today's Sales: ₹${todaySales.toFixed(2)}, Total Sales: ₹${totalSales.toFixed(2)}, Expenses: ₹${totalExpenses.toFixed(2)}, Net Profit: ₹${netProfit.toFixed(2)}`;
      } catch (dbError) {
        // DB error logged
      }
    }

    if (isInventoryQuery) {
      // Fetching inventory context
      try {
        const lowStockProducts = await Product.findAll({
          where: { 
            company_id: companyId,
            stock_quantity: { [Op.lte]: sequelize.col('low_stock_alert') }
          },
          order: [['stock_quantity', 'ASC']],
          limit: 10,
          attributes: ['name', 'stock_quantity']
        });

        if (lowStockProducts.length > 0) {
          inventoryContext = "\n[Inventory Alert] Low Stock Items: " + lowStockProducts.map(p => `${p.name} (${p.stock_quantity})`).join(", ");
        }
      } catch (dbError) {
        // DB error logged
      }
    }

    const company = await Company.findByPk(companyId, { attributes: ['name'] });
    const businessName = company?.name || "your business";

    // 5. Construct Prompt
    const contextStr = (financialContext || inventoryContext || pdfContext) ? 
      `\nContext:${financialContext}${inventoryContext}${pdfContext}` : "";
    
    const fullPrompt = `${CHARIS_SYSTEM_INSTRUCTION}\n\nBusiness: ${businessName}${contextStr}\n\nUser: ${question || 'Process the PDF data'}`;

    // 6. Call Gemini
    let text;
    // Use Gemini 3.0 Flash as primary, fallback to 2.5 Flash if available
    const modelNames = ["gemini-3.0-flash", "gemini-2.5-flash", "gemini-2.0-flash-exp"];
    let lastError = null;

    for (const modelName of modelNames) {
      try {
        // Calling AI model
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        text = response.text();
        
        if (text) {
          await usage.increment('count');
          break;
        }
      } catch (apiError) {
        // API error logged
        lastError = apiError;
        // Continue to next model
        continue;
      }
    }

    if (!text) {
      return res.status(200).json({ 
        answer: "I'm having trouble connecting right now. Please try again in a few seconds." 
      });
    }

    // Response generated
    res.json({ answer: text, usage: usage.count + 1, limit: dailyLimit });

  } catch (error) {
    // Assistant error logged
    res.status(500).json({ 
      error: "Charis is temporarily unavailable", 
      details: error.message 
    });
  }
};

// PDF Processing Helper
const processPDFExtract = async (req, res) => {
  const companyId = req.companyId;
  
  try {
    const { extractedText, documentType } = req.body;
    
    if (!extractedText) {
      return res.status(400).json({ error: "No text extracted from PDF" });
    }

    // Use Gemini to parse the PDF content
    const prompt = `Extract product information from this ${documentType} and return JSON format:
    {
      "items": [
        {
          "name": "product name",
          "hsn_code": "HSN code if available",
          "quantity": number,
          "unit_price": number,
          "gst_rate": 5/12/18/28,
          "is_new_product": true/false
        }
      ],
      "supplier_name": "supplier name if available",
      "invoice_number": "invoice number",
      "invoice_date": "date"
    }
    
    Document text: ${extractedText.substring(0, 3000)}`;

    const model = genAI.getGenerativeModel({ model: "gemini-3.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const parsedData = JSON.parse(response.text());

    // Create or update products
    const createdItems = [];
    for (const item of parsedData.items) {
      let product = await Product.findOne({
        where: { 
          company_id: companyId,
          name: { [Op.iLike]: item.name }
        }
      });

      if (!product) {
        // Create new product
        product = await Product.create({
          company_id: companyId,
          name: item.name,
          hsn_code: item.hsn_code || '',
          gst_rate: item.gst_rate || 18,
          sale_price: item.unit_price * 1.2, // 20% markup
          purchase_price: item.unit_price,
          stock_quantity: item.quantity,
          low_stock_alert: 10,
          unit: 'PCS'
        });
        createdItems.push({ name: item.name, action: 'created', quantity: item.quantity });
      } else {
        // Update existing product stock
        await product.increment('stock_quantity', { by: item.quantity });
        createdItems.push({ name: item.name, action: 'stock_added', quantity: item.quantity });
      }
    }

    res.json({
      success: true,
      message: `Processed ${createdItems.length} items`,
      items: createdItems,
      supplier: parsedData.supplier_name
    });

  } catch (error) {
    // PDF processing error logged
    res.status(500).json({ error: "Failed to process PDF", details: error.message });
  }
};

module.exports = {
  chatWithAssistant,
  processPDFExtract
};
