import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
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
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((response) => {
        // If response is already formatted, return as is
        if (response && typeof response === 'object' && 'success' in response) {
          if (response.data !== undefined) {
            response.data = this.sanitizeEncryptedData(response.data);
          }
          return response;
        }

        // Extract pagination meta if exists
        const meta = response?.meta || undefined;
        let data = response?.data !== undefined ? response.data : response;
        const message = response?.message || 'Operation successful';

        // Sanitize encrypted salaries recursively
        data = this.sanitizeEncryptedData(data);

        return {
          success: true,
          data,
          message,
          ...(meta && { meta }),
        };
      }),
    );
  }

  private sanitizeEncryptedData(obj: any, visited = new WeakSet()): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj !== 'object') {
      return obj;
    }

    if (visited.has(obj)) {
      return obj;
    }
    visited.add(obj);

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeEncryptedData(item, visited));
    }

    const sensitiveKeys = [
      'base_salary',
      'fixed_allowance',
      'phone_allowance',
      'dinas_allowance',
    ];

    const copy = { ...obj };

    sensitiveKeys.forEach((key) => {
      if (key in copy) {
        const val = copy[key];
        // If it's an encrypted string format (starts with hex, has a colon, etc.)
        if (typeof val === 'string' && val.includes(':')) {
          copy[key] = null;
        }
      }
    });

    for (const key in copy) {
      if (Object.prototype.hasOwnProperty.call(copy, key)) {
        copy[key] = this.sanitizeEncryptedData(copy[key], visited);
      }
    }

    return copy;
  }
}
