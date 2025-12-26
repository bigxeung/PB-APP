import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL as ENV_API_BASE_URL } from '@env';
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

// Fallback URL if env variable is not loaded
const API_BASE_URL = ENV_API_BASE_URL || 'https://d3ka730j70ocy8.cloudfront.net';

// Axios 인스턴스 생성
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 디버깅용 로그
console.log('🌐 API Client initialized with baseURL:', API_BASE_URL);
console.log('🔍 ENV_API_BASE_URL from @env:', ENV_API_BASE_URL);

// 간단한 메모리 캐시
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 5 * 60 * 1000; // 5분

function getCacheKey(method: string, url: string, data?: any): string {
  return `${method}:${url}:${JSON.stringify(data || {})}`;
}

// 캐시 클리어 함수
export function clearApiCache() {
  cache.clear();
  console.log('🗑️ API cache cleared');
}

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
    if (error.response?.status === 401 || error.response?.status === 403) {
      // 토큰 만료 시 로그아웃 및 캐시 클리어
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      clearApiCache();
    }
    return Promise.reject(error);
  }
);

// API 래퍼 함수 (재시도 로직 + 캐싱 포함)
async function apiCall<T>(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  data?: any,
  retries = 2,
  useCache = method === 'get' // GET 요청만 캐싱
): Promise<T> {
  const cacheKey = getCacheKey(method, url, data);

  // 캐시 확인 (GET 요청만)
  if (useCache && cache.has(cacheKey)) {
    const cached = cache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('📦 Cache hit:', cacheKey);
      return cached.data;
    } else {
      cache.delete(cacheKey);
    }
  }

  let lastError: any;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await apiClient({ method, url, data });
      // API 응답이 { data: {...}, success: true } 구조이므로 response.data.data를 반환
      const result = response.data.data || response.data;

      // 캐시 저장 (GET 요청만)
      if (useCache) {
        cache.set(cacheKey, { data: result, timestamp: Date.now() });
      }

      return result;
    } catch (error: any) {
      lastError = error;

      // 재시도 불가능한 에러는 즉시 throw
      if (error.response?.status === 401 || error.response?.status === 403 || error.response?.status === 404) {
        throw error;
      }

      // 마지막 시도가 아니면 재시도
      if (attempt < retries) {
        console.log(`🔄 Retrying... (${attempt + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // 지수 백오프
        continue;
      }

      // 모든 재시도 실패
      console.error(`❌ API Error after ${retries} retries: ${method.toUpperCase()} ${url}`, {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      });
      throw error;
    }
  }
}

// Auth API
export const authAPI = {
  getCurrentUser: () =>
    apiCall<UserResponse>('get', '/api/users/me'),

  logout: (refreshToken: string) =>
    apiCall('post', '/api/auth/logout', { refreshToken }),

  testLogin: async (): Promise<{ accessToken: string; refreshToken: string }> => {
    // POST /api/auth/test 엔드포인트 호출 (모바일/API용 - JSON 응답)
    // GET /api/auth/test는 웹용 리다이렉트, POST는 모바일용 JSON 응답
    // 테스트 유저(ID: 100)로 자동 로그인하여 JWT 토큰을 발급합니다.
    const response = await apiClient.post('/api/auth/test');
    const data = response.data.data;

    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  },
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
    apiCall<{ isLiked: boolean; likeCount: number }>('post', `/api/models/${modelId}/like`, {}),

  getLikeStatus: (modelId: number) =>
    apiCall<{ isLiked: boolean }>('get', `/api/models/${modelId}/like/status`),

  filterByTags: (tags: string[], page: number = 0, size: number = 20, sortBy?: 'popular' | 'recent') => {
    const tagParams = tags.map(tag => `tags=${encodeURIComponent(tag)}`).join('&');
    // API 명세에 따라 sort 형식: "property,direction"
    const sortParam = sortBy === 'popular'
      ? '&sort=likeCount,DESC'
      : sortBy === 'recent'
        ? '&sort=createdAt,DESC'
        : '&sort=createdAt,DESC'; // 기본값
    return apiCall<PageResponse<LoraModel>>('get', `/api/models/filter?${tagParams}&page=${page}&size=${size}${sortParam}`);
  },

  searchModels: (query: string, page: number = 0, size: number = 20) =>
    apiCall<PageResponse<LoraModel>>('get', `/api/models/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`),

  updateModel: (modelId: number, data: Partial<{
    title: string;
    description: string;
    characterName: string;
    style: string;
    isPublic: boolean;
  }>) =>
    apiCall<LoraModel>('put', `/api/models/${modelId}`, data),

  deleteModel: (modelId: number) =>
    apiCall<void>('delete', `/api/models/${modelId}`),
};

// User API
export const userAPI = {
  getMyProfile: () =>
    apiCall<UserResponse>('get', '/api/users/me'),

  updateProfile: (data: Partial<{
    nickname: string;
    profileImageUrl: string;
  }>) =>
    apiCall<UserResponse>('put', '/api/users/me', data),
};

// Generate API
export const generateAPI = {
  generateImage: (config: GenerateConfig) =>
    apiCall<GenerationHistoryResponse>('post', '/api/generate', config),

  getOngoingGeneration: () =>
    apiCall<GenerationHistoryResponse | null>('get', '/api/generate/ongoing'),

  getGenerationProgress: (historyId: number) =>
    apiCall<GenerationProgressResponse>('get', `/api/generate/history/${historyId}/progress`),

  getGenerationHistory: (page: number = 0, size: number = 20, modelId?: number) => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    if (modelId !== undefined && modelId !== null) {
      params.append('modelId', modelId.toString());
    }
    return apiCall<PageResponse<GenerationHistoryResponse>>('get', `/api/generate/history/my?${params.toString()}`);
  },

  getAvailableModels: () =>
    apiCall<Array<{ id: number; title: string }>>('get', '/api/generate/history/available-models'),

  getHistoryDetail: (historyId: number) =>
    apiCall<GenerationHistoryResponse>('get', `/api/generate/history/${historyId}`),

  deleteHistory: (historyId: number) =>
    apiCall('delete', `/api/generate/history/${historyId}`, {}),
};

// Training API
export const trainingAPI = {
  startTraining: (config: TrainConfig) =>
    apiCall<TrainingJobResponse>('post', '/api/training/start', config),

  getMyActiveTrainingJob: () =>
    apiCall<TrainingJobResponse | null>('get', '/api/training/my/active'),

  deleteTrainingJob: (jobId: number) =>
    apiCall('delete', `/api/training/jobs/${jobId}`, {}),

  getTrainingHistory: () =>
    apiCall<TrainingJobResponse[]>('get', '/api/training/my'),
};

// Upload API
export const uploadAPI = {
  getPresignedUrls: (fileNames: string[]) =>
    apiCall<PresignedUrlResponse[]>('post', '/api/training/upload-urls', { fileNames }),

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
    apiCall('post', `/api/models/${modelId}/favorite`, {}),

  getLikedModels: (page: number = 0, size: number = 20) =>
    apiCall<PageResponse<LoraModel>>('get', `/api/models/likes?page=${page}&size=${size}&sort=createdAt,DESC`),

  getComments: (modelId: number, page: number = 0, size: number = 20) =>
    apiCall<PageResponse<CommentResponse>>('get', `/api/models/${modelId}/comments?page=${page}&size=${size}&sort=createdAt,DESC`),

  createComment: (modelId: number, content: string) =>
    apiCall<CommentResponse>('post', `/api/models/${modelId}/comments`, { content }),

  deleteComment: (modelId: number, commentId: number) =>
    apiCall('delete', `/api/models/${modelId}/comments/${commentId}`, {}),

  toggleCommentLike: (modelId: number, commentId: number) =>
    apiCall('post', `/api/models/${modelId}/comments/${commentId}/like`, {}),
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

// Tags API
export const tagsAPI = {
  getAllTags: () =>
    apiCall<Array<{ id: number; name: string; category?: string; usageCount?: number }>>('get', '/api/tags'),

  getPopularTags: () =>
    apiCall<Array<{ id: number; name: string; category?: string; usageCount?: number }>>('get', '/api/tags/popular'),

  searchTags: (keyword: string) =>
    apiCall<Array<{ id: number; name: string; category?: string; usageCount?: number }>>('get', `/api/tags/search?keyword=${encodeURIComponent(keyword)}`),

  addTagToModel: (modelId: number, tagName: string, category?: string) =>
    apiCall('post', `/api/tags/models/${modelId}`, { tagName, category }),

  removeTagFromModel: (modelId: number, tagId: number) =>
    apiCall('delete', `/api/tags/models/${modelId}/tags/${tagId}`, {}),
};
