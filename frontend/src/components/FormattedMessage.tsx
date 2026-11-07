'use client';

import React from 'react';

interface FormattedMessageProps {
  content: string;
}

export const FormattedMessage: React.FC<FormattedMessageProps> = ({ content }) => {
  if (!content) return null;

  // Regex to split on *action* descriptions and (internal thoughts)
  const parts = content.split(/(\*[\s\S]*?\*|\(.*?\))/g);

  return (
    <span className="leading-relaxed">
      {parts.map((part, index) => {
        // 1. Actions / Scenery in *asterisks* (Italics + Soft muted slate)
        if (part.startsWith('*') && part.endsWith('*')) {
          return (
            <span key={index} className="text-slate-400 italic font-normal">
              {part}
            </span>
          );
        }
        
        // 2. Thoughts in (parentheses) (Italics + Subtle mint tint)
        if (part.startsWith('(') && part.endsWith(')')) {
          return (
            <span key={index} className="text-[#7be4d5]/80 italic font-normal">
              {part}
            </span>
          );
        }

        // 3. Spoken Dialogue (Clean crisp white)
        return (
          <span key={index} className="text-white">
            {part}
          </span>
        );
      })}
    </span>
  );
};