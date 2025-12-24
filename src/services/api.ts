import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ApiResponse,
  PageResponse,
  LoraModel,
  ModelDetailResponse,
  UserResponse,
  GenerateConfig,
  GenerationHistoryResponse,
  GenerationProgressResponse,
  TrainConfig,
  TrainingJobResponse,
  PresignedUrlResponse,
  CommentResponse,
  PromptResponse
} from '../types';

const API_BASE_URL = process.env.API_BASE_URL || 'http://blueming-ai-env.eba-gdfew9bx.ap-northeast-2.elasticbeanstalk.com';

// Axios 인스턴스 생성
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 (토큰 자동 추가)
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터 (토큰 갱신 처리)
apiClient.interceptors.response.use(
  (response) => {
    // 새 토큰이 있으면 저장
    const newToken = response.headers['x-new-access-token'];
    if (newToken) {
      AsyncStorage.setItem('accessToken', newToken);
    }
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 시 로그아웃
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
    }
    return Promise.reject(error);
  }
);

// API 래퍼 함수
async function apiCall<T>(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  data?: any
): Promise<T> {
  try {
    const response = await apiClient({ method, url, data });
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Auth API
export const authAPI = {
  getCurrentUser: () =>
    apiCall<UserResponse>('get', '/api/auth/me'),

  logout: (refreshToken: string) =>
    apiCall('post', '/api/auth/logout', { refreshToken }),
};

// Models API
export const modelsAPI = {
  getPopularModels: (page: number = 0, size: number = 20) =>
    apiCall<PageResponse<LoraModel>>('get', `/api/models/popular?page=${page}&size=${size}`),

  getPublicModels: (page: number = 0, size: number = 20) =>
    apiCall<PageResponse<LoraModel>>('get', `/api/models?page=${page}&size=${size}`),

  getModelDetail: (modelId: number) =>
    apiCall<ModelDetailResponse>('get', `/api/models/${modelId}`),

  getMyModels: (page: number = 0, size: number = 20) =>
    apiCall<PageResponse<LoraModel>>('get', `/api/models/my?page=${page}&size=${size}`),

  toggleLike: (modelId: number) =>
    apiCall('post', `/api/models/${modelId}/like`, {}),
};

// User API
export const userAPI = {
  getMyProfile: () =>
    apiCall<UserResponse>('get', '/api/users/me'),
};

// Generate API
export const generateAPI = {
  generateImage: (config: GenerateConfig) =>
    apiCall<GenerationHistoryResponse>('post', '/api/generate', config),

  getOngoingGeneration: () =>
    apiCall<GenerationHistoryResponse | null>('get', '/api/generate/ongoing'),

  getGenerationProgress: (userId: number, historyId: number) =>
    apiCall<GenerationProgressResponse>('get', `/api/generate/progress/${userId}/${historyId}`),

  getGenerationHistory: (page: number = 0, size: number = 20) =>
    apiCall<PageResponse<GenerationHistoryResponse>>('get', `/api/generate/history?page=${page}&size=${size}`),
};

// Training API
export const trainingAPI = {
  startTraining: (config: TrainConfig) =>
    apiCall<TrainingJobResponse>('post', '/api/training/start', config),

  getMyActiveTrainingJob: () =>
    apiCall<TrainingJobResponse | null>('get', '/api/training/active'),

  deleteTrainingJob: (jobId: number) =>
    apiCall('delete', `/api/training/${jobId}`, {}),

  getTrainingHistory: (page: number = 0, size: number = 20) =>
    apiCall<PageResponse<TrainingJobResponse>>('get', `/api/training/history?page=${page}&size=${size}`),
};

// Upload API
export const uploadAPI = {
  getPresignedUrls: (fileNames: string[]) =>
    apiCall<PresignedUrlResponse[]>('post', '/api/upload/presigned-urls', { fileNames }),

  uploadToS3: async (url: string, file: Blob) => {
    const response = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to upload file to S3');
    }
  },
};

// Community API
export const communityAPI = {
  toggleFavorite: (modelId: number) =>
    apiCall('post', `/api/community/models/${modelId}/favorite`, {}),

  getLikedModels: (page: number = 0, size: number = 20) =>
    apiCall<PageResponse<LoraModel>>('get', `/api/community/liked?page=${page}&size=${size}`),

  getComments: (modelId: number, page: number = 0, size: number = 20) =>
    apiCall<PageResponse<CommentResponse>>('get', `/api/community/models/${modelId}/comments?page=${page}&size=${size}`),

  createComment: (modelId: number, content: string) =>
    apiCall<CommentResponse>('post', `/api/community/models/${modelId}/comments`, { content }),

  deleteComment: (modelId: number, commentId: number) =>
    apiCall('delete', `/api/community/models/${modelId}/comments/${commentId}`, {}),

  toggleCommentLike: (modelId: number, commentId: number) =>
    apiCall('post', `/api/community/models/${modelId}/comments/${commentId}/like`, {}),
};

// Prompts API
export const promptsAPI = {
  createPrompt: (modelId: number, data: { title?: string; promptText: string; negativePrompt?: string }) =>
    apiCall<PromptResponse>('post', `/api/models/${modelId}/prompts`, data),

  updatePrompt: (modelId: number, promptId: number, data: { title?: string; promptText: string; negativePrompt?: string }) =>
    apiCall<PromptResponse>('put', `/api/models/${modelId}/prompts/${promptId}`, data),

  deletePrompt: (modelId: number, promptId: number) =>
    apiCall('delete', `/api/models/${modelId}/prompts/${promptId}`, {}),
};
