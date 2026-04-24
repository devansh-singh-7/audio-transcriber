type ErrorWithCause = {
  cause?: unknown;
  message?: string;
};

function extractCode(error: unknown): string | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  const direct = error as { code?: unknown };
  if (typeof direct.code === "string") {
    return direct.code;
  }

  const withCause = error as ErrorWithCause;
  if (withCause.cause && typeof withCause.cause === "object") {
    const nested = withCause.cause as { code?: unknown };
    if (typeof nested.code === "string") {
      return nested.code;
    }
  }

  return null;
}

function extractMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const value = error as ErrorWithCause;
    if (typeof value.message === "string") {
      return value.message;
    }
  }

  return "Unexpected database error";
}

export function isMissingRelationError(error: unknown) {
  if (extractCode(error) === "42P01") {
    return true;
  }

  const message = extractMessage(error).toLowerCase();
  return message.includes("relation") && message.includes("does not exist");
}

export function isPermissionError(error: unknown) {
  const code = extractCode(error);
  if (code === "42501") {
    return true;
  }

  const message = extractMessage(error).toLowerCase();
  return message.includes("permission denied");
}

export function getSafeDatabaseMessage(error: unknown) {
  if (isMissingRelationError(error)) {
    return "Database tables are not set up yet";
  }

  if (isPermissionError(error)) {
    return "Database user does not have enough permissions";
  }

  return "Database operation failed";
}