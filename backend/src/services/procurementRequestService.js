import { supabase } from '../config/supabase.js';

export async function getAuthenticatedFarmer(authUserId) {
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authUserId)
    .single();

  if (userError || !userData || userData.role !== 'FARMER') {
    return { user: userData || null, farmer: null };
  }

  const { data: farmerData } = await supabase
    .from('farmers')
    .select('*')
    .eq('user_id', userData.id)
    .maybeSingle();

  return {
    user: userData,
    farmer: farmerData
  };
}

export async function validateActiveCrop(cropId) {
  const { data: cropData, error } = await supabase
    .from('crops')
    .select('id, name, crop_code, category, msp_per_quintal, is_active')
    .eq('id', cropId)
    .maybeSingle();

  if (error || !cropData) {
    throw new Error('Specified crop does not exist.');
  }

  if (!cropData.is_active) {
    throw new Error('Specified crop is currently inactive for procurement.');
  }

  return cropData;
}

export async function createProcurementRequest(authUserId, payload) {
  const { user, farmer } = await getAuthenticatedFarmer(authUserId);

  if (!user || user.role !== 'FARMER') {
    throw new Error('User is not authorized as a farmer.');
  }

  if (!farmer) {
    throw new Error('Farmer profile not found for authenticated user.');
  }

  const crop = await validateActiveCrop(payload.crop_id);

  let createdRequest = null;
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts++;
    const requestNumber = `REQ-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const { data, error } = await supabase
      .from('procurement_requests')
      .insert({
        request_number: requestNumber,
        farmer_id: farmer.id,
        crop_id: crop.id,
        estimated_quantity_quintals: payload.estimated_quantity_quintals,
        status: 'SUBMITTED',
        notes: payload.notes || null
      })
      .select('*, crops(id, crop_code, name, category, msp_per_quintal)')
      .single();

    if (!error && data) {
      createdRequest = data;
      break;
    }

    if (error && error.code === '23505' && error.message.includes('request_number')) {
      continue;
    }

    throw new Error(`Failed to create procurement request: ${error?.message || 'Unknown database error'}`);
  }

  if (!createdRequest) {
    throw new Error('Failed to generate unique request number. Please try again.');
  }

  return createdRequest;
}

export async function getFarmerProcurementRequests(authUserId) {
  const { farmer } = await getAuthenticatedFarmer(authUserId);

  if (!farmer) {
    return [];
  }

  const { data, error } = await supabase
    .from('procurement_requests')
    .select('*, crops(id, crop_code, name, category, msp_per_quintal)')
    .eq('farmer_id', farmer.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch procurement requests: ${error.message}`);
  }

  return data || [];
}

export async function getFarmerProcurementRequestById(authUserId, requestId) {
  const { farmer } = await getAuthenticatedFarmer(authUserId);

  if (!farmer) {
    return null;
  }

  const { data, error } = await supabase
    .from('procurement_requests')
    .select('*, crops(id, crop_code, name, category, msp_per_quintal)')
    .eq('id', requestId)
    .eq('farmer_id', farmer.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch procurement request: ${error.message}`);
  }

  return data;
}
