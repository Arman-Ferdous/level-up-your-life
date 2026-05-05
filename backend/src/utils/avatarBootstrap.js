import { Avatar } from "../models/Avatar.js";

const DEFAULT_AVATARS = [
  // Fruits - Common (5 points)
  {
    key: "banana",
    name: "Banana",
    emoji: "🍌",
    cost: 5,
    category: "fruit",
    rarity: "common",
    description: "A cheerful banana avatar",
  },
  {
    key: "apple",
    name: "Apple",
    emoji: "🍎",
    cost: 5,
    category: "fruit",
    rarity: "common",
    description: "A crisp red apple",
  },
  {
    key: "lemon",
    name: "Lemon",
    emoji: "🍋",
    cost: 5,
    category: "fruit",
    rarity: "common",
    description: "A tangy yellow lemon",
  },
  {
    key: "mango",
    name: "Mango",
    emoji: "🥭",
    cost: 5,
    category: "fruit",
    rarity: "common",
    description: "A tropical mango",
  },

  // Flowers - Common (5 points)
  {
    key: "sunflower",
    name: "Sunflower",
    emoji: "🌻",
    cost: 5,
    category: "flower",
    rarity: "common",
    description: "A bright sunflower",
  },
  {
    key: "rose",
    name: "Rose",
    emoji: "🌹",
    cost: 5,
    category: "flower",
    rarity: "common",
    description: "A beautiful rose",
  },
  {
    key: "tulip",
    name: "Tulip",
    emoji: "🌷",
    cost: 5,
    category: "flower",
    rarity: "common",
    description: "A lovely tulip",
  },
  {
    key: "blossom",
    name: "Cherry Blossom",
    emoji: "🌸",
    cost: 5,
    category: "flower",
    rarity: "common",
    description: "Delicate cherry blossom",
  },

  // Dolls - Rare (15 points) - Premium Only
  {
    key: "doll_pink",
    name: "Pink Doll",
    emoji: "🪆",
    cost: 15,
    category: "doll",
    rarity: "rare",
    isPremiumOnly: true,
    description: "An adorable pink doll",
  },
  {
    key: "robot",
    name: "Robot",
    emoji: "🤖",
    cost: 15,
    category: "doll",
    rarity: "rare",
    isPremiumOnly: true,
    description: "A cute robot companion",
  },
  {
    key: "alien",
    name: "Alien",
    emoji: "👽",
    cost: 15,
    category: "doll",
    rarity: "rare",
    isPremiumOnly: true,
    description: "A friendly alien",
  },

  // Cars - Epic (20-30 points) - Premium Only
  {
    key: "race_car",
    name: "Race Car",
    emoji: "🏎️",
    cost: 20,
    category: "car",
    rarity: "epic",
    isPremiumOnly: true,
    description: "A sleek red race car",
  },
  {
    key: "police_car",
    name: "Police Car",
    emoji: "🚓",
    cost: 20,
    category: "car",
    rarity: "epic",
    isPremiumOnly: true,
    description: "A police patrol car",
  },
  {
    key: "taxi",
    name: "Yellow Taxi",
    emoji: "🚕",
    cost: 20,
    category: "car",
    rarity: "epic",
    isPremiumOnly: true,
    description: "A classic yellow taxi",
  },
  {
    key: "rocket",
    name: "Rocket",
    emoji: "🚀",
    cost: 30,
    category: "car",
    rarity: "legendary",
    isPremiumOnly: true,
    description: "A powerful rocket ship",
  },
];

export async function ensureDefaultAvatars() {
  try {
    const count = await Avatar.countDocuments();
    if (count === 0) {
      await Avatar.insertMany(DEFAULT_AVATARS);
      console.log(`✓ Seeded ${DEFAULT_AVATARS.length} default avatars`);
    } else {
      // Patch existing avatars to ensure isPremiumOnly is up to date
      for (const avatar of DEFAULT_AVATARS) {
        await Avatar.updateOne(
          { key: avatar.key },
          { $set: { isPremiumOnly: avatar.isPremiumOnly ?? false } },
        );
      }
      console.log("✓ Patched isPremiumOnly flags on existing avatars");
    }
  } catch (error) {
    console.error("Error seeding avatars:", error.message);
  }
}
