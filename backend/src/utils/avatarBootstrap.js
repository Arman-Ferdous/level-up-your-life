import { Avatar } from "../models/Avatar.js";

const DEFAULT_AVATARS = [
  // Fruits - Common (5 points)
  { key: "banana", name: "Banana", emoji: "🍌", cost: 5, category: "fruit", rarity: "common", description: "A cheerful banana avatar" },
  { key: "apple", name: "Apple", emoji: "🍎", cost: 5, category: "fruit", rarity: "common", description: "A crisp red apple" },
  { key: "lemon", name: "Lemon", emoji: "🍋", cost: 5, category: "fruit", rarity: "common", description: "A tangy yellow lemon" },
  { key: "mango", name: "Mango", emoji: "🥭", cost: 5, category: "fruit", rarity: "common", description: "A tropical mango" },
  
  // Flowers - Common (5 points)
  { key: "sunflower", name: "Sunflower", emoji: "🌻", cost: 5, category: "flower", rarity: "common", description: "A bright sunflower" },
  { key: "rose", name: "Rose", emoji: "🌹", cost: 5, category: "flower", rarity: "common", description: "A beautiful rose" },
  { key: "tulip", name: "Tulip", emoji: "🌷", cost: 5, category: "flower", rarity: "common", description: "A lovely tulip" },
  { key: "blossom", name: "Cherry Blossom", emoji: "🌸", cost: 5, category: "flower", rarity: "common", description: "Delicate cherry blossom" },
  
  // Dolls - Rare (15 points)
  { key: "doll_pink", name: "Pink Doll", emoji: "🪆", cost: 15, category: "doll", rarity: "rare", description: "An adorable pink doll" },
  { key: "robot", name: "Robot", emoji: "🤖", cost: 15, category: "doll", rarity: "rare", description: "A cute robot companion" },
  { key: "alien", name: "Alien", emoji: "👽", cost: 15, category: "doll", rarity: "rare", description: "A friendly alien" },
  
  // Cars - Epic (20-30 points)
  { key: "race_car", name: "Race Car", emoji: "🏎️", cost: 20, category: "car", rarity: "epic", description: "A sleek red race car" },
  { key: "police_car", name: "Police Car", emoji: "🚓", cost: 20, category: "car", rarity: "epic", description: "A police patrol car" },
  { key: "taxi", name: "Yellow Taxi", emoji: "🚕", cost: 20, category: "car", rarity: "epic", description: "A classic yellow taxi" },
  { key: "rocket", name: "Rocket", emoji: "🚀", cost: 30, category: "car", rarity: "legendary", description: "A powerful rocket ship" },
];

export async function ensureDefaultAvatars() {
  try {
    const count = await Avatar.countDocuments();
    if (count === 0) {
      await Avatar.insertMany(DEFAULT_AVATARS);
      console.log(`✓ Seeded ${DEFAULT_AVATARS.length} default avatars`);
    }
  } catch (error) {
    console.error("Error seeding avatars:", error.message);
  }
}
