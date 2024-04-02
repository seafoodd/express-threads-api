const { prisma } = require("../prisma/prisma-client");

const FollowController = {
  async followUser(req, res) {
    const { followingId } = req.body;
    const userId = req.user.userId;

    if (!userId || !followingId) {
      return res.status(400).json({ msg: "Все поля обязательны!" });
    }

    if (followingId === userId) {
      return res
        .status(400)
        .json({ error: "Вы не можете подписаться на самого себя" });
    }

    try {
      const existingFollow = await prisma.follows.findFirst({
        where: {
          followerId: userId,
          followingId,
        },
      });

      if (existingFollow) {
        return res.status(400).json({ error: "Вы уже подписаны" });
      }

      await prisma.follows.create({
        data: {
          follower: { connect: { id: userId } },
          following: { connect: { id: followingId } },
        },
      });

      res.status(201).json({ message: "Вы успешно подписались" });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },
  async unfollowUser(req, res) {
    const { followingId } = req.body;
    const userId = req.user.userId;

    try {
      const existingFollow = await prisma.follows.findFirst({
        where: {
          followerId: userId,
          followingId,
        },
      });

      if (!existingFollow) {
        return res
          .status(400)
          .json({ error: "Вы не подписаны на этого пользователя" });
      }

      await prisma.follows.delete({
        where: { id: existingFollow.id },
      });

      res.status(201).json({ message: "Вы успешно отписались" });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },
};

module.exports = FollowController;
