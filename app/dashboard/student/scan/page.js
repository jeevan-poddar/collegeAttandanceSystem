"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  CircleAlert,
  Loader2,
  RefreshCw,
  ScanLine,
  ShieldCheck,
} from "lucide-react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { useSelector } from "react-redux";

import { verifyAndMarkAttendance } from "@/app/action/qr/attendanceQR";
import { callWithRole } from "@/app/utlis/callWithRole";

// The library accesses the camera outside React. Serialising clean-up prevents a
// development remount or a fast refresh from opening a second camera stream.
let scannerShutdownQueue = Promise.resolve();

function stopScanner(scanner, host) {
  scannerShutdownQueue = scannerShutdownQueue.then(async () => {
    if (scanner) {
      try {
        await scanner.stop();
      } catch {
        // stop() rejects if the camera did not finish starting; clear() below
        // still removes any DOM the library created.
      }

      try {
        scanner.clear();
      } catch {
        // The instance can already be cleared after a failed start.
      }
    }

    host?.replaceChildren();
  });

  return scannerShutdownQueue;
}

const statusStyles = {
  idle: "border-slate-200 bg-slate-50 text-slate-600",
  starting: "border-blue-100 bg-blue-50 text-blue-800",
  ready: "border-emerald-100 bg-emerald-50 text-emerald-800",
  submitting: "border-blue-100 bg-blue-50 text-blue-800",
  success: "border-emerald-100 bg-emerald-50 text-emerald-800",
  error: "border-rose-100 bg-rose-50 text-rose-800",
};

export default function StudentScanPage() {
  const role = useSelector((state) => state.user.role);
  const readerHostRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const instanceId = useId().replaceAll(":", "");
  const readerId = `attendance-reader-${instanceId}`;

  const [attempt, setAttempt] = useState(0);
  const [scannerState, setScannerState] = useState("idle");
  const [message, setMessage] = useState("Preparing your camera scanner.");

  useEffect(() => {
    if (!role) return undefined;

    let disposed = false;
    let scanner = null;
    const host = readerHostRef.current;

    const startCamera = async () => {
      if (!host) return;

      setScannerState("starting");
      setMessage("Requesting camera access…");
      await scannerShutdownQueue;

      if (disposed || !host.isConnected) return;

      // Start from a known-empty element. This also removes markup left by a
      // browser interrupted during a reload.
      host.replaceChildren();
      scanner = new Html5Qrcode(readerId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (!cameras.length) {
          throw new Error("No camera was found on this device.");
        }

        // Labels are available after permission is granted. Prefer the rear
        // camera for QR scanning, but gracefully use the only/front camera.
        const selectedCamera =
          cameras.find((camera) => /back|rear|environment/i.test(camera.label)) ||
          cameras[cameras.length - 1];

        await scanner.start(
          selectedCamera.id,
          {
            fps: 10,
            qrbox: (width, height) => {
              const size = Math.min(280, width * 0.72, height * 0.72);
              return { width: size, height: size };
            },
            aspectRatio: 1,
            disableFlip: false,
          },
          async (decodedText) => {
            if (disposed || isSubmittingRef.current) return;

            // console.log("Decoded text:", decodedText);
            isSubmittingRef.current = true;
            setScannerState("submitting");
            setMessage("Verifying your attendance…");
            await stopScanner(scanner, host);

            if (disposed) return;

            try {
              const result = await callWithRole(
                role,
                ["student"],
                verifyAndMarkAttendance,
                decodedText,
              );

              if (disposed) return;

              if (result?.success) {
                setScannerState("success");
                setMessage(result.message || "Attendance submitted successfully.");
              } else {
                setScannerState("error");
                setMessage(result?.error || "We could not verify this QR code.");
              }
            } catch {
              if (!disposed) {
                setScannerState("error");
                setMessage("Connection failed. Check your internet and try again.");
              }
            }
          },
          () => {
            // A QR miss is expected several times a second, so it is intentionally quiet.
          },
        );

        if (disposed) {
          await stopScanner(scanner, host);
          return;
        }

        setScannerState("ready");
        setMessage("Point your camera at the class QR code.");
      } catch (error) {
        await stopScanner(scanner, host);
        if (!disposed) {
          setScannerState("error");
          const detail = `${error?.name || ""} ${error?.message || ""}`.toLowerCase();
          setMessage(
            detail.includes("permission") || detail.includes("notallowed") || detail.includes("not allowed")
              ? "Camera permission was denied. Allow camera access, then try again."
              : detail.includes("secure") || detail.includes("https")
                ? "Camera access requires a secure HTTPS connection."
                : detail.includes("no camera") || detail.includes("notfound")
                  ? "No camera was found. Connect a camera, then try again."
              : "Unable to start the camera. Check that no other app is using it, then try again.",
          );
        }
      }
    };

    startCamera();

    return () => {
      disposed = true;
      stopScanner(scanner, host);
    };
  }, [attempt, readerId, role]);

  const canRestart = scannerState === "error" || scannerState === "success";
  const isBusy = scannerState === "starting" || scannerState === "submitting";

  const restartScanner = () => {
    if (isBusy) return;
    isSubmittingRef.current = false;
    setAttempt((current) => current + 1);
  };

  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-slate-50 px-4 py-6 sm:px-6 sm:py-10 lg:px-10">
      <div className="mx-auto grid w-full max-w-5xl gap-5 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
        <section className="minimal-card overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-5 sm:px-7">
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-950 text-white">
                <ScanLine className="size-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Attendance</p>
                <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">Scan class QR</h1>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-7">
            <div className="relative mx-auto aspect-square w-full max-w-[34rem] overflow-hidden rounded-xl border border-slate-200 bg-slate-950 p-1.5">
              <div id={readerId} ref={readerHostRef} className="scanner-reader size-full overflow-hidden rounded-lg" />
              {isBusy && (
                <div className="absolute inset-0 grid place-items-center bg-slate-950/75 p-6 text-center text-white backdrop-blur-sm">
                  <div>
                    <Loader2 className="mx-auto size-7 animate-spin" aria-hidden="true" />
                    <p className="mt-3 text-sm font-medium">{scannerState === "submitting" ? "Submitting your scan…" : "Opening camera…"}</p>
                  </div>
                </div>
              )}
            </div>

            <div aria-live="polite" className={`mt-4 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm leading-5 ${statusStyles[scannerState]}`}>
              {scannerState === "success" ? <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" /> : scannerState === "error" ? <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" /> : scannerState === "ready" ? <Camera className="mt-0.5 size-5 shrink-0" aria-hidden="true" /> : <Loader2 className="mt-0.5 size-5 shrink-0 animate-spin" aria-hidden="true" />}
              <p>{message}</p>
            </div>

            {canRestart && (
              <button onClick={restartScanner} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 sm:w-auto">
                <RefreshCw className="size-4" aria-hidden="true" />
                {scannerState === "success" ? "Scan another code" : "Retry camera"}
              </button>
            )}
          </div>
        </section>

        <aside className="minimal-card p-5 sm:p-6 lg:sticky lg:top-20">
          <ShieldCheck className="size-5 text-slate-950" aria-hidden="true" />
          <h2 className="mt-3 text-base font-semibold text-slate-950">Quick checklist</h2>
          <ol className="mt-4 space-y-3 text-sm leading-5 text-slate-600">
            <li className="flex gap-3"><span className="font-semibold text-slate-950">01</span><span>Allow camera access when your browser asks.</span></li>
            <li className="flex gap-3"><span className="font-semibold text-slate-950">02</span><span>Hold the live class QR inside the square.</span></li>
            <li className="flex gap-3"><span className="font-semibold text-slate-950">03</span><span>Keep this page open until the confirmation appears.</span></li>
          </ol>
          <p className="mt-5 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500">Your scan is securely verified before it is sent for teacher approval.</p>
        </aside>
      </div>
    </main>
  );
}
