const express = require('express')

const router = express.Router()
const passport = require('../config/passport')

//* 載入middleware
const { authenticated, authenticatedAdmin } = require('../middleware/auth')
//* 載入子路由
const admin = require('./modules/admin')
const users = require('./modules/users')

//* 載入controller
const restController = require('../controllers/restaurant-controller')
const userController = require('../controllers/user-controller')
const commentController = require('../controllers/​​comment-controller')
const { generalErrorHandler } = require('../middleware/error-handler')
//* 後台
router.use('/admin', authenticatedAdmin, admin)
//* 使用者
router.use('/users', authenticated, users)

//* 使用者
router.get('/signup', userController.signUpPage)
router.post('/signup', userController.signUp)
router.get('/signin', userController.signInPage)
router.post(
  '/signin',
  passport.authenticate('local', {
    failureRedirect: '/signin',
    failureFlash: true
  }),
  userController.signIn
)
router.get('/logout', userController.logout)
//* 最新動態
router.get('/restaurants/feeds', authenticated, restController.getFeeds)
//* 瀏覽TOP餐廳
router.get('/restaurants/top', authenticated, restController.getTopRestaurants)
//* 瀏覽全部餐廳
router.get('/restaurants', authenticated, restController.getRestaurants)
//* 瀏覽單一餐廳
router.get('/restaurants/:id', authenticated, restController.getRestaurant)
//* 瀏覽單一餐廳數據
router.get(
  '/restaurants/:id/dashboard',
  authenticated,
  restController.getDashboard
)

//* 新增餐廳評論
router.post('/comments', authenticated, commentController.postComment)
//* 刪除餐廳評論
router.delete(
  '/comments/:id',
  authenticatedAdmin,
  commentController.deleteComment
)
//* 管理喜愛餐廳
router.post(
  '/favorite/:restaurantId',
  authenticated,
  userController.addFavorite
)
router.delete(
  '/favorite/:restaurantId',
  authenticated,
  userController.removeFavorite
)
//* Like/Unlike
router.post('/like/:restaurantId', authenticated, userController.addLike)
router.delete('/like/:restaurantId', authenticated, userController.removeLike)

//* 管理Like
router.post('/like/:restaurantId', authenticated, userController.addLike)
router.delete('/like/:restaurantId', authenticated, userController.removeLike)

//* 追蹤功能
router.post('/following/:userId', authenticated, userController.addFollowing)
router.delete(
  '/following/:userId',
  authenticated,
  userController.removeFollowing
)

router.use('/', (req, res) => res.redirect('/restaurants'))
router.use('/', generalErrorHandler)

module.exports = router
