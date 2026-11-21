---
type: C4 Actor
title: Operator
status: stable
groma:
  id: operator
---

Runs a personal OpenClaw on their own machine. They message the assistant on
the chats they already use, and they onboard, pair, and inspect the Gateway
from the CLI, Control UI, or a companion node.

## Relationships

| Source | Target | Description | Technology |
| --- | --- | --- | --- |
| [Operator](operator.md "operator") | [WhatsApp](../externals/whatsapp.md "whatsapp") | Messages the assistant from a phone chat | WhatsApp |
| [Operator](operator.md "operator") | [Telegram](../externals/telegram.md "telegram") | Messages the assistant from a bot chat | Telegram |
| [Operator](operator.md "operator") | [CLI](../systems/openclaw/containers/cli/container.md "cli") | Onboards, starts the Gateway, approves pairing, and sends agent turns | openclaw |
| [Operator](operator.md "operator") | [Control UI](../systems/openclaw/containers/control-ui/container.md "control-ui") | Chats, edits config, and watches sessions in a browser | Browser |
| [Operator](operator.md "operator") | [Node](../systems/openclaw/containers/node/container.md "node") | Pairs a Mac, iPhone, or Android as a device for canvas, camera, and local exec | Companion app |
