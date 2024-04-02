const { prisma } = require("../prisma/prisma-client");

const LikeController = {
  async likePost(req, res) {
    const { postId } = req.body;
    const userId = req.user.userId;

    if (!postId) {
      return res.status(400).json({ error: "Все поля обязательны!" });
    }

    try {
      const existingLike = await prisma.like.findFirst({
        where: {
          postId,
          userId,
        },
      });

      if (existingLike) {
        return res.status(400).json({ error: "Вы уже поставили лайк" });
      }

      const like = await prisma.like.create({
        data: {
          postId,
          userId,
        },
      });

      res.json(like);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },
  async unlikePost(req, res) {
    const { id } = req.params;
    const userId = req.user.userId;

    if (!id) {
      return res.status(400).json({ error: "Вы ещё не ставили лайк" });
    }

    try {
      const existingLike = await prisma.like.findFirst({
        where: {
          postId: id,
          userId,
        },
      });

      if (!existingLike) {
        return res.status(400).json({ error: "Вы ещё не ставили лайк" });
      }

      const like = await prisma.like.deleteMany({ where: { postId: id, userId } });
      res.json(like);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },
};

module.exports = LikeController;
