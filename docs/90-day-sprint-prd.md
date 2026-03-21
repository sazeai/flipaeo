# FlipAEO 90-Day Sprint PRD

## 1) Context

FlipAEO currently operates as a recurring SaaS subscription with monthly-style automation and credits. The core engine is strong (research, generation, publishing), but product packaging causes churn once idea pools weaken.

This pivot changes FlipAEO into a fixed-term, high-ticket, done-for-you delivery model:

- one-time payment
- strict 90-day execution window
- fixed quotas split across net-new and historical refresh content
- GSC-driven refresh strategy
- project-tracker UX instead of SaaS subscription UX

## 2) Goals

- Deliver predictable business outcomes in 90 days.
- Preserve and reuse the existing generation and publishing engine.
- Eliminate recurring subscription dependence for sprint-mode users.
- Improve strategy quality via staged planning (not one-shot bulk generation).
- Ensure strong anti-dup guarantees across batches and existing site coverage.
- Add measurable before/after reporting via GSC metrics.

## 3) Non-Goals

- Rebuilding the core writing engine from scratch.
- Supporting unlimited rolling monthly plan auto-refills for sprint-mode users.
- Creating a fully custom per-client strategy framework in v1.
- Replacing all legacy subscription logic immediately for existing subscribers.

## 4) Package Definitions

## 4.1 Sprint Tiers

- Sprint 497:
  - duration: 90 days
  - net-new quota: 50
  - refresh quota: 25
  - total actions: 75
- Sprint 897:
  - duration: 90 days
  - net-new quota: 100
  - refresh quota: 50
  - total actions: 150

## 4.2 Core Rules

- Ratio is fixed at 2:1 net-new:refresh per package.
- Quotas are fixed per sprint and do not auto-renew.
- Usage is counted per successful content action (new post created or existing post updated).
- Sprint expires exactly at `ends_at`; automation must pause/stop on expiry.

## 5) User Journeys

## 5.1 Purchase to Activation

1. User selects package and checks out via Dodo one-time payment.
2. Webhook verifies payment and creates `user_sprints` grant.
3. Sprint status changes from `pending` to `active` once onboarding prerequisites are complete.

## 5.2 Onboarding

1. Brand profile capture (offer, ICP, geo/language, goals).
2. Required content inventory source:
   - `primary_blog_sitemap_url` required
   - optional extra sitemap URLs
3. CMS connection (WordPress/Webflow/Shopify).
4. GSC connection (recommended, required for full refresh execution quality).
5. Inventory validation:
   - crawl + classify article URLs
   - confidence score
   - user confirmation before strategy generation

## 5.3 Execution

1. Strategy Map generation.
2. Batch candidate generation and anti-dup validation.
3. Approved schedule assembled for 90-day pacing.
4. Scheduler executes daily new/refresh pipeline based on quotas and days remaining.

## 5.4 Completion

- Sprint reaches complete when:
  - both quotas consumed, or
  - day 90 reached.
- Dashboard shows delivered actions, metric changes, and closure summary.

## 6) Functional Requirements

## 6.1 Billing and Entitlements

- Replace recurring checkout for sprint-mode with one-time checkout products.
- On payment success, create sprint grant with package quota snapshot.
- Centralize entitlement checks in sprint-aware service.
- Hide/deprecate recurring management endpoints for sprint-mode users.

## 6.2 Onboarding and Inventory Validation

- Must collect article sitemap input during onboarding.
- Must classify URLs as `article` or `non_article`.
- Must display inventory confidence and require confirmation for low-confidence imports.
- Must store confirmed inventory snapshot for strategy and dedup reference.

## 6.3 Strategy and Plan Generation

- Must not request 75/150 topics in one LLM call.
- Must use wave-based generation:
  - Strategy Map
  - Candidate batches
  - Dedup + quality gates
  - Schedule assembly
- Must checkpoint after each batch for resumability.

## 6.4 New vs Refresh Content Routing

- New content action:
  - gap topic -> article generation -> CMS create
- Refresh action:
  - decaying URL -> scrape current content -> update prompt -> CMS update by ID
- Quota consumption must match action type (`new` or `refresh`) only.

## 6.5 Scheduler and Pacing

- Daily pacing must account for:
  - days remaining
  - remaining new quota
  - remaining refresh quota
- Must prevent burst overproduction.
- Must recover from missed days gradually.
- Must halt on sprint expiry.

## 6.6 GSC Decay and Refresh Prioritization

- Fetch 30-day and 60-day rolling windows by page.
- Compute decay score using clicks, impressions, CTR, and position trend.
- Rank and persist candidate pages for refresh allocation.
- Fallback order when decays are insufficient:
  - low CTR / high impression pages
  - stagnant high-value pages
  - keep residual refresh quota pending

## 6.7 Dashboard Revamp

- Project-tracker style dashboard with:
  - 90-day countdown
  - net-new progress
  - refresh progress
  - total completion
  - before/after GSC KPI cards
  - refreshed URL uplift indicators

## 7) Data Model

## 7.1 New Tables

### `sprint_packages`

- `id` uuid pk
- `code` text unique (`sprint_497`, `sprint_897`)
- `name` text
- `price` numeric
- `currency` text
- `duration_days` int default 90
- `quota_new_articles` int
- `quota_refresh_articles` int
- `is_active` bool
- timestamps

### `user_sprints`

- `id` uuid pk
- `user_id` uuid fk auth.users
- `package_id` uuid fk sprint_packages
- `status` enum (`pending`, `active`, `paused`, `completed`, `expired`, `cancelled`)
- `starts_at` timestamptz
- `ends_at` timestamptz
- `activated_at` timestamptz
- `completed_at` timestamptz
- `dodo_checkout_id` text
- `dodo_payment_id` text
- `metadata` jsonb
- timestamps

### `sprint_quota_ledgers`

- `id` uuid pk
- `user_sprint_id` uuid fk user_sprints
- `quota_type` enum (`new`, `refresh`)
- `delta` int (negative on consume, positive on adjustment/refund)
- `reason` text
- `article_id` uuid nullable
- `content_plan_item_id` text nullable
- `correlation_id` text nullable
- `meta` jsonb
- `created_at` timestamptz

### `topic_registry`

- `id` uuid pk
- `user_sprint_id` uuid fk user_sprints
- `state` enum (`candidate`, `reserved`, `accepted`, `merged`, `rejected`, `conflict_replacement_requested`)
- `title` text
- `canonical_keyword` text
- `normalized_slug` text
- `intent` text
- `funnel_role` text
- `cluster_id` text
- `embedding` vector nullable
- `source_batch_id` text
- `reason` text nullable
- timestamps

### `gsc_decay_candidates`

- `id` uuid pk
- `user_sprint_id` uuid fk user_sprints
- `page_url` text
- `window_30_clicks` numeric
- `window_60_clicks` numeric
- `window_30_impressions` numeric
- `window_60_impressions` numeric
- `ctr_delta` numeric
- `position_delta` numeric
- `decay_score` numeric
- `status` enum (`queued`, `selected`, `used`, `skipped`)
- `meta` jsonb
- timestamps

## 7.2 Extensions to Existing Models

- `content_plans`:
  - add `user_sprint_id`
  - add `plan_mode` (`legacy_monthly`, `sprint_90_day`)
- `plan_data` item fields:
  - `content_action` (`new` or `refresh`)
  - `target_url`
  - `target_post_id`
  - `gsc_baseline_metrics`
  - `registry_topic_id`

## 8) API Contracts (Target)

## 8.1 Billing

- `POST /api/dodopayments/checkout`
  - input: `packageCode`
  - output: checkout session URL
- `POST /api/dodopayments/webhook`
  - on one-time payment success:
    - create `user_sprints`
    - seed initial entitlement state

## 8.2 Onboarding

- `POST /api/onboarding/sprint`
  - saves brand profile + sitemap URLs + settings
- `POST /api/onboarding/sprint/validate-inventory`
  - crawls and classifies URLs
- `POST /api/onboarding/sprint/confirm-inventory`
  - user confirms article corpus

## 8.3 Strategy Generation

- `POST /api/sprint/strategy/start`
- `POST /api/sprint/strategy/batch`
- `POST /api/sprint/strategy/finalize`

## 8.4 GSC Refresh

- `POST /api/gsc/decay/sync`
- `GET /api/gsc/decay/candidates`

## 8.5 Dashboard

- `GET /api/sprint/progress`
- `GET /api/sprint/kpis`

## 9) Deduplication V2 Specification

## 9.1 Lexical

- Compare normalized title + keyword variants.
- Reject exact slug duplicates.
- Reject high lexical overlap above threshold.

## 9.2 Semantic

- Embedding similarity against:
  - existing site inventory
  - accepted topics
  - reserved topics
- Reject above hard threshold.

## 9.3 Intent-Role Collision

- Block topics with same intent + same funnel role unless `angle_against_competitors` is unique and passes minimum distance rule.

## 9.4 Concurrency Safety

- Reserve topic before final acceptance.
- Re-check conflicts at commit.
- On conflict, mark `conflict_replacement_requested` and request replacement.

## 10) Edge Cases

- Missing/invalid sitemap:
  - block strategy generation and request correction.
- Mixed sitemap content:
  - classify + user confirmation required.
- No GSC:
  - allow sprint new queue; hold refresh queue pending.
- Insufficient decay candidates:
  - fallback priority then pending remainder.
- Batch failure mid-run:
  - resume from last checkpoint and prevent duplicate acceptance.

## 11) Security and Compliance

- Encrypt OAuth tokens and CMS credentials at rest.
- Never overwrite stored refresh token with null/empty value.
- Keep webhook signature verification and idempotency as mandatory controls.
- Add audit logs for quota ledger adjustments and manual ops actions.

## 12) Observability and Operations

- Add structured logs for:
  - onboarding validation
  - batch strategy generation
  - dedup decisions
  - quota ledger writes
  - scheduler decisions
- Add admin tools:
  - replay webhook event
  - inspect sprint entitlement
  - adjust quota with reason

## 13) Rollout and Migration

- Feature flags:
  - `billing_sprint_mode`
  - `content_refresh_mode`
  - `project_tracker_ui`
- Keep legacy monthly users on old flow during transition.
- Disable monthly auto-refill and subscription-renewal plan regeneration for sprint-mode users.
- Backfill strategy for existing paid users decided by ops policy.

## 14) QA and Acceptance Criteria

## 14.1 Billing

- one-time payment creates sprint grant exactly once (idempotent)
- no recurring dependency for sprint-mode users

## 14.2 Onboarding

- strategy cannot start without validated inventory input
- user can confirm/correct imported article corpus

## 14.3 Strategy Quality

- no one-shot 75/150 generation
- dedup collision rate under agreed threshold
- all accepted topics include strategic metadata

## 14.4 Execution

- new actions consume only new quota
- refresh actions consume only refresh quota
- scheduler respects 90-day pacing and expiry

## 14.5 Dashboard

- countdown, progress, and GSC comparisons render correctly
- uplift metrics tie back to refreshed URLs

## 15) Build Sequence

1. PRD signoff
2. schema migrations + entitlement service
3. one-time billing and webhook grant flow
4. onboarding redesign + inventory validation
5. strategy wave engine + topic registry + dedup v2
6. scheduler split and pacing
7. refresh pipeline + CMS update paths
8. project tracker dashboard
9. staged rollout + QA completion
