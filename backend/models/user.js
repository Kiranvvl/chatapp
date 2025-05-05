const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: { type: DataTypes.STRING, allowNull: false },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    }, // Ensure unique emails
    googleId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password: { type: DataTypes.STRING, allowNull: true }, // Allow null for Google users
    profilePicture: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
    verificationToken: { type: DataTypes.STRING, allowNull: true },
    verificationTokenExpiry: { type: DataTypes.DATE, allowNull: true },
    forgotPasswordToken: { type: DataTypes.STRING, allowNull: true },
    forgotPasswordExpires: { type: DataTypes.DATE, allowNull: true },
    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resetPasswordExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'Users',
    timestamps: true,
  }
);

module.exports = User;
