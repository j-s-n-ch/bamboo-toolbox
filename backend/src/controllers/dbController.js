import * as dbService from "../services/dbService.js";

export const getUserInfo = async (req, res) => {
  const userUuid = req.headers["x-user-uuid"];
  if (!userUuid) return res.status(400).json({ error: "Missing userUuid" });
  const stats = await dbService.getUserStats(userUuid);
  res.json(stats || {});
};

export const upsertUserInfo = async (req, res) => {
  const userUuid = req.headers["x-user-uuid"];
  if (!userUuid) return res.status(400).json({ error: "Missing userUuid" });
  try {
    await dbService.upsertUserStats(userUuid, req.body);
    res.sendStatus(200);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

export const getUserOwnedItems = async (req, res) => {
  const userUuid = req.headers["x-user-uuid"];
  if (!userUuid) return res.status(400).json({ error: "Missing userUuid" });
  const items = await dbService.getUserOwnedItems(userUuid);
  res.json(items || {});
};

export const upsertUserOwnedItems = async (req, res) => {
  const userUuid = req.headers["x-user-uuid"];
  if (!userUuid) return res.status(400).json({ error: "Missing userUuid" });

  try {
    await dbService.upsertUserOwnedItems(userUuid, req.body.items);
    res.sendStatus(200);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

export const getUserFactionReputations = async (req, res) => {
  const userUuid = req.headers["x-user-uuid"];
  if (!userUuid) return res.status(400).json({ error: "Missing userUuid" });
  const reputations = await dbService.getUserFactionReputations(userUuid);
  res.json(reputations || {});
};

export const upsertUserFactionReputations = async (req, res) => {
  const userUuid = req.headers["x-user-uuid"];
  if (!userUuid) return res.status(400).json({ error: "Missing userUuid" });

  try {
    await dbService.upsertUserFactionReputations(
      userUuid,
      req.body.reputations
    );
    res.sendStatus(200);
  } catch (e) {
    res.sendStatus(500);
  }
};
