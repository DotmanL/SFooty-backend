import { NextFunction, Request, Response } from "express";
import { CustomError } from "../errors/custom-error";

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof CustomError) {
    return res
      .status(error.statusCode)
      .send({ errors: error.serializeErrors() });
  }
  console.error(error);
  res.status(400).send({
    errors: [{ message: "Something went wrong" }]
  });
};

export const handleErrorResponse = (res: Response, err: any) => {
  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || "INTERNAL_SERVER_ERROR";
  const errorMessage =
    err?.response?.data?.error?.message ||
    err.message ||
    "Internal Server Error";

  return res.status(statusCode).json({
    errors: [
      {
        code: errorCode,
        message: errorMessage,
        status: statusCode
      }
    ]
  });
};
