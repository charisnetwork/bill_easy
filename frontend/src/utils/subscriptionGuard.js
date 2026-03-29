/**
 * SubscriptionGuard Utility for Frontend
 * Used to show/hide UI elements based on the current subscription plan.
 */

export const canPerformAction = (subscription, actionType, currentCounts = {}) => {
  if (!subscription || !subscription.plan) return false;

  const plan = subscription.plan;
  const features = plan.features || {};
  const planName = plan.plan_name;

  switch (actionType) {
    case 'ADD_BUSINESS':
      // Based on the maxBusinesses value we already fetch in AuthContext
      return true; // Usually handled by companies.length < maxBusinesses in UI

    case 'CREATE_INVOICE':
      if (planName === 'Zero Account') return (currentCounts.invoicesCount || 0) < 50;
      if (planName === 'Premium') return (currentCounts.invoicesCount || 0) < 500;
      return (currentCounts.invoicesCount || 0) < (plan.max_invoices_per_month || 10000);

    case 'ADD_PRODUCT':
      if (planName === 'Zero Account') return (currentCounts.productsCount || 0) < 100;
      if (planName === 'Premium') return (currentCounts.productsCount || 0) < 1000;
      return (currentCounts.productsCount || 0) < (plan.max_products || 10000);

    case 'QUOTATION':
      return planName !== 'Zero Account';

    case 'EWAY_BILL':
      return planName === 'Enterprise' || (planName === 'Premium' && features.eway_bills > 0);

    case 'STAFF_MANAGEMENT':
      return !!features.staff_attendance_payroll;

    case 'CUSTOM_THEMES':
      return planName !== 'Zero Account';

    default:
      return !!features[actionType];
  }
};

export default canPerformAction;
