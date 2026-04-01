import axios from 'axios';

/**
 * PRODUCTION URL CONFIGURATION
 * We hardcode the production URL as the primary value for charisbilleasy.store 
 * to ensure absolute routing and prevent relative path errors.
 */
const BASE_URL = 'https://billeasy-backend.onrender.com';
const API_URL = `${BASE_URL}/api`;

const getToken = () => localStorage.getItem('token');

const api = axios.create({
  baseURL: API_URL
});

export { BASE_URL, API_URL };

// Log for debugging (remove in final production)
console.log('[API] Using Backend URL:', API_URL);

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token && token !== 'undefined' && token !== 'null') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.post('/auth/change-password', data),
  switchCompany: (companyId) => api.post(`/auth/switch-company/${companyId}`)
};

// Company APIs
export const companyAPI = {
  get: () => api.get('/company'),
  update: (data) => api.put('/company', data),
  getUsers: () => api.get('/company/users'),
  addUser: (data) => api.post('/company/users', data),
  updateUser: (id, data) => api.put(`/company/users/${id}`, data),
  deleteUser: (id) => api.delete(`/company/users/${id}`),
  getGodowns: () => api.get('/company/godowns'),
  addGodown: (data) => api.post('/company/godowns', data),
  updateGodown: (id, data) => api.put(`/company/godowns/${id}`, data),
  deleteGodown: (id) => api.delete(`/company/godowns/${id}`),
  addBusiness: (data) => api.post('/company/add-business', data),
  transferStock: (data) => api.post('/company/stock-transfer', data),
  customizeInvoice: (data) => api.post('/company/customize-invoice', data)
};

// Customer APIs
export const customerAPI = {
  getAll: (params) => api.get('/customers', { params }),
  get: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  getLedger: (id, params) => api.get(`/customers/${id}/ledger`, { params })
};

// Supplier APIs
export const supplierAPI = {
  getAll: (params) => api.get('/suppliers', { params }),
  get: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
  getLedger: (id, params) => api.get(`/suppliers/${id}/ledger`, { params })
};

// Product APIs
export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  get: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  adjustStock: (id, data) => api.post(`/products/${id}/stock`, data),
  getMovements: (id, params) => api.get(`/products/${id}/movements`, { params }),
  getCategories: () => api.get('/products/categories'),
  createCategory: (data) => api.post('/products/categories', data),
  updateCategory: (id, data) => api.put(`/products/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/products/categories/${id}`),
  importProducts: (formData) => api.post('/products/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
};

// Invoice APIs
export const invoiceAPI = {
  getAll: (params) => api.get('/invoices', { params }),
  get: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  delete: (id) => api.delete(`/invoices/${id}`),
  recordPayment: (id, data) => api.post(`/invoices/${id}/payment`, data),
  getNextNumber: () => api.get('/invoices/next-number')
};

// Quotation APIs
export const quotationAPI = {
  getAll: (params) => api.get('/quotations', { params }),
  get: (id) => api.get(`/quotations/${id}`),
  create: (data) => api.post('/quotations', data),
  update: (id, data) => api.put(`/quotations/${id}`, data),
  delete: (id) => api.delete(`/quotations/${id}`),
  downloadPdf: (id) => api.get(`/quotations/${id}/pdf`, { responseType: 'blob' }),
  getNextNumber: () => api.get('/quotations/next-number')
};

// Purchase APIs
export const purchaseAPI = {
  getAll: (params) => api.get('/purchases', { params }),
  get: (id) => api.get(`/purchases/${id}`),
  create: (data) => api.post('/purchases', data),
  update: (id, data) => api.put(`/purchases/${id}`, data),
  delete: (id) => api.delete(`/purchases/${id}`),
  recordPayment: (id, data) => api.post(`/purchases/${id}/payment`, data),
  parsePDF: (formData) => api.post('/purchases/parse-pdf', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
};

// Purchase Order APIs
export const purchaseOrderAPI = {
  getAll: (params) => api.get('/purchase-orders', { params }),
  get: (id) => api.get(`/purchase-orders/${id}`),
  create: (data) => api.post('/purchase-orders', data),
  update: (id, data) => api.put(`/purchase-orders/${id}`, data),
  delete: (id) => api.delete(`/purchase-orders/${id}`),
  downloadPdf: (id) => api.get(`/purchase-orders/${id}/pdf`, { responseType: 'blob' })
};

// Expense APIs
export const expenseAPI = {
  getAll: (params) => api.get('/expenses', { params }),
  get: (id) => api.get(`/expenses/${id}`),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
  getCategories: () => api.get('/expenses/categories')
};

// Report APIs
export const reportAPI = {
  getDashboard: () => api.get('/reports/dashboard'),
  getSales: (params) => api.get('/reports/sales', { params }),
  getPurchases: (params) => api.get('/reports/purchases', { params }),
  getExpenses: (params) => api.get('/reports/expenses', { params }),
  getProfitLoss: (params) => api.get('/reports/profit-loss', { params }),
  getGST: (params) => api.get('/reports/gst', { params }),
  getCustomerOutstanding: () => api.get('/reports/customer-outstanding'),
  getSupplierOutstanding: () => api.get('/reports/supplier-outstanding'),
  getStock: () => api.get('/reports/stock')
};

// Subscription APIs
export const subscriptionAPI = {
  getPlans: () => api.get('/subscription/plans'),
  getCurrent: () => api.get('/subscription/current'),
  getUsage: () => api.get('/subscription/usage'),
  upgrade: (data) => api.post('/subscription/upgrade', data),
  cancel: () => api.post('/subscription/cancel'),
  processPayment: (data) => api.post('/subscription/payment', data),
  validateCoupon: (data) => api.post('/subscription/validate-coupon', data)
};

// E-Way Bill APIs
export const ewayBillAPI = {
  getAll: (params) => api.get('/eway-bills', { params }),
  get: (id) => api.get(`/eway-bills/${id}`),
  generate: (data) => api.post('/eway-bills/generate', data),
  downloadPdf: (id) => api.get(`/eway-bills/${id}/pdf`, { responseType: 'blob' })
};

// Credit Note APIs
export const creditNoteAPI = {
  getAll: (params) => api.get('/credit-notes', { params }),
  create: (data) => api.post('/credit-notes', data),
  downloadPdf: (id) => api.get(`/credit-notes/${id}/pdf`, { responseType: 'blob' })
};

// Payment APIs
export const paymentAPI = {
  getAll: (params) => api.get('/payments', { params }),
  create: (data) => api.post('/payments', data),
  delete: (id) => api.delete(`/payments/${id}`)
};

// Utility APIs
export const utilityAPI = {
  getGST: (gstin) => api.get(`/utilities/gst/${gstin}`),
  getPincode: (pincode) => api.get(`/utilities/pincode/${pincode}`)
};

export default api;
