import React from 'react';
import {
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { Class } from '../../services/classService';

interface ClassCardProps {
  classItem: Class;
  onEditClass: (classItem: Class) => void;
  onDeleteClass: (id: number) => void;
}

export function ClassCard({ classItem, onEditClass, onDeleteClass }: ClassCardProps) {
  const handleDelete = () => {
    onDeleteClass(classItem.id);
  };

  const handleEdit = () => {
    onEditClass(classItem);
  };

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <AcademicCapIcon className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{classItem.name}</h3>
          </div>
        </div>
        
      </div>

      {/* Boutons d'action */}
      <div className="flex justify-end items-center pt-2">
        <div className="flex space-x-2">
          <button
            onClick={handleEdit}
            className="px-3 py-1 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
          >
            Modifier
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-1 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
