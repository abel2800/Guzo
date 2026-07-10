'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Camera, RefreshCw, Upload, PenLine, Loader2, CheckCircle2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import type { Order } from '@/lib/orders';
import { submitProofOfDelivery } from '@/lib/ops';
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

export function ProofOfDeliveryDialog({ order, open, onOpenChange, onCompleted }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  const [photo, setPhoto] = useState<Blob | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState('');

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(false);
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
      setCameraReady(true);
    } catch {
      setCameraError(true);
      setCameraReady(false);
    }
  }, []);

    useEffect(() => {
    if (open && !photo) startCamera();
    return () => stopCamera();

  }, [open, photo]);

    useEffect(() => {
    if (!open) {
      setPhoto(null);
      setPhotoUrl((u) => {
        if (u) URL.revokeObjectURL(u);
        return null;
      });
      setRecipientName('');
      setCameraError(false);
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
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setPhoto(blob);
        setPhotoUrl(URL.createObjectURL(blob));
        stopCamera();
      },
      'image/jpeg',
      0.85,
    );
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoUrl(URL.createObjectURL(file));
    stopCamera();
  };

  const retake = () => {
    setPhoto(null);
    setPhotoUrl((u) => {
      if (u) URL.revokeObjectURL(u);
      return null;
    });
  };

    const sigRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const hasSig = useRef(false);

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
  const sigUp = () => {
    drawing.current = false;
  };
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
      if (!order || !photo) throw new Error('A photo is required');
      const [coords, signature] = await Promise.all([getPosition(), getSignatureBlob()]);
      return submitProofOfDelivery(order.id, {
        photo,
        signature,
        recipientName: recipientName.trim() || undefined,
        ...coords,
      });
    },
    onSuccess: () => {
      toast.success('Delivery completed with proof');
      onCompleted();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetTitle>Proof of Delivery</SheetTitle>
        {order && (
          <p className="mt-1 text-sm text-muted-foreground">
            {order.orderNumber} · {order.dropoffAddress?.city}
          </p>
        )}

        <div className="mt-5 space-y-6">
          
          <div className="space-y-2">
            <Label>Delivery photo <span className="text-destructive">*</span></Label>
            <div className="overflow-hidden rounded-lg border bg-muted/40">
              {photoUrl ? (
                                <img src={photoUrl} alt="Proof" className="aspect-[3/4] w-full object-cover" />
              ) : cameraError ? (
                <div className="flex aspect-[3/4] flex-col items-center justify-center gap-3 p-6 text-center text-sm text-muted-foreground">
                  <Camera className="h-8 w-8" />
                  <p>Camera unavailable. Upload a photo instead.</p>
                </div>
              ) : (
                <video ref={videoRef} playsInline muted className="aspect-[3/4] w-full bg-black object-cover" />
              )}
            </div>

            {photoUrl ? (
              <Button variant="outline" className="w-full" onClick={retake} type="button">
                <RefreshCw className="h-4 w-4" /> Retake
              </Button>
            ) : cameraError ? (
              <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted">
                <Upload className="h-4 w-4" /> Upload photo
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onPickFile} />
              </label>
            ) : (
              <Button className="w-full" onClick={capture} disabled={!cameraReady} type="button">
                <Camera className="h-4 w-4" /> {cameraReady ? 'Capture photo' : 'Starting camera…'}
              </Button>
            )}
          </div>

          
          <div className="space-y-2">
            <Label htmlFor="recipient">Received by (optional)</Label>
            <Input
              id="recipient"
              placeholder="Recipient name"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
            />
          </div>

          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1">
                <PenLine className="h-3.5 w-3.5" /> Signature (optional)
              </Label>
              <button type="button" onClick={clearSignature} className="text-xs text-muted-foreground hover:text-foreground">
                Clear
              </button>
            </div>
            <canvas
              ref={sigRef}
              width={320}
              height={140}
              onPointerDown={sigDown}
              onPointerMove={sigMove}
              onPointerUp={sigUp}
              onPointerLeave={sigUp}
              className="w-full touch-none rounded-lg border bg-white"
            />
          </div>

          <Button className="w-full" size="lg" onClick={() => submit.mutate()} disabled={!photo || submit.isPending}>
            {submit.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" /> Complete delivery
              </>
            )}
          </Button>
          <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> Your GPS location is attached automatically.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
