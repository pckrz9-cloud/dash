# Public setter demo

A shareable Instagram DM demo that runs on your own n8n workflow, so anyone can
open the link — no account, no sign-in, no consent prompt.

- `ai-setter-demo.workflow.json` — the demo variant of the setter workflow
- `../public/demo/index.html` — the page, served at `/demo/` by this Next.js app

## 1. Import the workflow

n8n → **Workflows** → **Import from File** → `ai-setter-demo.workflow.json`.

It's the same agent as the live setter with the ManyChat send/tag nodes replaced
by **Respond to Webhook**. No API keys are stored in it.

Then, before activating:

1. **OpenAI Chat Model** — confirm your OpenAI credential is attached. The import
   references credential `Chu9g7HZ9uMpP3zd` ("OpenAI account"); reselect it if it
   didn't carry over.
2. **Set Prompt Values → `Lead Magnet URL`** — replace the placeholder with a real
   hosted URL. The live workflow currently points at
   `file:///C:/Users/thebo/Downloads/First_Product_Formula_Lead_Magnet.html`,
   which is a dead link for every lead who receives it.
3. **Demo Webhook → Options → `allowedOrigins`** — ships as `*`. Change it to your
   real domain (e.g. `https://yourdomain.com`) before you send links out, so other
   sites can't run traffic through your OpenAI key.
4. **Activate** the workflow and copy the **Production URL** from Demo Webhook.

## 2. Point the page at it

In `public/demo/index.html`, one line near the top of the script:

```js
var ENDPOINT = "https://YOUR-N8N-HOST/webhook/setter-demo";
```

Commit and push — Vercel deploys it to `https://yourdomain.com/demo/`.

## 3. Unique links per prospect

Add any of `name`, `handle`, `biz` (or `niche`), `followers`, `views`, `bio`, `note`
to the URL. The setter opens already knowing who it's talking to; the thread still
starts empty, so the personalisation lands in the replies.

```
https://yourdomain.com/demo/?name=Maya%20Ellis&handle=mayaellis.co&biz=online%20fitness%20coaching&followers=6200
https://yourdomain.com/demo/?name=Dan%20Whitlock&biz=paid%20ads%20agency%20for%20ecom&note=spent%201.4m%20on%20meta%20last%20year
```

With no parameters it opens cold and qualifies from scratch.

Only build these links yourself — everything in them is read by the agent as fact
about the lead.

## 4. Seeing who opened

Every page view POSTs `{event: "open", sessionId, lead, referrer}` before anyone
types. The **Log the open** node catches it. Hang a Google Sheets, Airtable or
Slack node off that node to get a live list of who opened which link and when.

Chat turns are keyed by `sessionId`, a fresh random id per page load, so each
visit is an independent conversation with its own memory.

## Costs and limits

Roughly a cent or two of OpenAI usage per demo conversation, on your key.

The webhook is public and unauthenticated. If a link ever gets passed around more
than you'd like, either rotate the webhook path or put a rate-limit / shared-secret
check in front of the agent branch.
