import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
  message: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map((response) => {
        // If response is already formatted, return as is
        if (response && typeof response === 'object' && 'success' in response) {
          return response;
        }

        // Extract pagination meta if exists
        const meta = response?.meta || undefined;
        const data = response?.data !== undefined ? response.data : response;
        const message = response?.message || 'Operation successful';

        return {
          success: true,
          data,
          message,
          ...(meta && { meta }),
        };
      }),
    );
  }
}
