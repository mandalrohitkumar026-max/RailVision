import React, { useState } from "react";
import { X, Layers, AlertCircle, CheckCircle2 } from "lucide-react";

interface CapacityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    train_number: string;
    travel_date: string;
    recommended_coaches: number;
    coach_type: string;
    reason: string;
    priority: string;
  }) => Promise<void>;
  initialTrainNumber?: string;
  initialDate?: string;
  defaultCoaches?: number;
  defaultReason?: string;
}

export const CapacityRequestModal: React.FC<CapacityModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialTrainNumber = "12951",
  initialDate = "2026-09-05",
  defaultCoaches = 2,
  defaultReason = "Demand forecast exceeds operational capacity threshold (>105%)."
}) => {
  const [trainNumber, setTrainNumber] = useState(initialTrainNumber);
  const [travelDate, setTravelDate] = useState(initialDate);
  const [coaches, setCoaches] = useState(defaultCoaches);
  const [coachType, setCoachType] = useState("3A (AC 3-Tier)");
  const [priority, setPriority] = useState("HIGH");
  const [reason, setReason] = useState(defaultReason);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        train_number: trainNumber,
        travel_date: travelDate,
        recommended_coaches: Number(coaches),
        coach_type: coachType,
        reason: reason,
        priority: priority
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
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
            <Layers className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-sm tracking-wide">
              Create Coach Capacity Augmentation Request
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notice */}
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 flex items-start space-x-2.5 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <p>
            <strong>Operational Rule:</strong> ML capacity recommendations require official
            zonal dispatch approval before rake yard marshalling orders are issued.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {success ? (
            <div className="py-8 text-center text-emerald-700 flex flex-col items-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
              <p className="text-sm font-semibold">Capacity Request Submitted Successfully</p>
              <p className="text-slate-500 text-xs mt-1">Routed to Zonal Traffic Manager for review.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Train Number
                  </label>
                  <input
                    type="text"
                    value={trainNumber}
                    onChange={(e) => setTrainNumber(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-slate-800 focus:outline-hidden focus:border-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Travel Date
                  </label>
                  <input
                    type="date"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-slate-800 focus:outline-hidden focus:border-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Recommended Coaches
                  </label>
                  <select
                    value={coaches}
                    onChange={(e) => setCoaches(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-800 focus:outline-hidden focus:border-slate-500"
                  >
                    <option value={1}>+1 Coach</option>
                    <option value={2}>+2 Coaches</option>
                    <option value={3}>+3 Coaches</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Coach Class / Type
                  </label>
                  <select
                    value={coachType}
                    onChange={(e) => setCoachType(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-800 focus:outline-hidden focus:border-slate-500"
                  >
                    <option value="3A (AC 3-Tier)">3A (AC 3-Tier)</option>
                    <option value="2A (AC 2-Tier)">2A (AC 2-Tier)</option>
                    <option value="SL (Sleeper)">SL (Sleeper)</option>
                    <option value="CC (AC Chair Car)">CC (AC Chair Car)</option>
                    <option value="3A + SL Hybrid">3A + SL Hybrid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Dispatch Priority
                </label>
                <div className="flex space-x-3">
                  {["NORMAL", "HIGH", "URGENT"].map((p) => (
                    <label key={p} className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="priority"
                        value={p}
                        checked={priority === p}
                        onChange={() => setPriority(p)}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className={`font-semibold ${p === "URGENT" ? "text-rose-700" : "text-slate-700"}`}>
                        {p}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Operational Justification & Reason
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  required
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-800 focus:outline-hidden focus:border-slate-500"
                  placeholder="Explain why capacity augmentation is required..."
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-medium shadow-xs transition"
                >
                  {isSubmitting ? "Submitting Request..." : "Submit Capacity Request"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
