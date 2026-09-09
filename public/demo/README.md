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

1. Current situation / pain
2. Goal for the next 90 days
3. The gap between the two
4. Pitch the call, then send the Calendly link

Objections interrupt at any point without losing the thread — price, "tell me
more", "I'll think about it", "no time", "is this AI", and the no-offer branch
that routes to the First Product Formula. Suggested replies sit above the
composer so a prospect can tap through the whole thing on a phone.

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
