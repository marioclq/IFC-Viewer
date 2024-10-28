interface ModelListProps {
    models: Array<{
      id: string;
      name: string;
    }>;
    onDelete?: (id: string) => void;
  }
  
  export function ModelList({ models, onDelete }: ModelListProps) {
    if (models.length === 0) return null;
  
    return (
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Modelos cargados
        </h3>
        <div className="space-y-2">
          {models.map((model) => (
            <div
              key={model.id}
              className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200"
            >
              <div className="flex items-center space-x-3">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                  />
                </svg>
                <span className="text-sm text-gray-600">
                  {model.name}
                </span>
              </div>
              {onDelete && (
                <button
                  onClick={() => onDelete(model.id)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  title="Eliminar modelo"
                >
                  <svg
                    className="w-5 h-5 text-gray-400 hover:text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }