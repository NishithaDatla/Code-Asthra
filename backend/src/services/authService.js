import { supabase, supabaseAnon } from '../config/supabase.js';

export async function registerUser(payload) {
  const {
    email,
    password,
    full_name,
    phone_number,
    role = 'FARMER',
    land_size_acres,
    address_line,
    village_or_city,
    district,
    state,
    pincode,
    bank_account_number,
    bank_ifsc
  } = payload;

  // 1. Check if phone number or email already exists in application database
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, email, phone_number')
    .or(`email.eq.${email},phone_number.eq.${phone_number}`)
    .maybeSingle();

  if (existingUser) {
    const field = existingUser.email === email ? 'email' : 'phone number';
    throw new Error(`A user with this ${field} already exists.`);
  }

  // 2. Create Supabase Auth User via admin API for direct confirmation
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, phone_number, role }
  });

  if (authError || !authData?.user) {
    throw new Error(`Supabase Auth creation failed: ${authError?.message || 'Unknown error'}`);
  }

  const authUserId = authData.user.id;

  try {
    // 3. Create application-level user record
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        auth_id: authUserId,
        full_name,
        phone_number,
        email,
        role
      })
      .select()
      .single();

    if (userError || !userData) {
      throw new Error(`User DB record creation failed: ${userError?.message || 'Unknown error'}`);
    }

    let farmerData = null;

    // 4. Create farmer profile record if role is FARMER
    if (role === 'FARMER') {
      const farmerCode = `FARM-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
      const { data: createdFarmer, error: farmerError } = await supabase
        .from('farmers')
        .insert({
          user_id: userData.id,
          farmer_code: farmerCode,
          land_size_acres: land_size_acres || null,
          address_line: address_line || null,
          village_or_city: village_or_city || null,
          district: district || null,
          state: state || null,
          pincode: pincode || null,
          bank_account_number: bank_account_number || null,
          bank_ifsc: bank_ifsc || null
        })
        .select()
        .single();

      if (farmerError) {
        // Rollback user DB record
        await supabase.from('users').delete().eq('id', userData.id);
        throw new Error(`Farmer DB record creation failed: ${farmerError.message}`);
      }

      farmerData = createdFarmer;
    }

    return {
      user: userData,
      farmer: farmerData
    };
  } catch (err) {
    // Safe compensating cleanup: delete orphaned Supabase Auth User
    await supabase.auth.admin.deleteUser(authUserId);
    throw err;
  }
}

export async function loginUser({ email, password }) {
  // 1. Authenticate via Supabase Auth using anon client
  const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
    email,
    password
  });

  if (authError || !authData?.session) {
    throw new Error('Invalid email or password.');
  }

  const authUserId = authData.user.id;

  // 2. Fetch application user record
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authUserId)
    .single();

  if (userError || !userData) {
    throw new Error('Application user record not found.');
  }

  let farmerData = null;
  if (userData.role === 'FARMER') {
    const { data: farmer } = await supabase
      .from('farmers')
      .select('*')
      .eq('user_id', userData.id)
      .maybeSingle();
    farmerData = farmer;
  }

  return {
    session: {
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
      expires_in: authData.session.expires_in,
      token_type: authData.session.token_type
    },
    user: userData,
    farmer: farmerData
  };
}

export async function logoutUser(token) {
  if (token) {
    await supabase.auth.admin.signOut(token);
  }
  return { success: true };
}

export async function getCurrentUser(authUserId) {
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authUserId)
    .single();

  if (userError || !userData) {
    return null;
  }

  let farmerData = null;
  if (userData.role === 'FARMER') {
    const { data: farmer } = await supabase
      .from('farmers')
      .select('*')
      .eq('user_id', userData.id)
      .maybeSingle();
    farmerData = farmer;
  }

  return {
    user: userData,
    farmer: farmerData
  };
}
