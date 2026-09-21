'use client';

import React from 'react';

interface FormattedMessageProps {
  content: string;
}

export const FormattedMessage: React.FC<FormattedMessageProps> = ({ content }) => {
  if (!content) return null;

  // Regex to split the text based on *asterisks* and (parentheses)
  // This looks for *...* or (...) while keeping the delimiters
  const parts = content.split(/(\*.*?\*|\(.*?\))/g);

  return (
    <span className="leading-relaxed">
      {parts.map((part, index) => {
        // 1. STYLE ACTIONS (Italics + Slate color)
        if (part.startsWith('*') && part.endsWith('*')) {
          return (
            <span key={index} className="text-slate-400 italic">
              {part}
            </span>
          );
        }
        
        // 2. STYLE THOUGHTS (Italics + Sky Blue color)
        if (part.startsWith('(') && part.endsWith(')')) {
          return (
            <span key={index} className="text-sky-400 italic font-medium opacity-90">
              {part}
            </span>
          );
        }

        // 3. STYLE DIALOGUE (Default White)
        // We can also explicitly style text inside quotes if you want, 
        // but keeping standard text white is cleaner for mixed responses.
        return (
          <span key={index} className="text-white">
            {part}
          </span>
        );
      })}
    </span>
  );
};