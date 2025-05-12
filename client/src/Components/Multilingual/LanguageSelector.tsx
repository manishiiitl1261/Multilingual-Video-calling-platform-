import { useState, useEffect } from "react";
import ISO6391 from "iso-639-1";

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  className?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onLanguageChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [languages, setLanguages] = useState<{ code: string; name: string }[]>(
    []
  );
  const [searchTerm, setSearchTerm] = useState("");

  // Common languages to prioritize
  const commonLanguageCodes = [
    "en",
    "es",
    "fr",
    "de",
    "zh",
    "ja",
    "ru",
    "ar",
    "hi",
    "pt",
  ];

  useEffect(() => {
    // Get all languages
    const allLanguages = ISO6391.getLanguages(ISO6391.getAllCodes()).map(
      (lang) => ({
        code: lang.code,
        name: lang.name,
      })
    );

    // Sort languages with common ones first, then alphabetically
    const sortedLanguages = allLanguages.sort((a, b) => {
      const aIsCommon = commonLanguageCodes.includes(a.code);
      const bIsCommon = commonLanguageCodes.includes(b.code);

      if (aIsCommon && !bIsCommon) return -1;
      if (!aIsCommon && bIsCommon) return 1;

      return a.name.localeCompare(b.name);
    });

    setLanguages(sortedLanguages);
  }, []);

  const filteredLanguages = languages.filter(
    (lang) =>
      lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lang.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (code: string) => {
    onLanguageChange(code);
    setIsOpen(false);
  };

  const selectedLanguageName = ISO6391.getName(selectedLanguage) || "Unknown";

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate flex-1 text-left">
          {selectedLanguageName} ({selectedLanguage.toUpperCase()})
        </span>
        <svg
          className="h-5 w-5 text-gray-400"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
        >
          <path
            d="M7 7l3 3 3-3"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto divide-y divide-gray-100 ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="p-2">
            <input
              type="text"
              className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Search languages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <ul className="py-1 max-h-48 overflow-auto" role="listbox">
            {filteredLanguages.map((language) => (
              <li
                key={language.code}
                className={`cursor-pointer select-none relative py-2 pl-3 pr-9 text-sm ${
                  selectedLanguage === language.code
                    ? "bg-blue-100 text-blue-900"
                    : "text-gray-900 hover:bg-gray-100"
                }`}
                role="option"
                aria-selected={selectedLanguage === language.code}
                onClick={() => handleSelect(language.code)}
              >
                <div className="flex items-center">
                  <span className="font-medium">{language.name}</span>
                  <span className="ml-2 text-gray-500">
                    ({language.code.toUpperCase()})
                  </span>
                </div>
                {selectedLanguage === language.code && (
                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
              </li>
            ))}
            {filteredLanguages.length === 0 && (
              <li className="py-2 px-3 text-sm text-gray-500 italic">
                No languages found
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
