import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Spinner, Button } from "react-bootstrap";
import ProgressBar from "./ProgressBar";
import OrderDetails from "./OrderDetails";
import DeliveryMap from "./DeliveryMap";
import FeedbackModal from "./FeedbackModal";
import logo from "/favicon.svg";

const statusSteps = [
  { label: "Pending", icon: "bi-1-circle" },
  { label: "Processing", icon: "bi-2-circle" },
  { label: "Out for Delivery", icon: "bi-3-circle" },
  { label: "Delivered", icon: "bi-4-circle" },
];

const Customer = () => {
  const { trackingNumber } = useParams();

  const [deliveryDetails, setDeliveryDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trail, setTrail] = useState([]);
  const [location, setLocation] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState({ rating: 0, comments: "" });
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false); // ✅ new state

  // Fetch delivery details
  useEffect(() => {
    const fetchDeliveryDetails = async () => {
      try {
        const response = await fetch(
          "https://13.239.143.31/customer/get_delivery_by_tracking.php",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tracking_number: trackingNumber }),
          }
        );

        const data = await response.json();
        if (data.success) {
          setDeliveryDetails(data);

          // Pre-check if feedback already exists
          if (
            data.Transactions.customer_rating ||
            data.Transactions.customer_feedback
          ) {
            setFeedbackSubmitted(true); // ✅ disable button if feedback exists
          }

          if (data.Transactions.latitude && data.Transactions.longitude) {
            setLocation({
              lat: parseFloat(data.Transactions.latitude),
              lng: parseFloat(data.Transactions.longitude),
            });
          }
        } else {
          alert(data.message || "Tracking number not found.");
        }
      } catch (error) {
        console.error("Error fetching delivery details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveryDetails();
  }, [trackingNumber]);

  // Fetch GPS trail updates
  useEffect(() => {
    if (!deliveryDetails?.Transactions?.tracking_number) return;

    const fetchRoute = async () => {
      try {
        const response = await fetch(
          "https://13.239.143.31/customer/map/get_route.php",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tracking_number: deliveryDetails.Transactions.tracking_number,
            }),
          }
        );

        const data = await response.json();
        if (data.success && data.trail) {
          setTrail(
            data.trail.map((point) => [
              parseFloat(point.lat),
              parseFloat(point.lng),
            ])
          );
        }
      } catch (error) {
        console.error("Error fetching route:", error);
      }
    };

    fetchRoute();
    const interval = setInterval(fetchRoute, 5000);
    return () => clearInterval(interval);
  }, [deliveryDetails]);

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center min-vh-100"
        style={{
          background: "linear-gradient(135deg, #e3f2fd, #bbdefb)",
        }}
      >
        <Spinner animation="border" variant="light" />
      </div>
    );
  }

  if (!deliveryDetails) {
    return (
      <div
        className="d-flex justify-content-center align-items-center min-vh-100"
        style={{
          background: "linear-gradient(135deg, #e3f2fd, #bbdefb)",
        }}
      >
        <h5 className="text-white fw-bold">
          No details found for this tracking number.
        </h5>
      </div>
    );
  }

  const { Transactions, items } = deliveryDetails;
  const currentStepIndex = statusSteps.findIndex(
    (step) =>
      step.label.toLowerCase() === Transactions.status.toLowerCase()
  );

  return (
    <div
      className="min-vh-100 py-5"
      style={{
        background: "linear-gradient(135deg, #e3f2fd, #bbdefb)",
      }}
    >
      <div
        className="container bg-white shadow rounded-4 p-4"
        style={{ animation: "fadeIn 0.6s ease-in-out" }}
      >
        {/* Logo */}
        <div className="text-center mb-3">
          <img
            src={logo}
            alt="Envirocool Logo"
            style={{
              height: "80px",
              margin: "20px",
            }}
            className="mb-3"
          />
        </div>

        {/* Tracking Number Badge */}
        <div className="text-center mb-4">
          <span className="badge bg-primary fs-6 px-4 py-2 shadow-sm">
            Tracking Number: <strong>{trackingNumber}</strong>
          </span>
        </div>

        {/* Progress */}
        <div className="mb-5">
          <ProgressBar
            steps={statusSteps}
            currentStepIndex={currentStepIndex}
          />
        </div>

        <div className="row g-4">
          {/* Order Details */}
          <div className="col-lg-5">
            <OrderDetails Transactions={Transactions} items={items} />
            <Button
              variant={feedbackSubmitted ? "success" : "primary"}
              size="lg"
              className="w-100 fw-bold rounded-3 mt-3"
              onClick={() => setShowFeedbackModal(true)}
              style={{
                background: feedbackSubmitted ? "#4caf50" : "#07b54aff",
                border: "none",
                cursor: feedbackSubmitted ? "not-allowed" : "pointer",
              }}
              disabled={feedbackSubmitted} // ✅ disable after submission
            >
              {feedbackSubmitted
                ? "Feedback Already Submitted"
                : "Confirm Delivery & Give Feedback"}
            </Button>
          </div>

          {/* Map */}
          <div className="col-lg-7">
            <DeliveryMap
              location={location}
              trail={trail}
              Transactions={Transactions}
            />
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        show={showFeedbackModal}
        onHide={() => setShowFeedbackModal(false)}
        feedback={feedback}
        setFeedback={setFeedback}
        trackingNumber={Transactions.tracking_number}
        onFeedbackSubmitted={() => setFeedbackSubmitted(true)} // ✅ update parent
      />

      {/* Simple Fade-in Animation */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
};

export default Customer;
