
import React, { useState } from 'react';
import { ForeshadowingNote } from '../types';

interface ForeshadowingManagerProps {
  foreshadowingNotes: ForeshadowingNote[];
  numChapters: number;
  onAddNote: (note: Omit<ForeshadowingNote, 'id' | 'createdAt'>) => void;
  onDeleteNote: (noteId: string) => void;
  onUpdateNote: (noteId: string, note: Omit<ForeshadowingNote, 'id' | 'createdAt'>) => void;
}

export const ForeshadowingManager: React.FC<ForeshadowingManagerProps> = ({
  foreshadowingNotes,
  numChapters,
  onAddNote,
  onDeleteNote,
  onUpdateNote,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    targetChapterId: 1,
    revealDescription: '',
    foreshadowingHint: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdateNote(editingId, formData);
      setEditingId(null);
    } else {
      onAddNote(formData);
    }
    setFormData({
      targetChapterId: 1,
      revealDescription: '',
      foreshadowingHint: '',
    });
    setIsAdding(false);
  };

  const handleEdit = (note: ForeshadowingNote) => {
    setFormData({
      targetChapterId: note.targetChapterId,
      revealDescription: note.revealDescription,
      foreshadowingHint: note.foreshadowingHint,
    });
    setEditingId(note.id);
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      targetChapterId: 1,
      revealDescription: '',
      foreshadowingHint: '',
    });
  };

  // Group notes by target chapter
  const notesByChapter = foreshadowingNotes.reduce((acc, note) => {
    if (!acc[note.targetChapterId]) {
      acc[note.targetChapterId] = [];
    }
    acc[note.targetChapterId].push(note);
    return acc;
  }, {} as Record<number, ForeshadowingNote[]>);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Foreshadowing Notes</h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            + Add Foreshadowing
          </button>
        )}
      </div>

      <p className="text-gray-600 mb-4">
        Plan future reveals and add subtle hints in earlier chapters. For example, if Chapter 5 reveals
        the witch is the hero's mother, you can add a note here to foreshadow this in earlier chapters.
      </p>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-purple-50 p-4 rounded-lg mb-4">
          <h3 className="font-semibold text-gray-800 mb-3">
            {editingId ? 'Edit Foreshadowing Note' : 'New Foreshadowing Note'}
          </h3>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reveal in Chapter:
            </label>
            <input
              type="number"
              min="1"
              value={formData.targetChapterId}
              onChange={(e) => setFormData({ ...formData, targetChapterId: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              You can specify any chapter number, even if it hasn't been created yet.
            </p>
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              What will be revealed:
            </label>
            <input
              type="text"
              value={formData.revealDescription}
              onChange={(e) => setFormData({ ...formData, revealDescription: e.target.value })}
              placeholder="e.g., The witch is the hero's mother"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              How to foreshadow in earlier chapters:
            </label>
            <textarea
              value={formData.foreshadowingHint}
              onChange={(e) => setFormData({ ...formData, foreshadowingHint: e.target.value })}
              placeholder="e.g., The witch shows unexpected maternal concern for the hero's wellbeing"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
              required
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              {editingId ? 'Update' : 'Add'} Note
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {foreshadowingNotes.length === 0 && !isAdding && (
        <div className="text-center py-8 text-gray-500">
          No foreshadowing notes yet. Click "Add Foreshadowing" to create your first note.
        </div>
      )}

      {foreshadowingNotes.length > 0 && (
        <div className="space-y-4">
          {Array.from({ length: numChapters }, (_, i) => i + 1).map((chapterNum) => {
            const notes = notesByChapter[chapterNum] || [];
            if (notes.length === 0) return null;

            return (
              <div key={chapterNum} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-lg text-gray-800 mb-3">
                  Chapter {chapterNum} Reveals
                </h3>
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">
                            <span className="text-purple-600">Reveal:</span> {note.revealDescription}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEdit(note)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onDeleteNote(note.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Foreshadowing hint:</span> {note.foreshadowingHint}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Will be foreshadowed in chapters 1-{chapterNum - 1}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

