import adminService from '../services/admin.service.js';

/**
 * GET /api/admin/dashboard
 * System-wide operational dashboard for SYSTEM_ADMIN.
 */
export async function getDashboard(req, res) {
  try {
    const data = await adminService.getAdminDashboard();
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate admin dashboard.'
    });
  }
}

/**
 * GET /api/admin/centres
 * Administrative overview of procurement centres for SYSTEM_ADMIN.
 */
export async function getCentres(req, res) {
  try {
    const data = await adminService.getAdminCentresOverview();
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch admin centres overview.'
    });
  }
}

/**
 * GET /api/admin/analytics
 * System-level operational analytics report for SYSTEM_ADMIN.
 */
export async function getAnalytics(req, res) {
  try {
    const data = await adminService.getAdminSystemAnalytics();
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate admin analytics report.'
    });
  }
}

/**
 * GET /api/admin/congestion
 * Real-time system congestion report across centres for SYSTEM_ADMIN.
 */
export async function getCongestion(req, res) {
  try {
    const data = await adminService.getAdminCongestionOverview();
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch admin congestion report.'
    });
  }
}

export default {
  getDashboard,
  getCentres,
  getAnalytics,
  getCongestion
};
