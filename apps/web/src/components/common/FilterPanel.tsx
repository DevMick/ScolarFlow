import React from 'react';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { clsx } from 'clsx';
import { Fragment } from 'react';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterGroup {
  key: string;
  label: string;
  options: FilterOption[];
  value?: string;
  placeholder?: string;
}

interface FilterPanelProps {
  filters: Record<string, any>;
  onChange: (filters: Record<string, any>) => void;
  filterGroups: FilterGroup[];
  className?: string;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onChange,
  filterGroups,
  className,
}) => {
  const handleFilterChange = (key: string, value: string | undefined) => {
    const newFilters = { ...filters };
    
    if (value === undefined || value === '') {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    
    onChange(newFilters);
  };

  const clearAllFilters = () => {
    onChange({});
  };

  const getActiveFiltersCount = () => {
    return Object.keys(filters).length;
  };

  const getFilterDisplay = (group: FilterGroup) => {
    const currentValue = filters[group.key];
    if (!currentValue) return group.placeholder || `Filtrer par ${group.label.toLowerCase()}`;
    
    const option = group.options.find(opt => opt.value === currentValue);
    return option?.label || currentValue;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className={clsx('flex items-center gap-3', className)}>
      {/* Filtres dropdown */}
      {filterGroups.map((group) => (
        <Menu as="div" key={group.key} className="relative">
          <Menu.Button className={clsx(
            'inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors',
            filters[group.key]
              ? 'bg-primary-50 border-primary-200 text-primary-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          )}>
            <span className="truncate max-w-32">
              {getFilterDisplay(group)}
            </span>
            <ChevronDownIcon className="h-4 w-4 flex-shrink-0" />
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute left-0 z-10 mt-2 w-48 origin-top-left rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                {/* Option "Tous" pour réinitialiser le filtre */}
                <Menu.Item>
                  {({ active }) => (
                    <button
                      type="button"
                      onClick={() => handleFilterChange(group.key, undefined)}
                      className={clsx(
                        'w-full text-left px-4 py-2 text-sm transition-colors',
                        active ? 'bg-gray-100' : '',
                        !filters[group.key] ? 'text-primary-600 font-medium' : 'text-gray-700'
                      )}
                    >
                      Tous
                    </button>
                  )}
                </Menu.Item>

                {/* Separator */}
                <div className="h-px bg-gray-200 my-1" />

                {/* Options du filtre */}
                {group.options.map((option) => (
                  <Menu.Item key={option.value}>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={() => handleFilterChange(group.key, option.value)}
                        className={clsx(
                          'w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between',
                          active ? 'bg-gray-100' : '',
                          filters[group.key] === option.value
                            ? 'text-primary-600 font-medium'
                            : 'text-gray-700'
                        )}
                      >
                        <span>{option.label}</span>
                        {option.count !== undefined && (
                          <span className={clsx(
                            'text-xs px-2 py-0.5 rounded-full',
                            filters[group.key] === option.value
                              ? 'bg-primary-100 text-primary-600'
                              : 'bg-gray-100 text-gray-500'
                          )}>
                            {option.count}
                          </span>
                        )}
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      ))}

      {/* Bouton pour effacer tous les filtres */}
      {activeFiltersCount > 0 && (
        <button
          type="button"
          onClick={clearAllFilters}
          className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          <XMarkIcon className="h-4 w-4" />
          Effacer ({activeFiltersCount})
        </button>
      )}

      {/* Indicateur de filtres actifs */}
      {activeFiltersCount > 0 && (
        <div className="text-xs text-gray-500">
          {activeFiltersCount} filtre{activeFiltersCount > 1 ? 's' : ''} actif{activeFiltersCount > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};
