const MovieModel = require('../models/movie.model');
const ShowtimeModel = require('../models/showtime.model');
const UserModel = require('../models/user.model');

const MovieController = {
  async getMovies(req, res, next) {
    try {
      const { status, genre_id, search } = req.query;
      const movies = await MovieModel.getAll({ status, genreId: genre_id, search });
      res.json({
        success: true,
        count: movies.length,
        data: movies
      });
    } catch (err) {
      next(err);
    }
  },

  async getMovieDetail(req, res, next) {
    try {
      const { idOrSlug } = req.params;
      let movie;
      if (!isNaN(idOrSlug)) {
        movie = await MovieModel.getById(idOrSlug);
      } else {
        movie = await MovieModel.getBySlug(idOrSlug);
      }

      if (!movie) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy phim yêu cầu.'
        });
      }

      // Fetch showtimes for this movie
      const showtimes = await ShowtimeModel.getByMovieId(movie.id);
      movie.showtimes = showtimes;

      res.json({
        success: true,
        data: movie
      });
    } catch (err) {
      next(err);
    }
  },

  async getGenres(req, res, next) {
    try {
      const genres = await MovieModel.getAllGenres();
      res.json({
        success: true,
        data: genres
      });
    } catch (err) {
      next(err);
    }
  },

  async createMovie(req, res, next) {
    try {
      const { title, genre_id, duration, release_date, director, cast, poster_url, banner_url, trailer_url, description, age_rating, status } = req.body;
      if (!title || !duration || !release_date) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập tên phim, thời lượng và ngày khởi chiếu.'
        });
      }

      const slug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') + '-' + Date.now().toString(36);

      const movieId = await MovieModel.create({
        title,
        slug,
        genre_id,
        duration,
        release_date,
        director,
        cast,
        poster_url,
        banner_url,
        trailer_url,
        description,
        age_rating,
        status
      });

      await UserModel.logAudit(req.user.id, 'CREATE_MOVIE', 'movies', `Thêm mới phim '${title}' [ID: ${movieId}]`, req.ip);

      res.status(201).json({
        success: true,
        message: 'Thêm mới phim thành công!',
        data: { id: movieId, title, slug }
      });
    } catch (err) {
      next(err);
    }
  },

  async updateMovie(req, res, next) {
    try {
      const { id } = req.params;
      const movie = await MovieModel.getById(id);
      if (!movie) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy phim.' });
      }

      const { title, genre_id, duration, release_date, end_date, director, cast, poster_url, banner_url, trailer_url, description, age_rating, status } = req.body;

      await MovieModel.update(id, {
        title: title || movie.title,
        slug: movie.slug,
        genre_id: genre_id !== undefined ? genre_id : movie.genre_id,
        duration: duration || movie.duration,
        release_date: release_date || movie.release_date,
        end_date: end_date || movie.end_date,
        director: director !== undefined ? director : movie.director,
        cast: cast !== undefined ? cast : movie.cast,
        poster_url: poster_url !== undefined ? poster_url : movie.poster_url,
        banner_url: banner_url !== undefined ? banner_url : movie.banner_url,
        trailer_url: trailer_url !== undefined ? trailer_url : movie.trailer_url,
        description: description !== undefined ? description : movie.description,
        age_rating: age_rating || movie.age_rating,
        status: status || movie.status
      });

      await UserModel.logAudit(req.user.id, 'UPDATE_MOVIE', 'movies', `Cập nhật phim '${movie.title}' [ID: ${id}]`, req.ip);

      res.json({
        success: true,
        message: 'Cập nhật thông tin phim thành công!'
      });
    } catch (err) {
      next(err);
    }
  },

  async deleteMovie(req, res, next) {
    try {
      const { id } = req.params;
      const movie = await MovieModel.getById(id);
      if (!movie) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy phim.' });
      }

      await MovieModel.delete(id);
      await UserModel.logAudit(req.user.id, 'DELETE_MOVIE', 'movies', `Xóa phim '${movie.title}' [ID: ${id}]`, req.ip);

      res.json({
        success: true,
        message: 'Xóa phim thành công!'
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = MovieController;
