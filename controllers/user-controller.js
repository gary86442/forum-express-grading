const bcrypt = require('bcryptjs') //載入 bcrypt
const db = require('../models')
const { User, Comment, Restaurant, Favorite, Like } = db
const { imgurFileHandler } = require('../helpers/file-helpers')

const userController = {
  //* 使用者註冊
  signUpPage: (req, res) => {
    res.render('signup')
  },
  signUp: (req, res, next) => {
    //修改這裡
    // 如果兩次輸入的密碼不同，就建立一個 Error 物件並拋出
    if (req.body.password !== req.body.passwordCheck)
      throw new Error('Passwords do not match!')
    // 確認資料裡面沒有一樣的 email，若有，就建立一個 Error 物件並拋出
    User.findOne({ where: { email: req.body.email } })
      .then(user => {
        if (user) throw new Error('Email already exists!')
        return bcrypt.hash(req.body.password, 10) // 前面加 return
      })
      .then(hash =>
        User.create({
          name: req.body.name,
          email: req.body.email,
          password: hash
        })
      )
      .then(() => {
        req.flash('success_messages', '成功註冊帳號！')
        res.redirect('/signin')
      })
      .catch(err => next(err))
  },
  //* 登入
  signInPage: (req, res) => {
    res.render('signin')
  },
  signIn: (req, res) => {
    req.flash('success_messages', '成功登入！')
    res.redirect('/restaurants')
  },
  //* 登出
  logout: (req, res, next) => {
    req.flash('success_messages', '登出成功！')
    req.logout()
    return res.redirect('/signin')
  },
  //* 瀏覽個人頁面
  getUser: (req, res, next) => {
    const id = req.params.id
    return User.findByPk(id, {
      include: { model: Comment, include: Restaurant }
    })
      .then(user => {
        if (!user) throw new Error('user is not exist')
        res.render('users/profile', { user: user.toJSON() })
      })
      .catch(err => next(err))
  },
  editUser: (req, res, next) => {
    return User.findByPk(req.params.id, { raw: true })
      .then(user => {
        if (!user) throw new Error('user is not exist')
        res.render('users/edit', { user })
      })
      .catch(err => next(err))
  },
  putUser: (req, res, next) => {
    const id = req.params.id
    const { name } = req.body
    const { file } = req
    if (!name) throw new Error('User name is required!')
    return Promise.all([imgurFileHandler(file), User.findByPk(id)])
      .then(([filePath, user]) => {
        if (!user) throw new Error('user is not exist')
        return user
          .update({
            name,
            image: filePath || user.image
          })
          .then(() => {
            req.flash('success_messages', '使用者資料編輯成功')
            res.redirect(`/users/${id}`)
          })
      })
      .catch(err => next(err))
  },
  //* 喜愛餐廳
  addFavorite: (req, res, next) => {
    const { restaurantId } = req.params
    return Promise.all([
      Restaurant.findByPk(restaurantId),
      Favorite.findOne({
        where: {
          userId: req.user.id,
          restaurantId
        }
      })
    ])
      .then(([restaurant, favorite]) => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        if (favorite) throw new Error('You have favorited this restaurant!')

        return Favorite.create({
          userId: req.user.id,
          restaurantId
        })
      })
      .then(() => res.redirect('back'))
      .catch(err => next(err))
  },
  //* 移除喜愛餐廳
  removeFavorite: (req, res, next) => {
    return Favorite.findOne({
      where: {
        userId: req.user.id,
        restaurantId: req.params.restaurantId
      }
    })
      .then(favorite => {
        if (!favorite) throw new Error("You haven't favorited this restaurant")

        return favorite.destroy()
      })
      .then(() => res.redirect('back'))
      .catch(err => next(err))
  },
  //* 管理Like
  addLike: (req, res, next) => {
    const restaurantId = req.params.id
    const userId = req.user.id
    Promise.all([
      Restaurant.findByPk(restaurantId),
      Like.findOne({ where: { restaurantId, userId } })
        .then(([restaurant, like]) => {
          if (!restaurant) throw new Error("Restaurant didn't exist!")
          if (like) throw new Error('You have liked this restaurant!')
          Like.create({ userId, restaurantId })
        })
        .then(() => res.redirect('back'))
        .catch(err => next(err))
    ])
  },
  removeLike: (req, res, next) => {
    const restaurantId = req.params.id
    const userId = req.user.id
    return Like.findOne({
      where: {
        userId,
        restaurantId
      }
    })
      .then(like => {
        if (!like) throw new Error("You haven't like this restaurant")

        return like.destroy()
      })
      .then(() => res.redirect('back'))
      .catch(err => next(err))
  }
}
module.exports = userController
