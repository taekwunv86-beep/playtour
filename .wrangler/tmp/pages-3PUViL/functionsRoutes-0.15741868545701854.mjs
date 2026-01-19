import { onRequestOptions as __api_lottery_js_onRequestOptions } from "D:\\0. P&G\\3. 신사업\\6. AI\\.claude\\ExportBlock-3cb5aae7-9af1-494d-a0bb-f4a42498cd2f-Part-1\\playtour-lottery\\functions\\api\\lottery.js"
import { onRequestPost as __api_lottery_js_onRequestPost } from "D:\\0. P&G\\3. 신사업\\6. AI\\.claude\\ExportBlock-3cb5aae7-9af1-494d-a0bb-f4a42498cd2f-Part-1\\playtour-lottery\\functions\\api\\lottery.js"
import { onRequestOptions as __api_reset_js_onRequestOptions } from "D:\\0. P&G\\3. 신사업\\6. AI\\.claude\\ExportBlock-3cb5aae7-9af1-494d-a0bb-f4a42498cd2f-Part-1\\playtour-lottery\\functions\\api\\reset.js"
import { onRequestPost as __api_reset_js_onRequestPost } from "D:\\0. P&G\\3. 신사업\\6. AI\\.claude\\ExportBlock-3cb5aae7-9af1-494d-a0bb-f4a42498cd2f-Part-1\\playtour-lottery\\functions\\api\\reset.js"
import { onRequestGet as __api_results_js_onRequestGet } from "D:\\0. P&G\\3. 신사업\\6. AI\\.claude\\ExportBlock-3cb5aae7-9af1-494d-a0bb-f4a42498cd2f-Part-1\\playtour-lottery\\functions\\api\\results.js"

export const routes = [
    {
      routePath: "/api/lottery",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_lottery_js_onRequestOptions],
    },
  {
      routePath: "/api/lottery",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_lottery_js_onRequestPost],
    },
  {
      routePath: "/api/reset",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_reset_js_onRequestOptions],
    },
  {
      routePath: "/api/reset",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_reset_js_onRequestPost],
    },
  {
      routePath: "/api/results",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_results_js_onRequestGet],
    },
  ]