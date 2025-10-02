import React from "react";
import { Modal, Button, Form } from "react-bootstrap";

const FeedbackModal = ({
  show,
  onHide,
  feedback,
  setFeedback,
  trackingNumber,
}) => {
  const handleSubmitFeedback = async () => {
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
        onHide();
      } else {
        alert(data.message || "Failed to save feedback.");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
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
              style={{ cursor: "pointer" }}
              onClick={() => setFeedback({ ...feedback, rating: star })}
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
              setFeedback({ ...feedback, comments: e.target.value })
            }
          />
        </Form.Group>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button
          variant="success"
          disabled={!feedback.rating}
          onClick={handleSubmitFeedback}
        >
          Submit Feedback
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default FeedbackModal;
