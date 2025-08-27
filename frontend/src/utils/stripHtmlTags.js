export const stripHtmlTags = (text) => {
  if (!text) return "";
  return text.replace(/<[^>]*>/g, "");
};
