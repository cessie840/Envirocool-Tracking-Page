import React from "react";

const ProgressBar = ({ steps, currentStepIndex }) => {
  return (
    <div className="card shadow-sm border-0 rounded-4 p-4">
      <h5 className="fw-bold text-dark mb-3">Delivery Progress</h5>
      <div className="d-flex justify-content-between text-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isActive = index === currentStepIndex;

          return (
            <div key={index} className="flex-fill">
              {/* Circle with number */}
              <div
                className={`rounded-circle d-flex justify-content-center align-items-center mx-auto mb-2 shadow-sm`}
                style={{
                  backgroundColor:
                    isCompleted || isActive ? "#07b54a" : "#e0e0e0",
                  color: isCompleted || isActive ? "#fff" : "#6c757d",
                  width: "55px",
                  height: "55px",
                  fontSize: "18px",
                  fontWeight: "bold",
                  transition: "all 0.3s ease",
                }}
              >
                {index + 1}
              </div>

              {/* Step Label */}
              <small
                className={`fw-semibold d-block`}
                style={{
                  color: isCompleted || isActive ? "#07b54a" : "#6c757d",
                  fontSize: "0.9rem",
                }}
              >
                {step.label}
              </small>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressBar;
