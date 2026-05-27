const { PlanFeature, Subscription, Plan, Company } = require('../models');

const checkSubscriptionFeature = async (companyId, featureKey) => {
  try {
    const subscription = await Subscription.findOne({
      where: { company_id: companyId, status: ['active', 'trial'] },
      include: [Plan]
    });

    if (!subscription || !subscription.Plan) {
      return false;
    }

    const planName = subscription.Plan.plan_name;

    // Check in the new plan_features table
    const feature = await PlanFeature.findOne({
      where: { plan_name: planName, feature_key: featureKey }
    });

    if (feature) {
      return feature.is_enabled;
    }

    // Fallback to the existing features JSON in the Plan model if not found in PlanFeature table
    const planFeatures = subscription.Plan.features || {};
    return !!planFeatures[featureKey];

  } catch (error) {
    console.error('checkSubscriptionFeature error:', error);
    return false;
  }
};

module.exports = {
  checkSubscriptionFeature
};
