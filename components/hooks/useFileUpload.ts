
import { useState } from 'react';

export interface FileUploadState {
  progress: number;
  isUploading: boolean;
  error: string | null;
  uploadedUrl: string | null;
}

export const useFileUpload = () => {
  const [state, setState] = useState<FileUploadState>({
    progress: 0,
    isUploading: false,
    error: null,
    uploadedUrl: null
  });

  const upload = async (file: File) => {
    setState({ progress: 0, isUploading: true, error: null, uploadedUrl: null });

    // Mock Upload Logic
    return new Promise<string>((resolve, reject) => {
        const interval = setInterval(() => {
            setState(prev => {
                if (prev.progress >= 100) {
                    clearInterval(interval);
                    return prev;
                }
                return { ...prev, progress: prev.progress + 10 };
            });
        }, 200);

        // Simulate network success after 2 seconds
        setTimeout(() => {
            clearInterval(interval);
            const mockUrl = `https://cdn.nexflow.io/uploads/${file.name}`; // Fake URL
            setState({ progress: 100, isUploading: false, error: null, uploadedUrl: mockUrl });
            resolve(mockUrl);
        }, 2000);
    });
  };

  const reset = () => {
      setState({ progress: 0, isUploading: false, error: null, uploadedUrl: null });
  };

  return { ...state, upload, reset };
};
