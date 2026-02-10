'use client';

import { useState } from 'react';
import { Plus, X, Edit2, Check } from 'lucide-react';

export default function NotesArray({ 
    value = [], 
    onChange, 
    placeholder = "Enter note...", 
    readOnly = false,
    className = "" 
}) {
    const [editingIndex, setEditingIndex] = useState(null);
    const [editingText, setEditingText] = useState('');
    const [newNoteText, setNewNoteText] = useState('');

    const handleAddNote = () => {
        if (newNoteText.trim() && !readOnly) {
            const newNote = {
                id: Date.now(),
                text: newNoteText.trim(),
                createdDate: new Date().toISOString()
            };
            onChange([...value, newNote]);
            setNewNoteText('');
        }
    };

    const handleDeleteNote = (index) => {
        if (!readOnly) {
            const newNotes = value.filter((_, i) => i !== index);
            onChange(newNotes);
        }
    };

    const handleEditStart = (index) => {
        if (!readOnly) {
            setEditingIndex(index);
            setEditingText(value[index].text);
        }
    };

    const handleEditSave = () => {
        if (editingText.trim()) {
            const newNotes = [...value];
            newNotes[editingIndex] = {
                ...newNotes[editingIndex],
                text: editingText.trim(),
                editedDate: new Date().toISOString()
            };
            onChange(newNotes);
        }
        setEditingIndex(null);
        setEditingText('');
    };

    const handleEditCancel = () => {
        setEditingIndex(null);
        setEditingText('');
    };

    const handleKeyPress = (event, action) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            if (action === 'add') {
                handleAddNote();
            } else if (action === 'save') {
                handleEditSave();
            }
        } else if (event.key === 'Escape' && action === 'save') {
            handleEditCancel();
        }
    };

    return (
        <div className={`space-y-2 ${className}`}>
            {/* Add new note */}
            {!readOnly && (
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        onKeyDown={(e) => handleKeyPress(e, 'add')}
                        placeholder={placeholder}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                        type="button"
                        onClick={handleAddNote}
                        disabled={!newNoteText.trim()}
                        className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                        <Plus className="w-4 h-4" />
                        Add
                    </button>
                </div>
            )}

            {/* Notes list */}
            {value.length > 0 && (
                <div className="space-y-2">
                    {value.map((note, index) => (
                        <div
                            key={note.id || index}
                            className="p-3 bg-gray-50 border border-gray-200 rounded-md"
                        >
                            {editingIndex === index ? (
                                <div className="space-y-2">
                                    <textarea
                                        value={editingText}
                                        onChange={(e) => setEditingText(e.target.value)}
                                        onKeyDown={(e) => handleKeyPress(e, 'save')}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                        rows={3}
                                        autoFocus
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={handleEditSave}
                                            disabled={!editingText.trim()}
                                            className="px-2 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1"
                                        >
                                            <Check className="w-3 h-3" />
                                            Save
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleEditCancel}
                                            className="px-2 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 flex items-center gap-1"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="text-gray-800 whitespace-pre-wrap">
                                        {note.text}
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="text-xs text-gray-500">
                                            {note.createdDate && new Date(note.createdDate).toLocaleString()}
                                            {note.editedDate && (
                                                <span className="ml-2">(edited: {new Date(note.editedDate).toLocaleString()})</span>
                                            )}
                                        </div>
                                        {!readOnly && (
                                            <div className="flex gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEditStart(index)}
                                                    className="p-1 text-gray-400 hover:text-blue-500 rounded"
                                                    title="Edit note"
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteNote(index)}
                                                    className="p-1 text-gray-400 hover:text-red-500 rounded"
                                                    title="Delete note"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {value.length === 0 && readOnly && (
                <div className="text-gray-500 text-sm italic py-2">
                    No notes available
                </div>
            )}
        </div>
    );
}