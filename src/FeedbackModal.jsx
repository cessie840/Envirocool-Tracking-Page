import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";

const FeedbackModal = ({
  show,
  onHide,
  feedback,
  setFeedback,
  trackingNumber,
  onFeedbackSubmitted, // parent callback
}) => {
  const [submitting, setSubmitting] = useState(false); // prevent double clicks
  const [disabled, setDisabled] = useState(false); // disable modal after submission

  // Reset form when modal opens
  useEffect(() => {
    if (show && !disabled) {
      setFeedback({ rating: 0, comments: "" });
    }
  }, [show, setFeedback, disabled]);

  const handleSubmitFeedback = async () => {
    if (submitting) return; // prevent double submission
    setSubmitting(true);

    try {
      const response = await fetch(
        "http://localhost/DeliveryTrackingSystem/save_feedback.php",
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
        alert("Thank you for your feedback!");
        setDisabled(true); // disable modal after submission
        onHide();
        if (typeof onFeedbackSubmitted === "function") {
          onFeedbackSubmitted(); // notify parent
        }
      } else {
        alert(data.message || "Failed to save feedback.");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
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

        {/* Stars */}
        <div className="d-flex justify-content-center mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <i
              key={star}
              className={`bi ${
                feedback.rating >= star
                  ? "bi-star-fill text-warning"
                  : "bi-star"
              } fs-1 mx-2`}
              style={{ cursor: disabled ? "not-allowed" : "pointer" }}
              onClick={() =>
                !disabled && setFeedback({ ...feedback, rating: star })
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
  );
};

export default FeedbackModal;
