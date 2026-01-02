
-- Add RLS policy for holders to read their own assets
-- Holders can read assets where the holder_id matches their email prefix

CREATE POLICY "Holders can read their own assets"
ON public.assets
FOR SELECT
TO authenticated
USING (
  -- Check if user is a holder and the holder_id matches their email
  EXISTS (
    SELECT 1 
    FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'holder'::public.user_role
    AND REPLACE(p.email, '@miaoda.com', '')::uuid = assets.holder_id
  )
);

-- Add comment
COMMENT ON POLICY "Holders can read their own assets" ON public.assets IS 
'Holderlar o''z assetlarini ko''rishlari mumkin. Holder ID email prefixi bilan mos kelishi kerak.';
