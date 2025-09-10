import { Messages } from './messages';

export interface ApiResponseFormat<T = any> {
  result: T | null;
  message: string;
  status_code: number;
}

export class ApiResponse {
  static success<T = any>(
    data: T,
    message = Messages.SUCCESS,
  ): ApiResponseFormat<T> {
    return {
      result: data,
      message,
      status_code: 200,
    };
  }

  static created<T = any>(
    data: T,
    message = Messages.RESOURCE_CREATED,
  ): ApiResponseFormat<T> {
    return {
      result: data,
      message,
      status_code: 201,
    };
  }

  static custom<T = any>(
    data: T,
    message: string,
    status_code: number,
  ): ApiResponseFormat<T> {
    return {
      result: data,
      message,
      status_code,
    };
  }

  static notFound(
    message = Messages.RESOURCE_NOT_FOUND,
  ): ApiResponseFormat<null> {
    return {
      result: null,
      message,
      status_code: 404,
    };
  }

  static badRequest(message = Messages.BAD_REQUEST): ApiResponseFormat<null> {
    return {
      result: null,
      message,
      status_code: 400,
    };
  }

  static unauthorized(
    message = Messages.UNAUTHORIZED,
  ): ApiResponseFormat<null> {
    return {
      result: null,
      message,
      status_code: 401,
    };
  }

  static forbidden(message = Messages.FORBIDDEN): ApiResponseFormat<null> {
    return {
      result: null,
      message,
      status_code: 403,
    };
  }

  static error(message, status_code = 500): ApiResponseFormat<null> {
    return {
      result: null,
      message,
      status_code,
    };
  }
  static serverError(message = Messages.INTERNAL_SERVER_ERROR, status_code = 500): ApiResponseFormat<null> {
    return {
      result: null,
      message,
      status_code,
    };
  }
}
