// ========== WORKOUT STATIONS (Fixed) ==========
// The 8 workout stations - order matters, index 0-7 maps to station 1-8
export const WORKOUT_STATIONS = [
  { title: "SkiErg", titleZh: "滑雪機", icon: "Wind", metric: "1000m" },
  {
    title: "Sled Push",
    titleZh: "推雪橇",
    icon: "ArrowUpFromLine",
    metric: "2x25m",
  },
  {
    title: "Sled Pull",
    titleZh: "拉雪橇",
    icon: "ArrowDownToLine",
    metric: "2x25m",
  },
  {
    title: "Burpee Broad Jumps",
    titleZh: "波比跳",
    icon: "Activity",
    metric: "80m",
  },
  { title: "Rowing", titleZh: "划船機", icon: "Waves", metric: "1000m" },
  {
    title: "Farmers Carry",
    titleZh: "農夫走路",
    icon: "Dumbbell",
    metric: "200m",
  },
  {
    title: "Sandbag Lunges",
    titleZh: "沙袋弓步",
    icon: "GalleryVerticalEnd",
    metric: "100m",
  },
  { title: "Wall Balls", titleZh: "藥球", icon: "Target", metric: "100 Reps" },
] as const;

// ========== RACE CATEGORIES ==========
// Structure for dropdown menu
export const RACE_CATEGORIES = [
  { group: "Individual", items: ["Women", "Women Pro", "Men", "Men Pro"] },
  {
    group: "Doubles",
    items: ["Doubles Women", "Doubles Men", "Doubles Mixed"],
  },
  { group: "Relay", items: ["Relay Women", "Relay Men", "Relay Mixed"] },
] as const;

// Default category
export const DEFAULT_CATEGORY = "Relay Mixed";

// ========== WEIGHT STANDARDS ==========
// Array of 8 weights per category (index 0-7 = station 1-8)
// Order: SkiErg, Sled Push, Sled Pull, Burpee BJ, Rowing, Farmers Carry, Sandbag Lunges, Wall Balls
export const CATEGORY_WEIGHTS: Record<string, string[]> = {
  // Individual
  Women: ["", "102 kg", "78 kg", "", "", "2x16 kg", "10 kg", "4 kg"],
  "Women Pro": ["", "152 kg", "103 kg", "", "", "2x24 kg", "20 kg", "6 kg"],
  Men: ["", "152 kg", "103 kg", "", "", "2x24 kg", "20 kg", "6 kg"],
  "Men Pro": ["", "202 kg", "153 kg", "", "", "2x32 kg", "30 kg", "9 kg"],
  // Doubles
  "Doubles Women": ["", "102 kg", "78 kg", "", "", "2x16 kg", "10 kg", "4 kg"],
  "Doubles Men": ["", "152 kg", "103 kg", "", "", "2x24 kg", "20 kg", "6 kg"],
  "Doubles Mixed": [
    "",
    "102/152 kg",
    "78/103 kg",
    "",
    "",
    "2x16/2x24 kg",
    "10/20 kg",
    "4/6 kg",
  ],
  // Relay
  "Relay Women": ["", "102 kg", "78 kg", "", "", "2x16 kg", "10 kg", "4 kg"],
  "Relay Men": ["", "152 kg", "103 kg", "", "", "2x24 kg", "20 kg", "6 kg"],
  "Relay Mixed": [
    "",
    "102/152 kg",
    "78/103 kg",
    "",
    "",
    "2x16/2x24 kg",
    "10/20 kg",
    "4/6 kg",
  ],
};
