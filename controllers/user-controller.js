const { prisma } = require("../prisma/prisma-client");
const bcrypt = require("bcryptjs");
const jdenticon = require("jdenticon");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");

const UserController = {
  register: async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Все поля обязательны!" });
    }
    try {
      const existingUser = await prisma.user.findUnique({ where: { email } });

      if (existingUser) {
        return res
          .status(400)
          .json({ error: "Пользователь с таким email уже существует" });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const png = jdenticon.toPng(`${name}_${Date.now()}`, 200);
      const avatarName = `${name}_${Date.now()}.png`;
      const avatarPath = path.join(__dirname, "..", "uploads", avatarName);
      fs.writeFileSync(avatarPath, png);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          avatarUrl: `/uploads/${avatarName}`,
        },
      });

      res.json(user);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },
  async login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Все поля обязательны!" });
    }

    try {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        return res.status(400).json({ error: "Неверный логин или пароль" });
      }

      const valid = await bcrypt.compare(password, user.password);

      if (!valid) {
        return res.status(400).json({ error: "Неверный логин или пароль" });
      }

      const token = jwt.sign({ userId: user.id }, process.env.SECRET_KEY);

      res.json({ token });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  async getUserById(req, res) {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          followers: true,
          following: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: "Пользователь не найден" });
      }

      const isFollowing = await prisma.follows.findFirst({
        where: {
          followerId: userId,
          followingId: id,
        },
      });

      res.json({ ...user, isFollowing: Boolean(isFollowing) });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  async updateUser(req, res) {
    const { id } = req.params;
    const { email, name, dateOfBirth, bio, location } = req.body;

    let filePath;

    if (req.file && req.file.path) {
      filePath = req.file.path;
    }

    if (id !== req.user.userId) {
      return res.status(403).json({ error: "Нет доступа" });
    }

    try {
      if (email) {
        const existingUser = await prisma.user.findUnique({ where: { email } });

        if (existingUser && existingUser.id !== id) {
          return res.status(400).json({ error: "Почта уже используется" });
        }
      }

      const user = await prisma.user.update({
        where: { id },
        data: {
          email,
          name,
          bio,
          avatarUrl: filePath ? `/${filePath}` : undefined,
          dateOfBirth,
          location,
        },
      });

      res.json(user);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  async current(req, res) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: {
          followers: {
            include: {
              follower: true,
            },
          },
          following: {
            include: {
              following: true,
            },
          },
        },
      });

      if (!user) {
        return res.status(404).json({ error: "Не удалось найти пользователя" });
      }

      res.json(user);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Internal server error" });
    }
  },
};
module.exports = UserController;
