import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Modal, Button, Spinner, Form } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for Leaflet marker icon
const customMarker = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const Customer = () => {
  const { trackingNumber } = useParams();

  const [deliveryDetails, setDeliveryDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState({
    rating: 0,
    comments: "",
  });
  const [rating, setRating] = useState(5);

  // Map location
  const [location, setLocation] = useState(null);

  // Fetch delivery details
  useEffect(() => {
    const fetchDeliveryDetails = async () => {
      try {
        const response = await fetch(
          "http://localhost/DeliveryTrackingSystem/get_delivery_by_tracking.php",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tracking_number: trackingNumber }),
          }
        );

        const data = await response.json();

        if (data.success) {
          setDeliveryDetails(data);

          if (data.transaction.latitude && data.transaction.longitude) {
            setLocation({
              lat: parseFloat(data.transaction.latitude),
              lng: parseFloat(data.transaction.longitude),
            });
          }
        } else {
          alert(data.message || "Tracking number not found.");
        }
      } catch (error) {
        console.error("Error fetching delivery details:", error);
        alert("Server error. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveryDetails();
  }, [trackingNumber]);

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center min-vh-100"
        style={{ background: "linear-gradient(135deg, #e3f2fd, #bbdefb)" }}
      >
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!deliveryDetails) {
    return (
      <div
        className="d-flex justify-content-center align-items-center min-vh-100"
        style={{ background: "linear-gradient(135deg, #e3f2fd, #bbdefb)" }}
      >
        <h5 className="text-danger">
          No details found for this tracking number.
        </h5>
      </div>
    );
  }

  const { transaction, items } = deliveryDetails;

  const handleSubmitFeedback = async () => {
    try {
      const response = await fetch(
        "http://localhost/DeliveryTrackingSystem/save_feedback.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tracking_number: transaction.tracking_number,
            rating,
            feedback,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        alert("Thank you for your feedback!");
        setShowModal(false);
      } else {
        alert(data.message || "Failed to save feedback.");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Error saving feedback.");
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-start py-5 px-3"
      style={{ background: "linear-gradient(135deg, #e3f2fd, #bbdefb)" }}
    >
      <div className="container">
        <h2 className="mb-4 text-primary fw-bold text-center">
          Delivery Tracking
        </h2>

        <div className="row g-4">
          {/* Order Details */}
          <div className="col-lg-5">
            <div className="card shadow-lg rounded-4 p-4 mb-4 border-0">
              <h5 className="fw-bold text-dark mb-3">Order Information</h5>
              <p>
                <strong>Tracking Number:</strong>{" "}
                <span className="text-muted">
                  {transaction.tracking_number}
                </span>
              </p>
              <p>
                <strong>Customer:</strong>{" "}
                <span className="text-muted">{transaction.customer_name}</span>
              </p>
              <p>
                <strong>Address:</strong>{" "}
                <span className="text-muted">
                  {transaction.customer_address}
                </span>
              </p>
              <p>
                <strong>Contact:</strong>{" "}
                <span className="text-muted">
                  {transaction.customer_contact}
                </span>
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <span className="badge bg-info">
                  {transaction.delivery_status}
                </span>
              </p>
              <p>
                <strong>Date of Order:</strong>{" "}
                <span className="text-muted">{transaction.date_of_order}</span>
              </p>
              <p>
                <strong>Target Delivery:</strong>{" "}
                <span className="text-muted">
                  {transaction.target_date_delivery}
                </span>
              </p>
              <p>
                <strong>Total Amount:</strong>{" "}
                <span className="fw-bold text-success">
                  ₱{transaction.total}
                </span>
              </p>
            </div>

            <div className="card shadow-lg rounded-4 p-4 mb-4 border-0">
              <h5 className="fw-bold text-dark mb-3">Purchased Items</h5>
              <ul className="list-group">
                {items.map((item, index) => (
                  <li
                    key={index}
                    className="list-group-item d-flex justify-content-between align-items-center"
                  >
                    {item.description}
                    <span className="badge bg-secondary">x{item.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              variant="success"
              size="lg"
              className="w-100 rounded-3 fw-bold"
              onClick={() => setShowModal(true)}
            >
              Confirm Delivery & Give Feedback
            </Button>
          </div>

          {/* Map */}
          <div className="col-lg-7">
            <div className="card shadow-lg rounded-4 p-3 border-0 h-100">
              <h5 className="fw-bold text-dark mb-3">Live Delivery Location</h5>
              {location ? (
                <MapContainer
                  center={[location.lat, location.lng]}
                  zoom={13}
                  style={{ height: "500px", borderRadius: "12px" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                  />
                  <Marker
                    position={[location.lat, location.lng]}
                    icon={customMarker}
                  >
                    <Popup>
                      Delivery for <b>{transaction.customer_name}</b>
                    </Popup>
                  </Marker>
                </MapContainer>
              ) : (
                <div className="text-center text-muted py-5">
                  Location not available yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- Feedback Modal --- */}
      <Modal
        show={showFeedbackModal}
        onHide={() => setShowFeedbackModal(false)}
        centered
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>Customer Satisfaction Survey</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted small mb-4">
            Please rate your overall delivery experience.
          </p>

          {/* Star Rating */}
          <div className="d-flex justify-content-center mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <i
                key={star}
                className={`bi ${
                  feedback.rating >= star
                    ? "bi-star-fill text-warning"
                    : "bi-star"
                } fs-3 mx-1`}
                style={{ cursor: "pointer" }}
                onClick={() =>
                  setFeedback((prev) => ({ ...prev, rating: star }))
                }
              ></i>
            ))}
          </div>

          {/* Comment Box */}
          <Form.Group>
            <Form.Label className="fw-semibold">Additional Comments</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Your feedback..."
              value={feedback.comments}
              onChange={(e) =>
                setFeedback((prev) => ({ ...prev, comments: e.target.value }))
              }
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowFeedbackModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            style={{ fontWeight: "600" }}
            onClick={handleSubmitFeedback}
            disabled={!feedback.rating} // prevent submit without rating
          >
            Submit Feedback
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Customer;
