export function successResponse(data: unknown, message = "Success") {
  return {
    status: "success",
    message,
    data,
  };
}

export function errorResponse(message: string) {
  return {
    status: "error",
    message,
  };
}
