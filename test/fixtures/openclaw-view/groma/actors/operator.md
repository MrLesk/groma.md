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
| [operator](operator.md) | [whatsapp](../externals/whatsapp.md) | Messages the assistant from a phone chat | WhatsApp |
| [operator](operator.md) | [telegram](../externals/telegram.md) | Messages the assistant from a bot chat | Telegram |
| [operator](operator.md) | [cli](../systems/openclaw/containers/cli/container.md) | Onboards, starts the Gateway, approves pairing, and sends agent turns | openclaw |
| [operator](operator.md) | [control-ui](../systems/openclaw/containers/control-ui/container.md) | Chats, edits config, and watches sessions in a browser | Browser |
| [operator](operator.md) | [node](../systems/openclaw/containers/node/container.md) | Pairs a Mac, iPhone, or Android as a device for canvas, camera, and local exec | Companion app |
