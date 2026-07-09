'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Camera, RefreshCw, Upload, PenLine, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Order } from '@/lib/orders';
import { submitPickupProof } from '@/lib/ops';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted: () => void;
}

function getPosition(): Promise<{ latitude: number; longitude: number } | undefined> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(undefined);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(undefined),
      { timeout: 5000, enableHighAccuracy: true },
    );
  });
}

export function PickupProofDialog({ order, open, onOpenChange, onCompleted }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const sigRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const hasSig = useRef(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraReady(true);
    } catch {
      setCameraError(true);
      setCameraReady(false);
    }
  }, []);

  useEffect(() => {
    if (open && !photo) startCamera();
    return () => stopCamera();
  }, [open, photo, startCamera, stopCamera]);

  useEffect(() => {
    if (!open) {
      setPhoto(null);
      setPhotoUrl((u) => { if (u) URL.revokeObjectURL(u); return null; });
      setNote('');
      clearSignature();
    }
  }, [open]);

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      setPhoto(blob);
      setPhotoUrl(URL.createObjectURL(blob));
      stopCamera();
    }, 'image/jpeg', 0.85);
  };

  const sigPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = sigRef.current!;
    const rect = c.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) / rect.width) * c.width, y: ((e.clientY - rect.top) / rect.height) * c.height };
  };
  const sigDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    const ctx = sigRef.current!.getContext('2d')!;
    const { x, y } = sigPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const sigMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = sigRef.current!.getContext('2d')!;
    const { x, y } = sigPos(e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineTo(x, y);
    ctx.stroke();
    hasSig.current = true;
  };
  const sigUp = () => { drawing.current = false; };
  function clearSignature() {
    const c = sigRef.current;
    if (!c) return;
    c.getContext('2d')?.clearRect(0, 0, c.width, c.height);
    hasSig.current = false;
  }
  const getSignatureBlob = (): Promise<Blob | null> =>
    new Promise((resolve) => {
      if (!hasSig.current || !sigRef.current) return resolve(null);
      sigRef.current.toBlob((b) => resolve(b), 'image/png');
    });

  const submit = useMutation({
    mutationFn: async () => {
      if (!order || !photo) throw new Error('Pickup photo is required');
      const [coords, signature] = await Promise.all([getPosition(), getSignatureBlob()]);
      return submitPickupProof(order.id, { photo, signature, note: note.trim() || undefined, ...coords });
    },
    onSuccess: () => {
      toast.success('Pickup confirmed with proof');
      onCompleted();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetTitle>Pickup proof</SheetTitle>
        {order && <p className="mt-1 text-sm text-slate-400">{order.orderNumber} · {order.pickupAddress?.city}</p>}

        {!photo ? (
          <div className="mt-4 space-y-3">
            {cameraError ? (
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-white/20 p-8">
                <Upload className="h-8 w-8 text-slate-400" />
                <span className="text-sm text-slate-400">Upload pickup photo</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setPhoto(f);
                  setPhotoUrl(URL.createObjectURL(f));
                  stopCamera();
                }} />
              </label>
            ) : (
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-black">
                <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
                {!cameraReady && <p className="absolute inset-0 flex items-center justify-center text-sm text-white/70">Starting camera…</p>}
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={capture} disabled={!cameraReady} className="flex-1"><Camera className="h-4 w-4" /> Capture</Button>
              <Button variant="outline" onClick={startCamera}><RefreshCw className="h-4 w-4" /></Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            
            <img src={photoUrl!} alt="Pickup" className="aspect-[4/3] w-full rounded-lg object-cover" />
            <Button variant="outline" size="sm" onClick={() => { setPhoto(null); setPhotoUrl((u) => { if (u) URL.revokeObjectURL(u); return null; }); }}>Retake photo</Button>
          </div>
        )}

        <div className="mt-4 space-y-2">
          <Label className="flex items-center gap-1"><PenLine className="h-3.5 w-3.5" /> Customer signature (optional)</Label>
          <canvas
            ref={sigRef}
            width={320}
            height={120}
            className="w-full touch-none rounded-lg border border-white/15 bg-white"
            onPointerDown={sigDown}
            onPointerMove={sigMove}
            onPointerUp={sigUp}
            onPointerLeave={sigUp}
          />
          <Button type="button" variant="ghost" size="sm" onClick={clearSignature}>Clear signature</Button>
        </div>

        <div className="mt-3">
          <Label>Note (optional)</Label>
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Pickup notes" className="mt-1" />
        </div>

        <Button className="mt-6 w-full" disabled={!photo || submit.isPending} onClick={() => submit.mutate()}>
          {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Confirm pickup
        </Button>
      </SheetContent>
    </Sheet>
  );
}
