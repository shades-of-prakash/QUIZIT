import React from "react";

type SubmitConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const SubmitConfirmModal: React.FC<SubmitConfirmModalProps> = ({
  open,
  onClose,
  onConfirm,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
        <h2 className="text-lg font-semibold mb-4">Confirm Submission</h2>
        <p className="text-gray-700 mb-6">
          You still have time left. Are you sure you want to submit the quiz?
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitConfirmModal;
