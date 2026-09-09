# Setter demo

A shareable Instagram DM demo of the AI setter. Plain HTML — no backend, no API
keys, no per-conversation cost. Anyone can open it without an account.

## Deploy

The file is in `public/`, so merging this branch into `main` publishes it at
`https://yourdomain.com/demo/`. Nothing else to configure.

To host it somewhere else instead, drag this folder onto
[app.netlify.com/drop](https://app.netlify.com/drop) — it is a single self-contained
file.

## Unique links per prospect

Add any of `name`, `handle`, `biz` (or `niche`), `followers`, `note` to the URL.
Spaces become `%20`.

```
https://yourdomain.com/demo/
https://yourdomain.com/demo/?name=Maya%20Ellis&biz=online%20fitness%20coaching
https://yourdomain.com/demo/?name=Dan&biz=paid%20ads%20agency
```

With no parameters the setter opens cold. With them it greets by first name and
works their niche into the opener and the social proof line.

## How the conversation runs

The lead types whatever they want. The script follows the live setter's flow:

1. Current situation, with a clarifying question first if their answer is vague
2. What they're currently doing to get clients
3. Goal for the next 90 days
4. The gap between the two
5. Pitch the call, then send the Calendly link

It reads what they type as it goes. It picks up their niche from thirteen
patterns (coach, agency, ads, ecom, editor, course, realtor, saas, and so on)
and reuses it in the pitch's social proof. It picks up their goal ("20k months",
"double my clients") and puts it in the ask. Insights only fire when the answer
matches a known pain, and never twice in one conversation.

Fifteen objection branches interrupt without losing the thread: price, proof,
what-is-it, done-for-you, how-long, other platforms, niche fit, already-have-one,
who-are-you, think-about-it, no-time, is-this-AI, plus the no-offer branch to the
First Product Formula. Rude messages, repeated nonsense and existing clients hand
over to a human, matching the workflow's own handover rules.

Objections raised before the pain and the goal are established get answered and
returned to the open question, so it never pitches early.

## Editing the words

Everything the setter says is in the `<script>` block near the top:

- `STAGES` — the four questions and their suggested replies
- `OBJECTIONS` — the objection handlers
- `BOOKED` — the Calendly message
- `CALENDLY` — the booking link

Every reply is a single message. The setter never sends a second one before
the lead has answered, so keep each string to one message and one question.

## Note

Replies here are scripted, not generated. The page says "Demo conversation" and
does not claim to be live AI — worth keeping that way so a prospect who books
off it isn't surprised on the call.
