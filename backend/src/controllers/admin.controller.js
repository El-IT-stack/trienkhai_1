const StatsModel = require('../models/stats.model');
const UserModel = require('../models/user.model');

const AdminController = {
  async getDashboardStats(req, res, next) {
    try {
      const overview = await StatsModel.getOverview();
      res.json({
        success: true,
        data: overview
      });
    } catch (err) {
      next(err);
    }
  },

  async getRevenueReport(req, res, next) {
    try {
      const movieRevenue = await StatsModel.getRevenueByMovies();
      const eventRevenue = await StatsModel.getRevenueByEvents();

      res.json({
        success: true,
        data: {
          movies: movieRevenue,
          events: eventRevenue
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async getUsers(req, res, next) {
    try {
      const users = await UserModel.getAll();
      res.json({
        success: true,
        count: users.length,
        data: users
      });
    } catch (err) {
      next(err);
    }
  },

  async updateUserRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role_id } = req.body;

      if (!role_id) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng chọn vai trò mới.'
        });
      }

      await UserModel.updateRole(id, role_id);
      await UserModel.logAudit(
        req.user.id,
        'UPDATE_USER_ROLE',
        'users',
        `Thay đổi vai trò của User ID ${id} sang Role ID ${role_id}`,
        req.ip
      );

      res.json({
        success: true,
        message: 'Cập nhật vai trò người dùng thành công!'
      });
    } catch (err) {
      next(err);
    }
  },

  async updateUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['active', 'inactive', 'banned'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Trạng thái người dùng không hợp lệ.'
        });
      }

      await UserModel.updateStatus(id, status);
      await UserModel.logAudit(
        req.user.id,
        'UPDATE_USER_STATUS',
        'users',
        `Cập nhật trạng thái của User ID ${id} sang '${status}'`,
        req.ip
      );

      res.json({
        success: true,
        message: 'Cập nhật trạng thái người dùng thành công!'
      });
    } catch (err) {
      next(err);
    }
  },

  async getAuditLogs(req, res, next) {
    try {
      const logs = await StatsModel.getAuditLogs(100);
      res.json({
        success: true,
        count: logs.length,
        data: logs
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = AdminController;
