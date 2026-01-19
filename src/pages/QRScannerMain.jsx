import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { RiLogoutBoxLine, RiQrScan2Line } from "@remixicon/react";
import { QrReader } from "react-qr-reader";
import { API_ENDPOINTS, buildApiUrl } from "../config/api";
import "./QRScannerMain.css";

function QRScannerMain() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [qrStatus, setQrStatus] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState(null);

  // Track if scanning is allowed (prevents race conditions)
  const scanningAllowed = useRef(false);

  // Get admin name and token from sessionStorage
  const adminName = sessionStorage.getItem("admin_name") || "Admin";
  const adminToken = sessionStorage.getItem("admin_token");

  const handleLogout = () => {
    console.log("🚪 Logging out admin...");
    sessionStorage.clear();
    navigate("/");
  };

  // Check QR status when scanResult changes
  useEffect(() => {
    if (scanResult && !scanResult.error) {
      const qrDataToSend = scanResult.qrCodeData || scanResult;

      // Validate that we have the required fields
      if (!qrDataToSend.orderId || !qrDataToSend.attendeeName) {
        console.error("❌ Invalid QR data structure:", qrDataToSend);
        setQrStatus({
          loading: false,
          isUsed: null,
          message: "❌ Invalid QR code data. Missing required fields.",
        });
        return;
      }

      checkQRStatus(qrDataToSend);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanResult]);

  const checkQRStatus = async (qrCodeData) => {
  console.log("🔍 Checking QR status...", qrCodeData);
  setQrStatus({ loading: true, isUsed: null, message: null });

  try {
    const qrDataString = JSON.stringify(qrCodeData);
    console.log("📤 Sending QR data to /paneermoms/qr/get:", qrDataString);

    const response = await fetch(buildApiUrl("/paneermoms/qr/get"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ qrData: qrDataString }),
    });

    if (response.status === 401) {
      setQrStatus({
        loading: false,
        isUsed: null,
        message: "🔒 The admin session has expired. Please login again.",
      });
      return;
    }

    if (response.status === 404) {
      setQrStatus({
        loading: false,
        isUsed: null,
        message: "❌ Invalid QR.",
      });
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("📥 QR status response:", data);

    if (data.status === "success") {
      const isUsed = data.data.isUsed;
      setQrStatus({
        loading: false,
        isUsed: isUsed,
        message: isUsed
          ? "⚠️ This QR code has already been used!"
          : "✅ QR code is valid and ready to be used",
      });
      console.log(`✅ QR Status: isUsed = ${isUsed}`);
    } else {
      setQrStatus({
        loading: false,
        isUsed: null,
        message: `❌ ${data.message || "Failed to check QR status"}`,
      });
      console.error("❌ Failed to get QR status:", data);
    }
  } catch (error) {
    console.error("💥 Error checking QR status:", error);
    setQrStatus({
      loading: false,
      isUsed: null,
      message:
        "❌ Network error. Please check your connection and try again.",
    });
  }
};

  const handleVerifyQR = async () => {
    if (!scanResult) {
      console.error("❌ No QR data to verify");
      return;
    }

    const qrDataToSend = scanResult.qrCodeData || scanResult;
    console.log("🔐 Verifying QR code...", qrDataToSend);
    setVerifying(true);
    setVerifyMessage(null);

    try {
      const qrDataString = JSON.stringify(qrDataToSend);
      console.log("📤 Sending QR data to /paneermoms/qr/verify:", qrDataString);

      const response = await fetch(buildApiUrl(API_ENDPOINTS.ADMIN_QR_VERIFY), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ qrData: qrDataString }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("📥 Verification response:", data);

      if (data.status === "success") {
        setVerifyMessage({
          type: "success",
          text: "✅ User verified successfully! Entry granted.",
        });
        // Update QR status to used
        setQrStatus({
          loading: false,
          isUsed: true,
          message: "✅ QR code has been marked as used",
        });
        console.log("✅ QR verified successfully");
      } else {
        setVerifyMessage({
          type: "error",
          text: data.message || "❌ QR code has already been used",
        });
        console.error("❌ Verification failed:", data.message);
      }
    } catch (error) {
      console.error("💥 Error verifying QR:", error);
      setVerifyMessage({
        type: "error",
        text: "❌ Network error. Please try again.",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleScanAnother = () => {
    console.log("🔄 Hard refresh (Ctrl+F5 equivalent) - preserving session...");

    // Add cache-busting timestamp to force fresh load
    // This keeps sessionStorage intact
    const currentUrl = window.location.href.split("?")[0];
    window.location.href = currentUrl + "?t=" + new Date().getTime();
  };

  const handleStartScanning = () => {
    console.log("📷 Starting camera for QR scan...");

    // Enable scanning AFTER a longer delay to ensure camera is ready
    // This prevents immediate re-scanning of the same QR code
    setTimeout(() => {
      scanningAllowed.current = true;
      console.log("✅ Scanning enabled - ready for new scan");
    }, 1000); // Increased to 1 second

    setScanning(true);
  };

  // Handler for QR scan result - wrapped in useCallback for stability
  const handleScanResult = useCallback((result) => {
    // CRITICAL: Check if scanning is allowed using ref (synchronous check)
    if (!scanningAllowed.current) {
      console.log("🚫 Scan ignored - scanning not allowed");
      return; // Ignore all callbacks when scanning is not allowed
    }

    // Additional check: ignore if result is null or undefined
    if (!result) {
      return;
    }

    // Immediately disable further scans
    scanningAllowed.current = false;

    console.log("📸 QR detected, processing...");

    try {
      const parsed = JSON.parse(result.getText());
      console.log("📱 QR Scanned successfully:", parsed);

      // Basic validation
      if (!parsed || typeof parsed !== "object") {
        console.error("❌ Invalid QR: Not a valid JSON object");
        setScanResult({ error: "Invalid QR code format." });
        setScanning(false);
        return;
      }

      setScanResult(parsed);
      setScanning(false);
    } catch (err) {
      console.error("❌ Invalid QR format - JSON parse error:", err);
      setScanResult({ error: "Invalid QR code format. Unable to parse data." });
      setScanning(false);
    }
  }, []);

  return (
    <div className="qr-main-bg">
      <header className="admin-dashboard-header">
        <div>
          <h1 className="admin-dashboard-title">🎯 Parsec'25 Admin</h1>
          <div
            className="text-sm text-gray-400"
            style={{ marginTop: "0.25rem" }}
          >
            Welcome back, {adminName}
          </div>
        </div>
        <button onClick={handleLogout} className="admin-logout-btn">
          <RiLogoutBoxLine size={16} />
          Logout
        </button>
      </header>

      <main className="qr-main-content">
        {/* Only show Scan QR button when not scanning AND no result */}
        {!scanning && !scanResult && (
          <button className="scan-qr-btn" onClick={handleStartScanning}>
            <RiQrScan2Line size={24} style={{ marginRight: 8 }} />
            Scan QR
          </button>
        )}

        {/* Only show scanner when scanning is true AND no result yet */}
        {scanning && !scanResult && (
          <div className="qr-modal">
            <div className="qr-modal-content">
              <div className="qr-reader-wrapper">
                <QrReader
                  constraints={{
                    facingMode: "environment",
                  }}
                  onResult={handleScanResult}
                  videoId="video"
                  scanDelay={300}
                  videoStyle={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                  containerStyle={{
                    width: "100%",
                    paddingTop: "100%",
                    position: "relative",
                  }}
                />
              </div>
              <button
                className="close-modal-btn"
                onClick={() => {
                  console.log("❌ Scan cancelled");
                  scanningAllowed.current = false;
                  setScanning(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Show results when we have scanResult */}
        {scanResult && (
          <div className="scan-result-card">
            <h2 className="scan-result-title">Scan Result</h2>
            {scanResult.error ? (
              <div className="scan-error">{scanResult.error}</div>
            ) : (
              <>
                <div className="scan-fields">
                  {(scanResult.qrCodeData
                    ? Object.entries(scanResult.qrCodeData)
                    : Object.entries(scanResult)
                  )
                    .filter(([key]) => key !== "error")
                    .map(([key, value]) => (
                      <div className="scan-field" key={key}>
                        <span className="scan-field-label">{key}:</span>
                        <span className="scan-field-value">
                          {typeof value === "object"
                            ? JSON.stringify(value)
                            : String(value)}
                        </span>
                      </div>
                    ))}
                </div>

                {qrStatus && (
                  <div
                    className={`qr-status-message ${
                      qrStatus.isUsed === true
                        ? "status-used"
                        : qrStatus.isUsed === false
                          ? "status-valid"
                          : "status-error"
                    }`}
                  >
                    {qrStatus.loading ? (
                      <div className="status-loading">
                        🔄 Checking QR status...
                      </div>
                    ) : (
                      <div>{qrStatus.message}</div>
                    )}
                  </div>
                )}

                {qrStatus &&
                  !qrStatus.loading &&
                  qrStatus.isUsed === false &&
                  !verifyMessage && (
                    <button
                      className="verify-qr-btn"
                      onClick={handleVerifyQR}
                      disabled={verifying}
                    >
                      {verifying ? "🔄 Verifying..." : "🔐 Verify QR - Mark as Used"}
                    </button>
                  )}

                {verifyMessage && (
                  <div className={`verify-message ${verifyMessage.type}`}>
                    {verifyMessage.text}
                  </div>
                )}
              </>
            )}

            <button className="scan-again-btn" onClick={handleScanAnother}>
              Scan Another
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default QRScannerMain;
