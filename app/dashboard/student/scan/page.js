"use client";
import React, { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
  Camera,
  CheckCircle2,
  CircleAlert,
  Loader2,
  ScanLine,
  ShieldCheck,
} from "lucide-react";

import { verifyAndMarkAttendance } from "@/app/action/qr/attendanceQR";
import { callWithRole } from "@/app/utlis/callWithRole";
import { useSelector } from "react-redux";
export default function StudentScanPage() {
  const role = useSelector((state) => state.user.role);
  const [scanResult, setScanResult] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!role) return undefined;

    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: { width: 230, height: 230 },
        aspectRatio: 1,
      },
      false,
    );

    async function onScanSuccess(decodedText) {
      scanner.clear();
      setIsLoading(true);
      setStatusMessage("Verifying secure QR code with server...");

      const result = await callWithRole(
        role,
        ["student"],
        verifyAndMarkAttendance,
        decodedText,
      );

      setIsLoading(false);
      if (result.success) {
        setStatusMessage(`✅ Success: ${result.message}`);
        setScanResult(decodedText);
      } else {
        setStatusMessage(`❌ Error: ${result.error}`);
        setTimeout(() => window.location.reload(), 3000);
      }
    }

    function onScanError() {}

    scanner.render(onScanSuccess, onScanError);

    return () => {
      scanner.clear().catch((error) => {
        console.error("Failed to clear html5QrcodeScanner. ", error);
      });
    };
  }, [role]);

  const isSuccess = statusMessage.startsWith("✅");
  const isError = statusMessage.startsWith("❌");

  return (
    <main className="min-h-[100dvh] bg-linear-to-b from-blue-700 via-blue-600 to-slate-100 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-md flex-col">
        <header className="mb-6 text-center text-white">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/25 bg-white/15 shadow-lg backdrop-blur-sm">
            <ScanLine className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Scan class QR</h1>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-5 text-blue-100">
            Keep the code inside the frame to submit your attendance.
          </p>
        </header>

        <section className="rounded-3xl bg-white p-4 shadow-2xl shadow-blue-950/25 sm:p-5">
          <div className="mb-4 flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Camera className="h-4 w-4 text-blue-600" aria-hidden="true" />
              Camera scanner
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Ready
            </span>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-slate-950 p-1.5 shadow-inner">
            <div id="reader" className="qr-reader w-full overflow-hidden rounded-xl" />
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/75 text-center text-white backdrop-blur-sm">
                <Loader2 className="h-8 w-8 animate-spin text-blue-300" aria-hidden="true" />
                <p className="text-sm font-semibold">Confirming your attendance…</p>
              </div>
            )}
          </div>

          {statusMessage ? (
            <div
              role="status"
              className={`mt-4 flex items-start gap-3 rounded-2xl p-3.5 text-sm font-medium leading-5 ${
                isSuccess
                  ? "bg-emerald-50 text-emerald-800"
                  : isError
                    ? "bg-rose-50 text-rose-800"
                    : "bg-blue-50 text-blue-800"
              }`}
            >
              {isSuccess ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              ) : isError ? (
                <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              ) : (
                <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin" aria-hidden="true" />
              )}
              <span>{statusMessage.replace(/^[✅❌]\s*/, "")}</span>
            </div>
          ) : (
            <p className="mt-4 px-1 text-center text-xs leading-5 text-slate-500">
              Allow camera access when prompted. Your scan is sent securely for teacher approval.
            </p>
          )}
        </section>

        <div className="mt-auto flex items-center justify-center gap-2 pt-6 text-center text-xs font-medium text-blue-100">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Your attendance is verified securely
        </div>
      </div>
    </main>
  );
}
