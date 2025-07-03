
import React from 'react';
import { PRICING_PLANS } from '../constants';
import { User, UserTier } from '../types';

interface PricingViewProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
}

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-green-400"><polyline points="20 6 9 17 4 12"></polyline></svg>
);

const PricingView: React.FC<PricingViewProps> = ({ user, onUpdateUser }) => {
  const handleSelectTier = (newTier: UserTier) => {
    onUpdateUser({ ...user, tier: newTier });
    alert(`Your plan has been updated to ${newTier}!`);
  };

  return (
    <div className="p-4 md:p-6 text-white h-full pt-24 pb-20 overflow-y-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold">Choose Your Plan</h2>
        <p className="text-gray-400 mt-2">Unlock more power and save your work.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {PRICING_PLANS.map(plan => (
          <div key={plan.tier} className={`bg-gray-800 rounded-xl p-6 flex flex-col border-2 transition-all duration-300 ${plan.recommended ? 'border-green-500' : 'border-gray-700'}`}>
            {plan.recommended && (
              <div className="text-center bg-green-500 text-white text-xs font-bold py-1 px-3 rounded-full -mt-9 mx-auto shadow-lg">
                RECOMMENDED
              </div>
            )}
            <h3 className="text-xl font-bold text-white text-center mt-2">{plan.tier}</h3>
            <p className="text-center text-gray-400">{plan.requests}</p>
            <p className="text-4xl font-bold text-center my-6">
              {plan.price} <span className="text-lg font-normal text-gray-400">/ {plan.period}</span>
            </p>
            <ul className="space-y-3 mb-8 flex-grow">
              {plan.features.map(feature => (
                <li key={feature} className="flex items-start">
                  <CheckIcon />
                  <span className="ml-3 text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSelectTier(plan.tier)}
              disabled={user.tier === plan.tier}
              className={`w-full py-3 rounded-lg font-semibold transition-colors duration-200 ${
                user.tier === plan.tier
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {user.tier === plan.tier ? 'Current Plan' : 'Select Plan'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PricingView;