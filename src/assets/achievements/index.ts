
// Achievement Asset Mapping

// Helper to get asset by name
// The DB tiers have asset_name like 'streak_master_bronze'
// We map these to the require statements

const ASSETS: Record<string, any> = {
    // Streak Master
    'streak_master_locked': require('./streaks_compressed/streaks_1.png'),
    'streak_master_bronze': require('./streaks_compressed/streaks_2.png'),
    'streak_master_silver': require('./streaks_compressed/streaks_3.png'),
    'streak_master_gold': require('./streaks_compressed/streaks_4.png'),
    'streak_master_purple': require('./streaks_compressed/streaks_5.png'),

    // Weekend Warrior
    'weekend_warrior_locked': require('./weekend_compressed/weekend_1.png'),
    'weekend_warrior_bronze': require('./weekend_compressed/weekend_2.png'),
    'weekend_warrior_silver': require('./weekend_compressed/weekend_3.png'),
    'weekend_warrior_gold': require('./weekend_compressed/weekend_4.png'),
    'weekend_warrior_purple': require('./weekend_compressed/weekend_5.png'),

    // Early Bird
    'early_bird_locked': require('./day_compressed/day_1.png'),
    'early_bird_bronze': require('./day_compressed/day_2.png'),
    'early_bird_silver': require('./day_compressed/day_3.png'),
    'early_bird_gold': require('./day_compressed/day_4.png'),
    'early_bird_purple': require('./day_compressed/day_5.png'),

    // Club 100
    'club_100_locked': require('./club100_compressed/club100_1.png'),
    'club_100_bronze': require('./club100_compressed/club100_2.png'),
    'club_100_silver': require('./club100_compressed/club100_3.png'),
    'club_100_gold': require('./club100_compressed/club100_4.png'),
    'club_100_purple': require('./club100_compressed/club100_5.png'),

    // Calorie Crusher
    'calorie_crusher_locked': require('./calorie_crusher_compressed/calorie_crusher_1.png'),
    'calorie_crusher_bronze': require('./calorie_crusher_compressed/calorie_crusher_2.png'),
    'calorie_crusher_silver': require('./calorie_crusher_compressed/calorie_crusher_3.png'),
    'calorie_crusher_gold': require('./calorie_crusher_compressed/calorie_crusher_4.png'),
    'calorie_crusher_purple': require('./calorie_crusher_compressed/calorie_crusher_5.png'),

    // Push It Limit
    'push_it_limit_locked': require('./push_it_compressed/push_it_1.png'),
    'push_it_limit_bronze': require('./push_it_compressed/push_it_2.png'),
    'push_it_limit_silver': require('./push_it_compressed/push_it_3.png'),
    'push_it_limit_gold': require('./push_it_compressed/push_it_4.png'),
    'push_it_limit_purple': require('./push_it_compressed/push_it_5.png'),

    // Leg Day Survivor
    'leg_day_survivor_locked': require('./leg_compressed/leg_1.png'),
    'leg_day_survivor_bronze': require('./leg_compressed/leg_2.png'),
    'leg_day_survivor_silver': require('./leg_compressed/leg_3.png'),
    'leg_day_survivor_gold': require('./leg_compressed/leg_4.png'),
    'leg_day_survivor_purple': require('./leg_compressed/leg_5.png'),

    // Core Commander
    'core_commander_locked': require('./shield_compressed/shield_1.png'),
    'core_commander_bronze': require('./shield_compressed/shield_2.png'),
    'core_commander_silver': require('./shield_compressed/shield_3.png'),
    'core_commander_gold': require('./shield_compressed/shield_4.png'),
    'core_commander_purple': require('./shield_compressed/shield_5.png'),

    // On The Scale
    'on_the_scale_locked': require('./scale_compressed/scale_1.png'),
    'on_the_scale_bronze': require('./scale_compressed/scale_2.png'),
    'on_the_scale_silver': require('./scale_compressed/scale_3.png'),
    'on_the_scale_gold': require('./scale_compressed/scale_4.png'),
    'on_the_scale_purple': require('./scale_compressed/scale_5.png'),

    // Photo Finish
    'photo_finish_locked': require('./photo_finish_compressed/photo_finish_1.png'),
    'photo_finish_bronze': require('./photo_finish_compressed/photo_finish_2.png'),
    'photo_finish_silver': require('./photo_finish_compressed/photo_finish_3.png'),
    'photo_finish_gold': require('./photo_finish_compressed/photo_finish_4.png'),
    'photo_finish_purple': require('./photo_finish_compressed/photo_finish_5.png'),

    // Sharer
    'sharer_locked': require('./sharer_compressed/sharer_1.png'),
    'sharer_bronze': require('./sharer_compressed/sharer_2.png'),
    'sharer_silver': require('./sharer_compressed/sharer_3.png'),
    'sharer_gold': require('./sharer_compressed/sharer_4.png'),
    'sharer_purple': require('./sharer_compressed/sharer_5.png'),

    // Profile Architect
    'profile_architect_locked': require('./profile_architect_compressed/profile_architect_1.png'),
    'profile_architect_bronze': require('./profile_architect_compressed/profile_architect_2.png'),
    'profile_architect_silver': require('./profile_architect_compressed/profile_architect_3.png'),
    'profile_architect_gold': require('./profile_architect_compressed/profile_architect_4.png'),
    'profile_architect_purple': require('./profile_architect_compressed/profile_architect_5.png'),
};

export const getAchievementAsset = (assetName: string) => {
    return ASSETS[assetName] || ASSETS['streak_master_locked']; // Default fallback
};

export const getLockedAssetForCode = (code: string) => {
    // Helper to get the locked version based on code
    const map: Record<string, string> = {
        'STREAK_MASTER': 'streak_master_locked',
        'WEEKEND_WARRIOR': 'weekend_warrior_locked',
        'EARLY_BIRD': 'early_bird_locked',
        'CLUB_100': 'club_100_locked',
        'CALORIE_CRUSHER': 'calorie_crusher_locked',
        'PUSH_IT_LIMIT': 'push_it_limit_locked',
        'LEG_DAY_SURVIVOR': 'leg_day_survivor_locked',
        'CORE_COMMANDER': 'core_commander_locked',
        'ON_THE_SCALE': 'on_the_scale_locked',
        'PHOTO_FINISH': 'photo_finish_locked',
        'SHARER': 'sharer_locked',
        'PROFILE_ARCHITECT': 'profile_architect_locked'
    };
    return getAchievementAsset(map[code] || 'streak_master_locked');
};
