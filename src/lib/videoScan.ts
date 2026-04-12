export const MAX_SCAN_RECORDING_SECONDS = 30;

export function getSupportedRecordingMimeType() {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') return '';

  const mimeTypes = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ];

  return mimeTypes.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) ?? '';
}

export async function extractFramesFromVideo(file: File, requestedFrameCount?: number): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.src = '';
    };

    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.src = objectUrl;

    video.onerror = () => {
      cleanup();
      reject(new Error('Failed to load recorded video. Retake it and try again.'));
    };

    video.onloadedmetadata = async () => {
      try {
        const duration = Math.min(video.duration || 0, MAX_SCAN_RECORDING_SECONDS);
        if (!Number.isFinite(duration) || duration <= 0) {
          throw new Error('Recorded video has no readable duration. Retake it and try again.');
        }

        const frameCount = requestedFrameCount ?? Math.min(12, Math.max(6, Math.round(duration / 3)));
        const sourceWidth = video.videoWidth || 640;
        const sourceHeight = video.videoHeight || 480;
        const scale = Math.min(1, 960 / sourceWidth);

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(320, Math.round(sourceWidth * scale));
        canvas.height = Math.max(240, Math.round(sourceHeight * scale));

        const context = canvas.getContext('2d');
        if (!context) {
          throw new Error('Could not prepare video frames for analysis.');
        }

        const times = Array.from({ length: frameCount }, (_, index) => {
          const position = (duration / (frameCount + 1)) * (index + 1);
          return Math.min(position, Math.max(duration - 0.1, 0));
        });

        const seekTo = (time: number) =>
          new Promise<void>((seekResolve, seekReject) => {
            const handleSeeked = () => {
              video.removeEventListener('error', handleError);
              seekResolve();
            };

            const handleError = () => {
              video.removeEventListener('seeked', handleSeeked);
              seekReject(new Error('Failed while sampling the recording. Retake and try again.'));
            };

            video.addEventListener('seeked', handleSeeked, { once: true });
            video.addEventListener('error', handleError, { once: true });
            video.currentTime = time;
          });

        const frames: string[] = [];
        for (const time of times) {
          await seekTo(time);
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          frames.push(canvas.toDataURL('image/jpeg', 0.72));
        }

        cleanup();
        resolve(frames);
      } catch (error) {
        cleanup();
        reject(error instanceof Error ? error : new Error('Failed to process recorded video.'));
      }
    };
  });
}
