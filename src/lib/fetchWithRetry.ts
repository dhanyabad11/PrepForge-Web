interface FetchWithRetryOptions extends RequestInit {
    retries?: number;
    retryDelay?: number;
    timeout?: number;
}

export async function fetchWithRetry(
    url: string,
    options: FetchWithRetryOptions = {}
): Promise<Response> {
    const {
        retries = 3,
        retryDelay = 1000,
        timeout = 60000, // 60 seconds for Render free tier wake-up
        ...fetchOptions
    } = options;

    let lastError: Error | null = null;

    for (let i = 0; i <= retries; i++) {
        try {
            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(url, {
                ...fetchOptions,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            // If successful or client error (4xx), return immediately
            if (response.ok || (response.status >= 400 && response.status < 500)) {
                return response;
            }

            // Server error (5xx) - might retry
            if (i < retries) {
                console.warn(`Fetch failed (${response.status}), retrying in ${retryDelay}ms...`);
                await new Promise((resolve) => setTimeout(resolve, retryDelay * (i + 1)));
                continue;
            }

            return response;
        } catch (error) {
            lastError = error as Error;

            // Don't retry on abort (timeout)
            if ((error as Error).name === "AbortError") {
                throw new Error(
                    "Request timeout. The server might be waking up (this can take up to 60 seconds on free tier). Please try again."
                );
            }

            // Network errors - retry
            if (i < retries) {
                console.warn(`Fetch error, retrying in ${retryDelay}ms...`, (error as Error).message);
                await new Promise((resolve) => setTimeout(resolve, retryDelay * (i + 1)));
                continue;
            }
        }
    }

    // All retries failed
    throw new Error(
        lastError?.message ||
            "Network error. Please check your connection or try again in a moment."
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchJSON<T = any>(
    url: string,
    options?: FetchWithRetryOptions
): Promise<T> {
    const response = await fetchWithRetry(url, options);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
            errorData.error || errorData.message || `HTTP error! status: ${response.status}`
        );
    }

    return response.json();
}
