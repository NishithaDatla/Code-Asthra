import { registerSchema, loginSchema } from '../validators/authValidator.js';
import { registerUser, loginUser, logoutUser, getCurrentUser } from '../services/authService.js';

export async function handleRegister(req, res) {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors
      });
    }

    const result = await registerUser(parseResult.data);
    return res.status(201).json({
      success: true,
      data: result
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Registration failed'
    });
  }
}

export async function handleLogin(req, res) {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors
      });
    }

    const result = await loginUser(parseResult.data);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: err.message || 'Login failed'
    });
  }
}

export async function handleLogout(req, res) {
  try {
    await logoutUser(req.token);
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Logout failed'
    });
  }
}

export async function handleMe(req, res) {
  try {
    const result = await getCurrentUser(req.user.id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to retrieve user profile'
    });
  }
}
