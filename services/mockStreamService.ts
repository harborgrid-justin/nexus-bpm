
export interface StreamEvent {
    id: string;
    source: string;
    message: string;
    severity: 'info' | 'warn' | 'error' | 'success';
    timestamp: Date;
}

class MockStreamService {
    private listeners: ((event: StreamEvent) => void)[] = [];
    private interval: any = null;

    public subscribe(callback: (event: StreamEvent) => void) {
        this.listeners.push(callback);
        if (!this.interval) {
            this.startStream();
        }
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
            if (this.listeners.length === 0) {
                this.stopStream();
            }
        };
    }

    private startStream() {
        this.interval = setInterval(() => {
            if (this.listeners.length === 0) return;
            
            const sources = ['Auth Service', 'Rule Engine', 'Workflow Kernel', 'Integration Bus', 'API Gateway'];
            const messages = [
                'Token validated successfully',
                'Executing rule set "Finance_Approval_v2"',
                'Task claims processing time > 200ms',
                'Webhook delivery pending',
                'Rate limit approaching threshold',
                'Garbage collection cycle completed',
                'New instance spawned from definition'
            ];
            
            const severities: StreamEvent['severity'][] = ['info', 'info', 'info', 'success', 'warn', 'info', 'success'];

            const idx = Math.floor(Math.random() * messages.length);
            
            const event: StreamEvent = {
                id: `evt-${Date.now()}`,
                source: sources[Math.floor(Math.random() * sources.length)],
                message: messages[idx],
                severity: severities[idx],
                timestamp: new Date()
            };

            this.listeners.forEach(cb => cb(event));

        }, 1200); // Stream event every 1.2s
    }

    private stopStream() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
}

export const mockStreamService = new MockStreamService();