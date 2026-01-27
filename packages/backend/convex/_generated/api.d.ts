/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as alertChecking from "../alertChecking.js";
import type * as alerts from "../alerts.js";
import type * as crons from "../crons.js";
import type * as healthCheck from "../healthCheck.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_retrier from "../lib/retrier.js";
import type * as lib_subscriptionEmails from "../lib/subscriptionEmails.js";
import type * as lib_tierLimits from "../lib/tierLimits.js";
import type * as markets from "../markets.js";
import type * as notifications from "../notifications.js";
import type * as privateData from "../privateData.js";
import type * as savedPresets from "../savedPresets.js";
import type * as scheduling from "../scheduling.js";
import type * as scheduling_alertPriceSync from "../scheduling/alertPriceSync.js";
import type * as scheduling_cleanup from "../scheduling/cleanup.js";
import type * as scheduling_leaderboardSync from "../scheduling/leaderboardSync.js";
import type * as scheduling_marketHoldersSync from "../scheduling/marketHoldersSync.js";
import type * as scheduling_marketSync from "../scheduling/marketSync.js";
import type * as scheduling_shared_constants from "../scheduling/shared/constants.js";
import type * as scheduling_shared_helpers from "../scheduling/shared/helpers.js";
import type * as scheduling_shared_index from "../scheduling/shared/index.js";
import type * as scheduling_shared_typeGuards from "../scheduling/shared/typeGuards.js";
import type * as scheduling_shared_types from "../scheduling/shared/types.js";
import type * as scheduling_whaleSync from "../scheduling/whaleSync.js";
import type * as subscriptions from "../subscriptions.js";
import type * as users from "../users.js";
import type * as whaleActivity from "../whaleActivity.js";
import type * as whales from "../whales.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  alertChecking: typeof alertChecking;
  alerts: typeof alerts;
  crons: typeof crons;
  healthCheck: typeof healthCheck;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/retrier": typeof lib_retrier;
  "lib/subscriptionEmails": typeof lib_subscriptionEmails;
  "lib/tierLimits": typeof lib_tierLimits;
  markets: typeof markets;
  notifications: typeof notifications;
  privateData: typeof privateData;
  savedPresets: typeof savedPresets;
  scheduling: typeof scheduling;
  "scheduling/alertPriceSync": typeof scheduling_alertPriceSync;
  "scheduling/cleanup": typeof scheduling_cleanup;
  "scheduling/leaderboardSync": typeof scheduling_leaderboardSync;
  "scheduling/marketHoldersSync": typeof scheduling_marketHoldersSync;
  "scheduling/marketSync": typeof scheduling_marketSync;
  "scheduling/shared/constants": typeof scheduling_shared_constants;
  "scheduling/shared/helpers": typeof scheduling_shared_helpers;
  "scheduling/shared/index": typeof scheduling_shared_index;
  "scheduling/shared/typeGuards": typeof scheduling_shared_typeGuards;
  "scheduling/shared/types": typeof scheduling_shared_types;
  "scheduling/whaleSync": typeof scheduling_whaleSync;
  subscriptions: typeof subscriptions;
  users: typeof users;
  whaleActivity: typeof whaleActivity;
  whales: typeof whales;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  actionRetrier: {
    public: {
      cancel: FunctionReference<
        "mutation",
        "internal",
        { runId: string },
        boolean
      >;
      cleanup: FunctionReference<
        "mutation",
        "internal",
        { runId: string },
        any
      >;
      start: FunctionReference<
        "mutation",
        "internal",
        {
          functionArgs: any;
          functionHandle: string;
          options: {
            base: number;
            initialBackoffMs: number;
            logLevel: "DEBUG" | "INFO" | "WARN" | "ERROR";
            maxFailures: number;
            onComplete?: string;
            runAfter?: number;
            runAt?: number;
          };
        },
        string
      >;
      status: FunctionReference<
        "query",
        "internal",
        { runId: string },
        | { type: "inProgress" }
        | {
            result:
              | { returnValue: any; type: "success" }
              | { error: string; type: "failed" }
              | { type: "canceled" };
            type: "completed";
          }
      >;
    };
  };
};
