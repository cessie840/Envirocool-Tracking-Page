import React from "react";
import { Badge } from "react-bootstrap";

const OrderDetails = ({ transaction, items }) => (
  <>
    <div className="card shadow-lg rounded-4 p-4 mb-4 border-0">
      <h5 className="fw-bold text-dark mb-3">Order Information</h5>
      <p>
        <strong>Customer:</strong> {transaction.customer_name}
      </p>
      <p>
        <strong>Address:</strong> {transaction.customer_address}
      </p>
      <p>
        <strong>Contact:</strong> {transaction.customer_contact}
      </p>
      <p>
        <strong>Status:</strong>{" "}
        <Badge bg="info">{transaction.delivery_status}</Badge>
      </p>
      <p>
        <strong>Date of Order:</strong> {transaction.date_of_order}
      </p>
      <p>
        <strong>Target Delivery:</strong> {transaction.target_date_delivery}
      </p>
      <p>
        <strong>Total Amount:</strong>{" "}
        <span className="fw-bold text-success">₱{transaction.total}</span>
      </p>
    </div>

    <div className="card shadow-lg rounded-4 p-4 mb-4 border-0">
      <h5 className="fw-bold text-dark mb-3">Purchased Items</h5>
      <ul className="list-group">
        {items.map((item, index) => (
          <li
            key={index}
            className="list-group-item d-flex justify-content-between"
          >
            {item.description}
            <span className="badge bg-secondary">x{item.quantity}</span>
          </li>
        ))}
      </ul>
    </div>
  </>
);

export default OrderDetails;
