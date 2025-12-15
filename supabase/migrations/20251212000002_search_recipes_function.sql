-- Create a function to search recipes including ingredients
CREATE OR REPLACE FUNCTION search_recipes_with_ingredients(search_term TEXT)
RETURNS SETOF recipes AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM recipes
  WHERE
    title ILIKE '%' || search_term || '%'
    OR description ILIKE '%' || search_term || '%'
    OR EXISTS (
      SELECT 1
      FROM unnest(ingredients) AS ingredient
      WHERE ingredient ILIKE '%' || search_term || '%'
    );
END;
$$ LANGUAGE plpgsql STABLE;
