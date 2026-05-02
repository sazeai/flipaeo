import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * GET /api/analytics/experiments
 *
 * Returns the authenticated user's A/B experiments with pin thumbnails.
 * Used by the analytics dashboard to render experiment results.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: experiments, error } = await supabase
    .from('ab_experiments')
    .select(`
      id, product_id, aesthetic_a, aesthetic_b,
      status, winner, started_at, concluded_at,
      metrics_a, metrics_b,
      pin_a:pins!ab_experiments_pin_a_fkey(id, pin_title, rendered_image_url, aesthetic_tag),
      pin_b:pins!ab_experiments_pin_b_fkey(id, pin_title, rendered_image_url, aesthetic_tag),
      products(title)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ experiments: experiments || [] })
}
