import { RealTimePipelineStatusDemo } from '@/components/RealTimePipelineStatusDemo';

export default function RealTimeDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8">
        <RealTimePipelineStatusDemo />
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Real-Time Pipeline Updates Demo',
  description: 'Demonstration of real-time pipeline status updates using WebSocket and Server-Sent Events'
};