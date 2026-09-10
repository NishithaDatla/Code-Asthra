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

    const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser(token);

    if (authErr || !authUser) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Token is invalid or expired.'
      });
    }

    // Resolve trusted internal database user
    const { data: dbUser, error: dbErr } = await supabase
      .from('users')
      .select('id, role, is_active')
      .eq('auth_id', authUser.id)
      .maybeSingle();

    if (dbErr || !dbUser) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. User account record not found.'
      });
    }

    if (dbUser.is_active === false) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. User account is inactive.'
      });
    }

    let farmerId = null;
    if (dbUser.role === 'FARMER') {
      const { data: farmer } = await supabase
        .from('farmers')
        .select('id')
        .eq('user_id', dbUser.id)
        .maybeSingle();
      farmerId = farmer?.id || null;
    }

    req.user = {
      ...authUser,
      db_id: dbUser.id,
      role: dbUser.role,
      farmer_id: farmerId,
      is_active: dbUser.is_active
    };
    req.token = token;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Token verification failed.'
    });
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to access this resource.'
      });
    }
    next();
  };
}

export default authenticateToken;
