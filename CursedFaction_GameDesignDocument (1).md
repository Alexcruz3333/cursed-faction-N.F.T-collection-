# Cursed Faction — Open‑World PvP MMO (GTA‑style)

## 1) High Concept

A fast, gritty, supernatural open‑world MMO set in a neo‑occult metropolis where rival Factions battle for territory, resources, and prestige. Real‑time PvP, seamless co‑op heists, vehicle combat, and vertical exploration. The **Cursed Faction NFT collection (6,666)** is deeply integrated as identity, cosmetics, and progression unlocks—carefully balanced to avoid pay‑to‑win.

**Player Fantasy:** Be a faction operative—street sorcerer, cursed merc, technomancer—carving a legend through bounties, heists, turf wars, and ranked arenas across a living city.

**Core Pillars**

* **Open‑World Chaos:** Dense, GTA‑like sandbox with vehicles, pursuits, police/sentinel response, emergent events.
* **Skillful PvP:** Shooter‑melee hybrid with abilities; time‑to‑kill tuned for counterplay and team tactics.
* **Faction Metagame:** Territory control, seasonal map shifts, faction tech trees.
* **Ethical Web3:** Ownership without power creep; optional custody; rentals; crafting; marketplace with strong anti‑cheat and duping protections.

---

## 2) World, Lore & Map

**City:** *Nocturna Prime*—five districts stitched atop leyline fractures. Weather and day/night shift patrols, spawn tables, occult anomalies.

**Districts (MVP focus: 1+Hub)**

1. **Ashen Ward (Hub/MVP):** Industrial docks, smuggling routes, shoot‑houses, arena.
2. **Ebon Heights:** Corporate spires, rooftops/zip‑lines, high‑value hits.
3. **Gallows Market:** Bazaar and black‑ops alleyways; contraband mini‑games.
4. **Iron Reliquary:** Cathedral‑ruins, crypts, occult bosses (PvEvP).
5. **Neon Mire:** Toxic wetlands, hover‑rafts, ambush combat.

**Factions** (tie to NFT lore): **Gravemind Syndicate, Hex Assembly, Chrome Covenant, Wraith Court**. Each offers talent tree, cosmetics, contracts.

---

## 3) Core Gameplay Loop

1. **Free‑Roam PvP:** Contracts, bounties, dynamic events, territory skirmishes (10‑40 players per shard).
2. **Heists (Instanced PvEvP):** 4–6 players infiltrate vaults; other crews can invade or intercept on extraction.
3. **Faction Wars (Timed):** District control windows (30–60 min), capture nodes, deployables, vehicles.
4. **Ranked Arenas (Best‑of‑5):** Tight maps for pure skill; strict gear normalization.
5. **Bounties & Manhunts:** Notoriety increases payouts and city response.

**Progression**

* **Account Level** → unlocks baseline perks, blueprints.
* **Role Specs** (choose 1 primary, 1 secondary): *Vanguard, Shade, Augur, Mechanist*.
* **Skill Trees:** Small, meaningful nodes; respec cost in soft currency.

---

## 4) Combat, Weapons, Armor, Attributes

**Attributes (0–100, soft‑cap 80):**

* **Might** (melee dmg/carry), **Celerity** (sprint/ADS/parkour), **Focus** (recoil/crit), **Aether** (abilities/wards), **Resolve** (HP/stagger).

**Derived Stats** (examples):

* Weapon Handling = 50 + 0.6×Focus + 0.3×Celerity
* Ability Power = 50 + 0.8×Aether
* Effective HP = BaseHP × (1 + 0.004×Resolve)

**Weapon Classes:** Pistols, SMGs, ARs, BRs, Shotguns, LMGs, Snipers, Melee (blades/hammers/chains), Throwables, Sigils (occult ranged).

**Armor Styles:** *Reliquary (warded), Runic (balanced), Grafted (tech), Wraithweave (mobility)*—each with 2–3 set bonuses.

**Vehicles:** Bikes, muscle cars, vans, armored sedans, hover‑rafts (district‑specific). Light weapon hard‑points and ramming physics.

---

## 5) NFT Integration (Balanced, Optional)

**Philosophy:** No raw stat dominance. NFTs grant **identity, cosmetics, loadout expression, and side‑grade utility** within capped brackets.

**Types & Roles**

1. **Cursed Avatars (ERC‑721):**

   * Identity, custom animations, voice filters.
   * **Trait‑gated quests** and **lore drops**.
   * **Bracketed Side‑grades:** e.g., +2% parkour stamina (capped; normalized in Ranked).
2. **Gear & Styles (ERC‑1155):**

   * Weapon/armor skins with *style modifiers* (cosmetic FX, inspect rituals).
   * Craftable variants; upgrade via burn‑to‑evolve.
3. **Artifacts (ERC‑721 / Soulbound on equip):**

   * Time‑boxed powers (e.g., 3 heist runs/day): extra extraction route, temporary ward, respawn token in PvE sections; **disabled in Ranked**.
4. **Token‑Bound Loadouts (ERC‑6551):**

   * Each Avatar can own a **Loadout Account** that holds its gear, currency escrow, and crafting slots.
5. **Rentals (ERC‑4907):** Built‑in lending for tournaments or trials.

**Dynamic Traits & Seasons**

* On‑chain trait seeds stored; **off‑chain Oracles** expand for seasonal events (e.g., eclipse buff week).
* **Seasonal Sagas:** Top factions unlock city alterations (new roaming bosses, map mutations).

**Matchmaking Fairness**

* **Three Ladders:**

  * **Ranked Normalized:** all NFTs cosmetic‑only.
  * **Open Division:** capped side‑grades (sum of bonuses ≤ 5%).
  * **Vanilla Queue:** no NFTs loaded.

---

## 6) Economy & Live‑Ops

**Currencies**

* **Soft:** *Marks* (earn in‑game; sinks: crafting, respecs, fast‑travel).
* **Hard:** *Crowns* (purchased; cosmetic bundles, name changes). No gacha gambling.
* **On‑Chain:** NFTs only at launch; **no fungible token to avoid regulatory risk**. Future governance token possible via separate compliance track.

**Marketplace**

* In‑client listings for ERC‑721/1155; royalties via platform enforcement.
* **Crafting:** Combine 3 skins + reagents → evolved variant; chain proof stored (hash).
* **Duping Safe:** Deterministic mint IDs; server‑authoritative inventory; delayed settlement with Merkle proofs.

**Anti‑P2W Controls**

* Stat caps, Ranked normalization, and side‑grade ceilings.
* Visibility: all item bonuses public and audit‑logged.

---

## 7) Tech Stack & Architecture

**Engine:** Unreal Engine 5 (Nanite/Lumen, Chaos vehicles), GAS for abilities.

**Networking**

* **Authoritative Dedicated Servers** (Linux) on Kubernetes/Gamelift.
* 30–60Hz tick; interest management & world partition streaming.
* Hit‑scan reconciliation, client prediction & server rewind.
* **Shard Size:** 32–40 players per city slice (MVP), dynamic instancing per district; seamless fast‑travel between shards via portals.

**Services** (microservices + message bus)

* **Matchmaking & Session** (Elo+MMR; queues for Ranked/Open/Vanilla).
* **Inventory & Crafting** (server‑auth, rollback journal).
* **Economy** (prices, sinks, telemetry balancing).
* **Wallet & Web3** (custodial by default with export; supports Privy/Web3Auth; chains: **Base** or **Polygon** L2 for low fees).
* **NFT Indexer** (The Graph/substreams), **Oracle** (Chainlink/Redstone) for seasonal toggles.
* **Anti‑Cheat** (EAC/BattlEye) + server heuristics.
* **Telemetry** (OpenTelemetry + BigQuery/Snowflake) → Live‑ops dashboards.

**Data**

* **DBs:** Postgres (accounts, progress), Redis (sessions), S3/CDN (patches), IPFS/Arweave (NFT art/animations + trait json).

**Security**

* Deterministic, server‑side damage; encrypted traffic; rate limiting; secure enclaves for drop tables.
* Contract upgradable via timelock + multi‑sig; audit pipeline.

---

## 8) Smart Contract Suite (Outline)

**Standards:** ERC‑721, ERC‑1155, ERC‑4907, ERC‑6551, EIP‑2981 (royalties).

**Contracts**

* `CursedAvatar721` — core avatar mint; immutable art baseURI; trait hash in `extraData`.
* `CursedGear1155` — gear skins/styles; mint/burn/evolve.
* `Artifact721` — limited‑charge items; soulbind on first equip (non‑transferable flag while charged).
* `LoadoutTBA` — Token‑Bound Accounts for per‑avatar inventory.
* `Rental4907` — time‑boxed user assignments.
* `CraftingStation` — burns + mint logic; Merkle recipes; server oracle signs crafting tickets.
* `SeasonPass721` — optional; grants seasonal track & saga votes.

**Example Interfaces (pseudocode)**

```solidity
interface ICursedAvatar721 {
  function traits(uint256 tokenId) external view returns (bytes32 seed, uint8 faction, uint8 rarity);
  function bindLoadout(uint256 tokenId, address tba) external;
}

interface ICursedGear1155 {
  function evolve(uint256[] ids, uint256[] amounts, bytes calldata sig) external returns (uint256 newId);
}

interface IArtifact721 {
  function charges(uint256 id) external view returns (uint8);
  function consume(uint256 id, uint8 amount) external; // disables transfer >0
}
```

---

## 9) Game Modes (MVP + Beyond)

* **Free‑Roam Contracts:** Escort, Hack & Hold, Relic Hunt, Courier Intercept.
* **Heists (4–6 players):** Recon → Infiltration → Vault → Extraction; optional PvP invasion.
* **Faction War Windows:** Region capture, deployables (wards, barricades, turrets).
* **Ranked Arenas:** 3v3/5v5 Elimination and Control; strict normalization.
* **Bounties/Manhunts:** Player becomes target; escalating rewards and city AI response.

---

## 10) Progression & Balance

**Item Power Bands:**

* Tiers T1–T5 with narrow stat deltas (e.g., +0–5%).
* Diminishing returns past soft‑cap; normalization in competitive modes.

**Crafting & Mods:**

* Runes (ability augments), Sigils (visual trails), Relic Sockets (situational bonuses).
* Durability only on artifacts (recharges daily); no permanent breakage.

**Seasonal Reset:**

* Map state and faction tech partially reset; cosmetics permanent; competitive rank soft reset.

---

## 11) Content Pipeline

* **Art Direction:** “Occult industrial”: hex sigils, rune graffiti, neon + tarnished metal, cloth + bone + chrome.
* **Tools:** UE5 + Blender + Substance; Houdini for destruction; Wwise audio.
* **Validation:** Triangle budgets per LOD; motion matching for melee; IK for parkour.

---

## 12) Server Rules, Moderation, Community

* **Code of Conduct & Reporting** in‑client; penalty tiers; appeal system.
* **Voice/Chat Filters** with on‑device toxicity models.
* **Custom Servers (later):** Mod kits for cosmetic maps only.

---

## 13) Compliance & Risk

* **No loot boxes.** Clear odds on drops; region‑specific compliance.
* **Privacy:** GDPR/CCPA; minimal data; wallet exportable.
* **Age Rating Target:** M/18+ (violence, mild occult themes).

---

## 14) MVP Scope (First Playable → Closed Alpha)

**Target:** 12–15 months to Closed Alpha.

**Content**

* 1 Hub + **Ashen Ward** district (2.5–3 km² playable).
* 32‑player shards; basic police/sentinel AI.
* 10 weapons, 20 armor sets, 12 abilities, 8 vehicles.
* Free‑Roam + 1 Heist + 1 Ranked map + Bounty system.
* Web3: Avatar import, style skins, rentals, custodial wallet; in‑client marketplace.

**Metrics of Success**

* DAU 5–10k (alpha), 10‑min session retention > 50%, > 30% squad formation.

---

## 15) Roadmap & Milestones

**M0–M2: Pre‑prod** — Team hire, greybox movement/combat; contract scaffolds. **M3–M5: Core** — Vehicle + shooting + abilities; Ashen Ward blockout; dedicated servers online. \*
```