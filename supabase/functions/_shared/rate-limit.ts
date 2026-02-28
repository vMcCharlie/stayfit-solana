export class RateLimiter {
    private requests: Map<string, number[]>;
    private limit: number;
    private window: number;

    constructor(limit: number, windowInSeconds: number) {
        this.requests = new Map();
        this.limit = limit;
        this.window = windowInSeconds * 1000;
    }

    check(userId: string): boolean {
        const now = Date.now();
        const userRequests = this.requests.get(userId) || [];

        // Filter out old requests
        const validRequests = userRequests.filter(time => now - time < this.window);

        if (validRequests.length >= this.limit) {
            return false;
        }

        validRequests.push(now);
        this.requests.set(userId, validRequests);
        return true;
    }

    // Cleanup method to prevent memory leaks (call periodically if server is long-running)
    cleanup() {
        const now = Date.now();
        for (const [userId, timestamps] of this.requests.entries()) {
            const valid = timestamps.filter(time => now - time < this.window);
            if (valid.length === 0) {
                this.requests.delete(userId);
            } else {
                this.requests.set(userId, valid);
            }
        }
    }
}
