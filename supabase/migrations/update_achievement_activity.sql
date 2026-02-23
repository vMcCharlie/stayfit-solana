-- Update the achievement trigger to include tier/level information
create or replace function public.handle_new_achievement()
returns trigger as $$
declare
    tier_name text;
begin
    -- Determine tier name based on level
    tier_name := case new.current_level
        when 1 then 'bronze'
        when 2 then 'silver'
        when 3 then 'gold'
        when 4 then 'purple'
        else 'bronze'
    end;

    insert into public.activities (user_id, type, data)
    values (
        new.user_id,
        'achievement_unlocked',
        jsonb_build_object(
            'achievement_code', new.achievement_code,
            'tier', tier_name,
            'level', new.current_level,
            'unlocked_at', new.unlocked_at
        )
    );
    return new;
end;
$$ language plpgsql security definer;

-- Also handle updates (when user levels up an achievement)
create or replace function public.handle_achievement_upgrade()
returns trigger as $$
declare
    tier_name text;
begin
    -- Only trigger if level actually increased
    if new.current_level > old.current_level then
        tier_name := case new.current_level
            when 1 then 'bronze'
            when 2 then 'silver'
            when 3 then 'gold'
            when 4 then 'purple'
            else 'bronze'
        end;

        insert into public.activities (user_id, type, data)
        values (
            new.user_id,
            'achievement_unlocked',
            jsonb_build_object(
                'achievement_code', new.achievement_code,
                'tier', tier_name,
                'level', new.current_level,
                'unlocked_at', now()
            )
        );
    end if;
    return new;
end;
$$ language plpgsql security definer;

-- Create trigger for upgrades
drop trigger if exists on_achievement_upgraded on public.user_achievements;
create trigger on_achievement_upgraded
    after update on public.user_achievements
    for each row execute procedure public.handle_achievement_upgrade();
