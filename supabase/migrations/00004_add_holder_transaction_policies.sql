
-- Allow holders to create their own transaction requests
CREATE POLICY "Holders can create their own transactions" ON transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    holder_id IN (
      SELECT id FROM holders WHERE id = holder_id
    )
  );

-- Allow holders to view their own transactions
CREATE POLICY "Holders can view their own transactions" ON transactions
  FOR SELECT TO authenticated
  USING (
    holder_id IN (
      SELECT id FROM holders WHERE id = holder_id
    )
    OR is_admin(auth.uid())
  );
