export const CFG = {
  id: "1570097060718575728",
  support: "https://discord.gg/q2zhdDX7V9",
  site: "https://kurisu.live/",
}; /* bot application ID, support server invite, website */

/* Developers section. Each person must be in the Lanyard Discord server (discord.gg/lanyard) for live presence.
   id      their Discord user ID (17-20 digits)
   name    optional display name, otherwise their Discord name is used
   role    line shown above the name
   tags    small chips under the name
   banner  optional https image for the card (16:9 works best). Without one, a banner is generated from `accent`
   accent  optional #rrggbb colour for the generated banner
   tagline shown when they have no activity
   Developers can also set Lanyard KV keys `banner`, `accent` and `tagline` from Discord. KV values override the ones here. */
export interface DevConfig {
  id: string;
  name?: string;
  role: string;
  tags: string[];
  accent: string;
  banner: string;
  tagline: string;
}

export const DEVS: DevConfig[] = [
  { id: "1521890728094208122", role: "Developer", tags: [], accent: "#6f86ff", banner: "https://file.garden/am9m147l3hw3nqT1/tfw%20no%20elf%20ears.gif", tagline: "" },
  { id: "1124369205727330346", role: "Developer", tags: [], accent: "#c66fff", banner: "https://file.garden/am9m147l3hw3nqT1/download%20(5).gif", tagline: "" },
  { id: "1441623190412726355", role: "Developer", tags: [], accent: "#3fd0c9", banner: "https://file.garden/am9m147l3hw3nqT1/IMG_8771.gif", tagline: "" },
  { id: "1530686788824469646", role: "Developer", tags: [], accent: "#ff7a9c", banner: "https://file.garden/am9m147l3hw3nqT1/download%20(3).gif", tagline: "" },
  { id: "1538978329082863796", role: "Developer", tags: [], accent: "#8affb0", banner: "https://file.garden/am9m147l3hw3nqT1/ascii-art%20(7).gif", tagline: "" },
];
