module.exports = async function submitDemo(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    res.status(500).json({ ok: false, error: "Discord webhook is not configured" });
    return;
  }

  let body = req.body || {};
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (error) {
      res.status(400).json({ ok: false, error: "Invalid JSON body" });
      return;
    }
  }
  if (body.hp) {
    res.status(200).json({ ok: true });
    return;
  }

  const fields = [
    { name: "Song Title", value: body.songTitle || "—", inline: true },
    { name: "Artist", value: body.artistName || "—", inline: true },
    { name: "Genre", value: body.genre || "—", inline: true },
    { name: "Track Link", value: body.trackLink || "—", inline: false },
  ];

  if (body.contactEmail) fields.push({ name: "Contact Email", value: body.contactEmail, inline: false });
  if (body.spotifyDisplayName) {
    fields.push({
      name: "Submitted By (Spotify)",
      value: body.spotifyProfileUrl
        ? `[${body.spotifyDisplayName}](${body.spotifyProfileUrl})`
        : body.spotifyDisplayName,
      inline: false,
    });
  }
  if (body.notes) fields.push({ name: "Notes", value: String(body.notes).slice(0, 1000), inline: false });

  const discordPayload = {
    username: process.env.DISCORD_WEBHOOK_USERNAME || "Demo Bot",
    avatar_url: process.env.DISCORD_WEBHOOK_AVATAR_URL || undefined,
    embeds: [
      {
        title: "🎵 New Demo Submission",
        color: 0xffffff,
        fields,
        timestamp: new Date().toISOString(),
      },
    ],
  };

  const discordRes = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(discordPayload),
  });

  if (!discordRes.ok) {
    res.status(502).json({ ok: false, error: "Discord webhook rejected the request" });
    return;
  }

  res.status(200).json({ ok: true });
};