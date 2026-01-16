// src/components/Stages.jsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchStages,
  createStage,
  updateStage,
  deleteStage,
} from "../../redux/stageSlice";
import {
  fetchDealsByStage,
} from "../../redux/dealSlice";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiLayers,
  FiArrowRight,
  FiShield,
  FiTarget,
  FiFileText,
  FiHash,
  FiAlertCircle,
} from "react-icons/fi";
import LoadingDemo from "../Loading";

const Stages = () => {
  const dispatch = useDispatch();
  const { items: stages, loading, error } = useSelector(
    (state) => state.stages
  );
  const { dealsByStage } = useSelector((state) => state.deals);
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === "admin";

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    order: 0,
  });
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    dispatch(fetchStages());
    dispatch(fetchDealsByStage());
  }, [dispatch]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      order: 0,
    });
    setEditingId(null);
    setModalOpen(false);
    setFormError(null);
    setFormLoading(false);
  };

  const getDealCountForStage = (stageId) => {
    const stageData = dealsByStage?.find((d) => d._id === stageId);
    return stageData?.count || 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    try {
      if (editingId) {
        await dispatch(updateStage({ id: editingId, stageData: formData })).unwrap();
      } else {
        await dispatch(createStage(formData)).unwrap();
      }
      resetForm();
    } catch (error) {
      // Extract user-friendly error message
      let errorMessage = 'An error occurred while saving the stage';
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setFormError(errorMessage);
      setFormLoading(false);
    }
  };

  const handleDelete = async (stageId) => {
    if (window.confirm("Are you sure you want to delete this stage? This action cannot be undone.")) {
      setDeleteLoading(stageId);
      try {
        await dispatch(deleteStage(stageId)).unwrap();
      } catch (error) {
        alert(`Failed to delete stage: ${error.message || 'An error occurred'}`);
      } finally {
        setDeleteLoading(null);
      }
    }
  };

  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  // Non-admin view - can view stages but not modify
  const canModify = isAdmin;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <FiLayers className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Deal Stages
              </h1>
              <p className="text-gray-600 mt-1">
                {canModify ? "Configure your sales pipeline stages" : "View your sales pipeline stages"}
              </p>
            </div>
          </div>
          
          {canModify && (
            <button
              onClick={() => {
                setFormError(null);
                setModalOpen(true);
              }}
              className="flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
            >
              <FiPlus className="text-lg" />
              Add Stage
            </button>
          )}

          {!canModify && (
            <div className="flex items-center gap-2 bg-amber-50 text-amber-800 px-4 py-2 rounded-lg border border-amber-200">
              <FiShield className="text-sm" />
              <span className="text-sm font-medium">Read-only access</span>
            </div>
          )}
        </div>

        {/* Stats Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-200/60 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <FiTarget className="text-indigo-600 text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Pipeline Overview</h3>
                <p className="text-gray-600 text-sm">Manage your sales process flow</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{stages.length}</p>
              <p className="text-gray-600 text-sm">Active Stages</p>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {loading && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 shadow-sm border border-gray-200/60">
            <LoadingDemo/>
          </div>
        )}

        {error && (
          <div className="bg-red-50/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-red-200/60 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <FiAlertCircle className="text-red-600 text-lg" />
              </div>
              <div>
                <h3 className="font-semibold text-red-900">Error Loading Stages</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stages Grid */}
        {!loading && sortedStages.length > 0 ? (
          <>
            {/* Pipeline Flow Visualization */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiTarget className="text-indigo-600" />
                Sales Pipeline Flow
              </h3>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-200/60">
                <div className="flex items-center justify-center overflow-x-auto">
                  <div className="flex items-center gap-4 min-w-max">
                    {sortedStages.map((stage, index) => (
                      <div key={stage._id} className="flex items-center gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                            {stage.order}
                          </div>
                          <span className="text-sm font-medium text-gray-900 mt-2 text-center max-w-24">
                            {stage.name}
                          </span>
                        </div>
                        {index < sortedStages.length - 1 && (
                          <FiArrowRight className="text-gray-400 text-xl flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Stages Cards */}
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {sortedStages.map((stage) => (
                <div
                  key={stage._id}
                  className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/60 p-6 hover:shadow-lg transition-all duration-200 group"
                >
                  {/* Stage Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                        {stage.order}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors">
                          {stage.name}
                        </h3>
                        <div className="flex items-center gap-1 mt-1">
                          <FiHash className="text-gray-400 text-xs" />
                          <span className="text-xs text-gray-500">Position {stage.order}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`flex gap-2 ${canModify ? 'opacity-0 group-hover:opacity-100' : 'hidden'} transition-opacity duration-200`}>
                      <button
                        onClick={() => {
                          setEditingId(stage._id);
                          setFormData({
                            name: stage.name,
                            description: stage.description,
                            order: stage.order,
                          });
                          setFormError(null);
                          setModalOpen(true);
                        }}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-150"
                        title="Edit Stage"
                      >
                        <FiEdit2 className="text-lg" />
                      </button>
                      <button
                        onClick={() => handleDelete(stage._id)}
                        disabled={deleteLoading === stage._id}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 disabled:text-red-400 disabled:cursor-not-allowed rounded-lg transition-all duration-150 flex items-center justify-center"
                        title="Delete Stage"
                      >
                        {deleteLoading === stage._id ? (
                          <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <FiTrash2 className="text-lg" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Stage Description */}
                  <div className="mb-4">
                    {stage.description ? (
                      <div className="flex items-start gap-2">
                        <FiFileText className="text-gray-400 text-sm mt-0.5 flex-shrink-0" />
                        <p className="text-gray-700 text-sm leading-relaxed">{stage.description}</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-400">
                        <FiFileText className="text-sm" />
                        <p className="text-sm italic">No description provided</p>
                      </div>
                    )}
                  </div>

                  {/* Stage Stats */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Deals in stage</span>
                      <span className="font-medium text-gray-900">{getDealCountForStage(stage._id)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : !loading && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-12 shadow-sm border border-gray-200/60 text-center">
            <div className="text-gray-500">
              <FiLayers className="mx-auto h-16 w-16 text-gray-400 mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Stages Configured</h3>
              <p className="text-gray-600 mb-6">
                {canModify 
                  ? "Create your first deal stage to start building your sales pipeline."
                  : "No deal stages have been configured yet. Contact your administrator to set up the sales pipeline."}
              </p>
              {canModify && (
                <button
                  onClick={() => {
                    setFormError(null);
                    setModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg"
                >
                  <FiPlus className="text-lg" />
                  Create First Stage
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Add/Edit Modal */}
      {modalOpen && canModify && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    {editingId ? <FiEdit2 className="text-white text-lg" /> : <FiPlus className="text-white text-lg" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {editingId ? "Edit Stage" : "Create New Stage"}
                    </h2>
                    <p className="text-gray-600 text-sm">
                      {editingId ? "Update stage information" : "Add a new stage to your sales pipeline"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={resetForm}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="text-xl" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <FiAlertCircle className="text-red-600 text-sm" />
                    <p className="text-red-800 text-sm font-medium">{formError}</p>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stage Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiTarget className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g., Prospecting, Negotiation, Closed Won"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <FiFileText className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    placeholder="Describe what happens in this stage..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all duration-200 resize-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stage Order <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiHash className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    placeholder="1"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    required
                    min="0"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all duration-200"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Lower numbers appear first in the pipeline. Use increments of 10 (10, 20, 30) for easier reordering.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg flex items-center justify-center gap-2"
                >
                  {formLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {editingId ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    editingId ? "Update Stage" : "Create Stage"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stages;