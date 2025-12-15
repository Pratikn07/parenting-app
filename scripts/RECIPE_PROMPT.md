# Recipe Generation Prompt

Copy this entire prompt and paste it into ChatGPT or Claude:

---

## PROMPT TO COPY:

```
You are a pediatric nutritionist creating safe, age-appropriate recipes for a parenting app.

Generate 10 recipes for the category: **[REPLACE WITH CATEGORY]**

Categories to choose from:
- pregnancyNutrition (for expecting mothers)
- babyPurees (ages 4-10 months, smooth textures)
- fingerFoods (ages 8-24 months, soft self-feeding bites)
- toddlerMeals (ages 12-48 months, balanced plates)
- familyDinners (ages 12+ months, one meal for everyone)
- lunchboxIdeas (ages 3+ years, packable meals)
- treatsSnacks (occasional healthy treats)

Requirements:
- All recipes must be safe for the age group (no choking hazards for babies/toddlers)
- Include variety: different cuisines, meal types, cooking styles
- Make descriptions parent-friendly and enticing
- Include practical tips for busy parents
- List ALL allergens present (even trace amounts)
- Include storage instructions
- **Instructions must be DETAILED**: include temperatures, cooking times, visual cues (e.g., "until golden brown"), tool sizes, and safety reminders for baby food

Output ONLY valid JSON in this exact format (no markdown, no explanation):

{
  "recipes": [
    {
      "title": "Recipe Name",
      "description": "2 sentences describing the dish and why parents will love it",
      "feeding_types": ["babyPurees"],
      "dietary_tags": [],
      "kitchen_style_tags": ["quick"],
      "meal_types": ["breakfast"],
      "cuisine": "american",
      "age_range_min": 4,
      "age_range_max": 10,
      "ingredients": [
        {"item": "ingredient name", "amount": "1 cup"}
      ],
      "instructions": [
        "Preheat oven to 375°F (190°C) and line a baking sheet with parchment paper.",
        "In a medium bowl, mash the bananas until smooth with no large chunks remaining.",
        "Add oat flour and cinnamon, stirring until just combined (don't overmix).",
        "Using a tablespoon, drop rounded portions onto the prepared sheet, spacing 2 inches apart.",
        "Flatten slightly with the back of a spoon to about 1/2 inch thick.",
        "Bake for 12-15 minutes until edges are golden brown and centers are set.",
        "Cool on the baking sheet for 5 minutes before transferring to a wire rack.",
        "IMPORTANT: Test temperature before serving to baby - should be room temperature or slightly warm."
      ],
      "tips": ["Helpful tip for parents"],
      "time_minutes": 20,
      "difficulty": "easy",
      "servings": 4,
      "calories": 150,
      "allergens": ["milk", "eggs"],
      "storage": "Refrigerate in airtight container for up to 3 days. Freeze for up to 2 months."
    }
  ]
}

Field guidelines:
- dietary_tags: only include if recipe IS that diet: ["dairy-free", "gluten-free", "nut-free", "vegetarian", "vegan", "egg-free"]
- kitchen_style_tags: "quick" (<20min), "batch" (meal prep friendly), "picky" (picky eater approved)
- cuisine: italian, mexican, indian, asian, mediterranean, american
- difficulty: easy, medium, hard
- age_range_min and age_range_max: **ALWAYS in MONTHS** (convert years to months!)
  - 4 months = 4
  - 10 months = 10
  - 1 year = 12
  - 2 years = 24
  - 3 years = 36
  - 4 years = 48
  - For "all ages" use min=0, max=120
- allergens: list from ["milk", "eggs", "wheat", "soy", "peanuts", "tree_nuts", "fish", "shellfish", "sesame"] - use empty array [] if none
- storage: always include fridge duration, optionally freeze duration
```

---

## HOW TO USE:

1. Copy the prompt above
2. Replace `[REPLACE WITH CATEGORY]` with one category (e.g., "fingerFoods")
3. Paste into ChatGPT or Claude
4. Copy the JSON response
5. Save as `recipes_fingerFoods.json` (or any name)
6. Run the import script: `npx ts-node scripts/importRecipes.ts recipes_fingerFoods.json`

---

## CATEGORIES TO GENERATE:

Run the prompt 7 times, once for each:

| Category | Replace With | Age Range |
|----------|--------------|-----------|
| Pregnancy | `pregnancyNutrition` | N/A |
| Baby Purees | `babyPurees` | 4-10 months |
| Finger Foods | `fingerFoods` | 8-24 months |
| Toddler Meals | `toddlerMeals` | 12-48 months |
| Family Dinners | `familyDinners` | 12+ months |
| Lunchbox Ideas | `lunchboxIdeas` | 36+ months |
| Treats & Snacks | `treatsSnacks` | All ages |

**Total: 70 recipes to start**
