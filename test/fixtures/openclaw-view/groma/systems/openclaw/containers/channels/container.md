---
type: C4 Container
title: Channels
status: stable
groma:
  id: channels
  parent: openclaw
---

The messaging edge the Gateway owns. This world keeps the two onboarding
paths the docs treat as first-class: WhatsApp Web and Telegram. DM pairing
and allowlists sit on this edge.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [Channels](container.md "channels") | [WhatsApp](../../../../externals/whatsapp.md "whatsapp") | Links a WhatsApp Web session and exchanges messages | WhatsApp Web |
| [Channels](container.md "channels") | [Telegram](../../../../externals/telegram.md "telegram") | Runs the bot and exchanges DMs and group messages | Telegram Bot API |
