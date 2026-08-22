---
title: How does Tailscale work?
date: 2026-08-21
description: WireGuard, the coordination server, NAT traversal, and DERP — how Tailscale turns a pile of devices into a mesh VPN.
---

# How does Tailscale work?

Tailscale feels like magic the first time you use it. you install it on your laptop and a VPS, log into both with the same Google or GitHub account, and suddenly you can SSH to the VPS as if it were on your LAN — even if one of you is behind hotel Wi-Fi and the other is on a cloud VPC with no public ports open.

it is not magic. it is WireGuard plus a coordination server plus some unusually good NAT traversal. this is a write-up of the pieces and how they fit together.

## the problem WireGuard leaves on the table

[WireGuard](https://www.wireguard.com/) is the data plane. each device gets a keypair. traffic between two peers is encrypted with ChaCha20-Poly1305 over UDP. the tunnels are cheap enough that you can have a lot of them.

the catch is bookkeeping. every peer needs every other peer's public key, current public IP, and port. devices move. laptops sleep. phones hop from Wi-Fi to LTE. most of them sit behind NATs that rewrite source addresses and drop unsolicited inbound packets. if you wire this up by hand you get a hub-and-spoke VPN: one box with a static IP and an open port, everyone else dials into it.

that works, and it is also how most "real" VPNs still look. it is just a bad shape for modern networks. your laptop in New York talking to a server also in New York should not hairpin through a concentrator in San Francisco. and two of your own devices should be able to talk to each other without a cloud in the middle.

Tailscale's bet is that WireGuard tunnels are cheap enough to build a **mesh**: every node talks to every other node it is allowed to reach, on the shortest path the internet will give them.

## two planes

Tailscale splits the problem in half.

the **data plane** is WireGuard on each device. packets between your laptop and your server are encrypted on one machine and decrypted on the other. Tailscale's servers are not in that path when a direct connection exists.

the **control plane** is Tailscale's coordination service (`login.tailscale.com`). it does not carry your SSH session or your file copies. it is a shared drop box for public keys, identities, current endpoints, and policy. each node:

1. generates a keypair locally. the private key never leaves the device.
2. logs in through an identity provider you already have (Google, GitHub, Okta, etc.).
3. uploads its public key plus "here is how you can currently reach me."
4. downloads the public keys, addresses, and ACL-derived peer list for its tailnet.
5. programs those peers into WireGuard.

a tailnet is just the overlay network for one identity domain — your personal account, or your company's SSO tenant.

because the private key stays on the node, the coordination server cannot impersonate you and cannot decrypt peer-to-peer traffic. it can decide *who is allowed to learn about whom*. that is the whole control-plane job.

## finding someone behind a NAT

keys are the easy part. the hard part is two machines that both think they are behind a firewall and neither has an open port.

classic client-server protocols dodge this: the client dials out, the server has a public address, NAT state gets created on the way out, replies come back. two clients cannot do that to each other. neither side has a stable destination.

Tailscale's answer is a pile of NAT-traversal tricks (STUN, ICE-style hole punching, and a few of their own) plus a fallback that always works.

roughly:

1. each node asks "what does the internet see me as?" — a STUN-style mapping of public IP and port.
2. the coordination server hands those candidate endpoints to the peer.
3. both sides start sending UDP toward each other at the same time. if the NATs are friendly, each packet creates a mapping the other side's packet can slip through. that is hole punching.
4. if a direct UDP path never comes up, traffic stays on a relay.

one important detail from Tailscale's own write-ups: connections **start** on a relay, then upgrade to direct if hole punching succeeds. you get connectivity immediately. the fast path is an optimization, not a prerequisite.

in typical conditions they claim well over 90% of connections end up direct. the remaining cases are the ugly ones — symmetric NAT, carrier-grade NAT, hotel networks that block UDP entirely.

## DERP, the relay that is not a VPN concentrator

when direct UDP cannot happen, Tailscale falls back to **DERP**: Designated Encrypted Relay for Packets.

DERP servers are scattered around the world. they accept HTTPS (TCP 443) and forward already-encrypted WireGuard packets from one node to another. they cannot read the payload. they do not terminate WireGuard. they are a dumb pipe for ciphertext, chosen because port 443 is almost never blocked.

that is the difference from a traditional VPN concentrator. a concentrator decrypts you, then re-encrypts or forwards you onto the private network. DERP never sees plaintext. latency is worse than a direct path — you are bouncing through someone else's TCP — but the session still works on an airplane, or on a network that only allows web traffic.

Tailscale keeps probing for a direct path in the background. if you leave the cafe and join a less hostile network, the connection upgrades without you doing anything.

they have also been adding peer relays: a node you already trust (say a home server with a decent connection) can relay for peers that cannot reach each other, so you are not always paying for Tailscale's DERP geography.

## names, IPs, and policy

once the mesh is up, a few other pieces make it feel like a LAN.

**100.x addresses.** every node gets a stable Tailscale IP in the `100.64.0.0/10` CGNAT range. it does not change when you switch networks. SSH configs and scripts can pin that address.

**MagicDNS.** nodes also get names like `laptop.tailnet-name.ts.net`, or just `laptop` from inside the tailnet. the Tailscale client intercepts DNS for that zone so you never have to remember the 100.x address.

**ACLs.** in a mesh there is no central firewall to sit in the middle of every packet. policy lives on the coordination server and is pushed to every node. each node enforces it on decrypt: if there is no accept rule, the traffic is dropped. the coordination server also simply withholds public keys for peers you should not talk to, so unauthorized machines cannot even start a handshake.

identity here is a person or a tag (`tag:server`, `tag:family`), not "whatever IP this laptop had this morning." that is the part that makes a mesh operationally sane.

**subnet routers and exit nodes** are the escape hatches for incremental adoption. a subnet router advertises a whole LAN (`192.168.1.0/24`) so devices that cannot run Tailscale are still reachable. an exit node is "send all my internet traffic out through that machine," i.e. a more traditional VPN mode. both are optional. the core product is still node-to-node.

## what Tailscale can see

worth being precise, because "it is a VPN company" sounds like they sit on your traffic.

they can see:

- who is in your tailnet
- which devices exist, their public keys, and the endpoints they advertised
- ACL policy you configured
- connection metadata they choose to log (that a session happened, not the bytes inside it)

they cannot see:

- the contents of a direct WireGuard session
- the contents of a DERP-relayed session (still WireGuard end-to-end)

the dependency you are actually taking is control-plane availability. if the coordination server is unreachable, *new* peers and policy updates stall. existing tunnels often keep working from the last map they downloaded. people who want that control plane on their own metal run [Headscale](https://github.com/juanfont/headscale), an open-source coordination server that speaks the same protocol.

## the mental model

if you only remember one picture:

```
identity provider  →  who are you?
coordination server →  here are the public keys, IPs, and rules
each device         →  program WireGuard, punch holes, fall back to DERP
WireGuard           →  actually move the bytes, encrypted, peer to peer
```

Tailscale is not a better WireGuard. WireGuard is already good. Tailscale is the missing control plane: key distribution, identity, NAT traversal, and a relay network so the mesh still works when the internet is being rude.

that is why `tailscale up` on two machines is enough. the hard parts were never encryption. they were finding each other.
