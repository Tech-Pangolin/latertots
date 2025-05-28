import React from 'react';

export default function AdminDashWidget(props) {
  const { title, totalValue, dateRange, percentageChange } = props;

  const formatPercentageChange = (change) => {
    return change >= 0 ? `${change}% increase` : `${change * -1}% decrease`;
  };

  return (
    <div className="col-12 col-md-6 col-lg-3 mb-4 mb-lg-0">
      <div className="card">
        <h5 className="card-header">{title}</h5>
        <div className="card-body">
          <h5 className="card-title">{totalValue}</h5>
          <p className="card-text">{dateRange}</p>
          
          {percentageChange &&
            <p className={`card-text ${percentageChange >= 0 ? 'text-success' : 'text-danger'}`}>
              {formatPercentageChange(percentageChange)} since last month
            </p>
          }
        </div>
      </div>
    </div>
  )
}