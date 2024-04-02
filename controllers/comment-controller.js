const { prisma } = require("../prisma/prisma-client");

const CommentController = {
  async createComment(req, res) {
    const { postId, content } = req.body;
    const userId = req.user.userId;

    if (!postId || !content) {
      return res.status(400).send({ error: "Комментарий не найден" });
    }

    try {
      const comment = await prisma.comment.create({
        data: {
          postId,
          authorId: userId,
          content,
        },
      });

      res.json(comment);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },
  async deleteComment(req, res) {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
      const comment = await prisma.comment.delete({ where: { id } });

      if (!comment) {
        return res.status(400).send({ error: "Комментарий не найден" });
      }

      if (comment.authorId !== userId) {
        return res.status(403).send({ error: "Нет доступа" });
      }

      res.json(comment);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },
};

module.exports = CommentController;
