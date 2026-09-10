import { updateFarmerProfileSchema } from '../validators/farmerValidator.js';
import { getFarmerProfile, updateFarmerProfile } from '../services/farmerService.js';

export async function handleGetProfile(req, res) {
  try {
    const profile = await getFarmerProfile(req.user.id);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Farmer profile not found.'
      });
    }

    return res.status(200).json({
      success: true,
      data: profile
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to retrieve farmer profile.'
    });
  }
}

export async function handleUpdateProfile(req, res) {
  try {
    const parseResult = updateFarmerProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors
      });
    }

    const updatedProfile = await updateFarmerProfile(req.user.id, parseResult.data);
    return res.status(200).json({
      success: true,
      data: updatedProfile
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Failed to update farmer profile.'
    });
  }
}
