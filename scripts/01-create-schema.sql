-- Create verifications table
CREATE TABLE IF NOT EXISTS verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  match_result BOOLEAN NOT NULL,
  hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  similarity_percentage DECIMAL(5,2)
);

-- Enable RLS
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;

-- Allow public insert (for API routes)
CREATE POLICY "Allow public insert on verifications"
  ON verifications
  FOR INSERT
  WITH CHECK (true);

-- Allow public select (for viewing results)
CREATE POLICY "Allow public select on verifications"
  ON verifications
  FOR SELECT
  USING (true);
