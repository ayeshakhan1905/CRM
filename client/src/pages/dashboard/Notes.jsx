import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getNotes, createNote, updateNote, deleteNote } from "../../redux/noteSlice";
import {
  FiFileText,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiSave,
  FiUser,
  FiClock,
  FiMessageSquare,
  FiTag,
} from "react-icons/fi";
import LoadingDemo from "../Loading";

const capModel = (m) =>
  typeof m === "string" ? m.charAt(0).toUpperCase() + m.slice(1).toLowerCase() : m;

const Notes = ({ relatedModel, relatedTo }) => {
  const dispatch = useDispatch();
  const { items, byRef, loading, error } = useSelector((s) => s.notes);
  const { user } = useSelector((s) => s.auth);

  const normalizedModel = useMemo(
    () => (relatedModel ? capModel(relatedModel) : null),
    [relatedModel]
  );
  const scopeKey = useMemo(
    () => (normalizedModel && relatedTo ? `${normalizedModel}:${relatedTo}` : null),
    [normalizedModel, relatedTo]
  );

  const visibleNotes = scopeKey && byRef[scopeKey] ? byRef[scopeKey] : items;

  const [content, setContent] = useState("");
  const [editing, setEditing] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (normalizedModel && relatedTo) {
      dispatch(getNotes({ relatedModel: normalizedModel, relatedTo }));
    } else {
      dispatch(getNotes({}));
    }
  }, [dispatch, normalizedModel, relatedTo]);

  const canCreate = Boolean(normalizedModel && relatedTo);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (editing) {
      dispatch(updateNote({ id: editing, content })).then(() => {
        setEditing(null);
        setContent("");
      });
    } else {
      if (!canCreate) return;
      dispatch(createNote({ content, relatedModel: normalizedModel, relatedTo })).then(() => {
        setContent("");
        setShowAddForm(false);
      });
    }
  };

  const handleEdit = (note) => {
    setEditing(note._id);
    setContent(note.content);
    setShowAddForm(true);
  };

  const handleDelete = (noteId) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      dispatch(deleteNote(noteId));
    }
  };

  const cancelEdit = () => {
    setEditing(null);
    setContent("");
    setShowAddForm(false);
  };

  const getModelIcon = (model) => {
    const icons = {
      Lead: FiUser,
      Customer: FiUser,
      Deal: FiFileText,
      Task: FiClock,
      Note: FiMessageSquare,
    };
    return icons[model] || FiTag;
  };

  const getModelBadge = (model) => {
    const styles = {
      Lead: "bg-orange-50 text-orange-700 border border-orange-200",
      Customer: "bg-green-50 text-green-700 border border-green-200",
      Deal: "bg-purple-50 text-purple-700 border border-purple-200",
      Task: "bg-blue-50 text-blue-700 border border-blue-200",
      Note: "bg-gray-50 text-gray-700 border border-gray-200",
    };
    return styles[model] || "bg-gray-50 text-gray-700 border border-gray-200";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50/50 to-blue-50/30 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-slate-500 to-gray-600 rounded-lg flex items-center justify-center">
            <FiFileText className="text-white text-sm" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
          {visibleNotes && visibleNotes.length > 0 && (
            <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
              {visibleNotes.length} {visibleNotes.length === 1 ? 'note' : 'notes'}
            </span>
          )}
        </div>
        
        {canCreate && !showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-slate-600 to-gray-600 text-white rounded-lg hover:from-slate-700 hover:to-gray-700 transition-all duration-200 text-sm font-medium shadow-sm"
          >
            <FiPlus className="text-sm" />
            Add Note
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editing) && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              {editing ? (
                <>
                  <FiEdit2 className="text-blue-600" />
                  Edit Note
                </>
              ) : (
                <>
                  <FiPlus className="text-green-600" />
                  Add New Note
                </>
              )}
            </h4>
            <button
              onClick={cancelEdit}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              <FiX className="text-sm" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note here..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-500/20 focus:border-slate-400 transition-all duration-200 resize-none"
              required
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 ${
                  editing 
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" 
                    : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                }`}
              >
                <FiSave className="text-sm" />
                {editing ? "Update Note" : "Save Note"}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading State */}
      {loading && <LoadingDemo />}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Notes List */}
      <div className="space-y-3">
        {visibleNotes && visibleNotes.length > 0 ? (
          visibleNotes.map((note) => {
            const ModelIcon = getModelIcon(note.relatedModel);
            return (
              <div
                key={note._id}
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
              >
                {/* Note Content */}
                <div className="mb-3">
                  <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>

                {/* Note Metadata */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    {/* Related Entity */}
                    <div className="flex items-center gap-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getModelBadge(note.relatedModel)}`}>
                        <ModelIcon className="text-xs" />
                        {note.relatedModel}
                      </span>
                    </div>

                    {/* Author Info (Admin Only) */}
                    {user?.role === "admin" && (
                      <div className="flex items-center gap-1">
                        <FiUser className="text-gray-400" />
                        <span>
                          {note.createdBy?.name || "Unknown"} ({note.createdBy?.role || "N/A"})
                        </span>
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className="flex items-center gap-1">
                      <FiClock className="text-gray-400" />
                      <span>{formatDate(note.createdAt || note.updatedAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(note)}
                      className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                      title="Edit note"
                    >
                      <FiEdit2 className="text-sm" />
                    </button>
                    <button
                      onClick={() => handleDelete(note._id)}
                      className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                      title="Delete note"
                    >
                      <FiTrash2 className="text-sm" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : !loading ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiFileText className="text-gray-400 text-2xl" />
            </div>
            <h4 className="text-gray-900 font-medium mb-2">No notes yet</h4>
            <p className="text-gray-500 text-sm mb-4">
              {canCreate 
                ? "Start by adding your first note to keep track of important information."
                : "Notes will appear here when available."}
            </p>
            {canCreate && !showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-600 to-gray-600 text-white rounded-lg hover:from-slate-700 hover:to-gray-700 transition-all duration-200 text-sm font-medium"
              >
                <FiPlus className="text-sm" />
                Add First Note
              </button>
            )}
          </div>
        ) : null}
      </div>

      {/* Context Info */}
      {!canCreate && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
          <p className="text-amber-800 text-sm">
            Notes are read-only in this context. Select a specific record to add notes.
          </p>
        </div>
      )}
    </div>
  );
};

export default Notes;