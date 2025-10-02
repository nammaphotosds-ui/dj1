import React from 'react';

const PendingPaymentsPage: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md text-center">
      <h1 className="text-xl font-bold text-gray-700">This feature has been deprecated.</h1>
      <p className="text-gray-500 mt-2">
        Please record payments directly on individual bills via the Customer Details page.
      </p>
    </div>
  );
};

export default PendingPaymentsPage;