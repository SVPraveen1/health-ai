export const formatHealthResponse = (text: string) => {
  const sections = text.split('\n\n');
  return sections.map(section => {
    if (section.startsWith('•')) {
      return `${section}`; // Keep bullet points
    }
    if (section.toLowerCase().includes('warning') || section.toLowerCase().includes('caution')) {
      return `> ⚠️ ${section}`; // Format warnings
    }
    if (section.match(/^\d+\./)) {
      return `\n${section}`; // Format numbered lists
    }
    return section;
  }).join('\n\n');
};
