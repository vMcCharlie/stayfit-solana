import { createClient, SupabaseClient, User } from 'jsr:@supabase/supabase-js@2'

export const createSupabaseClient = (req: Request) => {
    return createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
            global: {
                headers: { Authorization: req.headers.get('Authorization')! },
            },
        }
    )
}

export const createServiceClient = () => {
    return createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    )
}

export const getUser = async (req: Request): Promise<{ user: User | null; error: any }> => {
    const supabase = createSupabaseClient(req)
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    return { user, error }
}
