import { useMemo, useState } from "react";
import { SubscriptionAPI } from "../api/subscription.api";
import { useAuth } from "../context/AuthContext";
import styles from "./PaymentModal.module.css";

const DEMO_CARD = "4242 4242 4242 4242";

function formatCardNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function stripSpaces(value) {
  return value.replace(/\s+/g, "");
}

export default function PaymentModal({ open, onClose }) {
  const { refreshUser } = useAuth();
  const [cardNumber, setCardNumber] = useState("");
  const [cvv, setCvv] = useState("");
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [serverError, setServerError] = useState("");

  const cardDigits = useMemo(() => stripSpaces(cardNumber), [cardNumber]);

  if (!open) return null;

  const canSubmit = status === "idle";

  function resetState() {
    setCardNumber("");
    setCvv("");
    setErrors({});
    setServerError("");
    setStatus("idle");
  }

  function handleClose() {
    if (status === "processing") return;
    resetState();
    onClose?.();
  }

  function handleUseDemoCard() {
    setCardNumber(DEMO_CARD);
    setCvv("123");
    setErrors({});
    setServerError("");
  }

  function validate() {
    const nextErrors = {};
    if (!/^\d{16}$/.test(cardDigits)) {
      nextErrors.cardNumber = "Card number must be 16 digits.";
    }
    if (!/^\d{3}$/.test(cvv)) {
      nextErrors.cvv = "CVV must be 3 digits.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");

    if (!validate()) return;

    setStatus("processing");

    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      await SubscriptionAPI.pay({ cardNumber: cardDigits, cvv });
      setStatus("success");
      await refreshUser?.();

      window.setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setStatus("idle");
      setServerError(err?.response?.data?.error || "Payment failed. Try again.");
    }
  }

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>Demo Payment</h3>
          <button type="button" className={styles.close} onClick={handleClose} aria-label="Close payment modal">
            ×
          </button>
        </div>

        {status === "success" ? (
          <div className={styles.successState}>
            <div className={styles.checkmark}>✓</div>
            <h4>Payment Successful! 🎉</h4>
            <p>Premium activated for 30 days.</p>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.label}>
              Card Number
              <input
                className={styles.input}
                type="text"
                inputMode="numeric"
                maxLength={19}
                placeholder="4242 4242 4242 4242"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              />
              {errors.cardNumber && <span className={styles.error}>{errors.cardNumber}</span>}
            </label>

            <label className={styles.label}>
              CVV
              <input
                className={styles.input}
                type="password"
                inputMode="numeric"
                maxLength={3}
                placeholder="123"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
              />
              {errors.cvv && <span className={styles.error}>{errors.cvv}</span>}
            </label>

            {serverError && <p className={styles.serverError}>{serverError}</p>}

            <div className={styles.actions}>
              <button type="button" className={styles.demoButton} onClick={handleUseDemoCard}>
                Use Demo Card
              </button>
              <button type="submit" className={styles.payButton} disabled={!canSubmit}>
                {status === "processing" ? (
                  <span className={styles.processing}>
                    <span className={styles.spinner} /> Processing payment...
                  </span>
                ) : (
                  "Pay ৳499"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
