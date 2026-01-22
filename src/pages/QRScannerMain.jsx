import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  RiLogoutBoxLine,
  RiQrScan2Line,
  RiMailSendLine,
} from "@remixicon/react";
import { QrReader } from "react-qr-reader";
import { API_ENDPOINTS, buildApiUrl } from "../config/api";
import "./QRScannerMain.css";
import logger from "../utils/logger";

function QRScannerMain() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [qrStatus, setQrStatus] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState(null);

  // Send Pass Modal State
  const [showSendPassModal, setShowSendPassModal] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [sendingPass, setSendingPass] = useState(false);
  const [sendPassMessage, setSendPassMessage] = useState(null);

  // Track if scanning is allowed (prevents race conditions)
  const scanningAllowed = useRef(false);

  // Get admin name and token from sessionStorage
  const adminName = sessionStorage.getItem("admin_name") || "Admin";
  const adminToken = sessionStorage.getItem("admin_token");

  const handleLogout = () => {
    logger.log("🚪 Logging out admin...");
    sessionStorage.clear();
    navigate("/");
  };

  // Check QR status when scanResult changes
  useEffect(() => {
    if (scanResult && !scanResult.error) {
      const qrDataToSend = scanResult.qrCodeData || scanResult;

      // Validate that we have the required fields
      if (!qrDataToSend.orderId || !qrDataToSend.attendeeName) {
        logger.error("❌ Invalid QR data structure:", qrDataToSend);
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
    logger.log("🔍 Checking QR status...", qrCodeData);
    setQrStatus({ loading: true, isUsed: null, message: null });

    try {
      const qrDataString = JSON.stringify(qrCodeData);
      // logger.log("📤 Sending QR data to /paneermoms/qr/get:", qrDataString);

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
          message: "🔒 The admin session has expired. Redirecting to login...",
        });
        setTimeout(() => {
          sessionStorage.clear();
          navigate("/");
        }, 1800);
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
      logger.log("📥 QR status response:", data);

      if (data.status === "success") {
        const isUsed = data.data.isUsed;
        setQrStatus({
          loading: false,
          isUsed: isUsed,
          message: isUsed
            ? "⚠️ This QR code has already been used!"
            : "✅ QR code is valid and ready to be used",
        });
        logger.log(`✅ QR Status: isUsed = ${isUsed}`);
      } else {
        setQrStatus({
          loading: false,
          isUsed: null,
          message: `❌ ${data.message || "Failed to check QR status"}`,
        });
        logger.error("❌ Failed to get QR status:", data);
      }
    } catch (error) {
      logger.error("💥 Error checking QR status:", error);
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
      logger.error("❌ No QR data to verify");
      return;
    }

    const qrDataToSend = scanResult.qrCodeData || scanResult;
    logger.log("🔐 Verifying QR code...", qrDataToSend);
    setVerifying(true);
    setVerifyMessage(null);

    try {
      const qrDataString = JSON.stringify(qrDataToSend);
      // logger.log("📤 Sending QR data to /paneermoms/qr/verify:", qrDataString);

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
      logger.log("📥 Verification response:", data);

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
        logger.log("✅ QR verified successfully");
      } else {
        setVerifyMessage({
          type: "error",
          text: data.message || "❌ QR code has already been used",
        });
        logger.error("❌ Verification failed:", data.message);
      }
    } catch (error) {
      logger.error("💥 Error verifying QR:", error);
      setVerifyMessage({
        type: "error",
        text: "❌ Network error. Please try again.",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleScanAnother = () => {
    logger.log("🔄 Hard refresh (Ctrl+F5 equivalent) - preserving session...");
    const currentUrl = window.location.href.split("?")[0];
    window.location.href = currentUrl + "?t=" + new Date().getTime();
  };

  const handleStartScanning = () => {
    logger.log("📷 Starting camera for QR scan...");
    setTimeout(() => {
      scanningAllowed.current = true;
      logger.log("✅ Scanning enabled - ready for new scan");
    }, 1000);
    setScanning(true);
  };

  // Send Pass Functions
  const handleOpenSendPassModal = () => {
    setShowSendPassModal(true);
    setEmailInput("");
    setSendPassMessage(null);
  };

  const handleCloseSendPassModal = () => {
    setShowSendPassModal(false);
    setEmailInput("");
    setSendPassMessage(null);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendPass = async () => {
    logger.log("📧 Sending pass to email:", emailInput);

    // Validate email
    if (!emailInput.trim()) {
      setSendPassMessage({
        type: "error",
        text: "❌ Please enter an email address",
      });
      return;
    }

    if (!validateEmail(emailInput)) {
      setSendPassMessage({
        type: "error",
        text: "❌ Please enter a valid email address",
      });
      return;
    }

    setSendingPass(true);
    setSendPassMessage(null);

    try {
      // logger.log("📤 Sending request to /paneermoms/give-pass");

      const response = await fetch(buildApiUrl("/paneermoms/give-pass"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ email: emailInput.trim() }),
      });

      // Handle 401 Unauthorized
      if (response.status === 401) {
        setSendPassMessage({
          type: "error",
          text: "🔒 The admin session has expired. Redirecting to login...",
        });
        setSendingPass(false);
        setTimeout(() => {
          sessionStorage.clear();
          navigate("/");
        }, 1800);
        return;
      }

      // Handle 400 Bad Request
      if (response.status === 400) {
        const data = await response.json();
        setSendPassMessage({
          type: "error",
          text: `❌ ${data.message || "Bad request. Please check the email."}`,
        });
        setSendingPass(false);
        return;
      }

      // Handle 404 Not Found
      if (response.status === 404) {
        const data = await response.json();
        setSendPassMessage({
          type: "error",
          text: `❌ ${data.message || "User not found."}`,
        });
        setSendingPass(false);
        return;
      }

      // Handle other errors
      if (!response.ok) {
        setSendPassMessage({
          type: "error",
          text: `❌ Unexpected error (${response.status}). Please try again.`,
        });
        setSendingPass(false);
        return;
      }

      // Success (201 or status: "success")
      const data = await response.json();
      if (response.status === 201 || data.status === "success") {
        setSendPassMessage({
          type: "success",
          text: `✅ Free pass issued successfully to ${emailInput}`,
        });
        logger.log("✅ Pass sent successfully");
        logger.log("📋 Order ID:", data.data?.orderIdShort);

        // Close modal after 2 seconds
        setTimeout(() => {
          handleCloseSendPassModal();
        }, 2000);
      } else {
        // Fallback for any other error
        setSendPassMessage({
          type: "error",
          text: data.message || "❌ Failed to send pass",
        });
        logger.error("❌ Send pass failed:", data.message);
      }
    } catch (error) {
      logger.error("💥 Error sending pass:", error);
      setSendPassMessage({
        type: "error",
        text: "❌ Network error. Please try again.",
      });
    } finally {
      setSendingPass(false);
    }
  };

  // Handler for QR scan result
  const handleScanResult = useCallback((result) => {
    if (!scanningAllowed.current) {
      logger.log("🚫 Scan ignored - scanning not allowed");
      return;
    }

    if (!result) {
      return;
    }

    scanningAllowed.current = false;
    logger.log("📸 QR detected, processing...");

    try {
      const parsed = JSON.parse(result.getText());
      logger.log("📱 QR Scanned successfully:", parsed);

      if (!parsed || typeof parsed !== "object") {
        logger.error("❌ Invalid QR: Not a valid JSON object");
        setScanResult({ error: "Invalid QR code format." });
        setScanning(false);
        return;
      }

      setScanResult(parsed);
      setScanning(false);
    } catch (err) {
      logger.error("❌ Invalid QR format - JSON parse error:", err);
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
        {/* Main Buttons - Only show when not scanning AND no result */}
        {!scanning && !scanResult && (
          <div className="main-actions">
            <button className="scan-qr-btn" onClick={handleStartScanning}>
              <RiQrScan2Line size={24} style={{ marginRight: 8 }} />
              Scan QR
            </button>

            <button className="send-pass-btn" onClick={handleOpenSendPassModal}>
              <RiMailSendLine size={24} style={{ marginRight: 8 }} />
              Send Pass
            </button>
          </div>
        )}

        {/* QR Scanner Modal */}
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
                  logger.log("❌ Scan cancelled");
                  scanningAllowed.current = false;
                  setScanning(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Send Pass Modal */}
        {showSendPassModal && (
          <div className="qr-modal">
            <div className="send-pass-modal-content">
              <h2 className="modal-title">📧 Send Pass to Email</h2>
              <p className="modal-subtitle">
                Enter the recipient's email address
              </p>

              <input
                type="email"
                className="email-input"
                placeholder="example@email.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !sendingPass) {
                    handleSendPass();
                  }
                }}
                disabled={sendingPass}
              />

              {sendPassMessage && (
                <div className={`send-pass-message ${sendPassMessage.type}`}>
                  {sendPassMessage.text}
                </div>
              )}

              <div className="modal-actions">
                <button
                  className="send-email-btn"
                  onClick={handleSendPass}
                  disabled={sendingPass}
                >
                  {sendingPass ? "📤 Sending..." : "📨 Send Pass"}
                </button>
                <button
                  className="cancel-modal-btn"
                  onClick={handleCloseSendPassModal}
                  disabled={sendingPass}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scan Results */}
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
                      {verifying
                        ? "🔄 Verifying..."
                        : "🔐 Verify QR - Mark as Used"}
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
