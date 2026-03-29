import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/DashboardLayout';
import { Toaster } from './components/ui/sonner';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import SuppliersPage from './pages/SuppliersPage';
import ProductsPage from './pages/ProductsPage';
import InvoicesPage from './pages/InvoicesPage';
import CreateInvoicePage from './pages/CreateInvoicePage';
import PurchasesPage from './pages/PurchasesPage';
import CreatePurchasePage from './pages/CreatePurchasePage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import CreatePurchaseOrderPage from './pages/CreatePurchaseOrderPage';
import PurchaseOrderPreview from './pages/PurchaseOrderPreview';
import QuotationsPage from './pages/QuotationsPage';
import CreateQuotationPage from './pages/CreateQuotationPage';
import QuotationPreview from './pages/QuotationPreview';
import EWayBillsPage from './pages/EWayBillsPage';
import CreateEWayBillPage from './pages/CreateEWayBillPage';
import ExpensesPage from './pages/ExpensesPage';
import PaymentsInPage from './pages/PaymentsInPage';
import ReportsPage from './pages/ReportsPage';
import SalesReturnPage from './pages/SalesReturnPage';
import StockTransferPage from './pages/StockTransferPage';
import SubscriptionPage from './pages/SubscriptionPage';
import SettingsPage from './pages/SettingsPage';
import AddBusinessPage from './pages/AddBusinessPage';
import InvoicePreview from './pages/InvoicePreview';
import BillPrivacy from "./pages/BillPrivacy";
import BillTerms from "./pages/BillTerms";
import ContactPage from "./pages/ContactPage";
import CharisAssistant from "./components/CharisAssistant";

import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/privacy" element={<BillPrivacy />} />
          <Route path="/terms" element={<BillTerms />} />
          <Route path="/contact" element={<ContactPage />} />

          {/* Protected Routes - Dashboard Layout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DashboardPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CustomersPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/suppliers"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SuppliersPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ProductsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoices"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <InvoicesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoices/new"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CreateInvoicePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchases"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <PurchasesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchases/new"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CreatePurchasePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchases/:id/edit"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CreatePurchasePage isEdit={true} />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchase/po-list"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <PurchaseOrdersPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchase/po-list/new"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CreatePurchaseOrderPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchase/po-list/:id"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <PurchaseOrderPreview />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchase/po-list/:id/edit"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CreatePurchaseOrderPage isEdit={true} />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/quotations"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <QuotationsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/quotations/new"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CreateQuotationPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/quotations/:id"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <QuotationPreview />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/quotations/:id/edit"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CreateQuotationPage isEdit={true} />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/eway-bills"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <EWayBillsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/eway-bills/new"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CreateEWayBillPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ExpensesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments-in"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <PaymentsInPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ReportsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales-return"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SalesReturnPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock-transfer"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <StockTransferPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscription"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SubscriptionPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SettingsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoices/:id"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <InvoicePreview />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoices/:id/edit"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CreateInvoicePage isEdit={true} />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/business/new"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AddBusinessPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <CharisAssistant />
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}

export default App;
