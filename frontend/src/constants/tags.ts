export interface TagItem {
  id: string;
  label: string;
  group: 'Archetype' | 'Romance & Tropes' | 'Personality' | 'Genre';
}

export const MASTER_TAGS: TagItem[] = [
  // ─── ARCHETYPES & ROLES (High Indian Search Volume) ───
  { id: 'girlfriend', label: 'Girlfriend', group: 'Archetype' },
  { id: 'boyfriend', label: 'Boyfriend', group: 'Archetype' },
  { id: 'roommate', label: 'Desi Roommate', group: 'Archetype' },
  { id: 'bestie', label: 'Childhood Bestie', group: 'Archetype' },
  { id: 'college', label: 'College Senior', group: 'Archetype' },
  { id: 'boss', label: 'Dominant Boss', group: 'Archetype' },
  { id: 'bhabhi', label: 'Friendly Bhabhi', group: 'Archetype' },
  { id: 'neighbor', label: 'Next-Door Neighbor', group: 'Archetype' },
  { id: 'crush', label: 'Secret Crush', group: 'Archetype' },

  // ─── ROMANCE & STORY TROPES ───
  { id: 'romance', label: 'Romance & Flirting', group: 'Romance & Tropes' },
  { id: 'latenight', label: 'Late Night Pillow Talk', group: 'Romance & Tropes' },
  { id: 'arranged_marriage', label: 'Arranged Marriage', group: 'Romance & Tropes' },
  { id: 'enemies_to_lovers', label: 'Enemies to Lovers', group: 'Romance & Tropes' },
  { id: 'unfiltered', label: 'Uncensored 18+', group: 'Romance & Tropes' },
  { id: 'comfort', label: 'Emotional Comfort', group: 'Romance & Tropes' },
  { id: 'drama', label: 'Desi Drama', group: 'Romance & Tropes' },

  // ─── PERSONALITY & TRAITS ───
  { id: 'possessive', label: 'Possessive & Protective', group: 'Personality' },
  { id: 'shy', label: 'Shy & Innocent', group: 'Personality' },
  { id: 'teasing', label: 'Playful & Teasing', group: 'Personality' },
  { id: 'dominant', label: 'Dominant', group: 'Personality' },
  { id: 'caring', label: 'Sweet & Caring', group: 'Personality' },
  { id: 'tsundere', label: 'Tsundere (Nakhrewali)', group: 'Personality' },
  { id: 'mysterious', label: 'Mysterious & Cold', group: 'Personality' },

  // ─── GENRES & THEMES ───
  { id: 'realistic', label: 'Realistic / Modern India', group: 'Genre' },
  { id: 'bollywood', label: 'Bollywood Vibes', group: 'Genre' },
  { id: 'anime', label: 'Anime Style', group: 'Genre' },
  { id: 'fantasy', label: 'Fantasy & Royalty', group: 'Genre' },
  { id: 'supernatural', label: 'Supernatural / Vampire', group: 'Genre' },
];