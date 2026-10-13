"use client";
import React, { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

import { verifyAndMarkAttendance } from "@/app/actions/attendanceQR"; // Point to your server action

export default function StudentScanPage() {
  const [scanResult, setScanResult] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Hardcoded for testing. Later, you'll get this from the logged-in student's session!
  const currentStudentId = 1; 

  useEffect(() => {
    // 1. Initialize the scanner when the page loads
    const scanner = new Html5QrcodeScanner(
      "reader", 
      { 
        fps: 10,       // Frames per second to check for QR codes
        qrbox: 250     // Size of the scanning box finder
      }, 
      false
    );

    // 2. Define what happens when a QR code is successfully scanned
    async function onScanSuccess(decodedText) {
      // Stop scanner temporarily to prevent multiple rapid submissions
      scanner.clear();
      setIsLoading(true);
      setStatusMessage("Verifying secure QR code with server...");

      // Send the encrypted string straight to your Server Action
      const result = await verifyAndMarkAttendance(decodedText, currentStudentId);

      setIsLoading(false);
      if (result.success) {
        setStatusMessage(`✅ Success: ${result.message}`);
        setScanResult(decodedText);
      } else {
        setStatusMessage(`❌ Error: ${result.error}`);
        // Allow them to rescan after a short delay if it failed
        setTimeout(() => window.location.reload(), 3000);
      }
    }

    function onScanError(errorMessage) {
      // Ignore routine scanning errors (it triggers every frame it doesn't see a code)
    }

    scanner.render(onScanSuccess, onScanError);

    // Cleanup when leaving the page
    return () => {
      scanner.clear().catch((error) => {
        console.error("Failed to clear html5QrcodeScanner. ", error);
      });
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-2">Scan Class QR</h1>
        <p className="text-sm text-gray-500 mb-6">
          Point your camera at the teacher's projector screen to mark your attendance.
        </p>

        {/* The HTML element where the camera feed mounts */}
        <div id="reader" className="w-full overflow-hidden rounded-lg border border-gray-200"></div>

        {/* Status and feedback messages */}
        {isLoading && (
          <p className="mt-4 text-blue-600 font-medium animate-pulse">Processing attendance...</p>
        )}

        {statusMessage && (
          <div className="mt-4 p-3 rounded bg-gray-100 text-sm font-medium">
            {statusMessage}
          </div>
        )}
      </div>
    </div>
  );
}