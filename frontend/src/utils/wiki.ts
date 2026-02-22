/**
 * Utility functions for generating URLs to the Walkscape Wiki.
 *
 * Functions:
 * - `getWikiUrl(name)`: Takes a string input representing the name of a
 *   wiki page and returns a URL to that page on the Walkscape Wiki.
 *   The function replaces spaces in the name with underscores to conform to
 *   typical wiki URL formatting.
 */

const baseUrl = "https://wiki.walkscape.app/wiki/";

export const getWikiUrl = (name: string): string => {
  return `${baseUrl}${name.replaceAll(" ", "_")}`;
};
