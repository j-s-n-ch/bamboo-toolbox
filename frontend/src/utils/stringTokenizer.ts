/**
 * Utility functions for parsing game strings with embedded tokens.
 *
 * Functions:
 * - `parseGameString(str)`: Parses a string containing text, variables (e.g., `{count}`), self-closing tags (e.g., `<skill skill="woodcutting"/>`), and paired tags (e.g., `<hl>...</hl>`), returning an array of token objects with their type and associated data.
 * - `getDataIdMapping(data)`: Generates a mapping of variable names to their corresponding values based on the provided data structure, specifically handling "teleport" and "completeActions" types.
 */

const TOKEN_REGEX = /{(\w+)}|<(\w+)([^/>]*)\/>|<(\w+)>(.*?)<\/\4>/gs;

export type TextToken = { type: "text"; value: string };
export type VariableToken = { type: "variable"; name: string };
export type TagToken = { type: string; [key: string]: string };

export type GameStringToken = TextToken | VariableToken | TagToken;

interface TeleportAction {
  type: "teleport";
  location: string;
}

interface CompleteActionsAction {
  type: "completeActions";
  count: number;
}

type Action = TeleportAction | CompleteActionsAction | { type: string };

interface ActionGroup {
  actions: Action[];
}

export function parseGameString(str: string): GameStringToken[] {
  const tokens: GameStringToken[] = [];
  let lastIndex = 0;

  for (const match of str.matchAll(TOKEN_REGEX)) {
    if (match.index! > lastIndex) {
      tokens.push({
        type: "text",
        value: str.slice(lastIndex, match.index),
      });
    }

    // {count}
    if (match[1]) {
      tokens.push({ type: "variable", name: match[1] });
    }

    // <skill skill="woodcutting"/>
    else if (match[2]) {
      const attrs = Object.fromEntries(
        [...match[3].matchAll(/(\w+)="(.*?)"/g)].map((m) => [m[1], m[2]])
      );
      tokens.push({ type: match[2], ...attrs });
    }

    // <hl>...</hl>
    else if (match[4]) {
      tokens.push({
        type: match[4],
        value: match[5],
      });
    }

    lastIndex = match.index! + match[0].length;
  }

  if (lastIndex < str.length) {
    tokens.push({
      type: "text",
      value: str.slice(lastIndex),
    });
  }

  return tokens;
}

export const getDataIdMapping = (
  data: ActionGroup[]
): Record<string, string | number | false> => {
  const mapAction = (action: Action): [string, string | number | false] => {
    const { type } = action;
    if (type === "teleport") {
      return [(action as TeleportAction).location, (action as TeleportAction).location];
    }
    if (type === "completeActions") {
      return ["count", (action as CompleteActionsAction).count];
    }
    return ["", false];
  };

  const mappedData = data.flatMap(({ actions }) =>
    actions.map((action) => mapAction(action))
  );
  return Object.fromEntries(mappedData);
};
