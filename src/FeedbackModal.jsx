import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";

const FeedbackModal = ({
  show,
  onHide,
  feedback,
  setFeedback,
  trackingNumber,
  onFeedbackSubmitted,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [disabled, setDisabled] = useState(false);

  // Toast state
  const [toast, setToast] = useState({
    show: false,
    message: "",
    variant: "danger",
  });

  // Function to show toast
  const showToast = (message, variant = "danger") => {
    setToast({ show: true, message, variant });
    setTimeout(() => {
      setToast({ show: false, message: "", variant });
    }, 3000);
  };

  // Reset form when modal opens
  useEffect(() => {
    if (show && !disabled) {
      setFeedback({ rating: 0, comments: "" });
    }
  }, [show, setFeedback, disabled]);

  const handleSubmitFeedback = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const response = await fetch(
        "https://delivery-api.mooo.info/customer/save_feedback.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tracking_number: trackingNumber,
            rating: feedback.rating,
            comments: feedback.comments,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        showToast("Thank you for your feedback!", "success");
        setDisabled(true);
        onHide();
        if (typeof onFeedbackSubmitted === "function") {
          onFeedbackSubmitted();
        }
      } else {
        showToast(data.message || "Failed to save feedback.", "danger");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      showToast("Server error. Please try again later.", "danger");
    } finally {
      setSubmitting(false);
    }
  };

  // Map rating to icon and color
  const iconMap = {
    1: { icon: "bi-emoji-frown-fill", color: "#8B0000" }, // Dark Red
    2: { icon: "bi-emoji-neutral-fill", color: "#FF4500" }, // Orange Red
    3: { icon: "bi-emoji-neutral", color: "#FFD700" }, // Gold
    4: { icon: "bi-emoji-smile-fill", color: "#9ACD32" }, // Yellow Green
    5: { icon: "bi-emoji-laughing-fill", color: "#28a745" }, // Green
  };

  return (
    <>
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`position-fixed start-50 translate-middle-x`}
          style={{
            top: "20px",
            zIndex: 2000,
            background:
              toast.variant === "danger"
                ? "#dc3545"
                : toast.variant === "warning"
                ? "#ffc107"
                : toast.variant === "success"
                ? "#28a745"
                : "#0d6efd",
            color: toast.variant === "warning" ? "black" : "white",
            padding: "14px 22px",
            borderRadius: "14px",
            fontWeight: "600",
            minWidth: "260px",
            textAlign: "center",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            transition: "all 0.4s ease",
            opacity: toast.show ? 1 : 0,
            transform: toast.show
              ? "translate(-50%, 0px)"
              : "translate(-50%, -40px)",
          }}
        >
          {toast.message}
        </div>
      )}

      <Modal
        show={show}
        onHide={onHide}
        centered
        contentClassName="border-0 shadow-lg rounded-4"
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title className="fw-bold">
            Customer Satisfaction Survey
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="bg-light">
          <p className="text-muted small mb-4 text-center">
            Please rate your overall delivery experience.
          </p>

          {/* Icon Rating */}
          <div className="d-flex justify-content-center mb-4">
            {[1, 2, 3, 4, 5].map((value) => (
              <i
                key={value}
                className={`bi ${iconMap[value].icon} fs-1 mx-2`}
                style={{
                  cursor: disabled ? "not-allowed" : "pointer",
                  color:
                    feedback.rating === value
                      ? iconMap[value].color
                      : "#6c757d",
                  transition: "transform 0.2s, color 0.2s",
                  transform:
                    feedback.rating === value ? "scale(1.3)" : "scale(1)",
                }}
                onClick={() =>
                  !disabled && setFeedback({ ...feedback, rating: value })
                }
              ></i>
            ))}
          </div>

          {/* Comment */}
          <Form.Group>
            <Form.Label className="fw-semibold">Additional Comments</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Share your feedback..."
              value={feedback.comments}
              onChange={(e) =>
                !disabled &&
                setFeedback({ ...feedback, comments: e.target.value })
              }
              disabled={disabled}
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={onHide}
            disabled={disabled}
          >
            Cancel
          </Button>
          <Button
            variant="success"
            disabled={disabled || !feedback.rating || submitting}
            onClick={handleSubmitFeedback}
          >
            {submitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default FeedbackModal;
