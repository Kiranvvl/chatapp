const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./user');

const Message = sequelize.define(
  'Message',
  {
    senderId: { type: DataTypes.INTEGER, allowNull: false },
    receiverId: { type: DataTypes.INTEGER, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: true },
    imageUrl: { type: DataTypes.STRING, allowNull: true },
    imagePublicId: { type: DataTypes.STRING, allowNull: true },
  },
  {
    tableName: 'Messages',
    timestamps: true, // Adds `createdAt` and `updatedAt` fields
  }
);

// Define associations properly in the User model, not here
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
User.hasMany(Message, { foreignKey: 'receiverId', as: 'receivedMessages' });

Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Message.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });

module.exports = Message;
