// User Types
export interface UserResponse {
  id: number;
  email: string;
  nickname?: string;
  profileImageUrl?: string;
  createdAt: string;
}

// Model Types
export interface LoraModel {
  id: number;
  userId: number;
  userNickname?: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  characterName?: string;
  style?: string;
  trainingImagesCount: number;
  baseModel: string;
  isPublic: boolean;
  status: 'PENDING' | 'TRAINING' | 'COMPLETED' | 'FAILED';
  s3Key?: string;
  viewCount: number;
  likeCount: number;
  favoriteCount: number;
  isLiked?: boolean;
  isFavorited?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ModelSample {
  id: number;
  imageUrl: string;
  displayOrder: number;
  isPrimary: boolean;
  createdAt: string;
}

export interface PromptResponse {
  id: number;
  modelId: number;
  title?: string;
  promptText: string;
  negativePrompt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TagResponse {
  id: number;
  name: string;
  category?: 'CHARACTER' | 'STYLE' | 'GENRE' | 'OTHER';
  usageCount?: number;
}

export interface ModelDetailResponse extends LoraModel {
  samples: ModelSample[];
  prompts: PromptResponse[];
  tags: TagResponse[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// Navigation Types
export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  ModelDetail: { modelId: number };
};

export type MainTabParamList = {
  Home: undefined;
  Training: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  ModelList: undefined;
  ModelDetail: { modelId: number };
  ModelCreate: undefined;
};
