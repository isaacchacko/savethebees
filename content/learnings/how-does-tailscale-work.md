---
title: How does Tailscale work?
date: 2026-08-21
description: WireGuard, a coordination server, NAT traversal, and DERP.
---

# How does Tailscale work?

install Tailscale on two machines, log into both, and they can talk like they're on the same LAN. even behind hotel wifi or a cloud VPC with no open ports.

that is [WireGuard](https://www.wireguard.com/) plus a coordination server plus NAT traversal.

## two planes

**data plane:** WireGuard on each device. packets are encrypted on one machine and decrypted on the other. Tailscale is not in the path when a direct connection exists.

**control plane:** Tailscale's coordination server. it does not carry your traffic. it is a drop box for public keys, identities, endpoints, and policy.

each node generates a keypair (private key never leaves), logs in with Google or GitHub or Okta, uploads its public key and current address, downloads the peer list, and programs WireGuard.

a tailnet is the overlay for one identity domain. the coordination server decides who learns about whom. it cannot decrypt your traffic.

## NAT and DERP

two clients behind firewalls have no public port to dial. Tailscale hole-punches: both sides send UDP at once so NAT mappings open. connections start on a relay and upgrade to direct if punching works (~90% of the time).

if it doesn't, **DERP** (Designated Encrypted Relay for Packets) forwards already-encrypted WireGuard over HTTPS 443. it cannot read the payload. worse latency, but it works on networks that only allow web traffic. Tailscale keeps probing and upgrades when it can.

## the rest

every node gets a stable `100.x` IP and a MagicDNS name like `laptop`. ACLs live on the coordination server and are enforced on each node at decrypt. subnet routers and exit nodes are optional if you need a whole LAN or a classic VPN exit.

Tailscale can see who is in the tailnet, device keys, endpoints, and policy. it cannot see session contents, direct or relayed. if you want the control plane on your own metal, that's [Headscale](https://github.com/juanfont/headscale).

```
identity provider   ->  who are you?
coordination server ->  keys, IPs, rules
each device         ->  WireGuard, punch holes, else DERP
WireGuard           ->  move the bytes, encrypted, peer to peer
```

WireGuard was already good. Tailscale is the missing control plane so two machines can find each other.
