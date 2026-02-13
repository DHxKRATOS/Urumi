require('dotenv').config();
const path = require('path');
const os = require('os');

// Helper function to expand ~ to home directory
/**
 * Expands a file path that starts with '~/' to the user's home directory.
 */
const expandHome = (filepath) => {
  if (filepath.startsWith('~/')) {
    return path.join(os.homedir(), filepath.slice(2));
  }
  return filepath;
};

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  kubeconfig: expandHome(process.env.KUBECONFIG || '~/.kube/config'),
  helmChartPath: process.env.HELM_CHART_PATH || path.join(__dirname, '../../helm-charts/woocommerce-store'),
  defaultIngressDomain: process.env.DEFAULT_INGRESS_DOMAIN || 'localhost',
};
