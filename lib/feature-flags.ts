function asBool(value: string | undefined, fallback = false) {
  if (value == null) return fallback
  return ["1", "true", "yes", "on"].includes(value.toLowerCase())
}

export const featureFlags = {
  billingSprintMode: asBool(process.env.FEATURE_BILLING_SPRINT_MODE, false),
  contentRefreshMode: asBool(process.env.FEATURE_CONTENT_REFRESH_MODE, false),
  projectTrackerUi: asBool(process.env.FEATURE_PROJECT_TRACKER_UI, false),
}

export function isFlagEnabled(flag: keyof typeof featureFlags) {
  return featureFlags[flag]
}
