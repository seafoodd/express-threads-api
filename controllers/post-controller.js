const { prisma } = require("../prisma/prisma-client");

const PostController = {
  async createPost(req, res) {
    const { content } = req.body;

    const authorId = req.user.userId;

    if (!content) {
      return res.status(400).json({ error: "Все поля обязательны!" });
    }

    try {
      const post = await prisma.post.create({
        data: {
          content,
          authorId,
        },
      });

      res.json(post);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },
  async getAllPosts(req, res) {
    const userId = req.user.userId;

    try {
      const posts = await prisma.post.findMany({
        include: {
          likes: true,
          author: true,
          comments: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const postsWithLikeInfo = posts.map((post) => ({
        ...post,
        likedByUser: post.likes.some((like) => like.userId === userId),
      }));

      res.json(postsWithLikeInfo);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },
  async getPostById(req, res) {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
      const post = await prisma.post.findUnique({
        where: { id },
        include: {
          comments: {
            include: {
              author: true,
            },
          },
          likes: true,
          author: true,
        },
      });

      if (!post) {
        return res.status(404).json({ error: "Пост не найден" });
      }

      const postWithLikeInfo = {
        ...post,
        likedByUser: post.likes.some((like) => like.userId === userId),
      };

      res.json(postWithLikeInfo);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },
  async deletePost(req, res) {
    const { id } = req.params;
    const userId = req.user.userId;

    const post = await prisma.post.findUnique({ where: { id } });

    if (!post) {
      return res.status(404).json({ error: "Пост не найден" });
    }

    if (post.authorId !== userId) {
      return res.status(403).json({ error: "Нет доступа" });
    }

    try {
      const transaction = await prisma.$transaction([
        prisma.comment.deleteMany({ where: { postId: id } }),
        prisma.like.deleteMany({ where: { postId: id } }),
        prisma.post.delete({ where: { id } }),
      ]);

      res.json(transaction);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },
};

module.exports = PostController;
