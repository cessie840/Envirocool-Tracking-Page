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
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

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

          if (
            data.transaction.customer_rating ||
            data.transaction.customer_feedback
          ) {
            setFeedbackSubmitted(true);
          }

          const lat = parseFloat(data.transaction.latitude);
          const lng = parseFloat(data.transaction.longitude);
          if (!isNaN(lat) && !isNaN(lng)) {
            setLocation({ lat, lng });
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

  // Fetch GPS trail
  useEffect(() => {
    if (!deliveryDetails?.transaction?.tracking_number) return;

    const fetchRoute = async () => {
      try {
        const response = await fetch(
          "https://13.239.143.31/customer/get_route.php",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tracking_number: deliveryDetails.transaction.tracking_number,
            }),
          }
        );

        const data = await response.json();
        if (
          data.success &&
          Array.isArray(data.trail) &&
          data.trail.length > 0
        ) {
          setTrail(data.trail);

          const lastPoint = data.trail[data.trail.length - 1];
          const lat = parseFloat(lastPoint.lat);
          const lng = parseFloat(lastPoint.lng);
          if (!isNaN(lat) && !isNaN(lng)) {
            setLocation({ lat, lng });
          }
        }
      } catch (error) {
        console.error("Error fetching route:", error);
      }
    };

    fetchRoute();
    const interval = setInterval(fetchRoute, 10000);
    return () => clearInterval(interval);
  }, [deliveryDetails]);

  // Loading screen
  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center min-vh-100"
        style={{ background: "linear-gradient(135deg, #e3f2fd, #bbdefb)" }}
      >
        <Spinner animation="border" variant="light" />
      </div>
    );
  }

  // If no details found
  if (!deliveryDetails) {
    return (
      <div
        className="d-flex justify-content-center align-items-center min-vh-100"
        style={{ background: "linear-gradient(135deg, #e3f2fd, #bbdefb)" }}
      >
        <h5 className="text-dark fw-bold">
          No details found for this tracking number.
        </h5>
      </div>
    );
  }

  const { transaction, items } = deliveryDetails;
  const currentStepIndex = statusSteps.findIndex(
    (step) =>
      step.label.toLowerCase() === transaction.delivery_status.toLowerCase()
  );

  return (
    <div
      className="min-vh-100 py-5"
      style={{ background: "linear-gradient(135deg, #e3f2fd, #bbdefb)" }}
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
            style={{ height: "80px", margin: "20px" }}
            className="mb-3"
          />
        </div>

        {/* Guide */}
        <div
          className="alert alert-info text-start shadow-sm mx-auto mb-4"
          style={{
            maxWidth: "800px",
            backgroundColor: "#e3f2fd",
            borderLeft: "6px solid #0d6efd",
            borderRadius: "10px",
          }}
        >
          <h5 className="fw-bold text-primary mb-2">
            How to Use This Tracking Page
          </h5>
          <ul
            className="mb-0"
            style={{ fontSize: "0.95rem", color: "#0b3d91" }}
          >
            <li>
              Enter or open your <strong>Tracking Number</strong> link to view
              your delivery status.
            </li>
            <li>
              The <strong>Delivery Progress</strong> shows your delivery stage:
              Pending → Processing → Out for Delivery → Delivered.
            </li>
            <li>
              The <strong>map</strong> displays your delivery route and live
              location of the delivery vehicle.
            </li>
            <li>
              Once the item is <strong>Delivered</strong>, you can confirm and
              leave feedback using the green button below the order details.
            </li>
            <li>
              If you experience any issues, please contact{" "}
              <a
                href="mailto:contactenvirocool@gmail.com"
                className="text-decoration-none fw-semibold text-primary"
              >
                Envirocool Support
              </a>
              .
            </li>
          </ul>
        </div>

        {/* Tracking Number */}
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

        {/* Responsive Layout */}
        <div className="row g-4 flex-lg-row">
          {/* 🗺️ Map Section */}
          <div className="col-12 col-lg-7 order-2 order-lg-1">
            <h5 className="fw-bold text-primary mb-3 text-center text-lg-start">
              Live Delivery Map
            </h5>
            <div className="w-100 h-100" style={{ minHeight: "600px" }}>
              <DeliveryMap
                location={location}
                trail={trail}
                transaction={transaction}
              />
            </div>
          </div>

          {/* 📋 Order Details */}
          <div className="col-12 col-lg-5 order-3 order-lg-2">
            <OrderDetails transaction={transaction} items={items} />

            <Button
              variant={
                feedbackSubmitted
                  ? "success"
                  : transaction.delivery_status === "Delivered"
                  ? "primary"
                  : "secondary"
              }
              size="lg"
              className="w-100 fw-bold rounded-3 mt-3"
              onClick={() => setShowFeedbackModal(true)}
              style={{
                background: feedbackSubmitted
                  ? "#4caf50"
                  : transaction.delivery_status === "Delivered"
                  ? "#07b54aff"
                  : "#9e9e9e",
                border: "none",
                cursor:
                  feedbackSubmitted ||
                  transaction.delivery_status !== "Delivered"
                    ? "not-allowed"
                    : "pointer",
              }}
              disabled={
                feedbackSubmitted || transaction.delivery_status !== "Delivered"
              }
            >
              {feedbackSubmitted
                ? "Feedback Already Submitted"
                : transaction.delivery_status !== "Delivered"
                ? "Delivery Not Yet Completed"
                : "Confirm Delivery & Give Feedback"}
            </Button>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        show={showFeedbackModal}
        onHide={() => setShowFeedbackModal(false)}
        feedback={feedback}
        setFeedback={setFeedback}
        trackingNumber={transaction.tracking_number}
        onFeedbackSubmitted={() => setFeedbackSubmitted(true)}
      />

      {/* Animation */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @media (max-width: 992px) {
            .container {
              padding: 1.5rem;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Customer;
