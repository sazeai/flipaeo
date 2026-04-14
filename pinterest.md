The basics
Whatever your application will do, you must follow these fundamental principles:

1. Be honest and transparent with Pinterest and with your end users about the functions and features of your service. Don’t confuse, mislead or surprise anyone.
**[EcomPin Analysis: (Breach Found)]**
We are walking a dangerous line here. The app relies on "Human Entropy" logic to generate random delays (jitter) and uses "Trojan Horse Mood Boards" to artificially bypass trust checks. Being transparent about these features would mean admitting to creating tools to deliberately trick Pinterest's bot-detection systems.

2. Except for campaign analytics information accessed about your account, you cannot store any information accessed through any Pinterest Materials including the API. Instead, call the API each time you need to access information.
**[EcomPin Analysis: (Breach Found)]**
Our PRD and codebase reveal that we extract data from the `/v5/audience_insights` API to permanently alter the user's `audience_profile` in our database. We also fetch `/v5/trends/keywords` and cache those global trends locally to inform generative AI prompts for subsequent pins. Both actions violate the rule against storing API data.

3. Only access someone's account with authorisation, for example by using an access token. Do not solicit or collect login credentials or use login credentials to access other people’s accounts or take actions on their behalf.
**[EcomPin Analysis: YES]**
We cleanly use OAuth and securely store tokens in the `pinterest_connections` table. No passwords collected.

4. Only use information from someone’s account to provide services to that person.
**[EcomPin Analysis: YES]**
Data pulled for a specific brand is utilized to optimize that specific brand's publishing logic.

5. Don't combine someone's account information with information from other people's accounts or with information from other services.
**[EcomPin Analysis: (Breach Found)]**
In `trigger/generate-pin-batch.ts`, the script pulls trend data systematically. If the CRON job needs trends, it randomly grabs the OAuth token of the *first available user* in the DB (`maybeSingle()`), hits the Trends API, and then uses that global trend data as the seed to generate AI pins for *every other user* in the batch. This directly mixes and combines one account's authorized API access to power services for everyone else.
- solved

6. Don't share or sell information from our API with a third party, including another advertising service. It's OK to share information with the person from whose account that information came.
**[EcomPin Analysis: YES]**
We do not sell API data to any third-party ad brokers.

7. Keep your API access credentials private. Do not use someone else’s API credentials, and do not allow anyone else to use yours.
**[EcomPin Analysis: YES]**
Keys are secure.

8. End users can request API access credentials for use with a 'bring-your-own-key' application, as long as the application stores the end user’s API credentials locally (not server-side) and the application complies with all other policies and guidelines. For example, the application must not solicit Pinterest user passwords, session cookies, etc.
**[EcomPin Analysis: N/A]**
We use standard OAuth.

**9. Don’t try to evade our policy enforcement systems. For example, if we remove your app, don’t try to reconnect the same or a substantially similar app using a different account or under a different name.[EcomPin Analysis: (Breach Found)] This is a massive violation in our codebase. `trigger/publish-pins.ts` uses "Domain Velocity Capping," "Account Age matrices," and random 45-minute "Chronological Jitter" explicitly to "completely mask bot footprints" and evade Pinterest's shadowbans. We are systematically evading their enforcement systems.**

10. Follow any instructions in our technical documentation.
**[EcomPin Analysis: YES]**
API requests are formatted successfully.

11. You must have a privacy policy that’s consistent with all applicable laws. You’ll need to include a link to your privacy policy when you apply for API access.
**[EcomPin Analysis: YES]**

What to do
Acceptable uses of the Pinterest Materials such as our developer tools and APIs include building integrations such as:
Advertising tools, Audience tools, Content marketing tools such as Pin schedulers...
**[EcomPin Analysis: YES]**
We logically fall under Content Marketing and Dynamic Creative Tools.

What not to do
Unacceptable uses of the Pinterest Materials, such as our developer tools and APIs include:

Creating or providing an app for the purpose of violating Pinterest policies.
**[EcomPin Analysis: NO (Breach)]**
Because our platform is designed to emulate human behavior to bypass spam limits, Pinterest views the app's purpose as an automation tool that violates their organic engagement and authenticity guidelines.

Taking actions on behalf of end users without their specific knowledge and consent. This includes but is not limited to: modifying Pinner profiles, creating, saving and editing Pins, following and unfollowing, sending messages, making comments.
**[EcomPin Analysis: NO (Breach)]**
Even though we added the "Silver Platter" Inbox for human approval, the app still features an "Enable Full Autopilot" Mode (`brand.autopilot_enabled`). Once toggled, we design, generate, format, and publish pins (and automatically create SEO-optimized boards) 100% autonomously without the user reviewing or explicitly consenting to each action.

Offering features that enable end users to automatically initiate actions without specifically considering each action.
**[EcomPin Analysis: NO (Breach)]**
Again, the `autopilot_enabled` toggle and our "Feature 11" auto-board creation scripts mean the user is NOT considering each action. The AI initiates and completes actions on its own.

For example, if your app allows end users to schedule Pin publishing, the end user must choose each Pin to be published. Similarly, if your app allows end users to follow accounts on Pinterest, the end user must choose each account to follow.
**[EcomPin Analysis: NO (Breach)]**
We violate the literal wording of this rule: "the end user must choose each Pin to be published." In Autopilot mode, they only choose the master setting, not the individual Pins.

Put simply, end users are responsible for the actions they take on Pinterest, and we want those actions to be genuine – don't build automations that could lessen the authenticity of engagement on Pinterest or lead end users to perform an action that they didn't understand or intend.
**[EcomPin Analysis: NO (Breach)]**
We use generative AI to fake "authentic" lifestyle images for products and generate "Trojan Horse Mood Boards" purely to farm account trust. This severely lessens the authenticity of the platform because the images are entirely synthesized to look genuine.

Attempting or claiming to provide platform insights, benchmarking or competitor research features unless you have explicit written authorisation from Pinterest. For example, don’t make statements about Pinterest’s overall performance related to a competitor or to industry benchmarks, and don’t do the same for brands or accounts.
**[EcomPin Analysis: YES]**
Our competitor analysis logic (`lib/audit/competitor-scanner.ts`) relies on Tavily (web search), not Pinterest API data.

Using any automated means or form of scraping or data extraction to access information from Pinterest, except as expressly permitted by Pinterest.
**[EcomPin Analysis: YES]**
We strictly use their v5 API to fetch data (Trends, Audiences), not headless browser scraping.

Misrepresenting your relationship with Pinterest or your level of access to the Pinterest Materials.
**[EcomPin Analysis: YES]**

Using information from Pinterest to target people with advertising outside Pinterest, whether directly or bundled with third-party data. For example, do not bundle or sell content or data from Pinterest on other advertising networks, via data brokers or through any other advertising or monetisation service.
**[EcomPin Analysis: YES]**

Using your API access or developer tools to test Pinterest’s rate limits or other abuse prevention systems without specific authorisation from Pinterest.
**[EcomPin Analysis: NO (Breach)]**
Our "Warm-up phase" logic (throttles to 1-2 pins a day in month 1) is designed explicitly to test and bypass their abuse prevention systems. We are actively manipulating publishing volume to avoid triggering their internal security alarms.

Offering any feature to circumvent Pinterest restrictions. For example, don’t offer a feature that would allow end users in a region to access content that Pinterest has restricted from that region (a.k.a. geoblocked).
**[EcomPin Analysis: YES]**
We do not circumvent content geoblocks.

Requiring or incentivising engagement. For example, don’t require end users to create or save a Pin to a certain website, or to save a certain Pin in exchange for a benefit.
**[EcomPin Analysis: YES]**

Attempting to evade our consent mechanisms but gathering your own user consent for API-provided information.
**[EcomPin Analysis: YES]**

Apps intended for children under the age of 13 are not permitted.
**[EcomPin Analysis: YES]**

Publishing content
If your app publishes content from Pinterest, you must:
Link Pins back to their source on Pinterest...
Not cover or obscure content from Pinterest.
Not create new content from Pins that can be distributed on your app or service.
**[EcomPin Analysis: N/A]**
We are generating content *for* Pinterest, we are not extracting Pinterest's content to publish elsewhere.

Audience and advertiser services
If you provide audience onboarding... (Skipped)
**[EcomPin Analysis: N/A]**
We are not an advertising data platform passing offline data back to Pinterest Ads.

Regarding app abuse
We want developer applications to help everyone find the inspiration to create a life they love. Apps created for abuse (for example, apps created to spread spam) are not permitted. In addition, we expect developers to be responsible partners in abuse prevention and to take steps to mitigate the risk of their app being used in harmful ways by end users. This includes, for example, not offering features that facilitate spamming Pinterest or other users. We may remove apps in order to protect Pinners at any time.
**[EcomPin Analysis: NO (Breach)]**
By automating image generation, text generation, board creation, AND publishing without necessary user review ("Full Autopilot" + "Human Entropy Engine"), we are offering the ultimate tool to facilitate spamming Pinterest. Our "Moat" is fundamentally viewed by Pinterest as a sophisticated spam machine designed to cheat their algorithm while looking like genuine user activity. This is the root cause of the application rejection.