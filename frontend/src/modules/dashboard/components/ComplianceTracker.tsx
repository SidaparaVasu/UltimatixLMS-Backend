import React from 'react';
import { Check, Clock } from 'lucide-react';

export const ComplianceTracker: React.FC = () => {
  const steps = [
    { label: "Data Privacy", status: "done" },
    { label: "Code of Conduct", status: "done" },
    { label: "Anti-Bribery", status: "done" },
    { label: "Info Security", status: "active", number: 4 },
    { label: "Workplace Safety", status: "pending", number: 5 },
  ];

  return (
    <div className="compliance-panel anim delay-4">
      <div className="compliance-top">
        <div className="compliance-info">
          <div className="label">Compliance Training Progress</div>
          <div className="deadline">
            <Clock size={12} />
            Deadline: 30 April 2026
          </div>
        </div>
        <div className="compliance-summary">
          <div className="compliance-count">3 / 5</div>
          <div className="compliance-sub">modules completed</div>
        </div>
      </div>
      
      <div className="compliance-steps">
        {steps.map((step, index) => (
          <React.Fragment key={step.label}>
            <div className="step-item">
              <div className={`step-circle ${step.status}`}>
                {step.status === 'done' ? <Check size={14} strokeWidth={3} /> : step.number}
              </div>
              <div className="step-label">{step.label}</div>
            </div>
            {index < steps.length - 1 && (
              <div className={`step-connector ${step.status === 'done' && steps[index+1].status !== 'pending' ? 'done' : ''}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
