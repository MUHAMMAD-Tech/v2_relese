
-- Drop the restrictive admin policy
DROP POLICY IF EXISTS "Admins can manage transactions" ON transactions;

-- Add a more permissive policy for updates
-- Since the app uses access codes (not Supabase auth), we need to allow updates
CREATE POLICY "Allow transaction updates" ON transactions
  FOR UPDATE TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Add a policy for all operations (for service role and authenticated users)
CREATE POLICY "Allow all operations for authenticated" ON transactions
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
