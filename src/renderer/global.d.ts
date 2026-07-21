import type { DoonApi } from "../main/preload";

declare global {
  interface Window {
    readonly doon: DoonApi;
  }
}
