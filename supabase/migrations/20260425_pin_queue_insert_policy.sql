CREATE POLICY "Users can insert own queue items" ON "public"."pin_queue" FOR INSERT TO "public" WITH CHECK (auth.uid() = user_id);
