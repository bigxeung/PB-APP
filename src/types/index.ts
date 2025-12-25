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
  description?: string;
  prompt: string;
  negativePrompt?: string;
  displayOrder?: number;
  createdAt: string;
  updatedAt?: string;
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

// Generation Types
export interface GenerateConfig {
  modelId: number;
  prompt: string;
  negativePrompt?: string;
  steps?: number;
  guidanceScale?: number;
  loraScale?: number;
  numImages?: number;
  seed?: number;
}

export interface GeneratedImageResponse {
  id: number;
  s3Url: string;
  s3Key: string;
  displayOrder: number;
  isSample: boolean;
}

export interface GenerationHistoryResponse {
  id: number;
  modelId: number;
  modelTitle: string;
  userId: number;
  prompt: string;
  negativePrompt?: string;
  steps?: number;
  guidanceScale?: number;
  loraScale?: number;
  seed?: number;
  numImages: number;
  status: 'GENERATING' | 'SUCCESS' | 'FAILED';
  currentStep?: number;
  totalSteps?: number;
  errorMessage?: string;
  generatedImages: GeneratedImageResponse[];
  createdAt: string;
}

export interface GenerationProgressResponse {
  status: 'IN_PROGRESS' | 'SUCCESS' | 'FAILED';
  current_step?: number;
  total_steps?: number;
  message?: string;
  image_urls?: string[];
  error?: string;
  historyId?: number;
  modelId?: number;
  userId?: number;
  generatedImages?: GeneratedImageResponse[];
}

// Training Types
export interface TrainConfig {
  title: string;
  description?: string;
  triggerWord?: string;
  epochs?: number;
  learningRate?: number;
  loraRank?: number;
  baseModel?: string;
  isPublic?: boolean;
  skipPreprocessing?: boolean;
  imageKeys: string[];
}

export interface TrainingJobResponse {
  id: number;
  modelId: number;
  userId: number;
  status: string;
  currentEpoch: number;
  totalEpochs: number;
  phase: string;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  modelName: string;
  modelDescription?: string;
  trainingImagesCount: number;
  epochs: number;
  learningRate: number;
  loraRank: number;
  baseModel: string;
  triggerWord?: string;
  modelThumbnailUrl?: string;
  progressPercentage?: number;
}

// Upload Types
export interface PresignedUrlResponse {
  fileName: string;
  uploadUrl: string;
  s3Key: string;
}

// Comment Types
export interface CommentResponse {
  id: number;
  modelId: number;
  userId: number;
  userNickname: string;
  userProfileImageUrl: string;
  content: string;
  likeCount: number;
  isLiked: boolean;
  createdAt: string;
  replies?: CommentResponse[];
}
