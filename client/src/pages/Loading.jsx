import React, { useState, useEffect } from 'react';
import { 
  FiUsers, 
  FiBriefcase, 
  FiTrendingUp, 
  FiCheckCircle,
  FiDatabase,
  FiShield,
  FiZap
} from 'react-icons/fi';

const LoadingPage = ({ onLoadComplete }) => {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const loadingSteps = [
    { 
      id: 'auth', 
      label: 'Authenticating User', 
      icon: FiShield,
      color: 'from-blue-500 to-cyan-500' 
    },
    { 
      id: 'database', 
      label: 'Connecting to Database', 
      icon: FiDatabase,
      color: 'from-green-500 to-emerald-500' 
    },
    { 
      id: 'customers', 
      label: 'Loading Customer Data', 
      icon: FiUsers,
      color: 'from-purple-500 to-violet-500' 
    },
    { 
      id: 'deals', 
      label: 'Fetching Deal Pipeline', 
      icon: FiBriefcase,
      color: 'from-orange-500 to-amber-500' 
    },
    { 
      id: 'analytics', 
      label: 'Preparing Analytics', 
      icon: FiTrendingUp,
      color: 'from-pink-500 to-rose-500' 
    },
    { 
      id: 'finalize', 
      label: 'Finalizing Setup', 
      icon: FiZap,
      color: 'from-indigo-500 to-blue-500' 
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        const newProgress = Math.min(prev + Math.random() * 15 + 5, 100);
        
        // Update current step based on progress
        const stepIndex = Math.floor((newProgress / 100) * loadingSteps.length);
        setCurrentStep(Math.min(stepIndex, loadingSteps.length - 1));
        
        // Mark completed steps
        setCompletedSteps(prev => {
          const newCompleted = new Set(prev);
          for (let i = 0; i < stepIndex; i++) {
            newCompleted.add(i);
          }
          return newCompleted;
        });
        
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onLoadComplete && onLoadComplete();
          }, 1000);
        }
        
        return newProgress;
      });
    }, 300 + Math.random() * 400);

    return () => clearInterval(interval);
  }, [onLoadComplete, loadingSteps.length]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 overflow-hidden relative z-50">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 3}s`
          }}
        ></div>
      ))}

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        {/* Main Logo */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-2xl mb-6 animate-pulse">
            <span className="text-white text-4xl font-bold">C</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-blue-200 to-indigo-200 bg-clip-text text-transparent mb-4">
            CRM Pro
          </h1>
          <p className="text-blue-200/80 text-lg md:text-xl font-medium">
            Customer Relationship Management
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="w-full bg-white/10 rounded-full h-3 backdrop-blur-sm border border-white/20">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
              style={{ width: `${loadingProgress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
            </div>
          </div>
          <div className="flex justify-between items-center mt-3">
            <span className="text-blue-200/60 text-sm">Loading...</span>
            <span className="text-white font-semibold text-lg">
              {Math.round(loadingProgress)}%
            </span>
          </div>
        </div>

        {/* Loading Steps */}
        <div className="space-y-4">
          {loadingSteps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = completedSteps.has(index);
            const IconComponent = step.icon;

            return (
              <div
                key={step.id}
                className={`flex items-center justify-between p-4 rounded-xl transition-all duration-500 border ${
                  isActive
                    ? 'bg-white/10 border-white/30 scale-105'
                    : isCompleted
                    ? 'bg-green-500/10 border-green-400/30'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isActive
                      ? `bg-gradient-to-r ${step.color} text-white animate-pulse`
                      : 'bg-white/10 text-white/60'
                  }`}>
                    {isCompleted ? (
                      <FiCheckCircle className="text-lg" />
                    ) : (
                      <IconComponent className="text-lg" />
                    )}
                  </div>
                  <span className={`font-medium transition-colors duration-300 ${
                    isActive ? 'text-white' : isCompleted ? 'text-green-200' : 'text-white/70'
                  }`}>
                    {step.label}
                  </span>
                </div>

                {isActive && (
                  <div className="flex space-x-1">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-white rounded-full animate-pulse"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      ></div>
                    ))}
                  </div>
                )}

                {isCompleted && (
                  <div className="text-green-400">
                    <FiCheckCircle className="text-xl" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Loading complete state */}
        {loadingProgress >= 100 && (
          <div className="mt-8 animate-fade-in">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <FiCheckCircle className="text-white text-2xl" />
            </div>
            <p className="text-green-200 text-lg font-semibold">
              Ready to go! Launching CRM Pro...
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-white/50 text-sm">
            Powered by advanced customer relationship technology
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

// Demo wrapper to show the loading page in action
const LoadingDemo = () => {
  const [showLoading, setShowLoading] = useState(true);

  const handleLoadComplete = () => {
    setShowLoading(false);
  };

  const resetDemo = () => {
    setShowLoading(true);
  };

  if (showLoading) {
    return <LoadingPage onLoadComplete={handleLoadComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-6">
          <span className="text-white text-2xl font-bold">C</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to CRM Pro!</h1>
        <p className="text-gray-600 mb-8">Loading complete. Your dashboard is ready.</p>
        <button
          onClick={resetDemo}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg"
        >
          View Loading Again
        </button>
      </div>
    </div>
  );
};

export default LoadingDemo;