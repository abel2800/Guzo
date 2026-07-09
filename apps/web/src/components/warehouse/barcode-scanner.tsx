'use client';

declare global {
  class BarcodeDetector {
    constructor(options?: { formats?: string[] });
    detect(source: ImageBitmapSource): Promise<Array<{ rawValue: string }>>;
  }
}

import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BarcodeScannerProps {
  value: string;
  onChange: (value: string) => void;
  onScan?: (value: string) => void;
  placeholder?: string;
  label?: string;
  autoSubmit?: boolean;
}

export function BarcodeScanner({
  value,
  onChange,
  onScan,
  placeholder = 'Scan or type tracking number',
  label = 'Tracking number',
  autoSubmit = false,
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [supported, setSupported] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetector | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'BarcodeDetector' in window);
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  };

  const handleDetected = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    onChange(trimmed);
    onScan?.(trimmed);
    if (autoSubmit) stopCamera();
  };

  const startCamera = async () => {
    if (!supported || cameraOn) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      detectorRef.current = new BarcodeDetector({ formats: ['qr_code', 'code_128', 'code_39', 'ean_13'] });
      setCameraOn(true);

      const tick = async () => {
        if (!videoRef.current || !detectorRef.current) return;
        try {
          const codes = await detectorRef.current.detect(videoRef.current);
          if (codes[0]?.rawValue) handleDetected(codes[0].rawValue);
        } catch {}
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setCameraOn(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>{label}</Label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && value.trim()) onScan?.(value.trim());
          }}
        />
      </div>
      {supported && (
        <div className="space-y-2">
          <Button type="button" variant="outline" size="sm" onClick={cameraOn ? stopCamera : startCamera}>
            {cameraOn ? <CameraOff className="mr-2 h-4 w-4" /> : <Camera className="mr-2 h-4 w-4" />}
            {cameraOn ? 'Stop camera' : 'Use camera scanner'}
          </Button>
          {cameraOn && (
            <video ref={videoRef} className="aspect-video w-full max-w-md rounded-lg border bg-black object-cover" muted playsInline />
          )}
        </div>
      )}
    </div>
  );
}
