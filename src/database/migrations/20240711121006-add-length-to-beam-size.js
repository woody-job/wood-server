'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    await queryInterface.addColumn('beam_size', 'length', {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true,
    });

    await queryInterface.changeColumn('beam_size', 'diameter', {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false,
      unique: false,
    });

    await queryInterface.removeConstraint(
      'beam_size',
      'beam_size_diameter_key',
    );

    await queryInterface.removeConstraint('beam_size', 'beam_size_volume_key');
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
