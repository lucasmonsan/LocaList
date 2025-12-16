-- ============================================
-- Map Database Seed Data
-- ============================================

-- Insert default pin categories (using i18n keys)
INSERT INTO map_pin_categories (name, icon, color) VALUES
  ('restaurant', '🍽️', '#FF6B6B'),
  ('cafe', '☕', '#8B4513'),
  ('park', '🌳', '#4ECDC4'),
  ('museum', '🏛️', '#95E1D3'),
  ('shopping', '🛍️', '#F38181'),
  ('gym', '💪', '#AA96DA'),
  ('hospital', '🏥', '#FF5252'),
  ('school', '🎓', '#FCBF49'),
  ('market', '🛒', '#06FFA5'),
  ('cinema', '🎬', '#B565D8'),
  ('bar', '🍺', '#FFA500'),
  ('hotel', '🏨', '#6C5CE7'),
  ('beach', '🏖️', '#74B9FF'),
  ('church', '⛪', '#DFE6E9'),
  ('gas_station', '⛽', '#636E72'),
  ('bank', '🏦', '#00B894'),
  ('pharmacy', '💊', '#00CEC9'),
  ('other', '📍', '#A29BFE')
ON CONFLICT (name) DO NOTHING;

