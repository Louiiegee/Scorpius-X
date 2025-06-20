/**
 * Mock Service Worker handlers
 * Intercepts API calls and returns mock data
 */

import { http, HttpResponse } from "msw";
import { config } from "@/config/env";
import { mockData } from "./fixtures";
import type {
  LoginRequest,
  ContractScanRequest,
  ApiResponse,
  PaginatedResponse,
} from "@/types/generated";

// Helper to create API responses
const createResponse = <T>(data: T, message?: string): ApiResponse<T> => ({
  success: true,
  data,
  message,
  timestamp: new Date().toISOString(),
});

const createPaginatedResponse = <T>(
  items: T[],
  page: number = 1,
  limit: number = 20,
): ApiResponse<PaginatedResponse<T>> => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedItems = items.slice(startIndex, endIndex);

  return createResponse({
    items: paginatedItems,
    pagination: {
      total: items.length,
      page,
      limit,
      totalPages: Math.ceil(items.length / limit),
      hasNext: endIndex < items.length,
      hasPrev: page > 1,
    },
  });
};

// Simulate network delay
const delay = (ms: number = 500) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const handlers = [
  // ====================================
  // Authentication Endpoints
  // ====================================

  http.post(`${config.api.baseUrl}/auth/login`, async ({ request }) => {
    await delay(800);

    const body = (await request.json()) as LoginRequest;

    if (body.username === "demo" && body.password === "demo") {
      return HttpResponse.json(
        createResponse({
          user: mockData.user,
          accessToken: "mock-jwt-token",
          refreshToken: "mock-refresh-token",
          expiresIn: 3600,
        }),
      );
    }

    return new HttpResponse(
      JSON.stringify({
        success: false,
        message: "Invalid credentials",
        timestamp: new Date().toISOString(),
      }),
      { status: 401 },
    );
  }),

  http.post(`${config.api.baseUrl}/auth/logout`, async () => {
    await delay(200);
    return HttpResponse.json(createResponse(null, "Logged out successfully"));
  }),

  http.get(`${config.api.baseUrl}/auth/me`, async () => {
    await delay(300);
    return HttpResponse.json(createResponse(mockData.user));
  }),

  http.post(`${config.api.baseUrl}/auth/refresh`, async () => {
    await delay(400);
    return HttpResponse.json(
      createResponse({
        user: mockData.user,
        accessToken: "new-mock-jwt-token",
        refreshToken: "new-mock-refresh-token",
        expiresIn: 3600,
      }),
    );
  }),

  // ====================================
  // Dashboard Endpoints
  // ====================================

  http.get(`${config.api.baseUrl}/dashboard/stats`, async () => {
    await delay(600);
    return HttpResponse.json(createResponse(mockData.dashboardStats));
  }),

  http.get(`${config.api.baseUrl}/dashboard/alerts`, async ({ request }) => {
    await delay(400);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");

    return HttpResponse.json(
      createPaginatedResponse(mockData.threatAlerts, page, limit),
    );
  }),

  http.get(`${config.api.baseUrl}/dashboard/charts`, async () => {
    await delay(800);
    return HttpResponse.json(createResponse(mockData.chartData));
  }),

  // ====================================
  // Scanner Endpoints
  // ====================================

  http.post(`${config.api.scannerUrl}/scanner/analyze`, async ({ request }) => {
    await delay(2000); // Simulate scan time

    const body = (await request.json()) as ContractScanRequest;

    // Create a mock scan result based on the request
    const scanResult = {
      ...mockData.scanResults[0],
      id: `scan_${Date.now()}`,
      contractAddress: body.contractAddress,
      scanType: body.scanType,
      startedAt: new Date().toISOString(),
      completedAt: new Date(Date.now() + 5000).toISOString(),
    };

    return HttpResponse.json(createResponse(scanResult));
  }),

  http.post(`${config.api.scannerUrl}/scanner/upload`, async () => {
    await delay(1500);

    const uploadResult = {
      id: `upload_${Date.now()}`,
      filename: "contract.sol",
      size: 1024,
      status: "processed",
      extractedAddress: "0x742d35Cc6634C0532925a3b8D5c0532925a3b8D",
    };

    return HttpResponse.json(createResponse(uploadResult));
  }),

  http.get(`${config.api.scannerUrl}/scanner/results`, async ({ request }) => {
    await delay(500);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");

    return HttpResponse.json(
      createPaginatedResponse(mockData.scanResults, page, limit),
    );
  }),

  // ====================================
  // MEV Endpoints
  // ====================================

  http.get(`${config.api.mevUrl}/mev/strategies`, async ({ request }) => {
    await delay(600);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");

    return HttpResponse.json(
      createPaginatedResponse(mockData.mevStrategies, page, limit),
    );
  }),

  http.post(`${config.api.mevUrl}/mev/deploy-strategy`, async ({ request }) => {
    await delay(1200);

    const body = await request.json();
    const newStrategy = {
      id: `mev_${Date.now()}`,
      name: body.name || "New Strategy",
      type: body.strategy_type,
      status: "active" as const,
      profitability: 0,
      successRate: 0,
      totalProfit: 0,
      parameters: body.parameters,
      metrics: {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        totalGasUsed: 0,
        averageProfit: 0,
        maxProfit: 0,
        recentPerformance: [],
      },
    };

    return HttpResponse.json(createResponse(newStrategy));
  }),

  http.post(
    `${config.api.mevUrl}/mev/strategies/:id/pause`,
    async ({ params }) => {
      await delay(300);
      return HttpResponse.json(
        createResponse({ id: params.id, status: "paused" }),
      );
    },
  ),

  http.post(
    `${config.api.mevUrl}/mev/strategies/:id/stop`,
    async ({ params }) => {
      await delay(300);
      return HttpResponse.json(
        createResponse({ id: params.id, status: "stopped" }),
      );
    },
  ),

  // ====================================
  // Mempool Endpoints
  // ====================================

  http.get(
    `${config.api.mempoolUrl}/mempool/transactions`,
    async ({ request }) => {
      await delay(400);
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = parseInt(url.searchParams.get("limit") || "50");

      return HttpResponse.json(
        createPaginatedResponse(mockData.mempoolTransactions, page, limit),
      );
    },
  ),

  http.get(`${config.api.mempoolUrl}/mempool/alerts`, async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");

    return HttpResponse.json(
      createPaginatedResponse(mockData.mempoolAlerts, page, limit),
    );
  }),

  http.get(`${config.api.mempoolUrl}/mempool/live`, async () => {
    await delay(200);

    const liveData = {
      totalTransactions: Math.floor(Math.random() * 1000) + 5000,
      averageGasPrice: Math.floor(Math.random() * 50) + 20,
      pendingTransactions: Math.floor(Math.random() * 200) + 100,
      suspiciousTransactions: Math.floor(Math.random() * 10) + 1,
      mevOpportunities: Math.floor(Math.random() * 5) + 1,
      networkCongestion: Math.random() * 100,
    };

    return HttpResponse.json(createResponse(liveData));
  }),

  // ====================================
  // System Endpoints
  // ====================================

  http.get(`${config.api.baseUrl}/system/health`, async () => {
    await delay(300);
    return HttpResponse.json(createResponse(mockData.systemHealth));
  }),

  // ====================================
  // Scheduler Endpoints
  // ====================================

  http.get(`${config.api.baseUrl}/scheduler/jobs`, async ({ request }) => {
    await delay(500);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");

    return HttpResponse.json(
      createPaginatedResponse(mockData.scheduledJobs, page, limit),
    );
  }),

  http.post(`${config.api.baseUrl}/scheduler/jobs`, async ({ request }) => {
    await delay(800);

    const body = await request.json();
    const newJob = {
      id: `job_${Date.now()}`,
      name: body.name,
      type: body.type,
      schedule: body.schedule,
      status: "active" as const,
      nextRun: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      parameters: body.parameters || {},
      metrics: {
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        averageDuration: 0,
        recentRuns: [],
      },
    };

    return HttpResponse.json(createResponse(newJob));
  }),

  http.post(
    `${config.api.baseUrl}/scheduler/jobs/:id/pause`,
    async ({ params }) => {
      await delay(200);
      return HttpResponse.json(
        createResponse({ id: params.id, status: "paused" }),
      );
    },
  ),

  http.post(
    `${config.api.baseUrl}/scheduler/jobs/:id/resume`,
    async ({ params }) => {
      await delay(200);
      return HttpResponse.json(
        createResponse({ id: params.id, status: "active" }),
      );
    },
  ),

  // ====================================
  // Error scenarios for testing
  // ====================================

  http.get(`${config.api.baseUrl}/test/error`, () => {
    return new HttpResponse(
      JSON.stringify({
        success: false,
        message: "Test error endpoint",
        timestamp: new Date().toISOString(),
      }),
      { status: 500 },
    );
  }),

  http.get(`${config.api.baseUrl}/test/timeout`, async () => {
    await delay(10000); // 10 second delay to test timeout
    return HttpResponse.json(
      createResponse({ message: "This should timeout" }),
    );
  }),
];
