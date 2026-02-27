import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, children, json } from '@nozbe/watermelondb/decorators';

/**
 * Exercise Model
 * Represents a single exercise with all its details
 * This data is relatively static and cached forever until user clears cache
 */
export default class Exercise extends Model {
  static table = 'exercises';

  static associations = {
    exercise_focus_areas: { type: 'has_many' as const, foreignKey: 'exercise_id' },
    exercise_mistakes: { type: 'has_many' as const, foreignKey: 'exercise_id' },
    exercise_tips: { type: 'has_many' as const, foreignKey: 'exercise_id' },
    routine_exercises: { type: 'has_many' as const, foreignKey: 'exercise_id' },
  };

  @field('server_id') serverId!: string;
  @field('name') name!: string;
  @field('gif_url') gifUrl?: string;
  @field('image_url_male') imageUrlMale?: string;
  @field('image_url_female') imageUrlFemale?: string;
  @field('exercise_type') exerciseType?: string;
  @field('avg_time_per_rep') avgTimePerRep?: number;
  @field('instructions') instructions?: string;
  @field('place') place?: string;
  @field('equipments') equipmentsJson?: string;
  @field('is_per_side') isPerSide?: boolean;
  @field('requires_weight') requiresWeight?: boolean;
  @field('weight_unit') weightUnit?: string;
  @field('recommended_weight_range') recommendedWeightRangeJson?: string;
  @field('synced_at') syncedAt!: number;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // Children relations
  @children('exercise_focus_areas') focusAreas: any;
  @children('exercise_mistakes') mistakes: any;
  @children('exercise_tips') tips: any;

  // Getters for parsed JSON fields
  get equipments(): string[] {
    try {
      return this.equipmentsJson ? JSON.parse(this.equipmentsJson) : [];
    } catch {
      return [];
    }
  }

  get recommendedWeightRange(): { min?: number; max?: number } | null {
    try {
      return this.recommendedWeightRangeJson ? JSON.parse(this.recommendedWeightRangeJson) : null;
    } catch {
      return null;
    }
  }

  // Get the best available image URL
  getImageUrl(gender: 'male' | 'female' = 'male'): string | undefined {
    if (gender === 'female' && this.imageUrlFemale) {
      return this.imageUrlFemale;
    }
    if (gender === 'male' && this.imageUrlMale) {
      return this.imageUrlMale;
    }
    return this.gifUrl || this.imageUrlMale || this.imageUrlFemale;
  }
}


