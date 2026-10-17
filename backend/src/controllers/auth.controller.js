const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');
const { logger } = require('../config/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_cineevent_change_in_production_2026!';

const AuthController = {
  async register(req, res, next) {
    try {
      const { full_name, email, password, phone } = req.body;

      if (!full_name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng điền đầy đủ Họ và tên, Email và Mật khẩu.'
        });
      }

      // Check existing email
      const existing = await UserModel.findByEmail(email);
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Email này đã được đăng ký tài khoản trên hệ thống.'
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      const userId = await UserModel.create({
        fullName: full_name,
        email,
        passwordHash,
        phone: phone || '',
        roleId: 4 // Default Customer role
      });

      // Audit log
      await UserModel.logAudit(userId, 'REGISTER', 'auth', `Khách hàng mới đăng ký tài khoản (${email})`, req.ip);

      // Create token
      const token = jwt.sign(
        {
          id: userId,
          role_id: 4,
          role_name: 'customer',
          email,
          full_name
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      logger.info(`Đăng ký tài khoản thành công: ${email} [ID: ${userId}]`);

      res.status(201).json({
        success: true,
        message: 'Đăng ký tài khoản thành công!',
        data: {
          token,
          user: {
            id: userId,
            full_name,
            email,
            phone,
            role_name: 'customer'
          }
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập Email và Mật khẩu.'
        });
      }

      const user = await UserModel.findByEmail(email);
      if (!user) {
        logger.warn(`Đăng nhập thất bại: Không tìm thấy email '${email}'`);
        return res.status(401).json({
          success: false,
          message: 'Email hoặc mật khẩu không chính xác.'
        });
      }

      if (user.status !== 'active') {
        logger.warn(`Tài khoản bị khóa đăng nhập: ${email} (status: ${user.status})`);
        return res.status(403).json({
          success: false,
          message: 'Tài khoản của bạn đang bị tạm khóa hoặc ngừng hoạt động. Vui lòng liên hệ quản trị viên.'
        });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        logger.warn(`Đăng nhập thất bại: Sai mật khẩu cho email '${email}'`);
        return res.status(401).json({
          success: false,
          message: 'Email hoặc mật khẩu không chính xác.'
        });
      }

      // Generate JWT
      const token = jwt.sign(
        {
          id: user.id,
          role_id: user.role_id,
          role_name: user.role_name,
          email: user.email,
          full_name: user.full_name
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Audit log
      await UserModel.logAudit(user.id, 'LOGIN', 'auth', `Người dùng đăng nhập thành công (${user.email} - Vai trò: ${user.role_name})`, req.ip);

      logger.info(`Đăng nhập thành công: ${user.email} [Vai trò: ${user.role_name}]`);

      res.json({
        success: true,
        message: 'Đăng nhập thành công!',
        data: {
          token,
          user: {
            id: user.id,
            role_id: user.role_id,
            role_name: user.role_name,
            full_name: user.full_name,
            email: user.email,
            phone: user.phone,
            avatar_url: user.avatar_url
          }
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async getMe(req, res, next) {
    try {
      const user = await UserModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin tài khoản.'
        });
      }
      res.json({
        success: true,
        data: user
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = AuthController;
