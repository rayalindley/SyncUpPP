import React from 'react';

const NoOrganizationSelected = () => {


  return (
    <div className="flex min-h-screen items-center justify-center bg-raisin text-white p-10">
      <div className="text-center max-w-lg">
        <h1 className="text-4xl font-bold mb-6">Newsletter Management</h1>
        <p className="text-lg mb-8">Please choose or create an organization in the upper left dropdown to manage newsletters.</p>
      </div>
    </div>
  );
};

export default NoOrganizationSelected;
