"""
Database seeder for initial data
"""

import asyncio
import json
from sqlalchemy.ext.asyncio import AsyncSession
from database.connection import async_session, engine
from database.models import Base, Milestone, Resource, DailyTip
from datetime import datetime


# Sample milestones data
MILESTONES_DATA = [
    {
        "title": "First Smile",
        "description": "Baby displays their first social smile in response to interaction",
        "category": "social",
        "age_range_start": 14,  # 2 weeks
        "age_range_end": 56     # 8 weeks
    },
    {
        "title": "Holds Head Up",
        "description": "Baby can hold their head up for short periods during tummy time",
        "category": "motor",
        "age_range_start": 30,  # 1 month
        "age_range_end": 90     # 3 months
    },
    {
        "title": "Tracks Moving Objects",
        "description": "Baby follows moving objects with their eyes",
        "category": "cognitive",
        "age_range_start": 30,  # 1 month
        "age_range_end": 90     # 3 months
    },
    {
        "title": "Responds to Voice",
        "description": "Baby turns toward familiar voices and sounds",
        "category": "language",
        "age_range_start": 30,  # 1 month
        "age_range_end": 90     # 3 months
    },
    {
        "title": "Rolls Over",
        "description": "Baby can roll from tummy to back or back to tummy",
        "category": "motor",
        "age_range_start": 90,  # 3 months
        "age_range_end": 180    # 6 months
    },
    {
        "title": "Laughs and Giggles",
        "description": "Baby expresses joy through laughter and giggling",
        "category": "social",
        "age_range_start": 90,  # 3 months
        "age_range_end": 150    # 5 months
    },
    {
        "title": "Sits Without Support",
        "description": "Baby can sit upright without assistance",
        "category": "motor",
        "age_range_start": 150, # 5 months
        "age_range_end": 270    # 9 months
    },
    {
        "title": "Says First Words",
        "description": "Baby says recognizable words like 'mama' or 'dada'",
        "category": "language",
        "age_range_start": 240, # 8 months
        "age_range_end": 450    # 15 months
    },
    {
        "title": "Crawls",
        "description": "Baby moves around by crawling on hands and knees",
        "category": "motor",
        "age_range_start": 180, # 6 months
        "age_range_end": 330    # 11 months
    },
    {
        "title": "Walks Independently",
        "description": "Baby takes first independent steps without support",
        "category": "motor",
        "age_range_start": 270, # 9 months
        "age_range_end": 540    # 18 months
    },
    {
        "title": "Points to Objects",
        "description": "Baby points to indicate interest or desire",
        "category": "cognitive",
        "age_range_start": 270, # 9 months
        "age_range_end": 450    # 15 months
    },
    {
        "title": "Imitates Actions",
        "description": "Baby copies simple actions and gestures",
        "category": "social",
        "age_range_start": 240, # 8 months
        "age_range_end": 450    # 15 months
    }
]

# Sample resources data
RESOURCES_DATA = [
    {
        "title": "Safe Sleep Guidelines",
        "content": "Always place babies on their backs to sleep, use a firm sleep surface, and keep the crib bare. Avoid loose bedding, bumpers, and toys in the sleep area.",
        "category": "sleep",
        "age_range": "0-12months",
        "tags": ["safe sleep", "SIDS prevention", "crib safety"]
    },
    {
        "title": "Breastfeeding Basics",
        "content": "Breastfeeding provides optimal nutrition for babies. Aim for 8-12 feeding sessions per day for newborns, and watch for hunger cues rather than strict schedules.",
        "category": "feeding",
        "age_range": "0-6months",
        "tags": ["breastfeeding", "nutrition", "feeding schedule"]
    },
    {
        "title": "Tummy Time Benefits",
        "content": "Tummy time helps strengthen neck, back, and shoulder muscles. Start with 2-3 minutes several times a day and gradually increase as baby gets stronger.",
        "category": "development",
        "age_range": "0-6months",
        "tags": ["tummy time", "motor development", "strength"]
    },
    {
        "title": "Understanding Baby Cries",
        "content": "Babies cry for various reasons: hunger, tiredness, discomfort, or need for attention. Learning different cry patterns can help you respond appropriately.",
        "category": "development",
        "age_range": "0-3months",
        "tags": ["crying", "communication", "comfort"]
    },
    {
        "title": "Introduction to Solid Foods",
        "content": "Start introducing solid foods around 6 months. Begin with single-ingredient purees and gradually introduce new textures and finger foods.",
        "category": "feeding",
        "age_range": "6-12months",
        "tags": ["solid foods", "weaning", "nutrition"]
    },
    {
        "title": "Baby-Proofing Your Home",
        "content": "As babies become mobile, ensure safety by covering outlets, securing cabinets, and removing small objects that pose choking hazards.",
        "category": "health",
        "age_range": "6-18months",
        "tags": ["safety", "baby-proofing", "home safety"]
    },
    {
        "title": "Sleep Training Methods",
        "content": "Various gentle sleep training approaches can help establish healthy sleep habits. Choose methods that align with your family's comfort level.",
        "category": "sleep",
        "age_range": "3-12months",
        "tags": ["sleep training", "sleep habits", "night sleep"]
    },
    {
        "title": "Language Development Activities",
        "content": "Reading, singing, and talking to your baby promotes language development. Narrate daily activities and respond to baby's vocalizations.",
        "category": "development",
        "age_range": "0-24months",
        "tags": ["language", "reading", "communication"]
    }
]

# Sample daily tips data
DAILY_TIPS_DATA = [
    {
        "content": "Newborns sleep 14-17 hours per day, but rarely for more than 2-4 hours at a time. This is completely normal!",
        "category": "sleep",
        "age_range": "0-3months"
    },
    {
        "content": "Your baby's first smile is likely to appear between 6-8 weeks. It's one of the most magical milestones!",
        "category": "development",
        "age_range": "0-3months"
    },
    {
        "content": "Skin-to-skin contact helps regulate your baby's temperature, heart rate, and promotes bonding.",
        "category": "bonding",
        "age_range": "0-6months"
    },
    {
        "content": "It's normal for breastfed babies to feed 8-12 times in 24 hours. Follow your baby's cues rather than the clock.",
        "category": "feeding",
        "age_range": "0-6months"
    },
    {
        "content": "Babies typically double their birth weight by 6 months and triple it by their first birthday.",
        "category": "growth",
        "age_range": "0-12months"
    },
    {
        "content": "Around 4-6 months, your baby may start showing interest in solid foods by watching you eat and reaching for food.",
        "category": "feeding",
        "age_range": "4-6months"
    },
    {
        "content": "Most babies take their first steps between 9-18 months. Each child develops at their own pace.",
        "category": "development",
        "age_range": "9-18months"
    },
    {
        "content": "Reading to your baby from birth helps with language development and creates positive associations with books.",
        "category": "development",
        "age_range": "0-24months"
    }
]


async def create_tables():
    """Create all database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def seed_milestones(session: AsyncSession):
    """Seed milestone data."""
    print("Seeding milestones...")
    
    for milestone_data in MILESTONES_DATA:
        milestone = Milestone(**milestone_data)
        session.add(milestone)
    
    await session.commit()
    print(f"Created {len(MILESTONES_DATA)} milestones")


async def seed_resources(session: AsyncSession):
    """Seed resource data."""
    print("Seeding resources...")
    
    for resource_data in RESOURCES_DATA:
        resource = Resource(**resource_data)
        session.add(resource)
    
    await session.commit()
    print(f"Created {len(RESOURCES_DATA)} resources")


async def seed_daily_tips(session: AsyncSession):
    """Seed daily tips data."""
    print("Seeding daily tips...")
    
    for tip_data in DAILY_TIPS_DATA:
        tip = DailyTip(**tip_data)
        session.add(tip)
    
    await session.commit()
    print(f"Created {len(DAILY_TIPS_DATA)} daily tips")


async def main():
    """Main seeder function."""
    print("Starting database seeding...")
    
    # Create tables
    await create_tables()
    print("Database tables created")
    
    # Create session
    async with async_session() as session:
        try:
            # Seed all data
            await seed_milestones(session)
            await seed_resources(session)
            await seed_daily_tips(session)
            
            print("Database seeding completed successfully!")
            
        except Exception as e:
            print(f"Error during seeding: {e}")
            await session.rollback()
            raise


if __name__ == "__main__":
    asyncio.run(main())
