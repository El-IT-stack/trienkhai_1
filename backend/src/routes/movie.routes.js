const express = require('express');
const router = express.Router();
const MovieController = require('../controllers/movie.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.get('/', MovieController.getMovies);
router.get('/genres', MovieController.getGenres);
router.get('/:idOrSlug', MovieController.getMovieDetail);

// Protected routes (Admin & Manager)
router.post('/', authenticate, authorize(['admin', 'manager']), MovieController.createMovie);
router.put('/:id', authenticate, authorize(['admin', 'manager']), MovieController.updateMovie);
router.delete('/:id', authenticate, authorize(['admin', 'manager']), MovieController.deleteMovie);

module.exports = router;
