import app from './app.js';
import env from './config/env.js';
import { verifySupabaseConnection } from './config/supabase.js';

const PORT = env.port;

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT} in ${env.nodeEnv} mode`);
  
  // Internal Supabase connectivity check
  const connectionResult = await verifySupabaseConnection();
  if (connectionResult.success) {
    console.log(`[Supabase] ${connectionResult.message}`);
  } else {
    console.warn(`[Supabase] Warning: ${connectionResult.message}`);
  }
});
