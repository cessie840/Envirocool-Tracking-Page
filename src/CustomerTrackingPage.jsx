import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { Form, Button, Spinner } from "react-bootstrap";
import logo from "./assets/envirocool-logo.png";

const CustomerTrackingPage = () => {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (trackingNumber.trim() === "") {
      showToast("Please enter a tracking number.", "warning");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        "https://delivery-api.mooo.info/customer/get_delivery_by_tracking.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tracking_number: trackingNumber }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // ✅ Save tracking number for later if needed
        localStorage.setItem("trackingNumber", trackingNumber);
        showToast("Tracking number found!", "success");
        // ✅ Redirect to a unique URL for this tracking number
        navigate(`/customer/${trackingNumber}`);
      } else {
        showToast("Please enter a tracking number.", "warning");
      }
    } catch (error) {
      console.error("Error verifying tracking number:", error);
      showToast("Server error. Please try again later.", "danger");
    } finally {
      setLoading(false);
    }
  };

  const [toast, setToast] = useState({
    show: false,
    message: "",
    variant: "danger",
  });

  const showToast = (message, variant = "danger") => {
    setToast({ show: true, message, variant });

    setTimeout(() => {
      setToast({ show: false, message: "", variant });
    }, 3000);
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center min-vh-100"
      style={{
        background: "linear-gradient(135deg, #e3f2fd, #bbdefb)",
        padding: "20px",
      }}
    >
      {/* Toast Notification */}
      <div
        className={`position-fixed start-50 translate-middle-x ${
          toast.show ? "toast-show" : "toast-hide"
        }`}
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
              : "#0d6efd", // default = primary
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
      <div
        className="card shadow-lg border-0 text-center"
        style={{
          maxWidth: "420px",
          width: "100%",
          borderRadius: "20px",
          padding: "40px 30px",
        }}
      >
        {/* Logo + Header */}
        <div className="mb-4">
          <img
            src={logo}
            alt="Envirocool Logo"
            style={{ height: "80px" }}
            className="mb-3"
          />
          <h3 className="fw-bold text-primary mb-2">Delivery Tracking</h3>
          <p className="text-muted small mb-0">
            Enter your tracking number to check your order status.
          </p>
        </div>

        {/* Tracking Form */}
        <Form onSubmit={handleSubmit} className="text-start">
          <Form.Group className="mb-4" controlId="formTrackingNumber">
            <Form.Label className="fw-semibold">Tracking Number</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g. ENV123456"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              style={{
                padding: "14px",
                borderRadius: "12px",
                fontSize: "15px",
              }}
            />
          </Form.Group>
          <div className="d-grid">
            <Button
              variant="primary"
              type="submit"
              disabled={loading}
              className="d-flex justify-content-center align-items-center gap-2"
              style={{
                padding: "12px",
                borderRadius: "12px",
                fontWeight: "600",
              }}
            >
              {loading && <Spinner animation="border" size="sm" />}
              {loading ? " Verifying..." : "Track Delivery"}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default CustomerTrackingPage;
