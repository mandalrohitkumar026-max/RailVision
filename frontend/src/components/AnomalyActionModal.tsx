import React, { useState } from "react";
import { X, AlertOctagon, CheckCircle2 } from "lucide-react";
import { AnomalyItem } from "../types";
import { StatusBadge } from "./StatusBadge";

interface AnomalyModalProps {
  anomaly: AnomalyItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (
    anomalyId: string,
    action: "ACKNOWLEDGE" | "RESOLVE" | "ADD_NOTE",
    note?: string
  ) => Promise<void>;
}

export const AnomalyActionModal: React.FC<AnomalyModalProps> = ({
  anomaly,
  isOpen,
  onClose,
  onAction
}) => {
  const [operatorNote, setOperatorNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !anomaly) return null;

  const handleAction = async (action: "ACKNOWLEDGE" | "RESOLVE" | "ADD_NOTE") => {
    setIsSubmitting(true);
    try {
      await onAction(anomaly.id, action, operatorNote);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setOperatorNote("");
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-lg border border-slate-300 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            <span className="font-semibold text-sm tracking-wide">
              Investigate Operational Anomaly: {anomaly.id}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Anomaly Details */}
        <div className="p-5 space-y-4 text-xs">
          {success ? (
            <div className="py-6 text-center text-emerald-700 flex flex-col items-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
              <p className="text-sm font-semibold">Anomaly Action Logged Successfully</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded border border-slate-200">
                <div>
                  <p className="text-slate-500 text-[11px]">Entity</p>
                  <p className="font-semibold text-slate-900 text-sm">
                    {anomaly.entity_name} ({anomaly.entity_id})
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 text-[11px] mb-0.5">Severity</p>
                  <StatusBadge type="severity" value={anomaly.severity} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded border border-slate-200">
                <div>
                  <p className="text-slate-500 text-[11px]">Metric</p>
                  <p className="font-semibold text-slate-800">{anomaly.metric}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[11px]">Expected</p>
                  <p className="font-mono text-slate-700">{anomaly.expected_value}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[11px]">Observed (Deviation)</p>
                  <p className="font-mono font-bold text-rose-700">
                    {anomaly.observed_value} ({anomaly.deviation_pct})
                  </p>
                </div>
              </div>

              <div>
                <p className="text-slate-500 text-[11px] mb-1">Details & Context</p>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200 leading-relaxed">
                  {anomaly.details || "No additional sensor logs provided."}
                </p>
              </div>

              {anomaly.operator_note && (
                <div>
                  <p className="text-slate-500 text-[11px] mb-1">Current Operator Note</p>
                  <p className="text-slate-800 bg-amber-50 p-2 rounded border border-amber-200 font-mono text-[11px]">
                    {anomaly.operator_note}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Add / Update Operational Note
                </label>
                <textarea
                  value={operatorNote}
                  onChange={(e) => setOperatorNote(e.target.value)}
                  rows={2}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-800 focus:outline-hidden focus:border-slate-500"
                  placeholder="Enter dispatch notes, track repair order, or clearing update..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 font-medium transition"
                >
                  Close
                </button>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleAction("ACKNOWLEDGE")}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium transition shadow-xs"
                  >
                    Acknowledge
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleAction("RESOLVE")}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium transition shadow-xs"
                  >
                    Mark Resolved
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
