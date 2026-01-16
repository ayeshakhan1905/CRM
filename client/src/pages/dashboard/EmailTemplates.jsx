import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchEmailTemplates, createEmailTemplate, updateEmailTemplate, deleteEmailTemplate } from "../../redux/emailTemplateSlice";
import {
  FiMail,
  FiPlus,
  FiEdit,
  FiTrash,
  FiEye,
  FiX,
  FiSearch,
  FiFilter,
} from "react-icons/fi";
import LoadingDemo from "../Loading";

const EmailTemplates = () => {
  const dispatch = useDispatch();
  const { templates, loading, error } = useSelector((state) => state.emailTemplates);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    body: "",
    variables: [],
  });
  const [search, setSearch] = useState("");
  const [previewModal, setPreviewModal] = useState(null);

  useEffect(() => {
    dispatch(fetchEmailTemplates());
  }, [dispatch]);

  const handleOpenModal = (template = null) => {
    if (template) {
      setFormData({
        name: template.name,
        subject: template.subject,
        body: template.body,
        variables: template.variables || [],
      });
      setSelectedTemplate(template);
    } else {
      setFormData({
        name: "",
        subject: "",
        body: "",
        variables: [],
      });
      setSelectedTemplate(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedTemplate) {
      dispatch(updateEmailTemplate({ id: selectedTemplate._id, template: formData }));
    } else {
      dispatch(createEmailTemplate(formData));
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      dispatch(deleteEmailTemplate(id));
    }
  };

  const filteredTemplates = templates?.filter((template) =>
    template.name.toLowerCase().includes(search.toLowerCase()) ||
    template.subject.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 py-8 px-2 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <FiMail className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Email Templates
              </h1>
              <p className="text-gray-600 mt-1">Create and manage reusable email templates</p>
            </div>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
          >
            <FiPlus className="text-lg" />
            Create Template
          </button>
        </div>

        {/* Search */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-200/60 mb-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search templates by name or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200"
            />
          </div>
        </div>

        {/* Loading */}
        {loading && <LoadingDemo />}

        {/* Error */}
        {error && (
          <div className="bg-red-50/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-red-200/60 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <FiFilter className="text-red-600 text-lg" />
              </div>
              <div>
                <h3 className="font-semibold text-red-900">Error Loading Templates</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Templates Grid */}
        {!loading && filteredTemplates.length > 0 ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template._id}
                className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/60 p-6 hover:shadow-lg transition-all duration-200 group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 truncate">{template.subject}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => setPreviewModal(template)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-150"
                      title="Preview"
                    >
                      <FiEye className="text-lg" />
                    </button>
                    <button
                      onClick={() => handleOpenModal(template)}
                      className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all duration-150"
                      title="Edit"
                    >
                      <FiEdit className="text-lg" />
                    </button>
                    <button
                      onClick={() => handleDelete(template._id)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-150"
                      title="Delete"
                    >
                      <FiTrash className="text-lg" />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  <p className="line-clamp-3">{template.body.substring(0, 100)}...</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !loading && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-12 shadow-sm border border-gray-200/60 text-center">
              <div className="text-gray-500">
                <FiMail className="mx-auto h-16 w-16 text-gray-400 mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Templates Found</h3>
                <p className="text-gray-600 mb-6">
                  {search ? "No templates match your search." : "Get started by creating your first email template."}
                </p>
                <button
                  onClick={() => handleOpenModal()}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Create Template
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    {selectedTemplate ? <FiEdit className="text-white text-lg" /> : <FiPlus className="text-white text-lg" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedTemplate ? "Edit Template" : "Create New Template"}
                    </h2>
                    <p className="text-gray-600 text-sm">
                      {selectedTemplate ? "Update template details" : "Fill in the template information below"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="text-xl" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Welcome Email"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Line <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Welcome to Our Service!"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Body <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Write your email content here. Use {{variable}} for dynamic content."
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  required
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use variables like {"{{"}firstName{"}"}, {"{{"}companyName{"}"} for personalization.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg"
                >
                  {selectedTemplate ? "Update Template" : "Create Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <FiEye className="text-white text-lg" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Template Preview</h2>
                    <p className="text-gray-600 text-sm">{previewModal.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewModal(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="text-xl" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Subject:</h3>
                <p className="text-gray-700">{previewModal.subject}</p>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Body:</h3>
                <div className="text-gray-700 whitespace-pre-wrap">{previewModal.body}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplates;