import { toast } from '$lib/components/toast/toast.svelte';
import { i18n } from '$lib/i18n/i18n.svelte';

/**
 * Categorias de erros
 */
export enum ErrorCategory {
  NETWORK = 'network',
  AUTH = 'auth',
  VALIDATION = 'validation',
  NOT_FOUND = 'not_found',
  PERMISSION = 'permission',
  STORAGE = 'storage',
  GEOLOCATION = 'geolocation',
  UNKNOWN = 'unknown'
}

/**
 * Interface para erros customizados
 */
export interface AppError {
  category: ErrorCategory;
  message: string;
  originalError?: Error | unknown;
  code?: string;
}

/**
 * Handler centralizado de erros
 */
export class ErrorHandler {
  /**
   * Processa e exibe erro apropriadamente
   */
  static handle(error: unknown, context?: string): void {
    const appError = this.categorizeError(error);
    const userMessage = this.getUserMessage(appError);

    // Log para debug (apenas em dev)
    if (import.meta.env.DEV) {
      console.error(`[${context || 'App'}]`, {
        category: appError.category,
        message: appError.message,
        originalError: appError.originalError
      });
    }

    // Exibir toast apropriado
    this.showToast(appError, userMessage);

    // Enviar para analytics (se configurado)
    // this.logToAnalytics(appError, context);
  }

  /**
   * Categoriza o erro baseado em seu tipo/conteúdo
   */
  private static categorizeError(error: unknown): AppError {
    // Erro de rede
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        category: ErrorCategory.NETWORK,
        message: 'Network request failed',
        originalError: error
      };
    }

    // Erro do Supabase
    if (this.isSupabaseError(error)) {
      const supabaseError = error as any;
      
      if (supabaseError.code === 'PGRST116') {
        return {
          category: ErrorCategory.NOT_FOUND,
          message: 'Resource not found',
          originalError: error,
          code: supabaseError.code
        };
      }

      if (supabaseError.code === '23505') {
        return {
          category: ErrorCategory.VALIDATION,
          message: 'Duplicate entry',
          originalError: error,
          code: supabaseError.code
        };
      }

      if (supabaseError.message?.includes('JWT')) {
        return {
          category: ErrorCategory.AUTH,
          message: 'Authentication error',
          originalError: error
        };
      }
    }

    // Erro de geolocalização
    if (error instanceof GeolocationPositionError) {
      return {
        category: ErrorCategory.GEOLOCATION,
        message: `Geolocation error: ${error.code}`,
        originalError: error,
        code: error.code.toString()
      };
    }

    // Erro customizado (AppError)
    if (this.isAppError(error)) {
      return error as AppError;
    }

    // Erro genérico
    if (error instanceof Error) {
      // Verificar mensagens específicas
      const msg = error.message.toLowerCase();
      
      if (msg.includes('permission') || msg.includes('unauthorized')) {
        return {
          category: ErrorCategory.PERMISSION,
          message: error.message,
          originalError: error
        };
      }

      if (msg.includes('not found') || msg.includes('404')) {
        return {
          category: ErrorCategory.NOT_FOUND,
          message: error.message,
          originalError: error
        };
      }

      if (msg.includes('network') || msg.includes('offline')) {
        return {
          category: ErrorCategory.NETWORK,
          message: error.message,
          originalError: error
        };
      }

      return {
        category: ErrorCategory.UNKNOWN,
        message: error.message,
        originalError: error
      };
    }

    // Erro desconhecido
    return {
      category: ErrorCategory.UNKNOWN,
      message: String(error),
      originalError: error
    };
  }

  /**
   * Gera mensagem amigável para o usuário
   */
  private static getUserMessage(error: AppError): string {
    const t = i18n.t.errors;

    switch (error.category) {
      case ErrorCategory.NETWORK:
        return t.network || 'Erro de conexão. Verifique sua internet.';
      
      case ErrorCategory.AUTH:
        return t.unauthorized || 'Sessão expirada. Faça login novamente.';
      
      case ErrorCategory.VALIDATION:
        return error.message || t.validation || 'Dados inválidos.';
      
      case ErrorCategory.NOT_FOUND:
        return t.notFound || 'Recurso não encontrado.';
      
      case ErrorCategory.PERMISSION:
        return t.permission || 'Você não tem permissão para esta ação.';
      
      case ErrorCategory.STORAGE:
        return t.uploadFailed || 'Erro ao processar arquivo.';
      
      case ErrorCategory.GEOLOCATION:
        if (error.code === '1') return t.locationDenied;
        if (error.code === '2') return t.locationUnavailable;
        if (error.code === '3') return t.locationTimeout;
        return t.locationUnavailable;
      
      default:
        return t.generic || 'Ocorreu um erro inesperado.';
    }
  }

  /**
   * Exibe toast com severidade apropriada
   */
  private static showToast(error: AppError, message: string): void {
    switch (error.category) {
      case ErrorCategory.AUTH:
      case ErrorCategory.PERMISSION:
        toast.error(message);
        break;
      
      case ErrorCategory.VALIDATION:
      case ErrorCategory.NOT_FOUND:
        toast.info(message);
        break;
      
      case ErrorCategory.NETWORK:
      case ErrorCategory.UNKNOWN:
        toast.error(message);
        break;
      
      default:
        toast.error(message);
    }
  }

  /**
   * Verifica se é um erro do Supabase
   */
  private static isSupabaseError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      ('code' in error || 'message' in error) &&
      ('details' in error || 'hint' in error)
    );
  }

  /**
   * Verifica se é um AppError
   */
  private static isAppError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'category' in error &&
      'message' in error
    );
  }

  /**
   * Cria erro customizado
   */
  static createError(
    category: ErrorCategory,
    message: string,
    originalError?: unknown
  ): AppError {
    return {
      category,
      message,
      originalError
    };
  }

  /**
   * Log para analytics (placeholder)
   */
  private static logToAnalytics(error: AppError, context?: string): void {
    // Implementar quando adicionar analytics
    // analytics.track('error', {
    //   category: error.category,
    //   context,
    //   message: error.message
    // });
  }
}

/**
 * Helper para async error handling
 */
export async function handleAsync<T>(
  promise: Promise<T>,
  context?: string
): Promise<[T | null, AppError | null]> {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    const appError = ErrorHandler['categorizeError'](error);
    
    if (import.meta.env.DEV) {
      console.error(`[${context || 'AsyncHandler'}]`, appError);
    }
    
    return [null, appError];
  }
}

