import { supabase } from '../config/supabase.js';

export async function getFarmerProfile(authUserId) {
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authUserId)
    .single();

  if (userError || !userData || userData.role !== 'FARMER') {
    return null;
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

export async function updateFarmerProfile(authUserId, payload) {
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authUserId)
    .single();

  if (userError || !userData || userData.role !== 'FARMER') {
    throw new Error('Farmer profile not found.');
  }

  // Check phone number uniqueness if phone_number is being updated
  if (payload.phone_number && payload.phone_number !== userData.phone_number) {
    const { data: phoneCheck } = await supabase
      .from('users')
      .select('id')
      .eq('phone_number', payload.phone_number)
      .neq('id', userData.id)
      .maybeSingle();

    if (phoneCheck) {
      throw new Error('Phone number is already in use by another account.');
    }
  }

  // 1. Separate user fields
  const userUpdates = {};
  if (payload.full_name !== undefined) userUpdates.full_name = payload.full_name;
  if (payload.phone_number !== undefined) userUpdates.phone_number = payload.phone_number;

  let updatedUser = userData;
  if (Object.keys(userUpdates).length > 0) {
    const { data, error } = await supabase
      .from('users')
      .update(userUpdates)
      .eq('id', userData.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user profile: ${error.message}`);
    }
    updatedUser = data;
  }

  // 2. Separate farmer fields
  const farmerUpdates = {};
  const farmerFields = [
    'land_size_acres',
    'address_line',
    'village_or_city',
    'district',
    'state',
    'pincode',
    'bank_account_number',
    'bank_ifsc'
  ];

  for (const field of farmerFields) {
    if (payload[field] !== undefined) {
      farmerUpdates[field] = payload[field];
    }
  }

  const { data: existingFarmer } = await supabase
    .from('farmers')
    .select('*')
    .eq('user_id', userData.id)
    .maybeSingle();

  let updatedFarmer = existingFarmer;
  if (Object.keys(farmerUpdates).length > 0 && existingFarmer) {
    const { data, error } = await supabase
      .from('farmers')
      .update(farmerUpdates)
      .eq('id', existingFarmer.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update farmer profile details: ${error.message}`);
    }
    updatedFarmer = data;
  }

  return {
    user: updatedUser,
    farmer: updatedFarmer
  };
}
