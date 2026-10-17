const EventModel = require('../models/event.model');
const UserModel = require('../models/user.model');

const EventController = {
  async getEvents(req, res, next) {
    try {
      const { status, search } = req.query;
      const events = await EventModel.getAll({ status, search });
      res.json({
        success: true,
        count: events.length,
        data: events
      });
    } catch (err) {
      next(err);
    }
  },

  async getEventDetail(req, res, next) {
    try {
      const { idOrSlug } = req.params;
      let event;
      if (!isNaN(idOrSlug)) {
        event = await EventModel.getById(idOrSlug);
      } else {
        event = await EventModel.getBySlug(idOrSlug);
      }

      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy sự kiện yêu cầu.'
        });
      }

      const ticketTypes = await EventModel.getTicketTypes(event.id);
      event.ticket_types = ticketTypes;

      res.json({
        success: true,
        data: event
      });
    } catch (err) {
      next(err);
    }
  },

  async createEvent(req, res, next) {
    try {
      const { title, category, organizer, start_time, end_time, banner_url, description, venue_name, venue_address, status } = req.body;
      if (!title || !organizer || !start_time || !venue_name) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập tên sự kiện, đơn vị tổ chức, thời gian và địa điểm.'
        });
      }

      const slug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') + '-' + Date.now().toString(36);

      const eventId = await EventModel.create({
        title,
        slug,
        category,
        organizer,
        start_time,
        end_time: end_time || start_time,
        banner_url,
        description,
        venue_name,
        venue_address,
        status
      });

      await UserModel.logAudit(req.user.id, 'CREATE_EVENT', 'events', `Thêm mới sự kiện '${title}' [ID: ${eventId}]`, req.ip);

      res.status(201).json({
        success: true,
        message: 'Thêm mới sự kiện thành công!',
        data: { id: eventId, title, slug }
      });
    } catch (err) {
      next(err);
    }
  },

  async deleteEvent(req, res, next) {
    try {
      const { id } = req.params;
      const event = await EventModel.getById(id);
      if (!event) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy sự kiện.' });
      }

      await EventModel.delete(id);
      await UserModel.logAudit(req.user.id, 'DELETE_EVENT', 'events', `Xóa sự kiện '${event.title}' [ID: ${id}]`, req.ip);

      res.json({
        success: true,
        message: 'Xóa sự kiện thành công!'
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = EventController;
