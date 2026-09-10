import { supabase } from '../config/supabase.js';

export async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Authorization Bearer token is required.'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Invalid Bearer token format.'
      });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Token is invalid or expired.'
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Token verification failed.'
    });
  }
}

export default authenticateToken;
