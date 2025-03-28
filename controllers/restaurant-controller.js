const { Restaurant, Category, Comment, User } = require('../models')
const restaurantController = {
  getRestaurants: (req, res, next) => {
    return Restaurant.findAll({
      raw: true,
      include: Category,
      nest: true
    })
      .then(restaurants => {
        const favoritedRestaurantsId =
          req.user && req.user.FavoritedRestaurants.map(fr => fr.id)
        const likedRestaurantsId =
          req.user && req.user.LikedRestaurants.map(l => l.id)

        const data = restaurants.map(r => ({
          ...r,
          description: r.description.substring(0, 50),
          isFavorited: favoritedRestaurantsId.includes(r.id),
          isLiked: likedRestaurantsId.includes(r.id)
        }))

        return res.render('restaurants', { restaurants: data })
      })
      .catch(err => next(err))
  },
  getRestaurant: (req, res, next) => {
    const id = req.params.id
    return Restaurant.findByPk(id, {
      include: [Category, { model: Comment, include: User }]
    })
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        return restaurant.increment('viewCounts')
      })
      .then(restaurant => {
        const favoritedRestaurantsId =
          req.user && req.user.FavoritedRestaurants.map(fr => fr.id)
        const likedRestaurantsId =
          req.user && req.user.LikedRestaurants.map(l => l.id)
        const data = {
          ...restaurant.toJSON(),
          isFavorited: favoritedRestaurantsId.includes(restaurant.id),
          isLiked: likedRestaurantsId.includes(restaurant.id)
        }
        res.render('restaurant', { restaurant: data })
      })
      .catch(err => next(err))
  },
  getDashboard: (req, res, next) => {
    const id = req.params.id
    return Restaurant.findByPk(id, {
      include: Category,
      raw: true,
      nest: true
    })
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        res.render('dashboard', { restaurant })
      })
      .catch(err => next(err))
  },
  //* 最新資訊
  getFeeds: (req, res, next) => {
    return Promise.all([
      Restaurant.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [Category],
        raw: true,
        nest: true
      }),
      Comment.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [User, Restaurant],
        raw: true,
        nest: true
      })
    ])
      .then(([restaurants, comments]) => {
        res.render('feeds', {
          restaurants,
          comments
        })
      })
      .catch(err => next(err))
  },
  getTopRestaurants: (req, res, next) => {
    return Restaurant.findAll({
      include: [{ model: User, as: 'FavoritedUsers' }]
    })
      .then(restaurants => {
        const data = restaurants
          .map(rest => ({
            ...rest.toJSON(),
            favoritedCount: rest.FavoritedUsers.length,
            isFavorited:
              req.user &&
              req.user.FavoritedRestaurants.some(fr => fr.id === rest.id)
          }))
          .filter(rest => rest.favoritedCount > 0)
          .sort((a, b) => b.favoritedCount - a.favoritedCount)
          .slice(0, 10)
        res.render('top-restaurants', { restaurants: data })
      })
      .catch(err => next(err))
  }
}
module.exports = restaurantController
