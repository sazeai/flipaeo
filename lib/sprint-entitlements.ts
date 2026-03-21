import { createAdminClient } from '@/utils/supabase/admin'

type QuotaType = 'new' | 'refresh'

type SprintPackage = {
  id: string
  code: string
  duration_days: number
  quota_new_articles: number
  quota_refresh_articles: number
}

export async function getActiveSprint(userId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('user_sprints')
    .select('id, user_id, package_id, status, starts_at, ends_at')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  return { data, error: null as string | null }
}

export async function createOrActivateSprintFromPayment(params: {
  userId: string
  dodoProductId?: string | null
  dodoPaymentId?: string | null
  dodoCheckoutId?: string | null
  fallbackPackageCode?: string
}) {
  const supabase = createAdminClient()
  const {
    userId,
    dodoProductId,
    dodoPaymentId,
    dodoCheckoutId,
    fallbackPackageCode = 'sprint_497',
  } = params

  let packageQuery = supabase
    .from('sprint_packages')
    .select('id, code, duration_days, quota_new_articles, quota_refresh_articles')
    .eq('is_active', true)
    .limit(1)

  if (dodoProductId) {
    packageQuery = packageQuery.eq('dodo_product_id', dodoProductId)
  } else {
    packageQuery = packageQuery.eq('code', fallbackPackageCode)
  }

  const { data: pkg, error: pkgError } = await packageQuery.maybeSingle()
  if (pkgError || !pkg) {
    return { success: false, error: pkgError?.message || 'No sprint package found for payment' }
  }

  const now = new Date()
  const startsAt = now.toISOString()
  const endsAt = new Date(now.getTime() + (pkg.duration_days || 90) * 24 * 60 * 60 * 1000).toISOString()

  const { data: existing } = await supabase
    .from('user_sprints')
    .select('id, status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (existing?.id) {
    return { success: true, sprintId: existing.id, package: pkg as SprintPackage, alreadyActive: true }
  }

  const { data: sprint, error: sprintError } = await supabase
    .from('user_sprints')
    .insert({
      user_id: userId,
      package_id: pkg.id,
      status: 'active',
      starts_at: startsAt,
      ends_at: endsAt,
      activated_at: startsAt,
      dodo_checkout_id: dodoCheckoutId ?? null,
      dodo_payment_id: dodoPaymentId ?? null,
    })
    .select('id')
    .single()

  if (sprintError || !sprint) {
    return { success: false, error: sprintError?.message || 'Failed to create user sprint' }
  }

  await supabase.from('sprint_quota_ledgers').insert([
    {
      user_sprint_id: sprint.id,
      quota_type: 'new',
      delta: pkg.quota_new_articles,
      reason: 'Initial package quota grant',
      meta: { package_code: pkg.code, source: 'payment_activation' },
    },
    {
      user_sprint_id: sprint.id,
      quota_type: 'refresh',
      delta: pkg.quota_refresh_articles,
      reason: 'Initial package quota grant',
      meta: { package_code: pkg.code, source: 'payment_activation' },
    },
  ])

  return { success: true, sprintId: sprint.id, package: pkg as SprintPackage, alreadyActive: false }
}

export async function getSprintQuotaBalance(userSprintId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('sprint_quota_ledgers')
    .select('quota_type, delta')
    .eq('user_sprint_id', userSprintId)

  if (error) return { success: false, error: error.message, newRemaining: 0, refreshRemaining: 0 }

  let newRemaining = 0
  let refreshRemaining = 0
  for (const row of data ?? []) {
    if (row.quota_type === 'new') newRemaining += Number(row.delta || 0)
    if (row.quota_type === 'refresh') refreshRemaining += Number(row.delta || 0)
  }
  return { success: true, newRemaining, refreshRemaining, error: null as string | null }
}

export async function consumeSprintQuota(params: {
  userSprintId: string
  quotaType: QuotaType
  reason: string
  articleId?: string
  contentPlanItemId?: string
  correlationId?: string
}) {
  const supabase = createAdminClient()
  const balance = await getSprintQuotaBalance(params.userSprintId)
  if (!balance.success) return { success: false, error: balance.error || 'Failed to read sprint quota' }

  const remaining = params.quotaType === 'new' ? balance.newRemaining : balance.refreshRemaining
  if (remaining <= 0) return { success: false, error: `No ${params.quotaType} quota remaining` }

  const { error } = await supabase.from('sprint_quota_ledgers').insert({
    user_sprint_id: params.userSprintId,
    quota_type: params.quotaType,
    delta: -1,
    reason: params.reason,
    article_id: params.articleId ?? null,
    content_plan_item_id: params.contentPlanItemId ?? null,
    correlation_id: params.correlationId ?? null,
  })

  if (error) return { success: false, error: error.message }
  return { success: true }
}
