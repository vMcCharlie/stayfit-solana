-- Create offers table
CREATE TABLE offers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_read BOOLEAN DEFAULT FALSE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own offers
CREATE POLICY "Users can read their own offers"
    ON offers
    FOR SELECT
    USING (auth.uid() = user_id);

-- Create policy to allow admins to insert offers
CREATE POLICY "Admins can insert offers"
    ON offers
    FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT id FROM auth.users WHERE role = 'admin'
    ));

-- Create policy to allow users to update is_read status of their own offers
CREATE POLICY "Users can update is_read status"
    ON offers
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id
        AND (
            (OLD.is_read IS DISTINCT FROM NEW.is_read)
            AND (
                OLD.title = NEW.title
                AND OLD.description = NEW.description
                AND OLD.image_url IS NOT DISTINCT FROM NEW.image_url
                AND OLD.url IS NOT DISTINCT FROM NEW.url
                AND OLD.user_id = NEW.user_id
            )
        )
    ); 