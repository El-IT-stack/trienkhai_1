const TicketModel = require('../models/ticket.model');
const UserModel = require('../models/user.model');
const { logger } = require('../config/logger');

const TicketController = {
  async getTicket(req, res, next) {
    try {
      const { code } = req.params;
      const ticket = await TicketModel.getByCode(code);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy vé có mã '${code}'.`
        });
      }

      res.json({
        success: true,
        data: ticket
      });
    } catch (err) {
      next(err);
    }
  },

  async checkIn(req, res, next) {
    try {
      const staffId = req.user.id;
      const { ticket_code, notes } = req.body;

      if (!ticket_code) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp mã vé cần soát.'
        });
      }

      const result = await TicketModel.checkIn({
        ticketCode: ticket_code.trim(),
        staffId,
        notes
      });

      await UserModel.logAudit(
        staffId,
        'CHECKIN_TICKET',
        'tickets',
        `Nhân viên soát vé thành công: Mã vé ${ticket_code}`,
        req.ip
      );

      logger.info(`Soát vé thành công: Mã [${ticket_code}] Nhân viên ID [${staffId}]`);

      res.json(result);
    } catch (err) {
      logger.warn(`Lỗi soát vé [${req.body.ticket_code}]: ${err.message}`);
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  },

  async getRecentCheckins(req, res, next) {
    try {
      const checkins = await TicketModel.getRecentCheckins(30);
      res.json({
        success: true,
        count: checkins.length,
        data: checkins
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = TicketController;
