const ShowtimeModel = require('../models/showtime.model');
const UserModel = require('../models/user.model');

const ShowtimeController = {
  async getShowtimes(req, res, next) {
    try {
      const { movie_id, date } = req.query;
      if (!movie_id) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp mã phim (movie_id).'
        });
      }
      const showtimes = await ShowtimeModel.getByMovieId(movie_id, date);
      res.json({
        success: true,
        count: showtimes.length,
        data: showtimes
      });
    } catch (err) {
      next(err);
    }
  },

  async getShowtimeDetail(req, res, next) {
    try {
      const { id } = req.params;
      const showtime = await ShowtimeModel.getById(id);
      if (!showtime) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy suất chiếu.'
        });
      }
      res.json({
        success: true,
        data: showtime
      });
    } catch (err) {
      next(err);
    }
  },

  async getSeats(req, res, next) {
    try {
      const { id } = req.params;
      const showtime = await ShowtimeModel.getById(id);
      if (!showtime) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy suất chiếu.'
        });
      }

      const seats = await ShowtimeModel.getSeatsWithStatus(id);

      // Group seats by row for easier front-end rendering
      const seatMatrix = {};
      seats.forEach(seat => {
        if (!seatMatrix[seat.seat_row]) {
          seatMatrix[seat.seat_row] = [];
        }
        seatMatrix[seat.seat_row].push(seat);
      });

      res.json({
        success: true,
        data: {
          showtime,
          total_seats: seats.length,
          available_seats: seats.filter(s => !s.is_booked).length,
          seat_matrix: seatMatrix,
          raw_seats: seats
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async createShowtime(req, res, next) {
    try {
      const { movie_id, room_id, start_time, end_time, price_standard, price_vip } = req.body;
      if (!movie_id || !room_id || !start_time || !end_time) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng điền đầy đủ thông tin suất chiếu.'
        });
      }

      const id = await ShowtimeModel.create({
        movie_id,
        room_id,
        start_time,
        end_time,
        price_standard: price_standard || 90000,
        price_vip: price_vip || 120000
      });

      await UserModel.logAudit(req.user.id, 'CREATE_SHOWTIME', 'showtimes', `Tạo suất chiếu mới [ID: ${id}]`, req.ip);

      res.status(201).json({
        success: true,
        message: 'Tạo suất chiếu thành công!',
        data: { id }
      });
    } catch (err) {
      next(err);
    }
  },

  async deleteShowtime(req, res, next) {
    try {
      const { id } = req.params;
      await ShowtimeModel.delete(id);
      await UserModel.logAudit(req.user.id, 'DELETE_SHOWTIME', 'showtimes', `Xóa suất chiếu [ID: ${id}]`, req.ip);

      res.json({
        success: true,
        message: 'Xóa suất chiếu thành công!'
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = ShowtimeController;
