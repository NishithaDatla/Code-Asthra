import { recommendationRequestSchema } from '../validators/schedulingValidator.js';
import { getSmartSlotRecommendations } from '../services/schedulingService.js';

export async function handleRecommendSlots(req, res) {
  try {
    const parseResult = recommendationRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors
      });
    }

    const recommendationData = await getSmartSlotRecommendations(req.user.id, parseResult.data);
    return res.status(200).json({
      success: true,
      data: recommendationData
    });
  } catch (err) {
    const message = err.message || 'Failed to generate slot recommendations.';
    if (message.includes('Procurement request not found.')) {
      return res.status(404).json({
        success: false,
        message
      });
    }
    if (message.includes('Invalid date format')) {
      return res.status(400).json({
        success: false,
        message
      });
    }
    return res.status(400).json({
      success: false,
      message
    });
  }
}
