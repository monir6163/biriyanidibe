-- Fix corrupted like/dislike counts in Supabase
-- Run this in your Supabase SQL Editor to clean up bad data

-- First, check current data state
SELECT id, name, likes, dislikes 
FROM biryani_spots 
WHERE likes < 0 OR likes > 99999 OR dislikes < 0 OR dislikes > 99999;

-- Reset any corrupted values to 0
UPDATE biryani_spots 
SET likes = 0 
WHERE likes < 0 OR likes > 99999;

UPDATE biryani_spots 
SET dislikes = 0 
WHERE dislikes < 0 OR dislikes > 99999;

-- Add check constraints to prevent future corruption (optional but recommended)
ALTER TABLE biryani_spots 
ADD CONSTRAINT likes_valid_range CHECK (likes >= 0 AND likes <= 99999);

ALTER TABLE biryani_spots 
ADD CONSTRAINT dislikes_valid_range CHECK (dislikes >= 0 AND dislikes <= 99999);

-- Verify the fix
SELECT id, name, likes, dislikes 
FROM biryani_spots 
ORDER BY "createdAt" DESC;
