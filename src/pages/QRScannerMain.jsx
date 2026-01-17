// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { RiLogoutBoxLine, RiQrScan2Line } from "@remixicon/react";
// import { QrReader } from "react-qr-reader";
// import "./QRScannerMain.css";

// function QRScannerMain() {
//   const navigate = useNavigate();
//   const [scanning, setScanning] = useState(false);
//   const [scanResult, setScanResult] = useState(null);

//   // Get admin name from sessionStorage
//   const adminName = sessionStorage.getItem("admin_name") || "Admin";

//   const handleLogout = () => {
//     sessionStorage.clear();
//     navigate("/");
//   };

// //   const handleScan = (data) => {
// //     if (data) {
// //       try {
// //         const parsed = JSON.parse(data);
// //         setScanResult(parsed);
// //       } catch {
// //         setScanResult({ error: "Invalid QR code format." });
// //       }
// //       setScanning(false);
// //     }
// //   };

// //   const handleError = (err) => {
// //     setScanResult({ error: "Camera error or permission denied." });
// //     setScanning(false);
// //   };

//   return (
//     <div className="qr-main-bg">
//       <header className="admin-dashboard-header">
//         <div>
//           <h1 className="admin-dashboard-title">🎯 Parsec'25 Admin</h1>
//           <div
//             className="text-sm text-gray-400"
//             style={{ marginTop: "0.25rem" }}
//           >
//             Welcome back, {adminName}
//           </div>
//         </div>
//         <button onClick={handleLogout} className="admin-logout-btn">
//           <RiLogoutBoxLine size={16} />
//           Logout
//         </button>
//       </header>

//       <main className="qr-main-content">
//         {!scanning && !scanResult && (
//           <button className="scan-qr-btn" onClick={() => setScanning(true)}>
//             <RiQrScan2Line size={24} style={{ marginRight: 8 }} />
//             Scan QR
//           </button>
//         )}

//         {scanning && (
//           <div className="qr-modal">
//             <div className="qr-modal-content">
//               <QrReader
//                 constraints={{ }}
//                 onResult={(result, error) => {
//                   if (!!result) {
//                     try {
//                       const parsed = JSON.parse(result.getText());
//                       setScanResult(parsed);
//                     } catch {
//                       setScanResult({ error: "Invalid QR code format." });
//                     }
//                     setScanning(false);
//                   } else if (error) {
//                     // Optionally handle errors here
//                   }
//                 }}
//                 style={{ width: "100%" }}
//               />
//               <button
//                 className="close-modal-btn"
//                 onClick={() => setScanning(false)}
//               >
//                 Cancel
//               </button>
//             </div>
//           </div>
//         )}

//         {scanResult && (
//           <div className="scan-result-card">
//             <h2 className="scan-result-title">Scan Result</h2>
//             {scanResult.error ? (
//               <div className="scan-error">{scanResult.error}</div>
//             ) : (
//               <div className="scan-fields">
//                 {Object.entries(scanResult).map(([key, value]) => (
//                   <div className="scan-field" key={key}>
//                     <span className="scan-field-label">{key}:</span>
//                     <span className="scan-field-value">{value}</span>
//                   </div>
//                 ))}
//               </div>
//             )}
//             <button
//               className="scan-again-btn"
//               onClick={() => {
//                 setScanResult(null);
//                 setScanning(false);
//               }}
//             >
//               Scan Another
//             </button>
//           </div>
//         )}
//       </main>
//     </div>
//   );
// }

// export default QRScannerMain;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RiLogoutBoxLine, RiQrScan2Line } from "@remixicon/react";
import { QrReader } from "react-qr-reader";
import "./QRScannerMain.css";

function QRScannerMain() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // Get admin name from sessionStorage
  const adminName = sessionStorage.getItem("admin_name") || "Admin";

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/");
  };

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
        {!scanning && !scanResult && (
          <button className="scan-qr-btn" onClick={() => setScanning(true)}>
            <RiQrScan2Line size={24} style={{ marginRight: 8 }} />
            Scan QR
          </button>
        )}

        {scanning && (
          <div className="qr-modal">
            <div className="qr-modal-content">
              <div className="qr-reader-wrapper">
                <QrReader
                  constraints={{
                    facingMode: "environment", // Use back camera on mobile
                  }}
                  onResult={(result, error) => {
                    if (!!result) {
                      try {
                        const parsed = JSON.parse(result.getText());
                        setScanResult(parsed);
                      } catch {
                        setScanResult({ error: "Invalid QR code format." });
                      }
                      setScanning(false);
                    }
                  }}
                  videoId="video"
                  scanDelay={300}
                  videoStyle={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain", // Changed from 'cover' to 'contain'
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
                onClick={() => setScanning(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {scanResult && (
          <div className="scan-result-card">
            <h2 className="scan-result-title">Scan Result</h2>
            {scanResult.error ? (
              <div className="scan-error">{scanResult.error}</div>
            ) : (
              <div className="scan-fields">
                {Object.entries(scanResult).map(([key, value]) => (
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
            )}
            <button
              className="scan-again-btn"
              onClick={() => {
                setScanResult(null);
                setScanning(false);
              }}
            >
              Scan Another
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default QRScannerMain;
