/** Same error classification the production flow uses (App.tsx `handleGeminiError`) —
 * quota/rate-limit gets a calm "try again later", everything else surfaces a short
 * technical message. Kept identical so support doesn't see two different error copies
 * for the same underlying failure depending on which UI the user hit. */
export interface SimError {
  message: string;
  isQuota: boolean;
  isRetryable: boolean;
}

export function parseGeminiError(err: unknown): SimError {
  let errorObj: any = err;
  if (typeof err === 'string') {
    try {
      errorObj = JSON.parse(err);
    } catch {
      errorObj = { message: err };
    }
  }

  const code = errorObj?.error?.code || errorObj?.code || errorObj?.status;
  const message = errorObj?.error?.message || errorObj?.message || (typeof err === 'string' ? err : '');

  if ((err as any)?.message === 'MAX_RETRIES_EXCEEDED') {
    return {
      message: 'Sua conexão caiu durante a simulação. Tentamos reconectar 3 vezes sem sucesso. Seus dados estão preservados — tente novamente.',
      isQuota: false,
      isRetryable: true,
    };
  }

  if (code === 429 || String(message).includes('RESOURCE_EXHAUSTED') || String(message).includes('spending cap')) {
    return {
      message: 'O sistema está temporariamente indisponível. Tente novamente em alguns minutos.',
      isQuota: true,
      isRetryable: true,
    };
  }

  if (message) {
    const clean = String(message).startsWith('<!DOCTYPE') || String(message).startsWith('<html')
      ? 'Erro de gateway/conexão. O serviço de IA está temporariamente indisponível.'
      : String(message);
    return {
      message: `Erro técnico: ${clean.slice(0, 150)}${clean.length > 150 ? '...' : ''}`,
      isQuota: false,
      isRetryable: true,
    };
  }

  return {
    message: 'Ocorreu um erro ao processar sua causa. Tente novamente.',
    isQuota: false,
    isRetryable: true,
  };
}
