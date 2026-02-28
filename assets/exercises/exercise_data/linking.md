# Data Linking Documentation

This document describes the relationships between the CSV files in the dataset.

## Central Entity: Exercises Detailed
**File:** `exercises_detailed.csv`
- **Primary Key:** `id`
- **Description:** Contains the main details of each exercise, including name, gender, type, instructions, and equipment details.
- **Columns:** `id`, `Exercise name`, `Gender`, `instructions`, `avg_time_per_rep`, `is_per_side`, `exercise_type`, `place`, `equipments`, `requires_weight`, `weight_unit`, `recommended_weight_range`

## Related Entities

### Focus Areas
**File:** `exercise_focus_areas.csv`
- **Foreign Key:** `exercise_id` links to `exercises_detailed.csv` (`id`)
- **Relationship:** One-to-Many
  - One exercise can target multiple body areas (e.g., Legs, Glutes).
- **Columns:** `exercise_id`, `Area`, `Weightage`

### Mistakes
**File:** `exercise_mistakes.csv`
- **Foreign Key:** `exercise_id` links to `exercises_detailed.csv` (`id`)
- **Relationship:** One-to-Many
  - One exercise can have multiple common mistakes associated with it.
- **Columns:** `exercise_id`, `title`, `subtitle`

### Tips
**File:** `exercise_tips.csv`
- **Foreign Key:** `exercise_id` links to `exercises_detailed.csv` (`id`)
- **Relationship:** One-to-Many
  - One exercise can have multiple tips for proper form or execution.
- **Columns:** `exercise_id`, `tip`
