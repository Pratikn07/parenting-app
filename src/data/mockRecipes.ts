import { Recipe } from '@/src/lib/types/recipes';

// Helper to generate a placeholder image URL (using Unsplash source or similar logic in future, for now local/placeholder)
// For this mock, I'll use a generic food placeholder service structure or just descriptive strings if actual URLs aren't available.
// I'll use https://images.unsplash.com/photo-... format for realism.

export const MOCK_RECIPES: Recipe[] = [
    {
        id: '1',
        title: 'Sweet Potato & Carrot Puree',
        description: 'A smooth, sweet, and nutrient-rich first food for your baby. High in Vitamin A and easy to digest.',
        imageUrl: 'https://images.unsplash.com/photo-1598511757337-fe2cafc31ba0?auto=format&fit=crop&q=80',
        ageRange: { min: 4, max: 12 },
        feedingTypes: ['babyPurees'],
        dietaryTags: ['dairy-free', 'gluten-free', 'nut-free', 'vegan', 'vegetarian'],
        kitchenStyleTags: ['quick', 'batch'],
        mealTypes: ['lunch', 'dinner'],
        timeMinutes: 20,
        difficulty: 'easy',
        rating: 4.8,
        ingredients: [
            { item: 'Sweet Potato', amount: '1 large' },
            { item: 'Carrots', amount: '2 medium' },
            { item: 'Water or Breast Milk', amount: '2-4 tbsp' }
        ],
        instructions: [
            'Peel and chop sweet potato and carrots into cubes.',
            'Steam for 15-20 minutes until very tender.',
            'Blend with water/milk until smooth.',
            'Cool before serving.'
        ],
        tips: ['Freeze in ice cube trays for easy portions!']
    },
    {
        id: '2',
        title: 'Avocado & Banana Mash',
        description: 'No-cook, creamy goodness perfect for a quick breakfast or snack.',
        imageUrl: 'https://images.unsplash.com/photo-1603052674283-bc2d19213564?auto=format&fit=crop&q=80',
        ageRange: { min: 6, max: 100 },
        feedingTypes: ['babyPurees', 'fingerFoods'],
        dietaryTags: ['dairy-free', 'gluten-free', 'nut-free', 'vegan', 'vegetarian'],
        kitchenStyleTags: ['quick'],
        mealTypes: ['breakfast', 'snack'],
        timeMinutes: 5,
        difficulty: 'easy',
        rating: 4.9,
        ingredients: [
            { item: 'Ripe Avocado', amount: '1/2' },
            { item: 'Ripe Banana', amount: '1/2' }
        ],
        instructions: [
            'Mash avocado and banana together in a bowl.',
            'Serve immediately.'
        ],
        tips: ['Add a drop of lemon juice if saving for later to prevent browning.']
    },
    {
        id: '3',
        title: 'Broccoli & Cheese Omlette Strips',
        description: 'Perfect finger food for baby-led weaning. Soft, grippable, and full of calcium.',
        imageUrl: 'https://images.unsplash.com/photo-1587339146340-41006193796d?auto=format&fit=crop&q=80',
        ageRange: { min: 8, max: 36 },
        feedingTypes: ['fingerFoods', 'toddlerMeals'],
        dietaryTags: ['gluten-free', 'nut-free', 'vegetarian'],
        kitchenStyleTags: ['quick'],
        mealTypes: ['breakfast', 'lunch'],
        timeMinutes: 15,
        difficulty: 'easy',
        rating: 4.7,
        ingredients: [
            { item: 'Eggs', amount: '2' },
            { item: 'Broccoli florets (steamed)', amount: '1/4 cup' },
            { item: 'Shredded Mild Cheese', amount: '2 tbsp' },
            { item: 'Butter', amount: '1 tsp' }
        ],
        instructions: [
            'Finely chop steamed broccoli.',
            'Whisk eggs and cheese together.',
            'Stir in broccoli.',
            'Cook in buttered pan like an omlette.',
            'Slice into strips for gripping.'
        ]
    },
    {
        id: '4',
        title: 'Hidden Veggie Mac & Cheese',
        description: 'Classic comfort food with a healthy twist. Carrots and cauliflower blended into the sauce!',
        imageUrl: 'https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?auto=format&fit=crop&q=80',
        ageRange: { min: 12, max: 120 },
        feedingTypes: ['toddlerMeals', 'familyDinners'],
        dietaryTags: ['nut-free', 'vegetarian'],
        kitchenStyleTags: ['picky', 'batch'],
        mealTypes: ['dinner', 'lunch'],
        cuisine: 'american',
        timeMinutes: 30,
        difficulty: 'medium',
        calories: 350,
        rating: 4.9,
        ingredients: [
            { item: 'Macaroni Pasta', amount: '2 cups' },
            { item: 'Carrots (chopped)', amount: '1 cup' },
            { item: 'Cauliflower florets', amount: '1 cup' },
            { item: 'Milk', amount: '1 cup' },
            { item: 'Cheddar Cheese', amount: '1.5 cups' },
            { item: 'Butter', amount: '2 tbsp' }
        ],
        instructions: [
            'Boil pasta according to package instructions.',
            'Steam carrots and cauliflower until soft (approx 10 mins).',
            'Blend veggies with milk until ultra-smooth.',
            'Melt butter in a pot, add the veggie milk mixture and simmer.',
            'Whisk in cheese until melted.',
            'Toss with pasta and serve.'
        ],
        tips: ['The orange color mimics regular boxed mac & cheese perfectly!']
    },
    {
        id: '5',
        title: 'Mini Chicken & Apple Meatballs',
        description: 'Sweet and savory meatballs that are soft enough for toddlers but tasty enough for the whole family.',
        imageUrl: 'https://images.unsplash.com/photo-1529042410759-befb1204b465?auto=format&fit=crop&q=80',
        ageRange: { min: 9, max: 120 },
        feedingTypes: ['fingerFoods', 'toddlerMeals', 'familyDinners', 'lunchboxIdeas'],
        dietaryTags: ['dairy-free', 'nut-free', 'gluten-free'],
        kitchenStyleTags: ['batch', 'picky'],
        mealTypes: ['dinner', 'lunch'],
        timeMinutes: 35,
        difficulty: 'medium',
        rating: 4.6,
        ingredients: [
            { item: 'Ground Chicken', amount: '1 lb' },
            { item: 'Apple (grated)', amount: '1' },
            { item: 'Oats or Breadcrumbs', amount: '1/2 cup' },
            { item: 'Egg', amount: '1' },
            { item: 'Onion Powder', amount: '1/2 tsp' }
        ],
        instructions: [
            'Preheat oven to 400°F (200°C).',
            'Squeeze excess water from grated apple.',
            'Mix all ingredients in a bowl (do not overmix).',
            'Form into mini balls.',
            'Bake for 15-18 minutes until golden.'
        ]
    },
    {
        id: '6',
        title: 'Rainbow Veggie Quesadillas',
        description: 'A colorful way to eat veggies! Packed with peppers, corn, and spinach.',
        imageUrl: 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?auto=format&fit=crop&q=80',
        ageRange: { min: 18, max: 120 },
        feedingTypes: ['toddlerMeals', 'familyDinners', 'lunchboxIdeas'],
        dietaryTags: ['nut-free', 'vegetarian'],
        kitchenStyleTags: ['quick', 'picky'],
        mealTypes: ['lunch', 'dinner'],
        cuisine: 'mexican',
        timeMinutes: 15,
        difficulty: 'easy',
        calories: 280,
        rating: 4.8,
        ingredients: [
            { item: 'Tortillas', amount: '4' },
            { item: 'Bell Peppers (diced)', amount: '1/2 cup' },
            { item: 'Corn', amount: '1/4 cup' },
            { item: 'Spinach (chopped)', amount: 'handful' },
            { item: 'Cheese', amount: '1 cup' }
        ],
        instructions: [
            'Sprinkle cheese and veggies on half of a tortilla.',
            'Fold over.',
            'Cook in a pan for 3 mins per side until crispy.'
        ]
    },
    {
        id: '7',
        title: 'Overnight Oats with Berries',
        description: 'Prep breakfast the night before. Creamy oats with chia seeds and fruit.',
        imageUrl: 'https://images.unsplash.com/photo-1517673132405-a5e08cdb2f90?auto=format&fit=crop&q=80',
        ageRange: { min: 12, max: 120 },
        feedingTypes: ['toddlerMeals', 'familyDinners'],
        dietaryTags: ['vegan', 'vegetarian', 'dairy-free', 'egg-free'],
        kitchenStyleTags: ['batch', 'quick'],
        mealTypes: ['breakfast'],
        timeMinutes: 5,
        difficulty: 'easy',
        rating: 4.5,
        ingredients: [
            { item: 'Rolled Oats', amount: '1/2 cup' },
            { item: 'Milk (any kind)', amount: '1/2 cup' },
            { item: 'Chia Seeds', amount: '1 tsp' },
            { item: 'Mixed Berries', amount: '1/4 cup' }
        ],
        instructions: [
            'Combine oats, milk, and chia seeds in a jar.',
            'Refrigerate overnight.',
            'Top with berries before serving.'
        ]
    },
    {
        id: '8',
        title: 'Easy One-Pot Pasta Primavera',
        description: 'Throw everything in the pot and cook! Less mess, more veggies.',
        imageUrl: 'https://images.unsplash.com/photo-1626844131082-256783844137?auto=format&fit=crop&q=80',
        ageRange: { min: 12, max: 120 },
        feedingTypes: ['familyDinners', 'toddlerMeals'],
        dietaryTags: ['vegetarian', 'nut-free'],
        kitchenStyleTags: ['quick', 'confident'],
        mealTypes: ['dinner'],
        cuisine: 'italian',
        timeMinutes: 20,
        difficulty: 'easy',
        calories: 420,
        rating: 4.7,
        ingredients: [
            { item: 'Pasta', amount: '8 oz' },
            { item: 'Cherry Tomatoes', amount: '1 cup' },
            { item: 'Zucchini', amount: '1' },
            { item: 'Onion', amount: '1/2' },
            { item: 'Vegetable Broth', amount: '3 cups' }
        ],
        instructions: [
            'Place all ingredients in a large pot.',
            'Boil for 10-12 minutes until pasta is cooked and water is mostly absorbed.',
            'Stir in parmesan cheese.'
        ]
    },
    {
        id: '9',
        title: 'Blueberry & Spinach Muffins',
        description: 'Green monster muffins! Great for lunchboxes or on-the-go snacks.',
        imageUrl: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&q=80',
        ageRange: { min: 12, max: 120 },
        feedingTypes: ['treatsSnacks', 'lunchboxIdeas', 'toddlerMeals'], // Corrected type
        dietaryTags: ['nut-free', 'vegetarian'],
        kitchenStyleTags: ['batch', 'picky'],
        mealTypes: ['snack', 'breakfast'],
        timeMinutes: 30,
        difficulty: 'medium',
        rating: 4.8,
        ingredients: [
            { item: 'Flour', amount: '2 cups' },
            { item: 'Spinach', amount: '2 cups' },
            { item: 'Banana', amount: '1' },
            { item: 'Blueberries', amount: '1 cup' },
            { item: 'Honey/Maple Syrup', amount: '1/3 cup' }
        ],
        instructions: [
            'Blend spinach, banana, wet ingredients.',
            'Mix with flour.',
            'Fold in blueberries.',
            'Bake at 350°F for 20 mins.'
        ]
    },
    {
        id: '10',
        title: 'Lentil Curry with Rice',
        description: 'Mild, protein-packed curry suitable for babies and adults alike.',
        imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80',
        ageRange: { min: 10, max: 120 },
        feedingTypes: ['familyDinners', 'toddlerMeals'],
        dietaryTags: ['gluten-free', 'vegan', 'vegetarian', 'dairy-free'],
        kitchenStyleTags: ['confident', 'batch'],
        mealTypes: ['dinner'],
        cuisine: 'indian',
        timeMinutes: 45,
        difficulty: 'medium',
        calories: 380,
        rating: 4.9,
        ingredients: [
            { item: 'Red Lentils', amount: '1 cup' },
            { item: 'Coconut Milk', amount: '1 can' },
            { item: 'Tomato Paste', amount: '1 tbsp' },
            { item: 'Mild Curry Powder', amount: '1 tsp' }
        ],
        instructions: [
            'Sauté aromatics.',
            'Add lentils, liquids, and spices.',
            'Simmer 20 mins.',
            'Serve with rice.'
        ]
    },
    {
        id: '11',
        title: 'Teriyaki Chicken Stir-Fry',
        description: 'Sweet and savory chicken with tender broccoli and snap peas.',
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80',
        ageRange: { min: 18, max: 120 },
        feedingTypes: ['familyDinners'],
        dietaryTags: ['dairy-free', 'nut-free'],
        kitchenStyleTags: ['quick', 'confident'],
        mealTypes: ['dinner'],
        cuisine: 'asian',
        timeMinutes: 25,
        difficulty: 'medium',
        calories: 450,
        rating: 4.7,
        ingredients: [
            { item: 'Chicken Breast', amount: '2' },
            { item: 'Broccoli', amount: '1 head' },
            { item: 'Snap Peas', amount: '1 cup' },
            { item: 'Soy Sauce (Low Sodium)', amount: '1/4 cup' },
            { item: 'Honey', amount: '2 tbsp' }
        ],
        instructions: [
            'Cook chicken chunks.',
            'Add veggies and sauce.',
            'Simmer until thickened.'
        ]
    },
    {
        id: '12',
        title: 'No-Bake Energy Bites',
        description: 'Dates, oats, and seeds rolled into perfect little snacks.',
        imageUrl: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&q=80',
        ageRange: { min: 24, max: 120 },
        feedingTypes: ['treatsSnacks', 'lunchboxIdeas'],
        dietaryTags: ['vegan', 'gluten-free', 'dairy-free'],
        kitchenStyleTags: ['quick', 'treats'],
        mealTypes: ['snack'],
        timeMinutes: 10,
        difficulty: 'easy',
        rating: 4.6,
        ingredients: [
            { item: 'Dates', amount: '1 cup' },
            { item: 'Oats', amount: '1/2 cup' },
            { item: 'Chia Seeds', amount: '1 tbsp' },
            { item: 'Cocoa Powder', amount: '1 tbsp' }
        ],
        instructions: [
            'Blend all ingredients in food processor.',
            'Roll into balls.',
            'Refrigerate.'
        ]
    }
];
