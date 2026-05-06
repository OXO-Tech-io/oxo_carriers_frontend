import type { AxiosResponse } from "axios";
import type { ApiResponse } from "@/types/api";

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null;

export const extractData = <T>(
  response: AxiosResponse<ApiResponse<T> | T>,
): T => {
  const body = response.data as unknown;

  if (isRecord(body) && "data" in body) {
    return body.data as T;
  }

  return body as T;
};

export const extractMessage = (
  response: AxiosResponse<unknown>,
): string | undefined => {
  const body = response.data;

  if (!isRecord(body)) {
    return undefined;
  }

  const message = body.message;
  return typeof message === "string" ? message : undefined;
};
