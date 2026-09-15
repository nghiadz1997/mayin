"use client";

import React, { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, Download, Printer as PrinterIcon, ExternalLink } from "lucide-react";
import Link from "next/link";

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  printerCode: string;
  printerName: string;
  printerModel: string;
  departmentName: string;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  printerCode,
  printerName,
  printerModel,
  departmentName,
}) => {
  const qrRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = `${origin}/p/${printerCode}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSVG = () => {
    if (!qrRef.current) return;
    const svgElement = qrRef.current.querySelector("svg");
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = `QR_${printerCode}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Mã QR Dán Máy
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Card Area */}
        <div className="p-6 flex flex-col items-center bg-slate-50/50" id="printable-qr-card">
          <div
            ref={qrRef}
            className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center"
          >
            <QRCodeSVG
              value={publicUrl}
              size={180}
              level="H"
              includeMargin={false}
            />
          </div>

          <div className="mt-4 space-y-1">
            <span className="px-2.5 py-1 rounded-md text-sm font-black bg-blue-100 text-blue-800 border border-blue-200 tracking-wider">
              {printerCode}
            </span>
            <p className="text-sm font-bold text-slate-900 mt-1">{printerModel}</p>
            <p className="text-xs text-slate-500">{departmentName}</p>
            <p className="text-[10px] text-slate-400 mt-2">
              Quét QR để xem tình trạng máy & gửi báo hỏng
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-white border-t border-slate-100 flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownloadSVG}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Tải file SVG
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
            >
              <PrinterIcon className="w-3.5 h-3.5" />
              In nhãn QR
            </button>
          </div>

          <Link
            href={`/p/${printerCode}`}
            target="_blank"
            className="text-center text-[11px] font-medium text-blue-600 hover:underline flex items-center justify-center gap-1 mt-1"
          >
            Mở trang quét QR công khai <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};
