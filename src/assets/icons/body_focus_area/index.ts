import { ImageSourcePropType } from "react-native";

// Boy Icons
const boy_abs_dark = require("./boy_abs_dark.jpg");
const boy_abs_light = require("./boy_abs_light.jpg");
const boy_arms_dark = require("./boy_arms_dark.jpg");
const boy_arms_light = require("./boy_arms_light.jpg");
const boy_back_dark = require("./boy_back_dark.jpg");
const boy_back_light = require("./boy_back_light.jpg");
const boy_chest_dark = require("./boy_chest_dark.jpg");
const boy_chest_light = require("./boy_chest_light.jpg");
const boy_glutes_dark = require("./boy_glutes_dark.jpg");
const boy_glutes_light = require("./boy_glutes_light.jpg");
const boy_leg_dark = require("./boy_leg_dark.jpg");
const boy_leg_light = require("./boy_leg_light.jpg");
const boy_shoulder_dark = require("./boy_shoulder_dark.jpg");
const boy_shoulder_light = require("./boy_shoulder_light.jpg");

// Girl Icons
const girl_abs_dark = require("./girl_abs_dark.jpg");
const girl_abs_light = require("./girl_abs_light.jpg");
const girl_arms_dark = require("./girl_arms_dark.jpg");
const girl_arms_light = require("./girl_arms_light.jpg");
const girl_back_dark = require("./girl_back_dark.jpg");
const girl_back_light = require("./girl_back_light.jpg");
const girl_chest_dark = require("./girl_chest_dark.jpg");
const girl_chest_light = require("./girl_chest_light.jpg");
const girl_glutes_dark = require("./girl_glutes_dark.jpg");
const girl_glutes_light = require("./girl_glutes_light.jpg");
const girl_leg_dark = require("./girl_leg_dark.jpg");
const girl_leg_light = require("./girl_leg_light.jpg");
const girl_shoulder_dark = require("./girl_shoulder_dark.jpg");
const girl_shoulder_light = require("./girl_shoulder_light.jpg");

export type BodyPartName = "Abs" | "Chest" | "Back" | "Arm" | "Leg" | "Glutes" | "Shoulder";
export type Gender = "Male" | "Female" | "Other" | string | null;
export type ThemeMode = "dark" | "light";

export const getBodyFocusIcon = (gender: Gender, bodyPart: string, isDarkMode: boolean): ImageSourcePropType => {
    const isFemale = gender === "Female";
    // Default to boy if not female (handles Male, Other, null)
    const prefix = isFemale ? "girl" : "boy";
    const suffix = isDarkMode ? "dark" : "light";

    // Map UI names to file parts
    // "Arm" -> "arms"
    // "Leg" -> "leg"
    // "Abs" -> "abs"
    // "Chest" -> "chest"
    // "Back" -> "back"
    // "Glutes" -> "glutes"
    // "Shoulder" -> "shoulder"

    let part = bodyPart.toLowerCase();
    if (part === "arm") part = "arms";

    // Construct lookup key or switch
    // Using a simpler switch for explicit mapping safety

    if (isFemale) {
        switch (part) {
            case "abs": return isDarkMode ? girl_abs_dark : girl_abs_light;
            case "arms": return isDarkMode ? girl_arms_dark : girl_arms_light;
            case "back": return isDarkMode ? girl_back_dark : girl_back_light;
            case "chest": return isDarkMode ? girl_chest_dark : girl_chest_light;
            case "glutes": return isDarkMode ? girl_glutes_dark : girl_glutes_light;
            case "leg": return isDarkMode ? girl_leg_dark : girl_leg_light;
            case "shoulder": return isDarkMode ? girl_shoulder_dark : girl_shoulder_light;
        }
    } else {
        switch (part) {
            case "abs": return isDarkMode ? boy_abs_dark : boy_abs_light;
            case "arms": return isDarkMode ? boy_arms_dark : boy_arms_light;
            case "back": return isDarkMode ? boy_back_dark : boy_back_light;
            case "chest": return isDarkMode ? boy_chest_dark : boy_chest_light;
            case "glutes": return isDarkMode ? boy_glutes_dark : boy_glutes_light;
            case "leg": return isDarkMode ? boy_leg_dark : boy_leg_light;
            case "shoulder": return isDarkMode ? boy_shoulder_dark : boy_shoulder_light;
        }
    }

    // Fallback? Should not happen given the types but good for runtime safety
    return isDarkMode ? boy_abs_dark : boy_abs_light;
};
