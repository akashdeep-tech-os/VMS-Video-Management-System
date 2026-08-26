import { useEffect } from "react";
import { createPortal } from "react-dom";
import { IoClose } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";

function ConfirmDeleteModal({ isOpen, onClose, onConfirm, title, message }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full max-w-md bg-[var(--card-bg)] text-[var(--text-dark)] rounded-2xl sm:rounded-3xl border border-[var(--border-color)] shadow-2xl overflow-hidden"
          >
            <div className="flex justify-between items-center px-5 sm:px-8 py-4 sm:py-6 border-b border-[var(--border-color)]">
              <h2 className="text-base sm:text-lg font-bold text-[var(--text-dark)]">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-dark)] hover:bg-[var(--hover-bg)] transition-colors"
              >
                <IoClose size={20} />
              </button>
            </div>

            <div className="px-5 sm:px-8 py-4 sm:py-6">
              <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                {message}
              </p>
            </div>

            <div className="flex justify-end gap-2 sm:gap-4 px-5 sm:px-8 py-4 sm:py-6 border-t border-[var(--border-color)]">
              <button
                onClick={onClose}
                className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-dark)] hover:bg-[var(--hover-bg)] transition-all text-xs sm:text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="px-6 sm:px-8 py-2 sm:py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg transition-all active:scale-[0.98]"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export default ConfirmDeleteModal;
