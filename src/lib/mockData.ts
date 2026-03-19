import type { Sector } from './types';

export const MOCK_OPERATION_NAME = "OPERATION: DOMESTIC ENTROPY CRISIS";

export const MOCK_SECTORS: Record<string, Sector> = {
  ALPHA: {
    name: "ALPHA: COUNTER CHAOS COMMAND",
    desc: "Kitchen surfaces have become a graveyard of indecision and expired condiments.",
    stage: 1,
    timeEstimate: 12,
    flowImpact: 5,
    psychImpact: 4,
    ergonomicRisk: 3,
    whyItMatters: "Counter clutter triggers constant micro-decisions every time you enter the kitchen. Your cortisol spikes just making coffee. The visual noise alone is costing you 15 minutes of decision fatigue daily.",
    finalAnalysis: "Clear this zone first. It's the psychological epicenter of your domestic failure. Every meal starts and ends here — make it work or keep eating takeout.",
    inventory: [
      { number: "001", label: "Half-empty hot sauce collection (4 bottles)", category: "FOOD_DRINK" },
      { number: "002", label: "Expired multivitamins", category: "PERSONAL_CARE" },
      { number: "003", label: "Charging cable (unknown device)", category: "ELECTRONICS" },
      { number: "004", label: "Stack of unopened mail", category: "MISC" },
      { number: "005", label: "Coffee mug (fossilized residue)", category: "FOOD_DRINK" },
      { number: "006", label: "Loose batteries (mixed sizes)", category: "ELECTRONICS" },
      { number: "007", label: "Paper towel roll (empty)", category: "CLEANING_SUPPLIES" },
      { number: "008", label: "Takeout menus (2019 vintage)", category: "MISC" },
    ],
    targets: [
      { id: "A1", label: "Expired condiment graveyard", tier: 1, why: "Biohazard. Nothing in that fridge door has been relevant since last winter.", trash: 15, loot: 0 },
      { id: "A2", label: "Mystery charging cables", tier: 2, why: "You don't own anything that uses mini-USB anymore. Let go.", trash: 8, loot: 3 },
      { id: "A3", label: "Unopened mail stack", tier: 1, why: "Anxiety in paper form. Every day you ignore it, it grows stronger.", trash: 12, loot: 2 },
    ],
  },
  BRAVO: {
    name: "BRAVO: TEXTILE DISASTER ZONE",
    desc: "The chair has become a wardrobe. The floor has become a closet.",
    stage: 2,
    timeEstimate: 18,
    flowImpact: 4,
    psychImpact: 5,
    ergonomicRisk: 4,
    whyItMatters: "Clothing piles create a visual weight that makes the entire room feel smaller. Your brain processes every visible item — that's 47 micro-decisions before you even get dressed. The ergonomic risk of stepping over fabric obstacles is non-trivial.",
    finalAnalysis: "This zone is a psychological anchor dragging down your entire morning routine. Every minute spent here saves three minutes of daily frustration. Sort it or drown in it.",
    inventory: [
      { number: "001", label: "Jeans (questionable cleanliness)", category: "TEXTILES" },
      { number: "002", label: "Hoodie pile (3 deep)", category: "TEXTILES" },
      { number: "003", label: "Single sock (partner MIA)", category: "TEXTILES" },
      { number: "004", label: "Gym bag (last used: unknown)", category: "TEXTILES" },
      { number: "005", label: "Towel (floor-mounted)", category: "TEXTILES" },
      { number: "006", label: "Dress shirt (wrinkled beyond recognition)", category: "TEXTILES" },
    ],
    targets: [
      { id: "B1", label: "The Chair Wardrobe", tier: 1, why: "That chair hasn't been sat in since you moved in. It's furniture cosplaying as a laundry basket.", trash: 5, loot: 8 },
      { id: "B2", label: "Floor textile layer", tier: 1, why: "Tripping hazard and dignity hazard simultaneously.", trash: 10, loot: 5 },
      { id: "B3", label: "Orphaned socks", tier: 3, why: "Accept the loss. Their partners aren't coming back.", trash: 8, loot: 0 },
    ],
  },
  CHARLIE: {
    name: "CHARLIE: CABLE SPAGHETTI SECTOR",
    desc: "Behind the desk lies a tangled ecosystem of deprecated connectivity.",
    stage: 3,
    timeEstimate: 15,
    flowImpact: 3,
    psychImpact: 3,
    ergonomicRisk: 5,
    whyItMatters: "Cable chaos behind desks is an ergonomic nightmare — every time you crawl back there you risk strain. The dust accumulation is actively degrading your air quality. The visual chaos bleeds into your peripheral vision during work.",
    finalAnalysis: "This is a fire hazard cosplaying as a workstation. Route, bundle, or eliminate. Your future self will thank you when something actually needs unplugging.",
    inventory: [
      { number: "001", label: "Power strip (overloaded)", category: "ELECTRONICS" },
      { number: "002", label: "HDMI cable (to nothing)", category: "ELECTRONICS" },
      { number: "003", label: "Phone charger (frayed)", category: "ELECTRONICS" },
      { number: "004", label: "Ethernet cable (wifi exists)", category: "ELECTRONICS" },
      { number: "005", label: "USB hub (3 of 4 ports dead)", category: "ELECTRONICS" },
      { number: "006", label: "Dust bunny colony", category: "MISC" },
    ],
    targets: [
      { id: "C1", label: "Dead USB hub", tier: 2, why: "75% failure rate. That's not a hub, that's a monument to denial.", trash: 10, loot: 2 },
      { id: "C2", label: "Cable nest behind desk", tier: 1, why: "Fire marshal would have opinions about this configuration.", trash: 5, loot: 3 },
      { id: "C3", label: "Frayed phone charger", tier: 1, why: "Electrocution is not a productivity hack.", trash: 12, loot: 0 },
    ],
  },
  DELTA: {
    name: "DELTA: PAPER TRAIL APOCALYPSE",
    desc: "A desk buried under sedimentary layers of procrastination.",
    stage: 4,
    timeEstimate: 10,
    flowImpact: 4,
    psychImpact: 4,
    ergonomicRisk: 2,
    whyItMatters: "Paper clutter is pure visual cortisol. Each visible document represents an unfinished task your brain tracks unconsciously. Studies show desk clutter reduces focus by up to 40%. Your workspace is literally making you less effective.",
    finalAnalysis: "This desk is an archaeological dig of abandoned intentions. Sort it in one pass — keep, scan, or kill. Every paper you eliminate is a micro-weight off your cognitive load.",
    inventory: [
      { number: "001", label: "Tax documents (2022)", category: "MISC" },
      { number: "002", label: "Sticky notes (illegible)", category: "MISC" },
      { number: "003", label: "Receipts (faded)", category: "MISC" },
      { number: "004", label: "Business cards (whose?)", category: "MISC" },
      { number: "005", label: "Notebook (3 pages used)", category: "MISC" },
    ],
    targets: [
      { id: "D1", label: "Receipt archaeology layer", tier: 2, why: "If you haven't filed it in 6 months, it's not getting filed.", trash: 15, loot: 0 },
      { id: "D2", label: "Sticky note graveyard", tier: 3, why: "None of these reminders are still relevant. Not one.", trash: 8, loot: 0 },
      { id: "D3", label: "Mystery business cards", tier: 3, why: "You don't remember these people. They don't remember you. Mutual peace.", trash: 5, loot: 0 },
    ],
  },
};

export const MOCK_SECTOR_ORDER = ["ALPHA", "BRAVO", "CHARLIE", "DELTA"];

export const LOADING_LINES = [
  "Assessing the damage...",
  "Questioning your life choices...",
  "Counting every single item. Yes, all of them...",
  "Identifying zones of maximum chaos...",
  "Cross-referencing all angles...",
  "Calculating how long this took to get this bad...",
  "Mapping ergonomic hazards and moral failures...",
  "Running feng shui violation analysis...",
  "Assigning psychological impact scores...",
  "Detecting items that spark zero joy...",
  "Building full inventory manifest...",
  "Generating hostile sector designations...",
  "Arming target manifest...",
  "Almost done. Not impressed so far.",
  "Finalizing operation parameters...",
];

export const BOOT_MESSAGES = [
  "Identify yourself. The chaos already knows you're here.",
  "Enter your name. Your room has been waiting. Not patiently.",
  "The OS needs a name. Your stuff needs a miracle. One thing at a time.",
  "Who are you and why does it look like this.",
  "Enter your callsign. Something heroic. You're going to need it.",
  "State your identity before the mess files a missing person report.",
  "Name. Now. The entropy isn't going to organize itself.",
];
