export type MediaType = 'video' | 'image' | 'gif';

export type Rating = 's' | 'q' | 'e';

export interface FeedTags {
  all: string[];
  general?: string[];
  artist?: string[];
  character?: string[];
  copyright?: string[];
  meta?: string[];
}

export interface FeedItem {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  type: MediaType;
  mediaUrl: string;
  previewUrl: string;
  tags: FeedTags;
  score: number;
  rating: Rating;
  width?: number;
  height?: number;
  aspectRatio?: number;
  author?: string;
  isFavoritedSalt?: boolean;
  saltedTag?: string;
}

export interface SourceOption {
  id: string;
  name: string;
  icon: string;
  supportsAutocomplete: boolean;
}

export interface TagScopeSettings {
  global: string[];
  bySource: Record<string, string[]>;
}

export type FavoriteSaltingPattern = 'jitter' | '1in3' | '1in5' | 'off';

export interface UserPreferences {
  defaultVolume: number;
  mutedByDefault: boolean;
  fitMode: 'contain' | 'cover';
  activeSources: string[];
  ratingFilter: 'all' | 'questionable' | 'explicit';
  favoriteSaltingPattern: FavoriteSaltingPattern;
  port: number;
  customServerUrl?: string;
}

export interface AppSettings {
  blacklist: TagScopeSettings;
  favoriteTags: TagScopeSettings;
  preferences: UserPreferences;
  credentials: {
    rule34?: { userId?: string; apiKey?: string };
    gelbooru?: { userId?: string; apiKey?: string };
    e621?: { username?: string; apiKey?: string };
    danbooru?: { username?: string; apiKey?: string };
  };
}

export interface ToastMessage {
  id: string;
  text: string;
  actionText?: string;
  onAction?: () => void;
  duration?: number;
}
